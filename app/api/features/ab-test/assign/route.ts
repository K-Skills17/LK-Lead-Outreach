import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { assignVariant } from '@/lib/ab-testing-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const assignSchema = z.object({
  testId: z.string().uuid(),
  contactId: z.string().uuid(),
});

/**
 * POST /api/features/ab-test/assign
 * Assign a variant to a contact
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
    const validation = assignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const { testId, contactId } = validation.data;
    
    const result = await assignVariant(testId, contactId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to assign variant', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      variantName: result.variantName,
      variant: result.variant,
    });
  } catch (error) {
    console.error('[ABTest Assign API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
