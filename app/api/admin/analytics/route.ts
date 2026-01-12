import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/admin/analytics
 * Fetch analytics data for admin dashboard
 * Protected by admin token
 */
export async function GET(request: NextRequest) {
  // Simple authentication - check for admin token
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_DASHBOARD_TOKEN;

  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Fetch overview stats
    const results = await Promise.all([
      supabaseAdmin
        .from('page_views')
        .select('session_id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('downloads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('downloads')
        .select('*', { count: 'exact', head: true })
        .eq('plan_type', 'free')
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('downloads')
        .select('*', { count: 'exact', head: true })
        .eq('plan_type', 'professional')
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('downloads')
        .select('*', { count: 'exact', head: true })
        .eq('plan_type', 'premium')
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('payment_events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'initiated')
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('payment_events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString()),
    ]);

    // Extract counts with null safety
    const totalVisitors = results[0].count ?? 0;
    const totalLeads = results[1].count ?? 0;
    const completedLeads = results[2].count ?? 0;
    const totalDownloads = results[3].count ?? 0;
    const freeDownloads = results[4].count ?? 0;
    const professionalDownloads = results[5].count ?? 0;
    const premiumDownloads = results[6].count ?? 0;
    const paymentsInitiated = results[7].count ?? 0;
    const paymentsCompleted = results[8].count ?? 0;

    // Get unique visitors
    const { data: uniqueVisitorsData } = await supabaseAdmin
      .from('page_views')
      .select('session_id')
      .gte('created_at', startDate.toISOString());
    
    const uniqueVisitors = new Set(uniqueVisitorsData?.map(v => v.session_id)).size;

    // Get daily breakdown
    const { data: dailyData } = await supabaseAdmin
      .rpc('get_daily_analytics', {
        start_date: startDate.toISOString(),
      })
      .limit(parseInt(period));

    // Get recent leads
    const { data: recentLeads } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get form abandonment data
    const { data: abandonedLeads } = await supabaseAdmin
      .from('leads')
      .select('*')
      .in('status', ['started', 'step1', 'step2'])
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate conversion rates
    const leadToDownloadRate = totalLeads > 0 ? (totalDownloads / totalLeads * 100).toFixed(2) : 0;
    const visitorToLeadRate = uniqueVisitors > 0 ? (totalLeads / uniqueVisitors * 100).toFixed(2) : 0;
    const downloadToPaymentRate = totalDownloads > 0 ? (paymentsCompleted / totalDownloads * 100).toFixed(2) : 0;

    // Get revenue data
    const { data: revenueData } = await supabaseAdmin
      .from('payment_events')
      .select('amount, plan_type, created_at')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + parseFloat(payment.amount || '0'), 0) || 0;

    return NextResponse.json({
      overview: {
        totalVisitors,
        uniqueVisitors,
        totalLeads,
        completedLeads,
        abandonedLeads: totalLeads - completedLeads,
        totalDownloads,
        freeDownloads,
        professionalDownloads,
        premiumDownloads,
        paymentsInitiated,
        paymentsCompleted,
        totalRevenue: totalRevenue.toFixed(2),
      },
      conversionRates: {
        visitorToLead: visitorToLeadRate,
        leadToDownload: leadToDownloadRate,
        downloadToPayment: downloadToPaymentRate,
      },
      dailyData: dailyData || [],
      recentLeads: recentLeads || [],
      abandonedLeads: abandonedLeads || [],
    });
  } catch (error) {
    console.error('[Admin] Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
