import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/integration/leads/debug
 * 
 * Debug endpoint to check:
 * 1. Recent leads in database
 * 2. Campaign structure
 * 3. Any errors or issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get recent leads (last 10)
    const { data: recentLeads, error: leadsError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, nome, empresa, phone, campaign_id, created_at, status, lead_gen_id')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get all campaigns
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, location, keyword, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get campaign_contacts count
    const { count: totalLeads, error: countError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('*', { count: 'exact', head: true });

    // Check for leads without campaigns
    const { data: orphanedLeads, error: orphanError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, nome, empresa, campaign_id')
      .is('campaign_id', null)
      .limit(5);

    return NextResponse.json({
      success: true,
      debug: {
        recentLeads: recentLeads || [],
        recentLeadsCount: recentLeads?.length || 0,
        campaigns: campaigns || [],
        campaignsCount: campaigns?.length || 0,
        totalLeadsInDatabase: totalLeads || 0,
        orphanedLeads: orphanedLeads || [],
        errors: {
          leadsError: leadsError ? leadsError.message : null,
          campaignsError: campaignsError ? campaignsError.message : null,
          countError: countError ? countError.message : null,
          orphanError: orphanError ? orphanError.message : null,
        },
      },
    });
  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
