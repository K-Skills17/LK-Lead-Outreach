import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAndGetClinic } from '@/lib/license';
import { normalizePhone } from '@/lib/phone';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Validation schema
const blockContactSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  phone: z.string().min(10, 'Phone number is required'),
  reason: z.string().max(500).optional(),
});

/**
 * POST /api/contacts/block
 * 
 * Add a phone number to the global do-not-contact list
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = blockContactSchema.parse(body);

    // Verify license
    const licenseResult = await verifyAndGetClinic(validated.licenseKey);

    if (!licenseResult.valid || !licenseResult.clinicId) {
      return NextResponse.json(
        {
          error: licenseResult.error || 'Invalid license key',
        },
        { status: 401 }
      );
    }

    // Normalize phone to E.164
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizePhone(validated.phone);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid phone number format',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    // Insert into do_not_contact (ignore if already exists)
    const { error } = await supabaseAdmin
      .from('do_not_contact')
      .upsert(
        {
          phone: normalizedPhone,
          reason: validated.reason || 'Blocked by user',
          blocked_at: new Date().toISOString(),
        },
        {
          onConflict: 'phone',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error('[API] Error blocking contact:', error);
      return NextResponse.json(
        {
          error: 'Failed to block contact',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phone: normalizedPhone,
      message: 'Contact successfully blocked',
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
    console.error('[API] Error blocking contact:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
