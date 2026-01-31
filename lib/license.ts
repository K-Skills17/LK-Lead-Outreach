/**
 * License Verification Module
 * 
 * Handles license key validation through Google Apps Script endpoint
 * and upserts clinic data into Supabase after successful verification.
 */

import { supabaseAdmin } from './supabaseAdmin';

export interface LicenseVerificationResponse {
  valid: boolean;
  tier?: 'FREE' | 'PRO' | 'PREMIUM';
  dailyLimit?: number;
  daysRemaining?: number;
  clinicId?: string;
  error?: string;
}

export interface AppsScriptResponse {
  valid: boolean;
  tier?: 'FREE' | 'PRO' | 'PREMIUM';
  daily_limit?: number;
  days_remaining?: number;
  error?: string;
  // Additional fields from Apps Script
  latest_version?: string;
  update_url?: string;
  force_update?: boolean;
}

/**
 * Verify a license key through Google Apps Script endpoint
 * and upsert clinic data into Supabase if valid
 * 
 * @param licenseKey - The license key to verify
 * @param email - Optional email address
 * @returns License verification response with clinic ID
 */
export async function verifyLicense(
  licenseKey: string,
  email?: string
): Promise<LicenseVerificationResponse> {
  const endpoint = process.env.LICENSE_VERIFY_ENDPOINT;

  if (!endpoint) {
    console.error('[LICENSE] LICENSE_VERIFY_ENDPOINT not configured');
    return {
      valid: false,
      error: 'License verification endpoint not configured',
    };
  }

  try {
    // Call Google Apps Script endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        license_key: licenseKey,
        email: email || '',
        current_version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('[LICENSE] Apps Script returned error:', response.status);
      return {
        valid: false,
        error: `License verification failed: ${response.statusText}`,
      };
    }

    const data: AppsScriptResponse = await response.json();

    if (!data.valid) {
      return {
        valid: false,
        error: data.error || 'License key is invalid',
      };
    }

    // Upsert clinic into Supabase
    const clinicData = {
      license_key: licenseKey,
      email: email || '',
      tier: data.tier || 'FREE',
      verified_at: new Date().toISOString(),
    };

    const { data: clinic, error: dbError } = await supabaseAdmin
      .from('clinics')
      .upsert(clinicData, {
        onConflict: 'license_key',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[LICENSE] Failed to upsert clinic:', dbError);
      return {
        valid: false,
        error: 'Failed to save clinic data',
      };
    }

    return {
      valid: true,
      tier: data.tier || 'FREE',
      dailyLimit: data.daily_limit || (data.tier === 'FREE' ? 10 : 9999),
      daysRemaining: data.days_remaining,
      clinicId: clinic.id,
    };
  } catch (error) {
    console.error('[LICENSE] Error verifying license:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get clinic ID by license key from Supabase
 * 
 * @param licenseKey - The license key
 * @returns Clinic ID or null if not found
 */
export async function getClinicByLicense(
  licenseKey: string
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('clinics')
      .select('id')
      .eq('license_key', licenseKey)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('[LICENSE] Error getting clinic:', error);
    return null;
  }
}

/**
 * Verify license and get clinic ID
 * Helper function that combines verification and clinic lookup
 * 
 * @param licenseKey - The license key to verify
 * @param email - Optional email address
 * @returns Object with valid status, tier, and clinicId
 */
/**
 * Verify and get clinic (INTERNAL TOOL - No license verification needed)
 * 
 * For internal tool, we just check if clinic exists or create a default one
 */
export async function verifyAndGetClinic(
  licenseKey: string,
  email?: string
): Promise<{
  valid: boolean;
  tier?: 'FREE' | 'PRO' | 'PREMIUM';
  clinicId?: string;
  error?: string;
}> {
  // For internal tool, license key is optional
  // If provided, check if clinic exists, otherwise create default
  
  if (licenseKey) {
    const existingClinicId = await getClinicByLicense(licenseKey);
    
    if (existingClinicId) {
      const { data: clinic } = await supabaseAdmin
        .from('clinics')
        .select('tier')
        .eq('id', existingClinicId)
        .single();

      return {
        valid: true,
        tier: clinic?.tier || 'FREE',
        clinicId: existingClinicId,
      };
    }
  }

  // For internal tool, create a default clinic if needed
  // Or return valid with a default clinic ID
  // This allows the tool to work without license verification
  return {
    valid: true,
    tier: 'FREE',
    clinicId: null, // Will be created on first use
    error: undefined,
  };
}
