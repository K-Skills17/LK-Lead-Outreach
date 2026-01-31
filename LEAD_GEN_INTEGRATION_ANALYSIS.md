# 🔍 Lead Gen Integration - Complete Analysis

## 📋 Executive Summary

This document provides a comprehensive analysis of the **LK Lead Outreach** codebase, identifying what it's meant to do, what's currently implemented, what connections are missing, and what needs to be done to fully connect it to your lead generation app.

---

## 🎯 What the System is Meant to Do

### Core Purpose
**LK Lead Outreach** is a B2B lead outreach automation tool that:
1. **Receives enriched leads** from your Lead Generation Tool
2. **Stores lead data** with enrichment information (company details, pain points, analysis)
3. **Sends initial emails** via Resend
4. **Queues WhatsApp messages** for follow-up (with configurable delay)
5. **Manages campaigns** and tracks outreach status
6. **Supports SDR accounts** for multi-user management
7. **Generates AI-powered messages** using OpenAI

### Complete Workflow (Intended)
```
Lead Gen Tool
  ↓
1. Enriches lead (nome, empresa, cargo, site, dor_especifica)
2. Analyzes business (industry, company_size, revenue_range, pain_points)
3. Generates business analysis report
4. Calls: POST /api/integration/leads/receive
  ↓
LK Lead Outreach
  ↓
5. Stores lead with ALL enrichment data
6. Creates/updates campaign
7. Sends email (if send_email_first = true)
8. Schedules WhatsApp follow-up (after whatsapp_followup_delay_hours)
  ↓
9. WhatsApp message sent automatically (after delay)
10. Lead status updated to 'sent'
```

---

## ✅ What's Currently Implemented

### 1. API Endpoints ✅

#### `/api/integration/leads/receive` (POST)
- ✅ Accepts enriched leads (single or batch)
- ✅ Validates lead data with Zod schema
- ✅ Authenticates with `LEAD_GEN_INTEGRATION_TOKEN`
- ✅ Normalizes phone numbers
- ✅ Checks blocklist (`do_not_contact`)
- ✅ Creates/updates campaigns automatically
- ✅ Creates/updates leads in `campaign_contacts` table
- ✅ Sends email via Resend (if requested)
- ✅ Returns detailed results

#### `/api/integration/webhook` (POST)
- ✅ Handles webhook events
- ✅ Supports: `lead.enriched`, `lead.analyzed`, `lead.report_ready`, `lead.email_sent`, `campaign.completed`
- ✅ Authenticates with integration token
- ✅ Updates lead data based on events

#### `/api/integration/status` (GET)
- ✅ Health check endpoint
- ✅ Returns statistics (campaigns, leads, pending, sent)
- ✅ Shows integration status

### 2. Database Schema ✅

**Tables:**
- ✅ `campaigns` - Campaign metadata
- ✅ `campaign_contacts` - Lead data with CSV fields (nome, empresa, cargo, site, dor_especifica)
- ✅ `sdr_users` - SDR account management
- ✅ `do_not_contact` - Blocklist
- ✅ `message_replies` - WhatsApp reply tracking
- ✅ `message_drafts` - Message templates

**Fields in `campaign_contacts`:**
- ✅ `nome`, `empresa`, `cargo`, `site`, `dor_especifica`
- ✅ `phone`, `status`, `personalized_message`
- ✅ `assigned_sdr_id` (for SDR assignment)

### 3. WhatsApp Queue System ✅

- ✅ `/api/sender/queue` - Returns pending leads
- ✅ Desktop sender app integration ready
- ✅ SDR-specific queue filtering
- ✅ `/api/sender/mark-sent` - Updates lead status
- ✅ `/api/sender/mark-failed` - Handles failures

### 4. Email Service ✅

- ✅ Resend integration
- ✅ Email sending in integration endpoint
- ✅ Basic email template

---

## ❌ What's Missing / Not Connected

### 1. **Missing Database Fields** 🔴 CRITICAL

The integration accepts enrichment data but **doesn't store it**:

#### Missing in `campaign_contacts` table:
- ❌ `email` - Email address (accepted but not stored)
- ❌ `industry` - Industry classification
- ❌ `company_size` - Company size range
- ❌ `revenue_range` - Revenue range
- ❌ `pain_points` - Array of pain points
- ❌ `enrichment_score` - Enrichment quality score (0-100)
- ❌ `source` - Lead source (LinkedIn, etc.)
- ❌ `tags` - Array of tags
- ❌ `report_url` - URL to generated report
- ❌ `enrichment_data` - JSONB column for structured enrichment data

**Current Workaround:**
- Only `business_analysis` is stored in `personalized_message` field
- Comment in code says: "Store enrichment data in personalized_message for now (or create enrichment_data JSONB column)"

**Impact:**
- Enrichment data is lost after processing
- Can't filter/search by industry, company size, etc.
- Can't access report URLs later
- Email address not available for follow-ups

### 2. **WhatsApp Delay Not Implemented** 🔴 CRITICAL

**Problem:**
- Integration accepts `whatsapp_followup_delay_hours` parameter
- But **no delay mechanism exists**
- Leads are created with `status = 'pending'` immediately
- Desktop sender app will send messages right away (no delay)

**What's Missing:**
- ❌ No `scheduled_send_at` field in `campaign_contacts`
- ❌ No scheduled job/cron to check for delayed sends
- ❌ No logic to respect `whatsapp_followup_delay_hours`
- ❌ Queue endpoint doesn't filter by scheduled time

**Current Behavior:**
```
Lead received → status = 'pending' → Available in queue immediately
```

**Expected Behavior:**
```
Lead received → scheduled_send_at = now + delay → Not in queue until scheduled time
```

### 3. **Report URL Not Stored** 🟡 MEDIUM

**Problem:**
- Webhook `lead.report_ready` receives `report_url`
- But URL is not stored anywhere
- Only logged to console

**Missing:**
- ❌ No `report_url` field in `campaign_contacts`
- ❌ No way to access report later

### 4. **Email Template System Incomplete** 🟡 MEDIUM

**Problem:**
- Integration accepts `email_template` parameter
- But only uses it as subject line
- No template system for email body
- No way to customize email templates

**Missing:**
- ❌ No email template storage/management
- ❌ No template variables/substitution
- ❌ Hardcoded email HTML

### 5. **No Automatic WhatsApp Scheduling** 🟡 MEDIUM

**Problem:**
- Leads are queued but require manual trigger (desktop app polling)
- No automatic scheduling system
- No background job to process delayed sends

**Options:**
1. **Cron job** (Vercel Cron) to check scheduled sends
2. **Database trigger** to schedule sends
3. **Queue system** (Redis/BullMQ) for delayed jobs

---

## 🔧 What Needs to Be Done

### Priority 1: Database Schema Updates 🔴

#### 1.1 Add Missing Fields to `campaign_contacts`

```sql
-- Migration: Add enrichment fields
ALTER TABLE campaign_contacts
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS revenue_range TEXT,
  ADD COLUMN IF NOT EXISTS pain_points JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS enrichment_score INTEGER,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS report_url TEXT,
  ADD COLUMN IF NOT EXISTS enrichment_data JSONB,
  ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_email ON campaign_contacts(email);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_industry ON campaign_contacts(industry);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_scheduled_send_at ON campaign_contacts(scheduled_send_at) WHERE scheduled_send_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_enrichment_score ON campaign_contacts(enrichment_score);
```

#### 1.2 Update Integration Endpoint

Update `app/api/integration/leads/receive/route.ts` to:
- Store email in database
- Store all enrichment fields
- Store enrichment_data as JSONB
- Calculate and store `scheduled_send_at`

### Priority 2: Implement WhatsApp Delay 🔴

#### 2.1 Add Scheduled Send Logic

In `app/api/integration/leads/receive/route.ts`:
```typescript
// Calculate scheduled send time
const delayHours = validated.whatsapp_followup_delay_hours || 24;
const scheduledSendAt = new Date();
scheduledSendAt.setHours(scheduledSendAt.getHours() + delayHours);

// Store in lead data
const leadToUpsert = {
  // ... existing fields
  scheduled_send_at: scheduledSendAt.toISOString(),
};
```

#### 2.2 Update Queue Endpoint

In `app/api/sender/queue/route.ts`:
```typescript
// Only return leads where scheduled_send_at has passed
.where('scheduled_send_at', '<=', new Date().toISOString())
.or('scheduled_send_at.is.null') // For backward compatibility
```

#### 2.3 Optional: Background Job

Create Vercel Cron job or use database triggers to automatically process scheduled sends.

### Priority 3: Store Report URL 🟡

#### 3.1 Update Webhook Handler

In `app/api/integration/webhook/route.ts`:
```typescript
async function handleReportReady(data: any) {
  if (data.phone) {
    const normalizedPhone = normalizePhone(data.phone);
    
    await supabaseAdmin
      .from('campaign_contacts')
      .update({
        report_url: data.report_url,
      })
      .eq('phone', normalizedPhone);
  }
}
```

### Priority 4: Email Template System 🟡

#### 4.1 Create Email Templates Table

```sql
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Available variables
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.2 Update Email Sending

- Load template by name
- Replace variables ({{nome}}, {{empresa}}, etc.)
- Send email

### Priority 5: Testing & Validation 🟢

#### 5.1 Test Integration Flow

1. Send test lead from Lead Gen Tool
2. Verify all fields stored correctly
3. Verify email sent
4. Verify scheduled_send_at calculated
5. Verify lead appears in queue after delay

#### 5.2 Test Webhook Events

1. Test `lead.enriched`
2. Test `lead.analyzed`
3. Test `lead.report_ready` (verify URL stored)
4. Test `campaign.completed`

---

## 📊 Connection Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| API Endpoints | ✅ Complete | All 3 endpoints working |
| Authentication | ✅ Complete | Token-based auth working |
| Lead Storage | ⚠️ Partial | Missing enrichment fields |
| Email Sending | ✅ Complete | Basic implementation |
| WhatsApp Queue | ⚠️ Partial | No delay mechanism |
| Webhook Events | ⚠️ Partial | Report URL not stored |
| Database Schema | ⚠️ Partial | Missing 10+ fields |
| SDR System | ✅ Complete | Ready for use |
| Campaign Management | ✅ Complete | Auto-creation works |

---

## 🚀 Implementation Checklist

### Phase 1: Critical Fixes (Do First)
- [ ] Add database migration for missing fields
- [ ] Update integration endpoint to store all fields
- [ ] Implement `scheduled_send_at` logic
- [ ] Update queue endpoint to respect delay
- [ ] Test end-to-end flow

### Phase 2: Enhancements
- [ ] Store report URLs
- [ ] Create email template system
- [ ] Add enrichment data JSONB column
- [ ] Add indexes for performance

### Phase 3: Optional Improvements
- [ ] Background job for scheduled sends
- [ ] Email template management UI
- [ ] Enrichment data visualization
- [ ] Advanced filtering/search

---

## 🔗 How to Connect Your Lead Gen App

### Step 1: Configure Integration Token

Add to `.env.local`:
```env
LEAD_GEN_INTEGRATION_TOKEN=your_secure_token_here_min_32_chars
```

### Step 2: Update Your Lead Gen App

**Python Example:**
```python
import requests
import os

INTEGRATION_TOKEN = os.getenv('LEAD_GEN_INTEGRATION_TOKEN')
OUTREACH_URL = 'https://your-domain.com/api/integration/leads/receive'

def send_lead_to_outreach(lead_data):
    response = requests.post(
        OUTREACH_URL,
        json=lead_data,
        headers={
            'Authorization': f'Bearer {INTEGRATION_TOKEN}',
            'Content-Type': 'application/json'
        }
    )
    return response.json()

# Full lead data
lead = {
    "nome": "João Silva",
    "empresa": "Empresa ABC",
    "email": "joao@empresaabc.com.br",
    "phone": "+5511999999999",
    "cargo": "CEO",
    "site": "https://empresaabc.com.br",
    "dor_especifica": "Necessita aumentar vendas",
    "industry": "Technology",
    "company_size": "50-100",
    "revenue_range": "$1M-$5M",
    "pain_points": ["Sales", "Growth"],
    "business_analysis": "High potential lead...",
    "enrichment_score": 85,
    "source": "LinkedIn",
    "tags": ["high-priority"],
    "send_email_first": True,
    "whatsapp_followup_delay_hours": 24
}

result = send_lead_to_outreach(lead)
```

### Step 3: Run Database Migration

After implementing fixes, run the migration to add missing fields.

### Step 4: Test Integration

1. Send test lead
2. Check database for all fields
3. Verify email sent
4. Verify WhatsApp scheduled correctly

---

## 📝 Notes

- **Current State**: Integration works but loses enrichment data
- **Main Issue**: Database schema doesn't match integration API
- **Quick Fix**: Add missing fields to database
- **Long-term**: Consider enrichment_data JSONB for flexibility

---

## 🎯 Next Steps

1. **Review this analysis** with your team
2. **Prioritize fixes** based on your needs
3. **Implement database migration** (Priority 1)
4. **Update integration endpoint** to store all data
5. **Test thoroughly** before production use

---

**Last Updated:** 2025-01-15  
**Status:** Ready for Implementation
