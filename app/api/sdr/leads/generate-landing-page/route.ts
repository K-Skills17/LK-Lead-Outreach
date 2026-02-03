import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateLandingPage, shouldGenerateLandingPage } from '@/lib/landing-page-service';
import { getSDRById } from '@/lib/sdr-auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const generateLandingPageSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  force: z.boolean().optional().default(false), // Force generation even if performance is good
  manualUrl: z.string().url().optional(), // Optional: manually provide landing page URL
});

/**
 * POST /api/sdr/leads/generate-landing-page
 * Generate landing page mockup for a lead (SDR accessible)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify SDR authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get SDR by ID
    const sdr = await getSDRById(token);
    if (!sdr || !sdr.is_active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = generateLandingPageSchema.parse(body);

    // Get contact details
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select(
        'id, nome, empresa, phone, email, site, niche, location, city, state, country, ' +
        'seo_score, page_score, business_type, category, description, logo_url, ' +
        'landing_page_url, enrichment_data, assigned_sdr_id'
      )
      .eq('id', validated.contactId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Type assertion for contact with all needed properties
    const contactData = contact as any;

    // Verify SDR has access to this lead
    if (contactData.assigned_sdr_id !== sdr.id) {
      return NextResponse.json(
        { error: 'You do not have access to this lead' },
        { status: 403 }
      );
    }

    // If manual URL provided, just save it
    if (validated.manualUrl) {
      const { error: updateError } = await supabaseAdmin
        .from('campaign_contacts')
        .update({
          landing_page_url: validated.manualUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.contactId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to save landing page URL', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        landingPageUrl: validated.manualUrl,
        message: 'Landing page URL saved successfully',
        isManual: true,
      });
    }

    // Check if landing page already exists
    if (contactData.landing_page_url && !validated.force) {
      return NextResponse.json({
        success: true,
        landingPageUrl: contactData.landing_page_url,
        alreadyExists: true,
        message: 'Landing page already exists for this lead',
      });
    }

    // Check if should generate (unless forced)
    if (!validated.force) {
      const shouldGenerate = shouldGenerateLandingPage({
        seoScore: contactData.seo_score,
        pageScore: contactData.page_score,
        hasWebsite: !!contactData.site,
      });

      if (!shouldGenerate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Lead does not need a landing page. Website performance is good (SEO ≥70, Page ≥70). Use force=true to generate anyway.',
            needsLandingPage: false,
          },
          { status: 400 }
        );
      }
    }

    // Extract enrichment data
    const enrichmentData = (contactData.enrichment_data || {}) as any;
    const leadInfo = enrichmentData?.lead || {};
    const analysisData = enrichmentData?.analysis || {};

    // Generate landing page
    const result = await generateLandingPage({
      leadName: contactData.nome || undefined,
      leadCompany: contactData.empresa,
      leadLocation: contactData.location || `${contactData.city || ''}, ${contactData.state || ''}`.trim() || undefined,
      leadWebsite: contactData.site || leadInfo?.website || undefined,
      leadNiche: contactData.niche || leadInfo?.niche || undefined,
      leadIndustry: contactData.business_type || contactData.category || contactData.niche || undefined,
      seoScore: contactData.seo_score || analysisData?.seo_score || undefined,
      pageScore: contactData.page_score || analysisData?.page_score || undefined,
      businessDescription: contactData.description || leadInfo?.description || analysisData?.business_analysis || undefined,
      logoUrl: contactData.logo_url || leadInfo?.logo_url || undefined,
    });

    if (!result.success || !result.landingPageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to generate landing page',
        },
        { status: 500 }
      );
    }

    // Save landing page URL to database
    const { error: updateError } = await supabaseAdmin
      .from('campaign_contacts')
      .update({
        landing_page_url: result.landingPageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.contactId);

    if (updateError) {
      console.error('[GenerateLandingPage] Error updating contact:', updateError);
      // Still return success since landing page was generated, just failed to save
      return NextResponse.json({
        success: true,
        landingPageUrl: result.landingPageUrl,
        generationId: result.generationId,
        warning: 'Landing page generated but failed to save to database',
      });
    }

    return NextResponse.json({
      success: true,
      landingPageUrl: result.landingPageUrl,
      generationId: result.generationId,
      message: 'Landing page generated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[GenerateLandingPage] Error:', error);
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
