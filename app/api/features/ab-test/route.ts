import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createABTest,
  startABTest,
  pauseABTest,
  resumeABTest,
  getABTestResults,
  ABTestConfig,
} from '@/lib/ab-testing-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schemas
const variantSchema = z.object({
  name: z.string(),
  weight: z.number().min(0).max(100),
  content: z.object({
    subject_line: z.string().optional(),
    intro: z.string().optional(),
    send_time_adjustment: z.number().optional(),
    cta: z.string().optional(),
    custom: z.any().optional(),
  }),
});

const createTestSchema = z.object({
  campaignId: z.string().uuid().optional(),
  testName: z.string(),
  description: z.string().optional(),
  testType: z.enum(['subject_line', 'intro', 'send_time', 'cta', 'combined']),
  variants: z.array(variantSchema).min(2),
});

/**
 * POST /api/features/ab-test
 * Create a new A/B test
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
    const validation = createTestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const config = validation.data as ABTestConfig;
    
    // Create test
    const result = await createABTest(config);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to create test', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      testId: result.testId,
    });
  } catch (error) {
    console.error('[ABTest API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/features/ab-test?testId=xxx
 * Get A/B test results
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
    const testId = url.searchParams.get('testId');
    
    if (!testId) {
      return NextResponse.json(
        { error: 'testId required' },
        { status: 400 }
      );
    }
    
    const results = await getABTestResults(testId);
    
    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('[ABTest API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
