import { NextRequest, NextResponse } from 'next/server';
import { verifySDRPassword, getSDRById } from '@/lib/sdr-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Generate a session token for desktop app
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/sender/auth
 * 
 * Desktop app authentication endpoint
 * Allows SDRs to login from desktop app using email/password
 * Returns a token that can be used for subsequent API calls
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

    // Verify SDR credentials
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
      sdr: {
        id: sdr.id,
        email: sdr.email,
        name: sdr.name,
        role: sdr.role,
      },
    });
  } catch (error) {
    console.error('[Sender Auth] Error:', error);
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

/**
 * GET /api/sender/auth
 * 
 * Verify a session token and return SDR info
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 401 }
      );
    }

    // For now, we'll use a simple approach:
    // The token contains the SDR ID (we'll improve this later with proper session storage)
    // For MVP, we'll accept either:
    // 1. SDR ID directly (for backward compatibility)
    // 2. Or implement proper session storage in the future

    // Try to get SDR by ID (assuming token is SDR ID for now)
    const sdr = await getSDRById(token);

    if (!sdr) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      sdr: {
        id: sdr.id,
        email: sdr.email,
        name: sdr.name,
        role: sdr.role,
      },
    });
  } catch (error) {
    console.error('[Sender Auth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
