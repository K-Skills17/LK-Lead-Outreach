# 🔧 Fix Admin Password Issues

## Problem
Passwords created with SQL or PowerShell scripts are showing as "wrong" when trying to login.

## Root Cause
The password hash might not match the bcryptjs version used by the app, or there's a mismatch in how the hash is generated.

---

## ✅ Solution: Use the API Endpoint (Recommended)

The **best way** is to use the app's own API endpoint, which uses the exact same hashing method:

### Step 1: Add Setup Token

Add to `.env.local`:
```env
ADMIN_SETUP_TOKEN=your_secure_random_token_here
```

Generate token:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Step 2: Restart Dev Server

```powershell
npm run dev
```

### Step 3: Use Node.js Script

I've created a script that uses the API:

```powershell
node scripts/create-admin-api.js
```

This will:
1. Ask for your email, password, and name
2. Use the API endpoint (which hashes correctly)
3. Create the admin user
4. Verify it works

---

## 🔄 Alternative: Fix Existing Admin Password

If you already created an admin but password doesn't work:

### Option 1: Update Password via API

1. Make sure `ADMIN_SETUP_TOKEN` is in `.env.local`
2. Restart dev server
3. Run:
```powershell
node scripts/create-admin-api.js
```
4. Enter the **same email** - it will update the password hash

### Option 2: Generate Correct Hash and Update SQL

1. Generate hash using the exact same method:
```powershell
node scripts/hash-password.js "YourPassword123!"
```

2. Copy the hash

3. Run this SQL in Supabase:
```sql
UPDATE admin_users 
SET password_hash = 'PASTE_HASH_HERE'
WHERE email = 'your-email@example.com';
```

---

## 🧪 Test Password Hash

To verify your hash is correct, test it:

```javascript
// Test in Node.js
const bcrypt = require('bcryptjs');
const password = 'YourPassword123!';
const hash = 'YOUR_HASH_FROM_DATABASE';

bcrypt.compare(password, hash).then(result => {
  console.log('Password matches:', result);
});
```

---

## ✅ Recommended: Use API Method

**The API method is best because:**
- ✅ Uses the exact same bcryptjs library
- ✅ Uses the exact same salt rounds (10)
- ✅ Guaranteed to work
- ✅ No hash format issues

**Run:**
```powershell
node scripts/create-admin-api.js
```

---

## 🔍 Debug: Check What's in Database

If password still doesn't work, check the hash format:

```sql
SELECT email, password_hash, LEFT(password_hash, 7) as hash_prefix
FROM admin_users
WHERE email = 'your-email@example.com';
```

**Expected hash format:**
- Should start with: `$2a$10$` or `$2b$10$`
- Should be 60 characters long
- Example: `$2b$10$i8mvMn2XPOH314J2HYfVqueN8Fu0AqHTW0V60PiKA9N53tz9zefAC`

If it doesn't match this format, the hash is wrong.

---

## 🚀 Quick Fix Script

I've created `scripts/create-admin-api.js` that:
1. Uses the API (ensures correct hashing)
2. Falls back to SQL if API fails
3. Generates correct hash format

**Just run:**
```powershell
node scripts/create-admin-api.js
```

---

**Last Updated:** 2025-01-15
