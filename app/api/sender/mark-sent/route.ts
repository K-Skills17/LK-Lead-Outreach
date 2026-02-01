import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getSDRById } from '@/lib/sdr-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Verify Bearer token from Authorization header
 * Supports both SENDER_SERVICE_TOKEN and SDR ID
 */
async function verifyBearerToken(request: NextRequest): Promise<{ valid: boolean; sdrId?: string }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false };
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.SENDER_SERVICE_TOKEN;

  // Check if it's the service token (backward compatibility)
  if (expectedToken && token === expectedToken) {
    return { valid: true };
  }

  // Check if it's an SDR ID (for SDR authentication)
  try {
    const sdr = await getSDRById(token);
    if (sdr && sdr.is_active) {
      return { valid: true, sdrId: sdr.id };
    }
  } catch (error) {
    // Not an SDR ID, continue to return invalid
  }

  return { valid: false };
}

// Validation schema
const markSentSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  sentAt: z.string().datetime('Invalid datetime format'),
});

/**
 * POST /api/sender/mark-sent
 * 
 * Mark a contact as successfully sent
 * Protected by Bearer token authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Verify Bearer token
    const authResult = await verifyBearerToken(request);
    if (!authResult.valid) {
      return NextResponse.json(
        {
          error: 'Unauthorized - Invalid or missing Bearer token',
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validated = markSentSchema.parse(body);

    // If SDR authenticated, verify the contact belongs to them
    if (authResult.sdrId) {
      const { data: contact } = await supabaseAdmin
        .from('campaign_contacts')
        .select('assigned_sdr_id')
        .eq('id', validated.contactId)
        .single();

      if (!contact || contact.assigned_sdr_id !== authResult.sdrId) {
        return NextResponse.json(
          {
            error: 'Contact not assigned to this SDR',
          },
          { status: 403 }
        );
      }
    }

    // Get contact details for history recording
    const { data: contact } = await supabaseAdmin
      .from('campaign_contacts')
      .select('id, phone, email, assigned_sdr_id, campaign_id')
      .eq('id', validated.contactId)
      .single();

    // FAILSAFE: Final check using system time/date before marking as sent
    const { shouldSkipDay } = await import('@/lib/send-time-service');
    const { isWithinWorkingHours, DEFAULT_HUMAN_BEHAVIOR_SETTINGS } = await import('@/lib/human-behavior-service');
    
    const systemNow = new Date();
    const dayOfWeek = systemNow.getDay();
    const currentHour = systemNow.getHours();
    const currentMinute = systemNow.getMinutes();
    
    // FAILSAFE 1: Never mark as sent on weekends (using system time)
    if (shouldSkipDay(dayOfWeek)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return NextResponse.json(
        {
          error: 'Weekend restriction',
          message: `Cannot mark as sent on ${dayNames[dayOfWeek]}. Outreach is only allowed Monday-Friday.`,
          currentDay: dayNames[dayOfWeek],
          currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
        },
        { status: 403 } // Forbidden
      );
    }
    
    // FAILSAFE 2: Check working hours (using system time)
    if (!isWithinWorkingHours(DEFAULT_HUMAN_BEHAVIOR_SETTINGS, systemNow)) {
      return NextResponse.json(
        {
          error: 'Outside working hours',
          message: `Current time (${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}) is outside working hours (${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.startTime} - ${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.endTime}).`,
          currentTime: `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`,
          workingHours: `${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.startTime} - ${DEFAULT_HUMAN_BEHAVIOR_SETTINGS.endTime}`,
        },
        { status: 403 } // Forbidden
      );
    }

    // Update contact status
    const { error } = await supabaseAdmin
      .from('campaign_contacts')
      .update({
        status: 'sent',
        sent_at: validated.sentAt,
        error_message: null, // Clear any previous error
      })
      .eq('id', validated.contactId);

    if (error) {
      console.error('[API] Error marking contact as sent:', error);
      return NextResponse.json(
        {
          error: 'Failed to update contact status',
        },
        { status: 500 }
      );
    }

    // Record contact in history
    if (contact) {
      const { recordContact } = await import('@/lib/human-behavior-service');
      await recordContact({
        contactId: contact.id,
        phone: contact.phone || undefined,
        email: contact.email || undefined,
        channel: 'whatsapp',
        campaignId: contact.campaign_id || undefined,
        sdrId: contact.assigned_sdr_id || undefined,
        status: 'sent',
      });
    }

    return NextResponse.json({
      success: true,
      contactId: validated.contactId,
      status: 'sent',
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('[API] Error marking sent:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
