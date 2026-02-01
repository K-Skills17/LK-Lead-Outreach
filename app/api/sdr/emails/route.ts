import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSDRById } from '@/lib/sdr-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sdr/emails
 * Get email history for leads assigned to the authenticated SDR
 */
export async function GET(request: NextRequest) {
  try {
    // Get SDR ID from Authorization header
    const authHeader = request.headers.get('authorization');
    const sdrId = authHeader?.replace('Bearer ', '');

    if (!sdrId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify SDR exists and is active
    const sdr = await getSDRById(sdrId);
    if (!sdr || !sdr.is_active) {
      return NextResponse.json(
        { error: 'Invalid SDR' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('contactId'); // Optional: filter by specific contact

    // Build query - explicitly select all columns including open_count, click_count, clicked_urls
    let query = supabaseAdmin
      .from('email_sends')
      .select(`
        id,
        campaign_contact_id,
        lead_email,
        lead_name,
        lead_company,
        assigned_sdr_id,
        subject,
        html_content,
        text_content,
        from_email,
        reply_to,
        resend_email_id,
        sent_at,
        delivered_at,
        opened_at,
        clicked_at,
        bounced_at,
        complaint_at,
        open_count,
        last_opened_at,
        first_opened_at,
        click_count,
        last_clicked_at,
        first_clicked_at,
        clicked_urls,
        is_delivered,
        is_opened,
        is_clicked,
        is_bounced,
        is_complained,
        sent_by_admin_id,
        sent_by_admin_email,
        campaign_id,
        created_at,
        updated_at,
        campaign_contacts (
          id,
          nome,
          empresa,
          phone,
          email
        ),
        campaigns (
          id,
          name
        )
      `)
      .eq('assigned_sdr_id', sdrId)
      .order('sent_at', { ascending: false });

    // Filter by contact if provided
    if (contactId) {
      query = query.eq('campaign_contact_id', contactId);
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error('[SDR Emails] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch emails' },
        { status: 500 }
      );
    }

    // Get event details for each email
    const emailsWithEvents = await Promise.all(
      (emails || []).map(async (email: any) => {
        const { data: events } = await supabaseAdmin
          .from('email_events')
          .select('*')
          .eq('email_send_id', email.id)
          .order('occurred_at', { ascending: false });

        return {
          ...email,
          events: events || [],
        };
      })
    );

    return NextResponse.json({
      success: true,
      emails: emailsWithEvents,
      count: emailsWithEvents.length,
    });
  } catch (error) {
    console.error('[SDR Emails] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
