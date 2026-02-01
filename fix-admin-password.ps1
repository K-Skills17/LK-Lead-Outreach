# Fix Admin Password - Direct SQL Method
# This generates the correct bcryptjs hash and provides SQL to update

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
bcrypt.hash('$Password', 10).then(hash => {
  console.log(hash);
});
"@

$hashScript | Out-File -FilePath "temp-hash.js" -Encoding utf8
$hash = node temp-hash.js
Remove-Item temp-hash.js

if (-not $hash -or $hash.Length -lt 50) {
    Write-Host "❌ Failed to generate hash" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Hash generated" -ForegroundColor Green
Write-Host "`n📝 Run this SQL in Supabase:" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

$sql = @"
-- Update admin password with correct hash
UPDATE admin_users 
SET password_hash = '$hash'
WHERE email = '$Email';

-- Verify the update
SELECT email, name, LEFT(password_hash, 10) as hash_preview
FROM admin_users
WHERE email = '$Email';
"@

Write-Host $sql -ForegroundColor White
Write-Host "`n✅ After running SQL, login with:" -ForegroundColor Green
Write-Host "   Email: $Email" -ForegroundColor Gray
Write-Host "   Password: [the password you entered]" -ForegroundColor Gray
Write-Host "`n💡 Access: http://localhost:3000/admin" -ForegroundColor Yellow
