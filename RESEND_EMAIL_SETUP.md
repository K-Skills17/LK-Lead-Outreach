# 📧 Resend Email Service - Setup & Verification Guide

## ✅ Current Status

Resend is **installed and configured** in the project:
- ✅ Package installed: `resend@^6.7.0`
- ✅ Email service implemented: `lib/email-service-simple.ts`
- ✅ Email sending endpoint: `/api/admin/emails/send`
- ✅ Webhook endpoint: `/api/webhooks/resend`
- ✅ Email tracking: Full open/click tracking implemented

## 🚀 Setup Steps

### Step 1: Create Resend Account (5 minutes)

1. Go to: https://resend.com/signup
2. Sign up (FREE tier: 3,000 emails/month)
3. Verify your email address
4. Complete account setup

### Step 2: Get API Key (2 minutes)

1. In Resend dashboard, go to: **API Keys** (left sidebar)
2. Click **"Create API Key"**
3. Name it: "LK Lead Outreach Production"
4. Select permissions: **Full Access** (or just "Send Emails")
5. Click **Create**
6. **IMPORTANT:** Copy the API key immediately (starts with `re_...`)
   - You'll only see it once!
   - Save it securely

### Step 3: Add API Key to Environment Variables

#### A) Local Development (`.env.local`)

Open your `.env.local` file and add:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# Optional: Custom from email (default: LK Lead Outreach <noreply@lkdigital.org>)
EMAIL_FROM=LK Lead Outreach <noreply@lkdigital.org>
EMAIL_REPLY_TO=contato@lkdigital.org
```

#### B) Production (Vercel)

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Click **"Add New"**
3. Name: `RESEND_API_KEY`
4. Value: `re_your_api_key_here`
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**
7. Vercel will automatically redeploy

### Step 4: Configure Webhook (Optional but Recommended)

For email tracking (opens, clicks, bounces):

1. In Resend dashboard, go to: **Webhooks**
2. Click **"Create Webhook"**
3. Name: "LK Lead Outreach Email Tracking"
4. Endpoint URL: `https://your-domain.com/api/webhooks/resend`
5. Events to subscribe:
   - ✅ `email.delivered`
   - ✅ `email.opened`
   - ✅ `email.clicked`
   - ✅ `email.bounced`
   - ✅ `email.complained`
6. Click **Create**
7. Copy the **Webhook Secret** (starts with `whsec_...`)
8. Add to `.env.local` and Vercel:
   ```env
   RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Step 5: Verify Domain (Recommended for Production)

For better deliverability:

1. In Resend dashboard, go to: **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `lkdigital.org` (or your domain)
4. Add DNS records to your domain:
   - SPF record
   - DKIM record
   - DMARC record (optional)
5. Wait for verification (usually 5-10 minutes)
6. Once verified, update `EMAIL_FROM` to use your domain:
   ```env
   EMAIL_FROM=LK Lead Outreach <noreply@lkdigital.org>
   ```

## ✅ Verification

### Test 1: Check API Key is Set

Run this in your terminal (local):
```bash
# Check if RESEND_API_KEY is set
node -e "console.log(process.env.RESEND_API_KEY ? '✅ RESEND_API_KEY is set' : '❌ RESEND_API_KEY is missing')"
```

Or visit: `http://localhost:3000/api/admin/emails/test` (if you create a test endpoint)

### Test 2: Send Test Email

1. Go to Admin Dashboard
2. Select a lead with an email address
3. Click **"Email"** button
4. Fill in subject and content
5. Click **"Send Email"**
6. Check your email inbox (and spam folder)

### Test 3: Check Resend Dashboard

1. Go to: https://resend.com/emails
2. You should see the sent email
3. Click on it to see:
   - Delivery status
   - Opens (if tracking enabled)
   - Clicks (if tracking enabled)
   - Bounces/complaints

### Test 4: Check Webhook (if configured)

1. Send a test email
2. Open the email (to trigger "opened" event)
3. Click a link (to trigger "clicked" event)
4. Check Vercel logs for webhook calls:
   ```
   [Resend Webhook] Email opened: [email_id]
   [Resend Webhook] Email clicked: [email_id]
   ```

## 🔍 Troubleshooting

### Issue 1: "RESEND_API_KEY is not set"

**Symptoms:**
- Error when trying to send email
- Console shows: `RESEND_API_KEY is not set in environment variables`

**Solution:**
1. Verify `.env.local` has `RESEND_API_KEY=re_...`
2. Restart your dev server: `npm run dev`
3. For production: Add to Vercel environment variables and redeploy

### Issue 2: "Invalid API key"

**Symptoms:**
- Error: `Invalid API key` or `401 Unauthorized`

**Solution:**
1. Verify API key is correct (starts with `re_`)
2. Check for extra spaces or quotes in `.env.local`
3. Regenerate API key in Resend dashboard if needed

### Issue 3: Emails not arriving

**Check:**
1. **Spam folder** - Check spam/junk folder
2. **Resend dashboard** - Check if email was sent successfully
3. **Email address** - Verify recipient email is correct
4. **Domain verification** - Unverified domains may have lower deliverability

**Solution:**
- Verify your domain in Resend (Step 5 above)
- Check Resend dashboard for bounce reasons
- Use a verified domain for `EMAIL_FROM`

### Issue 4: Webhook not receiving events

**Symptoms:**
- Email opens/clicks not tracked
- No webhook calls in Vercel logs

**Solution:**
1. Verify webhook URL is correct: `https://your-domain.com/api/webhooks/resend`
2. Check webhook is active in Resend dashboard
3. Verify `RESEND_WEBHOOK_SECRET` is set (optional but recommended)
4. Check Vercel logs for webhook errors

## 📊 Monitoring

### Resend Dashboard

Monitor all email activity:
- **Emails**: See all sent emails, delivery status, opens, clicks
- **Webhooks**: See webhook delivery status and retries
- **Domains**: Monitor domain reputation
- **API Keys**: Manage API keys

### Vercel Logs

Monitor your application:
1. Go to: **Vercel → Your Project → Deployments**
2. Click latest deployment → **Runtime Logs**
3. Filter by `/api/admin/emails/send` or `/api/webhooks/resend`
4. Look for:
   ```
   ✅ [Email] Sent successfully to [email]
   ✅ [Resend Webhook] Email opened: [email_id]
   ```

## 🎯 Current Implementation

### Email Sending Flow

```
Admin Dashboard
  ↓
Click "Email" button on lead
  ↓
POST /api/admin/emails/send
  ↓
lib/email-service-simple.ts → sendEmail()
  ↓
Resend API → Sends email
  ↓
Email delivered to recipient
  ↓
Resend Webhook → /api/webhooks/resend
  ↓
Updates email_sends table (opens, clicks, bounces)
  ↓
Visible in Admin & SDR dashboards
```

### Features Implemented

- ✅ **Email Sending**: Admin can send emails to leads
- ✅ **Email Tracking**: Opens, clicks, bounces tracked
- ✅ **Webhook Integration**: Automatic tracking updates
- ✅ **SDR Visibility**: SDRs see emails sent to their leads
- ✅ **Email History**: Full history in both dashboards
- ✅ **Human Behavior Checks**: Respects working hours, weekends, contact frequency

## 📝 Environment Variables Checklist

### Required:
- [ ] `RESEND_API_KEY` - Your Resend API key

### Optional but Recommended:
- [ ] `EMAIL_FROM` - Custom from email address
- [ ] `EMAIL_REPLY_TO` - Reply-to email address
- [ ] `RESEND_WEBHOOK_SECRET` - Webhook signature verification

## 🚀 Next Steps

1. **Add API Key**: Follow Step 3 above
2. **Test Email**: Send a test email from admin dashboard
3. **Configure Webhook**: Follow Step 4 for tracking
4. **Verify Domain**: Follow Step 5 for better deliverability
5. **Monitor**: Check Resend dashboard regularly

## 📞 Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Resend Discord**: https://resend.com/discord

---

## ✅ Quick Verification Checklist

- [ ] Resend account created
- [ ] API key generated
- [ ] `RESEND_API_KEY` added to `.env.local`
- [ ] `RESEND_API_KEY` added to Vercel
- [ ] Test email sent successfully
- [ ] Email received in inbox
- [ ] Webhook configured (optional)
- [ ] Domain verified (optional)
- [ ] Email tracking working (opens/clicks)

Once all checked, Resend is fully configured! 🎉
