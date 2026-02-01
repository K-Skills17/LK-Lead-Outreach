import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  calculateOptimalSendTime,
  saveOptimalSendTime,
  getOptimalSendTime,
  getBestSendTimes,
  SendTimeInput,
  BusinessType,
  LeadPriority,
} from '@/lib/send-time-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schema
const sendTimeRequestSchema = z.object({
  contactId: z.string().uuid(),
  businessType: z.enum(['healthcare', 'general', 'retail', 'finance', 'tech', 'services']).optional(),
  niche: z.string().optional(),
  leadPriority: z.enum(['VIP', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  timezone: z.string().optional(),
  batchId: z.string().uuid().optional(),
  batchSize: z.number().optional(),
});

/**
 * POST /api/features/send-time
 * Calculate optimal send time for a lead
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
    const validation = sendTimeRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }
    
    const input = validation.data as SendTimeInput;
    
    // Calculate optimal send time
    const result = await calculateOptimalSendTime(input);
    
    // Save to database
    const saveResult = await saveOptimalSendTime(input, result);
    
    if (!saveResult.success) {
      return NextResponse.json(
        { error: 'Failed to save send time', details: saveResult.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      sendTime: result,
    });
  } catch (error) {
    console.error('[SendTime API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/features/send-time?contactId=xxx
 * Get optimal send time for a contact
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
    const contactId = url.searchParams.get('contactId');
    
    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId required' },
        { status: 400 }
      );
    }
    
    const sendTime = await getOptimalSendTime(contactId);
    
    if (!sendTime) {
      return NextResponse.json(
        { error: 'Send time not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      sendTime,
    });
  } catch (error) {
    console.error('[SendTime API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
