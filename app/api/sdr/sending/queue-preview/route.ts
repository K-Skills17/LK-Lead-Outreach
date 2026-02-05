/**
 * SDR Queue Preview API
 *
 * GET  /api/sdr/sending/queue-preview  — Get pending contacts with messages
 * PUT  /api/sdr/sending/queue-preview  — Update a contact's message before sending
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSDRById } from '@/lib/sdr-auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET — Fetch pending contacts with their messages for SDR review
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const sdrId = authHeader?.replace('Bearer ', '');

    if (!sdrId) {
      return NextResponse.json({ error: 'SDR ID required' }, { status: 401 });
    }

    const sdr = await getSDRById(sdrId);
    if (!sdr || !sdr.is_active) {
      return NextResponse.json(
        { error: 'SDR not found or inactive' },
        { status: 404 }
      );
    }

    // Fetch pending contacts for this SDR with message content
    const { data: pendingContacts, error } = await supabaseAdmin
      .from('campaign_contacts')
      .select(
        `id, nome, empresa, cargo, phone, email, status, personalized_message,
         scheduled_send_at, niche, site, dor_especifica, pain_points,
         business_quality_score, business_quality_tier, lead_gen_id,
         analysis_image_url, landing_page_url, report_url,
         campaigns ( id, name )`
      )
      .eq('assigned_sdr_id', sdrId)
      .eq('status', 'pending')
      .order('scheduled_send_at', { ascending: true, nullsFirst: false })
      .limit(50);

    if (error) {
      console.error('[Queue Preview] Error fetching contacts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contacts: (pendingContacts || []).map((c: Record<string, unknown>) => ({
        id: c.id,
        nome: c.nome,
        empresa: c.empresa,
        cargo: c.cargo,
        phone: c.phone,
        email: c.email,
        status: c.status,
        personalized_message: c.personalized_message || '',
        scheduled_send_at: c.scheduled_send_at,
        niche: c.niche,
        site: c.site,
        dor_especifica: c.dor_especifica,
        pain_points: c.pain_points,
        business_quality_score: c.business_quality_score,
        business_quality_tier: c.business_quality_tier,
        lead_gen_id: c.lead_gen_id,
        has_images: !!(c.analysis_image_url || c.landing_page_url),
        has_report: !!c.report_url,
        campaign: c.campaigns || null,
      })),
      total: (pendingContacts || []).length,
    });
  } catch (error) {
    console.error('[Queue Preview] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT — Update a pending contact's message before automated sending
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const sdrId = authHeader?.replace('Bearer ', '');

    if (!sdrId) {
      return NextResponse.json({ error: 'SDR ID required' }, { status: 401 });
    }

    const sdr = await getSDRById(sdrId);
    if (!sdr || !sdr.is_active) {
      return NextResponse.json(
        { error: 'SDR not found or inactive' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { contactId, personalized_message } = body as {
      contactId: string;
      personalized_message: string;
    };

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId is required' },
        { status: 400 }
      );
    }

    if (!personalized_message || !personalized_message.trim()) {
      return NextResponse.json(
        { error: 'personalized_message is required' },
        { status: 400 }
      );
    }

    // Verify the contact is assigned to this SDR and is pending
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, assigned_sdr_id, status')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    if (contact.assigned_sdr_id !== sdrId && sdr.role !== 'admin' && sdr.role !== 'manager') {
      return NextResponse.json(
        { error: 'Access denied - contact not assigned to you' },
        { status: 403 }
      );
    }

    if (contact.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only edit messages for pending contacts' },
        { status: 400 }
      );
    }

    // Update the personalized_message
    const { error: updateError } = await supabaseAdmin
      .from('campaign_contacts')
      .update({
        personalized_message: personalized_message.trim(),
      })
      .eq('id', contactId);

    if (updateError) {
      console.error('[Queue Preview] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully',
      contactId,
    });
  } catch (error) {
    console.error('[Queue Preview] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
