# 🔧 Step-by-Step Admin Login Fix Guide

## Step 1: Check Your Environment Variables

Run this to verify your `.env.local` structure:

```powershell
.\check-env-structure.ps1
```

**What it checks:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access
- ✅ `ADMIN_DASHBOARD_TOKEN` - Admin authentication token

**If any are missing:**
- Get Supabase keys from: https://supabase.com/dashboard → Your Project → Settings → API
- Generate `ADMIN_DASHBOARD_TOKEN`:
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```

---

## Step 2: Verify Server is Running

Make sure your Next.js server is running:

```powershell
npm run dev
```

**Wait for:** `Ready in X seconds` message

**Important:** If you just changed `.env.local`, you MUST restart the server!

---

## Step 3: Test the Login API

Run the simple test:

```powershell
.\test-admin-login-simple.ps1 -Email "your-email@example.com" -Password "YourPassword"
```

**What this does:**
- Checks if server is running
- Tests the login API endpoint
- Shows detailed error messages

**If it says "Login Successful":**
- ✅ You're done! The login works.

**If it says "Email or password incorrect":**
- Go to Step 4

---

## Step 4: Diagnose the Password Issue

If login fails, run the full diagnostic:

```powershell
.\diagnose-admin-login.ps1 -Email "your-email@example.com" -Password "YourPassword"
```

**What this does:**
1. Checks if admin exists in database
2. Validates password hash format
3. Tests if your password matches the hash
4. Generates SQL to fix if needed

**If it says "✅ PASSWORD MATCHES":**
- The password is correct in the database
- The issue is likely:
  - Server not reading `.env.local` (restart server)
  - Wrong Supabase credentials
  - Email mismatch

**If it says "❌ PASSWORD DOES NOT MATCH":**
- The hash in database doesn't match your password
- The script will generate SQL to fix it
- Copy the SQL and run it in Supabase SQL Editor

---

## Step 5: Fix the Password (If Needed)

### Option A: Use API Method (Recommended - No SQL!)

```powershell
.\create-admin.ps1 -Email "your-email@example.com" -Password "YourPassword"
```

This uses your app's own API, so it ensures correct hashing.

### Option B: Use SQL (If API doesn't work)

1. Run `diagnose-admin-login.ps1` - it will generate SQL
2. Copy the SQL it outputs
3. Go to Supabase Dashboard → SQL Editor
4. Paste and click "Run"
5. Verify with the SELECT query

---

## Step 6: Verify Everything Works

After fixing, test again:

```powershell
.\test-admin-login-simple.ps1 -Email "your-email@example.com" -Password "YourPassword"
```

Should show: `✅ LOGIN SUCCESSFUL!`

---

## Common Issues & Quick Fixes

### Issue: "Server is not running"
**Fix:** Run `npm run dev` and wait for "Ready" message

### Issue: "Missing SUPABASE_SERVICE_ROLE_KEY"
**Fix:** 
1. Add to `.env.local`
2. Restart server

### Issue: "Email or password incorrect" but password matches in diagnostic
**Fix:**
1. Check server logs (terminal where `npm run dev` is running)
2. Look for `[Admin Login]` messages
3. Verify email is exactly as stored (case doesn't matter, but check for typos)

### Issue: Password hash doesn't match
**Fix:** Use `create-admin.ps1` to regenerate with correct hash

---

## Quick Checklist

- [ ] `.env.local` has all required variables (check with `check-env-structure.ps1`)
- [ ] Server is running (`npm run dev`)
- [ ] Server was restarted after changing `.env.local`
- [ ] Admin user exists in Supabase `admin_users` table
- [ ] Password hash is valid (test with `diagnose-admin-login.ps1`)
- [ ] Login test passes (`test-admin-login-simple.ps1`)

---

## Still Not Working?

1. **Share the output** of `check-env-structure.ps1`
2. **Share the output** of `test-admin-login-simple.ps1`
3. **Share the output** of `diagnose-admin-login.ps1`
4. **Check server logs** - look for `[Admin Login]` messages in terminal

This will help identify the exact issue!
