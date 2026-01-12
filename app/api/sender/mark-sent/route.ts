import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Verify Bearer token from Authorization header
 */
function verifyBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.SENDER_SERVICE_TOKEN;

  if (!expectedToken) {
    console.error('[API] SENDER_SERVICE_TOKEN not configured');
    return false;
  }

  return token === expectedToken;
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
    if (!verifyBearerToken(request)) {
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
