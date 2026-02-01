# Diagnose Why Leads Are Not Showing in Admin Dashboard

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "`n🔍 Diagnosing Leads Not Showing Issue" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Read token from .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    exit 1
}

$token = (Get-Content $envFile | Select-String "ADMIN_DASHBOARD_TOKEN=(.+)").Matches.Groups[1].Value

if (-not $token) {
    Write-Host "❌ ADMIN_DASHBOARD_TOKEN not found in .env.local!" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# ===== 1. Check if server is running =====
Write-Host "`n📡 1. Checking if server is running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri $BaseUrl -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server is not running!" -ForegroundColor Red
    Write-Host "   💡 Start with: npm run dev" -ForegroundColor Yellow
    exit 1
}

# ===== 2. Test Admin Overview API =====
Write-Host "`n📊 2. Testing Admin Overview API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/overview" `
        -Method GET `
        -Headers $headers `
        -TimeoutSec 15 `
        -ErrorAction Stop
    
    Write-Host "   ✅ API responded successfully" -ForegroundColor Green
    Write-Host "   📈 Stats:" -ForegroundColor Cyan
    Write-Host "      Total Leads: $($response.stats.totalLeads)" -ForegroundColor Gray
    Write-Host "      Pending Leads: $($response.stats.pendingLeads)" -ForegroundColor Gray
    Write-Host "      Unassigned Leads: $($response.stats.unassignedLeads)" -ForegroundColor Gray
    Write-Host "      Total Campaigns: $($response.stats.totalCampaigns)" -ForegroundColor Gray
    Write-Host "      Total SDRs: $($response.stats.totalSDRs)" -ForegroundColor Gray
    
    Write-Host "`n   📋 Leads in response:" -ForegroundColor Cyan
    if ($response.leads -and $response.leads.Count -gt 0) {
        Write-Host "      ✅ Found $($response.leads.Count) leads" -ForegroundColor Green
        Write-Host "`n   First 3 leads:" -ForegroundColor Yellow
        $response.leads | Select-Object -First 3 | ForEach-Object {
            Write-Host "      - $($_.nome) ($($_.empresa)) - Status: $($_.status) - Campaign: $($_.campaigns.name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "      ❌ No leads in API response!" -ForegroundColor Red
        Write-Host "      💡 Leads may not be saved correctly" -ForegroundColor Yellow
    }
    
    Write-Host "`n   📁 Campaigns in response:" -ForegroundColor Cyan
    if ($response.campaigns -and $response.campaigns.Count -gt 0) {
        Write-Host "      ✅ Found $($response.campaigns.Count) campaigns" -ForegroundColor Green
        $response.campaigns | Select-Object -First 5 | ForEach-Object {
            Write-Host "      - $($_.name) (Status: $($_.status))" -ForegroundColor Gray
        }
    } else {
        Write-Host "      ⚠️  No campaigns found" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ❌ Error calling API: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

# ===== 3. Check Supabase directly (if possible) =====
Write-Host "`n🗄️  3. Checking Supabase connection..." -ForegroundColor Yellow

$supabaseUrl = (Get-Content $envFile | Select-String "NEXT_PUBLIC_SUPABASE_URL=(.+)").Matches.Groups[1].Value
$supabaseKey = (Get-Content $envFile | Select-String "SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches.Groups[1].Value

if ($supabaseUrl -and $supabaseKey) {
    Write-Host "   ✅ Supabase credentials found" -ForegroundColor Green
    Write-Host "   💡 To check database directly:" -ForegroundColor Cyan
    Write-Host "      1. Go to Supabase Dashboard" -ForegroundColor Gray
    Write-Host "      2. Navigate to Table Editor" -ForegroundColor Gray
    Write-Host "      3. Check 'campaign_contacts' table" -ForegroundColor Gray
    Write-Host "      4. Verify leads were saved" -ForegroundColor Gray
} else {
    Write-Host "   ⚠️  Supabase credentials not found in .env.local" -ForegroundColor Yellow
}

# ===== 4. Recommendations =====
Write-Host "`n💡 4. Recommendations:" -ForegroundColor Yellow

if ($response -and $response.leads -and $response.leads.Count -eq 0) {
    Write-Host "   ❌ Problem: API returns 0 leads" -ForegroundColor Red
    Write-Host "`n   Possible causes:" -ForegroundColor Cyan
    Write-Host "      1. Leads were not saved to database" -ForegroundColor Gray
    Write-Host "      2. RLS (Row Level Security) blocking access" -ForegroundColor Gray
    Write-Host "      3. Foreign key constraint failed (campaign_id missing)" -ForegroundColor Gray
    Write-Host "      4. Query error (check server logs)" -ForegroundColor Gray
    Write-Host "`n   Solutions:" -ForegroundColor Cyan
    Write-Host "      1. Check Supabase Table Editor → campaign_contacts" -ForegroundColor White
    Write-Host "      2. Check server logs (npm run dev output)" -ForegroundColor White
    Write-Host "      3. Verify campaign was created" -ForegroundColor White
    Write-Host "      4. Check RLS policies on campaign_contacts table" -ForegroundColor White
} elseif ($response -and $response.leads -and $response.leads.Count -gt 0) {
    Write-Host "   ✅ Leads are in the API response!" -ForegroundColor Green
    Write-Host "   💡 If not showing in dashboard:" -ForegroundColor Yellow
    Write-Host "      1. Refresh the page (F5)" -ForegroundColor White
    Write-Host "      2. Check browser console (F12) for errors" -ForegroundColor White
    Write-Host "      3. Check if you're on the 'Leads' tab" -ForegroundColor White
    Write-Host "      4. Clear browser cache" -ForegroundColor White
}

Write-Host "`n📋 5. Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check Supabase Dashboard → Table Editor → campaign_contacts" -ForegroundColor Gray
Write-Host "   2. Verify leads exist in the table" -ForegroundColor Gray
Write-Host "   3. Check server logs for any errors" -ForegroundColor Gray
Write-Host "   4. Try refreshing the admin dashboard" -ForegroundColor Gray

Write-Host "`n✅ Diagnosis complete!" -ForegroundColor Green
