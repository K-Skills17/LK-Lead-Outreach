import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateLicenseKey } from '@/lib/license-utils';

export async function POST(request: Request) {
  try {
    const { name, email, phone, clinicName, selectedPlan, billingCycle } = await request.json();
    
    // Validate input
    if (!name || !email || !selectedPlan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const { data: existingClinic } = await supabaseAdmin
      .from('clinics')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (existingClinic) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Generate license key
    const licenseKey = generateLicenseKey();
    
    // Create clinic (user)
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert({
        name,
        email,
        phone,
        clinic_name: clinicName || null,
        license_key: licenseKey,
        tier: selectedPlan,
        verified_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (clinicError) {
      console.error('Clinic creation error:', clinicError);
      throw new Error('Failed to create account');
    }
    
    // Determine amount
    const amount = getSubscriptionAmount(selectedPlan, billingCycle);
    
    // Create subscription
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        clinic_id: clinic.id,
        tier: selectedPlan,
        status: selectedPlan === 'FREE' ? 'active' : 'pending',
        billing_cycle: selectedPlan === 'FREE' ? null : billingCycle,
        amount,
        current_period_start: selectedPlan === 'FREE' ? new Date().toISOString() : null,
        current_period_end: selectedPlan === 'FREE' ? null : null
      });
    
    if (subError) {
      console.error('Subscription error:', subError);
      // Rollback - delete the clinic
      await supabaseAdmin.from('clinics').delete().eq('id', clinic.id);
      throw new Error('Failed to create subscription');
    }
    
    // Generate payment URL if paid plan
    let paymentUrl = null;
    if (selectedPlan !== 'FREE') {
      paymentUrl = generatePaymentLink(selectedPlan, billingCycle, clinic.id);
    }
    
    return NextResponse.json({
      success: true,
      userId: clinic.id,
      licenseKey,
      paymentUrl
    });
    
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function getSubscriptionAmount(plan: string, cycle: string): number {
  if (plan === 'FREE') return 0;
  
  const prices: Record<string, Record<string, number>> = {
    PRO: {
      monthly: 197.00,
      yearly: 2127.00
    },
    PREMIUM: {
      monthly: 497.00,
      yearly: 5367.00
    }
  };
  
  return prices[plan]?.[cycle] || 0;
}

function generatePaymentLink(plan: string, cycle: string, clinicId: string): string {
  const links: Record<string, string> = {
    'PRO_monthly': process.env.NEXT_PUBLIC_PRO_MONTHLY_URL || '',
    'PRO_yearly': process.env.NEXT_PUBLIC_PRO_YEARLY_URL || '',
    'PREMIUM_monthly': process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_URL || '',
    'PREMIUM_yearly': process.env.NEXT_PUBLIC_PREMIUM_YEARLY_URL || '',
  };
  
  const key = `${plan}_${cycle}`;
  const baseUrl = links[key];
  
  if (!baseUrl) {
    console.warn(`No payment URL found for ${key}`);
    return '';
  }
  
  // Add external_reference for webhook tracking
  return `${baseUrl}?external_reference=${clinicId}`;
}
