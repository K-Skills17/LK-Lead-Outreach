import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAndGetClinic } from '@/lib/license';
import { verifyCampaignOwnership } from '@/lib/campaigns';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const saveDraftSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  name: z.string().min(1, 'Draft name is required').max(200),
  templateText: z.string().min(1, 'Template text is required').max(2000),
});

/**
 * POST /api/campaigns/[id]/drafts
 * 
 * Save a message draft template for a clinic
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();

    // Validate request body
    const validated = saveDraftSchema.parse(body);

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

    // Save draft
    const { data: draft, error } = await supabaseAdmin
      .from('message_drafts')
      .insert({
        clinic_id: licenseResult.clinicId,
        name: validated.name,
        template_text: validated.templateText,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Error saving draft:', error);
      return NextResponse.json(
        {
          error: 'Failed to save draft',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      draftId: draft.id,
      name: draft.name,
      templateText: draft.template_text,
      createdAt: draft.created_at,
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
    console.error('[API] Error saving draft:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
