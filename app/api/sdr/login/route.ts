import { NextRequest, NextResponse } from 'next/server';
import { verifySDRPassword } from '@/lib/sdr-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Generate a session token for SDR
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/sdr/login
 * 
 * SDR login endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify credentials
    const sdr = await verifySDRPassword(email, password);

    if (!sdr) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateSessionToken();

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: sdr.id,
        email: sdr.email,
        name: sdr.name,
        role: sdr.role,
      },
    });
  } catch (error) {
    console.error('[SDR Login] Error:', error);
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
