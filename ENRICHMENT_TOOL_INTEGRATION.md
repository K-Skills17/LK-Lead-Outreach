# 🔗 Enrichment Tool Integration Guide

## Overview

This guide explains how to integrate your existing enrichment tool with the LK Lead Outreach tool using the same Supabase project.

## ✅ Benefits

- **Single Database**: Both tools share the same Supabase project
- **Automatic Sync**: Leads flow automatically from enrichment to outreach
- **Real-time Updates**: Changes in one tool reflect in the other
- **Cost Efficient**: One Supabase project instead of two

## 📋 Setup Steps

### Step 1: Update Database Migration

Edit `supabase/migrations/009_enrichment_tool_integration.sql` and update the table name:

```sql
-- Change 'enriched_leads' to your actual table name
CREATE OR REPLACE VIEW enriched_leads_view AS
SELECT 
  id,
  nome,
  empresa,
  cargo,
  site,
  dor_especifica,
  phone,
  email,
  created_at,
  updated_at
FROM your_enrichment_table_name; -- ← Change this
```

### Step 2: Run Migration

1. Go to Supabase Dashboard → SQL Editor
2. Run `009_enrichment_tool_integration.sql`
3. Verify the view was created: `SELECT * FROM enriched_leads_view LIMIT 1;`

### Step 3: Map Your Fields

If your enrichment table has different column names, update the view:

```sql
CREATE OR REPLACE VIEW enriched_leads_view AS
SELECT 
  id,
  name AS nome,              -- If your table uses 'name' instead of 'nome'
  company AS empresa,        -- If your table uses 'company' instead of 'empresa'
  job_title AS cargo,        -- If your table uses 'job_title' instead of 'cargo'
  website AS site,           -- If your table uses 'website' instead of 'site'
  pain_point AS dor_especifica, -- If your table uses 'pain_point'
  phone,
  email,
  created_at,
  updated_at
FROM your_enrichment_table_name;
```

## 🔄 Integration Methods

### Method 1: API Endpoint (Recommended)

**From your enrichment tool, call the outreach API:**

```python
# Python example
import requests

def send_leads_to_outreach(leads, license_key, campaign_id):
    url = "http://localhost:3000/api/enrichment/import"
    
    payload = {
        "licenseKey": license_key,
        "campaignId": campaign_id,
        "leads": [
            {
                "nome": lead.name,
                "empresa": lead.company,
                "cargo": lead.job_title,
                "site": lead.website,
                "dor_especifica": lead.pain_point,
                "phone": lead.phone,
                "email": lead.email
            }
            for lead in leads
        ]
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Usage
result = send_leads_to_outreach(
    leads=enriched_leads,
    license_key="YOUR_LICENSE_KEY",
    campaign_id="CAMPAIGN_UUID"
)
print(f"Imported: {result['imported']}, Skipped: {result['skipped']}")
```

```javascript
// JavaScript/Node.js example
async function sendLeadsToOutreach(leads, licenseKey, campaignId) {
  const response = await fetch('http://localhost:3000/api/enrichment/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      licenseKey,
      campaignId,
      leads: leads.map(lead => ({
        nome: lead.name,
        empresa: lead.company,
        cargo: lead.job_title,
        site: lead.website,
        dor_especifica: lead.pain_point,
        phone: lead.phone,
        email: lead.email
      }))
    })
  });
  
  return await response.json();
}

// Usage
const result = await sendLeadsToOutreach(
  enrichedLeads,
  'YOUR_LICENSE_KEY',
  'CAMPAIGN_UUID'
);
console.log(`Imported: ${result.imported}, Skipped: ${result.skipped}`);
```

### Method 2: Database Function (Direct SQL)

**Call the sync function directly:**

```sql
-- Sync up to 100 leads to a campaign
SELECT * FROM sync_enriched_leads_to_campaign(
  'your-campaign-id-here'::UUID,
  100
);
```

**From your enrichment tool (Python with Supabase client):**

```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Call the function
result = supabase.rpc(
    'sync_enriched_leads_to_campaign',
    {
        'p_campaign_id': 'your-campaign-id',
        'p_limit': 100
    }
).execute()

print(f"Imported: {result.data[0]['imported']}")
```

### Method 3: Scheduled Sync

**Set up automatic syncing:**

```python
# Python example with schedule
import schedule
import time
from supabase import create_client

def sync_leads():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    result = supabase.rpc(
        'sync_enriched_leads_to_campaign',
        {
            'p_campaign_id': 'your-campaign-id',
            'p_limit': 100
        }
    ).execute()
    print(f"Synced {result.data[0]['imported']} leads")

# Sync every hour
schedule.every().hour.do(sync_leads)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## 🔐 Authentication

Both tools use the same Supabase credentials:

```env
# Same for both tools
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Security Note**: 
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe to expose (limited by RLS)
- `SUPABASE_SERVICE_ROLE_KEY` - Keep secret! Full database access

## 📊 Data Flow

```
┌─────────────────────┐
│  Enrichment Tool   │
│  (Your Tool)        │
└──────────┬──────────┘
           │
           │ Writes enriched leads
           ▼
┌─────────────────────┐
│   Supabase Database │
│   (Shared)          │
│                     │
│  enriched_leads     │ ← Your table
│  campaign_contacts  │ ← Outreach table
└──────────┬──────────┘
           │
           │ Reads leads
           ▼
┌─────────────────────┐
│  Outreach Tool      │
│  (This Tool)        │
└─────────────────────┘
```

## 🎯 Workflow Example

1. **Enrichment Tool** enriches leads and saves to `enriched_leads` table
2. **Outreach Tool** creates a campaign
3. **Sync** (automatic or manual) moves leads from `enriched_leads` to `campaign_contacts`
4. **Outreach Tool** sends messages to leads in the campaign

## 🔍 Monitoring

Check sync status:

```sql
-- See how many leads are ready to sync
SELECT COUNT(*) 
FROM enriched_leads_view 
WHERE phone IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM campaign_contacts 
  WHERE phone = normalized_phone(enriched_leads_view.phone)
);

-- See synced leads in a campaign
SELECT COUNT(*) 
FROM campaign_contacts 
WHERE campaign_id = 'your-campaign-id';
```

## ⚠️ Important Notes

1. **Phone Format**: Leads must have phone numbers in a format that can be normalized to E.164
2. **Duplicates**: The system automatically skips duplicates and blocked numbers
3. **Rate Limits**: If syncing large batches, consider rate limiting
4. **Error Handling**: Always check the `errors` array in the response

## 🐛 Troubleshooting

### Leads Not Syncing

1. Check if view exists: `SELECT * FROM enriched_leads_view LIMIT 1;`
2. Verify table name in migration matches your actual table
3. Check phone format: `SELECT phone FROM enriched_leads_view LIMIT 5;`
4. Verify campaign ID is correct

### Permission Errors

1. Ensure you're using the service-role key for admin operations
2. Check RLS policies if using anon key
3. Verify license key is valid

### Duplicate Leads

- The system automatically prevents duplicates
- Check `do_not_contact` table if leads are being blocked
- Verify phone normalization is working correctly
