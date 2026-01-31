# ⚡ Quick Migration Fix

## ✅ Problem Solved

The migration now uses `IF NOT EXISTS` so it's **safe to run multiple times**.

## 🚀 What to Do Now

Since your tables already exist, you can:

### Option 1: Skip Base Migration (Recommended)
Since `campaigns` and `campaign_contacts` already exist, just run:

```sql
-- Run this migration:
supabase/migrations/008_update_lead_outreach_schema.sql
supabase/migrations/010_sdr_users_and_auth.sql
```

### Option 2: Re-run Base Migration (Safe Now)
The base migration is now idempotent (safe to rerun):

```sql
-- This will now work even if tables exist:
supabase/migrations/001_initial_schema.sql
```

## ✅ Verify What You Have

Check which tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('campaigns', 'campaign_contacts', 'sdr_users')
ORDER BY table_name;
```

## 📋 Recommended Next Steps

1. **Check if `campaign_contacts` has CSV fields:**
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'campaign_contacts'
   AND column_name IN ('nome', 'empresa', 'cargo', 'site', 'dor_especifica');
   ```

2. **If CSV fields are missing, run:**
   ```sql
   supabase/migrations/008_update_lead_outreach_schema.sql
   ```

3. **Then run SDR migration:**
   ```sql
   supabase/migrations/010_sdr_users_and_auth.sql
   ```

## 🎯 Quick Check Script

Run this to see what you have:

```sql
-- Check base tables
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') 
    THEN '✅ campaigns exists' 
    ELSE '❌ campaigns missing' 
  END as campaigns_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_contacts') 
    THEN '✅ campaign_contacts exists' 
    ELSE '❌ campaign_contacts missing' 
  END as contacts_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sdr_users') 
    THEN '✅ sdr_users exists' 
    ELSE '❌ sdr_users missing' 
  END as sdr_status;
```

## ✅ All Fixed!

The migrations are now **idempotent** - you can run them multiple times without errors!
