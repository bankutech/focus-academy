export const validateIndianMobile = (phone) => {
  if (!phone) return { valid: false, error: 'Phone number is required.' };
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  const regex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  if (!regex.test(cleanPhone)) {
    return { 
      valid: false, 
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 98424 51220).' 
    };
  }
  return { valid: true, sanitized: cleanPhone.slice(-10) };
};

export const validateLeadInquiry = (lead) => {
  const errors = {};

  if (!lead.studentName || lead.studentName.trim().length < 2) {
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

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    sanitized: isValid ? {
      ...lead,
      studentName: lead.studentName.trim(),
      parentName: lead.parentName ? lead.parentName.trim() : '',
      phone: phoneValidation.sanitized,
      timestamp: new Date().toISOString(),
      locality: 'Thoramangalam / Perambalur',
    } : null,
  };
};
