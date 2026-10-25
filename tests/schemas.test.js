import { describe, it, expect } from 'vitest';
import { 
  validateIndianMobile, 
  validateIndianPincode, 
  validateGSTIN, 
  validateEnrollmentPayload, 
  validateLeadInquiry,
  parseTimeMinutes,
  parseBatchStartMinutes,
  formatTime12,
  calculateEstimatedArrival,
  evaluateBatchTimingCompatibility
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

describe('Intelligent Scheduling and Shift Timing Utilities', () => {
  it('parses 24h and 12h time strings into minutes from midnight', () => {
    expect(parseTimeMinutes('15:30')).toBe(930);
    expect(parseTimeMinutes('07:15')).toBe(435);
    expect(parseTimeMinutes('3:30 PM')).toBe(930);
    expect(parseTimeMinutes('7:30 AM')).toBe(450);
    expect(parseTimeMinutes('12:00 PM')).toBe(720);
    expect(parseTimeMinutes('12:00 AM')).toBe(0);
    expect(parseTimeMinutes('11:59 PM')).toBe(1439);
    expect(parseTimeMinutes('')).toBeNull();
    expect(parseTimeMinutes(null)).toBeNull();
    expect(parseTimeMinutes('25:00')).toBeNull();
    expect(parseTimeMinutes('14:75')).toBeNull();
    expect(parseTimeMinutes('invalid')).toBeNull();
  });

  it('parses batch start minutes from batch timing strings', () => {
    expect(parseBatchStartMinutes('4:30 PM – 6:00 PM (Mon – Sat)')).toBe(990);
    expect(parseBatchStartMinutes('6:00 PM – 7:30 PM (Mon – Sat)')).toBe(1080);
    expect(parseBatchStartMinutes('7:30 PM – 9:00 PM (Mon – Sat)')).toBe(1170);
    expect(parseBatchStartMinutes('')).toBeNull();
    expect(parseBatchStartMinutes(null)).toBeNull();
  });

  it('formats minutes into standard 12-hour AM/PM string', () => {
    expect(formatTime12(930)).toBe('3:30 PM');
    expect(formatTime12(990)).toBe('4:30 PM');
    expect(formatTime12(0)).toBe('12:00 AM');
    expect(formatTime12(720)).toBe('12:00 PM');
    expect(formatTime12(1080)).toBe('6:00 PM');
    expect(formatTime12(1170)).toBe('7:30 PM');
    expect(formatTime12(null)).toBe('');
  });

  it('calculates estimated arrival without inventing estimates when values are missing', () => {
    const res1 = calculateEstimatedArrival('15:30', '30');
    expect(res1).not.toBeNull();
    expect(res1.arrivalMinutes).toBe(960);
    expect(res1.formattedTime).toBe('4:00 PM');

    expect(calculateEstimatedArrival('', '30')).toBeNull();
    expect(calculateEstimatedArrival('15:30', '')).toBeNull();
    expect(calculateEstimatedArrival('15:30', null)).toBeNull();
    expect(calculateEstimatedArrival('invalid', '30')).toBeNull();
    expect(calculateEstimatedArrival('15:30', -10)).toBeNull();
  });

  it('handles midnight boundary arithmetic correctly', () => {
    const res = calculateEstimatedArrival('23:45', '30');
    expect(res).not.toBeNull();
    expect(res.arrivalMinutes).toBe(15);
    expect(res.formattedTime).toBe('12:15 AM');
  });

  it('evaluates comfortable arrival when student reaches before batch start', () => {
    const selectedBatch = {
      id: 'batch-10-cbse',
      name: 'Class 10 CBSE Board',
      timing: '4:30 PM – 6:00 PM',
      grade: 'Class 10',
      board: 'CBSE'
    };
    const evalResult = evaluateBatchTimingCompatibility(selectedBatch, '15:30', '30', []);
    expect(evalResult.status).toBe('comfortable');
    expect(evalResult.estimatedArrivalTime).toBe('4:00 PM');
    expect(evalResult.bufferMinutes).toBe(30);
    expect(evalResult.delayMinutes).toBe(0);
    expect(evalResult.warning).toBeNull();
  });

  it('evaluates timing clash warning and suggests alternative batch when student arrives late', () => {
    const selectedBatch = {
      id: 'batch-10-cbse-b1',
      name: 'Class 10 CBSE Batch 1',
      timing: '4:30 PM – 6:00 PM',
      grade: 'Class 10',
      board: 'CBSE'
    };
    const batches = [
      selectedBatch,
      {
        id: 'batch-10-cbse-b2',
        name: 'Class 10 CBSE Batch 2',
        timing: '6:00 PM – 7:30 PM',
        grade: 'Class 10',
        board: 'CBSE',
        seatsRemaining: 6
      },
      {
        id: 'batch-10-cbse-b3',
        name: 'Class 10 CBSE Batch 3',
        timing: '7:30 PM – 9:00 PM',
        grade: 'Class 10',
        board: 'CBSE',
        seatsRemaining: 8
      }
    ];

    const evalResult = evaluateBatchTimingCompatibility(selectedBatch, '16:15', '30', batches);
    expect(evalResult.status).toBe('warning');
    expect(evalResult.estimatedArrivalTime).toBe('4:45 PM');
    expect(evalResult.delayMinutes).toBe(15);
    expect(evalResult.warning).toContain('Your school schedule may make this batch difficult to reach on time');
    expect(evalResult.recommendedBatch).not.toBeNull();
    expect(evalResult.recommendedBatch.id).toBe('batch-10-cbse-b2');
  });

  it('returns no_data status without warning when timing information is omitted', () => {
    const selectedBatch = {
      id: 'batch-10-cbse',
      name: 'Class 10 CBSE Board',
      timing: '4:30 PM – 6:00 PM'
    };
    const evalResult = evaluateBatchTimingCompatibility(selectedBatch, '', '', []);
    expect(evalResult.status).toBe('no_data');
    expect(evalResult.warning).toBeNull();
    expect(evalResult.recommendedBatch).toBeNull();
  });

  it('validates enrollment payload with new school shift options and sanitized travel time', () => {
    const payload = {
      studentName: 'R. Deepika',
      phone: '9842451220',
      whatsappNumber: '9842451220',
      schoolName: 'Perambalur Higher Secondary School',
      educationBoard: 'State Board',
      targetYear: '2028',
      schoolShift: 'Day/Afternoon shift',
      schoolDismissalTime: '15:45',
      travelDurationMinutes: 20,
      scheduleClashWarning: null,
      mediumOfInstruction: 'English',
      emergencyContactName: 'R. Rajesh',
      emergencyRelationship: 'Father',
      emergencyPhone: '9842451221',
      studentIdNumber: 'SCH-98124'
    };

    const res = validateEnrollmentPayload(payload, { isOffline: true });
    expect(res.isValid).toBe(true);
    expect(res.sanitized.schoolShift).toBe('Day/Afternoon shift');
    expect(res.sanitized.schoolDismissalTime).toBe('15:45');
    expect(res.sanitized.travelDurationMinutes).toBe(20);
  });

  it('accepts Other / Varies shift and validates travel duration boundary values', () => {
    const payload = {
      studentName: 'R. Deepika',
      phone: '9842451220',
      whatsappNumber: '9842451220',
      schoolName: 'Perambalur Higher Secondary School',
      educationBoard: 'State Board',
      targetYear: '2028',
      schoolShift: 'Other / Varies',
      schoolDismissalTime: '16:00',
      travelDurationMinutes: 350,
      mediumOfInstruction: 'English',
      emergencyContactName: 'R. Rajesh',
      emergencyRelationship: 'Father',
      emergencyPhone: '9842451221',
      studentIdNumber: 'SCH-98124'
    };

    const res = validateEnrollmentPayload(payload, { isOffline: true });
    expect(res.isValid).toBe(false);
    expect(res.errors.travelDurationMinutes).toBeDefined();
  });
});
