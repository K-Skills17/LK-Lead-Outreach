import { NextRequest, NextResponse } from 'next/server';
import { getSDRById, getSDRCampaigns, getSDRLeads, getSDRUnreadReplies } from '@/lib/sdr-auth';
import {
  isLeadGenDatabaseConfigured,
  getLeadEngagementScores,
  getOptimalSendTimes,
  getRecentActivity,
} from '@/lib/lead-gen-db-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sdr/dashboard
 * 
 * Get SDR dashboard data (campaigns, leads, replies)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const sdrId = authHeader?.replace('Bearer ', '') || 
                  new URL(request.url).searchParams.get('sdrId');

    if (!sdrId) {
      return NextResponse.json(
        { error: 'SDR ID required' },
        { status: 401 }
      );
    }

    // Verify SDR exists
    const sdr = await getSDRById(sdrId);
    if (!sdr) {
      return NextResponse.json(
        { error: 'SDR not found' },
        { status: 404 }
      );
    }

    // Get dashboard data
    const [campaigns, allLeads, pendingLeads, sentLeads, unreadReplies] = await Promise.all([
      getSDRCampaigns(sdrId),
      getSDRLeads(sdrId),
      getSDRLeads(sdrId, 'pending'),
      getSDRLeads(sdrId, 'sent'),
      getSDRUnreadReplies(sdrId),
    ]);

    // Calculate lead quality stats from enriched leads
    const qualityTierDistribution: Record<string, number> = {};
    let icpCount = 0;
    let totalQualityScore = 0;
    let qualityScoreCount = 0;

    allLeads.forEach((lead: any) => {
      if (lead.business_quality_tier) {
        qualityTierDistribution[lead.business_quality_tier] =
          (qualityTierDistribution[lead.business_quality_tier] || 0) + 1;
      }
      if (lead.is_icp) icpCount++;
      if (lead.business_quality_score) {
        totalQualityScore += lead.business_quality_score;
        qualityScoreCount++;
      }
    });

    const avgQualityScore = qualityScoreCount > 0
      ? Math.round(totalQualityScore / qualityScoreCount)
      : 0;

    // Fetch Lead Gen intelligence (non-blocking)
    let leadGenIntelligence: {
      connected: boolean;
      engagementScores: any[];
      optimalSendTimes: any[];
      recentActivity: any[];
    } = {
      connected: false,
      engagementScores: [],
      optimalSendTimes: [],
      recentActivity: [],
    };

    if (isLeadGenDatabaseConfigured()) {
      try {
        const [lgEngagement, lgSendTimes, lgActivity] = await Promise.all([
          getLeadEngagementScores({ engagementLevel: 'hot', limit: 10 }).catch(() => []),
          getOptimalSendTimes({ minSendCount: 5, limit: 5 }).catch(() => []),
          getRecentActivity({ hours: 24, limit: 10 }).catch(() => []),
        ]);

        leadGenIntelligence = {
          connected: true,
          engagementScores: lgEngagement,
          optimalSendTimes: lgSendTimes,
          recentActivity: lgActivity,
        };
      } catch (err) {
        console.warn('[SDR Dashboard] Lead Gen intelligence fetch error:', err);
      }
    }

    return NextResponse.json({
      sdr: {
        id: sdr.id,
        name: sdr.name,
        email: sdr.email,
        role: sdr.role,
      },
      stats: {
        totalCampaigns: campaigns.length,
        totalLeads: allLeads.length,
        pendingLeads: pendingLeads.length,
        sentLeads: sentLeads.length,
        unreadReplies: unreadReplies.length,
        icpMatches: icpCount,
        avgQualityScore,
        qualityTierDistribution,
      },
      campaigns,
      recentLeads: allLeads.slice(0, 20),
      unreadReplies,
      leadGenIntelligence,
    });
  } catch (error) {
    console.error('[SDR Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
