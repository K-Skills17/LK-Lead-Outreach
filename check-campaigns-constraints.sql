-- Check all constraints on campaigns table
-- Run this in Supabase SQL Editor

-- 1. Check all columns and their constraints
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

-- 2. Check CHECK constraints
SELECT 
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'campaigns'
AND con.contype = 'c'; -- 'c' = CHECK constraint

-- 3. Check NOT NULL constraints
SELECT 
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 4. Check foreign key constraints
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'campaigns';

-- 5. Show a sample of existing campaigns to see what values are used
SELECT 
  id,
  name,
  status,
  keyword,
  location,
  clinic_id,
  created_at
FROM campaigns
ORDER BY created_at DESC
LIMIT 5;
