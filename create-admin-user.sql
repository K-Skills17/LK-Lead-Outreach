-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Enable RLS (safe to run multiple times)
DO $$
BEGIN
  ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

-- Create policy (if not exists) - Fixed syntax
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_users'
    AND policyname = 'Service role can manage admin_users'
  ) THEN
    CREATE POLICY "Service role can manage admin_users" ON admin_users FOR ALL USING (true);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

-- Create index (if not exists)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert or update admin user
-- Note: Fixed email typo (lkdigtial -> lkdigital)
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

-- Verify the admin user was created/updated
SELECT 
  email, 
  name, 
  LEFT(password_hash, 15) as hash_preview,
  created_at
FROM admin_users
WHERE email = 'contato@lkdigital.org';
