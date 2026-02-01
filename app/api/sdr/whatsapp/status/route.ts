import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSDRById } from '@/lib/sdr-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sdr/whatsapp/status
 * Get WhatsApp connection status for the authenticated SDR
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

    // Get WhatsApp connection status
    const { data, error } = await supabaseAdmin
      .from('sdr_users')
      .select('whatsapp_connected, whatsapp_phone, whatsapp_connected_at, whatsapp_last_seen, whatsapp_session_id')
      .eq('id', sdrId)
      .single();

    if (error) {
      console.error('[WhatsApp Status] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      connected: data?.whatsapp_connected || false,
      phone: data?.whatsapp_phone || null,
      connectedAt: data?.whatsapp_connected_at || null,
      lastSeen: data?.whatsapp_last_seen || null,
      sessionId: data?.whatsapp_session_id || null,
    });
  } catch (error) {
    console.error('[WhatsApp Status] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
