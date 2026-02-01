# Helper script to run other scripts easily
# Usage: .\run.ps1 check-env-structure
# Usage: .\run.ps1 test-admin-login-simple -Email "test@example.com" -Password "test"

param(
    [Parameter(Mandatory=$true)]
    [string]$Script,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

$scriptPath = Join-Path (Get-Location) "$Script.ps1"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Script not found: $Script.ps1" -ForegroundColor Red
    Write-Host "`nAvailable scripts:" -ForegroundColor Yellow
    Get-ChildItem -Filter "*.ps1" | Where-Object { $_.Name -ne "run.ps1" } | ForEach-Object {
        Write-Host "   - $($_.BaseName)" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "🚀 Running: $Script.ps1" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

& $scriptPath @Arguments
