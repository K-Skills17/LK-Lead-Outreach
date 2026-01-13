# 🔧 Setup Missing Environment Variables
# This script helps you check and generate missing env vars

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 LK REACTOR - Environment Variables Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$envFile = ".env.local"

# Check if .env.local exists
if (-not (Test-Path $envFile)) {
    Write-Host "❌ ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "   Please create it first.`n" -ForegroundColor Yellow
    exit
}

Write-Host "✅ Found .env.local file`n" -ForegroundColor Green

# Read current .env.local
$envContent = Get-Content $envFile -Raw

Write-Host "Checking critical variables...`n" -ForegroundColor Cyan

# Check SENDER_SERVICE_TOKEN
Write-Host "1️⃣  SENDER_SERVICE_TOKEN (Desktop App Auth):" -ForegroundColor Yellow
if ($envContent -match "SENDER_SERVICE_TOKEN=(.+)") {
    $token = $matches[1].Trim()
    if ($token -eq "" -or $token -match "YOUR|GENERATE|TODO|XXX") {
        Write-Host "   ❌ NOT SET or placeholder detected" -ForegroundColor Red
        Write-Host "   🔧 Generating new token...`n" -ForegroundColor Cyan
        
        # Generate secure token
        $newToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
        
        Write-Host "   ✨ NEW TOKEN GENERATED:" -ForegroundColor Green
        Write-Host "   $newToken`n" -ForegroundColor White
        Write-Host "   📋 Copy this token and:" -ForegroundColor Yellow
        Write-Host "      1. Add to .env.local: SENDER_SERVICE_TOKEN=$newToken" -ForegroundColor White
        Write-Host "      2. Add to Vercel Environment Variables" -ForegroundColor White
        Write-Host "      3. Add to Desktop App config`n" -ForegroundColor White
    } else {
        Write-Host "   ✅ SET (Length: $($token.Length) characters)" -ForegroundColor Green
        Write-Host "   Preview: $($token.Substring(0, [Math]::Min(20, $token.Length)))...`n" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ MISSING from .env.local" -ForegroundColor Red
    
    # Generate secure token
    $newToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
    
    Write-Host "   🔧 Generated token for you:`n" -ForegroundColor Cyan
    Write-Host "   SENDER_SERVICE_TOKEN=$newToken`n" -ForegroundColor White
    Write-Host "   📋 Add this line to your .env.local file!`n" -ForegroundColor Yellow
}

# Check PRO Yearly URL
Write-Host "2️⃣  NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY (PRO Yearly Plan):" -ForegroundColor Yellow
if ($envContent -match "NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY=(.+)") {
    $url = $matches[1].Trim()
    if ($url -eq "" -or $url -match "YOUR|TODO|XXX|PLAN_URL_HERE") {
        Write-Host "   ❌ NOT SET or placeholder detected" -ForegroundColor Red
        Write-Host "   ⚠️  You need to create this plan in Mercado Pago" -ForegroundColor Yellow
        Write-Host "      Plan: PRO Yearly - R$ 2.128/year`n" -ForegroundColor White
    } else {
        Write-Host "   ✅ SET" -ForegroundColor Green
        Write-Host "   URL: $($url.Substring(0, [Math]::Min(60, $url.Length)))...`n" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ MISSING from .env.local" -ForegroundColor Red
    Write-Host "   ⚠️  Create PRO Yearly plan in Mercado Pago (R$ 2.128/year)`n" -ForegroundColor Yellow
}

# Check PREMIUM Yearly URL
Write-Host "3️⃣  NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY (PREMIUM Yearly Plan):" -ForegroundColor Yellow
if ($envContent -match "NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY=(.+)") {
    $url = $matches[1].Trim()
    if ($url -eq "" -or $url -match "YOUR|TODO|XXX|PLAN_URL_HERE") {
        Write-Host "   ❌ NOT SET or placeholder detected" -ForegroundColor Red
        Write-Host "   ⚠️  You need to create this plan in Mercado Pago" -ForegroundColor Yellow
        Write-Host "      Plan: PREMIUM Yearly - R$ 3.790/year`n" -ForegroundColor White
    } else {
        Write-Host "   ✅ SET" -ForegroundColor Green
        Write-Host "   URL: $($url.Substring(0, [Math]::Min(60, $url.Length)))...`n" -ForegroundColor Gray
    }
} else {
    Write-Host "   ❌ MISSING from .env.local" -ForegroundColor Red
    Write-Host "   ⚠️  Create PREMIUM Yearly plan in Mercado Pago (R$ 3.790/year)`n" -ForegroundColor Yellow
}

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$issues = @()

if ($envContent -notmatch "SENDER_SERVICE_TOKEN=\w{32,}") {
    $issues += "SENDER_SERVICE_TOKEN"
}

if ($envContent -notmatch "NEXT_PUBLIC_PRO_SUBSCRIBTION_YEARLY=https://") {
    $issues += "PRO Yearly URL"
}

if ($envContent -notmatch "NEXT_PUBLIC_PREMIUM_SUBSCRIBTION_YEARLY=https://") {
    $issues += "PREMIUM Yearly URL"
}

if ($issues.Count -eq 0) {
    Write-Host "✅ ALL REQUIRED VARIABLES ARE SET!" -ForegroundColor Green
    Write-Host "`n🚀 You're ready to launch!" -ForegroundColor Cyan
    Write-Host "`n⚠️  Don't forget to:" -ForegroundColor Yellow
    Write-Host "   1. Add all variables to Vercel" -ForegroundColor White
    Write-Host "   2. Redeploy on Vercel" -ForegroundColor White
    Write-Host "   3. Test desktop app connection`n" -ForegroundColor White
} else {
    Write-Host "⚠️  MISSING $($issues.Count) CRITICAL VARIABLE(S):" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "   - $issue" -ForegroundColor Red
    }
    Write-Host "`n📖 See CHECK_ENV_VARS.md for detailed setup instructions`n" -ForegroundColor Cyan
}

Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
