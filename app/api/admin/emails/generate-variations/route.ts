import { NextRequest, NextResponse } from 'next/server';
import { generateEmailVariations } from '@/lib/email-ai-service';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const generateVariationsSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  tone: z.enum(['professional', 'friendly', 'direct', 'consultative']).optional(),
  includeCTA: z.boolean().optional(),
  ctaText: z.string().optional(),
});

/**
 * POST /api/admin/emails/generate-variations
 * Generate 3 email variations using AI for A/B testing
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = generateVariationsSchema.parse(body);

    // Get contact details
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, nome, empresa, cargo, email, dor_especifica, site, niche, enrichment_data')
      .eq('id', validated.contactId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Extract enrichment data
    const enrichmentData = (contact.enrichment_data || {}) as any;
    const leadInfo = enrichmentData?.lead || {};
    const analysisData = enrichmentData?.analysis || {};

    // Generate variations
    const result = await generateEmailVariations({
      leadName: contact.nome || undefined,
      leadCompany: contact.empresa,
      leadRole: contact.cargo || undefined,
      leadPainPoint: contact.dor_especifica || analysisData?.pain_points?.[0] || undefined,
      leadWebsite: contact.site || leadInfo?.website || undefined,
      businessContext: analysisData?.business_analysis || undefined,
      niche: contact.niche || undefined,
      tone: validated.tone || 'professional',
      includeCTA: validated.includeCTA !== false,
      ctaText: validated.ctaText,
    });

    if (!result.success || !result.variations) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate variations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      variations: result.variations,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Email Variations] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
