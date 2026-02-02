import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/integration/status
 * 
 * Get integration status and statistics
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

    // Get statistics
    const [campaignsCount, leadsCount, pendingLeads, sentLeads] = await Promise.all([
      supabaseAdmin.from('campaigns').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('campaign_contacts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('campaign_contacts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('campaign_contacts').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    ]);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: {
        campaigns: campaignsCount.count || 0,
        total_leads: leadsCount.count || 0,
        pending_leads: pendingLeads.count || 0,
        sent_leads: sentLeads.count || 0,
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
        },
      },
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
