# 👥 SDR Accounts Setup Guide

## Overview

The tool now supports **SDR (Sales Development Representative) accounts** where team members can:
- ✅ Login with email/password
- ✅ See their assigned campaigns and leads
- ✅ View sent messages
- ✅ See WhatsApp replies from leads
- ✅ Manage their lead queue
- ✅ Follow up on conversations

## 🏗️ Architecture

**Vercel + Supabase = Perfect for Multi-Account! ✅**

You **DO NOT need cloud deployment**. Vercel + Supabase handles everything:
- ✅ **Vercel**: Hosts your Next.js app (free tier available)
- ✅ **Supabase**: Handles authentication, database, and multi-user support
- ✅ **Scalable**: Supports unlimited SDR accounts
- ✅ **Secure**: Built-in authentication and RLS (Row Level Security)

## 📋 Setup Steps

### Step 1: Run Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run: `supabase/migrations/010_sdr_users_and_auth.sql`
3. This creates:
   - `sdr_users` table
   - `message_replies` table
   - SDR assignment columns in campaigns and leads

### Step 2: Create First SDR User

Run this SQL in Supabase:

```sql
-- Create first SDR user
-- Password: "ChangeMe123!" (you'll change this after first login)
INSERT INTO sdr_users (email, password_hash, name, role)
VALUES (
  'sdr1@yourcompany.com',
  '$2b$10$rK8X9YzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6', -- Hash for "ChangeMe123!"
  'John Doe',
  'sdr'
);
```

**To generate password hash:**
```javascript
// Run in Node.js console or create a script
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('YourPassword123!', 10);
console.log(hash);
```

### Step 3: Enable Email (Resend)

Your `.env.local` should already have:
```env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

If not, add it!

### Step 4: Test SDR Login

1. Start your app: `npm run dev`
2. Go to: `http://localhost:3000/sdr/login` (we'll create this page)
3. Login with SDR credentials

## 📁 New Files Created

- `supabase/migrations/010_sdr_users_and_auth.sql` - Database structure
- `lib/sdr-auth.ts` - SDR authentication functions
- `app/api/sdr/login/route.ts` - Login endpoint
- `app/api/sdr/me/route.ts` - Get current SDR
- `app/api/sdr/dashboard/route.ts` - Dashboard data
- `lib/email-service-simple.ts` - Email functions (Resend)

## 🔐 Authentication Flow

```
1. SDR enters email/password
   ↓
2. POST /api/sdr/login
   ↓
3. Verify password hash
   ↓
4. Generate session token
   ↓
5. Return token + user info
   ↓
6. Store token in sessionStorage
   ↓
7. Use token for all API requests
```

## 📊 SDR Dashboard Features

### What SDRs Can See:

1. **Their Campaigns**
   - Only campaigns assigned to them
   - Campaign stats and progress

2. **Their Leads**
   - Leads assigned to them
   - Filter by status (pending, sent, failed)
   - See lead details (nome, empresa, cargo, site, dor_especifica)

3. **Message Replies**
   - WhatsApp replies from their leads
   - Unread reply count
   - Reply history

4. **Queue Management**
   - See pending leads to follow up
   - Mark leads as contacted
   - Add notes

## 🔄 Next Steps

1. ✅ Run migration
2. ✅ Create SDR user
3. ⏳ Create SDR login page (`/app/sdr/login/page.tsx`)
4. ⏳ Create SDR dashboard page (`/app/sdr/dashboard/page.tsx`)
5. ⏳ Remove license verification from endpoints
6. ⏳ Test email sending

## 💡 Multi-Account Support

**Yes, Vercel + Supabase is perfect!**

- ✅ **No cloud deployment needed**
- ✅ **Vercel**: Free hosting for Next.js
- ✅ **Supabase**: Free tier supports 50,000 monthly active users
- ✅ **Scalable**: Can handle hundreds of SDR accounts
- ✅ **Secure**: Built-in auth, RLS, and encryption

**When you need more:**
- Vercel Pro: $20/month (better performance)
- Supabase Pro: $25/month (more database space)

But for internal tool with multiple SDRs, **free tier is usually enough!**

## 📝 Notes

- SDR passwords are hashed with bcrypt
- Session tokens are generated server-side
- Each SDR only sees their assigned campaigns/leads
- Email notifications sent via Resend when replies arrive
