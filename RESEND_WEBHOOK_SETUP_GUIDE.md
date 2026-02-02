# 🔗 Resend Webhook Setup Guide

## 📋 Prerequisites

- ✅ Resend account created
- ✅ RESEND_API_KEY configured
- ✅ Your app deployed (Vercel or other hosting)

---

## 🎯 Step-by-Step Setup

### Step 1: Find Your Webhook URL

Your webhook URL will be:
```
https://YOUR-DOMAIN.com/api/webhooks/resend
```

**Examples:**
- **Vercel:** `https://your-app-name.vercel.app/api/webhooks/resend`
- **Custom Domain:** `https://lkdigital.org/api/webhooks/resend`
- **Local Dev:** `http://localhost:3000/api/webhooks/resend` (for testing only)

**To find your Vercel URL:**
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Check the latest deployment
4. Copy the URL (e.g., `https://lk-lead-outreach.vercel.app`)

---

### Step 2: Create Webhook in Resend Dashboard

1. **Go to Resend Dashboard**
   - Visit: https://resend.com/webhooks
   - Or: Dashboard → **Webhooks** (left sidebar)

2. **Click "Create Webhook"**

3. **Fill in the details:**
   - **Name:** `LK Lead Outreach Email Tracking`
   - **Endpoint URL:** `https://YOUR-DOMAIN.com/api/webhooks/resend`
     - ⚠️ Replace `YOUR-DOMAIN` with your actual domain
   - **Events to subscribe:**
     - ✅ `email.delivered` - Track when emails are delivered
     - ✅ `email.opened` - Track when emails are opened
     - ✅ `email.clicked` - Track when links are clicked
     - ✅ `email.bounced` - Track bounced emails
     - ✅ `email.complained` - Track spam complaints

4. **Click "Create"**

5. **Copy the Webhook Secret**
   - After creating, you'll see a **Webhook Secret** (starts with `whsec_...`)
   - ⚠️ **IMPORTANT:** Copy this immediately - you'll only see it once!
   - Save it securely

---

### Step 3: Add Webhook Secret to Environment Variables

#### A) Local Development (`.env.local`)

Open your `.env.local` file and add:

```env
# Resend Webhook (for email tracking)
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Replace `whsec_your_webhook_secret_here` with the actual secret from Step 2.**

#### B) Production (Vercel)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Click **"Add New"**

3. Fill in:
   - **Name:** `RESEND_WEBHOOK_SECRET`
   - **Value:** `whsec_your_webhook_secret_here` (paste the secret from Step 2)
   - **Environments:** Select all (Production, Preview, Development)

4. Click **Save**

5. **Redeploy** (Vercel will auto-redeploy, or manually trigger a redeploy)

---

### Step 4: Test the Webhook

#### Test 1: Send a Test Email

1. Go to your Admin Dashboard
2. Select a lead with an email address
3. Click **"Email"** button
4. Send a test email to yourself
5. **Open the email** (this triggers the "opened" event)
6. **Click a link** in the email (this triggers the "clicked" event)

#### Test 2: Check Resend Dashboard

1. Go to Resend Dashboard → **Webhooks**
2. Click on your webhook
3. Check **"Recent Events"** tab
4. You should see:
   - `email.delivered` ✅
   - `email.opened` ✅ (after you open the email)
   - `email.clicked` ✅ (after you click a link)

#### Test 3: Check Your App Dashboard

1. Go to Admin Dashboard → **Email History** tab
2. Find the test email you sent
3. You should see:
   - **Opened:** ✅ (if you opened it)
   - **Clicked:** ✅ (if you clicked a link)
   - **Open Count:** 1+
   - **Click Count:** 1+

#### Test 4: Check Vercel Logs (Optional)

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click latest deployment → **Runtime Logs**
3. Filter by `/api/webhooks/resend`
4. You should see:
   ```
   [Resend Webhook] Email opened: [email_id]
   [Resend Webhook] Email clicked: [email_id]
   ```

---

## 🔍 Troubleshooting

### Issue 1: Webhook Not Receiving Events

**Symptoms:**
- No events in Resend dashboard
- Email tracking not working

**Solutions:**
1. ✅ Verify webhook URL is correct (no typos)
2. ✅ Check webhook is **Active** in Resend dashboard
3. ✅ Verify your app is deployed and accessible
4. ✅ Check Vercel logs for errors
5. ✅ Test webhook URL manually:
   ```bash
   curl -X POST https://YOUR-DOMAIN.com/api/webhooks/resend \
     -H "Content-Type: application/json" \
     -d '{"type":"email.delivered","data":{"email_id":"test"}}'
   ```

### Issue 2: "Invalid Signature" Error

**Symptoms:**
- Webhook events show "401 Unauthorized" in Resend dashboard
- Vercel logs show "Invalid signature"

**Solutions:**
1. ✅ Verify `RESEND_WEBHOOK_SECRET` is set correctly
2. ✅ Check for extra spaces or quotes in `.env.local`
3. ✅ Ensure secret matches the one in Resend dashboard
4. ✅ Redeploy after adding the secret

### Issue 3: Events Received But Not Tracked

**Symptoms:**
- Events appear in Resend dashboard
- But email tracking not updating in your app

**Solutions:**
1. ✅ Check Vercel logs for errors
2. ✅ Verify `email_sends` table exists in database
3. ✅ Check database connection
4. ✅ Verify `resend_email_id` is being saved when sending emails

### Issue 4: Webhook Works Locally But Not in Production

**Solutions:**
1. ✅ Ensure `RESEND_WEBHOOK_SECRET` is added to Vercel
2. ✅ Use production URL in Resend webhook (not localhost)
3. ✅ Redeploy after adding environment variable
4. ✅ Check Vercel environment variables are set for Production

---

## 📊 What Gets Tracked

Once configured, the webhook automatically tracks:

| Event | What It Tracks | Where You See It |
|-------|---------------|-----------------|
| `email.delivered` | Email successfully delivered | Admin Dashboard → Email History |
| `email.opened` | Email was opened | Shows "Opened ✅" badge |
| `email.clicked` | Link in email was clicked | Shows "Clicked ✅" badge + click count |
| `email.bounced` | Email bounced (invalid address) | Shows "Bounced ⚠️" badge |
| `email.complained` | Marked as spam | Shows "Complained ⚠️" badge |

---

## ✅ Verification Checklist

- [ ] Webhook created in Resend dashboard
- [ ] Webhook URL is correct (production domain)
- [ ] All events subscribed (delivered, opened, clicked, bounced, complained)
- [ ] Webhook Secret copied
- [ ] `RESEND_WEBHOOK_SECRET` added to `.env.local`
- [ ] `RESEND_WEBHOOK_SECRET` added to Vercel
- [ ] App redeployed (if on Vercel)
- [ ] Test email sent
- [ ] Test email opened
- [ ] Test email link clicked
- [ ] Events appear in Resend dashboard
- [ ] Tracking shows in Admin Dashboard

---

## 🎯 Quick Reference

**Webhook URL Format:**
```
https://YOUR-DOMAIN.com/api/webhooks/resend
```

**Environment Variable:**
```env
RESEND_WEBHOOK_SECRET=whsec_your_secret_here
```

**Resend Dashboard:**
- Webhooks: https://resend.com/webhooks
- Emails: https://resend.com/emails

**Vercel Environment Variables:**
- Settings → Environment Variables

---

## 🚀 Next Steps

After webhook is configured:

1. ✅ **Test thoroughly** - Send multiple test emails
2. ✅ **Monitor** - Check Resend dashboard regularly
3. ✅ **Verify tracking** - Ensure opens/clicks are recorded
4. ✅ **Set up alerts** - Configure notifications for bounces/complaints

---

## 📞 Support

- **Resend Webhook Docs:** https://resend.com/docs/webhooks
- **Resend Support:** support@resend.com
- **Vercel Logs:** Check deployment logs for errors

---

**Once all steps are complete, your email tracking will be fully functional!** 🎉
