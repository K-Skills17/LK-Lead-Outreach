/**
 * Create Admin User via API
 * This ensures password is hashed correctly using the same method as the app
 * 
 * Usage: node scripts/create-admin-api.js
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Read .env.local manually
function getEnvVar(name) {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith(`${name}=`)) {
          return line.split('=')[1].trim();
        }
      }
    }
  } catch (error) {
    // Ignore
  }
  return null;
}

async function createAdmin() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise(resolve => readline.question(query, resolve));

  try {
    console.log('\n🔐 Create Admin User\n');
    
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');
    const name = await question('Enter admin name (or press Enter for "Admin"): ') || 'Admin';

    // Generate password hash using bcryptjs (same as the app uses)
    console.log('\n⏳ Generating password hash...');
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('\n📋 Admin Details:');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Password Hash: ${passwordHash}`);
    
    // Check if we can use the setup API
    const setupToken = getEnvVar('ADMIN_SETUP_TOKEN');
    
    if (setupToken) {
      console.log('\n🚀 Attempting to create via API...');
      
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('http://localhost:3000/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setupToken,
          email,
          password,
          name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('\n✅ Admin user created successfully via API!');
        console.log('\n📝 Login Credentials:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: [the password you entered]`);
        console.log('\n💡 Access: http://localhost:3000/admin');
        readline.close();
        return;
      } else {
        console.log('\n⚠️ API creation failed:', result.error);
        console.log('   Falling back to SQL method...\n');
      }
    } else {
      console.log('\n⚠️ ADMIN_SETUP_TOKEN not found in .env.local');
      console.log('   Using SQL method...\n');
    }

    // Provide SQL
    console.log('📝 SQL Method:');
    console.log('='.repeat(60));
    console.log('\n1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run this SQL:\n');
    
    const sql = `-- Create admin_users table if it doesn't exist
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

-- Create policy (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'admin_users' 
    AND policyname = 'Service role can manage admin_users'
  ) THEN
    CREATE POLICY "Service role can manage admin_users" ON admin_users FOR ALL USING (true);
  END IF;
END $$;

-- Create index (if not exists)
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Insert your admin user
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  '${email}',
  '${passwordHash}',
  '${name}'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;`;

    console.log(sql);
    console.log('\n3. After running SQL, login at: http://localhost:3000/admin');
    console.log(`   Email: ${email}`);
    console.log(`   Password: [the password you entered]`);
    
    readline.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    readline.close();
    process.exit(1);
  }
}

createAdmin();
