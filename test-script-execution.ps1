# Test if PowerShell scripts can run
# This helps diagnose execution policy issues

Write-Host "`n🧪 Testing PowerShell Script Execution" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Check execution policy
$policy = Get-ExecutionPolicy
Write-Host "`n📋 Current Execution Policy: $policy" -ForegroundColor Yellow

if ($policy -eq "Restricted") {
    Write-Host "❌ Scripts are blocked!" -ForegroundColor Red
    Write-Host "`n💡 Fix: Run this command:" -ForegroundColor Yellow
    Write-Host "   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor White
    Write-Host "`n   Or for this session only:" -ForegroundColor Gray
    Write-Host "   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process" -ForegroundColor White
} else {
    Write-Host "✅ Scripts should work with this policy" -ForegroundColor Green
}

# Test if we can run a simple command
Write-Host "`n🧪 Testing simple command..." -ForegroundColor Cyan
try {
    $test = Get-Date
    Write-Host "✅ PowerShell commands work: $test" -ForegroundColor Green
} catch {
    Write-Host "❌ Error running commands: $($_.Exception.Message)" -ForegroundColor Red
}

# Check if .env.local exists
Write-Host "`n📁 Checking for .env.local..." -ForegroundColor Cyan
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file found" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
}

# Try to read a line from .env.local
Write-Host "`n📖 Testing file reading..." -ForegroundColor Cyan
try {
    if (Test-Path ".env.local") {
        $firstLine = (Get-Content ".env.local" -First 1)
        Write-Host "✅ Can read files (first line hidden for security)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error reading file: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   Execution Policy: $policy" -ForegroundColor Gray
Write-Host "   Scripts should work: $(if ($policy -ne 'Restricted') { '✅ Yes' } else { '❌ No' })" -ForegroundColor Gray

Write-Host "`n💡 If you're still getting errors, share the exact error message!" -ForegroundColor Yellow
