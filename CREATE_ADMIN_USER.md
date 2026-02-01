# 👤 Create Admin User - Quick Guide

## 🚀 Easiest Method: Use the Setup Script

### **Option 1: PowerShell Script (Recommended)**

Run the script I created:

```powershell
.\create-admin.ps1
```

The script will:
1. Ask for your email
2. Ask for your password (twice for confirmation)
3. Ask for your name
4. Try to create the admin via API
5. If that fails, provide SQL instructions

---

## 🔧 Option 2: Use Setup API (If ADMIN_SETUP_TOKEN is set)

### Step 1: Add Setup Token to .env.local

```env
ADMIN_SETUP_TOKEN=your_secure_setup_token_here
```

Generate token:
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Step 2: Restart Dev Server

```powershell
npm run dev
```

### Step 3: Use the Setup Page

1. Go to: `http://localhost:3000/admin/setup`
2. Enter:
   - Setup Token (from .env.local)
   - Your email
   - Your password
   - Your name
3. Click "Create Admin"

---

## 📝 Option 3: Direct SQL (Most Reliable)

### Step 1: Generate Password Hash

**Using Node.js:**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 10).then(h => console.log(h));"
```

**Or create a file `hash-password.js`:**
```javascript
const bcrypt = require('bcryptjs');
const password = process.argv[2];

if (!password) {
  console.error('Usage: node hash-password.js YOUR_PASSWORD');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log('Password hash:', hash);
});
```

Run:
```bash
node hash-password.js "YourPassword123!"
```

### Step 2: Run SQL in Supabase

1. Go to: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → SQL Editor
2. Click "New query"
3. Paste this SQL (replace the values):

```sql
-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' 
    AND policyname = 'Service role can manage admin_users'
  ) THEN
    CREATE POLICY "Service role can manage admin_users" ON admin_users FOR ALL USING (true);
  END IF;
END $$;

-- Create index (if not exists)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert your admin user
-- Replace 'YOUR_EMAIL' and 'YOUR_PASSWORD_HASH' with your values
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'your-email@example.com',           -- Your email
  'YOUR_PASSWORD_HASH_HERE',         -- Hash from step 1
  'Your Name'                         -- Your name
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;
```

4. Click **"Run"**

### Step 3: Login

1. Go to: `http://localhost:3000/admin`
2. Enter:
   - **Email:** Your email
   - **Password:** Your password
3. Click "Acessar Dashboard"

---

## 🧪 Quick Test Script

I've also created `create-admin.ps1` script that does everything for you!

**Run it:**
```powershell
.\create-admin.ps1
```

It will:
- ✅ Ask for your details
- ✅ Try API method first
- ✅ Fall back to SQL if needed
- ✅ Provide complete instructions

---

## ✅ Verify Admin Was Created

After creating, test login:

```powershell
# Test login via API
$body = @{
    email = "your-email@example.com"
    password = "YourPassword123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/admin/login" -Method Post -Headers @{
    "Content-Type" = "application/json"
} -Body $body
```

**Expected response:**
```json
{
  "success": true,
  "token": "...",
  "user": {
    "id": "...",
    "email": "your-email@example.com",
    "name": "Your Name"
  }
}
```

---

## 🎯 Recommended: Use the Script

The easiest way is to run:

```powershell
.\create-admin.ps1
```

It will guide you through the entire process!

---

**Last Updated:** 2025-01-15
