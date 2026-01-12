# 🚀 Facebook Conversions API (CAPI) Setup

## What is CAPI?

**CAPI = Conversions API** - Facebook's server-side tracking that works alongside your browser Pixel for **more reliable conversion tracking**.

### ✅ Benefits:
- **Better accuracy** - Bypasses ad blockers
- **iOS 14+ tracking** - Works despite Apple privacy changes
- **Cookie-independent** - Tracks even when cookies are blocked
- **Event deduplication** - Prevents double-counting with Pixel
- **Better attribution** - More accurate Facebook Ads performance

---

## 🔧 Setup Steps

### Step 1: Get Your Facebook Access Token

#### 1.1 Go to Facebook Events Manager
```
https://business.facebook.com/events_manager
```

#### 1.2 Select Your Pixel
- Click on your "LK Reactor Pro" pixel

#### 1.3 Open Settings
- Click **"Settings"** tab
- Scroll down to **"Conversions API"**

#### 1.4 Generate Access Token
- Click **"Generate Access Token"**
- Or click **"Set up Conversions API"** → **"Manually"**
- Copy the **Access Token** (looks like: `EAAxxxx...`)

**⚠️ Important**: Keep this token secret! Never commit to Git.

---

### Step 2: Add to Environment Variables

Add to your `.env.local` file:

```env
# Facebook Pixel ID (already set)
NEXT_PUBLIC_FB_PIXEL_ID=123456789012345

# Facebook CAPI Access Token (NEW - add this)
FB_CAPI_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Test Event Code (for testing)
FB_TEST_EVENT_CODE=TEST12345
```

**How to get Test Event Code** (optional):
1. Events Manager → Your Pixel → **"Test Events"**
2. Copy the test event code shown
3. Use during development to test without affecting live data

---

### Step 3: Restart Your Server

```bash
npm run dev
```

✅ **Done!** CAPI is now active alongside your Pixel.

---

## 🎯 How It Works

### Dual Tracking (Pixel + CAPI):

```
User Action (e.g., Download App)
    ↓
    ├─→ Browser Pixel (client-side) ──→ Facebook
    │
    └─→ Your Server (CAPI) ──→ Facebook
```

**Event Deduplication**: We use unique `event_id` so Facebook counts each event only once, even though it's sent from both browser and server.

---

## 📊 Events Tracked via CAPI

| Event | When It Fires | Data Sent |
|-------|---------------|-----------|
| `PageView` | Every page load | IP, User Agent, Cookies |
| `Lead` | Form completion | Email (hashed), Phone (hashed), Name (hashed) |
| `CompleteRegistration` | **App download** | Email (hashed), Plan type, Value |
| `InitiateCheckout` | Payment button click | Email (hashed), Plan type, Amount |
| `Purchase` | Payment complete | Email (hashed), Amount, Transaction ID |

**🔒 Privacy**: All personal data (email, phone, name) is **SHA-256 hashed** before sending to Facebook.

---

## 🧪 Testing CAPI

### Option 1: Facebook Test Events

1. Go to **Events Manager** → Your Pixel → **"Test Events"**
2. Add your **Test Event Code** to `.env.local`
3. Browse your website
4. See events appear in real-time in Test Events tool
5. Events will be marked as "Test" and won't affect your live data

### Option 2: Check Server Logs

Look for these in your server console:
```
[CAPI] Event sent successfully: CompleteRegistration Event ID: CompleteRegistration_1234567890_abc123
```

### Option 3: Events Manager Overview

1. Events Manager → Your Pixel → **"Overview"**
2. Look for **"Server"** events (these are from CAPI)
3. Compare with **"Browser"** events (these are from Pixel)
4. Check **"Event Match Quality"** score (should be high)

---

## 🎯 Event Match Quality

Facebook shows an **"Event Match Quality"** score for CAPI events.

**Higher is better!** Aim for **7.0+**

### Improving Match Quality:

We already send:
- ✅ `em` (email - hashed)
- ✅ `ph` (phone - hashed)
- ✅ `fn` (first name - hashed)
- ✅ `client_ip_address`
- ✅ `client_user_agent`
- ✅ `fbp` (Facebook browser ID)
- ✅ `fbc` (Facebook click ID)

This should give you a high match quality score automatically!

---

## 🔍 Troubleshooting

### Events Not Showing in Events Manager

**Check**:
1. ✅ `FB_CAPI_ACCESS_TOKEN` is set correctly
2. ✅ Access token is valid (doesn't expire for 60 days by default)
3. ✅ Pixel ID matches in both `.env.local` variables
4. ✅ Server is restarted after adding env variables

**Test**: Check server logs for `[CAPI]` messages

### Low Event Match Quality

**Solutions**:
- Ensure users are providing email (we hash and send it)
- Check that cookies are being sent (for `fbp` and `fbc`)
- Verify IP address is being captured correctly

### "Invalid Access Token" Error

**Fix**:
1. Go back to Events Manager
2. Generate a new access token
3. Update `.env.local`
4. Restart server

### Events Counted Twice

**Shouldn't happen!** We use event deduplication with unique `event_id`.

If you see this:
- Check that both Pixel and CAPI are using the same Pixel ID
- Verify events have `event_id` in server logs

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep `FB_CAPI_ACCESS_TOKEN` in `.env.local` (not `.env`)
- Add `.env.local` to `.gitignore`
- Use different tokens for dev/staging/production
- Rotate access tokens every 60 days

### ❌ DON'T:
- Never commit access token to Git
- Never share token publicly
- Never use token on client-side (browser)

---

## 📈 Monitoring Performance

### Check These Metrics in Events Manager:

1. **Events Received**
   - Should see both "Browser" and "Server" events
   - Server events = CAPI

2. **Event Match Quality**
   - Should be 7.0 or higher
   - Higher = better attribution

3. **Deduplication Rate**
   - Shows how many events were deduplicated
   - Should be ~50% (since we send from both browser and server)

4. **Attribution**
   - Check if Facebook Ads are getting credit for conversions
   - Should see better attribution with CAPI enabled

---

## 💡 Pro Tips

### 1. Use Test Events During Development
```env
FB_TEST_EVENT_CODE=TEST12345
```
This ensures test events don't pollute your production data.

### 2. Monitor Server Logs
Watch for `[CAPI]` messages to confirm events are being sent.

### 3. Compare Pixel vs CAPI
In Events Manager, compare:
- Browser events (Pixel only)
- Server events (CAPI)
- Should be roughly equal

### 4. Check for iOS Users
CAPI is especially important for iOS 14+ users where browser tracking is limited.

---

## 🎯 Next Steps for Facebook Ads

Now that you have **both Pixel + CAPI**:

1. **Create Conversion Campaigns**
   - Objective: "Conversions"
   - Event: `CompleteRegistration`

2. **Better Audiences**
   - Create lookalike audiences
   - More accurate targeting with CAPI data

3. **Improved Attribution**
   - 7-day click, 1-day view attribution
   - CAPI helps capture conversions that Pixel might miss

4. **iOS Users**
   - Your ads will now properly track iOS users
   - No more blind spots from iOS privacy features

---

## 📞 Support

**Email**: contato@lkdigital.org  
**WhatsApp**: +55 11 95282-9271

---

## ✅ Checklist

- [ ] Generated Facebook Access Token
- [ ] Added `FB_CAPI_ACCESS_TOKEN` to `.env.local`
- [ ] Restarted server
- [ ] Tested in Facebook Test Events
- [ ] Verified events in Events Manager
- [ ] Checked Event Match Quality (7.0+)
- [ ] Confirmed deduplication is working

---

**Last Updated**: 12 de janeiro de 2026  
**Status**: ✅ CAPI Fully Integrated
