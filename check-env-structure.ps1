# Check .env.local Structure (Without Showing Sensitive Values)
# This script verifies you have all required environment variables

Write-Host "`n🔍 Checking .env.local Structure" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "`n❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "`n💡 Create .env.local in the project root with required variables" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ .env.local file found" -ForegroundColor Green

# Required variables for admin login
$requiredVars = @{
    "NEXT_PUBLIC_SUPABASE_URL" = "Supabase Project URL"
    "SUPABASE_SERVICE_ROLE_KEY" = "Supabase Service Role Key (for admin access)"
    "ADMIN_DASHBOARD_TOKEN" = "Admin Dashboard Authentication Token"
}

# Optional but recommended
$optionalVars = @{
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = "Supabase Anonymous Key"
    "LEAD_GEN_INTEGRATION_TOKEN" = "Lead Gen Integration Token"
    "SENDER_SERVICE_TOKEN" = "Sender Service Token (for desktop app)"
    "OPENAI_API_KEY" = "OpenAI API Key (optional)"
    "RESEND_API_KEY" = "Resend API Key (optional)"
}

Write-Host "`n📋 Checking Required Variables:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$allPresent = $true
$envContent = Get-Content $envFile

foreach ($var in $requiredVars.Keys) {
    $found = $false
    $value = $null
    
    foreach ($line in $envContent) {
        if ($line -match "^$var=(.+)$") {
            $found = $true
            $value = $matches[1].Trim()
            break
        }
    }
    
    if ($found -and $value -and $value -ne "" -and $value -notmatch "^(your_|your-|https://your-|sk-your_)") {
        Write-Host "   ✅ $var" -ForegroundColor Green
        Write-Host "      Purpose: $($requiredVars[$var])" -ForegroundColor Gray
        Write-Host "      Status: Set (value hidden for security)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ $var" -ForegroundColor Red
        Write-Host "      Purpose: $($requiredVars[$var])" -ForegroundColor Gray
        if ($found -and ($value -match "^(your_|your-|https://your-|sk-your_)")) {
            Write-Host "      Status: Placeholder detected - needs real value!" -ForegroundColor Yellow
        } else {
            Write-Host "      Status: Missing or empty" -ForegroundColor Yellow
        }
        $allPresent = $false
    }
    Write-Host ""
}

Write-Host "`n📋 Optional Variables:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

foreach ($var in $optionalVars.Keys) {
    $found = $false
    $value = $null
    
    foreach ($line in $envContent) {
        if ($line -match "^$var=(.+)$") {
            $found = $true
            $value = $matches[1].Trim()
            break
        }
    }
    
    if ($found -and $value -and $value -ne "" -and $value -notmatch "^(your_|your-|https://your-|sk-your_)") {
        Write-Host "   ✅ $var" -ForegroundColor Green
    } elseif ($found) {
        Write-Host "   ⚠️  $var (placeholder detected)" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚪ $var (not set)" -ForegroundColor Gray
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

if ($allPresent) {
    Write-Host "`n✅ All required variables are present!" -ForegroundColor Green
    Write-Host "`n💡 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Make sure values are correct (not placeholders)" -ForegroundColor Gray
    Write-Host "   2. Restart Next.js server if you just added/changed variables" -ForegroundColor Gray
    Write-Host "   3. Run: .\test-admin-login-simple.ps1" -ForegroundColor Gray
} else {
    Write-Host "`n❌ Missing required variables!" -ForegroundColor Red
    Write-Host "`n💡 Where to get them:" -ForegroundColor Yellow
    Write-Host "   SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY:" -ForegroundColor Gray
    Write-Host "   → https://supabase.com/dashboard → Your Project → Settings → API" -ForegroundColor Gray
    Write-Host "`n   ADMIN_DASHBOARD_TOKEN:" -ForegroundColor Gray
    Write-Host "   → Generate with: -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})" -ForegroundColor Gray
}

Write-Host "`n🔒 Security Note:" -ForegroundColor Cyan
Write-Host "   This script does NOT display actual values for security" -ForegroundColor Gray
Write-Host "   It only checks if variables exist and are not placeholders" -ForegroundColor Gray
