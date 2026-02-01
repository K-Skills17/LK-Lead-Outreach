import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { startABTest } from '@/lib/ab-testing-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startTestSchema = z.object({
  testId: z.string().uuid(),
});

/**
 * POST /api/features/ab-test/start
 * Start an A/B test
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
    const validation = startTestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { testId } = validation.data;
    
    const result = await startABTest(testId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to start test', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[ABTest Start API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
