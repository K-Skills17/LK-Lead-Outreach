import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackABTestEvent, EventType } from '@/lib/ab-testing-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const trackEventSchema = z.object({
  testId: z.string().uuid(),
  contactId: z.string().uuid(),
  eventType: z.enum(['sent', 'opened', 'clicked', 'responded', 'booked', 'bounced']),
  eventData: z.any().optional(),
});

/**
 * POST /api/features/ab-test/track
 * Track an event for A/B test
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
    const validation = trackEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { testId, contactId, eventType, eventData } = validation.data;
    
    const result = await trackABTestEvent(testId, contactId, eventType as EventType, eventData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to track event', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[ABTest Track API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
