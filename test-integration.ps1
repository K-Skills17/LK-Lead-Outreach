# Quick Integration Test Script
param(
    [Parameter(Mandatory=$false)]
    [string]$Token = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "localhost:3000"
)

# Try to get token from .env.local if not provided
if (-not $Token) {
    if (Test-Path .env.local) {
        $envContent = Get-Content .env.local
        $tokenLine = $envContent | Select-String "LEAD_GEN_INTEGRATION_TOKEN"
        if ($tokenLine) {
            $Token = ($tokenLine -split "=")[1].Trim()
            Write-Host "Found token in .env.local" -ForegroundColor Green
        }
    }
}

if (-not $Token) {
    Write-Host "❌ Error: LEAD_GEN_INTEGRATION_TOKEN not found" -ForegroundColor Red
    Write-Host "Please provide token: .\test-integration.ps1 -Token 'your_token'" -ForegroundColor Yellow
    exit 1
}

$baseUrl = if ($Domain -like "http*") { $Domain } else { "http://$Domain" }

Write-Host "`n🧪 Testing Integration..." -ForegroundColor Cyan
Write-Host "   URL: $baseUrl" -ForegroundColor Gray
Write-Host "   Token: $($Token.Substring(0, [Math]::Min(10, $Token.Length)))..." -ForegroundColor Gray

# Test 1: Status
Write-Host "`n1️⃣ Testing status endpoint..." -ForegroundColor Yellow
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/api/integration/status" -Method Get -Headers @{
        "Authorization" = "Bearer $Token"
    } -ErrorAction Stop
    
    Write-Host "   ✅ Status: $($status.status)" -ForegroundColor Green
    Write-Host "   📊 Campaigns: $($status.statistics.campaigns)" -ForegroundColor Gray
    Write-Host "   📊 Total Leads: $($status.statistics.total_leads)" -ForegroundColor Gray
    Write-Host "   📊 Pending: $($status.statistics.pending_leads)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# Test 2: Send test lead
Write-Host "`n2️⃣ Sending test lead..." -ForegroundColor Yellow
$testPhone = "+5511" + (Get-Random -Minimum 10000000 -Maximum 99999999)
$testLead = @{
    nome = "Test Lead $(Get-Date -Format 'HH:mm:ss')"
    empresa = "Test Company"
    email = "test+$(Get-Random)@example.com"
    phone = $testPhone
    cargo = "CEO"
    send_email_first = $false
    whatsapp_followup_delay_hours = 1
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/integration/leads/receive" -Method Post -Headers @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    } -Body $testLead -ErrorAction Stop
    
    if ($result.success) {
        Write-Host "   ✅ Lead created successfully!" -ForegroundColor Green
        Write-Host "   📝 Processed: $($result.results.processed)" -ForegroundColor Gray
        Write-Host "   ➕ Created: $($result.results.created)" -ForegroundColor Gray
        Write-Host "   📧 Emails Sent: $($result.results.emails_sent)" -ForegroundColor Gray
        if ($result.results.errors.Count -gt 0) {
            Write-Host "   ⚠️ Errors: $($result.results.errors -join ', ')" -ForegroundColor Yellow
        }
        Write-Host "   📱 Test Phone: $testPhone" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Lead creation failed" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Check your admin dashboard to see the test lead" -ForegroundColor Gray
Write-Host "   2. Verify the lead appears in the campaign" -ForegroundColor Gray
Write-Host "   3. Test with your actual lead gen tool" -ForegroundColor Gray
