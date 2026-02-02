import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/emails/analytics
 * Get email analytics including A/B test results
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

    const { searchParams } = new URL(request.url);
    const abTestId = searchParams.get('abTestId');
    const campaignId = searchParams.get('campaignId');

    if (abTestId) {
      // Get A/B test analytics
      const { data: test } = await supabaseAdmin
        .from('ab_test_campaigns')
        .select('*')
        .eq('id', abTestId)
        .single();

      if (!test) {
        return NextResponse.json(
          { error: 'A/B test not found' },
          { status: 404 }
        );
      }

      // Get all email sends for this test
      const { data: emailSends } = await supabaseAdmin
        .from('email_sends')
        .select('id, ab_test_variant_name, open_count, click_count, is_opened, is_clicked')
        .eq('ab_test_id', abTestId);

      // Get all email events
      const { data: emailEvents } = await supabaseAdmin
        .from('email_events')
        .select('event_type, event_data')
        .in('email_send_id', emailSends?.map(e => e.id) || []);

      // Get email responses
      const { data: responses } = await supabaseAdmin
        .from('email_responses')
        .select('*')
        .eq('ab_test_id', abTestId);

      // Calculate stats per variant
      const variants = (test.variants as any[]) || [];
      const variantStats = variants.map(variant => {
        const variantSends = emailSends?.filter(e => e.ab_test_variant_name === variant.name) || [];
        const variantOpens = variantSends.filter(e => e.is_opened).length;
        const variantClicks = variantSends.filter(e => e.is_clicked).length;
        const variantReplies = responses?.filter(r => r.ab_test_variant_name === variant.name && r.response_type === 'reply').length || 0;
        const variantBookings = responses?.filter(r => r.ab_test_variant_name === variant.name && r.response_type === 'booking').length || 0;

        return {
          variant_name: variant.name,
          sent: variantSends.length,
          opened: variantOpens,
          clicked: variantClicks,
          replied: variantReplies,
          booked: variantBookings,
          open_rate: variantSends.length > 0 ? (variantOpens / variantSends.length) * 100 : 0,
          click_rate: variantSends.length > 0 ? (variantClicks / variantSends.length) * 100 : 0,
          reply_rate: variantSends.length > 0 ? (variantReplies / variantSends.length) * 100 : 0,
          booking_rate: variantSends.length > 0 ? (variantBookings / variantSends.length) * 100 : 0,
        };
      });

      return NextResponse.json({
        success: true,
        test: {
          id: test.id,
          test_name: test.test_name,
          status: test.status,
          variants: variantStats,
          winner: test.winner_variant,
          confidence: test.confidence_level,
        },
      });
    }

    // General email analytics
    let query = supabaseAdmin
      .from('email_sends')
      .select('id, subject, sent_at, open_count, click_count, is_opened, is_clicked, ab_test_id, ab_test_variant_name');

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: emails } = await query.order('sent_at', { ascending: false }).limit(100);

    const totalSent = emails?.length || 0;
    const totalOpened = emails?.filter(e => e.is_opened).length || 0;
    const totalClicked = emails?.filter(e => e.is_clicked).length || 0;

    return NextResponse.json({
      success: true,
      analytics: {
        total_sent: totalSent,
        total_opened: totalOpened,
        total_clicked: totalClicked,
        open_rate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        click_rate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        emails: emails?.slice(0, 50), // Return first 50
      },
    });
  } catch (error) {
    console.error('[Email Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
