/**
 * Sending Queue Status API
 * 
 * Get queue status and pending messages count
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { canContactLead, getDailyMessageCount, DEFAULT_HUMAN_BEHAVIOR_SETTINGS, isWithinWorkingHours } from '@/lib/human-behavior-service';
import { shouldSkipDay } from '@/lib/send-time-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/sending/queue
 * Get queue status and statistics
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

    const searchParams = request.nextUrl.searchParams;
    const sdrId = searchParams.get('sdrId');
    const campaignId = searchParams.get('campaignId');

    const now = new Date();
    const dayOfWeek = now.getDay();

    // Get pending contacts count
    let query = supabaseAdmin
      .from('campaign_contacts')
      .select('id, scheduled_send_at, phone, email, assigned_sdr_id, campaign_id', { count: 'exact', head: false })
      .eq('status', 'pending')
      .lte('scheduled_send_at', now.toISOString());

    if (sdrId) {
      query = query.eq('assigned_sdr_id', sdrId);
    }
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: pendingContacts, error } = await query;

    if (error) {
      console.error('[Sending Queue] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    // Filter by contact frequency and day-of-week
    const readyContacts = [];
    const skippedContacts = {
      tooRecent: 0,
      weekend: 0,
      outsideHours: 0,
    };

    // Check if weekend
    const isWeekend = shouldSkipDay(dayOfWeek);
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

    // Get daily message count
    const dailyCount = await getDailyMessageCount(sdrId || undefined, campaignId || undefined, now);

    // Get sending control state
    const { data: controlState } = await supabaseAdmin
      .from('sending_control_state')
      .select('*')
      .eq('is_running', true)
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
    console.error('[Sending Queue] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
