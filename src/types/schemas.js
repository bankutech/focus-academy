export const sanitizeText = (str, maxLength = 100) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"`;]/g, '').trim().slice(0, maxLength);
};

export const validateIndianMobile = (phone) => {
  if (!phone) {
    const error = 'Phone number is required.';
    return { valid: false, error, message: error };
  }
  const cleanPhone = String(phone).replace(/[\s\-()]/g, '');
  const regex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  if (!regex.test(cleanPhone)) {
    const error = 'Please enter a valid 10-digit Indian mobile number (e.g. 98424 51220).';
    return { 
      valid: false, 
      error,
      message: error 
    };
  }
  return { valid: true, sanitized: cleanPhone.slice(-10) };
};

export const validateIndianPincode = (pincode) => {
  if (!pincode) {
    const error = 'Pincode is required for printed book dispatch.';
    return { valid: false, error, message: error };
  }
  const cleanPin = String(pincode).trim().replace(/\s+/g, '');
  const regex = /^[1-9]\d{5}$/;
  if (!regex.test(cleanPin)) {
    const error = 'Please enter a valid 6-digit Indian PIN code (e.g. 621212).';
    return { valid: false, error, message: error };
  }
  return { valid: true, sanitized: cleanPin };
};

export const validateGSTIN = (gstin) => {
  if (!gstin || !String(gstin).trim()) {
    return { valid: true, sanitized: '' };
  }
  const cleanGST = String(gstin).trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(cleanGST)) {
    const error = 'Please enter a valid 15-character GSTIN (e.g. 33AAAAA0000A1Z5).';
    return { valid: false, error, message: error };
  }
  return { valid: true, sanitized: cleanGST };
};

export const validateEnrollmentPayload = (payload, options = {}) => {
  const { includesPrintedMaterials = false, isOffline = true } = options;
  const errors = {};

  const cleanStudentName = sanitizeText(payload.studentName);
  if (!cleanStudentName || cleanStudentName.length < 2) {
    errors.studentName = 'Student name must be at least 2 characters.';
  }

  const phoneValidation = validateIndianMobile(payload.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error;
  }

  const cleanSchool = sanitizeText(payload.schoolName);
  if (!cleanSchool || cleanSchool.length < 2) {
    errors.schoolName = 'School / college name is required.';
  }

  if (!payload.educationBoard && !payload.board) {
    errors.educationBoard = 'Please select education board / university.';
  }

  if (!payload.targetYear) {
    errors.targetYear = 'Please select target exam year / cycle.';
  }

  if (!payload.schoolShift) {
    errors.schoolShift = 'Please select school / college shift timing.';
  }

  const whatsappInput = payload.whatsappNumber || payload.phone;
  const whatsappValidation = validateIndianMobile(whatsappInput);
  if (!whatsappValidation.valid) {
    errors.whatsappNumber = whatsappValidation.error;
  }

  if (!payload.mediumOfInstruction) {
    errors.mediumOfInstruction = 'Please select medium / language of instruction.';
  }

  if (isOffline) {
    const cleanEmergencyName = sanitizeText(payload.emergencyContactName);
    if (!cleanEmergencyName || cleanEmergencyName.length < 2) {
      errors.emergencyContactName = 'Emergency contact person name is required.';
    }

    if (!payload.emergencyRelationship) {
      errors.emergencyRelationship = 'Please select relationship to student.';
    }

    const emergencyPhoneValidation = validateIndianMobile(payload.emergencyPhone);
    if (!emergencyPhoneValidation.valid) {
      errors.emergencyPhone = emergencyPhoneValidation.error;
    }
  }

  const cleanStudentId = sanitizeText(payload.studentIdNumber);
  if (!cleanStudentId || cleanStudentId.length < 2) {
    errors.studentIdNumber = 'Student ID / Govt ID number is required for verification.';
  }

  if (payload.gstin && String(payload.gstin).trim()) {
    const gstinValidation = validateGSTIN(payload.gstin);
    if (!gstinValidation.valid) {
      errors.gstin = gstinValidation.error;
    }
  }

  if (includesPrintedMaterials) {
    const cleanStreet = sanitizeText(payload.addressStreet, 150);
    if (!cleanStreet || cleanStreet.length < 3) {
      errors.addressStreet = 'Physical street address / house number is required.';
    }

    const cleanCity = sanitizeText(payload.addressCityState, 100);
    if (!cleanCity || cleanCity.length < 2) {
      errors.addressCityState = 'City & State are required.';
    }

    const pinValidation = validateIndianPincode(payload.addressPincode);
    if (!pinValidation.valid) {
      errors.addressPincode = pinValidation.error;
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    sanitized: isValid ? {
      ...payload,
      studentName: cleanStudentName,
      parentName: sanitizeText(payload.parentName),
      phone: phoneValidation.sanitized,
      whatsappNumber: whatsappValidation.sanitized,
      schoolName: cleanSchool,
      educationBoard: sanitizeText(payload.educationBoard || payload.board),
      targetYear: sanitizeText(String(payload.targetYear), 10),
      previousScore: payload.previousScore ? sanitizeText(payload.previousScore, 30) : null,
      schoolShift: sanitizeText(payload.schoolShift, 40),
      mediumOfInstruction: sanitizeText(payload.mediumOfInstruction, 40),
      emergencyContactName: sanitizeText(payload.emergencyContactName),
      emergencyRelationship: sanitizeText(payload.emergencyRelationship, 40),
      emergencyPhone: payload.emergencyPhone ? sanitizeText(payload.emergencyPhone).replace(/\D/g, '').slice(-10) : null,
      secondaryPhone: payload.secondaryPhone ? sanitizeText(payload.secondaryPhone).replace(/\D/g, '').slice(-10) : null,
      medicalAlert: payload.medicalAlert ? sanitizeText(payload.medicalAlert, 150) : null,
      studentIdNumber: cleanStudentId,
      gstin: payload.gstin ? sanitizeText(payload.gstin, 20).toUpperCase() : null,
      addressStreet: includesPrintedMaterials ? sanitizeText(payload.addressStreet, 150) : null,
      addressLandmark: includesPrintedMaterials && payload.addressLandmark ? sanitizeText(payload.addressLandmark, 100) : null,
      addressCityState: includesPrintedMaterials ? sanitizeText(payload.addressCityState, 100) : null,
      addressPincode: includesPrintedMaterials && payload.addressPincode ? sanitizeText(payload.addressPincode, 10).replace(/\s+/g, '') : null,
    } : null
  };
};

export const validateLeadInquiry = (lead) => {
  const errors = {};

  const cleanName = sanitizeText(lead.studentName);
  if (!cleanName || cleanName.length < 2) {
    errors.studentName = 'Student name must be at least 2 characters.';
  }

  const phoneValidation = validateIndianMobile(lead.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.error;
  }

  if (!lead.grade) {
    errors.grade = 'Please select a grade/class.';
  }

  if (!lead.board) {
    errors.board = 'Please select a curriculum board.';
  }

  if (lead.gstin && String(lead.gstin).trim()) {
    const gstinValidation = validateGSTIN(lead.gstin);
    if (!gstinValidation.valid) {
      errors.gstin = gstinValidation.error;
    }
  }

  if (lead.addressPincode && String(lead.addressPincode).trim()) {
    const pinValidation = validateIndianPincode(lead.addressPincode);
    if (!pinValidation.valid) {
      errors.addressPincode = pinValidation.error;
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    sanitized: isValid ? {
      ...lead,
      studentName: cleanName,
      parentName: sanitizeText(lead.parentName),
      phone: phoneValidation.sanitized,
      whatsappNumber: lead.whatsappNumber ? sanitizeText(lead.whatsappNumber).replace(/\D/g, '').slice(-10) : phoneValidation.sanitized,
      secondaryPhone: lead.secondaryPhone ? sanitizeText(lead.secondaryPhone).replace(/\D/g, '').slice(-10) : undefined,
      medicalAlert: lead.medicalAlert ? sanitizeText(lead.medicalAlert, 150) : undefined,
      schoolName: lead.schoolName ? sanitizeText(lead.schoolName, 120) : undefined,
      educationBoard: lead.educationBoard ? sanitizeText(lead.educationBoard, 60) : undefined,
      targetYear: lead.targetYear ? sanitizeText(String(lead.targetYear), 10) : undefined,
      previousScore: lead.previousScore ? sanitizeText(lead.previousScore, 30) : undefined,
      schoolShift: lead.schoolShift ? sanitizeText(lead.schoolShift, 40) : undefined,
      mediumOfInstruction: lead.mediumOfInstruction ? sanitizeText(lead.mediumOfInstruction, 40) : undefined,
      emergencyContactName: lead.emergencyContactName ? sanitizeText(lead.emergencyContactName, 80) : undefined,
      emergencyRelationship: lead.emergencyRelationship ? sanitizeText(lead.emergencyRelationship, 40) : undefined,
      emergencyPhone: lead.emergencyPhone ? sanitizeText(lead.emergencyPhone).replace(/\D/g, '').slice(-10) : undefined,
      studentIdNumber: lead.studentIdNumber ? sanitizeText(lead.studentIdNumber, 50) : undefined,
      gstin: lead.gstin ? sanitizeText(lead.gstin, 20).toUpperCase() : undefined,
      addressStreet: lead.addressStreet ? sanitizeText(lead.addressStreet, 150) : undefined,
      addressLandmark: lead.addressLandmark ? sanitizeText(lead.addressLandmark, 100) : undefined,
      addressCityState: lead.addressCityState ? sanitizeText(lead.addressCityState, 100) : undefined,
      addressPincode: lead.addressPincode ? sanitizeText(lead.addressPincode, 10) : undefined,
      timestamp: new Date().toISOString(),
      locality: 'Thoramangalam / Perambalur',
    } : null,
  };
};

export const isBatchCompatible = (batch, grade, board) => {
  if (!batch || !grade) return false;

  const g = String(grade).toLowerCase();
  const bGrade = String(batch.grade || '').toLowerCase();

  let gradeMatch = false;
  if (g.includes('6') || g.includes('7') || g.includes('8') || g.includes('middle')) {
    gradeMatch = bGrade.includes('6') || bGrade.includes('7') || bGrade.includes('8') || bGrade.includes('middle');
  } else if (g.includes('9')) {
    gradeMatch = bGrade.includes('9');
  } else if (g.includes('10')) {
    gradeMatch = bGrade.includes('10');
  } else if (g.includes('11')) {
    gradeMatch = bGrade.includes('11');
  } else if (g.includes('12')) {
    gradeMatch = bGrade.includes('12');
  }

  if (!gradeMatch) return false;

  if (board && board !== 'all') {
    const b = String(board).toLowerCase();
    const bBoard = String(batch.board || '').toLowerCase();

    if (b.includes('state') || b.includes('samacheer')) {
      if (!bBoard.includes('state') && !bBoard.includes('samacheer')) return false;
    } else if (b.includes('cbse')) {
      if (!bBoard.includes('cbse')) return false;
    } else if (b.includes('icse') || b.includes('isc')) {
      if (!bBoard.includes('icse') && !bBoard.includes('isc')) return false;
    }
  }

  return true;
};
