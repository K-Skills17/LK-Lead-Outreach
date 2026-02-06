/**
 * WhatsApp Send Endpoint
 * 
 * Sends WhatsApp messages automatically with human behavior logic
 * Can be called by:
 * - Admin dashboard (manual send)
 * - SDR dashboard (manual send)
 * - Outreach processing service (automatic send)
 * - Cron job (automatic send)
 */

import { NextRequest, NextResponse } from 'next/server';
import { enqueueWhatsAppSend } from '@/lib/whatsapp-queue-service';
import { z } from 'zod';
import { getSDRById } from '@/lib/sdr-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sendWhatsAppSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  messageText: z.string().optional(), // Optional - will use personalized_message if available
  skipChecks: z.boolean().optional().default(false), // For manual sends
  includeImages: z.boolean().optional().default(true), // Include analysis images and landing pages in message
  /** Use this number instead of contact.phone (e.g. when user picks from potential_whatsapp_numbers). */
  phoneOverride: z.string().optional(),
});

/**
 * POST /api/whatsapp/send
 * Send WhatsApp message to a lead
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validated = sendWhatsAppSchema.parse(body);

    // Enqueue for automatic delivery by the WhatsApp worker (human-like delays and breaks)
    const result = await enqueueWhatsAppSend({
      contactId: validated.contactId,
      sdrId: sdrId ?? undefined,
      messageText: validated.messageText ?? '',
      includeImages: validated.includeImages !== false,
      sentBySystem: validated.skipChecks !== true && !isAdmin,
      phoneOverride: validated.phoneOverride?.trim() || undefined,
    });

    if (!result.success) {
      const isNotFound = result.error === 'Contact not found' || result.error === 'Contact has no phone number';
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          contactId: validated.contactId,
        },
        { status: isNotFound ? 404 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      queued: true,
      queueId: result.queueId,
      contactId: validated.contactId,
      message: 'Message queued for delivery. Run the WhatsApp worker (npm run whatsapp-worker) to send with human-like delays and breaks.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[WhatsApp Send] Error:', error);
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
