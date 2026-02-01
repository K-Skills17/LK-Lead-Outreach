# 🔍 Troubleshooting: Leads Not Showing in Admin Dashboard

## Problem
You sent leads to the outreach app, got a success message, but can't see them in the admin dashboard.

---

## Quick Diagnosis

Run the diagnostic script:

```powershell
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\diagnose-leads-not-showing.ps1
```

This will check:
- ✅ If server is running
- ✅ If API is responding
- ✅ How many leads are in the response
- ✅ If campaigns exist

---

## Common Causes & Solutions

### 1. **Leads Not Saved to Database**

**Check:**
- Go to Supabase Dashboard → Table Editor → `campaign_contacts`
- See if leads exist there

**If leads are missing:**
- Check server logs (`npm run dev` output)
- Look for errors when sending leads
- Verify the integration token is correct

**Solution:**
- Check the response from `/api/integration/leads/receive`
- Look for `created` vs `updated` counts
- Verify the lead data format matches the schema

---

### 2. **RLS (Row Level Security) Blocking Access**

**Check:**
- Supabase Dashboard → Authentication → Policies
- Check `campaign_contacts` table policies

**Solution:**
- Ensure service role key has access
- Check if policies allow reading from `campaign_contacts`
- Run this SQL in Supabase:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'campaign_contacts';

-- If RLS is enabled, ensure service role can read
-- (Should already be set in migration, but verify)
```

---

### 3. **Campaign Foreign Key Issue**

**Check:**
- Leads need a valid `campaign_id`
- Check if campaign was created when lead was sent

**Solution:**
- Verify campaign exists in `campaigns` table
- Check if `campaign_name` in lead data matches an existing campaign
- If campaign doesn't exist, it should be auto-created

---

### 4. **Query Error (Silent Failure)**

**Check:**
- Server logs for errors
- Browser console (F12) for API errors
- Network tab in browser dev tools

**Solution:**
- The API now logs more details
- Check `npm run dev` output for `[Admin Overview]` messages
- Look for any error messages

---

### 5. **Frontend Not Refreshing**

**Check:**
- Are you on the "Leads" tab?
- Did you refresh the page?
- Check browser console for errors

**Solution:**
1. Refresh the page (F5)
2. Check browser console (F12) for errors
3. Try logging out and back in
4. Clear browser cache

---

## Step-by-Step Debugging

### Step 1: Verify Leads Were Saved

```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  nome,
  empresa,
  phone,
  status,
  campaign_id,
  created_at
FROM campaign_contacts
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** You should see the leads you just sent.

---

### Step 2: Check Campaigns

```sql
-- Run in Supabase SQL Editor
SELECT 
  id,
  name,
  status,
  created_at
FROM campaigns
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** You should see campaigns (auto-created if not specified).

---

### Step 3: Test API Directly

```powershell
# Get your token from .env.local
$token = "YOUR_ADMIN_DASHBOARD_TOKEN"

$headers = @{
    "Authorization" = "Bearer $token"
}

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/overview" `
    -Method GET `
    -Headers $headers

# Check leads count
Write-Host "Total Leads: $($response.stats.totalLeads)"
Write-Host "Leads in array: $($response.leads.Count)"

# Show first lead
if ($response.leads.Count -gt 0) {
    $response.leads[0] | ConvertTo-Json
}
```

**Expected:** Should return leads if they exist in database.

---

### Step 4: Check Server Logs

When you load the admin dashboard, check the terminal where `npm run dev` is running.

Look for:
```
[Admin Overview] Successfully fetched X leads
```

Or errors like:
```
[Admin Overview] Error fetching leads: ...
```

---

## Common Issues

### Issue: "Leads exist in database but not in API response"

**Cause:** RLS policy or query error

**Fix:**
1. Check RLS policies on `campaign_contacts`
2. Verify service role key is correct
3. Check server logs for query errors

---

### Issue: "API returns leads but dashboard shows 0"

**Cause:** Frontend issue

**Fix:**
1. Check browser console (F12)
2. Verify you're on the "Leads" tab
3. Check if `data.leads` is populated in React state
4. Refresh the page

---

### Issue: "Success message but leads not saved"

**Cause:** Error during save (foreign key, validation, etc.)

**Fix:**
1. Check server logs when sending leads
2. Verify campaign was created
3. Check phone number format (must be E.164)
4. Verify required fields are present

---

## Verification Checklist

- [ ] Leads exist in `campaign_contacts` table (Supabase)
- [ ] Campaigns exist in `campaigns` table
- [ ] API `/api/admin/overview` returns leads
- [ ] Server logs show no errors
- [ ] Browser console shows no errors
- [ ] You're on the "Leads" tab in dashboard
- [ ] Page was refreshed after sending leads

---

## Still Not Working?

1. **Run diagnostic script:**
   ```powershell
   & .\diagnose-leads-not-showing.ps1
   ```

2. **Check Supabase directly:**
   - Table Editor → `campaign_contacts`
   - Verify leads are there

3. **Check server logs:**
   - Look for errors when sending leads
   - Look for errors when loading dashboard

4. **Share the output:**
   - Diagnostic script output
   - Server logs
   - Browser console errors (if any)

---

## Quick Fixes

### Fix 1: Refresh Dashboard
```javascript
// In browser console (F12)
location.reload()
```

### Fix 2: Clear Cache
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Or clear browser cache

### Fix 3: Re-authenticate
- Log out of admin dashboard
- Log back in
- This refreshes the token

---

**Most Common Solution:** Leads are saved but dashboard needs refresh, or you're not on the "Leads" tab!
