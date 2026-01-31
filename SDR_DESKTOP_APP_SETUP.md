# 🖥️ SDR Desktop App Setup Guide

## ✅ Database is Ready!

Your database already supports multi-tenant SDR setup:
- ✅ `sdr_users` table exists
- ✅ `assigned_sdr_id` column on `campaign_contacts` 
- ✅ `assigned_sdr_id` column on `campaigns`
- ✅ All indexes in place

## 🏗️ Architecture

```
Each SDR's Computer
├── Desktop App (Python)
│   ├── 1. Login with email/password
│   ├── 2. Get SDR ID token
│   ├── 3. Connect own WhatsApp
│   ├── 4. Fetch only assigned leads
│   └── 5. Send messages from their WhatsApp
```

## 🔐 Authentication Flow

### Step 1: SDR Login
```python
# Desktop app calls:
POST https://your-domain.com/api/sender/auth
{
  "email": "sdr@example.com",
  "password": "their_password"
}

# Response:
{
  "success": true,
  "token": "sdr-uuid-here",  # This is the SDR ID
  "sdr": {
    "id": "sdr-uuid-here",
    "email": "sdr@example.com",
    "name": "John Doe",
    "role": "sdr"
  }
}
```

### Step 2: Fetch Leads
```python
# Desktop app calls:
GET https://your-domain.com/api/sender/queue
Headers:
  Authorization: Bearer sdr-uuid-here

# Response: Only leads assigned to this SDR
{
  "contacts": [
    {
      "contactId": "...",
      "phone": "+5511999999999",
      "nome": "João Silva",
      "empresa": "Empresa ABC",
      "message": "Personalized message..."
    }
  ],
  "count": 5
}
```

### Step 3: Mark as Sent
```python
# After sending via WhatsApp:
POST https://your-domain.com/api/sender/mark-sent
Headers:
  Authorization: Bearer sdr-uuid-here
Body:
{
  "contactId": "contact-uuid",
  "sentAt": "2025-01-15T10:30:00Z"
}
```

## 📋 API Endpoints for Desktop App

### 1. **SDR Authentication**
```
POST /api/sender/auth
Body: { "email": "...", "password": "..." }
Response: { "success": true, "token": "sdr-id", "sdr": {...} }
```

### 2. **Get Queue (SDR-specific)**
```
GET /api/sender/queue
Headers: Authorization: Bearer {sdr-id}
Response: { "contacts": [...], "count": N }
```
**Important:** Only returns leads where `assigned_sdr_id = sdr-id`

### 3. **Mark as Sent**
```
POST /api/sender/mark-sent
Headers: Authorization: Bearer {sdr-id}
Body: { "contactId": "...", "sentAt": "..." }
```

### 4. **Mark as Failed**
```
POST /api/sender/mark-failed
Headers: Authorization: Bearer {sdr-id}
Body: { "contactId": "...", "error": "..." }
```

## 🔧 Desktop App Implementation

### Python Example:

```python
import requests

class SDRClient:
    def __init__(self, base_url, email, password):
        self.base_url = base_url
        self.token = None
        self.sdr_id = None
        self.login(email, password)
    
    def login(self, email, password):
        """Login and get SDR token"""
        response = requests.post(
            f"{self.base_url}/api/sender/auth",
            json={"email": email, "password": password}
        )
        data = response.json()
        if data.get("success"):
            self.token = data["token"]  # This is the SDR ID
            self.sdr_id = data["sdr"]["id"]
            return True
        return False
    
    def get_queue(self, limit=50):
        """Get pending leads assigned to this SDR"""
        response = requests.get(
            f"{self.base_url}/api/sender/queue",
            headers={"Authorization": f"Bearer {self.token}"},
            params={"limit": limit}
        )
        return response.json()
    
    def mark_sent(self, contact_id, sent_at):
        """Mark lead as sent"""
        response = requests.post(
            f"{self.base_url}/api/sender/mark-sent",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"contactId": contact_id, "sentAt": sent_at}
        )
        return response.json()
    
    def mark_failed(self, contact_id, error):
        """Mark lead as failed"""
        response = requests.post(
            f"{self.base_url}/api/sender/mark-failed",
            headers={"Authorization": f"Bearer {self.token}"},
            json={"contactId": contact_id, "error": error}
        )
        return response.json()

# Usage:
client = SDRClient(
    base_url="https://your-domain.com",
    email="sdr@example.com",
    password="password123"
)

# Get leads assigned to this SDR
leads = client.get_queue()

# Send via WhatsApp (your implementation)
for lead in leads["contacts"]:
    # Your WhatsApp sending code here
    success = send_whatsapp(lead["phone"], lead["message"])
    
    if success:
        client.mark_sent(lead["contactId"], datetime.now().isoformat())
    else:
        client.mark_failed(lead["contactId"], "WhatsApp send failed")
```

## ✅ What's Ready

1. **Database Schema** ✅
   - `sdr_users` table
   - `assigned_sdr_id` on `campaign_contacts`
   - All indexes in place

2. **API Endpoints** ✅
   - `/api/sender/auth` - SDR login
   - `/api/sender/queue` - Get SDR's leads only
   - `/api/sender/mark-sent` - Mark sent (with ownership check)
   - `/api/sender/mark-failed` - Mark failed (with ownership check)

3. **Security** ✅
   - SDR can only see their assigned leads
   - SDR can only update their assigned leads
   - Backward compatible with service token

## 🚀 Next Steps

1. **Create SDR Users** (in Supabase or via Admin Dashboard)
2. **Assign Leads to SDRs** (via Admin Dashboard)
3. **Update Desktop App** to use new authentication
4. **Test** with one SDR first

## 🔗 Lead Generation Integration

Your lead generation integration is **already complete**:

### Endpoints Ready:
- ✅ `POST /api/integration/leads/receive` - Receive enriched leads
- ✅ `POST /api/integration/webhook` - Webhook events
- ✅ `GET /api/integration/status` - Health check

### Configuration:
1. **Set Integration Token** in `.env.local`:
   ```env
   LEAD_GEN_INTEGRATION_TOKEN=your_secure_token_here
   ```

2. **Configure Lead Gen Tool**:
   - **Endpoint**: `POST https://your-domain.com/api/integration/leads/receive`
   - **Auth**: `Authorization: Bearer {LEAD_GEN_INTEGRATION_TOKEN}`
   - **Body**: See `LEAD_GEN_INTEGRATION_GUIDE.md`

3. **Test Connection**:
   ```bash
   curl -X GET https://your-domain.com/api/integration/status \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## 📝 Complete Checklist

### Database ✅
- [x] `sdr_users` table exists
- [x] `assigned_sdr_id` on `campaign_contacts`
- [x] `assigned_sdr_id` on `campaigns`
- [x] All indexes created

### API Endpoints ✅
- [x] `/api/sender/auth` - SDR login
- [x] `/api/sender/queue` - SDR-specific queue
- [x] `/api/sender/mark-sent` - With ownership check
- [x] `/api/sender/mark-failed` - With ownership check
- [x] `/api/integration/leads/receive` - Lead gen integration
- [x] `/api/integration/webhook` - Webhook handler
- [x] `/api/integration/status` - Health check

### Environment Variables
- [ ] `LEAD_GEN_INTEGRATION_TOKEN` - For lead gen tool
- [ ] `SENDER_SERVICE_TOKEN` - For backward compatibility (optional)

### Desktop App (Your Implementation)
- [ ] Update to use `/api/sender/auth` for login
- [ ] Use SDR token (SDR ID) for all API calls
- [ ] Connect to WhatsApp (each SDR's own)
- [ ] Fetch only assigned leads
- [ ] Mark sent/failed after sending

---

**Everything is ready!** 🎉 

The database supports multi-tenant, the API endpoints are ready, and the lead generation integration is complete. You just need to update your desktop app to use the new authentication flow.
