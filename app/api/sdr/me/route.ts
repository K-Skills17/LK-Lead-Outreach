import { NextRequest, NextResponse } from 'next/server';
import { getSDRById } from '@/lib/sdr-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sdr/me
 * 
 * Get current SDR user info
 */
export async function GET(request: NextRequest) {
  try {
    // Get SDR ID from Authorization header or query param
    const authHeader = request.headers.get('authorization');
    const sdrId = authHeader?.replace('Bearer ', '') || 
                  new URL(request.url).searchParams.get('sdrId');

    if (!sdrId) {
      return NextResponse.json(
        { error: 'SDR ID required' },
        { status: 401 }
      );
    }

    const sdr = await getSDRById(sdrId);

    if (!sdr) {
      return NextResponse.json(
        { error: 'SDR not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: sdr.id,
      email: sdr.email,
      name: sdr.name,
      role: sdr.role,
      last_login: sdr.last_login,
    });
  } catch (error) {
    console.error('[SDR Me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
