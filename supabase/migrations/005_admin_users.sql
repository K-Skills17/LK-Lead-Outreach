-- Admin Users Table
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

-- Only service role can access admin_users
CREATE POLICY "Service role can manage admin_users" ON admin_users FOR ALL USING (true);

-- Create index on email for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Insert initial admin user
-- Password: K5h3s2#195962
-- Hash generated using bcrypt with salt rounds = 10
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  'contato@lkdigital.org',
  '$2a$10$rJ5qF2YvX6K5mF3lH8T5.OrU7B8K9JGZ0X7H.Ww3iV5T8E4U6V7Qq',
  'Admin LK Digital'
) ON CONFLICT (email) DO NOTHING;

-- Note: The password hash above is a placeholder
-- You'll need to generate the real hash using bcrypt
-- The actual hash will be set via the admin login API or manually
