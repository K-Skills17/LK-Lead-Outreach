import crypto from 'crypto';

/**
 * Generate a unique license key
 * Format: LKRP-XXXX-XXXX-XXXX
 * Example: LKRP-A3F9-B2E1-C8D4
 */
export function generateLicenseKey(): string {
  const prefix = 'LKRP';
  const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${randomBytes.substring(0,4)}-${randomBytes.substring(4,8)}-${randomBytes.substring(8,12)}`;
}

/**
 * Validate license key format
 * Returns true if format is correct: LKRP-XXXX-XXXX-XXXX
 */
export function isValidLicenseKeyFormat(licenseKey: string): boolean {
  const pattern = /^LKRP-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  return pattern.test(licenseKey);
}

/**
 * Mask license key for display (show only first and last segments)
 * Example: LKRP-A3F9-B2E1-C8D4 → LKRP-****-****-C8D4
 */
export function maskLicenseKey(licenseKey: string): string {
  if (!licenseKey || licenseKey.length < 19) return '****-****-****-****';
  
  const parts = licenseKey.split('-');
  if (parts.length !== 4) return '****-****-****-****';
  
  return `${parts[0]}-****-****-${parts[3]}`;
}
