import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyLicense } from '@/lib/license';

// Validation schema
const verifyLicenseSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  email: z.string().email('Valid email is required').optional(),
});

/**
 * POST /api/auth/verify-license
 * 
 * Verifies a license key through Google Apps Script
 * and upserts clinic data into Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = verifyLicenseSchema.parse(body);

    // Verify license
    const result = await verifyLicense(validated.licenseKey, validated.email);

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error || 'License verification failed',
        },
        { status: 401 }
      );
    }

    // Return success response
    return NextResponse.json({
      valid: true,
      tier: result.tier,
      dailyLimit: result.dailyLimit,
      clinicId: result.clinicId,
      daysRemaining: result.daysRemaining,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('[API] Error verifying license:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
