# Test Lead Insert - Debug why leads aren't being saved

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "`n🧪 Testing Lead Insert" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Read token from .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    exit 1
}

$token = (Get-Content $envFile | Select-String "LEAD_GEN_INTEGRATION_TOKEN=(.+)").Matches.Groups[1].Value

if (-not $token) {
    Write-Host "❌ LEAD_GEN_INTEGRATION_TOKEN not found in .env.local!" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test lead data
$testLead = @{
    nome = "Test Lead $(Get-Date -Format 'HH:mm:ss')"
    empresa = "Test Company"
    email = "test@example.com"
    phone = "+5511999999999"
    campaign_name = "Test Campaign $(Get-Date -Format 'yyyy-MM-dd')"
} | ConvertTo-Json

Write-Host "`n📤 Sending test lead..." -ForegroundColor Yellow
Write-Host "Lead data:" -ForegroundColor Gray
Write-Host $testLead -ForegroundColor White

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/integration/leads/receive" `
        -Method POST `
        -Headers $headers `
        -Body $testLead `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "`n✅ Response received:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor White
    
    Write-Host "`n📊 Results:" -ForegroundColor Cyan
    Write-Host "   Created: $($response.created)" -ForegroundColor $(if ($response.created -gt 0) { "Green" } else { "Red" })
    Write-Host "   Updated: $($response.updated)" -ForegroundColor Gray
    Write-Host "   Errors: $($response.errors.Count)" -ForegroundColor $(if ($response.errors.Count -gt 0) { "Red" } else { "Green" })
    
    if ($response.errors -and $response.errors.Count -gt 0) {
        Write-Host "`n❌ Errors:" -ForegroundColor Red
        $response.errors | ForEach-Object {
            Write-Host "   - $_" -ForegroundColor Yellow
        }
    }
    
    if ($response.created -gt 0) {
        Write-Host "`n✅ Lead should be created!" -ForegroundColor Green
        Write-Host "   Check Supabase Table Editor → campaign_contacts" -ForegroundColor Cyan
        Write-Host "   Or run: & .\diagnose-leads-not-showing.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ No leads were created!" -ForegroundColor Red
        Write-Host "   Check server logs for errors" -ForegroundColor Yellow
        Write-Host "   Check the errors above" -ForegroundColor Yellow
    }
    
} catch {
    $errorDetails = $_.ErrorDetails.Message
    if ($errorDetails) {
        try {
            $errorJson = $errorDetails | ConvertFrom-Json
            Write-Host "`n❌ Error: $($errorJson.error)" -ForegroundColor Red
            if ($errorJson.details) {
                Write-Host "Details:" -ForegroundColor Yellow
                $errorJson.details | ConvertTo-Json | Write-Host -ForegroundColor Gray
            }
        } catch {
            Write-Host "`n❌ Error: $errorDetails" -ForegroundColor Red
        }
    } else {
        Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n💡 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check server logs (npm run dev terminal)" -ForegroundColor Gray
Write-Host "   2. Look for [Integration] messages" -ForegroundColor Gray
Write-Host "   3. Check Supabase Table Editor → campaign_contacts" -ForegroundColor Gray
Write-Host "   4. If errors, check foreign key constraints" -ForegroundColor Gray
