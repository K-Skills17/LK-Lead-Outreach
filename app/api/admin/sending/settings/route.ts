/**
 * Sending Settings API
 * 
 * Manages cadence and behavior settings for automated sending
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const settingsSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  humanMode: z.boolean().optional(),
  delayBetweenMessages: z.number().min(5).max(600).optional(),
  delayVariation: z.number().min(0).max(1).optional(),
  coffeeBreakInterval: z.number().min(1).max(100).optional(),
  coffeeBreakDuration: z.number().min(60).max(3600).optional(),
  longBreakInterval: z.number().min(1).max(200).optional(),
  longBreakDuration: z.number().min(60).max(7200).optional(),
  workingHoursEnabled: z.boolean().optional(),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  timezone: z.string().optional(),
  daysSinceLastContact: z.number().min(1).max(30).optional(),
  dailyLimit: z.number().min(1).max(1000).optional(),
  dailyLimitWarning: z.number().min(1).max(1000).optional(),
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
});

/**
 * GET /api/admin/sending/settings
 * Get all sending settings
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

    const { data: settings, error } = await supabaseAdmin
      .from('sending_settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Sending Settings] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings: settings || [] });
  } catch (error) {
    console.error('[Sending Settings] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sending/settings
 * Create or update sending settings
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
    const validated = settingsSchema.parse(body);

    // Convert camelCase to snake_case for database
    const dbData: any = {
      name: validated.name || 'Custom Settings',
      description: validated.description || null,
      human_mode: validated.humanMode,
      delay_between_messages: validated.delayBetweenMessages,
      delay_variation: validated.delayVariation,
      coffee_break_interval: validated.coffeeBreakInterval,
      coffee_break_duration: validated.coffeeBreakDuration,
      long_break_interval: validated.longBreakInterval,
      long_break_duration: validated.longBreakDuration,
      working_hours_enabled: validated.workingHoursEnabled,
      start_time: validated.startTime,
      end_time: validated.endTime,
      timezone: validated.timezone,
      days_since_last_contact: validated.daysSinceLastContact,
      daily_limit: validated.dailyLimit,
      daily_limit_warning: validated.dailyLimitWarning,
      whatsapp_enabled: validated.whatsappEnabled,
      email_enabled: validated.emailEnabled,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key] === undefined) {
        delete dbData[key];
      }
    });

    const { data: setting, error } = await supabaseAdmin
      .from('sending_settings')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('[Sending Settings] Error:', error);
      return NextResponse.json(
        { error: 'Failed to create settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Sending Settings] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/sending/settings/:id
 * Update existing settings
 */
export async function PUT(request: NextRequest) {
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

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Settings ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = settingsSchema.parse(body);

    // Convert camelCase to snake_case
    const dbData: any = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) dbData.name = validated.name;
    if (validated.description !== undefined) dbData.description = validated.description;
    if (validated.humanMode !== undefined) dbData.human_mode = validated.humanMode;
    if (validated.delayBetweenMessages !== undefined) dbData.delay_between_messages = validated.delayBetweenMessages;
    if (validated.delayVariation !== undefined) dbData.delay_variation = validated.delayVariation;
    if (validated.coffeeBreakInterval !== undefined) dbData.coffee_break_interval = validated.coffeeBreakInterval;
    if (validated.coffeeBreakDuration !== undefined) dbData.coffee_break_duration = validated.coffeeBreakDuration;
    if (validated.longBreakInterval !== undefined) dbData.long_break_interval = validated.longBreakInterval;
    if (validated.longBreakDuration !== undefined) dbData.long_break_duration = validated.longBreakDuration;
    if (validated.workingHoursEnabled !== undefined) dbData.working_hours_enabled = validated.workingHoursEnabled;
    if (validated.startTime !== undefined) dbData.start_time = validated.startTime;
    if (validated.endTime !== undefined) dbData.end_time = validated.endTime;
    if (validated.timezone !== undefined) dbData.timezone = validated.timezone;
    if (validated.daysSinceLastContact !== undefined) dbData.days_since_last_contact = validated.daysSinceLastContact;
    if (validated.dailyLimit !== undefined) dbData.daily_limit = validated.dailyLimit;
    if (validated.dailyLimitWarning !== undefined) dbData.daily_limit_warning = validated.dailyLimitWarning;
    if (validated.whatsappEnabled !== undefined) dbData.whatsapp_enabled = validated.whatsappEnabled;
    if (validated.emailEnabled !== undefined) dbData.email_enabled = validated.emailEnabled;

    const { data: setting, error } = await supabaseAdmin
      .from('sending_settings')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Sending Settings] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Sending Settings] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
