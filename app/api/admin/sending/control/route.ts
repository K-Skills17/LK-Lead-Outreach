/**
 * Sending Control API
 * 
 * Manages starting, stopping, pausing, and resuming automated sending
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/sending/control
 * Get current sending control state
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

    // Get current state
    const { data: state, error } = await supabaseAdmin
      .from('sending_control_state')
      .select('*')
      .eq('is_running', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Sending Control] Error fetching state:', error);
      return NextResponse.json(
        { error: 'Failed to fetch state' },
        { status: 500 }
      );
    }

    // If no active state, return default
    if (!state) {
      return NextResponse.json({
        isRunning: false,
        isPaused: false,
        messagesSentToday: 0,
        messagesSentSession: 0,
        sessionStartedAt: null,
        lastMessageSentAt: null,
      });
    }

    return NextResponse.json({
      isRunning: state.is_running,
      isPaused: state.is_paused,
      pausedUntil: state.paused_until,
      messagesSentToday: state.messages_sent_today || 0,
      messagesSentSession: state.messages_sent_session || 0,
      sessionStartedAt: state.session_started_at,
      sessionEndedAt: state.session_ended_at,
      lastMessageSentAt: state.last_message_sent_at,
      lastError: state.last_error,
      lastErrorAt: state.last_error_at,
      settingsId: state.settings_id,
      sdrId: state.sdr_id,
      campaignId: state.campaign_id,
    });
  } catch (error) {
    console.error('[Sending Control] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sending/control
 * Start, stop, pause, or resume sending
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, settingsId, sdrId, campaignId } = body as {
      action: 'start' | 'stop' | 'pause' | 'resume';
      settingsId?: string;
      sdrId?: string;
      campaignId?: string;
    };

    if (!action || !['start', 'stop', 'pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: start, stop, pause, or resume' },
        { status: 400 }
      );
    }

    // Get current state
    const { data: currentState } = await supabaseAdmin
      .from('sending_control_state')
      .select('*')
      .eq('is_running', true)
      .maybeSingle();

    let result;

    switch (action) {
      case 'start':
        // Stop any existing session
        if (currentState) {
          await supabaseAdmin
            .from('sending_control_state')
            .update({
              is_running: false,
              is_paused: false,
              session_ended_at: new Date().toISOString(),
            })
            .eq('id', currentState.id);
        }

        // Get default settings if not provided
        const defaultSettingsId = settingsId || (await supabaseAdmin
          .from('sending_settings')
          .select('id')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()).data?.id;

        // Create new session
        const { data: newState, error: startError } = await supabaseAdmin
          .from('sending_control_state')
          .insert({
            is_running: true,
            is_paused: false,
            session_started_at: new Date().toISOString(),
            messages_sent_session: 0,
            settings_id: defaultSettingsId,
            sdr_id: sdrId || null,
            campaign_id: campaignId || null,
          })
          .select()
          .single();

        if (startError) {
          console.error('[Sending Control] Error starting:', startError);
          return NextResponse.json(
            { error: 'Failed to start sending' },
            { status: 500 }
          );
        }

        result = { success: true, message: 'Sending started', state: newState };
        break;

      case 'stop':
        if (!currentState) {
          return NextResponse.json(
            { error: 'No active sending session to stop' },
            { status: 400 }
          );
        }

        const { error: stopError } = await supabaseAdmin
          .from('sending_control_state')
          .update({
            is_running: false,
            is_paused: false,
            session_ended_at: new Date().toISOString(),
          })
          .eq('id', currentState.id);

        if (stopError) {
          console.error('[Sending Control] Error stopping:', stopError);
          return NextResponse.json(
            { error: 'Failed to stop sending' },
            { status: 500 }
          );
        }

        result = { success: true, message: 'Sending stopped' };
        break;

      case 'pause':
        if (!currentState) {
          return NextResponse.json(
            { error: 'No active sending session to pause' },
            { status: 400 }
          );
        }

        const pauseDuration = body.pauseDuration || 3600; // Default 1 hour
        const pausedUntil = new Date(Date.now() + pauseDuration * 1000).toISOString();

        const { error: pauseError } = await supabaseAdmin
          .from('sending_control_state')
          .update({
            is_paused: true,
            paused_until: pausedUntil,
          })
          .eq('id', currentState.id);

        if (pauseError) {
          console.error('[Sending Control] Error pausing:', pauseError);
          return NextResponse.json(
            { error: 'Failed to pause sending' },
            { status: 500 }
          );
        }

        result = { success: true, message: 'Sending paused', pausedUntil };
        break;

      case 'resume':
        if (!currentState) {
          return NextResponse.json(
            { error: 'No active sending session to resume' },
            { status: 400 }
          );
        }

        const { error: resumeError } = await supabaseAdmin
          .from('sending_control_state')
          .update({
            is_paused: false,
            paused_until: null,
          })
          .eq('id', currentState.id);

        if (resumeError) {
          console.error('[Sending Control] Error resuming:', resumeError);
          return NextResponse.json(
            { error: 'Failed to resume sending' },
            { status: 500 }
          );
        }

        result = { success: true, message: 'Sending resumed' };
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Sending Control] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
