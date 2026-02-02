# 📧 Email System Requirements Checklist

## ✅ What You Already Have

- ✅ **RESEND_API_KEY** - You have this configured

## 🔴 Required for Full Functionality

### 1. **Resend Webhook Configuration** (Recommended)

**Why:** Enables email tracking (opens, clicks, bounces)

**Setup:**
1. Go to Resend Dashboard → **Webhooks**
2. Click **"Create Webhook"**
3. Name: "LK Lead Outreach Email Tracking"
4. Endpoint URL: `https://your-domain.com/api/webhooks/resend`
5. Events to subscribe:
   - ✅ `email.delivered`
   - ✅ `email.opened`
   - ✅ `email.clicked`
   - ✅ `email.bounced`
   - ✅ `email.complained`
6. Copy the **Webhook Secret** (starts with `whsec_...`)
7. Add to environment variables:
   ```env
   RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

**Without this:** Emails will send, but you won't track opens/clicks/bounces.

---

## 🟡 Optional but Recommended

### 2. **OPENAI_API_KEY** (For AI Email Variations)

**Why:** Required for the "Generate 3 Email Variations" feature (A/B testing)

**Setup:**
1. Get API key from: https://platform.openai.com/api-keys
2. Add to `.env.local` and Vercel:
   ```env
   OPENAI_API_KEY=sk-proj-your_key_here
   ```

**Without this:** 
- ✅ You can still send emails manually
- ✅ You can still use email templates
- ❌ You cannot generate AI variations (3 variations for A/B testing)

---

### 3. **EMAIL_FROM** (Optional - Has Default)

**Current Default:** `LK Lead Outreach <noreply@lkdigital.org>`

**To Customize:**
```env
EMAIL_FROM=Your Company <noreply@yourdomain.com>
```

**Recommendation:** Use your verified domain for better deliverability.

---

### 4. **EMAIL_REPLY_TO** (Optional - Has Default)

**Current Default:** `contato@lkdigital.org`

**To Customize:**
```env
EMAIL_REPLY_TO=support@yourdomain.com
```

---

### 5. **Domain Verification in Resend** (Optional but Recommended)

**Why:** Better email deliverability, less likely to go to spam

**Setup:**
1. Go to Resend Dashboard → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `lkdigital.org`)
4. Add DNS records:
   - SPF record
   - DKIM record
   - DMARC record (optional)
5. Wait for verification (5-10 minutes)
6. Update `EMAIL_FROM` to use your verified domain

**Without this:** Emails still work, but may have lower deliverability.

---

## 📋 Quick Setup Checklist

### Minimum Setup (Emails Will Send):
- [x] ✅ RESEND_API_KEY (You have this)

### Recommended Setup (Full Features):
- [ ] 🔴 Configure Resend Webhook (for tracking)
- [ ] 🟡 Add OPENAI_API_KEY (for AI variations)
- [ ] 🟡 Set EMAIL_FROM (customize sender)
- [ ] 🟡 Set EMAIL_REPLY_TO (customize reply-to)
- [ ] 🟡 Verify domain in Resend (better deliverability)

---

## 🎯 What Works With Just RESEND_API_KEY

✅ **Email Sending:**
- Send emails manually from admin dashboard
- Use email templates
- Send to individual leads or bulk

❌ **What Doesn't Work:**
- Email tracking (opens, clicks, bounces) - needs webhook
- AI email variations - needs OPENAI_API_KEY
- A/B testing analytics - needs webhook + OPENAI_API_KEY

---

## 🚀 Next Steps

1. **Immediate:** Test email sending (should work now)
2. **This Week:** Configure webhook for tracking
3. **This Week:** Add OPENAI_API_KEY if you want AI variations
4. **This Month:** Verify domain for better deliverability

---

## 📝 Environment Variables Summary

### Required:
```env
RESEND_API_KEY=re_your_key_here
```

### Recommended:
```env
RESEND_API_KEY=re_your_key_here
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret_here
OPENAI_API_KEY=sk-proj-your_key_here
EMAIL_FROM=Your Company <noreply@yourdomain.com>
EMAIL_REPLY_TO=support@yourdomain.com
```

---

## ✅ Test Your Setup

### Test 1: Send Email
1. Go to Admin Dashboard
2. Select a lead
3. Click "Email" button
4. Send a test email
5. Check inbox

### Test 2: Check Tracking (if webhook configured)
1. Send an email
2. Open the email
3. Click a link in the email
4. Check Admin Dashboard → Email History
5. Should show: Opened ✅, Clicked ✅

### Test 3: Generate AI Variations (if OPENAI_API_KEY set)
1. Go to Admin Dashboard
2. Select a lead
3. Click "Email" → "Generate Variations"
4. Should see 3 AI-generated email variations

---

## 🔍 Troubleshooting

### "Emails not sending"
- ✅ Check RESEND_API_KEY is set correctly
- ✅ Check Resend dashboard for errors
- ✅ Verify email address is valid

### "No email tracking"
- ✅ Configure webhook in Resend dashboard
- ✅ Add RESEND_WEBHOOK_SECRET to environment
- ✅ Verify webhook URL is correct

### "AI variations not working"
- ✅ Check OPENAI_API_KEY is set
- ✅ Verify API key is valid
- ✅ Check OpenAI account has credits

---

## 📞 Support

- **Resend Docs:** https://resend.com/docs
- **Resend Support:** support@resend.com
- **OpenAI Docs:** https://platform.openai.com/docs
