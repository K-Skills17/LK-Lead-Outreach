# ⚡ Quick Fix: Admin Password Not Working

## 🚀 Fastest Solution

### **Method 1: Use the Fix Script (Recommended)**

```powershell
.\fix-admin-password.ps1 -Email "your-email@example.com" -Password "YourPassword123!"
```

This will:
1. Generate the correct bcryptjs hash
2. Provide SQL to update your password
3. Ensure it matches the app's hashing method

---

### **Method 2: Generate Hash and Update SQL**

**Step 1: Generate Hash**
```powershell
node scripts/hash-password.js "YourPassword123!"
```

**Step 2: Copy the hash and run this SQL:**
```sql
UPDATE admin_users 
SET password_hash = 'PASTE_HASH_HERE'
WHERE email = 'your-email@example.com';
```

---

### **Method 3: Use API Setup (Best - Ensures Correct Hash)**

**Step 1: Add to .env.local:**
```env
ADMIN_SETUP_TOKEN=your_secure_token_here
```

**Step 2: Restart dev server:**
```powershell
npm run dev
```

**Step 3: Use setup page:**
1. Go to: `http://localhost:3000/admin/setup`
2. Enter setup token, email, password, name
3. Click "Create Admin"

This uses the **exact same hashing** as the login system!

---

## 🔍 Why Passwords Were Wrong

The issue is likely:
- ❌ Hash generated with wrong bcrypt version
- ❌ Hash format mismatch
- ❌ Salt rounds different

**Solution:** Use the app's own API or generate hash with `bcryptjs` (not `bcrypt`)

---

## ✅ Recommended: Use Fix Script

```powershell
.\fix-admin-password.ps1 -Email "your@email.com" -Password "YourPassword"
```

This ensures the hash is generated correctly!

---

**Last Updated:** 2025-01-15
