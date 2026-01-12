/**
 * Analytics Tracking Client Library
 * Tracks user events and sends them to our analytics API
 */

// Generate or retrieve session ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('lk_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('lk_session_id', sessionId);
  }
  return sessionId;
}

// Track page view
export async function trackPageView(page: string) {
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'page_view',
        sessionId,
        data: { page },
      }),
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

// Track lead form progress
export async function trackLeadStarted() {
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'lead_started',
        sessionId,
        data: {},
      }),
    });
  } catch (error) {
    console.error('Failed to track lead started:', error);
  }
}

export async function trackLeadStep1(data: {
  totalPatients: number;
  ticketMedio: number;
  inactivePercent: number;
  lostRevenue: number;
}) {
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'lead_step1',
        sessionId,
        data,
      }),
    });
  } catch (error) {
    console.error('Failed to track lead step1:', error);
  }
}

export async function trackLeadStep2(data: {
  clinicName: string;
  name: string;
  email: string;
  whatsapp: string;
}) {
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'lead_step2',
        sessionId,
        data,
      }),
    });
  } catch (error) {
    console.error('Failed to track lead step2:', error);
  }
}

export async function trackLeadCompleted(data: {
  clinicName: string;
  name: string;
  email: string;
  whatsapp: string;
  totalPatients: number;
  ticketMedio: number;
  inactivePercent: number;
  lostRevenue: number;
}) {
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'lead_completed',
        sessionId,
        data,
      }),
    });

    // Send Lead event to Facebook CAPI
    await fetch('/api/facebook/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'Lead',
        userData: {
          email: data.email,
          phone: data.whatsapp,
          firstName: data.name.split(' ')[0],
        },
        customData: {
          content_name: 'Lead Form',
        },
      }),
    });
  } catch (error) {
    console.error('Failed to track lead completed:', error);
  }
}

// Track downloads (CONVERSION EVENT for Facebook)
export async function trackDownload(data: {
  email?: string;
  planType: 'free' | 'professional' | 'premium';
  licenseKey?: string;
  sourcePage: string;
}) {
  try {
    const sessionId = getSessionId();
    const value = data.planType === 'free' ? 0 : (data.planType === 'professional' ? 197 : 497);

    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'download',
        sessionId,
        data,
      }),
    });

    // Fire Facebook Pixel CompleteRegistration event (client-side)
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'CompleteRegistration', {
        content_name: `${data.planType} plan`,
        currency: 'BRL',
        value: value,
      });
    }

    // Send to Facebook CAPI (server-side) for better tracking
    await fetch('/api/facebook/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'CompleteRegistration',
        userData: {
          email: data.email,
        },
        customData: {
          planType: data.planType,
          value: value,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to track download:', error);
  }
}

// Track payment initiation
export async function trackPaymentInitiated(data: {
  email?: string;
  planType: 'professional' | 'premium';
  amount: number;
}) {
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'payment_initiated',
        sessionId,
        data,
      }),
    });

    // Fire Facebook Pixel InitiateCheckout event (client-side)
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: `${data.planType} plan`,
        currency: 'BRL',
        value: data.amount,
      });
    }

    // Send to Facebook CAPI (server-side)
    await fetch('/api/facebook/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'InitiateCheckout',
        userData: {
          email: data.email,
        },
        customData: {
          planType: data.planType,
          value: data.amount,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to track payment initiated:', error);
  }
}

// Track completed payment
export async function trackPaymentCompleted(data: {
  email?: string;
  planType: 'professional' | 'premium';
  amount: number;
  paymentId?: string;
}) {
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'payment_completed',
        sessionId,
        data,
      }),
    });

    // Fire Facebook Pixel Purchase event
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        content_name: `${data.planType} plan`,
        currency: 'BRL',
        value: data.amount,
        transaction_id: data.paymentId,
      });
    }
  } catch (error) {
    console.error('Failed to track payment completed:', error);
  }
}

// Generic conversion tracking
export async function trackConversion(eventName: string, value?: number, metadata?: any) {
  try {
    const sessionId = getSessionId();
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'conversion',
        sessionId,
        data: { eventName, value, metadata },
      }),
    });
  } catch (error) {
    console.error('Failed to track conversion:', error);
  }
}
