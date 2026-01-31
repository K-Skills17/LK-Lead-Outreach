import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/overview
 * Get comprehensive overview for admin dashboard
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

    // Get all SDRs with their stats
    const { data: sdrs, error: sdrsError } = await supabaseAdmin
      .from('sdr_users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (sdrsError) {
      console.error('[Admin Overview] Error fetching SDRs:', sdrsError);
    }

    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.error('[Admin Overview] Error fetching campaigns:', campaignsError);
    }

    // Get all leads with SDR assignment info
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from('campaign_contacts')
      .select(`
        *,
        campaigns (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('[Admin Overview] Error fetching leads:', leadsError);
    }

    // Calculate stats for each SDR
    const sdrStats = (sdrs || []).map(sdr => {
      const sdrLeads = (leads || []).filter((l: any) => l.assigned_sdr_id === sdr.id);
      const sdrCampaigns = (campaigns || []).filter((c: any) => c.assigned_sdr_id === sdr.id);
      
      return {
        ...sdr,
        stats: {
          totalLeads: sdrLeads.length,
          pendingLeads: sdrLeads.filter((l: any) => l.status === 'pending').length,
          sentLeads: sdrLeads.filter((l: any) => l.status === 'sent').length,
          totalCampaigns: sdrCampaigns.length,
        },
      };
    });

    // Overall stats
    const totalLeads = (leads || []).length;
    const pendingLeads = (leads || []).filter((l: any) => l.status === 'pending').length;
    const sentLeads = (leads || []).filter((l: any) => l.status === 'sent').length;
    const unassignedLeads = (leads || []).filter((l: any) => !l.assigned_sdr_id).length;

    // Get unread replies
    const { data: replies } = await supabaseAdmin
      .from('message_replies')
      .select('*')
      .eq('is_read', false);

    return NextResponse.json({
      sdrs: sdrStats,
      campaigns: campaigns || [],
      leads: leads || [],
      stats: {
        totalSDRs: (sdrs || []).length,
        totalCampaigns: (campaigns || []).length,
        totalLeads,
        pendingLeads,
        sentLeads,
        unassignedLeads,
        unreadReplies: (replies || []).length,
      },
    });
  } catch (error) {
    console.error('[Admin Overview] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
