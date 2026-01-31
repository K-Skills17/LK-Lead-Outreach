# ⚡ Quick Start - CSV Import (2 Minutes)

## 🚀 Setup

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Create .env.local with your Supabase credentials
# (See LOCAL_CSV_IMPORT_SETUP.md for details)

# 3. Start the app
npm run dev
```

## 📊 Import CSV

1. **Open Dashboard:**
   - Go to: http://localhost:3000/dashboard

2. **Enter License Key:**
   - Type your license key in the top field

3. **Create Campaign:**
   - Enter name: "Test Campaign"
   - Click "Create"

4. **Upload CSV:**
   - Click "Choose File"
   - Select your CSV file
   - Click "Import CSV"

5. **Done!** ✅
   - View results (imported, skipped, errors)

## 📝 CSV Format

**Required columns:** `nome`, `empresa`, `phone`  
**Optional columns:** `cargo`, `site`, `dor_especifica`

**Example:**
```csv
nome,empresa,cargo,site,dor_especifica,phone
João Silva,Empresa ABC,CEO,https://empresaabc.com.br,Necessita aumentar vendas,+5511999999999
Maria Santos,Tech Solutions,CTO,https://techsol.com.br,Melhorar processos,+5511888888888
```

## 📄 Sample File

Download example: `/public/leads_example.csv`

Or create your own using the format above!

---

**Full Guide:** See `LOCAL_CSV_IMPORT_SETUP.md` for complete instructions.
