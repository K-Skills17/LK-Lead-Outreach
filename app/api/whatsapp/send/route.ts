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
import { sendWhatsAppMessage } from '@/lib/whatsapp-sending-service';
import { z } from 'zod';
import { getSDRById } from '@/lib/sdr-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const sendWhatsAppSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  messageText: z.string().optional(), // Optional - will use personalized_message if available
  skipChecks: z.boolean().optional().default(false), // For manual sends
  includeImages: z.boolean().optional().default(true), // Include analysis images and landing pages in message
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

    // Send WhatsApp message
    const result = await sendWhatsAppMessage({
      contactId: validated.contactId,
      sdrId,
      messageText: validated.messageText || '',
      skipChecks: validated.skipChecks || isAdmin, // Admin can skip checks for manual sends
      includeImages: validated.includeImages !== false, // Include images by default
    });

    if (!result.success) {
      if (result.skipped) {
        return NextResponse.json(
          {
            success: false,
            skipped: true,
            reason: result.skipReason,
          },
          { status: 200 } // 200 because it's a valid response (just skipped)
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      whatsappSendId: result.whatsappSendId,
      contactId: result.contactId,
      message: 'WhatsApp message sent successfully',
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
