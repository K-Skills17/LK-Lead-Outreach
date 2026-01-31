import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAndGetClinic } from '@/lib/license';
import { verifyCampaignOwnership } from '@/lib/campaigns';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const syncSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  campaignId: z.string().uuid('Invalid campaign ID'),
  limit: z.number().int().min(1).max(1000).optional().default(100),
});

/**
 * POST /api/enrichment/sync
 * 
 * Sync leads from enrichment tool to a campaign
 * This endpoint reads from your enrichment tool's table and adds leads to a campaign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = syncSchema.parse(body);

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
      validated.campaignId,
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

    // Call the database function to sync leads
    const { data, error } = await supabaseAdmin.rpc('sync_enriched_leads_to_campaign', {
      p_campaign_id: validated.campaignId,
      p_limit: validated.limit,
    });

    if (error) {
      console.error('[API] Error syncing leads:', error);
      return NextResponse.json(
        {
          error: 'Failed to sync leads',
          details: error.message,
        },
        { status: 500 }
      );
    }

    const result = data && data.length > 0 ? data[0] : { imported: 0, skipped: 0, errors: [] };

    return NextResponse.json({
      success: true,
      imported: result.imported || 0,
      skipped: result.skipped || 0,
      errors: result.errors || [],
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

    console.error('[API] Error syncing leads:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
