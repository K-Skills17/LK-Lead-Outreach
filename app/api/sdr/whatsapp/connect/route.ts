import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSDRById } from '@/lib/sdr-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/sdr/whatsapp/connect
 * Initiate WhatsApp connection process
 * Desktop app will call this to start the connection
 */
export async function POST(request: NextRequest) {
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

    // Generate a unique session ID for this connection attempt
    const sessionId = crypto.randomBytes(16).toString('hex');

    // Update SDR record with session ID (connection in progress)
    const { error: updateError } = await supabaseAdmin
      .from('sdr_users')
      .update({
        whatsapp_session_id: sessionId,
        whatsapp_connected: false, // Not connected yet, waiting for QR scan
        whatsapp_qr_code: null, // Clear any old QR code
      })
      .eq('id', sdrId);

    if (updateError) {
      console.error('[WhatsApp Connect] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to initiate connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Connection initiated. WhatsApp Web will open in your browser.',
      instructions: 'WhatsApp Web will open in a new window. Scan the QR code with your WhatsApp mobile app.',
      whatsappWebUrl: 'https://web.whatsapp.com',
    });
  } catch (error) {
    console.error('[WhatsApp Connect] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sdr/whatsapp/connect
 * Update WhatsApp connection status (called by desktop app after successful connection)
 */
export async function PUT(request: NextRequest) {
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

    // Verify SDR exists
    const sdr = await getSDRById(sdrId);
    if (!sdr) {
      return NextResponse.json(
        { error: 'Invalid SDR' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, connected, sessionId } = body;

    // Update connection status
    const updateData: any = {
      whatsapp_connected: connected || false,
      whatsapp_last_seen: new Date().toISOString(),
      whatsapp_qr_code: null, // Clear QR code after connection
    };

    if (phone) {
      updateData.whatsapp_phone = phone;
    }

    if (connected) {
      updateData.whatsapp_connected_at = new Date().toISOString();
    } else {
      // If disconnecting, clear connection data
      updateData.whatsapp_phone = null;
      updateData.whatsapp_connected_at = null;
      updateData.whatsapp_session_id = null;
    }

    if (sessionId) {
      updateData.whatsapp_session_id = sessionId;
    }

    const { error: updateError } = await supabaseAdmin
      .from('sdr_users')
      .update(updateData)
      .eq('id', sdrId);

    if (updateError) {
      console.error('[WhatsApp Connect Update] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update connection status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: connected ? 'WhatsApp connected successfully' : 'WhatsApp disconnected',
    });
  } catch (error) {
    console.error('[WhatsApp Connect Update] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sdr/whatsapp/connect
 * Disconnect WhatsApp
 */
export async function DELETE(request: NextRequest) {
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

    // Verify SDR exists
    const sdr = await getSDRById(sdrId);
    if (!sdr) {
      return NextResponse.json(
        { error: 'Invalid SDR' },
        { status: 401 }
      );
    }

    // Clear connection data
    const { error: updateError } = await supabaseAdmin
      .from('sdr_users')
      .update({
        whatsapp_connected: false,
        whatsapp_phone: null,
        whatsapp_connected_at: null,
        whatsapp_session_id: null,
        whatsapp_qr_code: null,
      })
      .eq('id', sdrId);

    if (updateError) {
      console.error('[WhatsApp Disconnect] Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp disconnected successfully',
    });
  } catch (error) {
    console.error('[WhatsApp Disconnect] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
