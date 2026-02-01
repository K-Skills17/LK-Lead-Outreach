# 🚀 Advanced Features Setup Guide

## Quick Start

Follow these steps to enable the three new advanced features:

1. **Personalization Analysis** (GPT-4 powered)
2. **Optimal Send Time Analysis** (Smart scheduling)
3. **A/B/C Testing** (Variant testing)

---

## Step 1: Run Database Migration

### Option A: Supabase Dashboard (Recommended)

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy the contents of `supabase/migrations/002_advanced_features.sql`
5. Paste into the editor
6. Click **"Run"** or press `Ctrl+Enter`
7. Wait for completion (5-10 seconds)

### Option B: Use the Helper Script

```powershell
& .\run-migration-advanced-features.ps1
```

This script will guide you through the process.

### Verify Migration

After running, check if these tables exist in your Supabase database:

- ✅ `lead_personalization`
- ✅ `optimal_send_times`
- ✅ `send_time_analytics`
- ✅ `ab_test_campaigns`
- ✅ `ab_test_assignments`
- ✅ `ab_test_events`

---

## Step 2: Add OpenAI API Key

For AI-powered personalization, you need an OpenAI API key.

### Get OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)

### Add to `.env.local`

```env
# OpenAI API for Personalization
OPENAI_API_KEY=sk-...

# Existing variables
ADMIN_DASHBOARD_TOKEN=your-admin-token
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
LEAD_GEN_INTEGRATION_TOKEN=...
```

### Add to Vercel (Production)

1. Go to your **Vercel Project**
2. Navigate to **Settings → Environment Variables**
3. Add new variable:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-...`
   - **Environment:** Production, Preview, Development
4. Click **"Save"**
5. **Redeploy** your app

---

## Step 3: Restart Development Server

```powershell
# Stop the current server (Ctrl+C)
npm run dev
```

Wait for "Ready" message before testing.

---

## Step 4: Test the Features

Run the comprehensive test script:

```powershell
& .\test-advanced-features.ps1
```

This will test:
- ✅ Personalization generation
- ✅ Optimal send time calculation
- ✅ A/B test creation and assignment
- ✅ Event tracking
- ✅ Analytics retrieval

---

## Step 5: Verify Automatic Integration

The features are **automatically applied** to all incoming leads!

### Send a Test Lead

```powershell
$token = "YOUR_LEAD_GEN_INTEGRATION_TOKEN"
$url = "http://localhost:3000/api/integration/leads/receive"

$lead = @{
    nome = "João Silva"
    empresa = "Clínica Estética São Paulo"
    email = "joao@clinica.com.br"
    phone = "+5511999999999"
    industry = "Healthcare"
    quality_score = 85
    fit_score = 90
    enrichment_score = 80
    google_maps_ranking = 12
    rating = 4.2
    pain_points = @("Low visibility", "Below competitor ratings")
    niche = "Clínicas de estética"
    campaign_name = "Healthcare Q1 2026"
} | ConvertTo-Json -Depth 5

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $lead
```

### Check the Database

After sending a lead, check these tables in Supabase:

1. **`campaign_contacts`** - Lead should be created
2. **`lead_personalization`** - Personalization generated
3. **`optimal_send_times`** - Send time calculated

---

## What Happens Automatically?

When your lead gen tool sends leads to `/api/integration/leads/receive`:

1. ✅ **Lead is stored** in `campaign_contacts`
2. ✅ **Personalization is generated** (GPT-4)
   - Personalized intro
   - Pain points extracted
   - CTA generated
   - Lead tier assigned (VIP/HOT/WARM/COLD)
   - Score calculated (0-100)
3. ✅ **Optimal send time is calculated**
   - Based on business type
   - Historical data considered
   - Day/hour optimized
   - Anti-spam randomization added
4. ✅ **A/B test variant assigned** (if campaign has active test)

All of this happens **in the background**, non-blocking!

---

## Features Overview

### 1. Personalization Analysis

- **Input:** Lead data (name, company, rankings, competitors, etc.)
- **Output:** Personalized intro, CTAs, pain points, score
- **API:** `POST /api/features/personalization`
- **Automatic:** Yes, on every lead

### 2. Optimal Send Time

- **Input:** Business type, niche, lead priority
- **Output:** Optimal datetime, confidence score, reason
- **API:** `POST /api/features/send-time`
- **Automatic:** Yes, on every lead

### 3. A/B/C Testing

- **Input:** Test variants (subject lines, intros, CTAs, etc.)
- **Output:** Variant assignment, event tracking, winner determination
- **API:** Multiple endpoints (create, start, assign, track, results)
- **Automatic:** Variant assignment (if test is active)

---

## API Endpoints Summary

### Personalization

- `POST /api/features/personalization` - Generate personalization
- `GET /api/features/personalization?contactId=xxx` - Get personalization

### Send Time

- `POST /api/features/send-time` - Calculate send time
- `GET /api/features/send-time?contactId=xxx` - Get send time
- `GET /api/features/send-time/analytics` - Get best times

### A/B Testing

- `POST /api/features/ab-test` - Create test
- `POST /api/features/ab-test/start` - Start test
- `POST /api/features/ab-test/assign` - Assign variant
- `POST /api/features/ab-test/track` - Track event
- `GET /api/features/ab-test?testId=xxx` - Get results
- `POST /api/features/ab-test/winner` - Determine winner

---

## Documentation

- **`ADVANCED_FEATURES_GUIDE.md`** - Complete guide with examples
- **`HOW_TO_GET_LEADS_IN_DASHBOARD.md`** - How to send leads
- **`CREATE_SDR_ACCOUNT_GUIDE.md`** - How to create SDR accounts

---

## Troubleshooting

### Personalization Not Working

```
Problem: Personalization not being generated
Solution:
  1. Check OPENAI_API_KEY is set in .env.local
  2. Check OpenAI API quota/billing
  3. Restart development server
  4. Check server logs for errors
```

### Send Time Not Calculated

```
Problem: Send time is null or not optimal
Solution:
  1. Check if business_type is set correctly
  2. Need historical data (send more campaigns)
  3. Check send_time_analytics table
```

### A/B Test Not Assigning

```
Problem: Variants not being assigned
Solution:
  1. Ensure test status is 'active'
  2. Check variant weights sum to 100
  3. Verify campaign has an active test
  4. Check test is started (POST /api/features/ab-test/start)
```

---

## Cost Considerations

### OpenAI API Costs

- **Model:** GPT-4
- **Average tokens per personalization:** ~500 tokens
- **Cost:** ~$0.01-0.02 per lead
- **Recommendation:** Monitor usage in OpenAI dashboard

To reduce costs:
- Use GPT-3.5-turbo instead (change in `lib/personalization-service.ts`)
- Only personalize high-quality leads (quality_score > 70)
- Cache personalizations for similar leads

---

## Next Steps

1. ✅ Run migration (`002_advanced_features.sql`)
2. ✅ Add `OPENAI_API_KEY` to `.env.local`
3. ✅ Restart development server
4. ✅ Test with `test-advanced-features.ps1`
5. ✅ Send test lead from lead gen tool
6. ✅ Check database tables
7. ✅ Create A/B tests for your campaigns
8. ✅ Monitor analytics and optimize

---

## Support

If you encounter any issues:

1. Check the logs (`npm run dev` output)
2. Review `ADVANCED_FEATURES_GUIDE.md`
3. Check Supabase logs (Dashboard → Logs)
4. Verify all environment variables are set

---

**Your outreach app is now powered by AI! 🚀**
