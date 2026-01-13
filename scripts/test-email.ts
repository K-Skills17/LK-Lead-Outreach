/**
 * Test script to verify Resend email integration
 * Run with: npx tsx scripts/test-email.ts
 */

import { sendFreeLicenseEmail, sendPaidLicenseEmail } from '../lib/email-service';
import { generateLicenseKey } from '../lib/license-utils';

async function testFreeEmail() {
  console.log('\n🧪 Testing FREE license email...\n');
  
  const testData = {
    name: 'João Silva',
    email: 'your-email@example.com', // ← CHANGE THIS TO YOUR EMAIL!
    clinicName: 'Clínica Teste',
    licenseKey: generateLicenseKey(),
    whatsapp: '+5511987654321'
  };

  console.log('📋 Test data:');
  console.log('  Name:', testData.name);
  console.log('  Email:', testData.email);
  console.log('  License Key:', testData.licenseKey);
  console.log('  Clinic:', testData.clinicName);
  console.log('');

  try {
    const result = await sendFreeLicenseEmail(testData);
    
    if (result.success) {
      console.log('✅ FREE license email sent successfully!');
      console.log('📧 Email ID:', result.emailId);
      console.log('');
      console.log('🎯 Next steps:');
      console.log('  1. Check your email inbox:', testData.email);
      console.log('  2. Look for subject: "🎉 Seu Acesso GRATUITO ao LK Reactor Pro está Ativo!"');
      console.log('  3. Verify the license key is displayed correctly');
      console.log('  4. Check that all links work');
      console.log('');
    } else {
      console.error('❌ Failed to send email');
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('  1. Check if RESEND_API_KEY is set in .env.local');
    console.log('  2. Verify API key is valid (starts with "re_")');
    console.log('  3. Check Resend dashboard for errors');
  }
}

async function testPaidEmail() {
  console.log('\n🧪 Testing PAID license email (PRO)...\n');
  
  const testData = {
    name: 'Maria Santos',
    email: 'your-email@example.com', // ← CHANGE THIS TO YOUR EMAIL!
    clinicName: 'Clínica Premium Teste',
    licenseKey: generateLicenseKey(),
    tier: 'PRO' as const,
    amount: 197,
    billingCycle: 'monthly',
    paymentId: 'test_payment_123456'
  };

  console.log('📋 Test data:');
  console.log('  Name:', testData.name);
  console.log('  Email:', testData.email);
  console.log('  License Key:', testData.licenseKey);
  console.log('  Tier:', testData.tier);
  console.log('  Amount:', `R$ ${testData.amount}`);
  console.log('');

  try {
    const result = await sendPaidLicenseEmail(testData);
    
    if (result.success) {
      console.log('✅ PAID license email sent successfully!');
      console.log('📧 Email ID:', result.emailId);
      console.log('');
      console.log('🎯 Next steps:');
      console.log('  1. Check your email inbox:', testData.email);
      console.log('  2. Look for subject: "✅ Pagamento Confirmado - LK Reactor Pro Professional!"');
      console.log('  3. Verify payment details are correct');
      console.log('  4. Check that all links work');
      console.log('');
    } else {
      console.error('❌ Failed to send email');
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 RESEND EMAIL SYSTEM TEST                              ║');
  console.log('║                                                            ║');
  console.log('║   This script will send test emails to verify integration ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check for API key
  if (!process.env.RESEND_API_KEY) {
    console.error('\n❌ ERROR: RESEND_API_KEY not found in environment variables!');
    console.log('\n📝 To fix:');
    console.log('  1. Open .env.local');
    console.log('  2. Add: RESEND_API_KEY=re_your_api_key_here');
    console.log('  3. Save file and run this script again');
    console.log('');
    process.exit(1);
  }

  console.log('\n✅ RESEND_API_KEY found in environment');
  console.log('🔑 API Key:', process.env.RESEND_API_KEY.substring(0, 10) + '...');

  // Ask which test to run
  const args = process.argv.slice(2);
  const testType = args[0] || 'free';

  if (testType === 'free' || testType === 'all') {
    await testFreeEmail();
  }

  if (testType === 'paid' || testType === 'all') {
    await testPaidEmail();
  }

  if (testType === 'premium') {
    const testData = {
      name: 'Carlos Oliveira',
      email: 'your-email@example.com', // ← CHANGE THIS TO YOUR EMAIL!
      clinicName: 'Clínica Elite Teste',
      licenseKey: generateLicenseKey(),
      tier: 'PREMIUM' as const,
      amount: 497,
      billingCycle: 'monthly',
      paymentId: 'test_payment_789012'
    };

    console.log('\n🧪 Testing PAID license email (PREMIUM)...\n');
    console.log('📋 Test data:');
    console.log('  Name:', testData.name);
    console.log('  Email:', testData.email);
    console.log('  Tier:', testData.tier);
    console.log('  Amount:', `R$ ${testData.amount}`);
    console.log('');

    try {
      const result = await sendPaidLicenseEmail(testData);
      
      if (result.success) {
        console.log('✅ PREMIUM license email sent successfully!');
        console.log('📧 Email ID:', result.emailId);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('✅ Test completed!');
  console.log('');
  console.log('📊 Check results:');
  console.log('  • Your email inbox');
  console.log('  • Resend dashboard: https://resend.com/emails');
  console.log('');
  console.log('🎯 Usage:');
  console.log('  npx tsx scripts/test-email.ts         # Test FREE email');
  console.log('  npx tsx scripts/test-email.ts paid    # Test PAID (PRO) email');
  console.log('  npx tsx scripts/test-email.ts premium # Test PREMIUM email');
  console.log('  npx tsx scripts/test-email.ts all     # Test all emails');
  console.log('════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
