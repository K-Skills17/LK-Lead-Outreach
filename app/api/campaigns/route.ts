import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAndGetClinic } from '@/lib/license';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const createCampaignSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  name: z.string().min(1, 'Campaign name is required').max(200),
});

/**
 * POST /api/campaigns
 * 
 * Create a new campaign for a clinic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = createCampaignSchema.parse(body);

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

    // Create campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert({
        clinic_id: licenseResult.clinicId,
        name: validated.name,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Error creating campaign:', error);
      return NextResponse.json(
        {
          error: 'Failed to create campaign',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      campaignId: campaign.id,
      status: campaign.status,
      name: campaign.name,
      createdAt: campaign.created_at,
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

    // Handle other errors
    console.error('[API] Error creating campaign:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
