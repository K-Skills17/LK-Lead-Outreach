# 🧪 Testing Lead Gen Tool Integration

## Quick Test Guide

---

## ✅ Step 1: Test Connection Status

First, verify the integration is configured and accessible:

### **Using cURL:**
```bash
curl -X GET https://your-outreach-domain.com/api/integration/status \
  -H "Authorization: Bearer YOUR_LEAD_GEN_INTEGRATION_TOKEN"
```

### **Using PowerShell:**
```powershell
$token = "YOUR_LEAD_GEN_INTEGRATION_TOKEN"
$url = "https://your-outreach-domain.com/api/integration/status"

Invoke-RestMethod -Uri $url -Method Get -Headers @{
    "Authorization" = "Bearer $token"
} | ConvertTo-Json
```

### **Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T19:30:00Z",
  "statistics": {
    "campaigns": 5,
    "total_leads": 150,
    "pending_leads": 45,
    "sent_leads": 105
  },
  "integration": {
    "enabled": true,
    "endpoints": {
      "receive_leads": "/api/integration/leads/receive",
      "webhook": "/api/integration/webhook",
      "status": "/api/integration/status"
    }
  }
}
```

**✅ If you see this, the connection works!**

---

## ✅ Step 2: Test with a Single Lead

Send a test lead to verify the data format:

### **Using cURL:**
```bash
curl -X POST https://your-outreach-domain.com/api/integration/leads/receive \
  -H "Authorization: Bearer YOUR_LEAD_GEN_INTEGRATION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Test Lead",
    "empresa": "Test Company",
    "email": "test@example.com",
    "phone": "+5511999999999",
    "cargo": "CEO",
    "send_email_first": false
  }'
```

### **Using PowerShell:**
```powershell
$token = "YOUR_LEAD_GEN_INTEGRATION_TOKEN"
$url = "https://your-outreach-domain.com/api/integration/leads/receive"

$body = @{
    nome = "Test Lead"
    empresa = "Test Company"
    email = "test@example.com"
    phone = "+5511999999999"
    cargo = "CEO"
    send_email_first = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri $url -Method Post -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
} -Body $body | ConvertTo-Json
```

### **Expected Response:**
```json
{
  "success": true,
  "results": {
    "processed": 1,
    "created": 1,
    "updated": 0,
    "emails_sent": 0,
    "errors": []
  },
  "message": "Processed 1 leads"
}
```

**✅ If you see `"success": true`, the lead was created!**

---

## ✅ Step 3: Test with Full Data

Test with all available fields:

### **Using PowerShell:**
```powershell
$token = "YOUR_LEAD_GEN_INTEGRATION_TOKEN"
$url = "https://your-outreach-domain.com/api/integration/leads/receive"

$body = @{
    nome = "João Silva"
    empresa = "Empresa ABC"
    email = "joao@empresaabc.com.br"
    phone = "+5511999999999"
    cargo = "CEO"
    site = "https://empresaabc.com.br"
    address = "Av. Paulista, 1000"
    city = "São Paulo"
    state = "SP"
    country = "Brasil"
    all_emails = @("joao@empresaabc.com.br", "contato@empresaabc.com.br")
    whatsapp = "+5511999999999"
    contact_names = @("João Silva", "Maria Santos")
    marketing_tags = @("high-priority", "tech")
    industry = "Technology"
    company_size = "50-100"
    revenue_range = "$1M-$5M"
    pain_points = @("Sales Growth", "Digital Transformation")
    business_analysis = "Company shows strong growth potential..."
    enrichment_score = 85
    quality_score = 90
    report_url = "https://reports.example.com/lead-123.pdf"
    campaign_name = "Q1 2025 Tech Outreach"
    source = "LinkedIn"
    tags = @("high-priority", "tech")
    send_email_first = $false
    whatsapp_followup_delay_hours = 1
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $url -Method Post -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
} -Body $body | ConvertTo-Json
```

---

## ✅ Step 4: Test Batch Processing

Send multiple leads at once:

```powershell
$token = "YOUR_LEAD_GEN_INTEGRATION_TOKEN"
$url = "https://your-outreach-domain.com/api/integration/leads/receive"

$body = @(
    @{
        nome = "Lead 1"
        empresa = "Company 1"
        email = "lead1@example.com"
        phone = "+5511999999999"
    },
    @{
        nome = "Lead 2"
        empresa = "Company 2"
        email = "lead2@example.com"
        phone = "+5511888888888"
    }
) | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $url -Method Post -Headers @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
} -Body $body | ConvertTo-Json
```

---

## ✅ Step 5: Verify Lead Was Created

Check your Supabase database or admin dashboard:

1. **Go to Admin Dashboard:** `https://your-outreach-domain.com/admin`
2. **Login** with admin credentials
3. **Check Campaigns** - Should see a new campaign (or existing one)
4. **Check Leads** - Should see the test lead

Or query Supabase directly:
```sql
SELECT * FROM campaign_contacts 
WHERE phone = '+5511999999999' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🔍 Troubleshooting

### **Error: "Unauthorized"**
- ✅ Check that `LEAD_GEN_INTEGRATION_TOKEN` is correct
- ✅ Verify the token in your `.env.local` matches what you're sending
- ✅ Make sure header format is: `Authorization: Bearer {token}`

### **Error: "Integration not configured"**
- ✅ Check that `LEAD_GEN_INTEGRATION_TOKEN` is set in `.env.local`
- ✅ Restart your dev server after adding the token
- ✅ For Vercel: Add the token in Environment Variables

### **Error: "Validation error"**
- ✅ Check that required fields are present: `nome`, `empresa`, `email`, `phone`
- ✅ Verify phone is in E.164 format: `+5511999999999`
- ✅ Check email format is valid

### **Error: "Phone is blocked"**
- ✅ The phone number is in the `do_not_contact` table
- ✅ Use a different test phone number

---

## 📋 Test Checklist

- [ ] Status endpoint returns `"status": "healthy"`
- [ ] Single lead test returns `"success": true`
- [ ] Lead appears in database/campaign
- [ ] Full data test includes all fields
- [ ] Batch processing works with multiple leads
- [ ] Error handling works (test with invalid data)

---

## 🚀 Quick Test Script

Save this as `test-integration.ps1`:

```powershell
# Test Integration Script
param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$true)]
    [string]$Domain
)

$baseUrl = "https://$Domain"

Write-Host "Testing connection..." -ForegroundColor Yellow

# Test 1: Status
Write-Host "`n1. Testing status endpoint..." -ForegroundColor Cyan
try {
    $status = Invoke-RestMethod -Uri "$baseUrl/api/integration/status" -Method Get -Headers @{
        "Authorization" = "Bearer $Token"
    }
    Write-Host "✅ Status: $($status.status)" -ForegroundColor Green
    Write-Host "   Campaigns: $($status.statistics.campaigns)" -ForegroundColor Gray
    Write-Host "   Total Leads: $($status.statistics.total_leads)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Status test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Send test lead
Write-Host "`n2. Sending test lead..." -ForegroundColor Cyan
$testLead = @{
    nome = "Test Lead $(Get-Date -Format 'HHmmss')"
    empresa = "Test Company"
    email = "test@example.com"
    phone = "+5511999999999"
    send_email_first = $false
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/integration/leads/receive" -Method Post -Headers @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    } -Body $testLead
    
    if ($result.success) {
        Write-Host "✅ Lead created successfully!" -ForegroundColor Green
        Write-Host "   Processed: $($result.results.processed)" -ForegroundColor Gray
        Write-Host "   Created: $($result.results.created)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Lead creation failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Lead test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

**Usage:**
```powershell
.\test-integration.ps1 -Token "your_token_here" -Domain "your-outreach-domain.com"
```

---

## 📞 Need Help?

If tests fail:
1. Check the error message
2. Verify environment variables are set
3. Check network connectivity
4. Review the integration logs
5. Contact support with the error details

---

**Last Updated:** 2025-01-15
