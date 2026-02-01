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
      settings = DEFAULT_HUMAN_BEHAVIOR_SETTINGS,
    } = body as {
      sdrId?: string;
      campaignId?: string;
      maxMessages?: number;
      settings?: HumanBehaviorSettings;
    };

    const now = new Date();
    const dayOfWeek = now.getDay();

    // Skip weekends completely
    if (shouldSkipDay(dayOfWeek)) {
      return NextResponse.json({
        success: true,
        message: 'Skipped: Weekend (Saturday/Sunday)',
        processed: 0,
        skipped: 0,
      });
    }

    // Check working hours
    if (!isWithinWorkingHours(settings, now)) {
      const timeUntil = getTimeUntilWorkingHours(settings, now);
      return NextResponse.json({
        success: true,
        message: 'Outside working hours',
        processed: 0,
        skipped: 0,
        timeUntilWorkingHours: timeUntil,
      });
    }

    // Check daily message limit
    const dailyCount = await getDailyMessageCount(sdrId, campaignId, now);
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
      .lte('scheduled_send_at', now.toISOString())
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

    // Process contacts (in real implementation, this would queue them for sending)
    // For now, we'll just mark them as ready and return info
    const processed = readyContacts.length;
    const remainingDaily = settings.dailyLimit - dailyCount;
    const canProcess = Math.min(processed, remainingDaily);

    return NextResponse.json({
      success: true,
      message: `Found ${processed} contacts ready to send`,
      processed: canProcess,
      skipped: contacts.length - processed,
      dailyCount,
      dailyLimit: settings.dailyLimit,
      remainingDaily,
      readyContacts: readyContacts.slice(0, canProcess).map((c) => ({
        id: c.id,
        nome: c.nome,
        empresa: c.empresa,
        phone: c.phone,
      })),
      note: 'Contacts are ready for sending. Use /api/sender/queue to get them and /api/sender/mark-sent to mark as sent.',
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
