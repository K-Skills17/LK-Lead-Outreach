/**
 * Setup Admin User Script
 * Run this once to create the admin user in Supabase
 * 
 * Usage: node scripts/setup-admin.js
 */

const bcrypt = require('bcryptjs');

// Admin credentials
const ADMIN_EMAIL = 'contato@lkdigital.org';
const ADMIN_PASSWORD = 'K5h3s2#195962';
const ADMIN_NAME = 'Admin LK Digital';

async function generatePasswordHash() {
  console.log('🔐 Generating password hash...\n');
  
  const saltRounds = 10;
  const hash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
  
  console.log('✅ Password hash generated successfully!\n');
  console.log('📋 Copy this SQL and run it in Supabase SQL Editor:\n');
  console.log('─'.repeat(80));
  console.log(`
-- Insert Admin User
INSERT INTO admin_users (email, password_hash, name)
VALUES (
  '${ADMIN_EMAIL}',
  '${hash}',
  '${ADMIN_NAME}'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name;
  `);
  console.log('─'.repeat(80));
  console.log('\n✨ Admin user will be created with:');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Name: ${ADMIN_NAME}\n`);
  
  // Test the hash
  const isValid = await bcrypt.compare(ADMIN_PASSWORD, hash);
  console.log(`🧪 Password verification test: ${isValid ? '✅ PASSED' : '❌ FAILED'}\n`);
}

generatePasswordHash().catch(console.error);
