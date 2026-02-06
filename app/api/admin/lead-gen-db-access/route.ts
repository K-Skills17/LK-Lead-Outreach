/**
 * GET /api/admin/lead-gen-db-access
 *
 * Diagnose Lead Gen Tool database access (tables, counts, connection).
 * Use when leads show "no matching data" to verify shared access.
 *
 * Auth: Bearer ADMIN_DASHBOARD_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLeadGenTableAccess } from '@/lib/lead-gen-db-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await getLeadGenTableAccess();

    return NextResponse.json({
      success: access.connectionSuccess,
      configured: access.configured,
      connection: {
        success: access.connectionSuccess,
        message: access.connectionMessage,
      },
      tables: access.tables,
      project_url: 'https://dktijniwjcmwyaliocen.supabase.co',
      env_var: 'LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY',
      hint: !access.configured
        ? 'Set LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY (service_role key from Lead Gen Supabase project).'
        : !access.connectionSuccess
          ? 'Key may be wrong or from a different project. Use service_role from project dktijniwjcmwyaliocen.'
          : access.tables.some((t) => !t.accessible)
            ? 'Some tables missing. Lead Gen DB must expose public.leads, public.enrichment, public.audits, etc.'
            : 'Access OK. If no matching data: set lead_gen_id on contacts (Sync from Lead Gen DB or receive leads via integration).',
    });
  } catch (error) {
    console.error('[Admin Lead Gen DB Access] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
