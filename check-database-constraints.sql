-- Check Database Constraints and RLS for campaign_contacts
-- Run this in Supabase SQL Editor to diagnose lead insertion issues

-- 1. Check if RLS is enabled (should be DISABLED for campaign_contacts)
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'campaign_contacts';

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'campaign_contacts'
ORDER BY ordinal_position;

-- 3. Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'campaign_contacts';

-- 4. Check if campaigns exist
SELECT 
  id,
  name,
  status,
  created_at
FROM campaigns
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check if clinics exist
SELECT 
  id,
  email,
  clinic_name,
  tier
FROM clinics
LIMIT 5;

-- 6. Check current leads count
SELECT COUNT(*) as total_leads FROM campaign_contacts;

-- 7. Check recent leads
SELECT 
  id,
  nome,
  empresa,
  phone,
  campaign_id,
  status,
  created_at
FROM campaign_contacts
ORDER BY created_at DESC
LIMIT 10;

-- 8. Test insert (will fail if there's a constraint issue)
-- Uncomment to test:
/*
INSERT INTO campaign_contacts (
  campaign_id,
  name,
  nome,
  empresa,
  phone,
  status
) VALUES (
  (SELECT id FROM campaigns LIMIT 1),
  'Test Lead',
  'Test Lead',
  'Test Company',
  '+5511999999999',
  'pending'
) RETURNING id;
*/
