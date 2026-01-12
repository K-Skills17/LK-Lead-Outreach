# Thank You Pages Setup Guide

This document explains how to use the thank you pages for different purchase tiers.

## Pages Created

### 1. `/obrigado-67` - For $67 Trial Purchase
**Features:**
- Thank you confirmation
- "7 DIAS DE PREMIUM ATIVADOS" highlighted banner
- Premium features showcase
- Download app CTA
- License key instructions
- Support contact

**Use this for:** Customers who purchase the 7-day premium trial for R$ 67

### 2. `/obrigado-pro` - For $197 & $497 Subscriptions
**Features:**
- Thank you confirmation
- "Assinatura Ativa" badge
- Full subscription features showcase
- Download app CTA
- Onboarding steps
- Pro tips section
- Priority support information

**Use this for:** Customers who purchase either:
- PROFESSIONAL plan (R$ 197/month)
- PREMIUM plan (R$ 497/month)

## Integration Instructions

### Option 1: Direct URL Redirect (Recommended)

After payment confirmation, redirect users based on their purchase:

```javascript
// Example: After successful payment
const redirectUrl = 
  purchaseAmount === 67 
    ? '/obrigado-67'
    : '/obrigado-pro';

window.location.href = redirectUrl;
```

### Option 2: Payment Platform Configuration

Configure your payment URLs in the pricing page environment variables:

1. For the $67 offer (if you add it to the pricing page):
   - Set redirect URL to: `https://yourdomain.com/obrigado-67`

2. For PROFESSIONAL ($197):
   - Update `NEXT_PUBLIC_PRO_PAYMENT_URL` redirect to: `https://yourdomain.com/obrigado-pro`

3. For PREMIUM ($497):
   - Update `NEXT_PUBLIC_PREMIUM_PAYMENT_URL` redirect to: `https://yourdomain.com/obrigado-pro`

### Option 3: Single Dynamic Page with Query Parameters

If you prefer a single page that adapts based on plan:

```typescript
// URL: /obrigado?plan=67 or /obrigado?plan=pro
// You would need to modify the existing /obrigado page to read the query parameter
```

## MercadoPago Integration Example

If using MercadoPago (as suggested by `MERCADOPAGO_CREDENTIALS_SETUP.md`):

```javascript
// When creating payment preference
const preference = {
  items: [{
    title: "LK Reactor - 7 Days Premium Trial",
    unit_price: 67,
    quantity: 1
  }],
  back_urls: {
    success: "https://yourdomain.com/obrigado-67",
    failure: "https://yourdomain.com/payment-failed",
    pending: "https://yourdomain.com/payment-pending"
  },
  auto_return: "approved"
};

// For Professional/Premium plans
const preferencePro = {
  items: [{
    title: "LK Reactor - Professional Plan",
    unit_price: 197,
    quantity: 1
  }],
  back_urls: {
    success: "https://yourdomain.com/obrigado-pro",
    failure: "https://yourdomain.com/payment-failed",
    pending: "https://yourdomain.com/payment-pending"
  },
  auto_return: "approved"
};
```

## Email Integration

After successful payment, send an email with:

1. **For $67 buyers:**
   - Subject: "🎉 Seus 7 dias Premium foram ativados!"
   - Include license key
   - Link to `/obrigado-67` page
   - Link to `/setup` (download page)

2. **For $197/$497 buyers:**
   - Subject: "✅ Bem-vindo ao LK Reactor Professional/Premium!"
   - Include license key
   - Link to `/obrigado-pro` page
   - Link to `/setup` (download page)

## Testing

Test the pages locally:

```bash
npm run dev
```

Then visit:
- http://localhost:3000/obrigado-67
- http://localhost:3000/obrigado-pro

## Customization

Both pages are fully customizable. You can modify:
- Colors and branding
- Feature lists
- Support contact information
- Download links
- Additional upsell sections

## Notes

- Both pages are responsive and work on mobile/desktop
- Both pages use the same design system as your pricing page
- Support WhatsApp number: (11) 95282-3271 (update if needed)
- All text is in Portuguese (BR)
