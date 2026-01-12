-- Simple fix: Just insert the admin user
-- Run this in Supabase SQL Editor

INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'contato@lkdigital.org',
  '$2b$10$i8mvMn2XPOH314J2HYfVqueN8Fu0AqHTW0V60PiKA9N53tz9zefAC',
  'Admin LK Digital'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;

-- Verify the user was created
SELECT email, name, created_at FROM admin_users WHERE email = 'contato@lkdigital.org';
