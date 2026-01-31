import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { verifyAndGetClinic } from '@/lib/license';
import { verifyCampaignOwnership } from '@/lib/campaigns';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy-load OpenAI client
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (openaiInstance) {
    return openaiInstance;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
}

// Validation schema
const generateMessageSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(500).optional(),
  tone: z.enum(['friendly', 'professional', 'casual', 'formal']).optional(),
});

/**
 * POST /api/campaigns/[id]/leads/[leadId]/generate-message
 * 
 * Generate personalized message for a specific lead using all CSV data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; leadId: string }> }
) {
  try {
    const { id: campaignId, leadId } = await params;
    const body = await request.json();

    // Validate request body
    const validated = generateMessageSchema.parse(body);

    // Verify license and get clinic ID
    const licenseResult = await verifyAndGetClinic(validated.licenseKey);

    if (!licenseResult.valid || !licenseResult.clinicId) {
      return NextResponse.json(
        {
          error: licenseResult.error || 'Invalid license key',
        },
        { status: 401 }
      );
    }

    // Verify campaign ownership
    const isOwner = await verifyCampaignOwnership(
      campaignId,
      licenseResult.clinicId
    );

    if (!isOwner) {
      return NextResponse.json(
        {
          error: 'Campaign not found or access denied',
        },
        { status: 404 }
      );
    }

    // Get lead data with all CSV fields
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('nome, empresa, cargo, site, dor_especifica, phone')
      .eq('id', leadId)
      .eq('campaign_id', campaignId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        {
          error: 'Lead not found',
        },
        { status: 404 }
      );
    }

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[API] OPENAI_API_KEY not configured');
      return NextResponse.json(
        {
          error: 'AI service temporarily unavailable',
        },
        { status: 503 }
      );
    }

    // Build system prompt with lead context
    const toneMap = {
      friendly: 'amigável e acolhedor',
      professional: 'profissional e respeitoso',
      casual: 'descontraído e informal',
      formal: 'formal e educado',
    };

    const tone = validated.tone || 'friendly';
    
    const leadContext = `
INFORMAÇÕES DO LEAD:
- Nome: ${lead.nome || 'N/A'}
- Empresa: ${lead.empresa || 'N/A'}
- Cargo: ${lead.cargo || 'N/A'}
- Site: ${lead.site || 'N/A'}
- Dor Específica: ${lead.dor_especifica || 'N/A'}
- Telefone: ${lead.phone || 'N/A'}

INSTRUÇÕES:
1. Use TODAS essas informações para criar uma mensagem altamente personalizada
2. Se houver dor_especifica, foque nela como o ponto principal da mensagem
3. Se houver cargo, adapte o tom e linguagem para o nível hierárquico (CEO = mais estratégico, operacional = mais prático)
4. Se houver site, mencione que você visitou o site da empresa para mostrar que fez pesquisa
5. Use o nome da empresa e do lead de forma natural na mensagem
6. Substitua os placeholders {nome}, {empresa}, {cargo}, {site}, {dor_especifica} pelos valores reais
`;

    const systemPrompt = `Você é um High-Ticket B2B Sales Closer especializado em cold outreach, Loom audits e follow-ups para empresas.

Diretrizes:
- Tom: ${toneMap[tone]}
- Tamanho: máximo 150 palavras
- Formato: WhatsApp (usar emojis apropriados 💼 🎯 🚀)
- Linguagem: Português brasileiro
- Objetivo: Gerar leads qualificados através de cold outreach, oferecer Loom audits e fazer follow-ups estratégicos
- Foco em alto ticket e B2B
- Ser persuasivo mas profissional, não invasivo
- Destacar valor e resultados, não apenas características
- Personalizar MÁXIMO usando todas as informações disponíveis do lead${leadContext}`;

    // Build user prompt
    const userPrompt = validated.prompt || 
      `Crie uma mensagem de cold outreach personalizada para este lead usando TODAS as informações fornecidas. 
      Foque especialmente na dor específica mencionada e adapte o tom ao cargo do lead.`;

    // Call OpenAI API
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const generatedText = completion.choices[0]?.message?.content || '';

    if (!generatedText) {
      return NextResponse.json(
        {
          error: 'Failed to generate message',
        },
        { status: 500 }
      );
    }

    // Replace placeholders with actual values
    const personalizedMessage = generatedText
      .replace(/{nome}/g, lead.nome || '')
      .replace(/{empresa}/g, lead.empresa || '')
      .replace(/{cargo}/g, lead.cargo || '')
      .replace(/{site}/g, lead.site || '')
      .replace(/{dor_especifica}/g, lead.dor_especifica || '');

    return NextResponse.json({
      message: personalizedMessage.trim(),
      leadInfo: {
        nome: lead.nome,
        empresa: lead.empresa,
        cargo: lead.cargo,
        site: lead.site,
        dor_especifica: lead.dor_especifica,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof OpenAI.APIError) {
      console.error('[API] OpenAI API error:', error);
      return NextResponse.json(
        {
          error: 'AI service error',
          details: error.message,
        },
        { status: 502 }
      );
    }

    console.error('[API] Error generating message:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
