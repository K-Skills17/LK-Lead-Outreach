import { NextRequest, NextResponse } from 'next/server';
import {
  isLeadGenDatabaseConfigured,
  getCampaignStats,
  getLeadEngagementScores,
  getChannelPerformance,
  getOptimalSendTimes,
  getResponseAnalytics,
  getABTestPerformance,
  getLeadGenSalesPerformance,
  getConversionFunnel,
  getRecentActivity,
} from '@/lib/lead-gen-db-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/integration/lead-gen-db/analytics
 *
 * Fetch analytics data from the Lead Gen Tool database
 *
 * Query parameters:
 * - type: 'campaign_stats' | 'engagement' | 'channel' | 'send_times' | 'responses' | 'ab_tests' | 'sales' | 'funnel' | 'activity'
 * - campaign_id: Filter by campaign ID (optional, depends on type)
 * - niche: Filter by niche (optional, for send_times, channel, responses)
 * - limit: Number of results to return (default varies by type)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedToken = process.env.LEAD_GEN_INTEGRATION_TOKEN;

    if (!expectedToken || !token || token !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if database is configured
    if (!isLeadGenDatabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Lead Gen database not configured',
          message: 'Please set LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY environment variable.',
        },
        { status: 503 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'campaign_stats';
    const campaignId = searchParams.get('campaign_id') || undefined;
    const niche = searchParams.get('niche') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const engagementLevel = searchParams.get('engagement_level') as 'hot' | 'warm' | 'cold' | 'neutral' | undefined;
    const channel = searchParams.get('channel') as 'email' | 'whatsapp' | undefined;
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    let data: any = null;

    switch (type) {
      case 'campaign_stats':
        data = await getCampaignStats(campaignId);
        break;

      case 'engagement':
        data = await getLeadEngagementScores({
          campaignId,
          engagementLevel,
          limit,
        });
        break;

      case 'channel':
        data = await getChannelPerformance(niche);
        break;

      case 'send_times':
        data = await getOptimalSendTimes({
          niche,
          minSendCount: 10,
          limit,
        });
        break;

      case 'responses':
        data = await getResponseAnalytics({
          niche,
          channel,
        });
        break;

      case 'ab_tests':
        data = await getABTestPerformance(campaignId);
        break;

      case 'sales':
        data = await getLeadGenSalesPerformance(campaignId);
        break;

      case 'funnel':
        if (!campaignId) {
          return NextResponse.json(
            {
              error: 'campaign_id required for funnel analytics',
              message: 'Please provide a campaign_id parameter',
            },
            { status: 400 }
          );
        }
        data = await getConversionFunnel(campaignId);
        break;

      case 'activity':
        data = await getRecentActivity({
          hours,
          limit,
        });
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid type',
            message: 'Valid types: campaign_stats, engagement, channel, send_times, responses, ab_tests, sales, funnel, activity',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      filters: {
        campaign_id: campaignId || null,
        niche: niche || null,
        engagement_level: engagementLevel || null,
        channel: channel || null,
        limit,
        hours: type === 'activity' ? hours : undefined,
      },
      data,
    });
  } catch (error) {
    console.error('[Lead Gen DB Analytics] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
