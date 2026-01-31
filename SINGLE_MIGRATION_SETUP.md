# 🚀 Single Migration Setup - Quick Fix

## ✅ Problem Solved!

I've created **ONE complete migration** that sets up everything in the correct order.

## 🎯 What to Do

### Step 1: Run the Complete Setup Migration

In **Supabase SQL Editor**, run:

```sql
supabase/migrations/000_complete_setup.sql
```

**That's it!** This ONE migration creates:
- ✅ `clinics` table
- ✅ `campaigns` table  
- ✅ `campaign_contacts` table (with CSV fields: nome, empresa, cargo, site, dor_especifica)
- ✅ `sdr_users` table
- ✅ `message_replies` table
- ✅ All indexes, triggers, and policies
- ✅ SDR assignment columns

## ✅ Features

- **Idempotent**: Safe to run multiple times
- **Complete**: Creates everything in one go
- **Ordered**: Creates tables in correct dependency order
- **Defensive**: Checks if columns exist before adding them

## 🔍 Verify It Worked

After running, check:

```sql
-- Should return all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'clinics',
  'campaigns', 
  'campaign_contacts',
  'sdr_users',
  'message_replies'
)
ORDER BY table_name;

-- Should show CSV columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'campaign_contacts'
AND column_name IN ('nome', 'empresa', 'cargo', 'site', 'dor_especifica', 'assigned_sdr_id');
```

## 📋 What This Migration Creates

### Core Tables
1. **clinics** - Company/clinic info
2. **campaigns** - Campaign metadata (with `assigned_sdr_id`)
3. **campaign_contacts** - Leads with CSV fields (with `assigned_sdr_id`)
4. **sdr_users** - SDR accounts for login
5. **message_replies** - WhatsApp reply tracking

### Supporting Tables
- `message_drafts` - Message templates
- `do_not_contact` - Blocklist
- `ai_usage_daily` - AI usage tracking

### All Features Included
- ✅ CSV import fields (nome, empresa, cargo, site, dor_especifica)
- ✅ SDR user accounts
- ✅ SDR assignment to campaigns and leads
- ✅ Message replies tracking
- ✅ All indexes for performance
- ✅ Triggers for auto-updating timestamps
- ✅ Row Level Security policies

## 🎯 Next Steps After Migration

1. **Create first SDR user:**
   ```sql
   -- Generate password hash first, then:
   INSERT INTO sdr_users (email, password_hash, name, role)
   VALUES (
     'sdr1@yourcompany.com',
     '$2b$10$...your_hashed_password...',
     'John Doe',
     'sdr'
   );
   ```

2. **Test the API:**
   - `POST /api/sdr/login` - Login endpoint
   - `GET /api/sdr/dashboard` - Dashboard data

3. **Start using the tool!**

## ⚠️ If You Still Get Errors

If you get any errors, check:

1. **Tables exist?**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **Columns exist?**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'campaign_contacts';
   ```

3. **Foreign key issues?**
   - Make sure `clinics` exists before `campaigns`
   - Make sure `campaigns` exists before `campaign_contacts`
   - The migration handles this automatically!

## ✅ All Fixed!

This single migration replaces all the separate ones and creates everything in the correct order. Just run it once and you're done!
