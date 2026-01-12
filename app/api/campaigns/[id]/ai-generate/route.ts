import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { verifyAndGetClinic } from '@/lib/license';
import { verifyCampaignOwnership, getAIUsageToday, incrementAIUsage } from '@/lib/campaigns';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schema
const aiGenerateSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(500),
  tone: z.enum(['friendly', 'professional', 'casual', 'formal']).optional(),
});

/**
 * POST /api/campaigns/[id]/ai-generate
 * 
 * Generate AI message draft using OpenAI GPT-4o-mini
 * (Premium feature - PRO and PREMIUM tiers only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();

    // Validate request body
    const validated = aiGenerateSchema.parse(body);

    // Verify license and get clinic ID
    const licenseResult = await verifyAndGetClinic(validated.licenseKey);

    if (!licenseResult.valid || !licenseResult.clinicId || !licenseResult.tier) {
      return NextResponse.json(
        {
          error: licenseResult.error || 'Invalid license key',
        },
        { status: 401 }
      );
    }

    // Check if tier has access to AI generation
    if (licenseResult.tier === 'FREE') {
      return NextResponse.json(
        {
          error: 'AI generation is only available for PRO and PREMIUM tiers',
          upgradeRequired: true,
        },
        { status: 403 }
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

    // Check daily AI usage limit
    const usage = await getAIUsageToday(
      licenseResult.clinicId,
      licenseResult.tier
    );

    if (usage.count >= usage.limit) {
      return NextResponse.json(
        {
          error: 'Daily AI generation limit reached',
          usageToday: usage.count,
          dailyLimit: usage.limit,
        },
        { status: 429 }
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

    // Build system prompt
    const toneMap = {
      friendly: 'amigável e acolhedor',
      professional: 'profissional e respeitoso',
      casual: 'descontraído e informal',
      formal: 'formal e educado',
    };

    const tone = validated.tone || 'friendly';
    const systemPrompt = `Você é um assistente especializado em criar mensagens de WhatsApp para clínicas odontológicas brasileiras.

Diretrizes:
- Tom: ${toneMap[tone]}
- Tamanho: máximo 150 palavras
- Formato: WhatsApp (usar emojis apropriados 😊 🦷 ✨)
- Incluir placeholder {nome} para personalização
- Incluir call-to-action claro
- Linguagem: Português brasileiro
- Objetivo: reativar pacientes inativos ou promover serviços
- Evitar ser invasivo ou insistente`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: validated.prompt,
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

    // Increment usage counter
    await incrementAIUsage(licenseResult.clinicId);

    return NextResponse.json({
      generatedText: generatedText.trim(),
      usageToday: usage.count + 1,
      dailyLimit: usage.limit,
      remainingToday: usage.limit - usage.count - 1,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle OpenAI errors
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

    // Handle other errors
    console.error('[API] Error generating AI message:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
