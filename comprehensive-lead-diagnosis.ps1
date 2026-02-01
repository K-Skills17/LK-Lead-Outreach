# Comprehensive Lead Diagnosis
# Checks everything that could prevent leads from showing up

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "`n🔍 Comprehensive Lead Diagnosis" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Read tokens from .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    exit 1
}

$adminToken = (Get-Content $envFile | Select-String "ADMIN_DASHBOARD_TOKEN=(.+)").Matches.Groups[1].Value
$integrationToken = (Get-Content $envFile | Select-String "LEAD_GEN_INTEGRATION_TOKEN=(.+)").Matches.Groups[1].Value
$supabaseUrl = (Get-Content $envFile | Select-String "NEXT_PUBLIC_SUPABASE_URL=(.+)").Matches.Groups[1].Value
$supabaseKey = (Get-Content $envFile | Select-String "SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches.Groups[1].Value

Write-Host "`n📋 1. Environment Check" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray
Write-Host "   Admin Token: $(if ($adminToken) { '✅ Found' } else { '❌ Missing' })" -ForegroundColor $(if ($adminToken) { "Green" } else { "Red" })
Write-Host "   Integration Token: $(if ($integrationToken) { '✅ Found' } else { '❌ Missing' })" -ForegroundColor $(if ($integrationToken) { "Green" } else { "Red" })
Write-Host "   Supabase URL: $(if ($supabaseUrl) { '✅ Found' } else { '❌ Missing' })" -ForegroundColor $(if ($supabaseUrl) { "Green" } else { "Red" })
Write-Host "   Supabase Key: $(if ($supabaseKey) { '✅ Found' } else { '❌ Missing' })" -ForegroundColor $(if ($supabaseKey) { "Green" } else { "Red" })

# Test sending a lead
Write-Host "`n📤 2. Testing Lead Insertion" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

$testLead = @{
    nome = "Diagnostic Test Lead $(Get-Date -Format 'HH:mm:ss')"
    empresa = "Test Company Diagnostic"
    email = "test-diagnostic@example.com"
    phone = "+5511999999999"
    campaign_name = "Diagnostic Test Campaign"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $integrationToken"
    "Content-Type" = "application/json"
}

try {
    Write-Host "   Sending test lead..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/integration/leads/receive" `
        -Method POST `
        -Headers $headers `
        -Body $testLead `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    Write-Host "   ✅ API Response received" -ForegroundColor Green
    Write-Host "   Created: $($response.created)" -ForegroundColor $(if ($response.created -gt 0) { "Green" } else { "Red" })
    Write-Host "   Updated: $($response.updated)" -ForegroundColor Gray
    Write-Host "   Errors: $($response.errors.Count)" -ForegroundColor $(if ($response.errors.Count -gt 0) { "Red" } else { "Green" })
    
    if ($response.errors -and $response.errors.Count -gt 0) {
        Write-Host "`n   ❌ Errors found:" -ForegroundColor Red
        $response.errors | ForEach-Object {
            Write-Host "      - $_" -ForegroundColor Yellow
        }
    }
    
    if ($response.created -eq 0 -and $response.errors.Count -eq 0) {
        Write-Host "`n   ⚠️  No leads created and no errors reported!" -ForegroundColor Yellow
        Write-Host "      This suggests a silent failure" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "   ❌ Error sending lead: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

# Check admin overview
Write-Host "`n📊 3. Checking Admin Overview API" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

$adminHeaders = @{
    "Authorization" = "Bearer $adminToken"
}

try {
    $overview = Invoke-RestMethod -Uri "$BaseUrl/api/admin/overview" `
        -Method GET `
        -Headers $adminHeaders `
        -TimeoutSec 15 `
        -ErrorAction Stop
    
    Write-Host "   ✅ API responded" -ForegroundColor Green
    Write-Host "   Total Leads: $($overview.stats.totalLeads)" -ForegroundColor Cyan
    Write-Host "   Campaigns: $($overview.stats.totalCampaigns)" -ForegroundColor Cyan
    Write-Host "   SDRs: $($overview.stats.totalSDRs)" -ForegroundColor Cyan
    
    if ($overview.leads.Count -gt 0) {
        Write-Host "`n   ✅ Found $($overview.leads.Count) leads in API response" -ForegroundColor Green
        Write-Host "   First lead:" -ForegroundColor Gray
        $firstLead = $overview.leads[0]
        Write-Host "      Name: $($firstLead.nome)" -ForegroundColor White
        Write-Host "      Company: $($firstLead.empresa)" -ForegroundColor White
        Write-Host "      Campaign: $($firstLead.campaigns.name)" -ForegroundColor White
    } else {
        Write-Host "`n   ❌ No leads in API response" -ForegroundColor Red
    }
    
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check database directly via Supabase REST API
Write-Host "`n🗄️  4. Checking Database Directly (Supabase REST API)" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

if ($supabaseUrl -and $supabaseKey) {
    try {
        $dbHeaders = @{
            "apikey" = $supabaseKey
            "Authorization" = "Bearer $supabaseKey"
            "Content-Type" = "application/json"
        }
        
        # Check campaigns
        $campaignsUrl = "$supabaseUrl/rest/v1/campaigns?select=id,name,status&order=created_at.desc&limit=5"
        $campaigns = Invoke-RestMethod -Uri $campaignsUrl -Headers $dbHeaders -Method GET
        
        Write-Host "   Campaigns in DB: $($campaigns.Count)" -ForegroundColor Cyan
        $campaigns | ForEach-Object {
            Write-Host "      - $($_.name) (ID: $($_.id))" -ForegroundColor Gray
        }
        
        # Check leads
        $leadsUrl = "$supabaseUrl/rest/v1/campaign_contacts?select=id,nome,empresa,phone,campaign_id,created_at&order=created_at.desc&limit=5"
        $leads = Invoke-RestMethod -Uri $leadsUrl -Headers $dbHeaders -Method GET
        
        Write-Host "`n   Leads in DB: $($leads.Count)" -ForegroundColor Cyan
        if ($leads.Count -gt 0) {
            $leads | ForEach-Object {
                Write-Host "      - $($_.nome) ($($_.empresa)) - Campaign: $($_.campaign_id)" -ForegroundColor Gray
            }
        } else {
            Write-Host "      ❌ No leads found in database!" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "   ❌ Error querying database: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   💡 Check Supabase Dashboard manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Supabase credentials not available" -ForegroundColor Yellow
}

# Recommendations
Write-Host "`n💡 5. Recommendations" -ForegroundColor Yellow
Write-Host "-" * 60 -ForegroundColor Gray

if ($response -and $response.created -eq 0) {
    Write-Host "   ❌ Problem: Leads not being created" -ForegroundColor Red
    Write-Host "`n   Possible causes:" -ForegroundColor Cyan
    Write-Host "      1. Database constraint violation (foreign key, NOT NULL)" -ForegroundColor Gray
    Write-Host "      2. RLS (Row Level Security) blocking inserts" -ForegroundColor Gray
    Write-Host "      3. Missing required fields" -ForegroundColor Gray
    Write-Host "      4. Campaign creation failing" -ForegroundColor Gray
    Write-Host "`n   Solutions:" -ForegroundColor Cyan
    Write-Host "      1. Check server logs for [Integration] error messages" -ForegroundColor White
    Write-Host "      2. Run migration: supabase/migrations/002_advanced_features_final.sql" -ForegroundColor White
    Write-Host "      3. Check RLS policies in Supabase Dashboard" -ForegroundColor White
    Write-Host "      4. Verify campaign_contacts table structure" -ForegroundColor White
}

if ($overview -and $overview.stats.totalLeads -eq 0 -and $leads -and $leads.Count -gt 0) {
    Write-Host "   ⚠️  Leads exist in DB but not in API response!" -ForegroundColor Yellow
    Write-Host "      This suggests a query or RLS issue" -ForegroundColor Gray
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check server logs (npm run dev) for [Integration] messages" -ForegroundColor Gray
Write-Host "   2. Go to Supabase Dashboard → Table Editor → campaign_contacts" -ForegroundColor Gray
Write-Host "   3. Check if leads are actually there" -ForegroundColor Gray
Write-Host "   4. If leads exist but not showing: Check RLS policies" -ForegroundColor Gray
Write-Host "   5. If leads don't exist: Check server logs for insert errors" -ForegroundColor Gray

Write-Host "`n✅ Diagnosis complete!" -ForegroundColor Green
