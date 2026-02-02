# 📧 Email System Implementation - Complete Guide

## ✅ What's Been Implemented

### 1. Email Templates System
- ✅ Database schema for email templates
- ✅ Template service with variable substitution
- ✅ API endpoints for CRUD operations
- ✅ Support for template variables (e.g., `{{nome}}`, `{{empresa}}`)

### 2. AI Email Generation
- ✅ AI service to generate 3 email variations
- ✅ Different approaches: Direct, Question, Story
- ✅ Personalized based on lead data

### 3. A/B Testing for Emails
- ✅ Integration with existing A/B testing system
- ✅ Support for 3 variations
- ✅ Automatic variant assignment
- ✅ Tracking which variation was sent

### 4. Analytics & Tracking
- ✅ Email response tracking
- ✅ A/B test analytics endpoint
- ✅ Open/click/reply/booking rates per variant

### 5. Admin-Only Access
- ✅ All endpoints require admin authentication
- ✅ Only admins can send emails

---

## 📁 Files Created

### Database Migration
- `supabase/migrations/018_email_templates_and_ab_testing.sql`
  - `email_templates` table
  - `email_responses` table
  - Updates to `email_sends` for A/B testing
  - Updates to `ab_test_campaigns` for email tests

### Services
- `lib/email-template-service.ts` - Template management
- `lib/email-ai-service.ts` - AI email generation

### API Endpoints
- `app/api/admin/emails/templates/route.ts` - Template CRUD
- `app/api/admin/emails/generate-variations/route.ts` - AI generation
- `app/api/admin/emails/send-with-ab-test/route.ts` - Send with A/B test
- `app/api/admin/emails/analytics/route.ts` - Analytics

---

## 🚀 Usage Examples

### 1. Create Email Template

```bash
POST /api/admin/emails/templates
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}

{
  "name": "Welcome Email",
  "description": "Welcome email for new leads",
  "subject": "Olá {{nome}}, vamos crescer {{empresa}}?",
  "html_content": "<h1>Olá {{nome}}</h1><p>Vimos que você trabalha na {{empresa}}...</p>",
  "variables": ["nome", "empresa"]
}
```

### 2. Generate 3 Email Variations

```bash
POST /api/admin/emails/generate-variations
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}

{
  "contactId": "uuid-here",
  "tone": "professional",
  "includeCTA": true
}
```

**Response:**
```json
{
  "success": true,
  "variations": [
    {
      "variation_name": "Direct",
      "subject": "...",
      "html_content": "...",
      "text_content": "...",
      "description": "..."
    },
    {
      "variation_name": "Question",
      "subject": "...",
      "html_content": "...",
      "text_content": "...",
      "description": "..."
    },
    {
      "variation_name": "Story",
      "subject": "...",
      "html_content": "...",
      "text_content": "...",
      "description": "..."
    }
  ]
}
```

### 3. Send Email with A/B Testing

```bash
POST /api/admin/emails/send-with-ab-test
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}

{
  "contactId": "uuid-here",
  "variations": [
    {
      "variation_name": "Direct",
      "subject": "Subject 1",
      "html_content": "HTML 1",
      "text_content": "Text 1"
    },
    {
      "variation_name": "Question",
      "subject": "Subject 2",
      "html_content": "HTML 2",
      "text_content": "Text 2"
    },
    {
      "variation_name": "Story",
      "subject": "Subject 3",
      "html_content": "HTML 3",
      "text_content": "Text 3"
    }
  ],
  "testName": "Email A/B Test - Company Name"
}
```

**What happens:**
1. Creates A/B test with 3 variants
2. Assigns one variant to the contact (weighted random)
3. Sends email with selected variant
4. Tracks which variant was sent
5. Records A/B test assignment

### 4. Get Analytics

```bash
GET /api/admin/emails/analytics?abTestId={testId}
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "test": {
    "id": "...",
    "test_name": "...",
    "status": "active",
    "variants": [
      {
        "variant_name": "Direct",
        "sent": 50,
        "opened": 25,
        "clicked": 10,
        "replied": 5,
        "booked": 2,
        "open_rate": 50.0,
        "click_rate": 20.0,
        "reply_rate": 10.0,
        "booking_rate": 4.0
      },
      // ... other variants
    ],
    "winner": "Direct",
    "confidence": 95.5
  }
}
```

---

## 🔧 Next Steps

1. **Run Migration**: Execute `018_email_templates_and_ab_testing.sql` in Supabase
2. **Update Email Send Endpoint**: Complete the template and A/B test integration in `app/api/admin/emails/send/route.ts`
3. **Create Admin UI**: Build UI components for:
   - Template management
   - Generate variations button
   - A/B test results dashboard
4. **Test Integration**: Test with real leads

---

## 📝 Notes

- Resend API is already configured
- All endpoints require admin authentication
- A/B testing uses existing framework
- Analytics track opens, clicks, replies, and bookings
- Templates support variable substitution
