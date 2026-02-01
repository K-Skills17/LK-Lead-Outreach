# 📊 How to Get Leads Showing in Admin Dashboard

## 🔍 Why You Don't See Leads

The admin dashboard shows leads from the `campaign_contacts` table. If you see campaigns but no leads, it means:

1. ✅ Campaigns exist in the database
2. ❌ No leads have been sent to the outreach app yet

---

## ✅ Solution: Send Leads from Your Lead Gen App

You have **two options** to get leads into the system:

### **Option 1: Automatic Integration (Recommended)**

Configure your Lead Gen Tool to automatically send leads when they're ready:

1. **Get the Integration Token**
   - Check your `.env.local` file for `LEAD_GEN_INTEGRATION_TOKEN`
   - Or ask your admin for it

2. **Configure Your Lead Gen Tool**
   - Use the endpoint: `POST /api/integration/leads/receive`
   - Send leads automatically when enriched/ready
   - See `LEAD_GEN_TOOL_INTEGRATION_SPEC.md` for full details

3. **Test the Connection**
   ```powershell
   & .\test-connection-simple.ps1
   ```

### **Option 2: Manual Export (For Testing)**

If you need to test or manually send leads:

1. **Export from Lead Gen Tool**
   - Export leads as JSON
   - Format according to `LEAD_GEN_TOOL_INTEGRATION_SPEC.md`

2. **Send via API**
   - Use Postman, curl, or a script
   - POST to: `http://localhost:3000/api/integration/leads/receive`
   - Include header: `Authorization: Bearer {LEAD_GEN_INTEGRATION_TOKEN}`

---

## 📋 Required Data Format

Your Lead Gen Tool should send this structure:

```json
{
  "nome": "João Silva",
  "empresa": "Empresa ABC",
  "email": "joao@empresaabc.com.br",
  "phone": "+5511999999999",
  "campaign_name": "Tech Companies 2025"
}
```

**See `LEAD_GEN_TOOL_INTEGRATION_SPEC.md` for complete schema.**

---

## 🧪 Test Sending a Lead

Use this PowerShell script to test:

```powershell
$token = "YOUR_LEAD_GEN_INTEGRATION_TOKEN"
$url = "http://localhost:3000/api/integration/leads/receive"

$lead = @{
    nome = "Test Lead"
    empresa = "Test Company"
    email = "test@example.com"
    phone = "+5511999999999"
    campaign_name = "Test Campaign"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $lead
```

---

## ✅ After Sending Leads

1. **Refresh the Admin Dashboard**
   - Leads should appear in the dashboard
   - They'll be in the `campaign_contacts` table

2. **Check the Database**
   - Go to Supabase → Table Editor → `campaign_contacts`
   - You should see the leads you sent

3. **Assign to SDRs**
   - Use the admin dashboard to assign leads to SDRs
   - Or use the API endpoint `/api/admin/assign-lead`

---

## 🔗 Integration Endpoints

- **Send Leads:** `POST /api/integration/leads/receive`
- **Webhook Events:** `POST /api/integration/webhook`
- **Status Check:** `GET /api/integration/status`

**Full documentation:** `LEAD_GEN_TOOL_INTEGRATION_SPEC.md`

---

## ❓ Still Not Seeing Leads?

1. ✅ Check if leads were sent successfully (check server logs)
2. ✅ Verify the integration token is correct
3. ✅ Check Supabase `campaign_contacts` table directly
4. ✅ Make sure the campaign name matches an existing campaign
5. ✅ Refresh the admin dashboard

---

**Next Step:** Create SDR accounts to assign leads to them!
