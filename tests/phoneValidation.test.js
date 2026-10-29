import { describe, it, expect } from 'vitest';
import { validatePhoneNumber, formatPhoneNumber, normalizePhoneNumber } from '../src/utils/phoneValidation';

describe('Phone Number Validation & Normalization Utility', () => {
  describe('Indian Phone Numbers', () => {
    it('validates a standard 10-digit Indian mobile number', () => {
      const res = validatePhoneNumber('9842451220');
      expect(res.valid).toBe(true);
      expect(res.nationalNumber).toBe('9842451220');
      expect(res.countryCode).toBe('+91');
      expect(res.e164).toBe('+919842451220');
      expect(res.formatted).toBe('+91 98424 51220');
    });

    it('handles numbers with spaces, hyphens, and parentheses', () => {
      const res = validatePhoneNumber('(984) 245-1220');
      expect(res.valid).toBe(true);
      expect(res.nationalNumber).toBe('9842451220');
      expect(res.e164).toBe('+919842451220');
    });

    it('handles numbers with leading +91 country code', () => {
      const res = validatePhoneNumber('+91 98424 51220');
      expect(res.valid).toBe(true);
      expect(res.nationalNumber).toBe('9842451220');
      expect(res.e164).toBe('+919842451220');
    });

    it('handles numbers with 91 prefix without plus', () => {
      const res = validatePhoneNumber('919842451220');
      expect(res.valid).toBe(true);
      expect(res.nationalNumber).toBe('9842451220');
      expect(res.e164).toBe('+919842451220');
    });

    it('handles numbers with leading 0 prefix', () => {
      const res = validatePhoneNumber('09842451220');
      expect(res.valid).toBe(true);
      expect(res.nationalNumber).toBe('9842451220');
      expect(res.e164).toBe('+919842451220');
    });

    it('handles international prefix 0091', () => {
      const res = validatePhoneNumber('00919842451220');
      expect(res.valid).toBe(true);
      expect(res.nationalNumber).toBe('9842451220');
      expect(res.e164).toBe('+919842451220');
    });

    it('rejects 10-digit numbers not starting with 6, 7, 8, 9', () => {
      const res = validatePhoneNumber('2345678901');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('start with 6, 7, 8, or 9');
    });
  });

  describe('International Phone Numbers', () => {
    it('validates US numbers with +1 country code', () => {
      const res = validatePhoneNumber('+1 (415) 555-2671');
      expect(res.valid).toBe(true);
      expect(res.countryCode).toBe('+1');
      expect(res.nationalNumber).toBe('4155552671');
      expect(res.e164).toBe('+14155552671');
      expect(res.formatted).toBe('+1 (415) 555-2671');
    });

    it('validates UK numbers with +44 country code', () => {
      const res = validatePhoneNumber('+44 7911 123456');
      expect(res.valid).toBe(true);
      expect(res.countryCode).toBe('+44');
      expect(res.e164).toBe('+447911123456');
    });

    it('validates UAE numbers with +971 country code', () => {
      const res = validatePhoneNumber('+971 50 123 4567');
      expect(res.valid).toBe(true);
      expect(res.countryCode).toBe('+971');
      expect(res.e164).toBe('+971501234567');
    });

    it('validates Singapore numbers with +65 country code', () => {
      const res = validatePhoneNumber('+65 8123 4567');
      expect(res.valid).toBe(true);
      expect(res.countryCode).toBe('+65');
      expect(res.e164).toBe('+6581234567');
    });
  });

  describe('Error Cases and Boundary Conditions', () => {
    it('rejects numbers containing letters', () => {
      const res = validatePhoneNumber('98424abcde');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('must not contain letters');
    });

    it('rejects numbers containing invalid symbols', () => {
      const res = validatePhoneNumber('98424$1220');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('invalid characters');
    });

    it('rejects numbers that are too short', () => {
      const res = validatePhoneNumber('98424');
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('rejects numbers that are too long', () => {
      const res = validatePhoneNumber('+91 984245122012345678');
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('rejects empty when required', () => {
      const res = validatePhoneNumber('', { required: true });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('required');
    });

    it('accepts empty when optional', () => {
      const res = validatePhoneNumber('', { required: false });
      expect(res.valid).toBe(true);
      expect(res.e164).toBe('');
    });
  });

  describe('Formatting and Normalization Helpers', () => {
    it('formats phone numbers for UI display', () => {
      expect(formatPhoneNumber('9842451220')).toBe('+91 98424 51220');
      expect(formatPhoneNumber('+14155552671')).toBe('+1 (415) 555-2671');
      expect(formatPhoneNumber('', 'N/A')).toBe('N/A');
    });

    it('normalizes phone numbers to standard E.164 string', () => {
      expect(normalizePhoneNumber('(984) 245-1220')).toBe('+919842451220');
      expect(normalizePhoneNumber('9842451220', true)).toBe('9842451220');
    });
  });
});
