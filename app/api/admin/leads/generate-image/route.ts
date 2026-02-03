import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateLeonardoImage, shouldGenerateImage } from '@/lib/leonardo-ai-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const generateImageSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  force: z.boolean().optional().default(false), // Force generation even if doesn't qualify
});

/**
 * POST /api/admin/leads/generate-image
 * Generate Leonardo AI analysis image for a lead
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
    const validated = generateImageSchema.parse(body);

    // Get contact details
    console.log('[GenerateImage] Looking for contact with ID:', validated.contactId);
    console.log('[GenerateImage] Contact ID type:', typeof validated.contactId);
    console.log('[GenerateImage] Contact ID length:', validated.contactId?.length);
    
    // First, verify the contact exists
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select(
        'id, nome, empresa, phone, email, site, niche, location, city, state, country, ' +
        'pain_points, opportunities, competitor_count, ' +
        'rating, reviews, rank, ' +
        'business_quality_score, business_quality_tier, is_icp, segment, ' +
        'personalization, enrichment_data, analysis_image_url'
      )
      .eq('id', validated.contactId)
      .maybeSingle();

    if (contactError) {
      console.error('[GenerateImage] Database error:', contactError);
      console.error('[GenerateImage] Error code:', contactError.code);
      console.error('[GenerateImage] Error details:', contactError.details);
      console.error('[GenerateImage] Error hint:', contactError.hint);
      
      return NextResponse.json({ 
        error: 'Database error', 
        details: contactError.message,
        code: contactError.code,
        contactId: validated.contactId 
      }, { status: 500 });
    }

    if (!contact) {
      // Try to find any contact with similar ID for debugging
      const { data: allContacts, error: sampleError } = await supabaseAdmin
        .from('campaign_contacts')
        .select('id, nome, empresa')
        .limit(5);
      
      console.error('[GenerateImage] Contact not found. Contact ID:', validated.contactId);
      console.error('[GenerateImage] Total contacts in database:', allContacts?.length || 0);
      console.error('[GenerateImage] Sample contact IDs in database:', allContacts?.map(c => ({ id: c.id, nome: c.nome, empresa: c.empresa })));
      
      // Also try to find by partial match (in case of ID format issues)
      if (validated.contactId) {
        const { data: partialMatch } = await supabaseAdmin
          .from('campaign_contacts')
          .select('id, nome, empresa')
          .ilike('id', `%${validated.contactId.slice(-8)}%`)
          .limit(3);
        
        if (partialMatch && partialMatch.length > 0) {
          console.error('[GenerateImage] Found partial matches:', partialMatch);
        }
      }
      
      return NextResponse.json({ 
        error: 'Contact not found',
        contactId: validated.contactId,
        hint: 'Make sure the contact ID exists in the campaign_contacts table',
        totalContactsInDb: allContacts?.length || 0,
        sampleContactIds: allContacts?.slice(0, 3).map(c => c.id) || []
      }, { status: 404 });
    }
    
    console.log('[GenerateImage] Contact found:', contact.nome, contact.empresa, 'ID:', contact.id);

    // Type assertion for contact with all needed properties
    const contactData = contact as any;

    // Check if image already exists
    if (contactData.analysis_image_url && !validated.force) {
      return NextResponse.json({
        success: true,
        imageUrl: contactData.analysis_image_url,
        alreadyExists: true,
        message: 'Image already exists for this lead',
      });
    }

    // Check qualification (unless forced)
    if (!validated.force) {
      const qualifies = shouldGenerateImage({
        personalization: contactData.personalization,
        pain_points: contactData.pain_points,
        business_quality_tier: contactData.business_quality_tier,
        business_quality_score: contactData.business_quality_score,
      });

      if (!qualifies) {
        return NextResponse.json(
          {
            success: false,
            error: 'Lead does not qualify for image generation. Must be VIP/HOT/WARM tier with pain points.',
            qualifies: false,
          },
          { status: 400 }
        );
      }
    }

    // Extract enrichment data
    const enrichmentData = (contactData.enrichment_data || {}) as any;
    const leadInfo = enrichmentData?.lead || {};
    const analysisData = enrichmentData?.analysis || {};

    // Extract pain points
    let painPoints: string[] = [];
    if (contactData.pain_points) {
      if (Array.isArray(contactData.pain_points)) {
        painPoints = contactData.pain_points;
      } else if (typeof contactData.pain_points === 'object') {
        painPoints = Object.entries(contactData.pain_points)
          .filter(([_, value]) => value === true || value === 'true')
          .map(([key, _]) => key);
      }
    }

    // Extract opportunities
    let opportunities: string[] = [];
    if (contactData.opportunities) {
      if (Array.isArray(contactData.opportunities)) {
        opportunities = contactData.opportunities;
      } else if (typeof contactData.opportunities === 'object') {
        opportunities = Object.entries(contactData.opportunities)
          .filter(([_, value]) => value === true || value === 'true')
          .map(([key, _]) => key);
      }
    }

    // Generate image
    const imageResult = await generateLeonardoImage({
      leadName: contactData.nome || undefined,
      leadCompany: contactData.empresa,
      leadLocation: contactData.location || `${contactData.city || ''}, ${contactData.state || ''}`.trim() || undefined,
      leadWebsite: contactData.site || leadInfo?.website || undefined,
      leadNiche: contactData.niche || leadInfo?.niche || undefined,
      painPoints: painPoints.length > 0 ? painPoints : undefined,
      competitorCount: contactData.competitor_count || analysisData?.competitors?.length || undefined,
      googleRanking: contactData.rank || leadInfo?.rank || undefined,
      googleRating: contactData.rating || leadInfo?.rating || undefined,
      googleReviews: contactData.reviews || leadInfo?.reviews || undefined,
      businessQualityScore: contactData.business_quality_score || leadInfo?.business_quality_score || undefined,
      businessQualityTier: contactData.business_quality_tier || leadInfo?.business_quality_tier || undefined,
      opportunities: opportunities.length > 0 ? opportunities : undefined,
    });

    if (!imageResult.success || !imageResult.imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: imageResult.error || 'Failed to generate image',
        },
        { status: 500 }
      );
    }

    // Save image URL to database
    const { error: updateError } = await supabaseAdmin
      .from('campaign_contacts')
      .update({
        analysis_image_url: imageResult.imageUrl,
        analysis_image_generation_id: imageResult.generationId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.contactId);

    if (updateError) {
      console.error('[GenerateImage] Error updating contact:', updateError);
      // Still return success since image was generated, just failed to save
      return NextResponse.json({
        success: true,
        imageUrl: imageResult.imageUrl,
        generationId: imageResult.generationId,
        warning: 'Image generated but failed to save to database',
      });
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageResult.imageUrl,
      generationId: imageResult.generationId,
      message: 'Image generated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[GenerateImage] Error:', error);
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
 * GET /api/admin/leads/generate-image?contactId=...
 * Check if a lead qualifies for image generation
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
      .select('id, analysis_image_url, personalization, pain_points, business_quality_tier, business_quality_score')
      .eq('id', contactId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Type assertion for contact with all needed properties
    const contactData = contact as any;

    const qualifies = shouldGenerateImage({
      personalization: contactData.personalization,
      pain_points: contactData.pain_points,
      business_quality_tier: contactData.business_quality_tier,
      business_quality_score: contactData.business_quality_score,
    });

    return NextResponse.json({
      qualifies,
      hasImage: !!contactData.analysis_image_url,
      imageUrl: contactData.analysis_image_url || null,
    });
  } catch (error) {
    console.error('[GenerateImage] Error:', error);
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
