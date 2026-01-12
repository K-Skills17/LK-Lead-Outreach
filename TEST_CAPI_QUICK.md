# ⚡ Quick CAPI Test Guide

## Option 1: Using PowerShell (Windows - EASIEST)

### Step 1: Open `scripts/test-capi.ps1`

### Step 2: Replace These Values:
```powershell
$PIXEL_ID = "123456789012345"           # Your Pixel ID
$ACCESS_TOKEN = "EAAxxxxxxxxxx"         # Your Access Token
$TEST_EVENT_CODE = "TEST12345"          # Optional: Your test code
```

### Step 3: Run:
```powershell
cd "C:\dev\Protocolo Receita Oculta\protocoloreceitaoculta"
.\scripts\test-capi.ps1
```

---

## Option 2: Using cURL (Any Platform)

### Quick Command:
```bash
curl -X POST \
  -F 'data=[{
    "event_name": "CompleteRegistration",
    "event_time": 1705084800,
    "action_source": "website",
    "event_source_url": "https://yourdomain.com/setup",
    "user_data": {
      "em": ["7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068"],
      "client_ip_address": "192.168.1.1",
      "client_user_agent": "Mozilla/5.0"
    },
    "custom_data": {
      "currency": "BRL",
      "value": 197,
      "content_name": "test download"
    }
  }]' \
  -F 'access_token=YOUR_ACCESS_TOKEN' \
  https://graph.facebook.com/v18.0/YOUR_PIXEL_ID/events
```

**Replace**:
- `YOUR_ACCESS_TOKEN` - Your FB CAPI Access Token
- `YOUR_PIXEL_ID` - Your Facebook Pixel ID

---

## ✅ Success Response:

```json
{
  "events_received": 1,
  "messages": [],
  "fbtrace_id": "AabCdEfG..."
}
```

**If you see `"events_received": 1`** → ✅ **CAPI IS WORKING!**

---

## ❌ Error Responses:

### "Invalid OAuth access token"
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "type": "OAuthException",
    "code": 190
  }
}
```
**Fix**: Check your `FB_CAPI_ACCESS_TOKEN` in `.env.local`

### "Unsupported get request"
```json
{
  "error": {
    "message": "Unsupported get request",
    "type": "GraphMethodException",
    "code": 100
  }
}
```
**Fix**: Make sure you're using POST method (not GET)

### "Invalid parameter"
**Fix**: Check Pixel ID is correct

---

## 🧪 Test in Facebook Events Manager

### After Running the Test:

1. Go to: https://business.facebook.com/events_manager
2. Click your pixel
3. Click **"Test Events"** (if you used test_event_code)
4. OR click **"Overview"** → Check for recent events
5. You should see: **"CompleteRegistration"** event ✅

---

## 📊 What to Check:

✅ **Events Received** = 1  
✅ **Event Name** = "CompleteRegistration"  
✅ **Event Match Quality** = High (7.0+)  
✅ **Source** = "Server" (this is CAPI!)  

---

## 🎯 Next: Test from Your Website

Once this manual test works, test from your actual website:

1. Go to your website: `http://localhost:3000`
2. Fill out the form
3. Click download button
4. Check Facebook Events Manager
5. You should see TWO events:
   - **Browser** (from Pixel)
   - **Server** (from CAPI) ✅

---

## 💡 Pro Tip: Use Test Event Code

In your test scripts, add:
```javascript
"test_event_code": "TEST12345"
```

This ensures test events don't pollute your production data!

Get your test code from:
**Events Manager → Your Pixel → Test Events → Copy Test Code**

---

**Questions?** Check `FACEBOOK_CAPI_SETUP.md` for full documentation.
