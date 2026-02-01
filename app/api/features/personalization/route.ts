import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generatePersonalization,
  savePersonalization,
  getPersonalization,
  PersonalizationInput,
} from '@/lib/personalization-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const personalizationRequestSchema = z.object({
  contactId: z.string().uuid(),
  leadData: z.object({
    name: z.string(),
    empresa: z.string(),
    industry: z.string().optional(),
    google_maps_ranking: z.number().optional(),
    rating: z.number().optional(),
    competitors: z.array(z.object({
      name: z.string(),
      rating: z.number().optional(),
    })).optional(),
    website_performance: z.object({
      speed_score: z.number().optional(),
      seo_score: z.number().optional(),
      mobile_friendly: z.boolean().optional(),
    }).optional(),
    marketing_tags: z.array(z.string()).optional(),
    pain_points: z.array(z.string()).optional(),
    quality_score: z.number().optional(),
    fit_score: z.number().optional(),
    enrichment_score: z.number().optional(),
    niche: z.string().optional(),
    campaign_name: z.string().optional(),
  }),
});

/**
 * POST /api/features/personalization
 * Generate personalization for a lead
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
    
    // Validate request
    const validation = personalizationRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { contactId, leadData } = validation.data;
    
    // Generate personalization
    const result = await generatePersonalization(leadData as PersonalizationInput);
    
    // Save to database
    const saveResult = await savePersonalization(contactId, result);
    
    if (!saveResult.success) {
      return NextResponse.json(
        { error: 'Failed to save personalization', details: saveResult.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      personalization: result,
    });
  } catch (error) {
    console.error('[Personalization API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/features/personalization?contactId=xxx
 * Get personalization for a contact
 */
export async function GET(request: NextRequest) {
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
    
    const url = new URL(request.url);
    const contactId = url.searchParams.get('contactId');
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId required' },
        { status: 400 }
      );
    }
    
    const personalization = await getPersonalization(contactId);
    
    if (!personalization) {
      return NextResponse.json(
        { error: 'Personalization not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      personalization,
    });
  } catch (error) {
    console.error('[Personalization API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
