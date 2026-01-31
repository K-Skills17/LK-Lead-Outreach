# 📋 Database Migration Order

## ⚠️ Important: Run Migrations in Order!

The migrations must be run in this specific order to avoid errors.

## ✅ Correct Order

### 1. Base Schema (Required First)
```sql
-- Run: 001_initial_schema.sql
```
**Creates:**
- `clinics` table
- `campaigns` table
- `campaign_contacts` table ⭐ (needed by later migrations)
- `message_drafts` table
- `do_not_contact` table
- `ai_usage_daily` table

### 2. Analytics (Optional)
```sql
-- Run: 003_analytics_tracking.sql
-- Run: 004_analytics_functions.sql
```

### 3. Admin Users (Optional)
```sql
-- Run: 005_admin_users.sql
```

### 4. Subscriptions (Optional - for payment features)
```sql
-- Run: 006_subscriptions_and_usage.sql
-- Run: 007_subscription_upgrades.sql
```

### 5. Lead Outreach Schema Updates
```sql
-- Run: 008_update_lead_outreach_schema.sql
```
**Adds CSV fields to `campaign_contacts`:**
- `nome`
- `empresa`
- `cargo`
- `site`
- `dor_especifica`

### 6. Enrichment Tool Integration (Optional)
```sql
-- Run: 009_enrichment_tool_integration.sql
```

### 7. SDR Users and Auth ⭐
```sql
-- Run: 010_sdr_users_and_auth.sql
```
**Requires:** `campaigns` and `campaign_contacts` tables (from step 1)

## 🚀 Quick Setup (Minimum Required)

If you just want the basic functionality:

```sql
1. 001_initial_schema.sql          -- Base tables
2. 008_update_lead_outreach_schema.sql  -- CSV fields
3. 010_sdr_users_and_auth.sql     -- SDR accounts
```

## 🔧 If You Get "Table Does Not Exist" Error

**Error:** `relation "campaign_contacts" does not exist`

**Solution:**
1. Make sure you ran `001_initial_schema.sql` first
2. Check if the table exists:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'campaign_contacts';
   ```
3. If it doesn't exist, run `001_initial_schema.sql` first

## 📝 How to Run Migrations in Supabase

1. Go to **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy and paste the migration SQL
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for "Success" message
7. Move to next migration

## ✅ Verify Migration Success

After running each migration, verify it worked:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if SDR users table exists
SELECT * FROM sdr_users LIMIT 1;

-- Check if campaign_contacts has new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'campaign_contacts';
```

## 🎯 Recommended Migration Sequence

For the **LK Lead Outreach** internal tool:

```sql
✅ 001_initial_schema.sql
✅ 008_update_lead_outreach_schema.sql
✅ 010_sdr_users_and_auth.sql
```

That's it! These 3 migrations give you:
- ✅ All base tables
- ✅ CSV import fields (nome, empresa, cargo, site, dor_especifica)
- ✅ SDR user accounts and authentication
- ✅ Message replies tracking

## ⚠️ Common Issues

### Issue 1: Foreign Key Constraint Error
**Error:** `foreign key constraint "xxx" cannot be created`

**Solution:** Make sure parent table exists. Run migrations in order.

### Issue 2: Column Already Exists
**Error:** `column "xxx" already exists`

**Solution:** Migration uses `IF NOT EXISTS`, so this shouldn't happen. If it does, the column already exists - you can skip that part.

### Issue 3: Policy Already Exists
**Error:** `policy "xxx" already exists`

**Solution:** Drop the policy first:
```sql
DROP POLICY IF EXISTS "xxx" ON table_name;
```

## 📚 Migration Dependencies

```
001_initial_schema.sql
  ├── 003_analytics_tracking.sql (depends on: clinics)
  ├── 004_analytics_functions.sql (depends on: analytics tables)
  ├── 005_admin_users.sql (independent)
  ├── 006_subscriptions_and_usage.sql (depends on: clinics)
  ├── 007_subscription_upgrades.sql (depends on: subscriptions)
  ├── 008_update_lead_outreach_schema.sql (depends on: campaign_contacts)
  ├── 009_enrichment_tool_integration.sql (depends on: campaign_contacts)
  └── 010_sdr_users_and_auth.sql (depends on: campaigns, campaign_contacts)
```

## ✅ After Running All Migrations

1. ✅ Verify tables exist
2. ✅ Create first SDR user (see `SDR_ACCOUNTS_SETUP.md`)
3. ✅ Test login endpoint: `POST /api/sdr/login`
4. ✅ Test dashboard: `GET /api/sdr/dashboard`

---

**Need help?** Check the error message and make sure you ran the base migration (`001_initial_schema.sql`) first!
