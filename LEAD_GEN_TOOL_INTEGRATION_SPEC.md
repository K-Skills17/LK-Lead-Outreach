# 🔗 Lead Generation Tool → LK Lead Outreach Integration Specification

## 📋 Overview

This document specifies exactly what data your Lead Generation Tool should send to LK Lead Outreach and how to configure the integration.

---

## 🔐 Authentication

**Method:** Bearer Token  
**Header:** `Authorization: Bearer {LEAD_GEN_INTEGRATION_TOKEN}`

**Get Token:**
- Ask your LK Lead Outreach administrator for the `LEAD_GEN_INTEGRATION_TOKEN`
- This token must be kept secret and never exposed publicly

---

## 📡 API Endpoint

**URL:** `https://your-outreach-domain.com/api/integration/leads/receive`  
**Method:** `POST`  
**Content-Type:** `application/json`

---

## 📦 Data Format

### Single Lead
Send a single JSON object.

### Batch (Multiple Leads)
Send an array of JSON objects. All leads in the batch will be processed.

---

## 📊 Complete Data Schema

Your Lead Gen Tool should send **all available data** for each lead. The following fields are supported:

### **Required Fields** (Must be present)
```json
{
  "nome": "João Silva",              // Lead's name (required)
  "empresa": "Empresa ABC",           // Company name (required)
  "email": "joao@empresaabc.com.br", // Primary email (required)
  "phone": "+5511999999999"          // Phone number in E.164 format (required)
}
```

### **Business Information** (Optional but recommended)
```json
{
  "cargo": "CEO",                     // Job title/position
  "site": "https://empresaabc.com.br", // Company website
  "address": "Rua Example, 123",      // Business address
  "city": "São Paulo",                // City
  "state": "SP",                      // State/Province
  "country": "Brasil",                // Country
  "zip_code": "01234-567"            // Postal code
}
```

### **Enrichment Data** (All emails, contacts, tags)
```json
{
  "all_emails": [                     // Array of all found emails
    "joao@empresaabc.com.br",
    "contato@empresaabc.com.br",
    "vendas@empresaabc.com.br"
  ],
  "whatsapp": "+5511999999999",      // WhatsApp number (if different from phone)
  "contact_names": [                 // Array of contact names found
    "João Silva",
    "Maria Santos"
  ],
  "marketing_tags": [                // Marketing/segmentation tags
    "high-priority",
    "tech",
    "enterprise"
  ]
}
```

### **Analysis Data** (Quality scores, pain points, competitor analysis)
```json
{
  "industry": "Technology",          // Industry classification
  "company_size": "50-100",          // Company size range
  "revenue_range": "$1M-$5M",        // Revenue range
  "pain_points": [                   // Array of identified pain points
    "Sales Growth",
    "Customer Retention",
    "Digital Transformation"
  ],
  "business_analysis": "Detailed analysis of the company...", // Full analysis text
  "competitor_analysis": "Competitors include...",           // Competitor info
  "enrichment_score": 85,            // Quality score (0-100)
  "quality_score": 90,               // Overall lead quality (0-100)
  "fit_score": 88                    // Product fit score (0-100)
}
```

### **Reports & Personalization** (Report URLs, landing pages)
```json
{
  "report_url": "https://reports.example.com/lead-123.pdf", // Generated report URL
  "landing_page_url": "https://example.com/landing/lead-123", // Custom landing page
  "personalization_data": {          // Additional personalization data
    "key_insights": ["...", "..."],
    "recommendations": ["...", "..."]
  }
}
```

### **Outreach History** (Previous emails and WhatsApp messages)
```json
{
  "outreach_history": {              // History of previous outreach
    "emails_sent": [
      {
        "sent_at": "2025-01-15T10:30:00Z",
        "subject": "Introduction",
        "status": "opened"
      }
    ],
    "whatsapp_messages": [
      {
        "sent_at": "2025-01-15T11:00:00Z",
        "message": "Hello...",
        "status": "delivered"
      }
    ]
  }
}
```

### **Campaign Context** (Niche, location, campaign settings)
```json
{
  "campaign_name": "Q1 2025 Tech Outreach", // Campaign name
  "campaign_id": "campaign-123",           // Campaign ID (if applicable)
  "niche": "SaaS",                         // Target niche
  "location": "São Paulo, Brasil",        // Target location
  "campaign_settings": {                   // Campaign-specific settings
    "target_industry": "Technology",
    "min_company_size": 50,
    "priority": "high"
  }
}
```

### **Workflow Options** (Control how the lead is processed)
```json
{
  "send_email_first": true,              // Send email immediately (default: true)
  "email_template": "custom_template",   // Email template name
  "whatsapp_followup_delay_hours": 24,   // Hours to wait before WhatsApp (default: 24)
  "auto_assign_sdr": false,              // Auto-assign to SDR (default: false)
  "sdr_email": "sdr@example.com"         // SDR email if auto-assigning
}
```

### **Metadata** (Source, tags, timestamps)
```json
{
  "source": "LinkedIn",                  // Lead source
  "tags": ["high-priority", "tech"],     // Tags for filtering
  "created_at": "2025-01-15T10:30:00Z",  // When lead was created
  "enriched_at": "2025-01-15T11:00:00Z", // When enrichment completed
  "lead_id": "lead-123"                  // Your internal lead ID
}
```

---

## 📝 Complete Example Request

```json
{
  // Required
  "nome": "João Silva",
  "empresa": "Empresa ABC",
  "email": "joao@empresaabc.com.br",
  "phone": "+5511999999999",
  
  // Business Info
  "cargo": "CEO",
  "site": "https://empresaabc.com.br",
  "address": "Av. Paulista, 1000",
  "city": "São Paulo",
  "state": "SP",
  "country": "Brasil",
  
  // Enrichment
  "all_emails": [
    "joao@empresaabc.com.br",
    "contato@empresaabc.com.br"
  ],
  "whatsapp": "+5511999999999",
  "contact_names": ["João Silva", "Maria Santos"],
  "marketing_tags": ["high-priority", "tech"],
  
  // Analysis
  "industry": "Technology",
  "company_size": "50-100",
  "revenue_range": "$1M-$5M",
  "pain_points": ["Sales Growth", "Digital Transformation"],
  "business_analysis": "Company shows strong growth potential...",
  "competitor_analysis": "Main competitors are...",
  "enrichment_score": 85,
  "quality_score": 90,
  "fit_score": 88,
  
  // Reports
  "report_url": "https://reports.example.com/lead-123.pdf",
  "landing_page_url": "https://example.com/landing/lead-123",
  "personalization_data": {
    "key_insights": ["Strong growth", "Tech-focused"],
    "recommendations": ["SaaS solution", "Digital tools"]
  },
  
  // Campaign
  "campaign_name": "Q1 2025 Tech Outreach",
  "campaign_id": "campaign-123",
  "niche": "SaaS",
  "location": "São Paulo, Brasil",
  
  // Workflow
  "send_email_first": true,
  "whatsapp_followup_delay_hours": 24,
  
  // Metadata
  "source": "LinkedIn",
  "tags": ["high-priority", "tech"],
  "lead_id": "lead-123"
}
```

---

## 🔄 Batch Request Example

Send multiple leads in one request:

```json
[
  {
    "nome": "João Silva",
    "empresa": "Empresa ABC",
    "email": "joao@empresaabc.com.br",
    "phone": "+5511999999999",
    // ... all other fields
  },
  {
    "nome": "Maria Santos",
    "empresa": "Empresa XYZ",
    "email": "maria@empresaxyz.com.br",
    "phone": "+5511888888888",
    // ... all other fields
  }
]
```

---

## ✅ Response Format

### Success Response
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

### Error Response
```json
{
  "success": false,
  "error": "Validation error: email is required",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

---

## 🔧 Integration Methods

### Option 1: Webhook (Recommended for Real-time)

If your Lead Gen Tool supports webhooks, configure:

**Webhook URL:** `https://your-outreach-domain.com/api/integration/webhook`  
**Method:** `POST`  
**Headers:**
```
Authorization: Bearer {LEAD_GEN_INTEGRATION_TOKEN}
Content-Type: application/json
```

**Webhook Event Format:**
```json
{
  "event_type": "lead.enriched",
  "lead_id": "lead-123",
  "data": {
    // All lead data (same format as above)
    "nome": "João Silva",
    "empresa": "Empresa ABC",
    // ... etc
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Option 2: Direct API Call (Recommended for Batch)

Call the API endpoint directly when leads are ready:

```javascript
const response = await fetch('https://your-outreach-domain.com/api/integration/leads/receive', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LEAD_GEN_INTEGRATION_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(leadData) // or array for batch
});
```

### Option 3: Auto-send Hook

If your Lead Gen Tool has an auto-send feature, configure it to call our API when:
- Lead enrichment is complete
- Business analysis is done
- Report is generated

---

## 🧪 Testing

### Test Connection
```bash
curl -X POST https://your-outreach-domain.com/api/integration/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Single Lead
```bash
curl -X POST https://your-outreach-domain.com/api/integration/leads/receive \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Test Lead",
    "empresa": "Test Company",
    "email": "test@example.com",
    "phone": "+5511999999999"
  }'
```

---

## 📋 Field Mapping Reference

| Your Field Name | Our Field Name | Notes |
|----------------|----------------|-------|
| `nome` | `nome` | Lead name |
| `empresa` | `empresa` | Company name |
| `email` | `email` | Primary email |
| `phone` | `phone` | E.164 format required |
| `cargo` | `cargo` | Job title |
| `site` | `site` | Website URL |
| `all_emails` | Stored in `enrichment_data` | Array of emails |
| `whatsapp` | Stored in `enrichment_data` | WhatsApp number |
| `contact_names` | Stored in `enrichment_data` | Array of names |
| `marketing_tags` | `tags` | Array of tags |
| `pain_points` | `pain_points` | Array of pain points |
| `business_analysis` | `personalized_message` + `enrichment_data` | Analysis text |
| `report_url` | `report_url` | Report URL |
| `enrichment_score` | `enrichment_score` | 0-100 score |
| `campaign_name` | `campaign_name` | Campaign name |

---

## ⚠️ Important Notes

1. **Phone Format:** Must be in E.164 format (e.g., `+5511999999999`)
2. **Batch Size:** Recommended max 100 leads per batch
3. **Rate Limiting:** No rate limits currently, but be reasonable
4. **Idempotency:** Sending the same lead multiple times will update it (based on phone number)
5. **Required Fields:** `nome`, `empresa`, `email`, `phone` are required
6. **Optional Fields:** All other fields are optional but recommended for better personalization

---

## 🚀 Next Steps

1. **Get Integration Token:** Contact LK Lead Outreach administrator
2. **Test Connection:** Use the test endpoint
3. **Send Test Lead:** Send one lead to verify format
4. **Enable Auto-send:** Configure your tool to auto-send when ready
5. **Monitor:** Check response codes and error messages

---

## 📞 Support

If you encounter issues:
1. Check the response error message
2. Verify the integration token is correct
3. Ensure required fields are present
4. Check phone number format (E.164)
5. Contact LK Lead Outreach support

---

**Last Updated:** 2025-01-15  
**Version:** 1.0
