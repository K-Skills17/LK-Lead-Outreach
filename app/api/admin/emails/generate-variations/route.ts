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

    // Get contact details with ALL lead gen tool data
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select(`
        id, nome, empresa, cargo, email, dor_especifica, site, niche, location, city, state, country,
        pain_points, opportunities, 
        business_quality_score, business_quality_tier, seo_score, page_score,
        rating, reviews, competitor_count,
        all_emails, contact_names, whatsapp_phone,
        personalized_message, enrichment_data
      `)
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

    // Extract pain points (can be array or object)
    let painPoints: string[] = [];
    if (contact.pain_points) {
      if (Array.isArray(contact.pain_points)) {
        painPoints = contact.pain_points;
      } else if (typeof contact.pain_points === 'object') {
        painPoints = Object.entries(contact.pain_points)
          .filter(([_, value]) => value === true || value === 'true')
          .map(([key, _]) => key);
      }
    }
    // Fallback to dor_especifica or analysis data
    if (painPoints.length === 0) {
      if (contact.dor_especifica) painPoints = [contact.dor_especifica];
      else if (analysisData?.pain_points && Array.isArray(analysisData.pain_points)) {
        painPoints = analysisData.pain_points;
      }
    }

    // Extract opportunities
    let opportunities: string[] = [];
    if (contact.opportunities) {
      if (Array.isArray(contact.opportunities)) {
        opportunities = contact.opportunities;
      } else if (typeof contact.opportunities === 'object') {
        opportunities = Object.entries(contact.opportunities)
          .filter(([_, value]) => value === true || value === 'true')
          .map(([key, _]) => key);
      }
    }

    // Build location string
    const locationParts = [contact.city, contact.state, contact.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : contact.location || undefined;

    // Generate variations with ALL lead gen tool data
    const result = await generateEmailVariations({
      leadName: contact.nome || undefined,
      leadCompany: contact.empresa,
      leadRole: contact.cargo || undefined,
      leadPainPoint: painPoints.length > 0 ? painPoints[0] : contact.dor_especifica || undefined,
      leadWebsite: contact.site || leadInfo?.website || undefined,
      businessContext: contact.personalized_message || analysisData?.business_analysis || undefined,
      niche: contact.niche || undefined,
      tone: validated.tone || 'professional',
      includeCTA: validated.includeCTA !== false,
      ctaText: validated.ctaText,
      // Lead Gen Tool Data
      painPoints: painPoints.length > 0 ? painPoints : undefined,
      opportunities: opportunities.length > 0 ? opportunities : undefined,
      businessQualityScore: contact.business_quality_score || undefined,
      businessQualityTier: contact.business_quality_tier || undefined,
      seoScore: contact.seo_score || undefined,
      pageScore: contact.page_score || undefined,
      rating: contact.rating || undefined,
      reviews: contact.reviews || undefined,
      competitorCount: contact.competitor_count || undefined,
      businessAnalysis: contact.personalized_message || analysisData?.business_analysis || undefined,
      location: location,
      allEmails: contact.all_emails && Array.isArray(contact.all_emails) ? contact.all_emails : undefined,
      contactNames: contact.contact_names && Array.isArray(contact.contact_names) ? contact.contact_names : undefined,
      enrichmentData: enrichmentData,
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
