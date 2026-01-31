# 🖥️ Local Setup & CSV Import - Complete Guide

## ✅ Quick Setup (5 minutes)

### Step 1: Install Node.js
- Download from: https://nodejs.org/ (v18 or higher)
- Verify: Open terminal and run `node --version`

### Step 2: Install Dependencies
```bash
cd "C:\dev\LK Lead Outreach"
npm install
```

### Step 3: Configure Environment
Create `.env.local` file in the root directory:

```env
# Supabase (Use your existing project)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 4: Run Database Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Run these migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/003_analytics_tracking.sql`
   - `supabase/migrations/008_update_lead_outreach_schema.sql`

### Step 5: Start the App
```bash
npm run dev
```

**Open:** http://localhost:3000/dashboard

## 📊 Using the CSV Import Dashboard

### 1. Access Dashboard
- Go to: http://localhost:3000/dashboard
- You'll see the import interface

### 2. Enter License Key
- Enter your license key in the top field
- This authenticates you and loads your campaigns

### 3. Create a Campaign
- Enter a campaign name (e.g., "Q1 2025 Outreach")
- Click "Create"
- The campaign will appear in the dropdown

### 4. Prepare Your CSV
Your CSV should have these columns:

**Required:**
- `nome` - Lead name
- `empresa` - Company name
- `phone` - Phone number

**Optional:**
- `cargo` - Job title
- `site` - Website URL
- `dor_especifica` - Pain point/challenge

**Example CSV:**
```csv
nome,empresa,cargo,site,dor_especifica,phone
João Silva,Empresa ABC,CEO,https://empresaabc.com.br,Necessita aumentar vendas,+5511999999999
Maria Santos,Tech Solutions,CTO,https://techsol.com.br,Melhorar processos,+5511888888888
```

### 5. Import CSV
- Select your campaign from dropdown
- Click "Choose File" and select your CSV
- Click "Import CSV"
- View results (imported, skipped, errors)

## 📋 CSV Format Details

### Column Name Flexibility
The system accepts multiple column name variations:

| Standard | Also Accepts |
|----------|-------------|
| `nome` | `name`, `Name`, `Nome` |
| `empresa` | `company`, `Company`, `Empresa` |
| `cargo` | `job_title`, `Cargo` |
| `site` | `website`, `Website`, `Site` |
| `dor_especifica` | `pain_point`, `Dor_Especifica` |
| `phone` | `telefone`, `Phone`, `Telefone` |

### Phone Number Format
Any format works - the system normalizes automatically:
- `11999999999` → `+5511999999999`
- `(11) 99999-9999` → `+5511999999999`
- `+55 11 99999-9999` → `+5511999999999`
- `11 99999-9999` → `+5511999999999`

## 🔍 Import Rules

1. **Duplicates**: Same phone in same campaign = skipped
2. **Blocked Numbers**: Numbers in blocklist = skipped
3. **Missing Required Fields**: Rows without nome, empresa, or phone = skipped
4. **Invalid Phones**: Phones that can't be normalized = error reported

## 🎯 Complete Workflow

```
1. Start app: npm run dev
   ↓
2. Open: http://localhost:3000/dashboard
   ↓
3. Enter license key
   ↓
4. Create campaign (or select existing)
   ↓
5. Upload CSV file
   ↓
6. Click "Import CSV"
   ↓
7. Review results
   ↓
8. Leads are now in campaign, ready for outreach!
```

## 🛠️ Troubleshooting

### "No valid contacts found"
- ✅ Check CSV has `nome`, `empresa`, `phone` columns
- ✅ Verify CSV is comma-separated (not semicolon)
- ✅ Remove empty rows
- ✅ Check for special characters breaking parsing

### "License key invalid"
- ✅ Verify license key is correct
- ✅ Check license exists in Supabase `clinics` table
- ✅ Ensure license key format matches (usually `LKRP-XXXX-XXXX-XXXX`)

### "Campaign not found"
- ✅ Create a campaign first
- ✅ Select campaign from dropdown
- ✅ Verify license key is correct

### Port Already in Use
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
PORT=3001 npm run dev
```

### Module Errors
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 CSV Template

Save this as `leads_template.csv`:

```csv
nome,empresa,cargo,site,dor_especifica,phone
João Silva,Empresa ABC,CEO,https://empresaabc.com.br,Necessita aumentar vendas,+5511999999999
Maria Santos,Tech Solutions,CTO,https://techsol.com.br,Melhorar processos,+5511888888888
Pedro Costa,Startup XYZ,Founder,,Aumentar conversões,11977777777
Ana Oliveira,Digital Agency,Director,https://digital.com.br,,+5511666666666
```

## 🔗 Alternative: API Import

You can also import programmatically:

```bash
curl -X POST http://localhost:3000/api/campaigns/YOUR_CAMPAIGN_ID/import-csv \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "YOUR_LICENSE_KEY",
    "contacts": [
      {
        "nome": "João Silva",
        "empresa": "Empresa ABC",
        "cargo": "CEO",
        "site": "https://empresaabc.com.br",
        "dor_especifica": "Necessita aumentar vendas",
        "phone": "+5511999999999"
      }
    ]
  }'
```

## ✅ After Import

Once imported successfully:
- ✅ Leads appear in the campaign
- ✅ Status is "pending" (ready to send)
- ✅ Available via sender API: `/api/sender/queue`
- ✅ Can be used for message generation

## 💡 Pro Tips

1. **Test Small First**: Import 5-10 rows to test before large batches
2. **Check Errors**: Review error list to understand what was skipped
3. **UTF-8 Encoding**: Save CSV as UTF-8 to avoid character issues
4. **Backup First**: Keep original CSV files as backup
5. **Validate Data**: Check phone numbers are valid before importing

## 🚀 Next Steps

After importing:
1. Leads are in your campaign
2. Create messages (manually or with AI)
3. Connect desktop app to send messages
4. Monitor results in dashboard

---

**Need Help?** Check `CSV_IMPORT_GUIDE.md` for more details!
