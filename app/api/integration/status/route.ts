import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  isLeadGenDatabaseConfigured,
  testLeadGenConnection,
  getAllCampaigns,
} from '@/lib/lead-gen-db-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/integration/status
 *
 * Get integration status and statistics
 * Includes Lead Gen Tool database connection status
 * Useful for health checks and monitoring
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

    // Get outreach tool statistics
    const [campaignsCount, leadsCount, pendingLeads, sentLeads] = await Promise.all([
      supabaseAdmin.from('campaigns').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('campaign_contacts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('campaign_contacts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('campaign_contacts').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    ]);

    // Test Lead Gen database connection
    const leadGenDbConfigured = isLeadGenDatabaseConfigured();
    const leadGenDbStatus: {
      connected: boolean;
      configured: boolean;
      message: string;
      campaigns_count?: number;
    } = {
      connected: false,
      configured: leadGenDbConfigured,
      message: leadGenDbConfigured
        ? 'Testing connection...'
        : 'Not configured. Set LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY environment variable.',
    };

    if (leadGenDbConfigured) {
      const connectionTest = await testLeadGenConnection();
      leadGenDbStatus.connected = connectionTest.success;
      leadGenDbStatus.message = connectionTest.message;

      // If connected, get campaign count from Lead Gen database
      if (connectionTest.success) {
        try {
          const leadGenCampaigns = await getAllCampaigns({ limit: 1000 });
          leadGenDbStatus.campaigns_count = leadGenCampaigns.length;
        } catch {
          // Ignore error, just don't include the count
        }
      }
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: {
        outreach_tool: {
          campaigns: campaignsCount.count || 0,
          total_leads: leadsCount.count || 0,
          pending_leads: pendingLeads.count || 0,
          sent_leads: sentLeads.count || 0,
        },
      },
      integration: {
        enabled: true,
        token_configured: !!expectedToken,
        endpoints: {
          receive_leads: '/api/integration/leads/receive',
          webhook: '/api/integration/webhook',
          status: '/api/integration/status',
          debug: '/api/integration/leads/debug',
          test: '/api/integration/test',
          lead_gen_db_test: '/api/integration/lead-gen-db/test',
        },
      },
      lead_gen_database: leadGenDbStatus,
    });
  } catch (error) {
    console.error('[Integration Status] Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
