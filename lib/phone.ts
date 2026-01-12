/**
 * Phone Number Normalization Module
 * 
 * Handles Brazilian phone number validation and conversion to E.164 format.
 * E.164 format: +5511987654321 (country code + area code + number)
 */

/**
 * Normalize a Brazilian phone number to E.164 format
 * 
 * Accepts various formats:
 * - 11987654321 (11 digits)
 * - 1187654321 (10 digits, adds 9)
 * - 5511987654321 (with country code)
 * - +5511987654321 (already E.164)
 * - (11) 98765-4321 (formatted)
 * - 11 98765-4321 (formatted with space)
 * 
 * @param phone - Phone number in any BR format
 * @returns Phone number in E.164 format (+5511987654321)
 * @throws Error if phone number is invalid
 */
export function normalizePhone(phone: string): string {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Remove leading country code if present (55)
  if (cleaned.startsWith('55')) {
    cleaned = cleaned.slice(2);
  }

  // Validate length (should be 10 or 11 digits after removing country code)
  if (cleaned.length < 10 || cleaned.length > 11) {
    throw new Error(
      `Invalid phone number length: ${cleaned.length} digits. Expected 10 or 11 digits.`
    );
  }

  // Extract area code (first 2 digits)
  const areaCode = cleaned.slice(0, 2);

  // Validate area code (11-99 for Brazil)
  const areaCodeNum = parseInt(areaCode, 10);
  if (areaCodeNum < 11 || areaCodeNum > 99) {
    throw new Error(`Invalid area code: ${areaCode}. Must be between 11-99.`);
  }

  // Handle 10-digit numbers (add 9 prefix for mobile)
  if (cleaned.length === 10) {
    // Extract the first digit after area code
    const firstDigit = cleaned[2];
    
    // If it's not 9, this might be a landline or needs 9 added
    // For mobile numbers, Brazil requires 9 as the first digit after area code
    if (firstDigit !== '9') {
      // Add 9 to make it a valid mobile number
      cleaned = areaCode + '9' + cleaned.slice(2);
    }
  }

  // Validate final length (should be 11 digits)
  if (cleaned.length !== 11) {
    throw new Error(
      `Invalid phone number: ${cleaned}. Expected 11 digits after normalization.`
    );
  }

  // Validate that mobile numbers start with 9 after area code
  const mobilePrefix = cleaned[2];
  if (mobilePrefix !== '9') {
    throw new Error(
      `Invalid mobile number: ${cleaned}. Mobile numbers must start with 9 after area code.`
    );
  }

  // Return in E.164 format
  return `+55${cleaned}`;
}

/**
 * Validate if a string is a valid E.164 phone number
 * 
 * @param phone - Phone number to validate
 * @returns True if valid E.164 format
 */
export function isValidE164(phone: string): boolean {
  // E.164 format: +5511987654321 (exactly 14 characters for BR)
  const e164Regex = /^\+55\d{11}$/;
  return e164Regex.test(phone);
}

/**
 * Format an E.164 phone number for display
 * 
 * Converts +5511987654321 to (11) 98765-4321
 * 
 * @param phone - Phone number in E.164 format
 * @returns Formatted phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  if (!isValidE164(phone)) {
    return phone; // Return as-is if not valid E.164
  }

  // Remove +55 prefix
  const digits = phone.slice(3);
  
  // Extract parts
  const areaCode = digits.slice(0, 2);
  const firstPart = digits.slice(2, 7);
  const secondPart = digits.slice(7, 11);
  
  return `(${areaCode}) ${firstPart}-${secondPart}`;
}

/**
 * Batch normalize phone numbers
 * 
 * @param phones - Array of phone numbers to normalize
 * @returns Array of objects with original, normalized, and error status
 */
export function batchNormalizePhones(phones: string[]): Array<{
  original: string;
  normalized: string | null;
  error: string | null;
}> {
  return phones.map((phone) => {
    try {
      const normalized = normalizePhone(phone);
      return {
        original: phone,
        normalized,
        error: null,
      };
    } catch (error) {
      return {
        original: phone,
        normalized: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}

/**
 * Extract area code from E.164 phone number
 * 
 * @param phone - Phone number in E.164 format
 * @returns Area code (e.g., "11" for São Paulo)
 */
export function extractAreaCode(phone: string): string | null {
  if (!isValidE164(phone)) {
    return null;
  }
  
  return phone.slice(3, 5);
}

/**
 * Check if phone number is from a specific area code
 * 
 * @param phone - Phone number in E.164 format
 * @param areaCode - Area code to check (e.g., "11")
 * @returns True if phone is from the specified area code
 */
export function isFromAreaCode(phone: string, areaCode: string): boolean {
  const phoneAreaCode = extractAreaCode(phone);
  return phoneAreaCode === areaCode;
}
