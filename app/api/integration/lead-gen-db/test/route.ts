import { NextRequest, NextResponse } from 'next/server';
import {
  isLeadGenDatabaseConfigured,
  testLeadGenConnection,
  getAllCampaigns,
  getCampaignStats,
  getOptimalSendTimes,
} from '@/lib/lead-gen-db-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/integration/lead-gen-db/test
 *
 * Test the Lead Gen Tool database connection
 * Returns connection status and sample data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedToken = process.env.LEAD_GEN_INTEGRATION_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Integration not configured' },
        { status: 503 }
      );
    }

    if (!token || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if database is configured
    const isConfigured = isLeadGenDatabaseConfigured();

    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        configured: false,
        message: 'Lead Gen database not configured. Please set LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY environment variable.',
        setup_instructions: {
          env_var: 'LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY',
          description: 'Service role key for the Lead Gen Engine Supabase project',
          supabase_project_url: 'https://dktijniwjcmwyaliocen.supabase.co',
          dashboard_url: 'https://supabase.com/dashboard/project/dktijniwjcmwyaliocen/settings/api',
        },
      });
    }

    // Test the connection
    const connectionTest = await testLeadGenConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        configured: true,
        connected: false,
        message: connectionTest.message,
        error: connectionTest.details,
      });
    }

    // Fetch sample data to verify full access
    const [campaigns, campaignStats, optimalSendTimes] = await Promise.all([
      getAllCampaigns({ limit: 5 }),
      getCampaignStats(),
      getOptimalSendTimes({ limit: 5, minSendCount: 10 }),
    ]);

    return NextResponse.json({
      success: true,
      configured: true,
      connected: true,
      message: 'Successfully connected to Lead Gen database!',
      timestamp: new Date().toISOString(),
      database_info: {
        project_url: 'https://dktijniwjcmwyaliocen.supabase.co',
        host: 'db.dktijniwjcmwyaliocen.supabase.co',
      },
      sample_data: {
        campaigns_count: campaigns.length,
        campaigns: campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          niche: c.niche,
          status: c.status,
          total_scraped: c.total_scraped,
          total_enriched: c.total_enriched,
        })),
        campaign_stats_available: campaignStats.length > 0,
        optimal_send_times_available: optimalSendTimes.length > 0,
      },
      available_functions: [
        'getCompleteLeadGenData(leadId)',
        'getLeadGenLeadByPhone(phone)',
        'getLeadGenLeadById(leadId)',
        'getLeadsForCampaign(campaignId, options)',
        'getCampaign(campaignId)',
        'getAllCampaigns(options)',
        'getHotLeads(options)',
        'getLeadsReadyForOutreach(options)',
        'getCampaignStats(campaignId?)',
        'getLeadEngagementScores(options)',
        'getChannelPerformance(niche?)',
        'getOptimalSendTimes(options)',
        'getResponseAnalytics(options)',
        'getABTestPerformance(campaignId?)',
        'getLeadGenSalesPerformance(campaignId?)',
        'markLeadAsSynced(leadId, options)',
        'getUnsyncedLeads(options)',
        'getLeadsWithResponses(options)',
        'getConversionFunnel(campaignId)',
        'getRecentActivity(options)',
        'mergeLeadGenDataIntoContact(contact, leadGenData)',
      ],
      available_tables: [
        'campaigns',
        'leads',
        'enrichment',
        'analysis',
        'reports',
        'outreach',
        'whatsapp_outreach',
        'lead_responses',
        'conversions',
        'competitor_analysis',
        'lead_quality_scores',
        'send_time_analytics',
        'calendar_bookings',
        'lead_outreach_sync',
        'audits',
        'analysis_landing_pages',
        'keyword_search_cache',
        'lead_gen_sales_tracking',
      ],
      available_views: [
        'campaign_stats',
        'lead_engagement_scores',
        'channel_performance',
        'optimal_send_times',
        'response_analytics',
        'ab_test_performance',
        'lead_gen_sales_performance',
      ],
    });
  } catch (error) {
    console.error('[Lead Gen DB Test] Error:', error);
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
