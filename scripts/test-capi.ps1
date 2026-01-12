# Facebook CAPI Test Script (PowerShell)
# This tests if your Conversions API is working correctly

# INSTRUCTIONS:
# 1. Replace these values with your actual credentials from .env.local
# 2. Run: .\scripts\test-capi.ps1

# ===== CONFIGURATION =====
$PIXEL_ID = "YOUR_PIXEL_ID_HERE"              # From NEXT_PUBLIC_FB_PIXEL_ID
$ACCESS_TOKEN = "YOUR_ACCESS_TOKEN_HERE"      # From FB_CAPI_ACCESS_TOKEN
$API_VERSION = "v18.0"                        # Facebook API version
$TEST_EVENT_CODE = ""                         # Optional: From Facebook Test Events

# ===== TEST EVENT DATA =====
$CURRENT_TIME = [Math]::Floor([DateTime]::UtcNow.Subtract([DateTime]::new(1970,1,1)).TotalSeconds)

$EVENT_DATA = @"
[{
  "event_name": "CompleteRegistration",
  "event_time": $CURRENT_TIME,
  "action_source": "website",
  "event_source_url": "https://yourdomain.com/setup",
  "user_data": {
    "em": ["7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068"],
    "ph": [""],
    "client_ip_address": "192.168.1.1",
    "client_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "fbp": "fb.1.1234567890.1234567890",
    "fbc": "fb.1.1234567890.1234567890"
  },
  "custom_data": {
    "currency": "BRL",
    "value": 197,
    "content_name": "professional plan download"
  }
}]
"@

# ===== SEND TEST EVENT =====
Write-Host "🧪 Testing Facebook CAPI..." -ForegroundColor Cyan
Write-Host "Pixel ID: $PIXEL_ID"
Write-Host "API Version: $API_VERSION"
Write-Host ""

if ($TEST_EVENT_CODE -ne "") {
    Write-Host "📝 Sending TEST event (won't affect live data)..." -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Sending LIVE event (will appear in your pixel data)" -ForegroundColor Yellow
}

Write-Host ""

# Make the API call
$URL = "https://graph.facebook.com/$API_VERSION/$PIXEL_ID/events?access_token=$ACCESS_TOKEN"

try {
    $RESPONSE = Invoke-RestMethod -Uri $URL -Method Post -Body @{
        data = $EVENT_DATA
    } -ContentType "application/x-www-form-urlencoded"

    Write-Host "📊 Response:" -ForegroundColor Cyan
    $RESPONSE | ConvertTo-Json -Depth 10

    if ($RESPONSE.events_received -eq 1) {
        Write-Host ""
        Write-Host "✅ SUCCESS! CAPI is working correctly!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "1. Go to Facebook Events Manager"
        Write-Host "2. Check 'Test Events' (if you used test_event_code)"
        Write-Host "3. Or check 'Overview' to see the event"
    } else {
        Write-Host ""
        Write-Host "⚠️  Unexpected response. Check details above." -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR! " -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Common issues:"
    Write-Host "- Invalid Access Token"
    Write-Host "- Wrong Pixel ID"
    Write-Host "- Access Token doesn't have permission"
}
