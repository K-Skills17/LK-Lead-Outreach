# 🔧 Fix: Leads Not Showing & UI Changes Not Visible

## Problem Summary

1. **Leads not showing** - Even after sending leads successfully
2. **UI changes not visible** - Admin dashboard improvements not appearing

---

## 🔍 Step 1: Run Comprehensive Diagnosis

```powershell
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\comprehensive-lead-diagnosis.ps1
```

This will:
- ✅ Test lead insertion
- ✅ Check API responses
- ✅ Query database directly
- ✅ Show exact errors

---

## 🗄️ Step 2: Check Database Directly

### Option A: Supabase Dashboard

1. Go to **Supabase Dashboard**
2. Navigate to **Table Editor**
3. Check `campaign_contacts` table
4. **Are leads there?**
   - ✅ **YES** → Problem is in API query or frontend
   - ❌ **NO** → Problem is in lead insertion

### Option B: Run SQL Check

Run `check-database-constraints.sql` in Supabase SQL Editor to check:
- RLS status
- Table structure
- Foreign key constraints
- Existing campaigns/clinics

---

## 🐛 Step 3: Check Server Logs

When you send a lead, check the **Vercel logs** or **local server logs** (`npm run dev`):

Look for:
```
[Integration] ❌ Error inserting lead: ...
[Integration] Lead data: ...
[Integration] Campaign ID: ...
```

**These logs will tell you EXACTLY what's wrong!**

---

## 🔧 Common Fixes

### Fix 1: RLS Blocking Inserts

**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT rowsecurity FROM pg_tables 
WHERE tablename = 'campaign_contacts';
```

**If `true` (RLS enabled):**
```sql
-- Disable RLS (should be disabled for service role access)
ALTER TABLE campaign_contacts DISABLE ROW LEVEL SECURITY;
```

### Fix 2: Missing Campaign

**Check:**
```sql
SELECT id, name FROM campaigns LIMIT 5;
```

**If no campaigns:**
- The lead insertion should auto-create campaigns
- Check server logs for campaign creation errors

### Fix 3: Foreign Key Constraint

**Check:**
- Does `campaign_id` exist in `campaigns` table?
- Is `clinic_id` valid when creating campaigns?

### Fix 4: Required Field Missing

**Check table structure:**
```sql
SELECT column_name, is_nullable 
FROM information_schema.columns
WHERE table_name = 'campaign_contacts'
AND is_nullable = 'NO';
```

**Required fields:**
- `campaign_id` (NOT NULL)
- `name` (NOT NULL)
- `phone` (NOT NULL)
- `status` (NOT NULL, default 'pending')

---

## 🎨 Fix 5: UI Changes Not Visible

### Check 1: Hard Refresh

1. Open admin dashboard
2. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. This clears cache and reloads

### Check 2: Verify Deployment

1. Go to **Vercel Dashboard**
2. Check **Deployments**
3. Verify latest deployment is **successful**
4. Check deployment **build logs** for errors

### Check 3: Check Browser Console

1. Open admin dashboard
2. Press `F12` (Developer Tools)
3. Go to **Console** tab
4. Look for JavaScript errors

### Check 4: Verify You're on Correct Tab

- The "Assign" button only appears in the **"Leads"** tab
- Make sure you click on **"Leads"** tab (not "Overview")

---

## 🚀 Quick Test

### Test Lead Insertion

```powershell
& .\test-lead-insert.ps1
```

This will:
- Send a test lead
- Show the exact response
- Display any errors

### Test Admin API

```powershell
& .\diagnose-leads-not-showing.ps1
```

This will:
- Check if API returns leads
- Show stats
- Compare with database

---

## 📋 Diagnostic Checklist

- [ ] Run `comprehensive-lead-diagnosis.ps1`
- [ ] Check Supabase Table Editor → `campaign_contacts`
- [ ] Check Vercel/server logs for `[Integration]` messages
- [ ] Verify RLS is disabled on `campaign_contacts`
- [ ] Check if campaigns exist
- [ ] Hard refresh admin dashboard (Ctrl+Shift+R)
- [ ] Verify you're on "Leads" tab
- [ ] Check browser console (F12) for errors
- [ ] Verify Vercel deployment succeeded

---

## 🎯 Most Likely Causes

### For Leads Not Showing:

1. **RLS enabled** (should be disabled)
2. **Campaign creation failing** (check logs)
3. **Foreign key constraint** (campaign_id invalid)
4. **Silent insert failure** (now we log errors, check logs!)

### For UI Not Visible:

1. **Browser cache** (hard refresh needed)
2. **Deployment failed** (check Vercel)
3. **Wrong tab** (must be on "Leads" tab)
4. **JavaScript error** (check browser console)

---

## 🔍 What to Share

If still not working, share:

1. **Output of `comprehensive-lead-diagnosis.ps1`**
2. **Vercel build logs** (if deployment failed)
3. **Server logs** when sending a lead
4. **Browser console errors** (F12)
5. **Supabase Table Editor screenshot** (showing campaign_contacts)

---

## ✅ Expected Behavior

After fixes:

1. **Sending a lead:**
   - API returns `{ created: 1, ... }`
   - Server logs show `[Integration] ✅ Created lead ...`
   - Lead appears in Supabase `campaign_contacts` table

2. **Admin Dashboard:**
   - "Leads" tab shows all leads
   - Each lead has an "Assign" button
   - Can select multiple and assign to SDR

---

**Run the diagnostic scripts first - they'll tell you exactly what's wrong!**
