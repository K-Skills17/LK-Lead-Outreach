/**
 * POST /api/admin/leads/sync-lead-gen
 *
 * For leads already in the outreach tool (campaign_contacts), fetch their
 * latest data from the Lead Gen database and update campaign_contacts.
 * Use this to manually pull in enrichment, audits, GPB score, WhatsApp numbers, etc.
 *
 * Body: { contactIds: string[] }
 * Auth: Bearer ADMIN_DASHBOARD_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  getCompleteLeadGenData,
  mergeLeadGenDataIntoContact,
  getLeadGenLeadByPhone,
  isLeadGenDatabaseConfigured,
} from '@/lib/lead-gen-db-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isLeadGenDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Lead Gen database not configured. Set LEAD_GEN_SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const contactIds = Array.isArray(body.contactIds) ? body.contactIds : [];

    if (contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Provide contactIds (array of campaign_contact IDs).' },
        { status: 400 }
      );
    }

    const results: { contactId: string; success: boolean; message: string }[] = [];
    let synced = 0;
    let failed = 0;

    for (const contactId of contactIds) {
      const { data: contact, error: contactError } = await supabaseAdmin
        .from('campaign_contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle();

      if (contactError || !contact) {
        results.push({ contactId, success: false, message: 'Contact not found' });
        failed++;
        continue;
      }

      let leadGenId = (contact as { lead_gen_id?: string }).lead_gen_id || contactId;
      let leadGenData = await getCompleteLeadGenData(leadGenId);

      if (!leadGenData?.lead && (contact as { phone?: string }).phone) {
        const byPhone = await getLeadGenLeadByPhone((contact as { phone: string }).phone);
        if (byPhone) {
          leadGenId = byPhone.id;
          leadGenData = await getCompleteLeadGenData(leadGenId);
        }
      }

      if (!leadGenData?.lead) {
        results.push({
          contactId,
          success: false,
          message: 'No Lead Gen data found (no lead_gen_id and no match by phone).',
        });
        failed++;
        continue;
      }

      const merged = mergeLeadGenDataIntoContact(contact, leadGenData);
      const { error: updateError } = await supabaseAdmin
        .from('campaign_contacts')
        .update(merged)
        .eq('id', contactId);

      if (updateError) {
        results.push({ contactId, success: false, message: updateError.message });
        failed++;
        continue;
      }

      results.push({ contactId, success: true, message: 'Synced from Lead Gen DB' });
      synced++;
    }

    return NextResponse.json({
      success: true,
      synced,
      failed,
      results,
    });
  } catch (error) {
    console.error('[Admin Sync Lead Gen] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync leads', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
