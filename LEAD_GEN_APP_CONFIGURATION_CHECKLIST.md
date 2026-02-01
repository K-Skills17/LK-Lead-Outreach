# ✅ Lead Gen App Configuration Checklist

## 🎯 Complete Setup Guide for Your Lead Gen App

This checklist ensures your Lead Gen App is properly configured to send leads to LK Lead Outreach without errors.

---

## 🔐 1. Authentication Configuration

### ✅ Required Setup

**Get Integration Token:**
- Contact LK Lead Outreach administrator for `LEAD_GEN_INTEGRATION_TOKEN`
- Store token securely (environment variable, not in code)

**Configure API Endpoint:**
```
POST https://your-outreach-domain.com/api/integration/leads/receive
```

**Set Headers:**
```javascript
{
  'Authorization': 'Bearer YOUR_INTEGRATION_TOKEN',
  'Content-Type': 'application/json'
}
```

**✅ Test:** Verify authentication works before sending leads

---

## 📋 2. Required Fields (MUST BE PRESENT)

These fields are **mandatory** - leads will be rejected without them:

```json
{
  "nome": "João Silva",              // ✅ REQUIRED - Lead's full name
  "empresa": "Empresa ABC",           // ✅ REQUIRED - Company name
  "phone": "+5511999999999"           // ✅ REQUIRED - Phone in E.164 format
}
```

**⚠️ Important Notes:**
- `email` can be `null` or empty (we handle this)
- `nome` and `empresa` must be non-empty strings
- `phone` must be in E.164 format: `+[country code][number]`

---

## 🌍 3. Location Fields (CRITICAL - REQUIRED)

**Why:** These are **REQUIRED** to create campaigns. Campaigns will fail without location data.

**⚠️ IMPORTANT:** The database requires a `location` field. If you don't send it, we'll extract it from other fields, but it's best to send it directly.

**Priority Order (send at least one):**
```json
{
  "location": "São Paulo, Brasil",    // ✅ BEST - Full location string (used directly)
  "city": "São Paulo",                // ✅ GOOD - We'll use this if location is missing
  "state": "SP",                      // ✅ GOOD - We'll combine with city
  "country": "Brasil"                 // ✅ GOOD - We'll use as fallback
}
```

**✅ CRITICAL:** Always send at least one location field (`location`, `city`, `state`, or `country`)
**❌ If all are missing:** Campaign creation will fail with "null value in column 'location'"

---

## 🏷️ 4. Campaign Context Fields (CRITICAL - REQUIRED)

**Why:** These are **REQUIRED** for campaign creation. The `keyword` field is mandatory in the database.

**⚠️ IMPORTANT:** The database requires a `keyword` field. We extract it from `niche` or `campaign_name`, but it's best to send `niche` directly.

```json
{
  "niche": "Dentista",                // ✅ CRITICAL - Used for campaign keyword (REQUIRED)
  "campaign_name": "Q1 2025 Outreach", // ✅ RECOMMENDED - Campaign name (fallback for keyword)
  "location": "São Paulo, Brasil"     // ✅ CRITICAL - Campaign location (REQUIRED - see section 3)
}
```

**✅ CRITICAL:** Always send `niche` or `campaign_name` to avoid "null value in column 'keyword'" errors
**✅ CRITICAL:** Always send `location` (see section 3 above)

---

## 📞 5. Phone Number Format (CRITICAL)

**Format:** E.164 International Format

**✅ Correct Examples:**
```
+5511999999999    // Brazil mobile
+5511888888888    // Brazil mobile
+12125551234      // US number
+442071234567     // UK number
```

**❌ Incorrect Examples:**
```
11999999999       // Missing country code
(11) 99999-9999   // Contains formatting
+55 11 99999-9999 // Contains spaces
```

**✅ Validation in Your App:**
```javascript
// Ensure phone is in E.164 format
function normalizePhone(phone) {
  // Remove all non-digit characters except +
  phone = phone.replace(/[^\d+]/g, '');
  
  // If doesn't start with +, add country code
  if (!phone.startsWith('+')) {
    phone = '+55' + phone; // Adjust for your default country
  }
  
  return phone;
}
```

---

## 📧 6. Email Field Handling

**Important:** Email can be `null` or empty string - we handle this.

**✅ Send one of these:**
```json
{
  "email": "joao@empresa.com.br"  // ✅ Valid email
}
```

```json
{
  "email": null                   // ✅ Also valid - we handle null
}
```

```json
{
  "email": ""                     // ✅ Also valid - we handle empty
}
```

**✅ Recommendation:** Always try to include email, but don't fail if missing

---

## 🔄 7. Batch Processing Configuration

**Batch Size:** Recommended max 100 leads per request

**✅ Batch Format:**
```json
[
  { "nome": "Lead 1", "empresa": "Company 1", "phone": "+5511999999999" },
  { "nome": "Lead 2", "empresa": "Company 2", "phone": "+5511888888888" }
]
```

**✅ Benefits:**
- Faster processing
- Better error handling
- More efficient API usage

---

## ⚙️ 8. Error Handling Configuration

### ✅ Implement Retry Logic

```javascript
async function sendLeadWithRetry(leadData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      // Check if error is retryable
      if (response.status >= 500 && attempt < maxRetries) {
        // Server error - retry
        await sleep(1000 * attempt); // Exponential backoff
        continue;
      }
      
      // Client error - don't retry
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await sleep(1000 * attempt);
    }
  }
}
```

### ✅ Check Response Status

```javascript
const response = await fetch(API_URL, options);
const result = await response.json();

if (response.ok && result.success) {
  console.log(`✅ Success: ${result.results.created} created`);
} else {
  console.error(`❌ Error: ${result.error}`);
  console.error(`Details:`, result.results?.errors);
}
```

---

## 📊 9. Data Validation Before Sending

**✅ Validate in Your App Before Sending:**

```javascript
function validateLead(lead) {
  const errors = [];
  
  // Required fields
  if (!lead.nome || lead.nome.trim() === '') {
    errors.push('nome is required');
  }
  
  if (!lead.empresa || lead.empresa.trim() === '') {
    errors.push('empresa is required');
  }
  
  if (!lead.phone || !lead.phone.startsWith('+')) {
    errors.push('phone must be in E.164 format (e.g., +5511999999999)');
  }
  
  // Critical fields (will cause errors if missing)
  if (!lead.location && !lead.city && !lead.state && !lead.country) {
    errors.push('At least one location field is REQUIRED (location, city, state, or country)');
  }
  
  if (!lead.niche && !lead.campaign_name) {
    errors.push('niche or campaign_name is REQUIRED (for campaign keyword)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 🚀 10. Recommended Optional Fields

**Send these for better personalization and AI analysis:**

```json
{
  // Business Info
  "cargo": "CEO",
  "site": "https://empresa.com.br",
  "city": "São Paulo",
  "state": "SP",
  "country": "Brasil",
  
  // Enrichment
  "all_emails": ["email1@empresa.com", "email2@empresa.com"],
  "whatsapp": "+5511999999999",
  "marketing_tags": ["high-priority", "tech"],
  
  // Analysis
  "industry": "Technology",
  "company_size": "50-100",
  "revenue_range": "$1M-$5M",
  "pain_points": ["Sales Growth", "Digital Transformation"],
  "business_analysis": "Detailed analysis...",
  "enrichment_score": 85,
  "quality_score": 90,
  
  // Campaign Context
  "niche": "SaaS",
  "location": "São Paulo, Brasil",
  "campaign_name": "Q1 2025 Tech Outreach",
  
  // Workflow
  "send_email_first": true,
  "whatsapp_followup_delay_hours": 24
}
```

---

## ✅ 11. Pre-Send Checklist

Before sending each lead, verify:

**🔴 CRITICAL (Will cause errors if missing):**
- [ ] `nome` is present and non-empty
- [ ] `empresa` is present and non-empty
- [ ] `phone` is in E.164 format (starts with `+`)
- [ ] At least one location field (`location`, `city`, `state`, or `country`) - **REQUIRED**
- [ ] `niche` or `campaign_name` is provided - **REQUIRED** (for campaign keyword)

**🟡 IMPORTANT (Recommended for best results):**
- [ ] Integration token is set correctly
- [ ] API endpoint URL is correct
- [ ] Error handling is implemented
- [ ] Retry logic is configured
- [ ] Data validation is performed before sending

---

## 🔍 12. Testing Configuration

### ✅ Test Single Lead

```javascript
const testLead = {
  nome: "Test Lead",
  empresa: "Test Company",
  phone: "+5511999999999",
  email: "test@example.com",
  city: "São Paulo",
  state: "SP",
  country: "Brasil",
  niche: "Test",
  send_email_first: false  // Don't send email in test
};

const result = await sendLead(testLead);
console.log('Test result:', result);
```

### ✅ Test Connection

```bash
curl -X POST https://your-domain.com/api/integration/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 13. Complete Example Configuration

```javascript
// Configuration object for your Lead Gen App
const OUTREACH_CONFIG = {
  // API Settings
  apiUrl: 'https://your-outreach-domain.com/api/integration/leads/receive',
  integrationToken: process.env.LEAD_GEN_INTEGRATION_TOKEN,
  
  // Default Values
  defaults: {
    send_email_first: true,
    whatsapp_followup_delay_hours: 24,
    country: 'Brasil',  // Default country if not provided
  },
  
  // Validation
  requiredFields: ['nome', 'empresa', 'phone'],
  recommendedFields: ['location', 'city', 'niche', 'campaign_name'],
  
  // Batch Settings
  batchSize: 100,
  retryAttempts: 3,
  retryDelay: 1000, // milliseconds
};

// Send function with all validations
async function sendLeadToOutreach(leadData) {
  // 1. Validate required fields
  const validation = validateLead(leadData);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // 2. Normalize phone
  leadData.phone = normalizePhone(leadData.phone);
  
  // 3. Add defaults
  const enrichedLead = {
    ...OUTREACH_CONFIG.defaults,
    ...leadData,
    // Ensure location is set
    location: leadData.location || 
              `${leadData.city || ''}, ${leadData.state || ''}, ${leadData.country || OUTREACH_CONFIG.defaults.country}`.trim(),
  };
  
  // 4. Send with retry
  return await sendLeadWithRetry(enrichedLead, OUTREACH_CONFIG.retryAttempts);
}
```

---

## 🎯 14. Critical Success Factors

**🔴 MUST HAVE (Will fail without these):**
1. ✅ Correct authentication token
2. ✅ Required fields: `nome`, `empresa`, `phone`
3. ✅ Phone in E.164 format
4. ✅ **At least one location field** (`location`, `city`, `state`, or `country`) - **REQUIRED**
5. ✅ **`niche` or `campaign_name`** - **REQUIRED** (for campaign keyword)

**🟡 SHOULD HAVE (Recommended for reliability):**
1. ✅ `location` field (full string) for proper campaign creation
2. ✅ Error handling and retry logic
3. ✅ Data validation before sending
4. ✅ Proper error logging and monitoring

**✅ Nice to Have:**
1. ✅ All enrichment data (emails, tags, analysis)
2. ✅ Business analysis and scores
3. ✅ Report URLs and personalization data

---

## 🚨 Common Issues & Solutions

### Issue: "null value in column 'location' violates not-null constraint"
**Solution:** Always send at least one: `location`, `city`, `state`, or `country`

### Issue: "null value in column 'keyword' violates not-null constraint"
**Solution:** Always send `niche` or `campaign_name`

### Issue: "Invalid phone format"
**Solution:** Ensure phone is in E.164 format: `+[country][number]`

### Issue: "Validation error: nome is required"
**Solution:** Ensure `nome` is a non-empty string

### Issue: "Unauthorized"
**Solution:** Check that `LEAD_GEN_INTEGRATION_TOKEN` is correct and in Authorization header

---

## 📞 Support

If you encounter issues:
1. Check the API response error message
2. Verify all required fields are present
3. Ensure phone is in E.164 format
4. Check that location/niche fields are provided
5. Contact LK Lead Outreach support with error details

---

**Last Updated:** 2026-02-01  
**Version:** 2.0
