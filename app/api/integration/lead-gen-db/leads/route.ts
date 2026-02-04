import { NextRequest, NextResponse } from 'next/server';
import {
  isLeadGenDatabaseConfigured,
  getLeadsForCampaign,
  getLeadsReadyForOutreach,
  getHotLeads,
  getUnsyncedLeads,
  getCompleteLeadGenData,
  markLeadAsSynced,
} from '@/lib/lead-gen-db-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/integration/lead-gen-db/leads
 *
 * Fetch leads from the Lead Gen Tool database
 *
 * Query parameters:
 * - campaign_id: Filter by campaign ID
 * - type: 'all' | 'ready' | 'hot' | 'unsynced' (default: 'all')
 * - limit: Number of leads to return (default: 100)
 * - offset: Pagination offset (default: 0)
 * - include_enrichment: Include enrichment data (default: false)
 * - include_analysis: Include analysis data (default: false)
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
    const campaignId = searchParams.get('campaign_id') || undefined;
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const includeEnrichment = searchParams.get('include_enrichment') === 'true';
    const includeAnalysis = searchParams.get('include_analysis') === 'true';

    let leads: any[] = [];
    let total = 0;

    switch (type) {
      case 'ready':
        // Get leads ready for outreach (enriched but not synced)
        leads = await getLeadsReadyForOutreach({
          campaignId,
          limit,
        });
        total = leads.length;
        break;

      case 'hot':
        // Get high-quality, engaged leads
        leads = await getHotLeads({
          campaignId,
          qualityTiers: ['VIP', 'HOT', 'WARM'],
          limit,
        });
        total = leads.length;
        break;

      case 'unsynced':
        // Get leads not yet synced to outreach tool
        leads = await getUnsyncedLeads({
          campaignId,
          limit,
        });
        total = leads.length;
        break;

      case 'all':
      default:
        if (!campaignId) {
          return NextResponse.json(
            {
              error: 'campaign_id required for type=all',
              message: 'Please provide a campaign_id parameter or use type=ready, type=hot, or type=unsynced',
            },
            { status: 400 }
          );
        }

        const result = await getLeadsForCampaign(campaignId, {
          limit,
          offset,
          includeEnrichment,
          includeAnalysis,
        });
        leads = result.leads;
        total = result.total;
        break;
    }

    return NextResponse.json({
      success: true,
      type,
      campaign_id: campaignId || null,
      pagination: {
        limit,
        offset,
        total,
        has_more: offset + leads.length < total,
      },
      leads,
    });
  } catch (error) {
    console.error('[Lead Gen DB Leads] Error:', error);
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

/**
 * POST /api/integration/lead-gen-db/leads
 *
 * Get complete data for a specific lead or mark as synced
 *
 * Request body:
 * - action: 'get' | 'sync'
 * - lead_id: Lead UUID (required)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, lead_id } = body;

    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'get':
        // Get complete lead data
        const leadData = await getCompleteLeadGenData(lead_id);

        if (!leadData) {
          return NextResponse.json(
            { error: 'Lead not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          action: 'get',
          data: leadData,
        });

      case 'sync':
        // Mark lead as synced
        const syncSuccess = await markLeadAsSynced(lead_id, {
          sentBy: 'outreach-tool-api',
          responseData: { synced_via: 'api', timestamp: new Date().toISOString() },
        });

        return NextResponse.json({
          success: syncSuccess,
          action: 'sync',
          lead_id,
          message: syncSuccess
            ? 'Lead marked as synced'
            : 'Failed to mark lead as synced',
        });

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            message: 'Action must be "get" or "sync"',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Lead Gen DB Leads POST] Error:', error);
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
