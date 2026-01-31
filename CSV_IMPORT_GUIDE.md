# 📊 CSV Import Guide - Local Setup

## ✅ Quick Start

1. **Start the app locally:**
   ```bash
   npm run dev
   ```

2. **Open dashboard:**
   - Go to: http://localhost:3000/dashboard

3. **Import your CSV:**
   - Enter your license key
   - Create a campaign (or select existing)
   - Upload your CSV file
   - Click "Import CSV"

## 📋 CSV Format

Your CSV file should have these columns:

### Required Columns:
- `nome` - Lead name
- `empresa` - Company name  
- `phone` - Phone number (any format, will be normalized)

### Optional Columns:
- `cargo` - Job title/position
- `site` - Company website URL
- `dor_especifica` - Specific pain point/challenge

## 📝 CSV Example

```csv
nome,empresa,cargo,site,dor_especifica,phone
João Silva,Empresa ABC,CEO,https://empresaabc.com.br,Necessita aumentar vendas,+5511999999999
Maria Santos,Tech Solutions,CTO,https://techsol.com.br,Melhorar processos,+5511888888888
Pedro Costa,Startup XYZ,Founder,,Aumentar conversões,11977777777
```

## 🔄 Flexible Column Names

The system accepts multiple column name variations:

| Standard | Alternatives |
|----------|-------------|
| `nome` | `name`, `Name`, `Nome` |
| `empresa` | `company`, `Company`, `Empresa` |
| `cargo` | `job_title`, `Cargo` |
| `site` | `website`, `Website`, `Site` |
| `dor_especifica` | `pain_point`, `Dor_Especifica` |
| `phone` | `telefone`, `Phone`, `Telefone` |

## 📱 Phone Number Format

Phone numbers are automatically normalized to E.164 format:
- `11999999999` → `+5511999999999`
- `(11) 99999-9999` → `+5511999999999`
- `+55 11 99999-9999` → `+5511999999999`

## ⚠️ Import Rules

1. **Duplicates**: Same phone number in the same campaign will be skipped
2. **Blocked Numbers**: Numbers in the blocklist will be skipped
3. **Validation**: Rows missing required fields (nome, empresa, phone) will be skipped
4. **Errors**: Invalid phone numbers will be reported in the errors list

## 🎯 Workflow

1. **Create Campaign:**
   - Enter license key
   - Enter campaign name
   - Click "Create"

2. **Select Campaign:**
   - Choose from dropdown

3. **Upload CSV:**
   - Click "Choose File"
   - Select your CSV file
   - Click "Import CSV"

4. **View Results:**
   - See imported count
   - See skipped count
   - Review any errors

## 🔧 Troubleshooting

### "No valid contacts found"
- Check CSV has required columns: `nome`, `empresa`, `phone`
- Verify CSV is properly formatted (comma-separated)
- Check for empty rows

### "Invalid phone number"
- Ensure phone column has data
- Phone can be in any format (will be normalized)
- Check for special characters that might break parsing

### "Campaign not found"
- Make sure you've created a campaign first
- Verify license key is correct
- Check campaign is selected in dropdown

### "License key invalid"
- Verify license key is correct
- Check license key is active in database
- Ensure you're using the right license key format

## 📊 After Import

Once imported, leads will:
- Appear in the selected campaign
- Have status "pending"
- Be ready for message sending
- Be available via the sender API (`/api/sender/queue`)

## 🔗 API Alternative

You can also import via API directly:

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

## 💡 Tips

1. **Test with small file first** (5-10 rows) before importing large files
2. **Check errors list** to understand what was skipped
3. **Use consistent column names** for best results
4. **Save your CSV** in UTF-8 encoding to avoid character issues
5. **Remove headers** if they cause issues (system auto-detects)
