import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  getCompleteLeadGenData,
  mergeLeadGenDataIntoContact,
  isLeadGenDatabaseConfigured,
  getCampaignStats,
  getLeadEngagementScores,
  getChannelPerformance,
  getOptimalSendTimes,
  getRecentActivity,
} from '@/lib/lead-gen-db-service';

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

    // Get all leads with SDR assignment info and AI analysis (including image URLs)
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
    
    // Note: The * selector includes all columns including analysis_image_url and landing_page_url

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

    // Fetch last email sent time for each lead
    const leadIdsForEmails = (leads || []).map((l: any) => l.id);
    const emailSentTimes: Record<string, string> = {};
    
    if (leadIdsForEmails.length > 0) {
      // Get the most recent email sent time for each contact
      const { data: emailSends } = await supabaseAdmin
        .from('email_sends')
        .select('campaign_contact_id, sent_at')
        .in('campaign_contact_id', leadIdsForEmails)
        .order('sent_at', { ascending: false });

      if (emailSends) {
        // Get the most recent email for each contact
        emailSends.forEach((email: any) => {
          if (!emailSentTimes[email.campaign_contact_id] || 
              new Date(email.sent_at) > new Date(emailSentTimes[email.campaign_contact_id])) {
            emailSentTimes[email.campaign_contact_id] = email.sent_at;
          }
        });
      }
    }

    // Enrich leads with AI data and email sent times
    let enrichedLeads = (leads || []).map((lead: any) => ({
      ...lead,
      personalization: personalizationData[lead.id] || null,
      sendTime: sendTimeData[lead.id] || null,
      lastEmailSentAt: emailSentTimes[lead.id] || null,
    }));

    // Enrich with Lead Gen Tool data for leads that have lead_gen_id or missing data
    // Do this in batches to avoid too many queries
    const leadsToEnrich = enrichedLeads.filter((lead: any) => {
      const hasLeadGenId = lead.lead_gen_id;
      const hasMissingData = !lead.email || !lead.site || !lead.personalized_message || 
        (!lead.seo_score && !lead.page_score);
      return hasLeadGenId || hasMissingData;
    });

    if (leadsToEnrich.length > 0) {
      console.log(`[Admin Overview] Enriching ${leadsToEnrich.length} leads with Lead Gen Tool data...`);
      
      // Process in parallel but limit concurrency
      const enrichmentPromises = leadsToEnrich.slice(0, 10).map(async (lead: any) => {
        try {
          const leadGenId = lead.lead_gen_id || lead.id;
          const leadGenData = await getCompleteLeadGenData(leadGenId);
          
          if (leadGenData && leadGenData.lead) {
            return mergeLeadGenDataIntoContact(lead, leadGenData);
          }
          return lead;
        } catch (error) {
          console.error(`[Admin Overview] Error enriching lead ${lead.id}:`, error);
          return lead;
        }
      });

      const enrichedResults = await Promise.all(enrichmentPromises);
      
      // Update the enriched leads array
      enrichedLeads = enrichedLeads.map((lead: any) => {
        const enriched = enrichedResults.find((e: any) => e.id === lead.id);
        return enriched || lead;
      });
    }

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

    // Calculate Lead Gen quality tier distribution from enriched leads
    const qualityTierDistribution: Record<string, number> = {};
    const icpCount = enrichedLeads.filter((l: any) => l.is_icp).length;
    enrichedLeads.forEach((l: any) => {
      const tier = l.business_quality_tier;
      if (tier) {
        qualityTierDistribution[tier] = (qualityTierDistribution[tier] || 0) + 1;
      }
    });

    // Fetch Lead Gen database intelligence (non-blocking)
    let leadGenIntelligence: {
      connected: boolean;
      campaignStats: any[];
      channelPerformance: any[];
      engagementScores: any[];
      optimalSendTimes: any[];
      recentActivity: any[];
    } = {
      connected: false,
      campaignStats: [],
      channelPerformance: [],
      engagementScores: [],
      optimalSendTimes: [],
      recentActivity: [],
    };

    if (isLeadGenDatabaseConfigured()) {
      try {
        const [
          lgCampaignStats,
          lgChannelPerf,
          lgEngagement,
          lgSendTimes,
          lgActivity,
        ] = await Promise.all([
          getCampaignStats().catch(() => []),
          getChannelPerformance().catch(() => []),
          getLeadEngagementScores({ engagementLevel: 'hot', limit: 20 }).catch(() => []),
          getOptimalSendTimes({ minSendCount: 5, limit: 10 }).catch(() => []),
          getRecentActivity({ hours: 48, limit: 20 }).catch(() => []),
        ]);

        leadGenIntelligence = {
          connected: true,
          campaignStats: lgCampaignStats,
          channelPerformance: lgChannelPerf,
          engagementScores: lgEngagement,
          optimalSendTimes: lgSendTimes,
          recentActivity: lgActivity,
        };
      } catch (err) {
        console.warn('[Admin Overview] Lead Gen intelligence fetch error:', err);
      }
    }

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
        icpMatches: icpCount,
        qualityTierDistribution,
      },
      leadGenIntelligence,
    });
  } catch (error) {
    console.error('[Admin Overview] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
