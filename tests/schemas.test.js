import { describe, it, expect } from 'vitest';
import { 
  validateIndianMobile, 
  validateIndianPincode, 
  validateGSTIN, 
  validateEnrollmentPayload, 
  validateLeadInquiry 
} from '../src/types/schemas';

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

describe('validateIndianPincode', () => {
  it('accepts standard 6-digit Indian PIN codes', () => {
    const res1 = validateIndianPincode('621212');
    expect(res1.valid).toBe(true);
    expect(res1.sanitized).toBe('621212');

    const res2 = validateIndianPincode('600 001');
    expect(res2.valid).toBe(true);
    expect(res2.sanitized).toBe('600001');
  });

  it('rejects invalid PIN codes starting with 0, non-digits, or wrong length', () => {
    expect(validateIndianPincode('012345').valid).toBe(false);
    expect(validateIndianPincode('62121').valid).toBe(false);
    expect(validateIndianPincode('6212123').valid).toBe(false);
    expect(validateIndianPincode('ABCDEF').valid).toBe(false);
    expect(validateIndianPincode('').valid).toBe(false);
  });
});

describe('validateGSTIN', () => {
  it('accepts valid 15-character GST numbers and empty optional inputs', () => {
    expect(validateGSTIN('').valid).toBe(true);
    expect(validateGSTIN(null).valid).toBe(true);
    const valid = validateGSTIN('33AAAAA0000A1Z5');
    expect(valid.valid).toBe(true);
    expect(valid.sanitized).toBe('33AAAAA0000A1Z5');
  });

  it('rejects malformed GSTIN inputs', () => {
    expect(validateGSTIN('INVALID_GST').valid).toBe(false);
    expect(validateGSTIN('33AAAAA0000A1Z').valid).toBe(false);
    expect(validateGSTIN('33AAAAA0000A1Z55').valid).toBe(false);
  });
});

describe('validateEnrollmentPayload', () => {
  const validData = {
    studentName: 'K. Vignesh',
    phone: '9842451220',
    whatsappNumber: '9842451220',
    schoolName: 'Thanthai Hans Roever Matriculation',
    educationBoard: 'State Board',
    targetYear: '2027',
    previousScore: '88%',
    schoolShift: 'Morning Shift (e.g. 7:30 AM – 1:30 PM)',
    mediumOfInstruction: 'English',
    emergencyContactName: 'Mrs. Lakshmi Kannan',
    emergencyRelationship: 'Mother',
    emergencyPhone: '9842451222',
    studentIdNumber: 'SCH-2026-991',
    gstin: '33AAAAA0000A1Z5',
    addressStreet: 'Door 24, Bharathi Nagar',
    addressCityState: 'Perambalur, Tamil Nadu',
    addressPincode: '621212'
  };

  it('validates a complete student enrollment payload with all operational and academic details', () => {
    const res = validateEnrollmentPayload(validData, { includesPrintedMaterials: true, isOffline: true });
    expect(res.isValid).toBe(true);
    expect(res.sanitized.schoolName).toBe('Thanthai Hans Roever Matriculation');
    expect(res.sanitized.educationBoard).toBe('State Board');
    expect(res.sanitized.targetYear).toBe('2027');
    expect(res.sanitized.emergencyContactName).toBe('Mrs. Lakshmi Kannan');
    expect(res.sanitized.studentIdNumber).toBe('SCH-2026-991');
    expect(res.sanitized.addressPincode).toBe('621212');
  });

  it('requires physical shipping address when course includes printed books and skips when digital', () => {
    const missingAddress = { ...validData, addressStreet: '', addressPincode: '' };
    const withBooks = validateEnrollmentPayload(missingAddress, { includesPrintedMaterials: true });
    expect(withBooks.isValid).toBe(false);
    expect(withBooks.errors.addressStreet).toBeDefined();
    expect(withBooks.errors.addressPincode).toBeDefined();

    const digitalOnly = validateEnrollmentPayload(missingAddress, { includesPrintedMaterials: false });
    expect(digitalOnly.isValid).toBe(true);
  });

  it('requires emergency contact for offline batches and verifies valid phone', () => {
    const missingEmergency = { ...validData, emergencyPhone: '12345' };
    const res = validateEnrollmentPayload(missingEmergency, { isOffline: true, includesPrintedMaterials: false });
    expect(res.isValid).toBe(false);
    expect(res.errors.emergencyPhone).toBeDefined();
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

  it('preserves and sanitizes child safeguarding secondary phone and medical alert', () => {
    const lead = {
      studentName: 'Ananya S',
      parentName: 'Suresh Kumar',
      phone: '+91 98424 51220',
      secondaryPhone: '+91 98424 51221',
      medicalAlert: 'Severe peanut allergy, carries "EpiPen"; needs inhaler <urgent>',
      grade: 'Class 10',
      board: 'CBSE',
    };

    const result = validateLeadInquiry(lead);
    expect(result.isValid).toBe(true);
    expect(result.sanitized.secondaryPhone).toBe('9842451221');
    expect(result.sanitized.medicalAlert).toBe('Severe peanut allergy, carries EpiPen needs inhaler urgent');
  });
});
