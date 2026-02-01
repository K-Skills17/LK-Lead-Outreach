# 🚨 Immediate Action Required

## Two Issues to Fix

1. **Leads not showing** in admin dashboard
2. **UI changes not visible** (Assign buttons)

---

## 🔍 Step 1: Diagnose the Problem

### Run This Script:

```powershell
cd "C:\dev\LK Lead Outreach\LK-Lead-Outreach"
& .\comprehensive-lead-diagnosis.ps1
```

**This will show you:**
- ✅ If leads are being created
- ✅ If leads exist in database
- ✅ If API is returning leads
- ✅ Exact error messages

---

## 🗄️ Step 2: Check Database

### Go to Supabase Dashboard:

1. **Table Editor** → `campaign_contacts`
2. **Are there any rows?**
   - ✅ **YES** → Problem is in API/frontend
   - ❌ **NO** → Problem is in lead insertion

### If NO rows:

**Check Vercel Logs:**
1. Go to **Vercel Dashboard**
2. Your project → **Logs**
3. Look for `[Integration]` messages
4. **Share the error messages you see**

---

## 🎨 Step 3: Fix UI Not Showing

### Try These (in order):

1. **Hard Refresh:**
   - Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
   - This clears browser cache

2. **Check You're on Right Tab:**
   - Click **"Leads"** tab (not "Overview")
   - Assign buttons only appear in "Leads" tab

3. **Check Browser Console:**
   - Press `F12`
   - Go to **Console** tab
   - Look for red errors
   - **Share any errors you see**

4. **Verify Deployment:**
   - Go to **Vercel Dashboard** → **Deployments**
   - Is the latest deployment **successful**?
   - Check build logs for errors

---

## 🐛 Step 4: Check Server Logs

### If Using Vercel:

1. **Vercel Dashboard** → Your Project → **Logs**
2. Filter for: `[Integration]`
3. Look for:
   - `❌ Error inserting lead:`
   - `✅ Created lead`

### If Using Local Dev:

1. Check terminal where `npm run dev` is running
2. Look for `[Integration]` messages
3. **Share the error messages**

---

## 🔧 Most Likely Issues

### For Leads Not Showing:

1. **RLS blocking inserts** (should be disabled)
2. **Campaign creation failing** (check logs)
3. **Foreign key constraint** (invalid campaign_id)
4. **Missing required field** (check table structure)

### For UI Not Visible:

1. **Browser cache** (hard refresh needed)
2. **Deployment failed** (check Vercel)
3. **Wrong tab** (must be "Leads" tab)
4. **JavaScript error** (check console)

---

## 📋 Quick Checklist

- [ ] Run `comprehensive-lead-diagnosis.ps1`
- [ ] Check Supabase → Table Editor → `campaign_contacts`
- [ ] Check Vercel/server logs for `[Integration]` errors
- [ ] Hard refresh admin dashboard (Ctrl+Shift+R)
- [ ] Verify you're on "Leads" tab
- [ ] Check browser console (F12) for errors
- [ ] Verify Vercel deployment succeeded

---

## 🎯 What I Need From You

To fix this quickly, please share:

1. **Output of `comprehensive-lead-diagnosis.ps1`**
2. **Screenshot of Supabase Table Editor** showing `campaign_contacts` table
3. **Vercel logs** (filter for `[Integration]`)
4. **Browser console errors** (F12 → Console)
5. **Vercel deployment status** (succeeded/failed)

---

## ⚡ Quick Test

Send a test lead and immediately check:

1. **API Response** - Does it say `created: 1`?
2. **Server Logs** - Any `[Integration]` errors?
3. **Database** - Does lead appear in `campaign_contacts`?
4. **Admin Dashboard** - Does it appear after refresh?

**The diagnostic script does all of this automatically!**

---

**Run the diagnostic first - it will tell us exactly what's wrong! 🚀**
