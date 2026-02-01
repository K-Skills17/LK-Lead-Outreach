# 👤 How to Create SDR Accounts

## 🚀 Quick Method: Use PowerShell Script

```powershell
& .\create-sdr.ps1 -Email "sdr@example.com" -Password "SecurePassword123!" -Name "John Doe" -Role "sdr"
```

**Parameters:**
- `-Email`: SDR's email address (used for login)
- `-Password`: SDR's password
- `-Name`: SDR's full name
- `-Role`: `sdr`, `manager`, or `admin` (default: `sdr`)

---

## 📋 Manual Method: SQL

If the script doesn't work, use SQL directly:

### Step 1: Generate Password Hash

```powershell
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourPassword123!', 10).then(h => console.log(h));"
```

Copy the hash (starts with `$2a$` or `$2b$`)

### Step 2: Run SQL in Supabase

```sql
-- Insert SDR user
INSERT INTO sdr_users (email, password_hash, name, role, is_active)
VALUES (
  'sdr@example.com',
  'PASTE_HASH_HERE',
  'John Doe',
  'sdr',
  true
)
ON CONFLICT (email)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Verify
SELECT email, name, role, is_active, created_at
FROM sdr_users
WHERE email = 'sdr@example.com';
```

---

## 🔐 SDR Roles

- **`sdr`**: Standard SDR (can view assigned leads, mark as sent)
- **`manager`**: Manager (can view all leads, assign to SDRs)
- **`admin`**: Admin (full access)

---

## ✅ After Creating SDR

1. **SDR can login at:** `http://localhost:3000/sdr`
2. **Assign leads to SDR** via admin dashboard
3. **SDR sees assigned leads** in their dashboard

---

## 📊 Assign Leads to SDR

### Via Admin Dashboard:
1. Go to admin dashboard
2. Find the lead
3. Click "Assign to SDR"
4. Select the SDR

### Via API:
```powershell
$token = "YOUR_ADMIN_DASHBOARD_TOKEN"
$url = "http://localhost:3000/api/admin/assign-lead"

$body = @{
    lead_id = "lead-uuid-here"
    sdr_id = "sdr-uuid-here"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
```

---

## 🧪 Test SDR Login

```powershell
$email = "sdr@example.com"
$password = "YourPassword123!"

$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/sdr/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

if ($response.success) {
    Write-Host "✅ SDR login successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Login failed: $($response.error)" -ForegroundColor Red
}
```

---

## ❓ Troubleshooting

### "SDR user not found"
- Check if email exists in `sdr_users` table
- Verify email is exactly as stored (case-insensitive)

### "Password incorrect"
- Regenerate password hash
- Make sure using bcrypt with 10 salt rounds

### "Cannot assign leads"
- Verify SDR exists and is active (`is_active = true`)
- Check admin token is correct

---

**Next:** Once SDRs are created, assign leads to them from the admin dashboard!
