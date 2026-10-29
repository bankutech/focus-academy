/**
 * Focus Academy - Robust Phone Number Validation and Normalization Utility
 *
 * Supports:
 * - Indian mobile numbers (+91, 0, 91, or unadorned 10-digit starting with 6-9)
 * - International numbers with country code (+ or 00 prefix)
 * - Formatted strings with spaces, hyphens, parentheses, and dots
 * - Rejection of invalid characters (letters, symbols)
 * - Clean E.164 representation for storage and readable representation for UI
 */

const COUNTRY_DIALING_CODES = [
  { code: '+91', country: 'IN', minLength: 10, maxLength: 10, nationalRegex: /^[6-9]\d{9}$/ },
  { code: '+1', country: 'US/CA', minLength: 10, maxLength: 10, nationalRegex: /^[2-9]\d{2}[2-9]\d{6}$/ },
  { code: '+44', country: 'UK', minLength: 9, maxLength: 10, nationalRegex: /^[1-9]\d{8,9}$/ },
  { code: '+65', country: 'SG', minLength: 8, maxLength: 8, nationalRegex: /^[689]\d{7}$/ },
  { code: '+971', country: 'AE', minLength: 9, maxLength: 9, nationalRegex: /^[5]\d{8}$/ },
  { code: '+61', country: 'AU', minLength: 9, maxLength: 9, nationalRegex: /^[4]\d{8}$/ },
  { code: '+60', country: 'MY', minLength: 9, maxLength: 10, nationalRegex: /^[1]\d{8,9}$/ },
  { code: '+966', country: 'SA', minLength: 9, maxLength: 9, nationalRegex: /^[5]\d{8}$/ },
  { code: '+974', country: 'QA', minLength: 8, maxLength: 8, nationalRegex: /^[3567]\d{7}$/ },
  { code: '+968', country: 'OM', minLength: 8, maxLength: 8, nationalRegex: /^[79]\d{7}$/ },
  { code: '+965', country: 'KW', minLength: 8, maxLength: 8, nationalRegex: /^[569]\d{7}$/ },
  { code: '+973', country: 'BH', minLength: 8, maxLength: 8, nationalRegex: /^[36]\d{7}$/ },
  { code: '+94', country: 'LK', minLength: 9, maxLength: 9, nationalRegex: /^[7]\d{8}$/ },
];

/**
 * Validates and normalizes any contact phone number.
 *
 * @param {string|number} input - Raw input from form or database
 * @param {Object} [options]
 * @param {boolean} [options.required=true] - Whether empty value is treated as error
 * @param {string} [options.defaultCountryCode='+91'] - Default country code if none specified
 * @returns {{
 *   valid: boolean,
 *   error?: string,
 *   message?: string,
 *   e164: string,
 *   formatted: string,
 *   nationalNumber: string,
 *   countryCode: string
 * }}
 */
export function validatePhoneNumber(input, options = {}) {
  const { required = true, defaultCountryCode = '+91' } = options;

  if (input === null || input === undefined || String(input).trim() === '') {
    if (!required) {
      return {
        valid: true,
        e164: '',
        formatted: '',
        nationalNumber: '',
        countryCode: defaultCountryCode,
      };
    }
    const error = 'Phone number is required.';
    return {
      valid: false,
      error,
      message: error,
      e164: '',
      formatted: '',
      nationalNumber: '',
      countryCode: defaultCountryCode,
    };
  }

  const raw = String(input).trim();

  // Reject any alphabetic characters or illegal symbols
  if (/[a-zA-Z]/.test(raw)) {
    const error = 'Phone number must not contain letters.';
    return { valid: false, error, message: error, e164: '', formatted: '', nationalNumber: '', countryCode: defaultCountryCode };
  }
  if (/[^0-9\s\-()+.]/.test(raw)) {
    const error = 'Phone number contains invalid characters.';
    return { valid: false, error, message: error, e164: '', formatted: '', nationalNumber: '', countryCode: defaultCountryCode };
  }

  // Normalize international dialing prefix 00 to +
  let normalized = raw;
  if (normalized.startsWith('00')) {
    normalized = '+' + normalized.slice(2).trim();
  }

  // Remove common punctuation: spaces, hyphens, parentheses, dots
  let digitsOnly = normalized.replace(/[\s\-().]/g, '');

  let countryCode = '';
  let nationalNumber = '';

  if (digitsOnly.startsWith('+')) {
    // International prefix provided
    const match = digitsOnly.match(/^\+(\d{1,4})/);
    if (!match) {
      const error = 'Invalid international dialing code.';
      return { valid: false, error, message: error, e164: '', formatted: '', nationalNumber: '', countryCode: '' };
    }

    // Try matching our known country codes longest first
    const withoutPlus = digitsOnly.slice(1);
    const matchedPlan = [...COUNTRY_DIALING_CODES]
      .sort((a, b) => b.code.length - a.code.length)
      .find((p) => digitsOnly.startsWith(p.code));

    if (matchedPlan) {
      countryCode = matchedPlan.code;
      nationalNumber = digitsOnly.slice(matchedPlan.code.length);

      if (matchedPlan.nationalRegex && !matchedPlan.nationalRegex.test(nationalNumber)) {
        let error = `Invalid phone number for ${matchedPlan.country} (${matchedPlan.code}).`;
        if (matchedPlan.code === '+91') {
          error = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
        }
        return { valid: false, error, message: error, e164: '', formatted: '', nationalNumber, countryCode };
      }
    } else {
      // Generic E.164: total digits between 8 and 15
      if (withoutPlus.length < 8 || withoutPlus.length > 15) {
        const error = 'International phone numbers must have between 8 and 15 digits.';
        return { valid: false, error, message: error, e164: '', formatted: '', nationalNumber: '', countryCode: '' };
      }
      // Guess country code (1 to 3 digits)
      const ccLen = withoutPlus.length > 11 ? 2 : 1;
      countryCode = '+' + withoutPlus.slice(0, ccLen);
      nationalNumber = withoutPlus.slice(ccLen);
    }
  } else {
    // No + prefix. Check if it starts with 91 followed by 10 digits
    if (/^91[6-9]\d{9}$/.test(digitsOnly)) {
      countryCode = '+91';
      nationalNumber = digitsOnly.slice(2);
    } else if (/^0[6-9]\d{9}$/.test(digitsOnly)) {
      countryCode = '+91';
      nationalNumber = digitsOnly.slice(1);
    } else if (/^[6-9]\d{9}$/.test(digitsOnly)) {
      countryCode = '+91';
      nationalNumber = digitsOnly;
    } else {
      // Check if it matches any international length without plus
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        const error = 'Please enter a valid 10-digit mobile number (or include +country code for international).';
        return { valid: false, error, message: error, e164: '', formatted: '', nationalNumber: '', countryCode: defaultCountryCode };
      }
      // If 10 digits not starting with 6-9, provide specific advice
      if (digitsOnly.length === 10 && !/^[6-9]/.test(digitsOnly)) {
        const error = 'Indian mobile numbers must start with 6, 7, 8, or 9. If international, include +country code.';
        return { valid: false, error, message: error, e164: '', formatted: '', nationalNumber: '', countryCode: defaultCountryCode };
      }
      countryCode = defaultCountryCode;
      nationalNumber = digitsOnly;
    }
  }

  const e164 = `${countryCode}${nationalNumber}`;

  // Build human-friendly formatted representation
  let formatted = '';
  if (countryCode === '+91' && nationalNumber.length === 10) {
    formatted = `+91 ${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
  } else if (countryCode === '+1' && nationalNumber.length === 10) {
    formatted = `+1 (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
  } else {
    formatted = `${countryCode} ${nationalNumber}`;
  }

  return {
    valid: true,
    error: undefined,
    message: undefined,
    e164,
    formatted,
    nationalNumber,
    countryCode,
  };
}

/**
 * Formats a phone number for UI display.
 * Returns formatted string or fallback if invalid.
 */
export function formatPhoneNumber(input, fallback = '') {
  if (!input) return fallback;
  const result = validatePhoneNumber(input, { required: false });
  return result.valid && result.formatted ? result.formatted : String(input);
}

/**
 * Normalizes a phone number to canonical E.164 string or 10-digit national number.
 */
export function normalizePhoneNumber(input, preferNational10 = false) {
  if (!input) return '';
  const result = validatePhoneNumber(input, { required: false });
  if (!result.valid) return String(input).replace(/[^\d+]/g, '');
  if (preferNational10 && result.countryCode === '+91') {
    return result.nationalNumber;
  }
  return result.e164;
}
