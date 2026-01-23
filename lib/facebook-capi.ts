/**
 * Facebook Conversions API (CAPI) - Server-Side Tracking
 * https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
const FB_ACCESS_TOKEN = process.env.FB_CAPI_ACCESS_TOKEN;
const FB_TEST_EVENT_CODE = process.env.FB_TEST_EVENT_CODE; // Optional: for testing

interface FacebookEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: 'website';
  event_source_url: string;
  user_data: {
    client_ip_address?: string;
    client_user_agent?: string;
    em?: string; // hashed email
    ph?: string; // hashed phone
    fn?: string; // hashed first name
    ln?: string; // hashed last name
    fbp?: string; // Facebook browser ID
    fbc?: string; // Facebook click ID
  };
  custom_data?: {
    currency?: string;
    value?: number;
    contentName?: string;
    contentType?: string;
  };
}

/**
 * Hash data using SHA-256 (required by Facebook)
 */
async function hashData(data: string): Promise<string> {
  if (!data) return '';
  
  // Normalize: lowercase and trim
  const normalized = data.toLowerCase().trim();
  
  // Hash using SubtleCrypto API (available in Node.js 15+)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Get Facebook browser ID from cookies
 */
function getFbp(cookies: string): string | undefined {
  const match = cookies.match(/(_fbp|fbp)=([^;]+)/);
  return match ? match[2] : undefined;
}

/**
 * Get Facebook click ID from cookies
 */
function getFbc(cookies: string): string | undefined {
  const match = cookies.match(/(_fbc|fbc)=([^;]+)/);
  return match ? match[2] : undefined;
}

/**
 * Send event to Facebook Conversions API
 */
export async function sendEventToCAPI(
  eventName: string,
  eventSourceUrl: string,
  userAgent: string,
  ipAddress: string,
  cookies: string,
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  },
  customData?: {
    currency?: string;
    value?: number;
    contentName?: string;
    contentType?: string;
  }
): Promise<boolean> {
  // Skip if CAPI not configured
  if (!FB_PIXEL_ID || !FB_ACCESS_TOKEN) {
    console.warn('[CAPI] Pixel ID or Access Token not configured');
    return false;
  }

  try {
    // Generate event ID for deduplication
    const eventId = `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const eventTime = Math.floor(Date.now() / 1000);

    // Build user data with hashing
    const hashedUserData: any = {
      client_ip_address: ipAddress,
      client_user_agent: userAgent,
      fbp: getFbp(cookies),
      fbc: getFbc(cookies),
    };

    // Hash PII if provided
    if (userData?.email) {
      hashedUserData.em = await hashData(userData.email);
    }
    if (userData?.phone) {
      // Remove non-numeric characters before hashing
      const cleanPhone = userData.phone.replace(/\D/g, '');
      hashedUserData.ph = await hashData(cleanPhone);
    }
    if (userData?.firstName) {
      hashedUserData.fn = await hashData(userData.firstName);
    }
    if (userData?.lastName) {
      hashedUserData.ln = await hashData(userData.lastName);
    }

    // Build event payload
    const event: FacebookEvent = {
      event_name: eventName,
      event_time: eventTime,
      event_id: eventId,
      action_source: 'website',
      event_source_url: eventSourceUrl,
      user_data: hashedUserData,
    };

    // Add custom data if provided
    if (customData) {
      event.custom_data = {
        currency: customData.currency || 'BRL',
        value: customData.value,
        contentName: customData.contentName,
        contentType: customData.contentType,
      };
    }

    // Build request payload
    const payload = {
      data: [event],
      test_event_code: FB_TEST_EVENT_CODE, // Include if testing
    };

    // Send to Facebook Conversions API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events?access_token=${FB_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[CAPI] Error response:', JSON.stringify(result, null, 2));
      return false;
    }

    console.log('[CAPI] Event sent successfully:', eventName, 'Event ID:', eventId, 'Result:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('[CAPI] Error sending event:', error);
    return false;
  }
}

/**
 * Track PageView via CAPI
 */
export async function capiPageView(
  url: string,
  userAgent: string,
  ipAddress: string,
  cookies: string
) {
  return await sendEventToCAPI(
    'PageView',
    url,
    userAgent,
    ipAddress,
    cookies
  );
}

/**
 * Track Lead via CAPI
 */
export async function capiLead(
  url: string,
  userAgent: string,
  ipAddress: string,
  cookies: string,
  email?: string,
  phone?: string,
  firstName?: string
) {
  return await sendEventToCAPI(
    'Lead',
    url,
    userAgent,
    ipAddress,
    cookies,
    { email, phone, firstName },
    { contentName: 'Lead Form' }
  );
}

/**
 * Track CompleteRegistration (App Download) via CAPI
 */
export async function capiCompleteRegistration(
  url: string,
  userAgent: string,
  ipAddress: string,
  cookies: string,
  planType: string,
  value: number,
  email?: string
) {
  return await sendEventToCAPI(
    'CompleteRegistration',
    url,
    userAgent,
    ipAddress,
    cookies,
    { email },
    {
      currency: 'BRL',
      value: value,
      contentName: `${planType} plan download`,
      contentType: 'product',
    }
  );
}

/**
 * Track InitiateCheckout via CAPI
 */
export async function capiInitiateCheckout(
  url: string,
  userAgent: string,
  ipAddress: string,
  cookies: string,
  planType: string,
  value: number,
  email?: string
) {
  return await sendEventToCAPI(
    'InitiateCheckout',
    url,
    userAgent,
    ipAddress,
    cookies,
    { email },
    {
      currency: 'BRL',
      value: value,
      contentName: `${planType} plan`,
      contentType: 'product',
    }
  );
}

/**
 * Track Purchase via CAPI
 */
export async function capiPurchase(
  url: string,
  userAgent: string,
  ipAddress: string,
  cookies: string,
  planType: string,
  value: number,
  email?: string,
  transactionId?: string
) {
  return await sendEventToCAPI(
    'Purchase',
    url,
    userAgent,
    ipAddress,
    cookies,
    { email },
    {
      currency: 'BRL',
      value: value,
      contentName: `${planType} plan`,
      contentType: 'product',
    }
  );
}
