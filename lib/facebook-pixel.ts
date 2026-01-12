/**
 * Facebook Pixel Integration
 * https://developers.facebook.com/docs/meta-pixel
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initFacebookPixel = () => {
  if (!FB_PIXEL_ID || typeof window === 'undefined') return;

  // Initialize Facebook Pixel
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  window.fbq('init', FB_PIXEL_ID);
  window.fbq('track', 'PageView');
};

// Track page view
export const fbPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

// Track view content (user viewing pricing, etc.)
export const fbViewContent = (contentName: string, value?: number) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: contentName,
      currency: 'BRL',
      value: value || 0,
    });
  }
};

// Track lead (form submission)
export const fbLead = (contentName: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: contentName,
    });
  }
};

// Track complete registration (download app)
export const fbCompleteRegistration = (planType: string, value: number) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: `${planType} plan download`,
      currency: 'BRL',
      value: value,
    });
  }
};

// Track initiate checkout (clicked payment button)
export const fbInitiateCheckout = (planType: string, value: number) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: `${planType} plan`,
      currency: 'BRL',
      value: value,
    });
  }
};

// Track purchase (completed payment)
export const fbPurchase = (planType: string, value: number, transactionId?: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_name: `${planType} plan`,
      currency: 'BRL',
      value: value,
      transaction_id: transactionId,
    });
  }
};
