/**
 * WhatsApp Send History Endpoint
 * 
 * Returns WhatsApp send history for contacts, SDRs, or campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppSendHistory } from '@/lib/whatsapp-sending-service';
import { getSDRById } from '@/lib/sdr-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/whatsapp/history
 * Get WhatsApp send history
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // Check if admin token
    const isAdmin = token === process.env.ADMIN_DASHBOARD_TOKEN;
    
    // Check if SDR token
    let sdrId: string | undefined;
    if (!isAdmin && token) {
      try {
        const sdr = await getSDRById(token);
        if (sdr && sdr.is_active) {
          sdrId = sdr.id;
        }
      } catch (error) {
        // Not an SDR ID
      }
    }

    if (!isAdmin && !sdrId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get('contactId');
    const campaignId = searchParams.get('campaignId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // If SDR, only show their sends
    const history = await getWhatsAppSendHistory({
      contactId: contactId || undefined,
      sdrId: sdrId || undefined, // SDRs only see their own sends
      campaignId: campaignId || undefined,
      limit,
    });

    // Calculate stats
    const total = history.length;
    const delivered = history.filter((h: any) => h.is_delivered).length;
    const read = history.filter((h: any) => h.is_read).length;
    const auto = history.filter((h: any) => h.sent_by_system).length;
    const manual = history.filter((h: any) => !h.sent_by_system).length;

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
      stats: {
        total,
        delivered,
        read,
        auto,
        manual,
      },
    });
  } catch (error) {
    console.error('[WhatsApp History] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
