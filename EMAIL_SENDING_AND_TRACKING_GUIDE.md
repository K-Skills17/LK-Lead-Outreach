# 📧 Email Sending and Tracking System - Complete Guide

## ✅ Feature Status: **IMPLEMENTED**

Admins can send emails to leads, and SDRs can see all email history for their assigned leads, including open/click tracking.

---

## 🎯 Features

### **Admin Features:**
- ✅ **Send emails** to any lead (admin-only)
- ✅ **Email modal** with subject and content editor
- ✅ **Automatic tracking** of all sent emails
- ✅ **Links to SDR** - emails automatically appear in SDR's queue

### **SDR Features:**
- ✅ **Email history tab** showing all emails sent to their leads
- ✅ **Open tracking** - see which emails were opened
- ✅ **Click tracking** - see which links were clicked
- ✅ **Email content** - view full email content
- ✅ **Status indicators** - visual badges for opened/clicked/not opened
- ✅ **Click URLs** - see which URLs were clicked

---

## 🏗️ Architecture

```
Admin Dashboard
    ↓
    ├─ Click "Email" button on lead
    ├─ Opens email modal
    ├─ Enter subject & content
    └─ Send email
         ↓
    API: POST /api/admin/emails/send
         ↓
    Resend API (sends email)
         ↓
    Database: email_sends table (tracks email)
         ↓
    Resend Webhook: /api/webhooks/resend
         ↓
    Updates: opens, clicks, bounces
         ↓
    SDR Dashboard
         ├─ "Emails" tab
         ├─ Shows all emails for assigned leads
         └─ Displays open/click status
```

---

## 📋 Database Schema

### **`email_sends` Table**
Tracks all emails sent to leads:

- **Lead Info**: `campaign_contact_id`, `lead_email`, `lead_name`, `lead_company`
- **SDR Assignment**: `assigned_sdr_id` (automatically linked)
- **Email Content**: `subject`, `html_content`, `text_content`
- **Tracking**: `sent_at`, `opened_at`, `clicked_at`, `open_count`, `click_count`
- **Status Flags**: `is_opened`, `is_clicked`, `is_bounced`, `is_complained`
- **Click URLs**: `clicked_urls` (JSONB array)

### **`email_events` Table**
Detailed event log:

- **Event Types**: `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`
- **Metadata**: `user_agent`, `ip_address`, `location_data`, `clicked_url`
- **Timestamps**: `occurred_at`

**Migration:** Run `supabase/migrations/012_email_tracking.sql`

---

## 🔌 API Endpoints

### **1. Send Email (Admin Only)**
```
POST /api/admin/emails/send
Headers: Authorization: Bearer {admin-token}
Body: {
  contactId: "uuid",
  subject: "Email subject",
  htmlContent: "<p>HTML content</p>",
  textContent: "Plain text content" (optional)
}

Response: {
  success: true,
  emailId: "uuid",
  resendEmailId: "resend-id",
  message: "Email sent successfully"
}
```

### **2. Get Email History (SDR)**
```
GET /api/sdr/emails
Headers: Authorization: Bearer {sdr-id}
Query: ?contactId=uuid (optional - filter by contact)

Response: {
  success: true,
  emails: [
    {
      id: "uuid",
      subject: "...",
      html_content: "...",
      lead_email: "...",
      is_opened: true,
      is_clicked: true,
      open_count: 3,
      click_count: 1,
      clicked_urls: ["https://..."],
      sent_at: "2025-02-01T...",
      opened_at: "2025-02-01T...",
      clicked_at: "2025-02-01T...",
      campaign_contacts: { ... },
      campaigns: { ... },
      events: [ ... ]
    }
  ],
  count: 10
}
```

### **3. Resend Webhook (Automatic)**
```
POST /api/webhooks/resend
Headers: resend-signature: {signature}
Body: Resend webhook event

Handles:
- email.delivered
- email.opened
- email.clicked
- email.bounced
- email.complained
```

---

## 🎨 UI Components

### **Admin Dashboard - Leads Tab**

**Email Button:**
- Appears next to each lead (if lead has email)
- Green "Email" button with mail icon
- Opens email modal

**Email Modal:**
- Shows lead email and name
- Subject input field
- HTML content textarea
- Send button with loading state
- Cancel button

### **SDR Dashboard - Emails Tab**

**Email List:**
- All emails sent to assigned leads
- Sorted by most recent first
- Shows:
  - Subject line
  - Lead name and company
  - Campaign name
  - Sent date/time
  - Open/Click status badges
  - Open count and click count
  - Full email content
  - Clicked URLs (if any)

**Status Badges:**
- 🟢 **Opened** - Green badge with eye icon
- 🔵 **Clicked** - Blue badge with click icon
- ⚪ **Not Opened** - Gray badge

---

## 🔄 Email Flow

### **Step 1: Admin Sends Email**
1. Admin goes to Leads tab
2. Clicks "Email" button on a lead
3. Modal opens with pre-filled subject/content
4. Admin edits and clicks "Send Email"
5. API sends via Resend
6. Email record created in database
7. Linked to lead and SDR automatically

### **Step 2: Email Tracking**
1. Resend sends email
2. Recipient opens email
3. Resend webhook fires → `/api/webhooks/resend`
4. Webhook updates `email_sends` table:
   - Sets `is_opened = true`
   - Increments `open_count`
   - Sets `opened_at` timestamp
5. Creates event in `email_events` table

### **Step 3: Click Tracking**
1. Recipient clicks link in email
2. Resend webhook fires with click event
3. Webhook updates:
   - Sets `is_clicked = true`
   - Increments `click_count`
   - Adds URL to `clicked_urls` array
   - Sets `clicked_at` timestamp
4. Creates click event in `email_events`

### **Step 4: SDR Views Email History**
1. SDR goes to "Emails" tab
2. API fetches all emails for their assigned leads
3. Displays with status indicators
4. Shows open/click counts and URLs

---

## ⚙️ Configuration

### **1. Run Database Migration**
```sql
-- In Supabase SQL Editor
\i supabase/migrations/012_email_tracking.sql
```

### **2. Configure Resend Webhook**

1. Go to **Resend Dashboard** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/webhooks/resend`
3. Select events:
   - ✅ `email.delivered`
   - ✅ `email.opened`
   - ✅ `email.clicked`
   - ✅ `email.bounced`
   - ✅ `email.complained`
4. Copy webhook secret
5. Add to `.env.local`:
   ```env
   RESEND_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### **3. Environment Variables**

Already configured:
- ✅ `RESEND_API_KEY` - For sending emails
- ✅ `EMAIL_FROM` - Default sender email
- ✅ `EMAIL_REPLY_TO` - Reply-to address
- ⚠️ `RESEND_WEBHOOK_SECRET` - **Add this for webhook verification**

---

## 📊 Email Tracking Details

### **What Gets Tracked:**

1. **Sent**: When email was sent
2. **Delivered**: When email was delivered to recipient's server
3. **Opened**: 
   - First open time
   - Last open time
   - Total open count
   - User agent and IP (if available)
4. **Clicked**:
   - First click time
   - Last click time
   - Total click count
   - All clicked URLs
   - User agent and IP (if available)
5. **Bounced**: Bounce type and reason
6. **Complained**: Spam complaint timestamp

### **SDR Visibility:**

SDRs can see:
- ✅ All emails sent to their assigned leads
- ✅ Email subject and full content
- ✅ When email was sent
- ✅ Whether email was opened
- ✅ How many times it was opened
- ✅ Whether any links were clicked
- ✅ Which URLs were clicked
- ✅ Campaign context

SDRs **cannot**:
- ❌ Send emails (admin-only)
- ❌ See emails for leads not assigned to them
- ❌ Edit email content

---

## 🧪 Testing

### **Test Email Sending:**

1. **Login as Admin**
   - Go to `/admin`
   - Login with admin credentials

2. **Send Test Email**
   - Go to "Leads" tab
   - Find a lead with email address
   - Click "Email" button
   - Fill in subject and content
   - Click "Send Email"
   - Should see success message

3. **Verify in Database**
   ```sql
   SELECT * FROM email_sends 
   ORDER BY sent_at DESC 
   LIMIT 1;
   ```

### **Test Email Tracking:**

1. **Open Email**
   - Check your email inbox
   - Open the email
   - Wait 1-2 minutes for webhook

2. **Check Tracking**
   ```sql
   SELECT is_opened, open_count, opened_at 
   FROM email_sends 
   WHERE resend_email_id = 'your-email-id';
   ```

3. **Click Link**
   - Click any link in the email
   - Wait for webhook
   - Check `is_clicked` and `clicked_urls`

### **Test SDR View:**

1. **Login as SDR**
   - Go to `/sdr/login`
   - Login with SDR credentials

2. **View Emails**
   - Go to "Emails" tab
   - Should see all emails for assigned leads
   - Check status badges
   - Verify email content is displayed

---

## 🔒 Security

- ✅ **Admin-only sending** - Only admins can send emails
- ✅ **SDR filtering** - SDRs only see emails for their assigned leads
- ✅ **Webhook verification** - Optional signature verification
- ✅ **Token authentication** - All endpoints require valid tokens

---

## 📝 Notes

1. **Email Content**: Supports HTML. Plain text is also stored for fallback.

2. **Automatic SDR Linking**: When an email is sent, it's automatically linked to the lead's assigned SDR (if any).

3. **Webhook Reliability**: Resend webhooks may take 1-2 minutes to arrive. Opens/clicks are tracked asynchronously.

4. **Multiple Opens/Clicks**: The system tracks total counts, not just first occurrence.

5. **Click URL Tracking**: All unique URLs clicked are stored in the `clicked_urls` array.

---

## 🚀 Next Steps

1. **Run Migration**: Execute `012_email_tracking.sql` in Supabase
2. **Configure Webhook**: Set up Resend webhook URL and secret
3. **Test Sending**: Send a test email from admin dashboard
4. **Test Tracking**: Open and click the email, verify tracking works
5. **Test SDR View**: Login as SDR and verify email history appears

---

## 📞 Support

If you need help:
- Check Resend dashboard for email delivery status
- Check webhook logs in Resend dashboard
- Verify `RESEND_WEBHOOK_SECRET` is set correctly
- Check database `email_events` table for webhook events

All code has been pushed to GitHub and will deploy to Vercel automatically! 🎉
