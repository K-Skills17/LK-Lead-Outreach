-- SIMPLE VERSION - Just the essential parts
-- Run this if the full version gives errors

-- Ensure table exists
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy (drop first if exists to avoid errors)
DROP POLICY IF EXISTS "Service role can manage admin_users" ON admin_users;
CREATE POLICY "Service role can manage admin_users" ON admin_users FOR ALL USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert or update admin user
-- Fixed email: contato@lkdigital.org (was lkdigtial.org)
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'contato@lkdigital.org',
  '$2b$10$tCJYsHM59S99grF4exGvtuFD6z39Mt/FgGisZVw3tVIqDKz7hoqFy',  
  'stephen k'
)
ON CONFLICT (email)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;

-- Verify
SELECT 
  email, 
  name, 
  LEFT(password_hash, 15) as hash_preview,
  created_at
FROM admin_users
WHERE email = 'contato@lkdigital.org';
