# Simple Admin Login Test
# Tests the login API directly without database queries

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "`n🧪 Simple Admin Login Test" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Step 1: Check if server is running
Write-Host "`n📡 Step 1: Checking if server is running..." -ForegroundColor Cyan

try {
    $healthCheck = Invoke-WebRequest -Uri $BaseUrl -Method Get -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server is not running!" -ForegroundColor Red
    Write-Host "`n💡 Start the server with:" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host "`n   Then wait for 'Ready' message before running this test again" -ForegroundColor Gray
    exit 1
}

# Step 2: Test login
Write-Host "`n🔐 Step 2: Testing login..." -ForegroundColor Cyan
Write-Host "   Email: $Email" -ForegroundColor Gray

$body = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "`n✅ LOGIN SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   User: $($response.user.name) ($($response.user.email))" -ForegroundColor Gray
        Write-Host "   Token received: ✅" -ForegroundColor Gray
        Write-Host "`n🎉 You can now access the admin dashboard!" -ForegroundColor Green
        Write-Host "   URL: $BaseUrl/admin" -ForegroundColor Yellow
    } else {
        Write-Host "`n❌ Login failed (unexpected response)" -ForegroundColor Red
        Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Yellow
    }
} catch {
    $statusCode = $null
    $errorMessage = $null
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        
        try {
            $errorData = $responseBody | ConvertFrom-Json
            $errorMessage = $errorData.error
        } catch {
            $errorMessage = $responseBody
        }
    }
    
    Write-Host "`n❌ Login Failed" -ForegroundColor Red
    
    if ($statusCode) {
        Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
    }
    
    if ($errorMessage) {
        Write-Host "   Error: $errorMessage" -ForegroundColor Red
    } else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n🔍 Troubleshooting:" -ForegroundColor Cyan
    
    if ($statusCode -eq 401) {
        Write-Host "   → Email or password is incorrect" -ForegroundColor Gray
        Write-Host "   → OR password hash in database doesn't match" -ForegroundColor Gray
        Write-Host "`n💡 Try:" -ForegroundColor Yellow
        Write-Host "   .\diagnose-admin-login.ps1 -Email `"$Email`" -Password `"$Password`"" -ForegroundColor White
    } elseif ($statusCode -eq 500) {
        Write-Host "   → Server error - check server logs" -ForegroundColor Gray
        Write-Host "   → Check if SUPABASE_SERVICE_ROLE_KEY is set correctly" -ForegroundColor Gray
        Write-Host "`n💡 Check the terminal where 'npm run dev' is running for error details" -ForegroundColor Yellow
    } elseif ($statusCode -eq 400) {
        Write-Host "   → Missing email or password" -ForegroundColor Gray
    } else {
        Write-Host "   → Unknown error - check server logs" -ForegroundColor Gray
    }
}

Write-Host "`n📋 Test Complete" -ForegroundColor Cyan
