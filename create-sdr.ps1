# Create SDR User Account
# This script creates an SDR user via the API

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$true)]
    [string]$Name,
    
    [Parameter(Mandatory=$false)]
    [string]$Role = "sdr",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "`n👤 Creating SDR User Account" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check if server is running
Write-Host "`n📡 Checking if server is running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri $BaseUrl -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server is not running!" -ForegroundColor Red
    Write-Host "`n💡 Start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Check if API endpoint exists
Write-Host "`n🔍 Checking for SDR creation API..." -ForegroundColor Yellow

# Try to create via API (if endpoint exists)
$body = @{
    email = $Email
    password = $Password
    name = $Name
    role = $Role
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/sdr/create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "`n✅ SDR user created successfully!" -ForegroundColor Green
        Write-Host "   User ID: $($response.userId)" -ForegroundColor Gray
        Write-Host "   Email: $Email" -ForegroundColor Gray
        Write-Host "   Name: $Name" -ForegroundColor Gray
        Write-Host "   Role: $Role" -ForegroundColor Gray
        Write-Host "`n🎉 SDR can now login!" -ForegroundColor Green
        exit 0
    }
} catch {
    # API endpoint might not exist, use SQL method instead
    Write-Host "   ⚠️  API endpoint not found, using SQL method..." -ForegroundColor Yellow
}

# Fallback: Generate SQL for manual creation
Write-Host "`n📝 Generating SQL for manual SDR creation..." -ForegroundColor Cyan

# Generate password hash
Write-Host "`n⏳ Generating password hash..." -ForegroundColor Yellow

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

$hashScript | Out-File -FilePath "temp-sdr-hash.js" -Encoding utf8 -Force
$hashOutput = node temp-sdr-hash.js 2>&1
Remove-Item temp-sdr-hash.js -Force -ErrorAction SilentlyContinue

if ($hashOutput -match "ERROR:") {
    Write-Host "❌ Error generating hash: $hashOutput" -ForegroundColor Red
    exit 1
}

$hash = ($hashOutput | Where-Object { $_ -match '^\$2[ab]\$10\$' } | Select-Object -First 1).Trim()

if (-not $hash -or $hash.Length -lt 50) {
    Write-Host "❌ Failed to generate valid hash" -ForegroundColor Red
    Write-Host "   Output: $hashOutput" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Hash generated" -ForegroundColor Green

# Generate SQL
$escapedEmail = $Email -replace "'", "''"
$escapedName = $Name -replace "'", "''"
$escapedHash = $hash -replace "'", "''"
$escapedRole = $Role -replace "'", "''"

Write-Host "`n📋 Run this SQL in Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

$sql = @"
-- Ensure sdr_users table exists
CREATE TABLE IF NOT EXISTS sdr_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'sdr' CHECK (role IN ('sdr', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE sdr_users ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "Service role can manage sdr_users" ON sdr_users;
CREATE POLICY "Service role can manage sdr_users" ON sdr_users FOR ALL USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sdr_users_email ON sdr_users(email);

-- Insert or update SDR user
INSERT INTO sdr_users (email, password_hash, name, role, is_active)
VALUES (
  '$escapedEmail',
  '$escapedHash',
  '$escapedName',
  '$escapedRole',
  true
)
ON CONFLICT (email)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Verify
SELECT 
  email, 
  name, 
  role,
  is_active,
  LEFT(password_hash, 15) as hash_preview,
  created_at
FROM sdr_users
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

Write-Host "`n🔐 SDR Login Credentials:" -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor Gray
Write-Host "   Password: [the password you entered]" -ForegroundColor Gray
Write-Host "   Role: $Role" -ForegroundColor Gray

Write-Host "`n💡 SDR can login at: http://localhost:3000/sdr" -ForegroundColor Yellow
