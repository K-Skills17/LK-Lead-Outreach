import { NextRequest, NextResponse } from 'next/server';
import { getBestSendTimes, BusinessType } from '@/lib/send-time-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/features/send-time/analytics?niche=xxx&businessType=xxx
 * Get best performing send times
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
    
    const url = new URL(request.url);
    const niche = url.searchParams.get('niche') || undefined;
    const businessType = (url.searchParams.get('businessType') as BusinessType) || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const bestTimes = await getBestSendTimes(niche, businessType, limit);
    
    return NextResponse.json({
      success: true,
      bestTimes,
    });
  } catch (error) {
    console.error('[SendTime Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
