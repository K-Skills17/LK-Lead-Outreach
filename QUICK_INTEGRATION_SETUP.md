# ⚡ Quick Integration Setup

## 🎯 Two Tools, One Database, Seamless Integration

Your **Lead Generation Tool** and **LK Lead Outreach** now work together seamlessly!

## ✅ What's Been Created

### 1. API Endpoints for Lead Gen Tool

**Receive Enriched Leads:**
```
POST /api/integration/leads/receive
```

**Webhook Events (Real-time):**
```
POST /api/integration/webhook
```

**Status Check:**
```
GET /api/integration/status
```

### 2. Complete Workflow

```
Lead Gen Tool                    LK Lead Outreach
     │                                  │
     │ 1. Enrich Lead                   │
     │ 2. Analyze Business               │
     │ 3. Generate Report                │
     │                                  │
     ├─────────────────────────────────>│
     │  POST /api/integration/leads/    │
     │       receive                    │
     │                                  │
     │                                  │ 4. Send Email
     │                                  │ 5. Queue WhatsApp
     │                                  │
     │<─────────────────────────────────┤
     │  Webhook Events (optional)      │
```

## 🔐 Setup (2 Minutes)

### Step 1: Add Integration Token

Add to `.env.local`:

```env
LEAD_GEN_INTEGRATION_TOKEN=your_secure_random_token_here_min_32_chars
```

**Generate token:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Step 2: Configure Lead Gen Tool

In your Lead Gen Tool, set:

**API URL:**
```
https://your-domain.com/api/integration/leads/receive
```

**Auth Header:**
```
Authorization: Bearer YOUR_INTEGRATION_TOKEN
```

### Step 3: Send Enriched Lead

**Example Request:**
```json
{
  "nome": "João Silva",
  "empresa": "Empresa ABC",
  "email": "joao@empresaabc.com.br",
  "phone": "+5511999999999",
  "cargo": "CEO",
  "site": "https://empresaabc.com.br",
  "dor_especifica": "Necessita aumentar vendas em 30%",
  "business_analysis": "High potential lead...",
  "send_email_first": true,
  "whatsapp_followup_delay_hours": 24
}
```

## 🚀 What Happens Automatically

1. **Lead Gen Tool** sends enriched lead → API
2. **LK Lead Outreach** receives lead:
   - Creates/updates in database
   - Creates campaign if needed
   - **Sends email** (if `send_email_first: true`)
   - **Queues for WhatsApp** follow-up
3. **WhatsApp message** sent after delay (default: 24 hours)

## 📋 Integration Options

### Option 1: API Only (Simple)
- Lead Gen Tool calls API when lead is ready
- LK Lead Outreach handles everything
- ✅ Recommended for most cases

### Option 2: Webhooks (Real-time)
- Lead Gen Tool sends events as they happen
- More granular control
- ✅ Good for event-driven architecture

### Option 3: Hybrid (Best)
- API for initial lead transfer
- Webhooks for status updates
- ✅ Production-ready setup

## 📚 Full Documentation

See `LEAD_GEN_INTEGRATION_GUIDE.md` for:
- Complete API reference
- Webhook event types
- Code examples (Python, JavaScript)
- Error handling
- Testing guide

## ✅ Quick Test

```bash
curl -X POST http://localhost:3000/api/integration/leads/receive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Test Lead",
    "empresa": "Test Company",
    "email": "test@example.com",
    "phone": "+5511999999999",
    "send_email_first": false
  }'
```

## 🎯 Next Steps

1. ✅ Add `LEAD_GEN_INTEGRATION_TOKEN` to `.env.local`
2. ✅ Configure Lead Gen Tool to call API
3. ✅ Test with sample lead
4. ✅ Set up webhooks (optional)
5. ✅ Monitor integration

---

**That's it!** Your tools are now integrated! 🎉
