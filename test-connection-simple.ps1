# Simple Integration Test
# Automatically reads token from .env.local

# Try to get token from .env.local
$token = ""
if (Test-Path .env.local) {
    $envContent = Get-Content .env.local
    $tokenLine = $envContent | Select-String "LEAD_GEN_INTEGRATION_TOKEN"
    if ($tokenLine) {
        $token = ($tokenLine -split "=")[1].Trim()
        Write-Host "✅ Found token in .env.local" -ForegroundColor Green
    }
}

# Fallback to hardcoded token if not found
if (-not $token) {
    $token = "bc055773c3cf2412a0a1c7483b7e0bf6"
    Write-Host "⚠️ Using hardcoded token (not recommended)" -ForegroundColor Yellow
}

$url = "http://localhost:3000/api/integration/status"

Write-Host "`n🧪 Testing Integration..." -ForegroundColor Cyan
Write-Host "   URL: $url" -ForegroundColor Gray
Write-Host "   Token: $($token.Substring(0, [Math]::Min(10, $token.Length)))..." -ForegroundColor Gray

# Check if server is running
Write-Host "`n📡 Checking if server is running..." -ForegroundColor Cyan
try {
    $testConnection = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if (-not $testConnection) {
        Write-Host "❌ Server is not running on port 3000" -ForegroundColor Red
        Write-Host "`n💡 Start the server first:" -ForegroundColor Yellow
        Write-Host "   1. Open a terminal" -ForegroundColor Gray
        Write-Host "   2. Run: npm run dev" -ForegroundColor Gray
        Write-Host "   3. Wait for 'Ready' message" -ForegroundColor Gray
        Write-Host "   4. Run this script again" -ForegroundColor Gray
        exit 1
    }
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not check server status" -ForegroundColor Yellow
}

# Test the integration
Write-Host "`n🔗 Testing integration endpoint..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers -ErrorAction Stop
    
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Status: $($result.status)" -ForegroundColor Green
    Write-Host "`n📊 Statistics:" -ForegroundColor Cyan
    Write-Host "   Campaigns: $($result.statistics.campaigns)" -ForegroundColor Gray
    Write-Host "   Total Leads: $($result.statistics.total_leads)" -ForegroundColor Gray
    Write-Host "   Pending: $($result.statistics.pending_leads)" -ForegroundColor Gray
    Write-Host "   Sent: $($result.statistics.sent_leads)" -ForegroundColor Gray
    
    Write-Host "`n✅ Integration is working correctly!" -ForegroundColor Green
    Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
    Write-Host "   - Test sending a lead: .\test-integration.ps1" -ForegroundColor Gray
    Write-Host "   - Check admin dashboard: http://localhost:3000/admin" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Error occurred" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Check response body for more details
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "`n   Response: $responseBody" -ForegroundColor Yellow
            
            if ($responseBody -like "*not configured*") {
                Write-Host "`n💡 Integration token not configured:" -ForegroundColor Yellow
                Write-Host "   1. Make sure LEAD_GEN_INTEGRATION_TOKEN is in .env.local" -ForegroundColor Gray
                Write-Host "   2. Restart the dev server (npm run dev)" -ForegroundColor Gray
            } elseif ($responseBody -like "*Unauthorized*") {
                Write-Host "`n💡 Token mismatch:" -ForegroundColor Yellow
                Write-Host "   Check that the token in .env.local matches what you're using" -ForegroundColor Gray
            }
        } catch {
            # Couldn't read response body
        }
    }
    
    if ($_.Exception.Message -like "*conectar*" -or $_.Exception.Message -like "*connect*" -or $_.Exception.Message -like "*refused*") {
        Write-Host "`n💡 Server connection issue:" -ForegroundColor Yellow
        Write-Host "   - Make sure 'npm run dev' is running" -ForegroundColor Gray
        Write-Host "   - Wait for 'Ready' message before testing" -ForegroundColor Gray
        Write-Host "   - Check if port 3000 is available" -ForegroundColor Gray
    }
}
