# 📋 Lead Generation Tool - Complete Integration Specification

## 🎯 Overview

This document specifies **exactly** what your Lead Generation Tool must send to the Outreach Tool for successful integration. Use this as a checklist to verify your implementation.

---

## 🔌 API Endpoint

### Endpoint Details

**URL**: `https://your-outreach-tool-domain.com/api/integration/leads/receive`

**Method**: `POST`

**Content-Type**: `application/json`

**Authentication**: Bearer Token (Required)

```
Authorization: Bearer {LEAD_GEN_INTEGRATION_TOKEN}
```

**Note**: The `LEAD_GEN_INTEGRATION_TOKEN` must be configured in the Outreach Tool's environment variables.

---

## ✅ Required Fields (MUST HAVE)

These fields are **mandatory** and the request will fail if missing:

### Top-Level Required Fields

```json
{
  "empresa": "Silva Marketing",        // ✅ REQUIRED - Company/Business name (non-empty string)
  "phone": "+5511999999999"           // ✅ REQUIRED - Phone in E.164 format (must start with +)
}
```

**Validation Rules**:
- `empresa`: Must be a non-empty string (minimum 1 character)
- `phone`: Must be a non-empty string starting with `+` (E.164 format)

---

## 📦 Complete Payload Structure

### Minimal Valid Payload (Required Only)

```json
{
  "empresa": "Silva Marketing",
  "phone": "+5511999999999"
}
```

### Recommended Payload (With Common Fields)

```json
{
  "nome": "João Silva",                    // Contact name (optional, falls back to empresa)
  "empresa": "Silva Marketing",             // ✅ REQUIRED
  "phone": "+5511999999999",                // ✅ REQUIRED
  "email": "contato@silvamarketing.com",   // Optional but recommended
  "location": "São Paulo, SP, Brasil",     // Optional but recommended
  "city": "São Paulo",                      // Optional
  "state": "SP",                            // Optional
  "country": "Brasil",                      // Optional
  "niche": "marketing agency",              // Optional
  "campaign_name": "Q1 2024 Agency Outreach" // Optional (creates/uses campaign)
}
```

### Complete Payload (Full Structure)

```json
{
  // ✅ REQUIRED FIELDS
  "empresa": "Silva Marketing",
  "phone": "+5511999999999",
  
  // 📍 LOCATION (Recommended)
  "location": "São Paulo, SP, Brasil",
  "city": "São Paulo",
  "state": "SP",
  "country": "Brasil",
  
  // 👤 CONTACT INFO (Recommended)
  "nome": "João Silva",
  "email": "contato@silvamarketing.com",
  
  // 🎯 CAMPAIGN CONTEXT (Optional)
  "niche": "marketing agency",
  "campaign_name": "Q1 2024 Agency Outreach",
  
  // 📊 COMPLETE ENRICHMENT DATA (Optional but Recommended)
  "enrichment_data": {
    "lead": {
      "id": "uuid-from-lead-gen-tool",
      "campaign_id": "uuid-from-lead-gen-tool",
      "business_name": "Silva Marketing",
      "full_address": "Rua Example, 123, São Paulo, SP, 01234-567",
      "street": "Rua Example",
      "city": "São Paulo",
      "state": "SP",
      "postal_code": "01234-567",
      "country_code": "BR",
      "latitude": -23.5505,
      "longitude": -46.6333,
      "website": "https://silvamarketing.com",
      "domain": "silvamarketing.com",
      "rating": 4.5,
      "reviews": 127,
      "verified": true,
      "rank": 3,
      "google_id": "ChIJ...",
      "place_id": "ChIJ...",
      "type": "Marketing Agency",
      "category": "Digital Marketing",
      "description": "Full-service digital marketing agency...",
      "logo_url": "https://...",
      "owner_title": "CEO",
      "status": "enriched",
      "source": "outscraper",
      "emails": ["contato@silvamarketing.com", "info@silvamarketing.com"],
      "best_email": "contato@silvamarketing.com",
      "whatsapp_status": "verified",
      "whatsapp_sequence_step": null,
      "business_quality_score": 85,
      "business_quality_tier": "TIER1",
      "is_icp": true,
      "segment": "VIP",
      "failure_reason": null,
      "niche": "marketing agency",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    },
    "enrichment": {
      "id": "uuid-here",
      "lead_id": "uuid-here",
      "emails": ["contato@silvamarketing.com", "info@silvamarketing.com"],
      "best_email": "contato@silvamarketing.com",
      "whatsapp_phone": {
        "number": "+5511999999999",
        "verified": true,
        "country_code": "BR"
      },
      "contact_name": "João Silva",
      "found_on_page": "/contact",
      "has_contact_page": true,
      "has_booking_system": true,
      "marketing_tags": {
        "google_ads": true,
        "facebook_ads": true,
        "instagram": true,
        "linkedin": false
      },
      "created_at": "2024-01-15T10:35:00Z"
    },
    "analysis": {
      "id": "uuid-here",
      "lead_id": "uuid-here",
      "competitor_count": 12,
      "business_score": 78,
      "business_tier": "TIER1",
      "pain_points": [
        "Low online visibility",
        "No social media presence",
        "Outdated website"
      ],
      "opportunities": [
        "SEO optimization",
        "Social media marketing",
        "Website redesign"
      ],
      "seo_score": 45,
      "page_score": 62,
      "social_presence_score": 30,
      "online_reputation_score": 75
    },
    "competitors": [
      {
        "id": "uuid-here",
        "lead_id": "uuid-here",
        "competitor_name": "Competitor Agency",
        "competitor_website": "https://competitor.com",
        "competitor_rank": 1,
        "competitor_rating": 4.8,
        "competitor_reviews": 250,
        "gap_analysis": "Competitor has better SEO and social presence",
        "created_at": "2024-01-15T11:00:00Z"
      }
    ],
    "competitor_analysis": [
      {
        "id": "uuid-here",
        "lead_id": "uuid-here",
        "campaign_id": "uuid-here",
        "competitor_name": "Top Competitor",
        "competitor_website": "https://topcompetitor.com",
        "competitor_rank": 1,
        "competitor_rating": 4.9,
        "competitor_reviews": 500,
        "gap_analysis": "AI-generated analysis of competitive gaps",
        "created_at": "2024-01-15T11:05:00Z"
      }
    ],
    "reports": {
      "id": "uuid-here",
      "lead_id": "uuid-here",
      "pdf_url": "https://drive.google.com/file/...",
      "drive_url": "https://drive.google.com/file/...",
      "mockup_url": "https://...",
      "ai_analysis": {
        "summary": "Full AI analysis JSON",
        "strengths": [...],
        "weaknesses": [...],
        "recommendations": [...]
      },
      "ai_email_intro": "Personalized email introduction generated by AI",
      "ai_email_cta": "Personalized call-to-action generated by AI",
      "pain_points": [
        "Low online visibility",
        "No social media presence"
      ],
      "subject_line": "Silva Marketing - Análise Gratuita de Presença Digital",
      "subject_line_score": 85,
      "personalization_score": 92,
      "send_time_scheduled": "2024-01-20T09:00:00Z",
      "send_time_reason": "Optimal send time based on niche analytics",
      "generated_at": "2024-01-15T12:00:00Z"
    },
    "landing_page": {
      "id": "uuid-here",
      "lead_id": "uuid-here",
      "analysis_image_url": "https://leonardo.ai/...",
      "analysis_image_generation_id": "gen-id-here",
      "created_at": "2024-01-15T12:05:00Z",
      "updated_at": "2024-01-15T12:05:00Z"
    },
    "outreach_history": {
      "email": [
        {
          "id": "uuid-here",
          "lead_id": "uuid-here",
          "email_to": "contato@silvamarketing.com",
          "subject": "Silva Marketing - Análise Gratuita",
          "status": "sent",
          "sent_at": "2024-01-16T09:00:00Z",
          "opened_at": "2024-01-16T10:30:00Z",
          "clicked_at": "2024-01-16T10:35:00Z",
          "open_count": 3,
          "click_count": 1
        }
      ],
      "whatsapp": [
        {
          "id": "uuid-here",
          "lead_id": "uuid-here",
          "message_type": "first_followup",
          "status": "delivered",
          "sent_at": "2024-01-16T14:00:00Z",
          "delivered_at": "2024-01-16T14:00:05Z",
          "read_at": "2024-01-16T14:30:00Z"
        }
      ]
    },
    "responses": [
      {
        "id": "uuid-here",
        "lead_id": "uuid-here",
        "campaign_id": "uuid-here",
        "channel": "email",
        "response_text": "Interested in learning more...",
        "sentiment_score": 8,
        "sentiment_label": "hot",
        "engagement_type": "reply",
        "responded_at": "2024-01-17T08:00:00Z"
      }
    ],
    "conversions": [
      {
        "id": "uuid-here",
        "lead_id": "uuid-here",
        "campaign_id": "uuid-here",
        "conversion_channel": "email",
        "conversion_type": "meeting_booked",
        "conversion_value": 5000.00,
        "converted_at": "2024-01-18T10:00:00Z"
      }
    ],
    "send_time_analytics": [
      {
        "id": "uuid-here",
        "campaign_id": "uuid-here",
        "lead_id": "uuid-here",
        "niche": "marketing agency",
        "sent_at": "2024-01-16T09:00:00Z",
        "opened_at": "2024-01-16T10:30:00Z",
        "day_of_week": 1,
        "hour_of_day": 9,
        "time_to_open_minutes": 90
      }
    ],
    "calendar_bookings": [
      {
        "id": "uuid-here",
        "lead_id": "uuid-here",
        "campaign_id": "uuid-here",
        "booking_status": "booked",
        "booked_at": "2024-01-18T10:00:00Z",
        "meeting_start": "2024-01-25T14:00:00Z",
        "meeting_end": "2024-01-25T14:30:00Z"
      }
    ],
    "campaign": {
      "id": "uuid-here",
      "name": "Q1 2024 Agency Outreach",
      "keyword": "marketing agency, digital marketing",
      "location": "São Paulo, SP",
      "niche": "marketing agency",
      "country_code": "BR",
      "max_results": 500,
      "status": "completed",
      "total_scraped": 450,
      "total_enriched": 420,
      "total_analyzed": 400,
      "total_reported": 380,
      "total_emailed": 350
    },
    "metadata": {
      "exported_at": "2024-01-20T15:00:00Z",
      "exported_by": "lead-gen-engine",
      "version": "2.0",
      "includes_all_data": true
    }
  },
  
  // 📄 REPORT URLS (Optional)
  "report_url": "https://drive.google.com/file/...",
  "analysis_image_url": "https://leonardo.ai/...",
  
  // 👤 AUTO-ASSIGNMENT (Optional)
  "auto_assign_sdr": false,
  "sdr_email": "sdr@company.com"
}
```

---

## 📋 Field Specifications

### Required Fields

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `empresa` | string | min 1 char | Company/Business name |
| `phone` | string | starts with `+` | Phone in E.164 format |

### Recommended Fields

| Field | Type | Description |
|-------|------|-------------|
| `nome` | string | Contact name (falls back to `empresa` if missing) |
| `email` | string or null | Best email address |
| `location` | string | Full location string |
| `city` | string | City name |
| `state` | string | State/Province |
| `country` | string | Country name |
| `niche` | string | Business niche/industry |
| `campaign_name` | string | Campaign name (creates/uses campaign) |

### Optional Fields

All other fields in the payload are optional but will enhance the lead data if provided.

---

## 🔄 Batch Processing

The endpoint supports **both single and batch** lead processing:

### Single Lead
```json
{
  "empresa": "Company 1",
  "phone": "+5511999999999"
}
```

### Batch Leads (Array)
```json
[
  {
    "empresa": "Company 1",
    "phone": "+5511999999999"
  },
  {
    "empresa": "Company 2",
    "phone": "+5511888888888"
  }
]
```

---

## ✅ Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Processed 1 leads successfully",
  "processed": 1,
  "created": 1,
  "updated": 0,
  "emails_sent": 0,
  "lead_id": "uuid-here"  // Only for single lead requests
}
```

### Partial Success (200 OK with errors)

```json
{
  "success": true,
  "message": "Processed 2 leads successfully",
  "processed": 2,
  "created": 1,
  "updated": 1,
  "emails_sent": 0,
  "errors": [
    "Phone +5511999999999 is blocked"
  ]
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation error: empresa is required",
  "code": "PROCESSING_ERROR",
  "processed": 0,
  "created": 0,
  "updated": 0,
  "errors": [
    "Validation error: empresa is required"
  ]
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "details": "Error message (only in development)"
}
```

---

## 🔍 Duplicate Detection

The system uses **two methods** to detect duplicates:

1. **Primary**: `enrichment_data.lead.id` (if provided)
2. **Fallback**: Phone number + Campaign ID

**Behavior**:
- If duplicate found by `lead_gen_id`: Updates existing lead
- If duplicate found by phone: Updates existing lead in same campaign
- If no duplicate: Creates new lead

**Important**: Always include `enrichment_data.lead.id` for reliable duplicate detection.

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Validation error: empresa is required"

**Cause**: Missing `empresa` field or empty string

**Solution**: Ensure `empresa` is a non-empty string
```json
{
  "empresa": "Company Name",  // ✅ Correct
  "phone": "+5511999999999"
}
```

### Issue 2: "Validation error: Phone is required"

**Cause**: Missing `phone` field or invalid format

**Solution**: Ensure `phone` starts with `+` (E.164 format)
```json
{
  "empresa": "Company Name",
  "phone": "+5511999999999"  // ✅ Correct (starts with +)
}
```

### Issue 3: "Unauthorized" (401)

**Cause**: Missing or incorrect authentication token

**Solution**: 
- Check `Authorization: Bearer {token}` header is present
- Verify token matches `LEAD_GEN_INTEGRATION_TOKEN` in Outreach Tool

### Issue 4: Leads not appearing in dashboard

**Possible Causes**:
1. **Database migration not run**: Run `017_complete_lead_gen_integration.sql`
2. **Silent validation errors**: Check response `errors` array
3. **Phone blocked**: Check `do_not_contact` table
4. **Campaign creation failed**: Check server logs for campaign errors

**Solution**: Use the Debug endpoint: `GET /api/integration/leads/debug`

### Issue 5: "Failed to create lead" (500)

**Possible Causes**:
1. Database constraint violation
2. Missing required database fields
3. Invalid data types

**Solution**: Check server logs for detailed error messages

---

## 🧪 Testing Checklist

Use this checklist to verify your integration:

### ✅ Authentication
- [ ] `Authorization: Bearer {token}` header is sent
- [ ] Token matches Outreach Tool's `LEAD_GEN_INTEGRATION_TOKEN`
- [ ] No 401 Unauthorized errors

### ✅ Required Fields
- [ ] `empresa` field is present and non-empty
- [ ] `phone` field is present and starts with `+`
- [ ] No validation errors in response

### ✅ Data Quality
- [ ] Phone numbers are in E.164 format (`+5511999999999`)
- [ ] Email addresses are valid (if provided)
- [ ] URLs are valid (if provided)

### ✅ Response Handling
- [ ] Check `success` field in response
- [ ] Check `created` count matches expectations
- [ ] Check `errors` array for any issues
- [ ] Verify `lead_id` is returned (for single leads)

### ✅ Verification
- [ ] Leads appear in Outreach Tool dashboard
- [ ] Campaigns are created/used correctly
- [ ] No orphaned leads (use Debug endpoint)
- [ ] All enrichment data is stored

---

## 📊 Debug Endpoint

Use this endpoint to verify leads are being saved:

**GET** `/api/integration/leads/debug`

**Headers**:
```
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
```

**Response**:
```json
{
  "success": true,
  "debug": {
    "recentLeads": [...],
    "recentLeadsCount": 5,
    "campaigns": [...],
    "campaignsCount": 3,
    "totalLeadsInDatabase": 25,
    "orphanedLeads": [],
    "errors": {...}
  }
}
```

**Access**: Available in Admin Dashboard → Leads tab → "Debug" button

---

## 🔐 Security Requirements

1. **HTTPS**: All requests must use HTTPS (not HTTP)
2. **Authentication**: Bearer token is required
3. **Token Security**: Keep token secret, rotate if compromised
4. **Rate Limiting**: Respect rate limits (if implemented)

---

## 📝 Example cURL Request

```bash
curl -X POST https://your-outreach-tool.com/api/integration/leads/receive \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-integration-token" \
  -d '{
    "empresa": "Silva Marketing",
    "phone": "+5511999999999",
    "nome": "João Silva",
    "email": "contato@silvamarketing.com",
    "location": "São Paulo, SP, Brasil",
    "niche": "marketing agency",
    "campaign_name": "Q1 2024 Agency Outreach",
    "enrichment_data": {
      "lead": {
        "id": "unique-lead-id-from-your-system",
        "business_name": "Silva Marketing",
        "business_quality_score": 85,
        "business_quality_tier": "TIER1",
        "is_icp": true
      }
    }
  }'
```

---

## 🎯 Quick Reference

### Minimum Required Payload
```json
{
  "empresa": "Company Name",
  "phone": "+5511999999999"
}
```

### Recommended Payload
```json
{
  "empresa": "Company Name",
  "phone": "+5511999999999",
  "nome": "Contact Name",
  "email": "email@company.com",
  "location": "City, State, Country",
  "niche": "industry",
  "campaign_name": "Campaign Name",
  "enrichment_data": {
    "lead": {
      "id": "unique-id"
    }
  }
}
```

---

## 📞 Support

If you encounter issues:

1. **Check Response**: Always check the response `errors` array
2. **Use Debug Endpoint**: Verify leads are in database
3. **Check Server Logs**: Look for `[Integration]` log messages
4. **Verify Migration**: Ensure database migration is run

---

## ✅ Final Checklist

Before going live, verify:

- [ ] Authentication token is configured correctly
- [ ] Required fields (`empresa`, `phone`) are always sent
- [ ] Phone numbers are in E.164 format (start with `+`)
- [ ] `enrichment_data.lead.id` is included for duplicate detection
- [ ] Response is checked for `success`, `created`, and `errors`
- [ ] Debug endpoint shows leads in database
- [ ] Leads appear in Outreach Tool dashboard
- [ ] Error handling is implemented for failed requests
- [ ] Retry logic is implemented for transient failures

---

**Version**: 2.0  
**Last Updated**: 2024-01-20  
**Compatible with Outreach Tool**: v2.0+
