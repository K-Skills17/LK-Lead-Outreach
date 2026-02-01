# Fix Admin Password - Minimal SQL (Table Must Already Exist)
# This only generates the UPDATE/INSERT SQL, no CREATE TABLE

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

Write-Host "`n🔐 Fix Admin Password - Minimal SQL" -ForegroundColor Cyan
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

# Extract hash (should start with $2a$ or $2b$)
$hash = ($hashOutput | Where-Object { $_ -match '^\$2[ab]\$10\$' } | Select-Object -First 1).Trim()

if (-not $hash -or $hash.Length -lt 50) {
    Write-Host "❌ Failed to generate valid hash" -ForegroundColor Red
    Write-Host "   Output received: $hashOutput" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Hash generated: $($hash.Substring(0, 20))..." -ForegroundColor Green

# Escape for SQL (only single quotes need escaping)
$escapedEmail = $Email -replace "'", "''"
$escapedHash = $hash -replace "'", "''"

Write-Host "`n📝 Copy this SQL and run in Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Minimal SQL - just UPDATE or INSERT
$sql = @"
-- Update existing admin user OR insert if doesn't exist
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  '$escapedEmail',
  '$escapedHash',
  'Admin'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash;

-- Verify it worked
SELECT 
  email, 
  name, 
  LEFT(password_hash, 15) as hash_preview,
  created_at
FROM admin_users
WHERE email = '$escapedEmail';
"@

Write-Host $sql -ForegroundColor White
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n✅ Steps:" -ForegroundColor Green
Write-Host "   1. Copy the SQL above" -ForegroundColor Gray
Write-Host "   2. Supabase Dashboard → SQL Editor → New Query" -ForegroundColor Gray
Write-Host "   3. Paste and click 'Run'" -ForegroundColor Gray
Write-Host "   4. Check the SELECT result shows your email" -ForegroundColor Gray

Write-Host "`n🔐 Login:" -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor White
Write-Host "   Password: [the password you entered]" -ForegroundColor White
Write-Host "   URL: http://localhost:3000/admin" -ForegroundColor Yellow

Write-Host "`n💡 If you get SQL errors:" -ForegroundColor Yellow
Write-Host "   - Make sure admin_users table exists" -ForegroundColor Gray
Write-Host "   - Check for typos in email" -ForegroundColor Gray
Write-Host "   - Try running just the INSERT part first" -ForegroundColor Gray
