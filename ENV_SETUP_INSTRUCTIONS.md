# 🔐 Environment Variables Setup

## Create `.env.local` File

Since `.env.local` is in `.gitignore`, you need to create it manually.

### Step 1: Create the File

**Windows (PowerShell):**
```powershell
cd "C:\dev\LK Lead Outreach"
New-Item -Path ".env.local" -ItemType File
```

**Windows (Command Prompt):**
```cmd
cd "C:\dev\LK Lead Outreach"
type nul > .env.local
```

**Or manually:**
1. Open your code editor
2. Create a new file named `.env.local` in the root directory
3. Copy the content below

### Step 2: Add Your Credentials

Copy this template into `.env.local`:

```env
# ============================================
# SUPABASE (Required)
# ============================================
# Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# OPTIONAL - OpenAI (For AI Message Generation)
# ============================================
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_key_here

# ============================================
# OPTIONAL - Sender Service (For Desktop App)
# ============================================
# Generate a secure random token (min 32 chars)
# SENDER_SERVICE_TOKEN=your_secure_token_here
```

### Step 3: Get Your Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### Step 4: Verify File Location

Make sure `.env.local` is in the root directory:
```
C:\dev\LK Lead Outreach\
├── .env.local          ← HERE
├── app\
├── components\
├── package.json
└── ...
```

### Step 5: Restart Server

After creating/updating `.env.local`:
```bash
# Stop server (Ctrl + C)
npm run dev  # Start again
```

## ✅ Verify It's Working

The app should start without errors. If you see:
- ❌ "Missing Supabase environment variables" → Check file name and location
- ❌ "Invalid Supabase URL" → Check URL format
- ✅ No errors → You're good to go!

## 📝 Notes

- `.env.local` is in `.gitignore` (won't be committed to Git)
- Never share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- Restart the server after changing environment variables
