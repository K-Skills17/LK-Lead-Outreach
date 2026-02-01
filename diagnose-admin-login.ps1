# Diagnose Admin Login Issues
# This script checks the database and tests password verification

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

Write-Host "`n🔍 Diagnosing Admin Login Issue" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Load environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "`n📋 Loading environment variables from .env.local..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  .env.local not found. Make sure to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
}

# Check both possible variable names (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL)
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
if (-not $supabaseUrl) {
    $supabaseUrl = $env:SUPABASE_URL
}
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "`n❌ Missing Supabase credentials!" -ForegroundColor Red
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL: $(if ($supabaseUrl) { '✅ Set' } else { '❌ Missing' })" -ForegroundColor Gray
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY: $(if ($supabaseKey) { '✅ Set' } else { '❌ Missing' })" -ForegroundColor Gray
    Write-Host "`n💡 Make sure .env.local has:" -ForegroundColor Yellow
    Write-Host "   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" -ForegroundColor Gray
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green

# Step 1: Check if admin exists in database
Write-Host "`n📊 Step 1: Checking database for admin user..." -ForegroundColor Cyan

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

$emailLower = $Email.ToLower().Trim()
# URL encode the email for the query (PowerShell native method)
$emailEncoded = [System.Uri]::EscapeDataString($emailLower)
$queryUrl = "$supabaseUrl/rest/v1/admin_users?email=eq.$emailEncoded&select=*"

try {
    $response = Invoke-RestMethod -Uri $queryUrl -Method Get -Headers $headers
} catch {
    Write-Host "❌ Error querying database: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Yellow
    }
    exit 1
}

if ($response.Count -eq 0) {
    Write-Host "❌ Admin user not found in database!" -ForegroundColor Red
    Write-Host "   Email searched: $emailLower" -ForegroundColor Gray
    Write-Host "`n💡 Create the admin user first using:" -ForegroundColor Yellow
    Write-Host "   .\create-admin.ps1 -Email `"$Email`" -Password `"$Password`"" -ForegroundColor Gray
    exit 1
}

$admin = $response[0]
Write-Host "✅ Admin user found!" -ForegroundColor Green
Write-Host "   ID: $($admin.id)" -ForegroundColor Gray
Write-Host "   Email: $($admin.email)" -ForegroundColor Gray
Write-Host "   Name: $($admin.name)" -ForegroundColor Gray
Write-Host "   Hash length: $($admin.password_hash.Length) characters" -ForegroundColor Gray
Write-Host "   Hash preview: $($admin.password_hash.Substring(0, [Math]::Min(20, $admin.password_hash.Length)))..." -ForegroundColor Gray

# Step 2: Check hash format
Write-Host "`n🔐 Step 2: Validating hash format..." -ForegroundColor Cyan

if (-not $admin.password_hash) {
    Write-Host "❌ Password hash is NULL or empty!" -ForegroundColor Red
    Write-Host "`n💡 Fix: Update the password hash in the database" -ForegroundColor Yellow
    exit 1
}

if ($admin.password_hash.Length -lt 50) {
    Write-Host "⚠️  Warning: Hash seems too short (should be ~60 characters)" -ForegroundColor Yellow
    Write-Host "   Current length: $($admin.password_hash.Length)" -ForegroundColor Gray
}

if ($admin.password_hash -notmatch '^\$2[ab]\$10\$') {
    Write-Host "⚠️  Warning: Hash doesn't start with expected bcrypt format" -ForegroundColor Yellow
    Write-Host "   Expected: `$2a`$10`$ or `$2b`$10`$" -ForegroundColor Gray
    Write-Host "   Got: $($admin.password_hash.Substring(0, [Math]::Min(10, $admin.password_hash.Length)))" -ForegroundColor Gray
}

Write-Host "✅ Hash format looks valid" -ForegroundColor Green

# Step 3: Test password verification
Write-Host "`n🧪 Step 3: Testing password verification..." -ForegroundColor Cyan

$testScript = @"
const bcrypt = require('bcryptjs');

const password = '$($Password -replace "'", "''" -replace "\\", "\\\\")';
const hash = '$($admin.password_hash -replace "'", "''" -replace "\\", "\\\\")';

console.log('Testing password verification...');
console.log('Password length:', password.length);
console.log('Hash length:', hash.length);
console.log('Hash preview:', hash.substring(0, 20));

bcrypt.compare(password, hash)
  .then(result => {
    if (result) {
      console.log('✅ PASSWORD MATCHES!');
      process.exit(0);
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH');
      console.log('This means the hash in the database does not match this password.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  });
"@

$testScript | Out-File -FilePath "temp-password-test.js" -Encoding utf8 -Force
$testResult = node temp-password-test.js 2>&1
Remove-Item temp-password-test.js -Force -ErrorAction SilentlyContinue

Write-Host $testResult

if ($testResult -match '✅ PASSWORD MATCHES') {
    Write-Host "`n✅ Password verification PASSED!" -ForegroundColor Green
    Write-Host "`n🔍 The issue might be:" -ForegroundColor Yellow
    Write-Host "   1. Email case mismatch (check exact email in database)" -ForegroundColor Gray
    Write-Host "   2. Server not reading .env.local correctly" -ForegroundColor Gray
    Write-Host "   3. Database connection issue" -ForegroundColor Gray
    Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
    Write-Host "   - Check server logs when you try to login" -ForegroundColor Gray
    Write-Host "   - Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local" -ForegroundColor Gray
    Write-Host "   - Restart the Next.js server (npm run dev)" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Password verification FAILED!" -ForegroundColor Red
    Write-Host "`n💡 The password hash in the database doesn't match your password." -ForegroundColor Yellow
    Write-Host "`n🔧 Fix: Regenerate the password hash" -ForegroundColor Cyan
    
    # Generate new hash
    Write-Host "`n⏳ Generating new password hash..." -ForegroundColor Yellow
    
    $hashScript = @"
const bcrypt = require('bcryptjs');
bcrypt.hash('$($Password -replace "'", "''" -replace "\\", "\\\\")', 10).then(hash => {
  console.log(hash);
});
"@
    
    $hashScript | Out-File -FilePath "temp-hash.js" -Encoding utf8 -Force
    $newHash = (node temp-hash.js).Trim()
    Remove-Item temp-hash.js -Force -ErrorAction SilentlyContinue
    
    if ($newHash -and $newHash.Length -gt 50) {
        Write-Host "✅ New hash generated!" -ForegroundColor Green
        Write-Host "`n📝 Run this SQL in Supabase to update the password:" -ForegroundColor Cyan
        Write-Host "=" * 60 -ForegroundColor Gray
        
        $escapedEmail = $Email -replace "'", "''"
        $escapedHash = $newHash -replace "'", "''"
        
        $sql = @"
UPDATE admin_users 
SET password_hash = '$escapedHash'
WHERE email = '$escapedEmail';

-- Verify
SELECT email, name, LEFT(password_hash, 15) as hash_preview
FROM admin_users
WHERE email = '$escapedEmail';
"@
        
        Write-Host $sql -ForegroundColor White
        Write-Host "=" * 60 -ForegroundColor Gray
        
        Write-Host "`n✅ After running the SQL, try logging in again!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to generate hash" -ForegroundColor Red
    }
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor Gray
Write-Host "   User found: ✅" -ForegroundColor Gray
Write-Host "   Hash exists: $(if ($admin.password_hash) { '✅' } else { '❌' })" -ForegroundColor Gray
Write-Host "   Password test: $(if ($testResult -match '✅') { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor Gray
