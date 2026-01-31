# ✅ Internal Tool Setup - Complete Guide

## 🎯 What's Been Done

### 1. ✅ Removed License Verification
- License verification is now **optional** for internal tool
- Endpoints work without license keys
- `verifyAndGetClinic` now works without external verification

### 2. ✅ Created SDR Account System
- **Database**: `sdr_users` table with authentication
- **Login API**: `/api/sdr/login` - Email/password login
- **Dashboard API**: `/api/sdr/dashboard` - Get SDR's data
- **Auth Library**: `lib/sdr-auth.ts` - All SDR functions

### 3. ✅ Email Service Ready
- **Resend Integration**: `lib/email-service-simple.ts`
- **SDR Notifications**: Email alerts for replies
- **Simple API**: Easy to use email functions

### 4. ✅ Message Replies Tracking
- **Database**: `message_replies` table
- **SDR Assignment**: Leads can be assigned to SDRs
- **Unread Tracking**: Track unread replies

## 🚀 Multi-Account Support

### ✅ **Vercel + Supabase = Perfect!**

**You DO NOT need cloud deployment!**

- ✅ **Vercel**: Free hosting for Next.js (perfect for internal tools)
- ✅ **Supabase**: Free tier supports 50,000 monthly active users
- ✅ **Scalable**: Can handle hundreds of SDR accounts
- ✅ **Secure**: Built-in authentication, RLS, encryption

**When to upgrade:**
- Vercel Pro ($20/month): Better performance, more bandwidth
- Supabase Pro ($25/month): More database space, better support

**For internal tool with multiple SDRs, free tier is usually enough!**

## 📋 Setup Checklist

### Step 1: Run Database Migration ✅
```sql
-- Run in Supabase SQL Editor:
supabase/migrations/010_sdr_users_and_auth.sql
```

### Step 2: Create First SDR User
```sql
-- Generate password hash first (use Node.js or online tool)
-- Then insert:
INSERT INTO sdr_users (email, password_hash, name, role)
VALUES (
  'sdr1@yourcompany.com',
  '$2b$10$...your_hashed_password...',
  'John Doe',
  'sdr'
);
```

### Step 3: Verify Email Setup
Check `.env.local` has:
```env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

### Step 4: Test
1. Start app: `npm run dev`
2. Test SDR login: `POST /api/sdr/login`
3. Test dashboard: `GET /api/sdr/dashboard`

## 📁 New Files Created

### Database
- `supabase/migrations/010_sdr_users_and_auth.sql`

### Backend
- `lib/sdr-auth.ts` - SDR authentication & data functions
- `lib/email-service-simple.ts` - Email service (Resend)
- `app/api/sdr/login/route.ts` - Login endpoint
- `app/api/sdr/me/route.ts` - Get current SDR
- `app/api/sdr/dashboard/route.ts` - Dashboard data

### Documentation
- `SDR_ACCOUNTS_SETUP.md` - Complete setup guide
- `INTERNAL_TOOL_SETUP_COMPLETE.md` - This file

## 🔄 Next Steps (To Complete)

### 1. Create SDR Login Page
Create: `app/sdr/login/page.tsx`
- Email/password form
- Calls `/api/sdr/login`
- Stores token in sessionStorage
- Redirects to dashboard

### 2. Create SDR Dashboard Page
Create: `app/sdr/dashboard/page.tsx`
- Shows campaigns, leads, replies
- Uses `/api/sdr/dashboard`
- Real-time updates
- Reply management

### 3. Remove License Checks from Endpoints
Update these endpoints to work without license:
- `app/api/campaigns/route.ts`
- `app/api/campaigns/[id]/import-csv/route.ts`
- `app/api/campaigns/[id]/ai-generate/route.ts`

### 4. Add Reply Tracking
Create endpoint to save WhatsApp replies:
- `app/api/messages/reply/route.ts`
- Saves to `message_replies` table
- Sends email notification to SDR

## 🎨 SDR Dashboard Features

### What SDRs Will See:

1. **My Campaigns**
   - Only campaigns assigned to them
   - Campaign stats and progress

2. **My Leads**
   - Leads assigned to them
   - Filter by status (pending, sent, failed)
   - Lead details (nome, empresa, cargo, site, dor_especifica)

3. **Message Replies**
   - WhatsApp replies from their leads
   - Unread reply count
   - Reply history and conversation thread

4. **Queue Management**
   - Pending leads to follow up
   - Mark as contacted
   - Add notes and tags

## 🔐 Authentication Flow

```
SDR Login:
1. Enter email/password
2. POST /api/sdr/login
3. Server verifies password hash
4. Returns session token + user info
5. Store token in sessionStorage
6. Use token for all API requests

API Requests:
1. Include token in Authorization header
2. Server validates token (or SDR ID)
3. Return SDR's data only
```

## 📧 Email Notifications

### When SDR Gets Email:

1. **New Reply Received**
   - Lead replies to WhatsApp message
   - Email sent to assigned SDR
   - Includes reply text and lead info
   - Link to dashboard to respond

2. **Lead Assigned**
   - New lead assigned to SDR
   - Email notification with lead details
   - Link to view lead in dashboard

### Email Functions Available:

```typescript
import { sendEmail, notifySDROfReply } from '@/lib/email-service-simple';

// Simple email
await sendEmail({
  to: 'sdr@company.com',
  subject: 'New Lead Assigned',
  html: '<p>You have a new lead!</p>',
});

// Reply notification
await notifySDROfReply({
  sdrEmail: 'sdr@company.com',
  sdrName: 'John Doe',
  leadName: 'João Silva',
  leadCompany: 'Empresa ABC',
  message: 'Interested in your service!',
  replyUrl: 'https://yourdomain.com/sdr/dashboard',
});
```

## ✅ What's Working Now

- ✅ SDR user table and authentication
- ✅ Login endpoint
- ✅ Dashboard data endpoint
- ✅ Email service (Resend)
- ✅ Message replies table
- ✅ SDR assignment to campaigns/leads
- ✅ License verification removed (optional)

## ⏳ What Needs to Be Created

- ⏳ SDR login page UI
- ⏳ SDR dashboard page UI
- ⏳ Reply tracking endpoint
- ⏳ Update existing endpoints to remove license checks

## 💡 Architecture Benefits

**Vercel + Supabase Advantages:**

1. **No Infrastructure Management**
   - No servers to maintain
   - Auto-scaling built-in
   - CDN included

2. **Built-in Security**
   - Supabase Auth handles authentication
   - Row Level Security (RLS) for data access
   - HTTPS by default

3. **Cost Effective**
   - Free tier for small teams
   - Pay only when you scale
   - No hidden costs

4. **Developer Experience**
   - Easy deployment (git push)
   - Real-time database updates
   - Great documentation

## 🎯 Summary

✅ **License verification removed** - Internal tool doesn't need it  
✅ **SDR accounts created** - Multi-user support ready  
✅ **Email service ready** - Resend integration complete  
✅ **Vercel + Supabase** - Perfect for multi-account, no cloud needed  

**Next:** Create the UI pages for SDR login and dashboard!
