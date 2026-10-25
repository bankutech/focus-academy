export const sanitizeText = (str, maxLength = 100) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>'"`;]/g, '').trim().slice(0, maxLength);
};

export const validateIndianMobile = (phone) => {
  if (!phone) {
    const error = 'Phone number is required.';
    return { valid: false, error, message: error };
  }
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
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

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    errors,
    sanitized: isValid ? {
      ...lead,
      studentName: cleanName,
      parentName: sanitizeText(lead.parentName),
      phone: phoneValidation.sanitized,
      secondaryPhone: lead.secondaryPhone ? sanitizeText(lead.secondaryPhone).replace(/\D/g, '').slice(-10) : undefined,
      medicalAlert: lead.medicalAlert ? sanitizeText(lead.medicalAlert, 150) : undefined,
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
