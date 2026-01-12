# ⚡ Quick Admin Setup (TL;DR)

## 1. Run This SQL in Supabase:

```sql
-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage admin_users" ON admin_users FOR ALL USING (true);
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Insert your admin user
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
```

## 2. Login:

- **URL**: `/admin`
- **Email**: contato@lkdigital.org
- **Password**: K5h3s2#195962

## 3. Done! 🎉

You can now access the full analytics dashboard.

---

**Need help?** Read full guide: `ADMIN_LOGIN_SETUP.md`
