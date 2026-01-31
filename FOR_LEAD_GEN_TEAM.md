# 📋 Information for Lead Generation Tool Team

## ✅ Integration Ready!

Your LK Lead Outreach tool is now fully configured to receive **all data** from your Lead Generation Tool.

---

## 🔗 Connection Details

### **API Endpoint**
```
POST https://your-outreach-domain.com/api/integration/leads/receive
```

### **Authentication**
```
Authorization: Bearer {LEAD_GEN_INTEGRATION_TOKEN}
```

**Get Token:** Contact the LK Lead Outreach administrator for the integration token.

---

## 📦 What Data We Accept

We now accept **ALL** the data your tool sends:

✅ **Business Information**
- Name, company, email, phone
- Address, city, state, country, zip code
- Job title, website

✅ **Enrichment Data**
- All emails (array)
- WhatsApp number
- Contact names (array)
- Marketing tags (array)

✅ **Analysis Data**
- Industry, company size, revenue range
- Pain points (array)
- Business analysis (full text)
- Competitor analysis
- Quality scores (enrichment_score, quality_score, fit_score)

✅ **Reports & Personalization**
- Report URLs
- Landing page URLs
- Personalization data (any structure)

✅ **Outreach History**
- Previous emails sent
- Previous WhatsApp messages

✅ **Campaign Context**
- Campaign name, ID
- Niche, location
- Campaign settings

---

## 🚀 Integration Methods

### **Option 1: Direct API Call (Recommended)**

Your tool can call our API directly when leads are ready:

```javascript
const response = await fetch('https://your-outreach-domain.com/api/integration/leads/receive', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LEAD_GEN_INTEGRATION_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(leadData) // Single lead or array for batch
});
```

### **Option 2: Webhook**

If your tool supports webhooks, configure:

**Webhook URL:** `https://your-outreach-domain.com/api/integration/webhook`  
**Event Type:** `lead.enriched`  
**Format:** See `LEAD_GEN_TOOL_INTEGRATION_SPEC.md`

---

## 📝 Complete Data Format

See the full specification in: **`LEAD_GEN_TOOL_INTEGRATION_SPEC.md`**

This document includes:
- Complete field list
- Data format examples
- Batch processing
- Error handling
- Testing instructions

---

## ⚙️ Workflow Options

Your tool can control how leads are processed:

```json
{
  "send_email_first": true,              // Send email immediately
  "whatsapp_followup_delay_hours": 24,   // Hours before WhatsApp
  "auto_assign_sdr": true,               // Auto-assign to SDR
  "sdr_email": "sdr@example.com"          // SDR email for assignment
}
```

---

## 🧪 Testing

### **Test Connection**
```bash
curl -X POST https://your-outreach-domain.com/api/integration/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Test Single Lead**
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

## 📋 Required Fields

**Minimum required:**
- `nome` - Lead name
- `empresa` - Company name
- `email` - Primary email
- `phone` - Phone in E.164 format (e.g., `+5511999999999`)

**All other fields are optional** but recommended for better personalization.

---

## ⚠️ Important Notes

1. **Phone Format:** Must be E.164 format (`+5511999999999`)
2. **Batch Size:** Recommended max 100 leads per batch
3. **Idempotency:** Sending the same lead multiple times will update it (based on phone number)
4. **All Data Stored:** We store everything you send in our `enrichment_data` JSONB field

---

## 📞 Next Steps

1. **Get Integration Token** from LK Lead Outreach administrator
2. **Review Specification** in `LEAD_GEN_TOOL_INTEGRATION_SPEC.md`
3. **Test Connection** using the test endpoint
4. **Send Test Lead** to verify data format
5. **Enable Auto-send** in your tool when leads are ready

---

## 📚 Documentation Files

- **`LEAD_GEN_TOOL_INTEGRATION_SPEC.md`** - Complete API specification
- **`LEAD_GEN_INTEGRATION_GUIDE.md`** - General integration guide
- **`ENV_LOCAL_COMPLETE_GUIDE.md`** - Environment variables guide

---

**Status:** ✅ Ready for Integration  
**Last Updated:** 2025-01-15
