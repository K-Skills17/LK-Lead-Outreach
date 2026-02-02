import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateLandingPage, shouldGenerateLandingPage } from '@/lib/landing-page-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const generateLandingPageSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  force: z.boolean().optional().default(false), // Force generation even if performance is good
});

/**
 * POST /api/admin/leads/generate-landing-page
 * Generate landing page mockup for a lead based on website performance
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
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
        'landing_page_url, enrichment_data'
      )
      .eq('id', validated.contactId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Type assertion for contact with landing_page_url
    const contactWithLandingPage = contact as typeof contact & { landing_page_url?: string | null };

    // Check if landing page already exists
    if (contactWithLandingPage.landing_page_url && !validated.force) {
      return NextResponse.json({
        success: true,
        landingPageUrl: contactWithLandingPage.landing_page_url,
        alreadyExists: true,
        message: 'Landing page already exists for this lead',
      });
    }

    // Check if should generate (unless forced)
    if (!validated.force) {
      const shouldGenerate = shouldGenerateLandingPage({
        seoScore: contact.seo_score,
        pageScore: contact.page_score,
        hasWebsite: !!contact.site,
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
    const enrichmentData = (contact.enrichment_data || {}) as any;
    const leadInfo = enrichmentData?.lead || {};
    const analysisData = enrichmentData?.analysis || {};

    // Generate landing page
    const result = await generateLandingPage({
      leadName: contact.nome || undefined,
      leadCompany: contact.empresa,
      leadLocation: contact.location || `${contact.city || ''}, ${contact.state || ''}`.trim() || undefined,
      leadWebsite: contact.site || leadInfo?.website || undefined,
      leadNiche: contact.niche || leadInfo?.niche || undefined,
      leadIndustry: contact.business_type || contact.category || contact.niche || undefined,
      seoScore: contact.seo_score || analysisData?.seo_score || undefined,
      pageScore: contact.page_score || analysisData?.page_score || undefined,
      businessDescription: contact.description || leadInfo?.description || analysisData?.business_analysis || undefined,
      logoUrl: contact.logo_url || leadInfo?.logo_url || undefined,
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

/**
 * GET /api/admin/leads/generate-landing-page?contactId=...
 * Check if a lead needs a landing page based on website performance
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 });
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, landing_page_url, seo_score, page_score, site')
      .eq('id', contactId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const needsLandingPage = shouldGenerateLandingPage({
      seoScore: contact.seo_score,
      pageScore: contact.page_score,
      hasWebsite: !!contact.site,
    });

    return NextResponse.json({
      needsLandingPage,
      hasLandingPage: !!contact.landing_page_url,
      landingPageUrl: contact.landing_page_url || null,
      seoScore: contact.seo_score,
      pageScore: contact.page_score,
      hasWebsite: !!contact.site,
    });
  } catch (error) {
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
