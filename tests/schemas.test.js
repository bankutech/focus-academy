import { describe, it, expect } from 'vitest';
import { validateIndianMobile, validateLeadInquiry } from '../src/types/schemas';

describe('validateIndianMobile', () => {
  it('accepts standard 10-digit Indian mobile numbers', () => {
    const result = validateIndianMobile('9842451220');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('9842451220');
  });

  it('accepts numbers with spaces and dashes', () => {
    const result = validateIndianMobile('98424 51220');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('9842451220');
  });

  it('accepts numbers with +91 country code prefix', () => {
    const result = validateIndianMobile('+919842451220');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('9842451220');
  });

  it('accepts numbers starting with 6, 7, 8, or 9', () => {
    expect(validateIndianMobile('6380123456').valid).toBe(true);
    expect(validateIndianMobile('7200123456').valid).toBe(true);
    expect(validateIndianMobile('8220575767').valid).toBe(true);
    expect(validateIndianMobile('9842451220').valid).toBe(true);
  });

  it('rejects numbers starting with invalid digits like 1 or 5', () => {
    const result = validateIndianMobile('1234567890');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects phone numbers that are too short or empty', () => {
    expect(validateIndianMobile('').valid).toBe(false);
    expect(validateIndianMobile('98424').valid).toBe(false);
  });
});

describe('validateLeadInquiry', () => {
  it('validates a complete, accurate student inquiry', () => {
    const lead = {
      studentName: 'Karthik Raja',
      parentName: 'Raja Raman',
      phone: '98424 51220',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      subjects: 'Mathematics & Science',
    };

    const result = validateLeadInquiry(lead);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.sanitized).toBeDefined();
    expect(result.sanitized.studentName).toBe('Karthik Raja');
    expect(result.sanitized.phone).toBe('9842451220');
    expect(result.sanitized.locality).toBe('Thoramangalam / Perambalur');
  });

  it('rejects inquiry when student name is too short', () => {
    const lead = {
      studentName: 'K',
      phone: '9842451220',
      grade: 'Class 10',
      board: 'CBSE',
    };

    const result = validateLeadInquiry(lead);
    expect(result.isValid).toBe(false);
    expect(result.errors.studentName).toBeDefined();
  });

  it('rejects inquiry when board or grade is missing', () => {
    const lead = {
      studentName: 'Senthil Kumar',
      phone: '9842451220',
      grade: '',
      board: '',
    };

    const result = validateLeadInquiry(lead);
    expect(result.isValid).toBe(false);
    expect(result.errors.grade).toBeDefined();
    expect(result.errors.board).toBeDefined();
  });
});
