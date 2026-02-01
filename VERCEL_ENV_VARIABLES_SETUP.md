# 🔐 Vercel Environment Variables Setup

## ✅ Required Environment Variables for Production

You **MUST** add these to Vercel for your app to work:

---

## 🔴 **CRITICAL - Required for App to Function**

### **1. Supabase Database**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**✅ YES - Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel!**

**Why:** 
- Required for all database operations
- Used by admin dashboard, SDR authentication, lead storage
- Without it, the app cannot access the database

**Security Note:**
- ⚠️ This key has **full database access**
- ✅ Safe to add to Vercel (server-side only, never exposed to browser)
- ❌ Never commit to Git
- ❌ Never expose in client-side code

---

### **2. Lead Gen Integration**
```env
LEAD_GEN_INTEGRATION_TOKEN=your_secure_token_here
```

**✅ YES - Add to Vercel!**

**Why:** Required for lead gen tool to send leads

---

### **3. Admin Dashboard**
```env
ADMIN_DASHBOARD_TOKEN=your_secure_admin_token_here
```

**✅ YES - Add to Vercel!**

**Why:** Required for admin dashboard authentication

---

### **4. SDR & Desktop App**
```env
SENDER_SERVICE_TOKEN=your_secure_sender_token_here
```

**✅ YES - Add to Vercel!**

**Why:** Required for desktop WhatsApp sender app

---

## 🟡 **Optional but Recommended**

### **5. OpenAI (AI Features)**
```env
OPENAI_API_KEY=sk-proj-your_key_here
```

**Optional:** Only needed if you use AI message generation

---

### **6. Email Service (Resend)**
```env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=LK Lead Outreach <noreply@lkdigital.org>
```

**Optional:** Only needed if you send emails

---

## 📋 Complete Vercel Setup Checklist

### **Step 1: Go to Vercel Dashboard**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Click **"Add New"**

### **Step 2: Add Each Variable**

For **each** variable:
1. **Name:** Enter the variable name (e.g., `SUPABASE_SERVICE_ROLE_KEY`)
2. **Value:** Paste the value from your `.env.local`
3. **Environments:** Check **ALL**:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
4. Click **"Save"**

### **Step 3: Required Variables List**

Add these **in order**:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY          ← YES, add this!
✅ LEAD_GEN_INTEGRATION_TOKEN
✅ ADMIN_DASHBOARD_TOKEN
✅ SENDER_SERVICE_TOKEN
⚪ OPENAI_API_KEY (optional)
⚪ RESEND_API_KEY (optional)
⚪ EMAIL_FROM (optional)
```

---

## 🔒 Security Best Practices

### **Safe to Add to Vercel (Server-Side Only):**
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Server-side only, never exposed
- ✅ `LEAD_GEN_INTEGRATION_TOKEN` - API authentication
- ✅ `ADMIN_DASHBOARD_TOKEN` - Admin authentication
- ✅ `SENDER_SERVICE_TOKEN` - Desktop app authentication
- ✅ `OPENAI_API_KEY` - Server-side API calls
- ✅ `RESEND_API_KEY` - Server-side email sending

### **Safe to Expose (NEXT_PUBLIC_*):**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Public URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Limited by RLS (Row Level Security)

### **Never Do:**
- ❌ Commit secrets to Git
- ❌ Share tokens publicly
- ❌ Use service role key in client-side code
- ❌ Expose tokens in browser console

---

## 🧪 Verify Setup

After adding variables:

1. **Redeploy** your Vercel project
2. **Test the integration:**
   ```bash
   curl https://your-domain.vercel.app/api/integration/status \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
3. **Check logs** in Vercel dashboard for any errors

---

## 📝 Quick Copy-Paste Template

Copy these from your `.env.local` to Vercel:

```env
# Database (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          ← IMPORTANT!

# Integration (REQUIRED)
LEAD_GEN_INTEGRATION_TOKEN=...

# Admin (REQUIRED)
ADMIN_DASHBOARD_TOKEN=...

# SDR (REQUIRED)
SENDER_SERVICE_TOKEN=...

# Optional
OPENAI_API_KEY=...
RESEND_API_KEY=...
EMAIL_FROM=...
```

---

## ⚠️ Important Notes

1. **Service Role Key is Safe in Vercel:**
   - It's only used server-side (in API routes)
   - Never sent to the browser
   - Vercel encrypts environment variables
   - Only accessible to your deployment

2. **After Adding Variables:**
   - Vercel will automatically redeploy
   - Or manually trigger a redeploy
   - Wait for deployment to complete

3. **Test After Deployment:**
   - Test integration endpoint
   - Test admin dashboard
   - Verify database connections work

---

## ✅ Summary

**YES, add `SUPABASE_SERVICE_ROLE_KEY` to Vercel!**

It's:
- ✅ Required for the app to work
- ✅ Safe (server-side only)
- ✅ Encrypted by Vercel
- ✅ Never exposed to clients

**Without it, your app cannot:**
- Access the database
- Store leads
- Authenticate users
- Run admin functions

---

**Last Updated:** 2025-01-15
