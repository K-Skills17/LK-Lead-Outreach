# 📱 WhatsApp Scanning Feature - Complete Guide

## ✅ Feature Status: **IMPLEMENTED**

SDRs can now connect their WhatsApp accounts through the desktop app. The web dashboard shows connection status and provides controls.

---

## 🏗️ Architecture

```
SDR Dashboard (Web)
    ↓
    ├─ Shows connection status
    ├─ "Connect WhatsApp" button
    └─ Calls API to initiate connection
         ↓
Desktop App (Python/Electron)
    ├─ Receives connection request
    ├─ Opens WhatsApp Web
    ├─ Generates QR code
    ├─ SDR scans with phone
    └─ Reports connection status back to API
```

---

## 📋 Database Schema

The following fields have been added to `sdr_users` table:

- `whatsapp_connected` (BOOLEAN) - Connection status
- `whatsapp_session_id` (TEXT) - Unique session identifier
- `whatsapp_phone` (TEXT) - Connected phone number
- `whatsapp_connected_at` (TIMESTAMPTZ) - Connection timestamp
- `whatsapp_last_seen` (TIMESTAMPTZ) - Last activity time
- `whatsapp_qr_code` (TEXT) - Temporary QR code storage

**Migration:** Run `supabase/migrations/011_sdr_whatsapp_connection.sql`

---

## 🔌 API Endpoints

### 1. **Get WhatsApp Status**
```
GET /api/sdr/whatsapp/status
Headers: Authorization: Bearer {sdr-id}

Response:
{
  "success": true,
  "connected": false,
  "phone": null,
  "connectedAt": null,
  "lastSeen": null,
  "sessionId": null
}
```

### 2. **Initiate Connection**
```
POST /api/sdr/whatsapp/connect
Headers: Authorization: Bearer {sdr-id}

Response:
{
  "success": true,
  "sessionId": "abc123...",
  "message": "Connection initiated...",
  "instructions": "Open your desktop app and scan the QR code..."
}
```

### 3. **Update Connection Status** (Desktop App calls this)
```
PUT /api/sdr/whatsapp/connect
Headers: Authorization: Bearer {sdr-id}
Body:
{
  "phone": "+5511999999999",
  "connected": true,
  "sessionId": "abc123..."
}

Response:
{
  "success": true,
  "message": "WhatsApp connected successfully"
}
```

### 4. **Disconnect**
```
DELETE /api/sdr/whatsapp/connect
Headers: Authorization: Bearer {sdr-id}

Response:
{
  "success": true,
  "message": "WhatsApp disconnected successfully"
}
```

---

## 🖥️ Desktop App Integration

### Step 1: SDR Clicks "Connect WhatsApp" in Web Dashboard

The web dashboard calls `POST /api/sdr/whatsapp/connect` and receives a `sessionId`.

### Step 2: Desktop App Polls for Connection Requests

Desktop app should periodically check for pending connections:

```python
# Pseudo-code
def check_for_connection_request(sdr_id):
    response = requests.get(
        f"{API_URL}/api/sdr/whatsapp/status",
        headers={"Authorization": f"Bearer {sdr_id}"}
    )
    data = response.json()
    
    # Check if there's a session_id but not connected
    if data.get('sessionId') and not data.get('connected'):
        return data['sessionId']
    return None
```

### Step 3: Desktop App Opens WhatsApp Web

When a connection request is detected:

```python
# Using Selenium or similar
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

def connect_whatsapp(session_id, sdr_id):
    # Open WhatsApp Web
    driver = webdriver.Chrome()
    driver.get("https://web.whatsapp.com")
    
    # Wait for QR code to appear
    qr_code_element = WebDriverWait(driver, 60).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "canvas"))
    )
    
    # Extract QR code (you'll need a library for this)
    qr_code_data = extract_qr_code(driver)
    
    # Wait for connection (QR code disappears)
    WebDriverWait(driver, 120).until(
        EC.invisibility_of_element_located((By.CSS_SELECTOR, "canvas"))
    )
    
    # Get phone number from WhatsApp Web
    phone = get_phone_number(driver)
    
    # Report connection to API
    requests.put(
        f"{API_URL}/api/sdr/whatsapp/connect",
        headers={"Authorization": f"Bearer {sdr_id}"},
        json={
            "phone": phone,
            "connected": True,
            "sessionId": session_id
        }
    )
    
    # Keep driver alive for sending messages
    return driver
```

### Step 4: Desktop App Sends Messages

Once connected, the desktop app can:
1. Poll `/api/sender/queue` with SDR ID
2. Get leads assigned to that SDR
3. Send messages via WhatsApp Web
4. Mark as sent via `/api/sender/mark-sent`

---

## 🎨 Web Dashboard UI

The SDR dashboard now shows:

1. **Connection Status Card**
   - ✅ Green indicator if connected
   - ❌ Gray indicator if not connected
   - Phone number (if connected)
   - Connection timestamp

2. **Connect Button**
   - Appears when not connected
   - Initiates connection process
   - Shows loading state

3. **Disconnect Button**
   - Appears when connected
   - Allows SDR to disconnect

4. **Instructions**
   - Helpful text explaining the process
   - Shown when not connected

---

## 🔄 Connection Flow

```
1. SDR logs into web dashboard
   ↓
2. SDR clicks "Connect WhatsApp"
   ↓
3. Web calls POST /api/sdr/whatsapp/connect
   ↓
4. API generates sessionId and stores it
   ↓
5. Desktop app detects sessionId (polling)
   ↓
6. Desktop app opens WhatsApp Web
   ↓
7. Desktop app shows QR code to SDR
   ↓
8. SDR scans QR code with phone
   ↓
9. Desktop app detects connection
   ↓
10. Desktop app calls PUT /api/sdr/whatsapp/connect
    ↓
11. Web dashboard refreshes and shows "Connected"
```

---

## 📝 Desktop App Requirements

Your desktop app needs to:

1. **Poll for connection requests**
   - Check `/api/sdr/whatsapp/status` every 5-10 seconds
   - Look for `sessionId` when `connected = false`

2. **Open WhatsApp Web**
   - Use Selenium, Playwright, or similar
   - Navigate to `https://web.whatsapp.com`

3. **Extract QR Code**
   - Get QR code from WhatsApp Web canvas
   - Display to user (or save as image)

4. **Detect Connection**
   - Wait for QR code to disappear
   - Check for "WhatsApp Web" in page title

5. **Get Phone Number**
   - Extract from WhatsApp Web interface
   - Or use the phone number from the connected account

6. **Report Status**
   - Call `PUT /api/sdr/whatsapp/connect` with phone and status
   - Keep session alive for sending messages

7. **Send Messages**
   - Use existing `/api/sender/queue` endpoint
   - Filter by SDR ID (already implemented)
   - Send via WhatsApp Web automation

---

## 🧪 Testing

### Test Connection Flow:

1. **Run Migration**
   ```sql
   -- In Supabase SQL Editor
   \i supabase/migrations/011_sdr_whatsapp_connection.sql
   ```

2. **Login as SDR**
   - Go to `/sdr/login`
   - Login with SDR credentials

3. **Check Status**
   - Dashboard should show "WhatsApp Not Connected"

4. **Initiate Connection**
   - Click "Connect WhatsApp"
   - Should see session ID in alert

5. **Desktop App**
   - Desktop app should detect session ID
   - Open WhatsApp Web
   - Show QR code

6. **Scan QR Code**
   - Use WhatsApp mobile app to scan
   - Desktop app should detect connection

7. **Verify Status**
   - Web dashboard should show "Connected"
   - Phone number should be displayed

---

## ⚠️ Important Notes

1. **QR Code Generation**: The web app doesn't generate QR codes. The desktop app must handle this by opening WhatsApp Web and extracting the QR code.

2. **Session Management**: Each SDR has their own session. Multiple SDRs can connect simultaneously.

3. **Connection Persistence**: The desktop app must keep the WhatsApp Web session alive. If it closes, the connection is lost.

4. **Security**: Session IDs are unique per SDR and connection attempt. They're stored in the database for tracking.

5. **Polling**: Desktop app should poll for connection requests, not use webhooks (simpler for MVP).

---

## 🚀 Next Steps

1. **Run the migration** in Supabase
2. **Update your desktop app** to:
   - Poll for connection requests
   - Open WhatsApp Web
   - Extract and display QR code
   - Report connection status
3. **Test the flow** end-to-end
4. **Handle reconnections** (if WhatsApp Web disconnects)

---

## 📞 Support

If you need help implementing the desktop app integration, I can:
- Provide more detailed code examples
- Help with Selenium/Playwright setup
- Assist with QR code extraction
- Debug connection issues

Let me know what you need!
