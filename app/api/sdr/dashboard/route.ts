import { NextRequest, NextResponse } from 'next/server';
import { getSDRById, getSDRCampaigns, getSDRLeads, getSDRUnreadReplies } from '@/lib/sdr-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sdr/dashboard
 * 
 * Get SDR dashboard data (campaigns, leads, replies)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const sdrId = authHeader?.replace('Bearer ', '') || 
                  new URL(request.url).searchParams.get('sdrId');

    if (!sdrId) {
      return NextResponse.json(
        { error: 'SDR ID required' },
        { status: 401 }
      );
    }

    // Verify SDR exists
    const sdr = await getSDRById(sdrId);
    if (!sdr) {
      return NextResponse.json(
        { error: 'SDR not found' },
        { status: 404 }
      );
    }

    // Get dashboard data
    const [campaigns, allLeads, pendingLeads, sentLeads, unreadReplies] = await Promise.all([
      getSDRCampaigns(sdrId),
      getSDRLeads(sdrId),
      getSDRLeads(sdrId, 'pending'),
      getSDRLeads(sdrId, 'sent'),
      getSDRUnreadReplies(sdrId),
    ]);

    return NextResponse.json({
      sdr: {
        id: sdr.id,
        name: sdr.name,
        email: sdr.email,
        role: sdr.role,
      },
      stats: {
        totalCampaigns: campaigns.length,
        totalLeads: allLeads.length,
        pendingLeads: pendingLeads.length,
        sentLeads: sentLeads.length,
        unreadReplies: unreadReplies.length,
      },
      campaigns,
      recentLeads: allLeads.slice(0, 20),
      unreadReplies,
    });
  } catch (error) {
    console.error('[SDR Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
