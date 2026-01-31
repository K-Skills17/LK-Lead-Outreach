# 🔗 Lead Generation Tool Integration Guide

## Overview

This guide explains how to integrate your **Lead Generation Tool** with **LK Lead Outreach** so they work seamlessly together.

## 🏗️ Architecture

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
     │  Webhook Events                  │
     │  (optional)                      │
```

## 🔐 Setup

### Step 1: Generate Integration Token

Add to `.env.local`:

```env
# Generate a secure random token (32+ characters)
LEAD_GEN_INTEGRATION_TOKEN=your_secure_random_token_here_min_32_chars
```

**Generate token:**
```powershell
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### Step 2: Configure Lead Gen Tool

In your Lead Gen Tool, set:

**API Endpoint:**
```
POST https://your-domain.com/api/integration/leads/receive
```

**Webhook Endpoint (optional):**
```
POST https://your-domain.com/api/integration/webhook
```

**Authentication:**
```
Authorization: Bearer YOUR_INTEGRATION_TOKEN
```

## 📡 API Endpoints

### 1. Receive Enriched Leads

**Endpoint:** `POST /api/integration/leads/receive`

**Purpose:** Send enriched leads from Lead Gen Tool to LK Lead Outreach

**Request:**
```json
{
  "nome": "João Silva",
  "empresa": "Empresa ABC",
  "email": "joao@empresaabc.com.br",
  "phone": "+5511999999999",
  "cargo": "CEO",
  "site": "https://empresaabc.com.br",
  "dor_especifica": "Necessita aumentar vendas em 30%",
  "industry": "Technology",
  "company_size": "50-100",
  "revenue_range": "$1M-$5M",
  "pain_points": ["Sales", "Growth"],
  "business_analysis": "Company shows strong growth potential...",
  "enrichment_score": 85,
  "source": "LinkedIn",
  "campaign_name": "Q1 2025 Outreach",
  "tags": ["high-priority", "tech"],
  "send_email_first": true,
  "email_template": "custom_template",
  "whatsapp_followup_delay_hours": 24
}
```

**Batch Request (multiple leads):**
```json
[
  { "nome": "João Silva", ... },
  { "nome": "Maria Santos", ... }
]
```

**Response:**
```json
{
  "success": true,
  "results": {
    "processed": 2,
    "created": 2,
    "updated": 0,
    "emails_sent": 2,
    "errors": []
  },
  "message": "Processed 2 leads"
}
```

### 2. Webhook Events (Real-time Updates)

**Endpoint:** `POST /api/integration/webhook`

**Purpose:** Receive real-time events from Lead Gen Tool

**Event Types:**

#### `lead.enriched`
```json
{
  "event_type": "lead.enriched",
  "lead_id": "lead-123",
  "data": {
    "nome": "João Silva",
    "empresa": "Empresa ABC",
    "email": "joao@empresaabc.com.br",
    "phone": "+5511999999999",
    "cargo": "CEO",
    "site": "https://empresaabc.com.br",
    "dor_especifica": "Necessita aumentar vendas"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

#### `lead.analyzed`
```json
{
  "event_type": "lead.analyzed",
  "lead_id": "lead-123",
  "data": {
    "phone": "+5511999999999",
    "business_analysis": "Detailed analysis...",
    "analysis_summary": "High potential lead..."
  }
}
```

#### `lead.report_ready`
```json
{
  "event_type": "lead.report_ready",
  "lead_id": "lead-123",
  "data": {
    "phone": "+5511999999999",
    "report_url": "https://reports.example.com/lead-123.pdf"
  }
}
```

#### `lead.email_sent`
```json
{
  "event_type": "lead.email_sent",
  "data": {
    "phone": "+5511999999999",
    "email": "joao@empresaabc.com.br",
    "email_id": "email-456"
  }
}
```

#### `campaign.completed`
```json
{
  "event_type": "campaign.completed",
  "data": {
    "campaign_id": "campaign-789",
    "total_leads": 150,
    "enriched_leads": 145
  }
}
```

### 3. Status Check

**Endpoint:** `GET /api/integration/status`

**Purpose:** Health check and statistics

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "statistics": {
    "campaigns": 5,
    "total_leads": 150,
    "pending_leads": 45,
    "sent_leads": 105
  },
  "integration": {
    "enabled": true,
    "endpoints": {
      "receive_leads": "/api/integration/leads/receive",
      "webhook": "/api/integration/webhook",
      "status": "/api/integration/status"
    }
  }
}
```

## 🔄 Workflow

### Complete Integration Flow

```
1. Lead Gen Tool enriches lead
   ↓
2. POST /api/integration/leads/receive
   ↓
3. LK Lead Outreach:
   - Creates/updates lead in database
   - Creates campaign if needed
   - Sends initial email (if send_email_first = true)
   - Queues for WhatsApp follow-up
   ↓
4. (Optional) Webhook: lead.enriched
   ↓
5. Lead Gen Tool continues analysis
   ↓
6. (Optional) Webhook: lead.analyzed
   ↓
7. LK Lead Outreach updates lead with analysis
   ↓
8. WhatsApp follow-up sent (after delay)
```

## 📋 Integration Options

### Option 1: API Only (Recommended)

**When to use:** Simple integration, batch processing

**How:**
- Lead Gen Tool calls `/api/integration/leads/receive` when lead is ready
- Can send single lead or batch
- LK Lead Outreach handles everything

**Pros:**
- Simple
- Reliable
- Easy to debug

### Option 2: Webhook Events

**When to use:** Real-time updates, event-driven architecture

**How:**
- Lead Gen Tool sends webhook events as things happen
- LK Lead Outreach reacts to events
- More granular control

**Pros:**
- Real-time
- Event-driven
- More flexible

### Option 3: Hybrid (Best)

**When to use:** Production setup

**How:**
- Use API for initial lead transfer
- Use webhooks for status updates and analysis results

**Pros:**
- Best of both worlds
- Reliable + real-time

## 🔧 Implementation in Lead Gen Tool

### Python Example

```python
import requests
import os

INTEGRATION_TOKEN = os.getenv('LEAD_GEN_INTEGRATION_TOKEN')
OUTREACH_API_URL = 'https://your-domain.com/api/integration/leads/receive'

def send_enriched_lead(lead_data):
    """Send enriched lead to LK Lead Outreach"""
    headers = {
        'Authorization': f'Bearer {INTEGRATION_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(
        OUTREACH_API_URL,
        json=lead_data,
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Lead sent: {result['results']['created']} created")
        return result
    else:
        print(f"❌ Error: {response.text}")
        return None

# Example usage
lead = {
    "nome": "João Silva",
    "empresa": "Empresa ABC",
    "email": "joao@empresaabc.com.br",
    "phone": "+5511999999999",
    "cargo": "CEO",
    "site": "https://empresaabc.com.br",
    "dor_especifica": "Necessita aumentar vendas",
    "business_analysis": "High potential lead...",
    "send_email_first": True,
    "whatsapp_followup_delay_hours": 24
}

send_enriched_lead(lead)
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const INTEGRATION_TOKEN = process.env.LEAD_GEN_INTEGRATION_TOKEN;
const OUTREACH_API_URL = 'https://your-domain.com/api/integration/leads/receive';

async function sendEnrichedLead(leadData) {
  try {
    const response = await axios.post(
      OUTREACH_API_URL,
      leadData,
      {
        headers: {
          'Authorization': `Bearer ${INTEGRATION_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Lead sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
const lead = {
  nome: "João Silva",
  empresa: "Empresa ABC",
  email: "joao@empresaabc.com.br",
  phone: "+5511999999999",
  cargo: "CEO",
  site: "https://empresaabc.com.br",
  dor_especifica: "Necessita aumentar vendas",
  business_analysis: "High potential lead...",
  send_email_first: true,
  whatsapp_followup_delay_hours: 24
};

sendEnrichedLead(lead);
```

## ✅ Testing

### Test API Endpoint

```bash
curl -X POST https://your-domain.com/api/integration/leads/receive \
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

### Test Webhook

```bash
curl -X POST https://your-domain.com/api/integration/webhook \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "lead.enriched",
    "data": {
      "nome": "Test Lead",
      "empresa": "Test Company",
      "phone": "+5511999999999"
    }
  }'
```

## 🔒 Security

1. **Always use HTTPS** in production
2. **Keep integration token secret** - never commit to Git
3. **Rotate tokens** periodically
4. **Validate input** on both sides
5. **Rate limiting** (implement if needed)

## 📊 Monitoring

Check integration status:

```bash
curl https://your-domain.com/api/integration/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Next Steps

1. ✅ Add `LEAD_GEN_INTEGRATION_TOKEN` to `.env.local`
2. ✅ Configure Lead Gen Tool to call API
3. ✅ Test with sample lead
4. ✅ Set up webhooks (optional)
5. ✅ Monitor integration status

## 💡 Tips

- **Batch processing**: Send multiple leads in one request for efficiency
- **Error handling**: Check response status and handle errors gracefully
- **Retry logic**: Implement retry for failed requests
- **Logging**: Log all integration events for debugging

---

**Need help?** Check the API responses for error details!
