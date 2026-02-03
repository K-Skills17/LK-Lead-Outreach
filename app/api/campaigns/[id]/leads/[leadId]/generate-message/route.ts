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

    // Get lead data with ALL lead gen tool fields
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('campaign_contacts')
      .select(`
        nome, empresa, cargo, site, dor_especifica, phone, niche, location, city, state, country,
        pain_points, opportunities,
        business_quality_score, business_quality_tier, seo_score, page_score,
        rating, reviews, competitor_count,
        personalized_message, enrichment_data
      `)
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

    // Extract enrichment data
    const enrichmentData = (lead.enrichment_data || {}) as any;
    const analysisData = enrichmentData?.analysis || {};

    // Extract pain points
    let painPoints: string[] = [];
    if (lead.pain_points) {
      if (Array.isArray(lead.pain_points)) {
        painPoints = lead.pain_points;
      } else if (typeof lead.pain_points === 'object') {
        painPoints = Object.entries(lead.pain_points)
          .filter(([_, value]) => value === true || value === 'true')
          .map(([key, _]) => key);
      }
    }
    if (painPoints.length === 0 && lead.dor_especifica) {
      painPoints = [lead.dor_especifica];
    }

    // Extract opportunities
    let opportunities: string[] = [];
    if (lead.opportunities && Array.isArray(lead.opportunities)) {
      opportunities = lead.opportunities;
    }

    // Build location string
    const locationParts = [lead.city, lead.state, lead.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : lead.location || '';

    // Build comprehensive lead context
    const businessMetrics = [];
    if (lead.business_quality_score !== undefined) businessMetrics.push(`Qualidade: ${lead.business_quality_score}/100`);
    if (lead.seo_score !== undefined) businessMetrics.push(`SEO: ${lead.seo_score}/100`);
    if (lead.page_score !== undefined) businessMetrics.push(`Página: ${lead.page_score}/100`);
    if (lead.rating !== undefined) businessMetrics.push(`Avaliação: ${lead.rating}/5${lead.reviews ? ` (${lead.reviews} avaliações)` : ''}`);
    if (lead.competitor_count !== undefined) businessMetrics.push(`Concorrentes: ${lead.competitor_count}`);

    const toneMap = {
      friendly: 'amigável e acolhedor',
      professional: 'profissional e respeitoso',
      casual: 'descontraído e informal',
      formal: 'formal e educado',
    };

    const tone = validated.tone || 'friendly';
    
    const leadContext = `
INFORMAÇÕES COMPLETAS DO LEAD:
- Nome: ${lead.nome || 'N/A'}
- Empresa: ${lead.empresa || 'N/A'}
- Cargo: ${lead.cargo || 'N/A'}
- Site: ${lead.site || 'N/A'}
- Localização: ${location || 'N/A'}
- Nicho: ${lead.niche || 'N/A'}

DORES E PROBLEMAS IDENTIFICADOS:
${painPoints.length > 0 ? painPoints.map((p, i) => `${i + 1}. ${p}`).join('\n') : lead.dor_especifica || 'Não identificado'}

OPORTUNIDADES DESCOBERTAS:
${opportunities.length > 0 ? opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n') : 'Não identificado'}

MÉTRICAS E ANÁLISE DO NEGÓCIO:
${businessMetrics.length > 0 ? businessMetrics.join(' | ') : 'Não disponível'}
${lead.personalized_message ? `\nAnálise Completa: ${lead.personalized_message}` : ''}
${analysisData?.business_analysis ? `\nAnálise Adicional: ${analysisData.business_analysis}` : ''}

INSTRUÇÕES CRÍTICAS:
1. Use TODAS essas informações para criar uma mensagem RICA e altamente personalizada
2. LIDE COM A DOR PRINCIPAL ou oportunidade mais relevante no início da mensagem
3. Use dados ESPECÍFICOS descobertos (scores, métricas, concorrentes) para demonstrar pesquisa profunda
4. Se houver cargo, adapte o tom (CEO = estratégico, operacional = prático)
5. Se houver site, mencione que você visitou e analisou
6. Crie URGÊNCIA ou curiosidade para gerar resposta
7. Inclua um CTA forte que solicite engajamento
8. Seja conversacional, humano, não robótico
9. Use emojis apropriados (máximo 3-4)
10. Máximo 180 palavras, mas seja RICO em conteúdo específico
`;

    const systemPrompt = `Você é um High-Ticket B2B Sales Closer especializado em cold outreach via WhatsApp. Sua missão é criar mensagens RICAS, PERSONALIZADAS e ALTAMENTE ENGAGANTES que iniciem conversas.

Diretrizes:
- Tom: ${toneMap[tone]}
- Tamanho: 150-180 palavras (RICO em conteúdo específico)
- Formato: WhatsApp (usar emojis apropriados 💼 🎯 🚀, máximo 3-4)
- Linguagem: Português brasileiro
- Objetivo: INICIAR CONVERSAS e gerar respostas através de cold outreach
- Foco em alto ticket e B2B
- Ser persuasivo mas profissional, não invasivo
- Destacar valor e resultados específicos, não genéricos
- Usar TODOS os dados descobertos (scores, métricas, dores, oportunidades)
- Criar URGÊNCIA ou CURIOSIDADE para gerar resposta
- Incluir CTA forte que solicite engajamento${leadContext}`;

    // Build user prompt
    const userPrompt = validated.prompt || 
      `Crie uma mensagem de WhatsApp RICA e altamente personalizada para este lead usando TODAS as informações fornecidas acima.
      
      A mensagem DEVE:
      - Liderar com a dor principal ou oportunidade mais relevante
      - Usar dados específicos descobertos (scores, métricas, concorrentes)
      - Demonstrar pesquisa profunda sobre o negócio
      - Criar urgência ou curiosidade
      - Incluir um CTA forte que solicite resposta
      - Ser conversacional e humano, não robótico
      - Ser otimizada para INICIAR CONVERSAS e gerar engajamento`;

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
      temperature: 0.85,
      max_tokens: 400, // Increased for richer content
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
