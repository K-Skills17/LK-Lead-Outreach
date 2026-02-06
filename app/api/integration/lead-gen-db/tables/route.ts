/**
 * GET /api/integration/lead-gen-db/tables
 *
 * Diagnose read access to Lead Gen Tool tables.
 * Use this to verify shared access when "leads have no matching data".
 *
 * Auth: Bearer LEAD_GEN_INTEGRATION_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLeadGenTableAccess } from '@/lib/lead-gen-db-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedToken = process.env.LEAD_GEN_INTEGRATION_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Integration not configured. Set LEAD_GEN_INTEGRATION_TOKEN.' },
        { status: 503 }
      );
    }

    if (!token || token !== expectedToken) {
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
      hint: !access.configured
        ? 'Set LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY in the Outreach Tool env (use the service_role key from the Lead Gen Supabase project: https://supabase.com/dashboard/project/dktijniwjcmwyaliocen/settings/api).'
        : !access.connectionSuccess
          ? 'Check that the key is the service_role key from the same Lead Gen project (dktijniwjcmwyaliocen).'
          : access.tables.some((t) => !t.accessible)
            ? 'Some tables are missing or not readable. Ensure the Lead Gen DB has public.leads, public.enrichment, public.audits, etc.'
            : 'Access OK. If leads still show "no matching data", ensure campaign_contacts.lead_gen_id is set to the Lead Gen lead UUID (e.g. from integration receive or Sync from Lead Gen DB).',
    });
  } catch (error) {
    console.error('[Lead Gen DB Tables] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
