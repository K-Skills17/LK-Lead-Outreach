# ⚡ Quick Reference - Internal Tool

## 🔐 Environment Setup

### Create `.env.local` File

**Windows PowerShell:**
```powershell
cd "C:\dev\LK Lead Outreach"
New-Item -Path ".env.local" -ItemType File
notepad .env.local
```

**Then paste:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
```

**Full instructions:** See `ENV_SETUP_INSTRUCTIONS.md`

## 🚀 Start Locally

```bash
npm install
npm run dev
```

**Dashboard:** http://localhost:3000/dashboard

## 📊 CSV Import

1. Go to `/dashboard`
2. Enter license key
3. Create campaign
4. Upload CSV with columns: `nome`, `empresa`, `cargo`, `site`, `dor_especifica`, `phone`

## 🤖 AI Message Generation

### Generate for Specific Lead

```bash
POST /api/campaigns/{campaignId}/leads/{leadId}/generate-message
{
  "licenseKey": "YOUR_KEY",
  "tone": "professional"
}
```

**AI automatically uses:**
- ✅ `nome` - Personalizes greeting
- ✅ `empresa` - Shows research
- ✅ `cargo` - Adapts tone (CEO vs Manager)
- ✅ `site` - Mentions visiting site
- ✅ `dor_especifica` - **Main focus** of message

## 🗑️ Removed Features

- ❌ All payment pages (`/precos`, `/obrigado-*`, `/pagamento-*`)
- ❌ Mercado Pago webhooks
- ❌ Tier restrictions (AI available for all)
- ❌ Subscription management

## 📋 What's Left

- ✅ Dashboard (`/dashboard`)
- ✅ CSV import
- ✅ Campaign management
- ✅ AI message generation (with full CSV context)
- ✅ Sender queue (returns all CSV fields)

## 🔗 Key Endpoints

- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/[id]/import-csv` - Import CSV
- `POST /api/campaigns/[id]/leads/[leadId]/generate-message` - Generate AI message
- `GET /api/sender/queue` - Get leads for sending

## 📚 Full Guides

- **Environment Setup:** `ENV_SETUP_INSTRUCTIONS.md`
- **CSV Import:** `LOCAL_CSV_IMPORT_SETUP.md`
- **AI Generation:** `AI_MESSAGE_GENERATION_GUIDE.md`
- **Cleanup Summary:** `CLEANUP_SUMMARY.md`
