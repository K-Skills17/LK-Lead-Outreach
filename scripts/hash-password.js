/**
 * Generate bcrypt hash for admin password
 * 
 * Usage: node scripts/hash-password.js "YourPassword123!"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Error: Password required');
  console.log('\nUsage:');
  console.log('  node scripts/hash-password.js "YourPassword123!"');
  process.exit(1);
}

bcrypt.hash(password, 10)
  .then(hash => {
    console.log('\n✅ Password hash generated:');
    console.log(hash);
    console.log('\n💡 Copy this hash and use it in the SQL INSERT statement');
  })
  .catch(error => {
    console.error('❌ Error generating hash:', error);
    process.exit(1);
  });
