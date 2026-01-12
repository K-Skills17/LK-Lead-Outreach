#!/bin/bash

# Facebook CAPI Test Script
# This tests if your Conversions API is working correctly

# INSTRUCTIONS:
# 1. Replace these values with your actual credentials from .env.local
# 2. Run: bash scripts/test-capi.sh

# ===== CONFIGURATION =====
PIXEL_ID="YOUR_PIXEL_ID_HERE"              # From NEXT_PUBLIC_FB_PIXEL_ID
ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"      # From FB_CAPI_ACCESS_TOKEN
API_VERSION="v18.0"                        # Facebook API version
TEST_EVENT_CODE=""                         # Optional: From Facebook Test Events

# ===== TEST EVENT DATA =====
CURRENT_TIME=$(date +%s)

# Test event: CompleteRegistration (App Download)
EVENT_DATA='[{
  "event_name": "CompleteRegistration",
  "event_time": '"$CURRENT_TIME"',
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
}]'

# ===== SEND TEST EVENT =====
echo "🧪 Testing Facebook CAPI..."
echo "Pixel ID: $PIXEL_ID"
echo "API Version: $API_VERSION"
echo ""

if [ "$TEST_EVENT_CODE" != "" ]; then
  echo "📝 Sending TEST event (won't affect live data)..."
  EVENT_DATA=$(echo "$EVENT_DATA" | jq --arg code "$TEST_EVENT_CODE" '.[0].test_event_code = $code | [.[0]]')
else
  echo "⚠️  Sending LIVE event (will appear in your pixel data)"
fi

echo ""

# Make the API call
RESPONSE=$(curl -s -X POST \
  -F "data=$EVENT_DATA" \
  -F "access_token=$ACCESS_TOKEN" \
  "https://graph.facebook.com/$API_VERSION/$PIXEL_ID/events")

echo "📊 Response:"
echo "$RESPONSE" | jq .

# Check if successful
if echo "$RESPONSE" | grep -q '"events_received":1'; then
  echo ""
  echo "✅ SUCCESS! CAPI is working correctly!"
  echo ""
  echo "Next steps:"
  echo "1. Go to Facebook Events Manager"
  echo "2. Check 'Test Events' (if you used test_event_code)"
  echo "3. Or check 'Overview' to see the event"
else
  echo ""
  echo "❌ ERROR! Check the response above for details"
  echo ""
  echo "Common issues:"
  echo "- Invalid Access Token"
  echo "- Wrong Pixel ID"
  echo "- Access Token doesn't have permission"
fi
