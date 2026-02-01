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

    // Get all leads with SDR assignment info and AI analysis
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

    // Fetch AI analysis data for all leads
    const leadIds = (leads || []).map((l: any) => l.id);
    const personalizationData: Record<string, any> = {};
    const sendTimeData: Record<string, any> = {};

    if (leadIds.length > 0) {
      // Fetch personalization data
      const { data: personalizations } = await supabaseAdmin
        .from('lead_personalization')
        .select('*')
        .in('contact_id', leadIds);

      if (personalizations) {
        personalizations.forEach((p: any) => {
          personalizationData[p.contact_id] = {
            score: p.personalization_score,
            tier: p.lead_tier,
            intro: p.personalized_intro,
            painPoints: p.pain_points,
            ctaText: p.cta_text,
            ctaType: p.cta_type,
          };
        });
      }

      // Fetch optimal send times
      const { data: sendTimes } = await supabaseAdmin
        .from('optimal_send_times')
        .select('*')
        .in('contact_id', leadIds);

      if (sendTimes) {
        sendTimes.forEach((st: any) => {
          sendTimeData[st.contact_id] = {
            optimalSendAt: st.optimal_send_at,
            dayOfWeek: st.day_of_week,
            hourOfDay: st.hour_of_day,
            reason: st.reason,
            confidenceScore: st.confidence_score,
            historicalOpenRate: st.historical_open_rate,
          };
        });
      }
    }

    // Enrich leads with AI data
    const enrichedLeads = (leads || []).map((lead: any) => ({
      ...lead,
      personalization: personalizationData[lead.id] || null,
      sendTime: sendTimeData[lead.id] || null,
    }));

    if (leadsError) {
      console.error('[Admin Overview] Error fetching leads:', leadsError);
      console.error('[Admin Overview] Error details:', JSON.stringify(leadsError, null, 2));
    } else {
      console.log(`[Admin Overview] Successfully fetched ${leads?.length || 0} leads`);
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

    // Calculate AI stats
    const vipLeads = enrichedLeads.filter((l: any) => l.personalization?.tier === 'VIP').length;
    const hotLeads = enrichedLeads.filter((l: any) => l.personalization?.tier === 'HOT').length;
    const avgPersonalizationScore = enrichedLeads
      .filter((l: any) => l.personalization?.score)
      .reduce((sum: number, l: any) => sum + (l.personalization?.score || 0), 0) / 
      Math.max(1, enrichedLeads.filter((l: any) => l.personalization?.score).length);

    return NextResponse.json({
      sdrs: sdrStats,
      campaigns: campaigns || [],
      leads: enrichedLeads,
      stats: {
        totalSDRs: (sdrs || []).length,
        totalCampaigns: (campaigns || []).length,
        totalLeads,
        pendingLeads,
        sentLeads,
        unassignedLeads,
        unreadReplies: (replies || []).length,
        vipLeads,
        hotLeads,
        avgPersonalizationScore: Math.round(avgPersonalizationScore) || 0,
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
