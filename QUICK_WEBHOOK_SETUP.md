# ⚡ Quick Resend Webhook Setup

## ✅ What's Already Done

- ✅ Webhook URL configured in Resend: `https://lk-lead-outreach-alpha.vercel.app/api/webhook/resend`
- ✅ Alias route created (both `/api/webhook/resend` and `/api/webhooks/resend` work)
- ✅ Webhook endpoint implemented and ready

## 🔑 Next Steps

### Step 1: Get Webhook Secret from Resend

1. Go to: https://resend.com/webhooks
2. Click on your webhook: "LK Lead Outreach Email Tracking"
3. Find the **Webhook Secret** (starts with `whsec_...`)
4. **Copy it** - you'll need it in the next step

### Step 2: Add to `.env.local`

Open your `.env.local` file and add:

```env
# Resend Webhook Secret (for email tracking)
RESEND_WEBHOOK_SECRET=whsec_your_secret_here
```

**Replace `whsec_your_secret_here` with the actual secret from Step 1.**

### Step 3: Add to Vercel

1. Go to: https://vercel.com → Your Project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Fill in:
   - **Name:** `RESEND_WEBHOOK_SECRET`
   - **Value:** `whsec_your_secret_here` (paste from Step 1)
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
4. Click **Save**
5. **Redeploy** (or wait for auto-redeploy)

### Step 4: Test the Webhook

1. **Send a test email:**
   - Go to Admin Dashboard
   - Select a lead
   - Click "Email" → Send test email to yourself

2. **Open the email** (triggers "opened" event)

3. **Click a link** in the email (triggers "clicked" event)

4. **Check tracking:**
   - Go to Admin Dashboard → **Email History**
   - Find your test email
   - Should show: ✅ Opened, ✅ Clicked

5. **Check Resend Dashboard:**
   - Go to: https://resend.com/webhooks
   - Click your webhook
   - Check **"Recent Events"** tab
   - Should see: `email.delivered`, `email.opened`, `email.clicked`

## ✅ Verification Checklist

- [ ] Webhook secret copied from Resend
- [ ] `RESEND_WEBHOOK_SECRET` added to `.env.local`
- [ ] `RESEND_WEBHOOK_SECRET` added to Vercel
- [ ] App redeployed (if on Vercel)
- [ ] Test email sent
- [ ] Test email opened
- [ ] Test email link clicked
- [ ] Events appear in Resend dashboard
- [ ] Tracking shows in Admin Dashboard

## 🎯 That's It!

Once you complete these steps, your email tracking will be fully functional! 🎉
