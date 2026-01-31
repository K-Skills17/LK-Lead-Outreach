# 📋 Complete .env.local Template

Since `.env.local` is in `.gitignore`, I've created a template file for you.

## 🚀 Quick Setup

1. **Open `.env.local`** in your code editor
2. **Copy the entire content below** into it
3. **Fill in your actual values** (replace placeholders)

---

## 📝 Complete Template

```env
# ============================================
# 🔐 LK LEAD OUTREACH - Environment Variables
# ============================================

# ============================================
# ✅ REQUIRED - Supabase (Database & Backend)
# ============================================
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2MTYyMzkwMjIsImV4cCI6MTkzMTgxNTAyMn0.your_service_role_key_here

# ============================================
# 🤖 RECOMMENDED - OpenAI (AI Message Generation)
# ============================================
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# ============================================
# 🖥️ RECOMMENDED - Sender Service (Desktop App)
# ============================================
# Generate a secure random token (min 32 characters)
# Windows PowerShell: -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
SENDER_SERVICE_TOKEN=your_secure_random_token_min_32_characters_here

# ============================================
# 🔑 OPTIONAL - License Verification
# ============================================
# LICENSE_VERIFY_ENDPOINT=https://hook.us2.make.com/your-webhook-id

# ============================================
# 📧 OPTIONAL - Email Service (Resend)
# ============================================
# RESEND_API_KEY=re_your_resend_api_key_here
# EMAIL_FROM=noreply@yourdomain.com

# ============================================
# 📊 OPTIONAL - Analytics & Tracking
# ============================================
# NEXT_PUBLIC_FB_PIXEL_ID=1410687670551454
# FB_CAPI_ACCESS_TOKEN=EAAMCby...your_facebook_access_token
# FB_TEST_EVENT_CODE=TEST12345
```

---

## ✅ What You MUST Fill In

### 1. Supabase (Required)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (⚠️ Keep secret!)

**Where to get:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy the values

### 2. OpenAI (Recommended for AI features)
- `OPENAI_API_KEY` - Your OpenAI API key (starts with `sk-`)

**Where to get:**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key

### 3. Sender Service Token (Recommended for desktop app)
- `SENDER_SERVICE_TOKEN` - Random secure token (min 32 chars)

**Generate one:**
```powershell
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Or use: https://www.random.org/strings/

---

## 📋 Variable Categories

### ✅ Required (App won't work without these)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 🤖 Recommended (For full functionality)
- `OPENAI_API_KEY` - AI message generation
- `SENDER_SERVICE_TOKEN` - Desktop app integration

### 🔑 Optional (Only if you use these features)
- `LICENSE_VERIFY_ENDPOINT` - External license verification
- `RESEND_API_KEY` - Email sending
- `NEXT_PUBLIC_FB_PIXEL_ID` - Facebook tracking
- `FB_CAPI_ACCESS_TOKEN` - Facebook Conversions API

---

## ⚠️ Important Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Restart server** after changing variables: `npm run dev`
3. **Keep secrets safe** - Don't share `SERVICE_ROLE_KEY` or `SENDER_SERVICE_TOKEN`
4. **Variables starting with `NEXT_PUBLIC_`** are exposed to the browser

---

## 🧪 Test Your Setup

After filling in the values, test:

```bash
npm run dev
```

If you see errors about missing environment variables, check:
1. File is named exactly `.env.local` (not `.env.local.txt`)
2. File is in the root directory
3. No extra spaces around `=` signs
4. Values are not wrapped in quotes (unless they contain spaces)

---

## 📁 File Location

Make sure `.env.local` is here:
```
C:\dev\LK Lead Outreach\
├── .env.local          ← HERE
├── app\
├── components\
├── package.json
└── ...
```
