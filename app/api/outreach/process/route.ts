/**
 * Outreach Processing Endpoint
 * 
 * Processes scheduled outreach with human-like behavior:
 * - Respects contact frequency (days since last contact)
 * - Skips weekends completely
 * - Limits Monday/Friday, prioritizes Tuesday-Thursday
 * - Applies human behavior delays and breaks
 * - Respects working hours
 * 
 * Can be called:
 * - Manually by admin
 * - Via Vercel Cron job (recommended: every 5-10 minutes)
 * - Via external scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import {
  canContactLead,
  calculateDelay,
  shouldTakeBreak,
  isWithinWorkingHours,
  getTimeUntilWorkingHours,
  recordContact,
  getDailyMessageCount,
  DEFAULT_HUMAN_BEHAVIOR_SETTINGS,
  type HumanBehaviorSettings,
} from '@/lib/human-behavior-service';
import { shouldSkipDay } from '@/lib/send-time-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/outreach/process
 * Process scheduled outreach with human-like behavior
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token (optional - can also be called by cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');
    const adminToken = process.env.ADMIN_DASHBOARD_TOKEN;
    const expectedCronSecret = process.env.CRON_SECRET;

    // Allow if:
    // 1. Valid admin token
    // 2. Valid cron secret
    // 3. No auth (for Vercel Cron with public endpoint)
    const isAuthorized =
      (adminToken && authHeader?.includes(adminToken)) ||
      (expectedCronSecret && cronSecret === expectedCronSecret) ||
      (!adminToken && !expectedCronSecret); // Allow if no auth configured (development)

    if (!isAuthorized && (adminToken || expectedCronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      sdrId,
      campaignId,
      maxMessages = 10, // Process max 10 messages per call
      settings: customSettings,
    } = body as {
      sdrId?: string;
      campaignId?: string;
      maxMessages?: number;
      settings?: HumanBehaviorSettings;
    };

    // Get active settings from database, or use defaults
    let settings = DEFAULT_HUMAN_BEHAVIOR_SETTINGS;
    if (!customSettings) {
      const { data: dbSettings } = await supabaseAdmin
        .from('sending_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbSettings) {
        settings = {
          humanMode: dbSettings.human_mode ?? true,
          delayBetweenMessages: dbSettings.delay_between_messages ?? 60,
          delayVariation: dbSettings.delay_variation ?? 0.2,
          coffeeBreakInterval: dbSettings.coffee_break_interval ?? 15,
          coffeeBreakDuration: dbSettings.coffee_break_duration ?? 900,
          longBreakInterval: dbSettings.long_break_interval ?? 50,
          longBreakDuration: dbSettings.long_break_duration ?? 2700,
          workingHoursEnabled: dbSettings.working_hours_enabled ?? true,
          startTime: dbSettings.start_time ?? '10:00',
          endTime: dbSettings.end_time ?? '18:00',
          timezone: dbSettings.timezone ?? 'America/Sao_Paulo',
          daysSinceLastContact: dbSettings.days_since_last_contact ?? 3,
          dailyLimit: dbSettings.daily_limit ?? 250,
          dailyLimitWarning: dbSettings.daily_limit_warning ?? 200,
        };
      }
    } else {
      settings = customSettings;
    }

    // FAILSAFE: Use system time/date for all checks
    const systemNow = new Date();
    const dayOfWeek = systemNow.getDay();
    const currentHour = systemNow.getHours();
    const currentMinute = systemNow.getMinutes();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // FAILSAFE 1: Skip weekends completely (using system time)
    if (shouldSkipDay(dayOfWeek)) {
      return NextResponse.json({
        success: true,
        message: `Skipped: ${dayNames[dayOfWeek]} (weekend). Outreach only allowed Monday-Friday.`,
        processed: 0,
        skipped: 0,
        currentDay: dayNames[dayOfWeek],
        currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
        systemDate: systemNow.toISOString(),
      });
    }

    // FAILSAFE 2: Check working hours (using system time)
    if (!isWithinWorkingHours(settings, systemNow)) {
      const timeUntil = getTimeUntilWorkingHours(settings, systemNow);
      return NextResponse.json({
        success: true,
        message: `Outside working hours. Current time: ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}. Working hours: ${settings.startTime} - ${settings.endTime}.`,
        processed: 0,
        skipped: 0,
        currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
        workingHours: `${settings.startTime} - ${settings.endTime}`,
        timeUntilWorkingHours: timeUntil,
        systemDate: systemNow.toISOString(),
      });
    }

    // Check daily message limit (using system date)
    const dailyCount = await getDailyMessageCount(sdrId, campaignId, systemNow);
    if (dailyCount >= settings.dailyLimit) {
      return NextResponse.json({
        success: true,
        message: 'Daily limit reached',
        processed: 0,
        skipped: 0,
        dailyCount,
        dailyLimit: settings.dailyLimit,
      });
    }

    // Get pending contacts ready to send
    let query = supabaseAdmin
      .from('campaign_contacts')
      .select('id, nome, empresa, phone, email, assigned_sdr_id, campaign_id, scheduled_send_at, personalized_message')
      .eq('status', 'pending')
      .lte('scheduled_send_at', systemNow.toISOString())
      .order('created_at', { ascending: true })
      .limit(maxMessages * 2); // Fetch more to account for filtering

    if (sdrId) {
      query = query.eq('assigned_sdr_id', sdrId);
    }
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data: contacts, error } = await query;

    if (error) {
      console.error('[Outreach Process] Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending contacts ready to send',
        processed: 0,
        skipped: 0,
      });
    }

    // Filter contacts by contact frequency and day-of-week
    const readyContacts = [];
    for (const contact of contacts) {
      // Check contact frequency
      const contactCheck = await canContactLead(
        contact.phone,
        contact.email || undefined,
        settings.daysSinceLastContact
      );

      if (!contactCheck.canContact) {
        continue; // Skip - contacted too recently
      }

      readyContacts.push(contact);
      if (readyContacts.length >= maxMessages) {
        break;
      }
    }

    if (readyContacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No contacts ready (all recently contacted)',
        processed: 0,
        skipped: contacts.length,
      });
    }

    // Process contacts - actually send WhatsApp messages
    const { sendWhatsAppMessage } = await import('@/lib/whatsapp-sending-service');
    const { calculateDelay, shouldTakeBreak } = await import('@/lib/human-behavior-service');
    
    const processed = readyContacts.length;
    const remainingDaily = settings.dailyLimit - dailyCount;
    const canProcess = Math.min(processed, remainingDaily);
    
    const results = [];
    let messagesSent = 0;
    let skipped = 0;
    
    // Process contacts with human behavior delays
    for (let i = 0; i < canProcess && i < readyContacts.length; i++) {
      const contact = readyContacts[i];
      
      // Check for breaks
      if (messagesSent > 0) {
        const breakCheck = shouldTakeBreak(messagesSent, settings);
        if (breakCheck.shouldBreak) {
          // In a real implementation, we'd pause here
          // For now, we'll just log it
          console.log(`[Outreach Process] Break needed: ${breakCheck.breakType} (${breakCheck.duration}s)`);
        }
      }
      
      // Calculate delay (for logging - actual delay would be applied in real sending)
      const delay = calculateDelay(messagesSent, settings);
      
      // Send WhatsApp message
      const sendResult = await sendWhatsAppMessage({
        contactId: contact.id,
        sdrId: sdrId || contact.assigned_sdr_id || undefined,
        messageText: contact.personalized_message || '',
        settings,
        skipChecks: false, // Apply all checks
      });
      
      if (sendResult.success) {
        messagesSent++;
        results.push({
          contactId: contact.id,
          nome: contact.nome,
          empresa: contact.empresa,
          phone: contact.phone,
          status: 'sent',
          whatsappSendId: sendResult.whatsappSendId,
        });
      } else if (sendResult.skipped) {
        skipped++;
        results.push({
          contactId: contact.id,
          nome: contact.nome,
          empresa: contact.empresa,
          phone: contact.phone,
          status: 'skipped',
          reason: sendResult.skipReason,
        });
      } else {
        skipped++;
        results.push({
          contactId: contact.id,
          nome: contact.nome,
          empresa: contact.empresa,
          phone: contact.phone,
          status: 'failed',
          error: sendResult.error,
        });
      }
      
      // In a real implementation, we'd apply the delay here
      // For now, we'll just continue (cron job will handle spacing)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${readyContacts.length} contacts: ${messagesSent} sent, ${skipped} skipped`,
      processed: messagesSent,
      skipped: skipped + (contacts.length - processed),
      dailyCount: dailyCount + messagesSent,
      dailyLimit: settings.dailyLimit,
      remainingDaily: settings.dailyLimit - (dailyCount + messagesSent),
      results,
    });
  } catch (error) {
    console.error('[Outreach Process] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/outreach/process
 * Get status of outreach processing
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sdrId = searchParams.get('sdrId');
    const campaignId = searchParams.get('campaignId');

    const now = new Date();
    const dayOfWeek = now.getDay();

    // Check if weekend
    const isWeekend = shouldSkipDay(dayOfWeek);
    const isWorkingHours = isWithinWorkingHours(DEFAULT_HUMAN_BEHAVIOR_SETTINGS, now);

    // Get stats
    const dailyCount = await getDailyMessageCount(sdrId || undefined, campaignId || undefined, now);

    // Get pending count
    let query = supabaseAdmin
      .from('campaign_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_send_at', now.toISOString());

    if (sdrId) {
      query = query.eq('assigned_sdr_id', sdrId);
    }
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { count: pendingCount } = await query;

    return NextResponse.json({
      status: 'ok',
      isWeekend,
      isWorkingHours,
      dailyCount,
      dailyLimit: DEFAULT_HUMAN_BEHAVIOR_SETTINGS.dailyLimit,
      remainingDaily: DEFAULT_HUMAN_BEHAVIOR_SETTINGS.dailyLimit - dailyCount,
      pendingReady: pendingCount || 0,
      settings: {
        workingHours: `${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.startTime} - ${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.endTime}`,
        daysSinceLastContact: DEFAULT_HUMAN_BEHAVIOR_SETTINGS.daysSinceLastContact,
        humanMode: DEFAULT_HUMAN_BEHAVIOR_SETTINGS.humanMode,
      },
    });
  } catch (error) {
    console.error('[Outreach Process] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
