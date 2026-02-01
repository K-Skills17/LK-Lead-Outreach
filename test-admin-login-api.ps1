# Test Admin Login API Directly
# This tests the actual login endpoint

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "`n🧪 Testing Admin Login API" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📡 Testing connection to: $BaseUrl" -ForegroundColor Yellow

# First check if server is running
try {
    $healthCheck = Invoke-WebRequest -Uri "$BaseUrl" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running or not accessible!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "`n💡 Make sure to run: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🔐 Attempting login..." -ForegroundColor Cyan
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
        Write-Host "   User ID: $($response.user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($response.user.email)" -ForegroundColor Gray
        Write-Host "   Name: $($response.user.name)" -ForegroundColor Gray
        Write-Host "   Token received: ✅" -ForegroundColor Gray
        Write-Host "`n🎉 You can now access the admin dashboard!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Login failed" -ForegroundColor Red
        Write-Host "   Response: $($response | ConvertTo-Json)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "`n❌ Login request failed" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        
        Write-Host "   Status Code: $statusCode" -ForegroundColor Yellow
        
        try {
            $errorData = $responseBody | ConvertFrom-Json
            Write-Host "   Error: $($errorData.error)" -ForegroundColor Red
            if ($errorData.details) {
                Write-Host "   Details: $($errorData.details)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   Response: $responseBody" -ForegroundColor Yellow
        }
        
        if ($statusCode -eq 401) {
            Write-Host "`n💡 This means:" -ForegroundColor Yellow
            Write-Host "   - Email or password is incorrect" -ForegroundColor Gray
            Write-Host "   - OR the password hash in database doesn't match" -ForegroundColor Gray
            Write-Host "`n🔧 Try running:" -ForegroundColor Cyan
            Write-Host "   .\diagnose-admin-login.ps1 -Email `"$Email`" -Password `"$Password`"" -ForegroundColor Gray
        } elseif ($statusCode -eq 500) {
            Write-Host "`n💡 This means a server error occurred." -ForegroundColor Yellow
            Write-Host "   Check the server logs (terminal where npm run dev is running)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
