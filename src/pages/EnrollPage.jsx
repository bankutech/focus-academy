import React, { useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Send,
  GraduationCap,
  PhoneCall,
  Truck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  Calendar,
  Building,
  CreditCard,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { BATCHES_DATA } from '../data/batchesData';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow, getStepRedirect } from '../context/useAppContext';
import { 
  validateIndianMobile, 
  validateIndianPincode, 
  validateGSTIN, 
  isBatchCompatible 
} from '../types/schemas';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { LeadService } from '../services/leadService';
import { BatchService } from '../services/batchService';

const getNowIsoString = () => new Date().toISOString();

export default function EnrollPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { studentFlow, setStudentFlow, registerStudent, ensureVerifiedSession } = useStudentFlow();

  const candidateBatch = BATCHES_DATA.find((b) => b.id === batchId) ||
    BATCHES_DATA.find((b) => b.id === studentFlow.selectedBatchId);

  const isCandidateCompatible = candidateBatch && isBatchCompatible(candidateBatch, studentFlow.grade, studentFlow.board);

  const selectedBatch = isCandidateCompatible
    ? candidateBatch
    : BATCHES_DATA.find((b) => isBatchCompatible(b, studentFlow.grade, studentFlow.board)) || candidateBatch || BATCHES_DATA[0];

  const includesPrintedMaterials = Boolean(
    selectedBatch.includesPrintedMaterials ||
    selectedBatch.includesBooks ||
    selectedBatch.features?.some((f) => /printed|book|formula master|materials/i.test(f))
  );

  const [studentName, setStudentName] = useState(studentFlow.studentName || '');
  const [parentName, setParentName] = useState(studentFlow.parentName || '');
  const [phone, setPhone] = useState(studentFlow.phone || '');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState(studentFlow.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(studentFlow.secondaryPhone || '');
  const [medicalAlert, setMedicalAlert] = useState(studentFlow.medicalAlert || '');
  const [board, setBoard] = useState(studentFlow.board || selectedBatch.board);
  const [startDatePreference, setStartDatePreference] = useState('Immediate (This Week)');
  const [studentWeakness, setStudentWeakness] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [schoolName, setSchoolName] = useState(studentFlow.schoolName || '');
  const [educationBoard, setEducationBoard] = useState(
    studentFlow.board?.includes('CBSE') ? 'CBSE' :
    studentFlow.board?.includes('ICSE') ? 'ICSE' :
    studentFlow.board?.includes('State') ? 'State Board' : 'State Board'
  );
  const [targetYear, setTargetYear] = useState('2027');
  const [previousScore, setPreviousScore] = useState('');
  const [schoolShift, setSchoolShift] = useState('Morning Shift (e.g. 7:30 AM – 1:30 PM)');

  const [mediumOfInstruction, setMediumOfInstruction] = useState('English');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Father');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [addressStreet, setAddressStreet] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [addressCityState, setAddressCityState] = useState('Perambalur, Tamil Nadu');
  const [addressPincode, setAddressPincode] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [gstin, setGstin] = useState('');

  const [openSections, setOpenSections] = useState({
    academic: true,
    operational: true,
    logistics: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const redirectPath = getStepRedirect(5, studentFlow);
  if (redirectPath) {
    return <Navigate to={redirectPath} state={{ redirectedFrom: 5 }} replace />;
  }

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handlePhoneChange = (val) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsappNumber(val);
    }
    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!studentName.trim() || studentName.trim().length < 2) {
      errors.studentName = 'Student name must be at least 2 characters.';
    }

    const phoneValidation = validateIndianMobile(phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error;
    }

    const effectiveWhatsapp = sameAsPhone ? phone : whatsappNumber;
    const whatsappValidation = validateIndianMobile(effectiveWhatsapp);
    if (!whatsappValidation.valid) {
      errors.whatsappNumber = whatsappValidation.error;
    }

    if (!schoolName.trim() || schoolName.trim().length < 2) {
      errors.schoolName = 'School / college name is required.';
    }

    if (!educationBoard) {
      errors.educationBoard = 'Please select education board / university.';
    }

    if (!targetYear) {
      errors.targetYear = 'Please select target exam year / cycle.';
    }

    if (!schoolShift) {
      errors.schoolShift = 'Please select school / college shift timing.';
    }

    if (!mediumOfInstruction) {
      errors.mediumOfInstruction = 'Please select medium / language of instruction.';
    }

    if (!emergencyContactName.trim() || emergencyContactName.trim().length < 2) {
      errors.emergencyContactName = 'Emergency contact person name is required.';
    }

    if (!emergencyRelationship) {
      errors.emergencyRelationship = 'Please select relationship to student.';
    }

    const emergencyValidation = validateIndianMobile(emergencyPhone);
    if (!emergencyValidation.valid) {
      errors.emergencyPhone = emergencyValidation.error;
    }

    if (secondaryPhone.trim()) {
      const secondaryValidation = validateIndianMobile(secondaryPhone);
      if (!secondaryValidation.valid) {
        errors.secondaryPhone = secondaryValidation.error;
      }
    }

    if (!studentIdNumber.trim() || studentIdNumber.trim().length < 2) {
      errors.studentIdNumber = 'Student ID or Govt ID verification number is required.';
    }

    if (gstin.trim()) {
      const gstinValidation = validateGSTIN(gstin);
      if (!gstinValidation.valid) {
        errors.gstin = gstinValidation.error;
      }
    }

    if (includesPrintedMaterials) {
      if (!addressStreet.trim() || addressStreet.trim().length < 3) {
        errors.addressStreet = 'Physical street address / house number is required.';
      }

      if (!addressCityState.trim() || addressCityState.trim().length < 2) {
        errors.addressCityState = 'City & State are required for book shipment.';
      }

      const pinValidation = validateIndianPincode(addressPincode);
      if (!pinValidation.valid) {
        errors.addressPincode = pinValidation.error;
      }
    }

    if (Object.keys(errors).length > 0) {
      if (errors.schoolName || errors.educationBoard || errors.targetYear || errors.schoolShift) {
        setOpenSections((prev) => ({ ...prev, academic: true }));
      }
      if (errors.studentName || errors.phone || errors.whatsappNumber || errors.mediumOfInstruction || errors.emergencyContactName || errors.emergencyPhone) {
        setOpenSections((prev) => ({ ...prev, operational: true }));
      }
      if (errors.studentIdNumber || errors.gstin || errors.addressStreet || errors.addressCityState || errors.addressPincode) {
        setOpenSections((prev) => ({ ...prev, logistics: true }));
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedPhone: phoneValidation.valid ? phoneValidation.sanitized : phone,
      sanitizedWhatsapp: whatsappValidation.valid ? whatsappValidation.sanitized : whatsappNumber,
      sanitizedEmergencyPhone: emergencyValidation.valid ? emergencyValidation.sanitized : emergencyPhone,
      sanitizedGstin: gstin.trim().toUpperCase() || null,
      sanitizedPincode: addressPincode.trim().replace(/\s+/g, '') || null
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const validation = validateForm();
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    if (!isBatchCompatible(selectedBatch, studentFlow.grade || selectedBatch.grade, board)) {
      setSubmissionResult({
        success: false,
        error: `Incompatible batch selection: ${selectedBatch.name} (${selectedBatch.grade}, ${selectedBatch.board}) does not match student profile (${studentFlow.grade || 'N/A'}, ${board || 'N/A'}). Please select an eligible batch.`,
      });
      return;
    }

    setIsSubmitting(true);

    let session;
    try {
      session = await ensureVerifiedSession(4);
    } catch (err) {
      setIsSubmitting(false);
      setSubmissionResult({
        success: false,
        error: err.message || 'We could not verify your admission progress. Please check your connection and try again.',
      });
      return;
    }

    let reservation = await BatchService.reserveSeatWithDetails(selectedBatch.id, {
      studentName: studentName.trim(),
      phone: validation.sanitizedPhone,
      grade: studentFlow.grade || selectedBatch.grade,
      board,
      stepToken: session.stepToken
    });

    if (!reservation.success) {
      if (reservation.canWaitlist) {
        const wl = await BatchService.reserveSeatWithDetails(selectedBatch.id, {
          studentName: studentName.trim(),
          phone: validation.sanitizedPhone,
          grade: studentFlow.grade || selectedBatch.grade,
          board,
          stepToken: session.stepToken,
          allowWaitlist: true
        });
        if (wl.success && wl.waitlisted) {
          reservation = {
            success: true,
            waitlisted: true,
            reservationId: wl.reservationId,
            waitlistPosition: wl.waitlistPosition,
          };
        }
      }
      if (!reservation.success) {
        setIsSubmitting(false);
        setSubmissionResult({
          success: false,
          error: reservation.error || 'This batch is currently at maximum 12-student capacity. Please select an alternate evening slot.',
        });
        return;
      }
    }

    const cleanSecondary = secondaryPhone.trim() ? secondaryPhone.trim().replace(/\D/g, '').slice(-10) : null;
    const enrollmentRecord = {
      studentName: studentName.trim(),
      parentName: parentName.trim(),
      phone: validation.sanitizedPhone,
      whatsappNumber: validation.sanitizedWhatsapp,
      schoolName: schoolName.trim(),
      educationBoard,
      targetYear,
      previousScore: previousScore.trim() || null,
      schoolShift,
      mediumOfInstruction,
      emergencyContactName: emergencyContactName.trim(),
      emergencyRelationship,
      emergencyPhone: validation.sanitizedEmergencyPhone,
      secondaryPhone: cleanSecondary && cleanSecondary.length === 10 ? cleanSecondary : null,
      medicalAlert: medicalAlert.trim() || null,
      studentIdNumber: studentIdNumber.trim(),
      gstin: validation.sanitizedGstin,
      addressStreet: includesPrintedMaterials ? addressStreet.trim() : null,
      addressLandmark: includesPrintedMaterials && addressLandmark.trim() ? addressLandmark.trim() : null,
      addressCityState: includesPrintedMaterials ? addressCityState.trim() : null,
      addressPincode: includesPrintedMaterials ? validation.sanitizedPincode : null,
      board,
      grade: studentFlow.grade || selectedBatch.grade,
      selectedBatchId: selectedBatch.id,
      selectedBatchName: selectedBatch.name,
      timing: selectedBatch.timing,
      monthlyFee: selectedBatch.monthlyFee,
      startDatePreference,
      studentWeakness: studentWeakness.trim(),
      reservationId: reservation.reservationId,
      isWaitlisted: Boolean(reservation.waitlisted),
      waitlistPosition: reservation.waitlistPosition || null,
      createdAt: getNowIsoString(),
    };

    const saved = registerStudent(enrollmentRecord);

    const notesSummary = `${reservation.waitlisted ? `Priority Waitlist (#${reservation.waitlistPosition}) | ` : ''}Slip: ${saved.id} | School: ${enrollmentRecord.schoolName} (${enrollmentRecord.educationBoard}, Target: ${enrollmentRecord.targetYear}) | Shift: ${enrollmentRecord.schoolShift} | Medium: ${enrollmentRecord.mediumOfInstruction} | Emergency: ${enrollmentRecord.emergencyContactName} (${enrollmentRecord.emergencyRelationship}: ${enrollmentRecord.emergencyPhone}) | ID: ${enrollmentRecord.studentIdNumber}${enrollmentRecord.gstin ? ` | GST: ${enrollmentRecord.gstin}` : ''}${includesPrintedMaterials ? ` | Dispatch: ${enrollmentRecord.addressStreet}, ${enrollmentRecord.addressCityState} - ${enrollmentRecord.addressPincode}` : ''}`;

    await LeadService.submitLead({
      studentName: enrollmentRecord.studentName,
      parentName: enrollmentRecord.parentName,
      phone: enrollmentRecord.phone,
      whatsappNumber: enrollmentRecord.whatsappNumber,
      schoolName: enrollmentRecord.schoolName,
      educationBoard: enrollmentRecord.educationBoard,
      targetYear: enrollmentRecord.targetYear,
      previousScore: enrollmentRecord.previousScore,
      schoolShift: enrollmentRecord.schoolShift,
      mediumOfInstruction: enrollmentRecord.mediumOfInstruction,
      emergencyContactName: enrollmentRecord.emergencyContactName,
      emergencyRelationship: enrollmentRecord.emergencyRelationship,
      emergencyPhone: enrollmentRecord.emergencyPhone,
      secondaryPhone: enrollmentRecord.secondaryPhone,
      medicalAlert: enrollmentRecord.medicalAlert,
      studentIdNumber: enrollmentRecord.studentIdNumber,
      gstin: enrollmentRecord.gstin,
      addressStreet: enrollmentRecord.addressStreet,
      addressLandmark: enrollmentRecord.addressLandmark,
      addressCityState: enrollmentRecord.addressCityState,
      addressPincode: enrollmentRecord.addressPincode,
      grade: enrollmentRecord.grade,
      board: enrollmentRecord.board,
      batchId: selectedBatch.id,
      reservationId: enrollmentRecord.reservationId,
      stepToken: session.stepToken,
      timing: selectedBatch.timing,
      subjects: selectedBatch.name,
      notes: notesSummary,
    });

    setStudentFlow((prev) => ({
      ...prev,
      studentName: enrollmentRecord.studentName,
      parentName: enrollmentRecord.parentName,
      phone: enrollmentRecord.phone,
      whatsappNumber: enrollmentRecord.whatsappNumber,
      schoolName: enrollmentRecord.schoolName,
      secondaryPhone: enrollmentRecord.secondaryPhone,
      medicalAlert: enrollmentRecord.medicalAlert,
      selectedBatchId: selectedBatch.id,
      step: 5,
    }));

    const prefilledText = `Hello Focus Academy! I have completed admission registration for student: ${enrollmentRecord.studentName} (${enrollmentRecord.grade}, ${enrollmentRecord.board}). School: ${enrollmentRecord.schoolName}. Selected Batch: ${selectedBatch.name} (${selectedBatch.timing}). Slip ID: ${saved.id}.`;
    const whatsappUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(prefilledText)}`;

    setIsSubmitting(false);
    setSubmissionResult({
      success: true,
      data: saved,
      enrollmentRecord,
      whatsappUrl,
      waitlisted: Boolean(reservation.waitlisted),
      waitlistPosition: reservation.waitlistPosition,
    });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left">
      <StepProgress currentStep={5} />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10 sm:py-14">
        {submissionResult && !submissionResult.success && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-5 text-left max-w-2xl mx-auto animate-in fade-in">
            <h3 className="text-sm font-bold text-rose-900">Seat Reservation Notice</h3>
            <p className="text-xs text-rose-700 mt-1">{submissionResult.error}</p>
            <div className="mt-3 flex items-center space-x-3">
              <button 
                type="button" 
                onClick={() => setSubmissionResult(null)} 
                className="text-xs font-bold px-3 py-1.5 bg-rose-100 text-rose-900 rounded-md hover:bg-rose-200 cursor-pointer"
              >
                Try Again
              </button>
              <Link 
                to="/batches" 
                className="text-xs font-bold text-[#EA580C] hover:underline"
              >
                Browse Alternative Batches →
              </Link>
            </div>
          </div>
        )}

        {submissionResult?.success ? (
          <div className="bg-white rounded-lg p-8 sm:p-12 border border-[#E2E8F0] shadow-sm text-center max-w-2xl mx-auto animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#0F172A] text-white flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 className="w-9 h-9 text-[#EA580C]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {submissionResult.waitlisted
                ? `Priority Waitlist Registered (#${submissionResult.waitlistPosition || 1})`
                : 'Seat Reserved & Admission Slip Generated!'}
            </h1>

            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              {submissionResult.waitlisted
                ? `Thank you, ${studentName}. You have been registered on the Priority Waitlist for ${selectedBatch.name}. Our campus desk will prioritize your admission if a slot opens.`
                : `Thank you, ${studentName}. Your seat reservation has been queued for ${selectedBatch.name}.`}
            </p>

            <div className="mt-6 p-5 bg-slate-50 rounded-md border border-[#E2E8F0] text-xs text-left space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between pb-2 border-b border-[#E2E8F0]">
                <span className="text-slate-500 font-medium">Admission Slip No:</span>
                <span className="font-bold text-[#0F172A]">{submissionResult.data?.id || 'FA-2026-ENR'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Batch:</span>
                <span className="font-bold text-[#EA580C] text-right truncate max-w-[200px]">{selectedBatch.shortTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">School / College:</span>
                <span className="font-bold text-[#0F172A] text-right truncate max-w-[200px]">{submissionResult.enrollmentRecord?.schoolName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Board & Target Cycle:</span>
                <span className="font-semibold text-slate-800">{submissionResult.enrollmentRecord?.educationBoard} (Target: {submissionResult.enrollmentRecord?.targetYear})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">WhatsApp Updates:</span>
                <span className="font-semibold text-slate-800">{submissionResult.enrollmentRecord?.whatsappNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Emergency Contact:</span>
                <span className="font-semibold text-slate-800">{submissionResult.enrollmentRecord?.emergencyContactName} ({submissionResult.enrollmentRecord?.emergencyRelationship})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Verification ID:</span>
                <span className="font-semibold text-slate-800">{submissionResult.enrollmentRecord?.studentIdNumber}</span>
              </div>
              {submissionResult.enrollmentRecord?.gstin && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">GSTIN Invoice:</span>
                  <span className="font-mono text-slate-800 font-semibold">{submissionResult.enrollmentRecord.gstin}</span>
                </div>
              )}
              {submissionResult.enrollmentRecord?.addressStreet && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="text-slate-500 font-medium block">Dispatch Address for Books:</span>
                  <span className="text-slate-800 mt-0.5 block">
                    {submissionResult.enrollmentRecord.addressStreet}, {submissionResult.enrollmentRecord.addressCityState} - {submissionResult.enrollmentRecord.addressPincode}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                <span className="text-slate-500 font-medium">Timing:</span>
                <span className="font-semibold text-slate-700">{selectedBatch.timing} (Mon – Sat)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Classroom:</span>
                <span className="text-slate-700">{selectedBatch.classroom}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                <span className="text-slate-500 font-medium">Monthly Tuition Fee:</span>
                <span className="font-extrabold text-[#0F172A] text-sm">₹{selectedBatch.monthlyFee.toLocaleString('en-IN')}/mo</span>
              </div>
            </div>

            <div className="mt-8 space-y-3 max-w-md mx-auto">
              <a
                href={submissionResult.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notify Campus Desk on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setStudentFlow({
                    studentName: '',
                    phone: '',
                    parentName: '',
                    board: 'TN State Board (Samacheer)',
                    grade: 'Class 10',
                    examPrep: '',
                    selectedBatchId: '',
                    step: 1
                  });
                  navigate('/');
                }}
                className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Return to Focus Academy Home
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudentFlow({
                    studentName: '',
                    phone: '',
                    parentName: '',
                    board: 'TN State Board (Samacheer)',
                    grade: 'Class 10',
                    examPrep: '',
                    selectedBatchId: '',
                    step: 1
                  });
                  navigate('/student-details');
                }}
                className="w-full py-3 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Register Another Student (Step 1)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {candidateBatch && !isCandidateCompatible && studentFlow.grade && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-3 text-xs text-amber-950">
                <span className="font-bold text-amber-800 shrink-0">Academic Alignment:</span>
                <span>
                  Your registration profile is set for <strong>{studentFlow.grade} ({studentFlow.board})</strong>. The selected batch has been adjusted to <strong>{selectedBatch.name}</strong> to match your grade curriculum.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                  Student Enrollment & Verification
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Complete the operational, academic, and verification details below to finalize your seat reservation.
                </p>
              </div>

              <Link
                to={`/batch/${selectedBatch.id}`}
                className="text-xs text-slate-500 hover:text-[#0F172A] hidden sm:block"
              >
                ← Back to Batch Details
              </Link>
            </div>

            <div className="bg-white rounded-xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-[#EA580C] text-xs font-bold uppercase tracking-wider">
                    Selected Evening Batch
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
                    {selectedBatch.name}
                  </h2>
                </div>

                <Link
                  to="/batches"
                  className="inline-flex items-center space-x-1 text-xs font-bold text-[#EA580C] hover:text-[#C2410C] hover:underline shrink-0"
                >
                  <span>Change Batch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 pt-4 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Clock className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <span className="font-semibold">{selectedBatch.timing} (Mon – Sat)</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <span className="truncate">{selectedBatch.classroom}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Users className="w-4 h-4 text-[#EA580C] shrink-0" />
                    <span className="font-semibold">Max 12 Students ({selectedBatch.seatsRemaining} Seats Left)</span>
                  </div>
                  <div className="text-slate-600 flex items-center space-x-2">
                    <span className="text-slate-500">Batch Format:</span>
                    <strong className="text-[#0F172A]">Offline Classroom (1:12 Cap)</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold tracking-wider mb-1">
                      Subjects Included:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedBatch.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 border border-[#E2E8F0] rounded text-xs font-semibold text-[#0F172A]"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-slate-600 flex items-center space-x-2 pt-0.5">
                    <span className="text-slate-500">Study Material:</span>
                    <strong className={includesPrintedMaterials ? 'text-[#EA580C] font-bold' : 'text-slate-700'}>
                      {includesPrintedMaterials ? 'Printed Books & Worksheets Included' : 'Digital Classroom Materials'}
                    </strong>
                  </div>
                </div>

                <div className="flex md:flex-col justify-between md:justify-center items-center md:items-end p-3 sm:p-3.5 bg-slate-50 rounded-lg border border-[#E2E8F0]">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] uppercase font-bold text-slate-500 block">
                      Monthly Tuition Fee
                    </span>
                    <span className="text-2xl font-extrabold text-[#0F172A]">
                      ₹{selectedBatch.monthlyFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold md:mt-1">
                    Zero Reg. Fee
                  </span>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
                  <input
                    type="text"
                    name="website_url"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex="-1"
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                  />

                  <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection('academic')}
                      className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-50 transition-colors border-b border-[#E2E8F0] text-left cursor-pointer"
                      aria-expanded={openSections.academic}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs uppercase font-bold text-[#EA580C]">Section 1</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 font-semibold">Required</span>
                          </div>
                          <h2 className="text-base font-bold text-[#0F172A]">
                            Academic Background & School Identity
                          </h2>
                        </div>
                      </div>
                      <div className="text-slate-400">
                        {openSections.academic ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {openSections.academic && (
                      <div className="p-5 sm:p-6 space-y-4">
                        <div>
                          <label htmlFor="enroll-school-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                            School / College Name * <span className="text-[11px] font-normal text-slate-500">/ பள்ளி / கல்லூரி பெயர்</span>
                          </label>
                          <input
                            id="enroll-school-name"
                            type="text"
                            value={schoolName}
                            onChange={(e) => {
                              setSchoolName(e.target.value);
                              if (formErrors.schoolName) setFormErrors((prev) => ({ ...prev, schoolName: '' }));
                            }}
                            placeholder="e.g. Thanthai Hans Roever, Kendriya Vidyalaya, DS Matriculation..."
                            className={`w-full px-3.5 py-2.5 bg-white border ${
                              formErrors.schoolName ? 'border-rose-500' : 'border-[#E2E8F0]'
                            } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                            required
                          />
                          {formErrors.schoolName && (
                            <p className="text-xs text-rose-600 mt-1">{formErrors.schoolName}</p>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="enroll-education-board" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Education Board / University *
                            </label>
                            <select
                              id="enroll-education-board"
                              value={educationBoard}
                              onChange={(e) => {
                                setEducationBoard(e.target.value);
                                setBoard(e.target.value === 'State Board' ? 'TN State Board (Samacheer)' : `${e.target.value} Board`);
                                if (formErrors.educationBoard) setFormErrors((prev) => ({ ...prev, educationBoard: '' }));
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                              required
                            >
                              <option value="CBSE">CBSE (Central Board)</option>
                              <option value="ICSE">ICSE / ISC (Council)</option>
                              <option value="State Board">State Board (Samacheer Kalvi)</option>
                              <option value="Other">Other / University</option>
                            </select>
                            {formErrors.educationBoard && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.educationBoard}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="enroll-target-year" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Target Year / Exam Cycle *
                            </label>
                            <select
                              id="enroll-target-year"
                              value={targetYear}
                              onChange={(e) => {
                                setTargetYear(e.target.value);
                                if (formErrors.targetYear) setFormErrors((prev) => ({ ...prev, targetYear: '' }));
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                              required
                            >
                              <option value="2026">2026 Exam Cycle</option>
                              <option value="2027">2027 Exam Cycle</option>
                              <option value="2028">2028 Exam Cycle</option>
                              <option value="2029">2029 Exam Cycle</option>
                              <option value="2030">2030 Exam Cycle</option>
                            </select>
                            {formErrors.targetYear && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.targetYear}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="enroll-prev-score" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Previous Year Score / Percentage (Optional)
                            </label>
                            <input
                              id="enroll-prev-score"
                              type="text"
                              value={previousScore}
                              onChange={(e) => setPreviousScore(e.target.value)}
                              placeholder='e.g. "88%" or "9.2 CGPA"'
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">Helps teachers gauge baseline conceptual strengths.</p>
                          </div>

                          <div>
                            <label htmlFor="enroll-school-shift" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              School / College Shift Timing *
                            </label>
                            <select
                              id="enroll-school-shift"
                              value={schoolShift}
                              onChange={(e) => {
                                setSchoolShift(e.target.value);
                                if (formErrors.schoolShift) setFormErrors((prev) => ({ ...prev, schoolShift: '' }));
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                              required
                            >
                              <option value="Morning Shift (e.g. 7:30 AM – 1:30 PM)">Morning Shift (e.g. 7:30 AM – 1:30 PM)</option>
                              <option value="Day/Afternoon Shift (e.g. 9:00 AM – 3:30 PM)">Day/Afternoon Shift (e.g. 9:00 AM – 3:30 PM)</option>
                            </select>
                            <p className="text-[11px] text-slate-500 mt-1">Ensures zero overlap with 4:00 PM – 9:00 PM batch slots.</p>
                            {formErrors.schoolShift && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.schoolShift}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection('operational')}
                      className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-50 transition-colors border-b border-[#E2E8F0] text-left cursor-pointer"
                      aria-expanded={openSections.operational}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs uppercase font-bold text-emerald-600">Section 2</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 font-semibold">Contact & Emergency Safety</span>
                          </div>
                          <h2 className="text-base font-bold text-[#0F172A]">
                            Operational & Contact Details
                          </h2>
                        </div>
                      </div>
                      <div className="text-slate-400">
                        {openSections.operational ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {openSections.operational && (
                      <div className="p-5 sm:p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="enroll-student-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Student Full Name * <span className="text-[11px] font-normal text-slate-500">/ மாணவர் பெயர் *</span>
                            </label>
                            <input
                              id="enroll-student-name"
                              type="text"
                              value={studentName}
                              onChange={(e) => {
                                setStudentName(e.target.value);
                                if (formErrors.studentName) setFormErrors((prev) => ({ ...prev, studentName: '' }));
                              }}
                              placeholder="e.g. K. Vignesh"
                              className={`w-full px-3.5 py-2.5 bg-white border ${
                                formErrors.studentName ? 'border-rose-500' : 'border-[#E2E8F0]'
                              } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                              required
                            />
                            {formErrors.studentName && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.studentName}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="enroll-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Calling Mobile Number * <span className="text-[11px] font-normal text-slate-500">/ அழைப்பு கைபேசி எண் *</span>
                            </label>
                            <input
                              id="enroll-phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              placeholder="e.g. 98424 51220"
                              className={`w-full px-3.5 py-2.5 bg-white border ${
                                formErrors.phone ? 'border-rose-500' : 'border-[#E2E8F0]'
                              } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                              required
                            />
                            {formErrors.phone && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="enroll-parent-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Parent / Guardian Name <span className="text-[11px] font-normal text-slate-500">/ பெற்றோர் பெயர்</span>
                            </label>
                            <input
                              id="enroll-parent-name"
                              type="text"
                              value={parentName}
                              onChange={(e) => setParentName(e.target.value)}
                              placeholder="e.g. Mr. S. Kannan (Father)"
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                            />
                          </div>

                          <div>
                            <label htmlFor="enroll-medium" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Medium / Language of Instruction *
                            </label>
                            <select
                              id="enroll-medium"
                              value={mediumOfInstruction}
                              onChange={(e) => {
                                setMediumOfInstruction(e.target.value);
                                if (formErrors.mediumOfInstruction) setFormErrors((prev) => ({ ...prev, mediumOfInstruction: '' }));
                              }}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                              required
                            >
                              <option value="English">English</option>
                              <option value="Hindi">Hindi</option>
                              <option value="Bilingual / Hinglish">Bilingual / Hinglish</option>
                              <option value="Tamil / English (Bilingual)">Tamil / English (Bilingual)</option>
                            </select>
                            {formErrors.mediumOfInstruction && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.mediumOfInstruction}</p>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-md border border-[#E2E8F0] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-bold text-[#0F172A] block">
                              WhatsApp Notifications Number *
                            </span>
                          </div>

                          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sameAsPhone}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSameAsPhone(checked);
                                if (checked) {
                                  setWhatsappNumber(phone);
                                  if (formErrors.whatsappNumber) setFormErrors((prev) => ({ ...prev, whatsappNumber: '' }));
                                }
                              }}
                              className="rounded text-[#EA580C] focus:ring-[#EA580C] h-4 w-4 border-slate-300"
                            />
                            <span>WhatsApp number is same as calling phone number{phone ? ` (${phone})` : ''}</span>
                          </label>

                          {!sameAsPhone && (
                            <div>
                              <input
                                id="enroll-whatsapp-number"
                                type="tel"
                                value={whatsappNumber}
                                onChange={(e) => {
                                  setWhatsappNumber(e.target.value);
                                  if (formErrors.whatsappNumber) setFormErrors((prev) => ({ ...prev, whatsappNumber: '' }));
                                }}
                                placeholder="e.g. 98424 51220 (Dedicated WhatsApp)"
                                className={`w-full px-3.5 py-2.5 bg-white border ${
                                  formErrors.whatsappNumber ? 'border-rose-500' : 'border-[#E2E8F0]'
                                } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                                required={!sameAsPhone}
                              />
                              {formErrors.whatsappNumber && (
                                <p className="text-xs text-rose-600 mt-1">{formErrors.whatsappNumber}</p>
                              )}
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500">Used for mock test report cards, attendance alerts, and homework logs.</p>
                        </div>

                        <div className="p-4 bg-amber-50/60 rounded-md border border-amber-200/80 space-y-3">
                          <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-4 h-4 text-[#EA580C]" />
                            <span className="text-xs uppercase font-bold text-[#0F172A]">
                              Emergency Contact (Mandatory for Offline Batches & Safety) *
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-3">
                            <div>
                              <label htmlFor="enroll-emergency-name" className="block text-xs uppercase font-bold text-slate-600 mb-1">
                                Contact Person Name *
                              </label>
                              <input
                                id="enroll-emergency-name"
                                type="text"
                                value={emergencyContactName}
                                onChange={(e) => {
                                  setEmergencyContactName(e.target.value);
                                  if (formErrors.emergencyContactName) setFormErrors((prev) => ({ ...prev, emergencyContactName: '' }));
                                }}
                                placeholder="e.g. Mrs. Lakshmi Kannan"
                                className={`w-full px-3.5 py-2 bg-white border ${
                                  formErrors.emergencyContactName ? 'border-rose-500' : 'border-[#E2E8F0]'
                                } rounded-md text-xs sm:text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                                required
                              />
                              {formErrors.emergencyContactName && (
                                <p className="text-xs text-rose-600 mt-1">{formErrors.emergencyContactName}</p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="enroll-emergency-rel" className="block text-xs uppercase font-bold text-slate-600 mb-1">
                                Relationship to Student *
                              </label>
                              <select
                                id="enroll-emergency-rel"
                                value={emergencyRelationship}
                                onChange={(e) => {
                                  setEmergencyRelationship(e.target.value);
                                  if (formErrors.emergencyRelationship) setFormErrors((prev) => ({ ...prev, emergencyRelationship: '' }));
                                }}
                                className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                                required
                              >
                                <option value="Father">Father</option>
                                <option value="Mother">Mother</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Other">Other Family Member</option>
                              </select>
                              {formErrors.emergencyRelationship && (
                                <p className="text-xs text-rose-600 mt-1">{formErrors.emergencyRelationship}</p>
                              )}
                            </div>

                            <div>
                              <label htmlFor="enroll-emergency-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1">
                                Emergency Phone *
                              </label>
                              <input
                                id="enroll-emergency-phone"
                                type="tel"
                                value={emergencyPhone}
                                onChange={(e) => {
                                  setEmergencyPhone(e.target.value);
                                  if (formErrors.emergencyPhone) setFormErrors((prev) => ({ ...prev, emergencyPhone: '' }));
                                }}
                                placeholder="e.g. 98424 51222"
                                className={`w-full px-3.5 py-2 bg-white border ${
                                  formErrors.emergencyPhone ? 'border-rose-500' : 'border-[#E2E8F0]'
                                } rounded-md text-xs sm:text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                                required
                              />
                              {formErrors.emergencyPhone && (
                                <p className="text-xs text-rose-600 mt-1">{formErrors.emergencyPhone}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="enroll-sec-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Secondary Landline / Alternate Mobile (Optional)
                            </label>
                            <input
                              id="enroll-sec-phone"
                              type="tel"
                              value={secondaryPhone}
                              onChange={(e) => {
                                setSecondaryPhone(e.target.value);
                                if (formErrors.secondaryPhone) setFormErrors((prev) => ({ ...prev, secondaryPhone: '' }));
                              }}
                              placeholder="e.g. 04328 221234 or 98424 51223"
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                            />
                            {formErrors.secondaryPhone && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.secondaryPhone}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="enroll-medical-alert" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Medical / Health Alert (Optional)
                            </label>
                            <input
                              id="enroll-medical-alert"
                              type="text"
                              value={medicalAlert}
                              onChange={(e) => setMedicalAlert(e.target.value)}
                              placeholder="e.g. Inhaler, dust allergy, specs (Optional)"
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="enroll-start-date" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Preferred Batch Start Date
                            </label>
                            <select
                              id="enroll-start-date"
                              value={startDatePreference}
                              onChange={(e) => setStartDatePreference(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm font-semibold text-[#0F172A]"
                            >
                              <option value="Immediate (This Week)">Immediate (This Week)</option>
                              <option value="Next Monday">From Next Monday</option>
                              <option value="First of Next Month">From 1st of Next Month</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="enroll-weakness" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Learning Challenge or Doubts (Optional)
                            </label>
                            <input
                              id="enroll-weakness"
                              type="text"
                              value={studentWeakness}
                              onChange={(e) => setStudentWeakness(e.target.value)}
                              placeholder="e.g. Hesitant in algebra proofs, physics numericals"
                              className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection('logistics')}
                      className="w-full p-4 sm:p-5 flex items-center justify-between bg-slate-50/70 hover:bg-slate-50 transition-colors border-b border-[#E2E8F0] text-left cursor-pointer"
                      aria-expanded={openSections.logistics}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs uppercase font-bold text-blue-600">Section 3</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 font-semibold">Verification & Logistics</span>
                          </div>
                          <h2 className="text-base font-bold text-[#0F172A]">
                            Logistics, Verification & Invoicing
                          </h2>
                        </div>
                      </div>
                      <div className="text-slate-400">
                        {openSections.logistics ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {openSections.logistics && (
                      <div className="p-5 sm:p-6 space-y-5">
                        {includesPrintedMaterials ? (
                          <div className="p-4 bg-orange-50/60 rounded-md border border-orange-200/80 space-y-3">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4 text-[#EA580C]" />
                              <span className="text-xs uppercase font-bold text-[#0F172A]">
                                Physical Shipping / Book Dispatch Address (Printed Materials Included) *
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              This batch includes printed formula books, chapter worksheets, and board question archives dispatched to your home.
                            </p>

                            <div className="space-y-3 pt-1">
                              <div>
                                <label htmlFor="enroll-address-street" className="block text-xs uppercase font-bold text-slate-600 mb-1">
                                  Street Address / House No. *
                                </label>
                                <input
                                  id="enroll-address-street"
                                  type="text"
                                  value={addressStreet}
                                  onChange={(e) => {
                                    setAddressStreet(e.target.value);
                                    if (formErrors.addressStreet) setFormErrors((prev) => ({ ...prev, addressStreet: '' }));
                                  }}
                                  placeholder="e.g. Door No. 24, Bharathi Nagar 2nd Cross, Thoramangalam"
                                  className={`w-full px-3.5 py-2.5 bg-white border ${
                                    formErrors.addressStreet ? 'border-rose-500' : 'border-[#E2E8F0]'
                                  } rounded-md text-xs sm:text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                                  required={includesPrintedMaterials}
                                />
                                {formErrors.addressStreet && (
                                  <p className="text-xs text-rose-600 mt-1">{formErrors.addressStreet}</p>
                                )}
                              </div>

                              <div className="grid sm:grid-cols-3 gap-3">
                                <div>
                                  <label htmlFor="enroll-address-landmark" className="block text-xs uppercase font-bold text-slate-600 mb-1">
                                    Landmark (Optional)
                                  </label>
                                  <input
                                    id="enroll-address-landmark"
                                    type="text"
                                    value={addressLandmark}
                                    onChange={(e) => setAddressLandmark(e.target.value)}
                                    placeholder="e.g. Near New Bus Stand"
                                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                                  />
                                </div>

                                <div>
                                  <label htmlFor="enroll-address-city" className="block text-xs uppercase font-bold text-slate-600 mb-1">
                                    City & State *
                                  </label>
                                  <input
                                    id="enroll-address-city"
                                    type="text"
                                    value={addressCityState}
                                    onChange={(e) => {
                                      setAddressCityState(e.target.value);
                                      if (formErrors.addressCityState) setFormErrors((prev) => ({ ...prev, addressCityState: '' }));
                                    }}
                                    placeholder="e.g. Perambalur, Tamil Nadu"
                                    className={`w-full px-3.5 py-2 bg-white border ${
                                      formErrors.addressCityState ? 'border-rose-500' : 'border-[#E2E8F0]'
                                    } rounded-md text-xs sm:text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                                    required={includesPrintedMaterials}
                                  />
                                  {formErrors.addressCityState && (
                                    <p className="text-xs text-rose-600 mt-1">{formErrors.addressCityState}</p>
                                  )}
                                </div>

                                <div>
                                  <label htmlFor="enroll-address-pin" className="block text-xs uppercase font-bold text-slate-600 mb-1">
                                    Pincode (6-Digit) *
                                  </label>
                                  <input
                                    id="enroll-address-pin"
                                    type="text"
                                    maxLength={6}
                                    value={addressPincode}
                                    onChange={(e) => {
                                      setAddressPincode(e.target.value);
                                      if (formErrors.addressPincode) setFormErrors((prev) => ({ ...prev, addressPincode: '' }));
                                    }}
                                    placeholder="e.g. 621212"
                                    className={`w-full px-3.5 py-2 bg-white border ${
                                      formErrors.addressPincode ? 'border-rose-500' : 'border-[#E2E8F0]'
                                    } rounded-md text-xs sm:text-sm font-mono font-bold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                                    required={includesPrintedMaterials}
                                  />
                                  {formErrors.addressPincode && (
                                    <p className="text-xs text-rose-600 mt-1">{formErrors.addressPincode}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-slate-50 rounded-md border border-[#E2E8F0] text-xs text-slate-600 flex items-start space-x-2.5">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Digital Classroom Curriculum:</strong> All worksheets, problem banks, and formula cheat sheets for this batch are provided directly during classroom sessions. Physical postal delivery is not required.
                            </span>
                          </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="enroll-id-number" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              Identity Proof / Student ID Number *
                            </label>
                            <input
                              id="enroll-id-number"
                              type="text"
                              value={studentIdNumber}
                              onChange={(e) => {
                                setStudentIdNumber(e.target.value);
                                if (formErrors.studentIdNumber) setFormErrors((prev) => ({ ...prev, studentIdNumber: '' }));
                              }}
                              placeholder="e.g. School ID Card No., Aadhaar or Govt ID No."
                              className={`w-full px-3.5 py-2.5 bg-white border ${
                                formErrors.studentIdNumber ? 'border-rose-500' : 'border-[#E2E8F0]'
                              } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                              required
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                              Mandatory for institutional verification, test series hall tickets, and campus entry badge.
                            </p>
                            {formErrors.studentIdNumber && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.studentIdNumber}</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="enroll-gstin" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                              GSTIN for Tax Invoice (Optional)
                            </label>
                            <input
                              id="enroll-gstin"
                              type="text"
                              maxLength={15}
                              value={gstin}
                              onChange={(e) => {
                                setGstin(e.target.value.toUpperCase());
                                if (formErrors.gstin) setFormErrors((prev) => ({ ...prev, gstin: '' }));
                              }}
                              placeholder="e.g. 33AAAAA0000A1Z5 (15 Chars)"
                              className={`w-full px-3.5 py-2.5 bg-white border ${
                                formErrors.gstin ? 'border-rose-500' : 'border-[#E2E8F0]'
                              } rounded-md text-sm font-mono font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C] uppercase`}
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                              Provide business GSTIN if claiming GST tax credit on official fee receipts.
                            </p>
                            {formErrors.gstin && (
                              <p className="text-xs text-rose-600 mt-1">{formErrors.gstin}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                    <label className="flex items-start space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        defaultChecked={true}
                        className="mt-0.5 rounded text-[#EA580C] focus:ring-[#EA580C] h-4 w-4 border-emerald-300"
                      />
                      <span className="leading-snug">
                        <strong>Verifiable Guardian Declaration (DPDP Act 2023):</strong> I confirm I am the parent or legal guardian of this student and consent to educational admission processing and emergency protocol activation. Zero online prepayment required.
                      </span>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/batch/${selectedBatch.id}`)}
                      className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
                    >
                      ← Back to Batch Details
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold rounded-md shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      <span>{isSubmitting ? 'Verifying & Reserving...' : 'Complete Batch Enrollment'}</span>
                      <Send className="w-4 h-4 text-orange-200" />
                    </button>
                  </div>
                </form>
              </div>
            )}
      </div>
    </div>
  );
}
