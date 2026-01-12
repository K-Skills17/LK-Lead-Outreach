# 🔑 Mercado Pago Credentials Setup

## What You Have

From Mercado Pago Dashboard → Integrações → Credenciais:

```
✅ Public Key (starts with APP_USR-)
✅ Access Token (starts with APP_USR-)
```

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create `.env.local` File

In your `protocoloreceitaoculta` folder, create a file named `.env.local`:

```bash
# Navigate to Next.js folder
cd "c:\dev\Protocolo Receita Oculta\protocoloreceitaoculta"

# Create .env.local file
# (Windows PowerShell)
New-Item -Path . -Name ".env.local" -ItemType "file"
```

### Step 2: Add Your Credentials

Open `.env.local` and paste this (replace with YOUR actual keys):

```bash
# ====================================
# MERCADO PAGO CREDENTIALS
# ====================================

# Public Key (for frontend - safe to expose)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Access Token (SECRET - server-side only!)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# ====================================
# PAYMENT LINKS
# ====================================

# R$67 Entry Payment (get from Mercado Pago dashboard)
NEXT_PUBLIC_PAYMENT_URL=https://mpago.la/xxxxxx

# Professional Plan R$197/month (create subscription link)
NEXT_PUBLIC_PRO_PAYMENT_URL=https://mpago.la/xxxxxx

# Premium Plan R$497/month (create subscription link)
NEXT_PUBLIC_PREMIUM_PAYMENT_URL=https://mpago.la/xxxxxx

# ====================================
# SUPABASE (you'll need these too)
# ====================================

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ====================================
# GOOGLE APPS SCRIPT
# ====================================

GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec

# ====================================
# DESKTOP APP API
# ====================================

SENDER_SERVICE_TOKEN=generate-a-random-32-char-token
```

---

## 📋 What Each Key Does

### **Public Key** (`NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`)
```
✅ Used in: Frontend (browser)
✅ Safe to expose: Yes
✅ Purpose: Initialize Mercado Pago checkout
✅ Prefix: NEXT_PUBLIC_ (makes it available in browser)
```

### **Access Token** (`MERCADOPAGO_ACCESS_TOKEN`)
```
⚠️ Used in: Backend only (API routes)
❌ Safe to expose: NO! Keep secret!
⚠️ Purpose: Make API calls to Mercado Pago (get payment details)
❌ Prefix: NO NEXT_PUBLIC_ (server-side only)
```

---

## 🔒 Security Best Practices

### ✅ DO:
```
✅ Keep Access Token secret
✅ Only use Access Token in API routes (/app/api/*)
✅ Add .env.local to .gitignore (already done)
✅ Use different credentials for test/production
✅ Rotate keys if compromised
```

### ❌ DON'T:
```
❌ Never commit .env.local to git
❌ Never use Access Token in frontend code
❌ Never share credentials in screenshots
❌ Never hardcode credentials in code
❌ Never use production keys in development
```

---

## 🧪 Test Your Setup

### Step 1: Check Environment Variables Load

Create a test API route to verify:

```typescript
// app/api/test-mercadopago/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const hasPublicKey = !!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const hasAccessToken = !!process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  return NextResponse.json({
    publicKey: hasPublicKey ? '✅ Loaded' : '❌ Missing',
    accessToken: hasAccessToken ? '✅ Loaded' : '❌ Missing',
    // Only show first 10 chars for security
    publicKeyPreview: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.substring(0, 15) + '...',
  });
}
```

Then visit: `http://localhost:3000/api/test-mercadopago`

### Step 2: Test Mercado Pago API Connection

```typescript
// Test if Access Token works
const response = await fetch('https://api.mercadopago.com/v1/payment_methods', {
  headers: {
    'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
  }
});

const data = await response.json();
console.log('✅ Mercado Pago API working:', data);
```

---

## 🌐 Vercel Setup (for Production)

When you deploy to Vercel, you need to add environment variables there too.

### Step 1: Push to GitHub (Without .env.local!)

```bash
# .env.local is already in .gitignore, so it won't be pushed
git add .
git commit -m "Add Mercado Pago integration"
git push origin main
```

### Step 2: Add Environment Variables in Vercel

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add each variable:

```
Key: NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
Value: APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Environment: Production, Preview, Development

Key: MERCADOPAGO_ACCESS_TOKEN
Value: APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Environment: Production, Preview, Development

Key: NEXT_PUBLIC_PAYMENT_URL
Value: https://mpago.la/xxxxxx
Environment: Production, Preview, Development

(... repeat for all variables)
```

### Step 3: Redeploy

```bash
# Trigger new deployment in Vercel
# (or it will auto-deploy on git push)
```

### Step 4: Test Production

Visit your production URL and check:
```
✅ Payment buttons have real Mercado Pago URLs
✅ Checkout works
✅ API routes can access Access Token
```

---

## 📱 Create Payment Links (If You Haven't)

### R$67 One-Time Payment

1. Go to: https://www.mercadopago.com.br
2. Dashboard → Vender → Links de pagamento
3. Click "Criar link"
4. Fill:
   - **Título**: LK Reactor - Acesso Inicial
   - **Preço**: R$ 67,00
   - **Quantidade**: Ilimitada
5. Click "Criar link"
6. Copy URL: `https://mpago.la/xxxxxx`
7. Add to `.env.local` → `NEXT_PUBLIC_PAYMENT_URL`

### R$197/month Professional Subscription

1. Dashboard → Minhas vendas → Assinaturas
2. Click "Criar plano de assinatura"
3. Fill:
   - **Nome do plano**: LK Reactor Professional
   - **Frequência**: Mensal
   - **Preço**: R$ 197,00
   - **Período de teste**: 0 dias (we handle trial separately)
4. Click "Criar plano"
5. Copy subscription link
6. Add to `.env.local` → `NEXT_PUBLIC_PRO_PAYMENT_URL`

### R$497/month Premium Subscription

Same as above, but:
- **Nome do plano**: LK Reactor Premium
- **Preço**: R$ 497,00

---

## 🔄 Using Credentials in Code

### In API Routes (Server-Side)

```typescript
// app/api/mercadopago/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Get payment details from Mercado Pago API
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${body.data.id}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      }
    }
  );
  
  const payment = await response.json();
  
  // Process payment...
  return NextResponse.json({ success: true });
}
```

### In Frontend (Client-Side)

```typescript
// app/page.tsx
'use client';

export default function Home() {
  const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL;
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  
  return (
    <a href={paymentUrl}>
      Pagar R$67
    </a>
  );
}
```

---

## 🧪 Test Credentials (Sandbox)

For testing, use separate credentials:

### Get Test Credentials

1. Dashboard → Integrações → Credenciais de teste
2. Copy Test Public Key and Test Access Token

### Add to `.env.local` (for testing)

```bash
# Test credentials (sandbox)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Switch to Production

When ready to go live, replace with production credentials.

---

## ⚠️ Common Issues

### Issue 1: "Environment variable not found"

**Solution:**
- Restart Next.js dev server: `npm run dev`
- Environment variables are loaded on startup

### Issue 2: Public key works, but Access Token doesn't

**Check:**
- Access Token is in server-side API route (not frontend)
- No `NEXT_PUBLIC_` prefix on Access Token
- Token is correct (copy-paste from Mercado Pago)

### Issue 3: Payment link redirects but doesn't complete

**Check:**
- Webhook is configured in Mercado Pago dashboard
- Webhook URL is correct (Make.com URL)
- Make.com scenario is active

### Issue 4: Vercel deployment fails

**Check:**
- All required env variables added in Vercel
- No typos in variable names
- Variables set for correct environment (Production/Preview)

---

## ✅ Final Checklist

Before going live:

- [ ] `.env.local` created with all variables
- [ ] Mercado Pago credentials added (Public Key + Access Token)
- [ ] Payment links created in Mercado Pago (R$67, R$197, R$497)
- [ ] Payment URLs added to `.env.local`
- [ ] Test in development (`npm run dev`)
- [ ] Payment buttons work and redirect to Mercado Pago
- [ ] `.env.local` is in `.gitignore` (don't commit!)
- [ ] Environment variables added to Vercel
- [ ] Deployed to Vercel
- [ ] Test in production
- [ ] Webhook configured in Mercado Pago dashboard

---

## 🎯 Quick Start Commands

```bash
# 1. Navigate to Next.js project
cd "c:\dev\Protocolo Receita Oculta\protocoloreceitaoculta"

# 2. Create .env.local (if not exists)
New-Item -Path . -Name ".env.local" -ItemType "file"

# 3. Edit .env.local
notepad .env.local

# 4. Paste credentials (see template above)

# 5. Start dev server
npm run dev

# 6. Test at http://localhost:3000
```

---

## 🚀 Next Steps

1. ✅ Set up credentials in `.env.local`
2. ✅ Create payment links in Mercado Pago
3. ✅ Test locally
4. ✅ Push to GitHub (without .env.local)
5. ✅ Add env variables to Vercel
6. ✅ Deploy!

**Ready to push to GitHub and deploy to Vercel?** 

Let me know when you want the GitHub + Vercel deployment guide! 🚀
