import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const assignLeadSchema = z.object({
  leadId: z.string().uuid(),
  sdrId: z.string().uuid(),
});

/**
 * POST /api/admin/assign-lead
 * Assign a lead to an SDR
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
    const { leadId, sdrId } = assignLeadSchema.parse(body);

    // Verify SDR exists
    const { data: sdr, error: sdrError } = await supabaseAdmin
      .from('sdr_users')
      .select('id')
      .eq('id', sdrId)
      .eq('is_active', true)
      .single();

    if (sdrError || !sdr) {
      return NextResponse.json(
        { error: 'SDR not found' },
        { status: 404 }
      );
    }

    // Verify lead exists
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Assign lead to SDR
    const { error: updateError } = await supabaseAdmin
      .from('campaign_contacts')
      .update({ assigned_sdr_id: sdrId })
      .eq('id', leadId);

    if (updateError) {
      console.error('[Admin Assign Lead] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to assign lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Lead assigned successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Admin Assign Lead] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/assign-leads-bulk
 * Assign multiple leads to an SDR
 */
export async function PUT(request: NextRequest) {
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
    const { leadIds, sdrId } = body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'leadIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!sdrId) {
      return NextResponse.json(
        { error: 'sdrId is required' },
        { status: 400 }
      );
    }

    // Verify SDR exists
    const { data: sdr, error: sdrError } = await supabaseAdmin
      .from('sdr_users')
      .select('id')
      .eq('id', sdrId)
      .eq('is_active', true)
      .single();

    if (sdrError || !sdr) {
      return NextResponse.json(
        { error: 'SDR not found' },
        { status: 404 }
      );
    }

    // Assign all leads to SDR
    const { error: updateError } = await supabaseAdmin
      .from('campaign_contacts')
      .update({ assigned_sdr_id: sdrId })
      .in('id', leadIds);

    if (updateError) {
      console.error('[Admin Assign Leads Bulk] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to assign leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${leadIds.length} leads assigned successfully`,
    });
  } catch (error) {
    console.error('[Admin Assign Leads Bulk] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
