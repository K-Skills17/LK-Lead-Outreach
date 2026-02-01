# 🔐 Fix Admin Password - Complete Guide

## ⚠️ Common SQL Errors & Solutions

If you're getting SQL errors, here are the most common issues:

### Error 1: "syntax error at or near '$'"
**Cause**: The bcrypt hash contains `$` characters that PostgreSQL interprets as dollar-quoted strings.

**Solution**: Use the minimal script below which properly escapes everything.

### Error 2: "relation admin_users does not exist"
**Cause**: The table hasn't been created yet.

**Solution**: Run the table creation SQL first (see "Option 1" below).

### Error 3: "duplicate key value violates unique constraint"
**Cause**: The email already exists but the UPDATE part isn't working.

**Solution**: Use `ON CONFLICT` with `DO UPDATE` (included in scripts below).

---

## ✅ **Option 1: Use PowerShell Script (Recommended)**

This script generates safe SQL that handles all special characters:

```powershell
.\fix-admin-password-minimal.ps1 -Email "your-email@example.com" -Password "YourPassword123!"
```

**Steps:**
1. Run the script above
2. Copy the SQL it generates
3. Paste into Supabase SQL Editor
4. Click "Run"

---

## ✅ **Option 2: Use API Endpoint (No SQL Needed!)**

This is the **safest** method - it uses your app's own API:

```powershell
.\create-admin.ps1 -Email "your-email@example.com" -Password "YourPassword123!"
```

Or manually:

```powershell
$email = "your-email@example.com"
$password = "YourPassword123!"

$body = @{
    email = $email
    password = $password
    name = "Admin"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/setup" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "✅ Admin created: $($response.message)"
```

**Note**: Make sure your Next.js server is running (`npm run dev`).

---

## ✅ **Option 3: Manual SQL (If Scripts Don't Work)**

If both scripts fail, use this **minimal SQL**:

1. **First, generate the hash**:
```powershell
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123!', 10).then(h => console.log(h));"
```

2. **Copy the hash** (starts with `$2a$` or `$2b$`)

3. **Run this SQL in Supabase** (replace `YOUR_EMAIL` and `YOUR_HASH`):

```sql
-- Simple update/insert
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'YOUR_EMAIL',
  'YOUR_HASH',
  'Admin'
)
ON CONFLICT (email) 
DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Verify
SELECT email, name, LEFT(password_hash, 15) as hash_preview
FROM admin_users
WHERE email = 'YOUR_EMAIL';
```

---

## 🧪 **Test Your Password**

After creating the admin, test if the password works:

```powershell
# Replace with your actual email and password
$email = "your-email@example.com"
$password = "YourPassword123!"

$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

if ($response.success) {
    Write-Host "✅ Login successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Login failed: $($response.error)" -ForegroundColor Red
}
```

---

## 🔍 **Troubleshooting**

### "Email ou senha incorretos" after SQL
- ✅ Check email is **exactly** as stored (case-insensitive, but check for typos)
- ✅ Verify the hash was copied completely (should be ~60 characters)
- ✅ Make sure you're using the **same password** you hashed
- ✅ Check Supabase logs for errors

### "Cannot find module 'bcryptjs'"
- ✅ Run `npm install` in the project directory
- ✅ Make sure you're in the correct directory

### "relation admin_users does not exist"
- ✅ Run the table creation SQL first (see migration file: `supabase/migrations/005_admin_users.sql`)

### SQL runs but login still fails
- ✅ Check the SELECT query shows your email
- ✅ Verify `password_hash` column has a value (not NULL)
- ✅ Try the API method instead (Option 2)

---

## 📝 **Quick Reference**

**Login URL**: `http://localhost:3000/admin`

**Required Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_DASHBOARD_TOKEN` (optional, but recommended)

---

## 💡 **Best Practice**

Use **Option 2 (API method)** - it's the safest because:
- ✅ Uses your app's own password hashing
- ✅ No SQL escaping issues
- ✅ Handles all edge cases
- ✅ Works the same way as the login endpoint

---

**Need more help?** Check:
- `create-admin.ps1` - Full interactive script
- `fix-admin-password-minimal.ps1` - Minimal SQL generator
- `app/api/admin/setup/route.ts` - API endpoint code
