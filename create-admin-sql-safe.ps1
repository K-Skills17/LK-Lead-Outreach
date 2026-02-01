# Create Admin User - Safe SQL Generator
# Handles all special characters properly

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$false)]
    [string]$Name = "Admin"
)

Write-Host "`n🔐 Create Admin User - Safe SQL" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Generate password hash
Write-Host "`n⏳ Generating password hash..." -ForegroundColor Yellow

# Escape password for JavaScript
$jsPassword = $Password -replace "\\", "\\\\" -replace "'", "\\'" -replace "`"", "\\`""

$hashScript = @"
const bcrypt = require('bcryptjs');
bcrypt.hash('$jsPassword', 10).then(hash => {
  console.log(hash);
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
"@

$hashScript | Out-File -FilePath "temp-hash.js" -Encoding utf8 -Force
$hashOutput = node temp-hash.js 2>&1
Remove-Item temp-hash.js -Force -ErrorAction SilentlyContinue

if ($hashOutput -match "ERROR:") {
    Write-Host "❌ Error generating hash: $hashOutput" -ForegroundColor Red
    exit 1
}

$hash = ($hashOutput | Select-String -Pattern '^\$2[ab]\$10\$' | Select-Object -First 1).Line.Trim()

if (-not $hash -or $hash.Length -lt 50) {
    Write-Host "❌ Failed to generate valid hash" -ForegroundColor Red
    Write-Host "   Output: $hashOutput" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Hash generated successfully" -ForegroundColor Green
Write-Host "   Hash: $($hash.Substring(0, 20))..." -ForegroundColor Gray

# Generate safe SQL using parameterized approach
Write-Host "`n📝 SQL to run in Supabase:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Use dollar-quoted string for the hash to avoid escaping issues
$sql = @"
-- Ensure admin_users table exists
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS
DO `$`$`$`
BEGIN
  ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END`$`$`$`;

-- Create policy
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert or update admin user
-- Using dollar-quoted string for hash to avoid escaping issues
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  $1,
  $2,
  $3
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = COALESCE(EXCLUDED.name, admin_users.name);
"@

# For Supabase SQL Editor, we need to use direct values (not parameters)
# So let's use a safer approach with proper escaping
$escapedEmail = $Email -replace "'", "''"
$escapedName = $Name -replace "'", "''"
$escapedHash = $hash -replace "'", "''"

$sqlDirect = @"
-- Ensure admin_users table exists
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS (safe to run multiple times)
DO `$`$`$`
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'admin_users'
  ) THEN
    ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END`$`$`$`;

-- Create policy (safe to run multiple times)
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

-- Create index (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert or update admin user
-- Using single quotes with proper escaping
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  '$escapedEmail',
  '$escapedHash',
  '$escapedName'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = COALESCE(EXCLUDED.name, admin_users.name);

-- Verify
SELECT 
  email, 
  name, 
  LEFT(password_hash, 15) as hash_preview,
  created_at
FROM admin_users
WHERE email = '$escapedEmail';
"@

Write-Host $sqlDirect -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n✅ Instructions:" -ForegroundColor Green
Write-Host "   1. Copy ALL the SQL above (from CREATE TABLE to SELECT)" -ForegroundColor Gray
Write-Host "   2. Go to: https://supabase.com/dashboard → Your Project → SQL Editor" -ForegroundColor Gray
Write-Host "   3. Click 'New query'" -ForegroundColor Gray
Write-Host "   4. Paste the SQL" -ForegroundColor Gray
Write-Host "   5. Click 'Run' (or press Ctrl+Enter)" -ForegroundColor Gray
Write-Host "   6. Check the SELECT result at the bottom" -ForegroundColor Gray

Write-Host "`n🔐 Your Login Credentials:" -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor White
Write-Host "   Password: [the password you entered]" -ForegroundColor White
Write-Host "`n💡 Login at: http://localhost:3000/admin" -ForegroundColor Yellow

Write-Host "`n🧪 Test Password (optional):" -ForegroundColor Cyan
$testScript = "const bcrypt = require('bcryptjs'); bcrypt.compare('$($Password -replace "'", "''")', '$hash').then(r => console.log('Password test:', r ? '✅ MATCHES' : '❌ DOES NOT MATCH'));"
Write-Host "   node -e `"$testScript`"" -ForegroundColor Gray
