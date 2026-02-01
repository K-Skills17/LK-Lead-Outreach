import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { determineWinner } from '@/lib/ab-testing-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const winnerSchema = z.object({
  testId: z.string().uuid(),
  metric: z.enum(['open_rate', 'click_rate', 'response_rate', 'booking_rate']).optional(),
});

/**
 * POST /api/features/ab-test/winner
 * Determine winner of A/B test
 */
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    
    // Validate request
    const validation = winnerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { testId, metric } = validation.data;
    
    const result = await determineWinner(testId, metric);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to determine winner', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      winner: result.winner,
      confidence: result.confidence,
      results: result.results,
    });
  } catch (error) {
    console.error('[ABTest Winner API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
