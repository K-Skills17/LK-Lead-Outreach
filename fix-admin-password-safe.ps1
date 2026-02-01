# Fix Admin Password - Safe SQL Method
# This generates the correct bcryptjs hash and provides SAFE SQL

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

Write-Host "`n🔧 Fix Admin Password" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Generate password hash using bcryptjs (same as app uses)
Write-Host "`n⏳ Generating password hash..." -ForegroundColor Yellow

$hashScript = @"
const bcrypt = require('bcryptjs');
bcrypt.hash('$($Password -replace "'", "''")', 10).then(hash => {
  console.log(hash);
});
"@

$hashScript | Out-File -FilePath "temp-hash.js" -Encoding utf8 -Force
$hash = (node temp-hash.js).Trim()
Remove-Item temp-hash.js -Force

if (-not $hash -or $hash.Length -lt 50) {
    Write-Host "❌ Failed to generate hash" -ForegroundColor Red
    Write-Host "   Hash received: $hash" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Hash generated: $($hash.Substring(0, 20))..." -ForegroundColor Green

# Escape single quotes for SQL
$escapedHash = $hash -replace "'", "''"
$escapedEmail = $Email -replace "'", "''"

Write-Host "`n📝 Run this SQL in Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Use dollar-quoted strings for safety
$sql = @"
-- First, make sure the table exists
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS if not already enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy if not exists
DO `$`$`$`
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' 
    AND policyname = 'Service role can manage admin_users'
  ) THEN
    CREATE POLICY "Service role can manage admin_users" ON admin_users FOR ALL USING (true);
  END IF;
END`$`$`$`;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Update or insert admin user
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  '$escapedEmail',
  '$escapedHash',
  'Admin'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = COALESCE(EXCLUDED.name, admin_users.name);

-- Verify the update
SELECT 
  email, 
  name, 
  LEFT(password_hash, 10) as hash_preview,
  created_at,
  last_login
FROM admin_users
WHERE email = '$escapedEmail';
"@

Write-Host $sql -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n✅ Instructions:" -ForegroundColor Green
Write-Host "   1. Copy the SQL above" -ForegroundColor Gray
Write-Host "   2. Go to Supabase Dashboard → SQL Editor" -ForegroundColor Gray
Write-Host "   3. Paste and click 'Run'" -ForegroundColor Gray
Write-Host "   4. Check the SELECT result to verify" -ForegroundColor Gray

Write-Host "`n🔐 Login Credentials:" -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor Gray
Write-Host "   Password: [the password you entered]" -ForegroundColor Gray
Write-Host "`n💡 Access: http://localhost:3000/admin" -ForegroundColor Yellow

Write-Host "`n🧪 Test the password:" -ForegroundColor Cyan
Write-Host "   node -e `"const bcrypt = require('bcryptjs'); bcrypt.compare('$Password', '$hash').then(r => console.log('Password matches:', r));`"" -ForegroundColor Gray
