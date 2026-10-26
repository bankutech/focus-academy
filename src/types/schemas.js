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

export const parseTimeMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match12) return null;
  let hours = parseInt(match12[1], 10);
  const minutes = parseInt(match12[2], 10);
  const modifier = match12[3] ? match12[3].toUpperCase() : null;

  if (minutes < 0 || minutes > 59) return null;

  if (modifier) {
    if (hours < 1 || hours > 12) return null;
    if (modifier === 'AM' && hours === 12) hours = 0;
    if (modifier === 'PM' && hours < 12) hours += 12;
  } else {
    if (hours < 0 || hours > 23) return null;
  }

  return hours * 60 + minutes;
};

export const parseBatchStartMinutes = (timingStr) => {
  if (!timingStr || typeof timingStr !== 'string') return null;
  const firstToken = timingStr.split(/[–-]/)[0].trim();
  return parseTimeMinutes(firstToken);
};

export const formatTime12 = (timeInput) => {
  let minutes = null;
  if (typeof timeInput === 'number') {
    minutes = ((timeInput % 1440) + 1440) % 1440;
  } else if (typeof timeInput === 'string') {
    minutes = parseTimeMinutes(timeInput);
  }
  if (minutes === null) return '';
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const modifier = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const paddedMins = mins < 10 ? `0${mins}` : mins;
  return `${hours12}:${paddedMins} ${modifier}`;
};

export const calculateEstimatedArrival = (dismissalTime, travelMinutes) => {
  if (!dismissalTime) return null;
  const dismissalMins = parseTimeMinutes(dismissalTime);
  if (dismissalMins === null) return null;
  if (travelMinutes === null || travelMinutes === undefined || travelMinutes === '' || isNaN(travelMinutes)) {
    return null;
  }
  const travel = parseInt(travelMinutes, 10);
  if (travel < 0) return null;

  const rawArrival = dismissalMins + travel;
  const arrivalMinutes = ((rawArrival % 1440) + 1440) % 1440;
  const formattedTime = formatTime12(arrivalMinutes);
  return { arrivalMinutes, formattedTime };
};

export const evaluateBatchTimingCompatibility = (selectedBatch, dismissalTime, travelMinutes, availableBatches = [], options = {}) => {
  const arrival = calculateEstimatedArrival(dismissalTime, travelMinutes);
  if (!arrival) {
    return {
      status: 'no_data',
      estimatedArrivalTime: null,
      delayMinutes: 0,
      bufferMinutes: 0,
      warning: null,
      recommendedBatch: null
    };
  }

  const batchStart = parseBatchStartMinutes(selectedBatch?.timing);
  if (batchStart === null) {
    return {
      status: 'no_data',
      estimatedArrivalTime: arrival.formattedTime,
      delayMinutes: 0,
      bufferMinutes: 0,
      warning: null,
      recommendedBatch: null
    };
  }

  const diff = batchStart - arrival.arrivalMinutes;

  if (diff < 0) {
    const delayMinutes = Math.abs(diff);
    let recommendedBatch = null;
    const targetGrade = options.studentGrade || selectedBatch?.grade;
    const targetBoard = options.studentBoard || selectedBatch?.board;

    if (Array.isArray(availableBatches) && availableBatches.length > 0) {
      const candidates = availableBatches
        .filter((b) => b.id !== selectedBatch?.id && (!targetGrade || isBatchCompatible(b, targetGrade, targetBoard)))
        .map((b) => ({
          batch: b,
          startMins: parseBatchStartMinutes(b.timing)
        }))
        .filter((item) => item.startMins !== null && item.startMins >= arrival.arrivalMinutes + 5)
        .sort((a, b) => a.startMins - b.startMins);

      if (candidates.length > 0) {
        recommendedBatch = candidates[0].batch;
      }
    }

    return {
      status: 'warning',
      estimatedArrivalTime: arrival.formattedTime,
      delayMinutes,
      bufferMinutes: 0,
      warning: 'Your school schedule may make this batch difficult to reach on time. Please review the timing or contact the academy for assistance.',
      recommendedBatch
    };
  }

  return {
    status: 'comfortable',
    estimatedArrivalTime: arrival.formattedTime,
    delayMinutes: 0,
    bufferMinutes: diff,
    warning: null,
    recommendedBatch: null
  };
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

  if (payload.schoolDismissalTime) {
    const dismissalMins = parseTimeMinutes(payload.schoolDismissalTime);
    if (dismissalMins === null) {
      errors.schoolDismissalTime = 'Please enter a valid school dismissal time.';
    }
  }

  if (payload.travelDurationMinutes !== undefined && payload.travelDurationMinutes !== null && payload.travelDurationMinutes !== '') {
    const parsedTravel = Number(payload.travelDurationMinutes);
    if (isNaN(parsedTravel) || parsedTravel < 0 || parsedTravel > 300) {
      errors.travelDurationMinutes = 'Please enter a valid travel duration (0 to 300 minutes).';
    }
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
      schoolShift: sanitizeText(payload.schoolShift, 60),
      schoolDismissalTime: payload.schoolDismissalTime ? sanitizeText(payload.schoolDismissalTime, 10) : null,
      travelDurationMinutes: payload.travelDurationMinutes !== undefined && payload.travelDurationMinutes !== null && payload.travelDurationMinutes !== '' && !isNaN(payload.travelDurationMinutes) ? Math.min(Math.max(0, parseInt(payload.travelDurationMinutes, 10)), 300) : null,
      scheduleClashWarning: payload.scheduleClashWarning ? sanitizeText(payload.scheduleClashWarning, 250) : null,
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
      schoolShift: lead.schoolShift ? sanitizeText(lead.schoolShift, 60) : undefined,
      schoolDismissalTime: lead.schoolDismissalTime ? sanitizeText(lead.schoolDismissalTime, 10) : undefined,
      travelDurationMinutes: lead.travelDurationMinutes !== undefined && lead.travelDurationMinutes !== null && lead.travelDurationMinutes !== '' && !isNaN(lead.travelDurationMinutes) ? Math.min(Math.max(0, parseInt(lead.travelDurationMinutes, 10)), 300) : undefined,
      scheduleClashWarning: lead.scheduleClashWarning ? sanitizeText(lead.scheduleClashWarning, 250) : undefined,
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
    if (bGrade.includes('6') || bGrade.includes('7') || bGrade.includes('8') || bGrade.includes('middle')) gradeMatch = true;
  }
  if (g.includes('9') && bGrade.includes('9')) gradeMatch = true;
  if (g.includes('10') && bGrade.includes('10')) gradeMatch = true;
  if (g.includes('11') && bGrade.includes('11')) gradeMatch = true;
  if (g.includes('12') && bGrade.includes('12')) gradeMatch = true;

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
