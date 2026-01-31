# 📝 How to Fill Your .env.local File

## ✅ Step-by-Step Instructions

### Step 1: Open Your .env.local File

Since you've already created it, just open it in your code editor.

**Location:** `C:\dev\LK Lead Outreach\.env.local`

### Step 2: Copy the Template

I've created a file called `COPY_TO_ENV_LOCAL.txt` with all the variables you need.

**Option A - Copy from file:**
1. Open `COPY_TO_ENV_LOCAL.txt` in this project
2. Copy everything (starting from line 5, after the header)
3. Paste into your `.env.local` file

**Option B - Copy from below:**
Copy the template below directly into your `.env.local`:

---

## 📋 Complete Template (Copy This)

```env
# ============================================
# ✅ REQUIRED - Supabase (Database & Backend)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# 🤖 RECOMMENDED - OpenAI (AI Message Generation)
# ============================================
OPENAI_API_KEY=sk-proj-your_openai_api_key_here

# ============================================
# 🖥️ RECOMMENDED - Sender Service (Desktop App)
# ============================================
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

## 🔍 Where to Get Each Value

### 1. Supabase (Required) ✅

**Get from:** https://supabase.com/dashboard

1. Go to Supabase Dashboard
2. Select your project
3. Click **Settings** (gear icon) → **API**
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.example_service_role_key
```

### 2. OpenAI (Recommended) 🤖

**Get from:** https://platform.openai.com/api-keys

1. Go to OpenAI Platform
2. Sign in
3. Click **API Keys** in sidebar
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)

**Example:**
```env
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### 3. Sender Service Token (Recommended) 🖥️

**Generate a secure random token:**

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Or use online generator:**
- https://www.random.org/strings/
- Set length: 32
- Characters: Letters and numbers

**Example:**
```env
SENDER_SERVICE_TOKEN=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5
```

---

## ✅ What's Required vs Optional

### ✅ **REQUIRED** (App won't work without these)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 🤖 **RECOMMENDED** (For full functionality)
- `OPENAI_API_KEY` - Enables AI message generation
- `SENDER_SERVICE_TOKEN` - Enables desktop app integration

### 🔑 **OPTIONAL** (Only if you use these features)
- `LICENSE_VERIFY_ENDPOINT` - External license verification
- `RESEND_API_KEY` - Email sending
- `NEXT_PUBLIC_FB_PIXEL_ID` - Facebook tracking
- `FB_CAPI_ACCESS_TOKEN` - Facebook Conversions API

---

## ⚠️ Important Notes

1. **No quotes needed** - Don't wrap values in quotes unless they contain spaces
2. **No spaces around `=`** - Use `KEY=value` not `KEY = value`
3. **Comments start with `#`** - Lines starting with `#` are ignored
4. **Restart server** after changes: `npm run dev`

---

## 🧪 Test Your Setup

After filling in the values:

```bash
npm run dev
```

If you see errors about missing variables:
1. ✅ Check file is named exactly `.env.local` (not `.env.local.txt`)
2. ✅ Check file is in root directory: `C:\dev\LK Lead Outreach\.env.local`
3. ✅ Check no extra spaces around `=` signs
4. ✅ Check values are correct (no typos)

---

## 📁 File Structure

Your `.env.local` should be here:
```
C:\dev\LK Lead Outreach\
├── .env.local          ← Your file (already created)
├── COPY_TO_ENV_LOCAL.txt  ← Template reference
├── app\
├── components\
└── package.json
```

---

## 🎯 Quick Checklist

- [ ] Copied template into `.env.local`
- [ ] Filled in `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Filled in `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Filled in `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Filled in `OPENAI_API_KEY` (if using AI)
- [ ] Generated and filled in `SENDER_SERVICE_TOKEN` (if using desktop app)
- [ ] Saved the file
- [ ] Restarted server: `npm run dev`

---

**Need help?** Check `ENV_SETUP_INSTRUCTIONS.md` for more details!
