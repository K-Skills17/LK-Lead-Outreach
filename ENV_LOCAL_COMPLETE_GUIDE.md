# 🔐 Complete .env.local Guide

## Required Environment Variables for Lead Gen Integration, SDR Management, and Admin

---

## ✅ **REQUIRED - Core Functionality**

### **1. Supabase (Database & Auth)**
```env
# Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Used by:** All database operations, SDR authentication, admin dashboard, lead storage

---

### **2. Lead Generation Tool Integration** 🔗
```env
# Generate a secure random token (min 32 characters)
# This token is used by your Lead Gen Tool to authenticate API calls
LEAD_GEN_INTEGRATION_TOKEN=your_secure_random_token_min_32_chars_here
```
**Used by:**
- `POST /api/integration/leads/receive` - Receive enriched leads
- `POST /api/integration/webhook` - Webhook events
- `GET /api/integration/status` - Status check

**Generate token (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

---

### **3. Admin Dashboard** 👨‍💼
```env
# Secure token for admin dashboard authentication
ADMIN_DASHBOARD_TOKEN=your_secure_admin_token_here
```
**Used by:**
- `/admin` dashboard login
- `/api/admin/*` endpoints (analytics, overview, assign-lead, etc.)

**Generate token:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

---

### **4. Admin Setup (One-time)** 🔧
```env
# Token for initial admin setup (optional, for first-time setup)
ADMIN_SETUP_TOKEN=your_setup_token_here
```
**Used by:** `/api/admin/setup` - Initial admin account creation

---

## ⚠️ **CRITICAL - SDR & Desktop App Integration**

### **5. Sender Service Token** 📱
```env
# Token for desktop WhatsApp sender app authentication
# This allows the desktop app to communicate with your web app
SENDER_SERVICE_TOKEN=your_secure_sender_token_min_32_chars_here
```
**Used by:**
- `/api/sender/queue` - Get pending leads for WhatsApp
- `/api/sender/mark-sent` - Mark message as sent
- `/api/sender/mark-failed` - Mark message as failed
- `/api/sender/auth` - SDR authentication (backward compatibility)

**⚠️ WITHOUT THIS, THE DESKTOP APP CANNOT WORK!**

---

## 🎨 **OPTIONAL - But Recommended**

### **6. OpenAI (AI Message Generation)** 🤖
```env
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your_openai_key_here
```
**Used by:**
- `/api/campaigns/[id]/ai-generate` - Generate AI messages
- `/api/campaigns/[id]/leads/[leadId]/generate-message` - Generate personalized messages

---

### **7. Email Service (Resend)** 📧
```env
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_your_resend_api_key_here

# Optional: Custom from email
EMAIL_FROM=LK Lead Outreach <noreply@lkdigital.org>
```
**Used by:**
- Email sending in integration endpoint
- Email notifications

---

### **8. App URL (For Webhooks)** 🌐
```env
# Your production URL (for webhook callbacks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```
**Used by:** Internal webhook forwarding

---

## 📋 **Complete .env.local Template**

Copy this entire block to your `.env.local` file:

```env
# ============================================
# SUPABASE (Required)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# LEAD GENERATION TOOL INTEGRATION (Required)
# ============================================
LEAD_GEN_INTEGRATION_TOKEN=your_secure_random_token_min_32_chars

# ============================================
# ADMIN DASHBOARD (Required)
# ============================================
ADMIN_DASHBOARD_TOKEN=your_secure_admin_token_here
ADMIN_SETUP_TOKEN=your_setup_token_here

# ============================================
# SDR & DESKTOP APP (Critical)
# ============================================
SENDER_SERVICE_TOKEN=your_secure_sender_token_min_32_chars

# ============================================
# OPTIONAL - OpenAI (AI Features)
# ============================================
OPENAI_API_KEY=sk-proj-your_openai_key_here

# ============================================
# OPTIONAL - Email Service (Resend)
# ============================================
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=LK Lead Outreach <noreply@lkdigital.org>

# ============================================
# OPTIONAL - App URL
# ============================================
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🔑 **Quick Setup Checklist**

### For Lead Gen Tool Integration:
- [ ] `LEAD_GEN_INTEGRATION_TOKEN` - Generate and add
- [ ] Share this token with your Lead Gen Tool team
- [ ] Lead Gen Tool should use: `Authorization: Bearer {LEAD_GEN_INTEGRATION_TOKEN}`

### For SDR Management:
- [ ] `SENDER_SERVICE_TOKEN` - Generate and add
- [ ] Share this token with desktop app developers
- [ ] Desktop app uses this for authentication

### For Admin Dashboard:
- [ ] `ADMIN_DASHBOARD_TOKEN` - Generate and add
- [ ] `ADMIN_SETUP_TOKEN` - Generate for initial setup (optional)
- [ ] Access admin at: `/admin`

### For Database:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - From Supabase dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - From Supabase dashboard (keep secret!)

---

## 🔒 **Security Notes**

### **Never Commit These to Git:**
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- ❌ `LEAD_GEN_INTEGRATION_TOKEN` - Lead gen tool access
- ❌ `ADMIN_DASHBOARD_TOKEN` - Admin access
- ❌ `SENDER_SERVICE_TOKEN` - Desktop app access
- ❌ `OPENAI_API_KEY` - Costs money if abused
- ❌ `RESEND_API_KEY` - Email sending access

### **Safe to Expose (NEXT_PUBLIC_*):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Public URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Limited by RLS
- ✅ `NEXT_PUBLIC_APP_URL` - Public URL

---

## 🧪 **Testing Your Setup**

### 1. Check Environment Variables
Visit: `https://your-domain.com/api/admin/diagnostic`

Should show:
```json
{
  "status": "OK",
  "checks": {
    "NEXT_PUBLIC_SUPABASE_URL": true,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": true,
    "SUPABASE_SERVICE_ROLE_KEY": true,
    "ADMIN_DASHBOARD_TOKEN": true
  }
}
```

### 2. Test Lead Gen Integration
```bash
curl -X POST https://your-domain.com/api/integration/leads/receive \
  -H "Authorization: Bearer YOUR_LEAD_GEN_INTEGRATION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Test Lead",
    "empresa": "Test Company",
    "email": "test@example.com",
    "phone": "+5511999999999"
  }'
```

### 3. Test Admin Dashboard
- Go to: `https://your-domain.com/admin`
- Login with admin credentials
- Should see dashboard

### 4. Test SDR Queue
```bash
curl -X GET https://your-domain.com/api/sender/queue \
  -H "Authorization: Bearer YOUR_SENDER_SERVICE_TOKEN"
```

---

## 📝 **Token Generation Commands**

### PowerShell (Windows):
```powershell
# Generate 32-character random token
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Generate 64-character random token (more secure)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

### Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Online:
- https://randomkeygen.com/ (use CodeIgniter Encryption Key)

---

## 🚀 **For Vercel Deployment**

Make sure to add **ALL** these variables to:
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for **Production**, **Preview**, and **Development** environments
3. Redeploy after adding variables

---

## ✅ **Minimum Required for Basic Functionality**

If you only need the basics, these are the **absolute minimum**:

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Lead Gen Integration
LEAD_GEN_INTEGRATION_TOKEN=...

# Admin
ADMIN_DASHBOARD_TOKEN=...

# SDR/Desktop App
SENDER_SERVICE_TOKEN=...
```

Everything else is optional but recommended for full features.

---

**Last Updated:** 2025-01-15
