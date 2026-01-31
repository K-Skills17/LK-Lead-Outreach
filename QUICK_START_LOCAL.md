# ⚡ Quick Start - Run Locally

## 🚀 3-Minute Setup

### 1. Install Node.js
Download from https://nodejs.org/ (v18+)

### 2. Install Dependencies
```bash
cd "C:\dev\LK Lead Outreach"
npm install
```

### 3. Create `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run Database Migrations
In Supabase SQL Editor, run:
- `001_initial_schema.sql`
- `003_analytics_tracking.sql`
- `008_update_lead_outreach_schema.sql`
- `009_enrichment_tool_integration.sql` (update table name!)

### 5. Start Server
```bash
npm run dev
```

**Open:** http://localhost:3000

## ✅ Done!

---

## 🔗 Connect Your Enrichment Tool

### Option A: API Call (Easiest)
```python
import requests

response = requests.post('http://localhost:3000/api/enrichment/import', json={
    "licenseKey": "YOUR_LICENSE_KEY",
    "campaignId": "CAMPAIGN_UUID",
    "leads": [{
        "nome": "João Silva",
        "empresa": "Empresa ABC",
        "cargo": "CEO",
        "site": "https://empresaabc.com.br",
        "dor_especifica": "Necessita aumentar vendas",
        "phone": "+5511999999999"
    }]
})
```

### Option B: Database Function
```sql
SELECT * FROM sync_enriched_leads_to_campaign(
  'your-campaign-id'::UUID,
  100
);
```

## 📚 Full Guides

- **Local Setup**: See `LOCAL_SETUP_GUIDE.md`
- **Integration**: See `ENRICHMENT_TOOL_INTEGRATION.md`
