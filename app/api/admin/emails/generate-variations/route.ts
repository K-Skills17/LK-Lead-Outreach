import { NextRequest, NextResponse } from 'next/server';
import { generateEmailVariations } from '@/lib/email-ai-service';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  isLeadGenDatabaseConfigured,
  getCompleteLeadGenData,
} from '@/lib/lead-gen-db-service';
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
 *
 * Enhanced with direct Lead Gen database access for richer data:
 * - Competitor analysis with gap analysis
 * - Marketing technology detection
 * - AI-generated intro/CTA from Lead Gen analysis
 * - Landing page/report assets
 * - Quality scoring and ICP matching
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
        personalized_message, enrichment_data,
        lead_gen_id, ai_email_intro, ai_email_cta, subject_line,
        personalization_score, is_icp,
        pdf_url, drive_url, mockup_url, analysis_image_url
      `)
      .eq('id', validated.contactId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Pull rich data directly from Lead Gen database if available
    let leadGenCompetitors: {
      name: string;
      website?: string;
      rank?: number;
      rating?: number;
      reviews?: number;
      gapAnalysis?: string;
    }[] = [];
    let marketingTags: Record<string, unknown> | undefined;
    let hasContactPage: boolean | undefined;
    let hasBookingSystem: boolean | undefined;
    let lgAiEmailIntro: string | undefined;
    let lgAiEmailCta: string | undefined;
    let lgSubjectLine: string | undefined;
    let lgPersonalizationScore: number | undefined;
    let lgSendTimeReason: string | undefined;
    let lgQualityTier: string | undefined;
    let lgIsICP: boolean | undefined;
    let lgLandingPageSlug: string | undefined;
    let lgPdfUrl: string | undefined;
    let lgMockupUrl: string | undefined;

    const leadGenId = contact.lead_gen_id;

    if (leadGenId && isLeadGenDatabaseConfigured()) {
      try {
        const lgData = await getCompleteLeadGenData(leadGenId);

        if (lgData) {
          // Competitors
          if (lgData.competitors && lgData.competitors.length > 0) {
            leadGenCompetitors = lgData.competitors.map((c) => ({
              name: c.competitor_name,
              website: c.competitor_website || undefined,
              rank: c.competitor_rank || undefined,
              rating: c.competitor_rating || undefined,
              reviews: c.competitor_reviews || undefined,
              gapAnalysis: c.gap_analysis || undefined,
            }));
          }

          // Enrichment data
          if (lgData.enrichment) {
            marketingTags = lgData.enrichment.marketing_tags || undefined;
            hasContactPage = lgData.enrichment.has_contact_page ?? undefined;
            hasBookingSystem = lgData.enrichment.has_booking_system ?? undefined;
          }

          // Analysis data
          if (lgData.analysis) {
            lgAiEmailIntro = lgData.analysis.ai_email_intro || undefined;
            lgAiEmailCta = lgData.analysis.ai_email_cta || undefined;
            lgSubjectLine = lgData.analysis.subject_line || undefined;
            lgPersonalizationScore = lgData.analysis.personalization_score || undefined;
            lgSendTimeReason = lgData.analysis.send_time_reason || undefined;
          }

          // Quality score
          if (lgData.qualityScore) {
            lgQualityTier = lgData.qualityScore.quality_tier || undefined;
            lgIsICP = lgData.qualityScore.is_icp ?? undefined;
          }

          // Landing page
          if (lgData.landingPage) {
            lgLandingPageSlug = lgData.landingPage.slug || undefined;
          }

          // Report
          if (lgData.report) {
            lgPdfUrl = lgData.report.pdf_url || undefined;
            lgMockupUrl = lgData.report.mockup_url || undefined;
          }
        }
      } catch (err) {
        console.warn('[Email Variations] Lead Gen data fetch error (continuing without it):', err);
      }
    }

    // Extract enrichment data from campaign_contacts
    const enrichmentData = (contact.enrichment_data || {}) as Record<string, unknown>;
    const leadInfo = (enrichmentData?.lead || {}) as Record<string, unknown>;
    const analysisData = (enrichmentData?.analysis || {}) as Record<string, unknown>;

    // Extract pain points (can be array or object)
    let painPoints: string[] = [];
    if (contact.pain_points) {
      if (Array.isArray(contact.pain_points)) {
        painPoints = contact.pain_points;
      } else if (typeof contact.pain_points === 'object') {
        painPoints = Object.entries(contact.pain_points as Record<string, unknown>)
          .filter(([, value]) => value === true || value === 'true')
          .map(([key]) => key);
      }
    }
    if (painPoints.length === 0) {
      if (contact.dor_especifica) painPoints = [contact.dor_especifica];
      else if (analysisData?.pain_points && Array.isArray(analysisData.pain_points)) {
        painPoints = analysisData.pain_points as string[];
      }
    }

    // Extract opportunities
    let opportunities: string[] = [];
    if (contact.opportunities) {
      if (Array.isArray(contact.opportunities)) {
        opportunities = contact.opportunities;
      } else if (typeof contact.opportunities === 'object') {
        opportunities = Object.entries(contact.opportunities as Record<string, unknown>)
          .filter(([, value]) => value === true || value === 'true')
          .map(([key]) => key);
      }
    }

    // Build location string
    const locationParts = [contact.city, contact.state, contact.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : contact.location || undefined;

    // Generate variations with ALL available data
    const result = await generateEmailVariations({
      leadName: contact.nome || undefined,
      leadCompany: contact.empresa,
      leadRole: contact.cargo || undefined,
      leadPainPoint: painPoints.length > 0 ? painPoints[0] : contact.dor_especifica || undefined,
      leadWebsite: contact.site || (leadInfo?.website as string) || undefined,
      businessContext: contact.personalized_message || (analysisData?.business_analysis as string) || undefined,
      niche: contact.niche || undefined,
      tone: validated.tone || 'professional',
      includeCTA: validated.includeCTA !== false,
      ctaText: validated.ctaText,
      // Lead Gen Tool Data from campaign_contacts
      painPoints: painPoints.length > 0 ? painPoints : undefined,
      opportunities: opportunities.length > 0 ? opportunities : undefined,
      businessQualityScore: contact.business_quality_score || undefined,
      businessQualityTier: contact.business_quality_tier || lgQualityTier || undefined,
      seoScore: contact.seo_score || undefined,
      pageScore: contact.page_score || undefined,
      rating: contact.rating || undefined,
      reviews: contact.reviews || undefined,
      competitorCount: contact.competitor_count || leadGenCompetitors.length || undefined,
      businessAnalysis: contact.personalized_message || (analysisData?.business_analysis as string) || undefined,
      location,
      allEmails: contact.all_emails && Array.isArray(contact.all_emails) ? contact.all_emails : undefined,
      contactNames: contact.contact_names && Array.isArray(contact.contact_names) ? contact.contact_names : undefined,
      enrichmentData,
      // Enhanced Lead Gen Database fields
      competitors: leadGenCompetitors.length > 0 ? leadGenCompetitors : undefined,
      marketingTags: marketingTags,
      hasContactPage,
      hasBookingSystem,
      aiEmailIntro: contact.ai_email_intro || lgAiEmailIntro || undefined,
      aiEmailCta: contact.ai_email_cta || lgAiEmailCta || undefined,
      subjectLine: contact.subject_line || lgSubjectLine || undefined,
      personalizationScore: contact.personalization_score || lgPersonalizationScore || undefined,
      sendTimeReason: lgSendTimeReason,
      qualityTier: contact.business_quality_tier || lgQualityTier || undefined,
      isICP: contact.is_icp ?? lgIsICP ?? undefined,
      landingPageSlug: lgLandingPageSlug,
      pdfReportUrl: contact.pdf_url || lgPdfUrl || undefined,
      mockupUrl: contact.mockup_url || lgMockupUrl || undefined,
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
      leadGenDataUsed: leadGenCompetitors.length > 0 || !!marketingTags,
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
