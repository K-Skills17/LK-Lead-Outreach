# Safe way to run scripts - Bypasses execution policy for this session only
# Usage: .\run-scripts-safe.ps1

Write-Host "`n🔧 Setting execution policy for this session..." -ForegroundColor Cyan

# Set execution policy for current process only (doesn't require admin)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

Write-Host "✅ Execution policy set for this PowerShell session" -ForegroundColor Green
Write-Host "`n📋 You can now run scripts:" -ForegroundColor Cyan
Write-Host "   .\check-env-structure.ps1" -ForegroundColor White
Write-Host "   .\test-admin-login-simple.ps1 -Email `"test@example.com`" -Password `"test`"" -ForegroundColor White
Write-Host "   .\diagnose-admin-login.ps1 -Email `"test@example.com`" -Password `"test`"" -ForegroundColor White
Write-Host "`n💡 Note: This only works for this PowerShell window" -ForegroundColor Yellow
Write-Host "   To make it permanent, run (as Administrator):" -ForegroundColor Yellow
Write-Host "   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor White
