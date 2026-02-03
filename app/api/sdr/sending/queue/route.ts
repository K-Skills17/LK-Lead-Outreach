/**
 * SDR Sending Queue API
 * 
 * Get queue status and statistics for SDR's assigned leads
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSDRById } from '@/lib/sdr-auth';
import {
  canContactLead,
  DEFAULT_HUMAN_BEHAVIOR_SETTINGS,
  isWithinWorkingHours,
  getDailyMessageCount,
} from '@/lib/human-behavior-service';
import { shouldSkipDay } from '@/lib/send-time-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/sdr/sending/queue
 * Get queue status and statistics for SDR
 */
export async function GET(request: NextRequest) {
  try {
    // Verify SDR token
    const authHeader = request.headers.get('authorization');
    const sdrId = authHeader?.replace('Bearer ', '');
    
    if (!sdrId) {
      return NextResponse.json(
        { error: 'SDR ID required' },
        { status: 401 }
      );
    }

    // Verify SDR exists
    const sdr = await getSDRById(sdrId);
    if (!sdr || !sdr.is_active) {
      return NextResponse.json(
        { error: 'SDR not found or inactive' },
        { status: 404 }
      );
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = shouldSkipDay(dayOfWeek);

    // Get pending contacts for this SDR
    const { data: pendingContacts, error: contactsError } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, phone, email, status, assigned_sdr_id')
      .eq('assigned_sdr_id', sdrId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (contactsError) {
      console.error('[SDR Sending Queue] Error fetching contacts:', contactsError);
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    const readyContacts: any[] = [];
    const skippedContacts = {
      tooRecent: 0,
      weekend: 0,
      outsideHours: 0,
    };

    const isWorkingHours = isWithinWorkingHours(DEFAULT_HUMAN_BEHAVIOR_SETTINGS, now);

    if (isWeekend) {
      skippedContacts.weekend = pendingContacts?.length || 0;
    } else if (!isWorkingHours) {
      skippedContacts.outsideHours = pendingContacts?.length || 0;
    } else {
      // Check contact frequency for each contact
      for (const contact of pendingContacts || []) {
        const contactCheck = await canContactLead(
          contact.phone,
          contact.email || undefined,
          DEFAULT_HUMAN_BEHAVIOR_SETTINGS.daysSinceLastContact
        );

        if (contactCheck.canContact) {
          readyContacts.push(contact);
        } else {
          skippedContacts.tooRecent++;
        }
      }
    }

    // Get daily message count for this SDR
    const dailyCount = await getDailyMessageCount(sdrId, undefined, now);

    // Get sending control state for this SDR
    const { data: controlState } = await supabaseAdmin
      .from('sending_control_state')
      .select('*')
      .eq('is_running', true)
      .eq('sdr_id', sdrId)
      .maybeSingle();

    return NextResponse.json({
      totalPending: pendingContacts?.length || 0,
      readyToSend: readyContacts.length,
      skipped: skippedContacts,
      dailyCount,
      dailyLimit: DEFAULT_HUMAN_BEHAVIOR_SETTINGS.dailyLimit,
      remainingDaily: Math.max(0, DEFAULT_HUMAN_BEHAVIOR_SETTINGS.dailyLimit - dailyCount),
      isWeekend,
      isWorkingHours,
      currentTime: now.toISOString(),
      controlState: controlState ? {
        isRunning: controlState.is_running,
        isPaused: controlState.is_paused,
        messagesSentToday: controlState.messages_sent_today || 0,
        messagesSentSession: controlState.messages_sent_session || 0,
        sessionStartedAt: controlState.session_started_at,
        lastMessageSentAt: controlState.last_message_sent_at,
      } : null,
    });
  } catch (error) {
    console.error('[SDR Sending Queue] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
