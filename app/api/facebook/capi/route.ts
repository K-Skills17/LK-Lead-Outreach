import { NextRequest, NextResponse } from 'next/server';
import {
  sendEventToCAPI,
  capiPageView,
  capiLead,
  capiCompleteRegistration,
  capiInitiateCheckout,
  capiPurchase,
} from '@/lib/facebook-capi';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/facebook/capi
 * Proxy endpoint to send events to Facebook Conversions API
 * This runs server-side and includes user data that can't be sent from browser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, userData, customData } = body;

    // Get request metadata
    const url = request.headers.get('referer') || request.url;
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '';
    const cookies = request.headers.get('cookie') || '';

    let success = false;

    // Route to appropriate CAPI function
    switch (eventName) {
      case 'PageView':
        success = await capiPageView(url, userAgent, ipAddress, cookies);
        break;

      case 'Lead':
        success = await capiLead(
          url,
          userAgent,
          ipAddress,
          cookies,
          userData?.email,
          userData?.phone,
          userData?.firstName
        );
        break;

      case 'CompleteRegistration':
        success = await capiCompleteRegistration(
          url,
          userAgent,
          ipAddress,
          cookies,
          customData?.planType || 'unknown',
          customData?.value || 0,
          userData?.email
        );
        break;

      case 'InitiateCheckout':
        success = await capiInitiateCheckout(
          url,
          userAgent,
          ipAddress,
          cookies,
          customData?.planType || 'unknown',
          customData?.value || 0,
          userData?.email
        );
        break;

      case 'Purchase':
        success = await capiPurchase(
          url,
          userAgent,
          ipAddress,
          cookies,
          customData?.planType || 'unknown',
          customData?.value || 0,
          userData?.email,
          customData?.transactionId
        );
        break;

      default:
        // Generic event
        success = await sendEventToCAPI(
          eventName,
          url,
          userAgent,
          ipAddress,
          cookies,
          userData,
          customData
        );
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error('[CAPI Proxy] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send event' },
      { status: 500 }
    );
  }
}
