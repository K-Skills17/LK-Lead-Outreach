import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/emails/history
 * Get email history for all leads (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.ADMIN_DASHBOARD_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('contactId'); // Optional: filter by specific contact
    const sdrId = searchParams.get('sdrId'); // Optional: filter by SDR
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Build query - get all emails with related data
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
        ),
        sdr_users:assigned_sdr_id (
          id,
          name,
          email
        )
      `)
      .order('sent_at', { ascending: false })
      .limit(limit);

    // Filter by contact if provided
    if (contactId) {
      query = query.eq('campaign_contact_id', contactId);
    }

    // Filter by SDR if provided
    if (sdrId) {
      query = query.eq('assigned_sdr_id', sdrId);
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error('[Admin Email History] Error:', error);
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

    // Get summary statistics
    const totalEmails = emailsWithEvents.length;
    const openedEmails = emailsWithEvents.filter(e => e.is_opened).length;
    const clickedEmails = emailsWithEvents.filter(e => e.is_clicked).length;
    const bouncedEmails = emailsWithEvents.filter(e => e.is_bounced).length;
    const totalOpens = emailsWithEvents.reduce((sum, e) => sum + (e.open_count || 0), 0);
    const totalClicks = emailsWithEvents.reduce((sum, e) => sum + (e.click_count || 0), 0);
    const avgOpenRate = totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0;
    const avgClickRate = totalEmails > 0 ? (clickedEmails / totalEmails) * 100 : 0;

    return NextResponse.json({
      success: true,
      emails: emailsWithEvents,
      count: emailsWithEvents.length,
      stats: {
        totalEmails,
        openedEmails,
        clickedEmails,
        bouncedEmails,
        totalOpens,
        totalClicks,
        avgOpenRate: Math.round(avgOpenRate * 100) / 100,
        avgClickRate: Math.round(avgClickRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error('[Admin Email History] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
