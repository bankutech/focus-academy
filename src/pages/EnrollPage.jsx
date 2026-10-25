import React, { useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  ShieldCheck, 
  MessageSquare, 
  Send 
} from 'lucide-react';
import { BATCHES_DATA } from '../data/batchesData';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow, getStepRedirect } from '../context/useAppContext';
import { validateIndianMobile, isBatchCompatible } from '../types/schemas';
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

  const [studentName, setStudentName] = useState(studentFlow.studentName || '');
  const [parentName, setParentName] = useState(studentFlow.parentName || '');
  const [phone, setPhone] = useState(studentFlow.phone || '');
  const [schoolName, setSchoolName] = useState('');
  const [board, setBoard] = useState(studentFlow.board || selectedBatch.board);
  const [startDatePreference, setStartDatePreference] = useState('Immediate (This Week)');
  const [studentWeakness, setStudentWeakness] = useState('');

  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const redirectPath = getStepRedirect(5, studentFlow);
  if (redirectPath) {
    return <Navigate to={redirectPath} state={{ redirectedFrom: 5 }} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setNameError('');

    if (!studentName.trim()) {
      setNameError('Student name is required');
      return;
    }

    const validation = validateIndianMobile(phone);
    if (!validation.valid) {
      setPhoneError(validation.error || validation.message);
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
      phone: validation.sanitized,
      grade: studentFlow.grade || selectedBatch.grade,
      board,
      stepToken: session.stepToken
    });

    if (!reservation.success) {
      if (reservation.canWaitlist) {
        const wl = await BatchService.reserveSeatWithDetails(selectedBatch.id, {
          studentName: studentName.trim(),
          phone: validation.sanitized,
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

    const enrollmentRecord = {
      studentName: studentName.trim(),
      parentName: parentName.trim(),
      phone: validation.sanitized,
      schoolName: schoolName.trim(),
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

    await LeadService.submitLead({
      studentName: enrollmentRecord.studentName,
      parentName: enrollmentRecord.parentName,
      phone: enrollmentRecord.phone,
      grade: enrollmentRecord.grade,
      board: enrollmentRecord.board,
      batchId: selectedBatch.id,
      reservationId: enrollmentRecord.reservationId,
      stepToken: session.stepToken,
      timing: selectedBatch.timing,
      subjects: selectedBatch.name,
      notes: `${reservation.waitlisted ? `Priority Waitlist (#${reservation.waitlistPosition}) | ` : ''}Admission Slip ID: ${saved.id} | Batch: ${selectedBatch.name} (${selectedBatch.timing}) | School: ${enrollmentRecord.schoolName || 'N/A'} | Start: ${startDatePreference} | Challenges: ${enrollmentRecord.studentWeakness || 'None'}`,
    });

    setStudentFlow((prev) => ({
      ...prev,
      studentName: enrollmentRecord.studentName,
      parentName: enrollmentRecord.parentName,
      phone: enrollmentRecord.phone,
      selectedBatchId: selectedBatch.id,
      step: 5,
    }));

    const prefilledText = `Hello Focus Academy! I have completed admission registration for student: ${enrollmentRecord.studentName} (${enrollmentRecord.grade}, ${enrollmentRecord.board}). Selected Batch: ${selectedBatch.name} (${selectedBatch.timing}). Slip ID: ${saved.id}.`;
    const whatsappUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(prefilledText)}`;

    setIsSubmitting(false);
    setSubmissionResult({
      success: true,
      data: saved,
      whatsappUrl,
      waitlisted: Boolean(reservation.waitlisted),
      waitlistPosition: reservation.waitlistPosition,
    });
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left">
      <StepProgress currentStep={5} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
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

            <div className="mt-6 p-5 bg-slate-50 rounded-md border border-[#E2E8F0] text-xs text-left space-y-2 max-w-md mx-auto">
              <div className="flex justify-between pb-2 border-b border-[#E2E8F0]">
                <span className="text-slate-500">Admission Slip No:</span>
                <span className="font-bold text-[#0F172A]">{submissionResult.data?.id || 'FA-2026-ENR'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch:</span>
                <span className="font-bold text-[#EA580C] text-right truncate max-w-[200px]">{selectedBatch.shortTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="font-bold text-[#0F172A]">{selectedBatch.timing} (Mon-Sat)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Classroom:</span>
                <span className="font-bold text-[#0F172A]">Thiripura Complex, 1st Floor</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
                <span className="text-slate-500">Monthly Fee:</span>
                <span className="font-bold text-emerald-700">₹{selectedBatch.monthlyFee.toLocaleString('en-IN')} / month</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-emerald-50 rounded-md border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2.5 max-w-md mx-auto">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>
                Protected by 100% No-Questions-Asked Rematch Guarantee after Session 1.
              </span>
            </div>

            <div className="mt-8 space-y-3 max-w-md mx-auto">
              {submissionResult.whatsappUrl && (
                <a
                  href={submissionResult.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm rounded-md shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Send Confirmation via WhatsApp →</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-3 bg-white hover:bg-slate-50 text-[#0F172A] font-bold text-xs rounded-md border border-[#E2E8F0] shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Save / Print Admission Slip (PDF)</span>
              </button>

              <a
                href={`upi://pay?pa=9842451220@upi&pn=Focus%20Academy&am=${selectedBatch.monthlyFee}&cu=INR&tn=Focus%20Academy%20Admission`}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-[#0F172A] font-bold text-xs rounded-md border border-[#CBD5E1] transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Pay ₹{selectedBatch.monthlyFee.toLocaleString('en-IN')} via UPI (GPay / PhonePe)</span>
              </a>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
              >
                Return to Focus Academy Home
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
            {!studentFlow.studentName && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700">
                <span>Navigated directly? You can enter details here, or start from Step 1 for personalized board recommendations.</span>
                <Link to="/student-details" className="text-[#EA580C] font-bold hover:underline shrink-0">
                  Start at Step 1 →
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                  Confirm Enrollment & Reserve Seat
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Review the selected batch details and submit to complete your registration.
                </p>
              </div>

              <Link
                to={`/batch/${selectedBatch.id}`}
                className="text-xs text-slate-500 hover:text-[#0F172A] hidden sm:block"
              >
                ← Back to Batch Details
              </Link>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs uppercase font-bold text-slate-500">
                      Selected Evening Batch
                    </span>
                    <Link
                      to="/batches"
                      className="text-xs text-[#EA580C] hover:underline"
                    >
                      Change Batch
                    </Link>
                  </div>

                  <h3 className="text-lg font-bold text-[#0F172A] leading-snug">
                    {selectedBatch.name}
                  </h3>

                  <div className="space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                      <span>{selectedBatch.timing} (Mon – Sat)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                      <span>Max 12 Students ({selectedBatch.seatsRemaining} Seats Left)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                      <span className="truncate">{selectedBatch.classroom}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs uppercase text-slate-500 block mb-1">
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

                  <div className="pt-2 text-xs text-slate-500 flex items-center justify-between">
                    <span>Batch Setup:</span>
                    <strong className="text-[#0F172A]">Small Batch (Max 12 Seats)</strong>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase text-slate-500 block">
                        Monthly Tuition Fee
                      </span>
                      <span className="text-2xl font-extrabold text-[#0F172A]">
                        ₹{selectedBatch.monthlyFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-700 font-bold">
                      Zero Reg. Fee
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-md border border-[#E2E8F0] text-xs text-slate-600 space-y-1.5">
                  <span className="font-bold text-[#0F172A] block">Focus Academy Campus Desk:</span>
                  <p>{CAMPUS_CONFIG.location.fullAddress}</p>
                  <p className="text-[#EA580C] font-semibold">Phone: {CAMPUS_CONFIG.contact.primaryPhone}</p>
                </div>
              </div>

              <div className="lg:col-span-3">
                <form
                  onSubmit={handleSubmit}
                  className="bg-white p-6 sm:p-8 rounded-lg border border-[#E2E8F0] shadow-xs space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1.5">
                    <h2 className="text-base font-bold text-[#0F172A]">
                      Student & Admission Details
                    </h2>
                    {studentFlow.studentName && (
                      <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold self-start sm:self-auto">
                        ✓ Verified from Step 1
                      </span>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enroll-student-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                        Student Full Name *
                      </label>
                      <input
                        id="enroll-student-name"
                        type="text"
                        value={studentName}
                        onChange={(e) => {
                          setStudentName(e.target.value);
                          if (nameError) setNameError('');
                        }}
                        placeholder="e.g. K. Vignesh"
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                          nameError ? 'border-rose-500' : 'border-[#E2E8F0]'
                        } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                        required
                      />
                      {nameError && (
                        <p className="text-xs text-rose-600 mt-1">{nameError}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="enroll-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        id="enroll-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="e.g. 98424 51220"
                        className={`w-full px-3.5 py-2.5 bg-white border ${
                          phoneError ? 'border-rose-500' : 'border-[#E2E8F0]'
                        } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                        required
                      />
                      {phoneError && (
                        <p className="text-xs text-rose-600 mt-1">{phoneError}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enroll-parent-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                        Parent / Guardian Name
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
                      <label htmlFor="enroll-school-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                        Current School (In Perambalur / Thoramangalam)
                      </label>
                      <input
                        id="enroll-school-name"
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Thanthai Hans Roever, DS..."
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enroll-board" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                        Education Board
                      </label>
                      <select
                        id="enroll-board"
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm font-semibold text-[#0F172A]"
                      >
                        <option value="TN State Board (Samacheer)">TN State Board (Samacheer)</option>
                        <option value="CBSE Board">CBSE Board (NCERT)</option>
                        <option value="ICSE Board">ICSE Board</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="enroll-start-date" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                        Preferred Start Date
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
                  </div>

                  <div>
                    <label htmlFor="enroll-weakness" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Specific Learning Challenge or Doubts (Optional)
                    </label>
                    <textarea
                      id="enroll-weakness"
                      rows="2"
                      value={studentWeakness}
                      onChange={(e) => setStudentWeakness(e.target.value)}
                      placeholder="e.g. Hesitant to ask doubts in school, weak in geometry proofs, needs physics derivations practice..."
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-xs sm:text-sm text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                    />
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
                        <strong>Verifiable Guardian Declaration (DPDP Act 2023):</strong> I confirm I am the parent or legal guardian of this student and consent to educational admission processing. Zero prepayment required online.
                      </span>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/batch/${selectedBatch.id}`)}
                      className="text-xs font-semibold text-slate-500 hover:text-[#0F172A]"
                    >
                      ← Back to Batch Details
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold rounded-md shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      <span>{isSubmitting ? 'Submitting...' : 'Complete Batch Enrollment'}</span>
                      <Send className="w-4 h-4 text-orange-200" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
