# 🚀 Advanced Features Guide

## Overview

Your outreach app now includes three powerful AI-driven features:

1. **Personalization Analysis** - GPT-4 powered personalized email generation
2. **Optimal Send Time Analysis** - Smart scheduling based on historical data
3. **A/B/C Testing** - Variant testing for continuous optimization

---

## 🎯 1. Personalization Analysis

### How It Works

1. **Collects lead data** (rankings, competitors, website performance, marketing tags)
2. **Extracts specific pain points** (e.g., "#12 on Google Maps", "rating gap vs competitors")
3. **Uses GPT-4** to generate 2-3 sentence personalized intro mentioning specific data
4. **Calculates personalization score** (0-100) based on data specificity
5. **Generates CTAs** based on lead tier (VIP/HOT/WARM/COLD)

### Output

- Personalized email intro
- CTA (call-to-action)
- Pain points array
- Personalization score (0-100)
- Lead tier (VIP/HOT/WARM/COLD)

### API Endpoints

#### Generate Personalization

```http
POST /api/features/personalization
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
Content-Type: application/json

{
  "contactId": "uuid-here",
  "leadData": {
    "name": "João Silva",
    "empresa": "Empresa ABC",
    "industry": "Healthcare",
    "google_maps_ranking": 12,
    "rating": 4.2,
    "competitors": [
      { "name": "Competitor A", "rating": 4.5 }
    ],
    "website_performance": {
      "speed_score": 65,
      "seo_score": 70,
      "mobile_friendly": false
    },
    "marketing_tags": ["high-priority", "healthcare"],
    "pain_points": ["Low visibility"],
    "quality_score": 85,
    "fit_score": 90,
    "enrichment_score": 80,
    "niche": "Clínicas de estética",
    "campaign_name": "Healthcare Q1 2025"
  }
}
```

#### Get Personalization

```http
GET /api/features/personalization?contactId={uuid}
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
```

### Example Response

```json
{
  "success": true,
  "personalization": {
    "personalizedIntro": "Olá João, notei que Empresa ABC está ranqueada em #12 no Google Maps e sua avaliação de 4.2 está abaixo da média dos concorrentes (4.5). Tenho algumas estratégias específicas para melhorar sua visibilidade e atrair mais clientes.",
    "painPoints": [
      "Ranked #12 on Google Maps - below top 5 visibility",
      "Rating 4.2 vs competitors avg 4.5",
      "Website speed score 65/100 - needs optimization"
    ],
    "ctaText": "Podemos conversar amanhã sobre como resolver isso especificamente para clínicas de estética?",
    "ctaType": "VIP",
    "personalizationScore": 85,
    "leadTier": "VIP"
  }
}
```

### Lead Tiers

- **VIP** (85-100 score): Immediate action, urgent CTAs
- **HOT** (70-84 score): Strong interest, case studies
- **WARM** (50-69 score): Educational content
- **COLD** (0-49 score): Soft approach

---

## ⏰ 2. Optimal Send Time Analysis

### How It Works

1. **Day of week**: Avoids weekends/Mondays, prefers Tuesday-Thursday
2. **Time of day**: Business-type specific
   - Healthcare: 8:15 AM, 1:30 PM, 6 PM
   - General: 9:30 AM, 1:30 PM, 5 PM
3. **Historical learning**: Tracks open rates by day/hour/niche
4. **Priority adjustment**: VIP leads get earlier optimal slots
5. **Anti-spam**: Adds ±10 minute randomization
6. **Batch distribution**: Staggers sends 2-5 minutes apart

### Output

- Optimal send time (datetime)
- Day of week and hour
- Reason for selection
- Confidence score (0-100)
- Historical open rate (if available)

### API Endpoints

#### Calculate Send Time

```http
POST /api/features/send-time
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
Content-Type: application/json

{
  "contactId": "uuid-here",
  "businessType": "healthcare",
  "niche": "Clínicas de estética",
  "leadPriority": "VIP",
  "timezone": "America/Sao_Paulo",
  "batchId": "batch-uuid",
  "batchSize": 50
}
```

#### Get Send Time

```http
GET /api/features/send-time?contactId={uuid}
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
```

#### Get Best Send Times (Analytics)

```http
GET /api/features/send-time/analytics?niche=healthcare&businessType=healthcare&limit=10
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
```

### Example Response

```json
{
  "success": true,
  "sendTime": {
    "optimalSendAt": "2026-02-04T08:15:00.000Z",
    "dayOfWeek": 2,
    "hourOfDay": 8,
    "minuteRandomization": 5,
    "reason": "Tuesday | 8:15 | Optimal for healthcare business (45.2% open rate from 120 sends) | VIP priority - earlier slot",
    "confidenceScore": 95,
    "historicalOpenRate": 45.2,
    "historicalSampleSize": 120
  }
}
```

### Business Types

- `healthcare`: 8:15 AM, 1:30 PM, 6:00 PM
- `general`: 9:30 AM, 1:30 PM, 5:00 PM
- `retail`: 10:00 AM, 2:00 PM, 7:00 PM
- `finance`: 9:00 AM, 2:00 PM, 4:00 PM
- `tech`: 10:00 AM, 3:00 PM, 5:00 PM
- `services`: 9:00 AM, 1:00 PM, 4:00 PM

---

## 🧪 3. A/B/C Testing

### How It Works

1. **Test creation**: Define variants (subject lines, intros, send times, CTAs) with weights
2. **Variant assignment**: Weighted random with balancing to maintain target distribution
3. **Content generation**: Different content based on assigned variant
4. **Event tracking**: Tracks sent, opened, clicked, responded, booked
5. **Results analysis**: Calculates rates and statistical significance
6. **Winner determination**: Automatically determines winner with confidence level

### Test Types

- `subject_line`: Test different email subjects
- `intro`: Test different opening paragraphs
- `send_time`: Test different send times
- `cta`: Test different calls-to-action
- `combined`: Test complete message variations

### API Endpoints

#### Create A/B Test

```http
POST /api/features/ab-test
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
Content-Type: application/json

{
  "campaignId": "campaign-uuid",
  "testName": "Subject Line Test Q1",
  "description": "Testing 3 subject line approaches",
  "testType": "subject_line",
  "variants": [
    {
      "name": "Direct",
      "weight": 34,
      "content": {
        "subject_line": "Oportunidade para Empresa ABC"
      }
    },
    {
      "name": "Question",
      "weight": 33,
      "content": {
        "subject_line": "Como melhorar sua visibilidade no Google Maps?"
      }
    },
    {
      "name": "Personalized",
      "weight": 33,
      "content": {
        "subject_line": "João, notei que Empresa ABC está em #12 no Google"
      }
    }
  ]
}
```

#### Start Test

```http
POST /api/features/ab-test/start
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
Content-Type: application/json

{
  "testId": "test-uuid"
}
```

#### Assign Variant

```http
POST /api/features/ab-test/assign
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
Content-Type: application/json

{
  "testId": "test-uuid",
  "contactId": "contact-uuid"
}
```

#### Track Event

```http
POST /api/features/ab-test/track
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
Content-Type: application/json

{
  "testId": "test-uuid",
  "contactId": "contact-uuid",
  "eventType": "opened",
  "eventData": {
    "timestamp": "2026-02-01T10:30:00Z",
    "device": "mobile"
  }
}
```

#### Get Results

```http
GET /api/features/ab-test?testId={uuid}
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
```

#### Determine Winner

```http
POST /api/features/ab-test/winner
Authorization: Bearer {ADMIN_DASHBOARD_TOKEN}
Content-Type: application/json

{
  "testId": "test-uuid",
  "metric": "open_rate"
}
```

### Example Results Response

```json
{
  "success": true,
  "winner": "Personalized",
  "confidence": 95.0,
  "results": [
    {
      "variantName": "Direct",
      "sampleSize": 167,
      "openRate": 32.5,
      "clickRate": 8.2,
      "responseRate": 2.4,
      "isWinner": false,
      "confidence": 85.0
    },
    {
      "variantName": "Question",
      "sampleSize": 165,
      "openRate": 35.8,
      "clickRate": 9.1,
      "responseRate": 2.7,
      "isWinner": false,
      "confidence": 85.0
    },
    {
      "variantName": "Personalized",
      "sampleSize": 168,
      "openRate": 48.2,
      "clickRate": 15.5,
      "responseRate": 4.8,
      "isWinner": true,
      "confidence": 95.0
    }
  ]
}
```

---

## 🔄 Automatic Integration

### When Leads Are Received

When your lead gen tool sends leads to `/api/integration/leads/receive`, the system automatically:

1. ✅ **Generates personalization** (GPT-4 powered)
2. ✅ **Calculates optimal send time** (based on business type and historical data)
3. ✅ **Assigns A/B test variant** (if campaign has an active test)

All of this happens in the background, non-blocking.

### In the Database

Three new tables store this data:

- `lead_personalization` - Personalized content and scores
- `optimal_send_times` - Calculated send times
- `send_time_analytics` - Historical performance data
- `ab_test_campaigns` - Test definitions
- `ab_test_assignments` - Variant assignments
- `ab_test_events` - Event tracking

---

## 📊 How to Use

### 1. Send Leads with Rich Data

Ensure your lead gen tool sends all available data:

```json
{
  "nome": "João Silva",
  "empresa": "Empresa ABC",
  "email": "joao@empresaabc.com.br",
  "phone": "+5511999999999",
  "industry": "Healthcare",
  "quality_score": 85,
  "fit_score": 90,
  "enrichment_score": 80,
  "google_maps_ranking": 12,
  "rating": 4.2,
  "pain_points": ["Low visibility", "Few reviews"],
  "niche": "Clínicas de estética",
  "campaign_name": "Healthcare Q1 2025"
}
```

### 2. Personalization & Send Time Happen Automatically

The system automatically generates personalization and calculates send times.

### 3. Create A/B Tests (Optional)

```bash
# Create test
POST /api/features/ab-test
{
  "campaignId": "...",
  "testName": "Subject Line Test",
  "testType": "subject_line",
  "variants": [...]
}

# Start test
POST /api/features/ab-test/start
{ "testId": "..." }
```

### 4. Track Events

When emails are sent, opened, or clicked, track them:

```bash
POST /api/features/ab-test/track
{
  "testId": "...",
  "contactId": "...",
  "eventType": "opened"
}
```

### 5. Analyze Results

```bash
# Get A/B test results
GET /api/features/ab-test?testId=...

# Determine winner
POST /api/features/ab-test/winner
{ "testId": "...", "metric": "open_rate" }
```

---

## 🔧 Configuration

### Required Environment Variables

```env
# OpenAI API key for personalization
OPENAI_API_KEY=sk-...

# Existing variables
ADMIN_DASHBOARD_TOKEN=your-admin-token
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 📈 Best Practices

1. **Send Rich Data**: More data = better personalization scores
2. **Track Events**: Accurate tracking improves send time optimization
3. **Run A/B Tests**: Continuously test and optimize
4. **Check Analytics**: Monitor best send times for your niches
5. **Use Lead Tiers**: Prioritize VIP and HOT leads

---

## 🎓 Example Workflow

```bash
# 1. Lead comes in from lead gen tool
# (Automatic: personalization + send time calculated)

# 2. Create A/B test for campaign
POST /api/features/ab-test
{
  "campaignId": "campaign-uuid",
  "testName": "Intro Variations",
  "testType": "intro",
  "variants": [
    { "name": "A", "weight": 50, "content": { "intro": "..." } },
    { "name": "B", "weight": 50, "content": { "intro": "..." } }
  ]
}

# 3. Start test
POST /api/features/ab-test/start
{ "testId": "test-uuid" }

# 4. Leads get auto-assigned variants

# 5. Track events as they happen
POST /api/features/ab-test/track
{ "testId": "...", "contactId": "...", "eventType": "opened" }

# 6. After enough data, determine winner
POST /api/features/ab-test/winner
{ "testId": "...", "metric": "open_rate" }
```

---

## ❓ Troubleshooting

### Personalization Not Generating

- Check `OPENAI_API_KEY` is set
- Check OpenAI API quota
- Check logs for errors

### Send Times Not Optimal

- Need more historical data (minimum 20 sends per time slot)
- Check `business_type` is correctly set
- Review `send_time_analytics` table

### A/B Test Not Working

- Ensure test is `active` status
- Check variant weights sum to 100
- Verify campaign has active test

---

**Your app is now powered by AI-driven personalization, smart scheduling, and continuous optimization! 🚀**
