import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Users 
} from 'lucide-react';
import StepProgress from '../components/common/StepProgress';
import { batchesData, getBatchById, resolveBoardForBatch } from '../data/batchesData';
import { LeadService } from '../services/leadService';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { useStudentFlow } from '../context/useAppContext';
import { validateIndianMobile } from '../types/schemas';

export default function EnrollPage() {
  const { batchId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { studentFlow, updateStudentFlow } = useStudentFlow();

  const currentBatchId = batchId || searchParams.get('batchId') || studentFlow.selectedBatchId || batchesData[0].id;
  const selectedBatch = useMemo(() => {
    return getBatchById(currentBatchId) || batchesData[0];
  }, [currentBatchId]);

  const [studentName, setStudentName] = useState(studentFlow.studentName || '');
  const [phone, setPhone] = useState(studentFlow.phone || '');
  const [parentName, setParentName] = useState(studentFlow.parentName || '');
  const [schoolName, setSchoolName] = useState('');
  const [board, setBoard] = useState(studentFlow.board || resolveBoardForBatch(selectedBatch, studentFlow.board));
  const [studentWeakness, setStudentWeakness] = useState('');
  const [startDatePreference, setStartDatePreference] = useState('Immediate (This Week)');

  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    if (selectedBatch && selectedBatch.id !== studentFlow.selectedBatchId) {
      updateStudentFlow({ selectedBatchId: selectedBatch.id });
    }
  }, [selectedBatch, studentFlow.selectedBatchId, updateStudentFlow]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setNameError('');

    if (!studentName.trim() || studentName.trim().length < 2) {
      setNameError('Please enter student full name.');
      return;
    }

    const val = validateIndianMobile(phone);
    if (!val.valid) {
      setPhoneError(val.error);
      return;
    }

    setIsSubmitting(true);

    const targetGrade = studentFlow.grade || selectedBatch.grade;

    const leadPayload = {
      studentName: studentName.trim(),
      parentName: parentName.trim(),
      phone: val.sanitized,
      grade: targetGrade,
      board: board,
      subjects: selectedBatch.subjects.join(', '),
      notes: `Batch: ${selectedBatch.name} | Timing: ${selectedBatch.timing} | School: ${schoolName || 'Local School'} | Start: ${startDatePreference} | Goal: ${studentFlow.examPrep || 'Board Excellence'} | Focus: ${studentWeakness || 'None specified'}`,
    };

    const result = await LeadService.submitLead(leadPayload);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.errors?.phone) setPhoneError(result.errors.phone);
      if (result.errors?.studentName) setNameError(result.errors.studentName);
      return;
    }

    const customWhatsAppText = encodeURIComponent(
      `Hello Focus Academy Thoramangalam! 👋\n\nI want to confirm enrollment for my child:\n\n• Batch: ${selectedBatch.name}\n• Timing: ${selectedBatch.timing} (Mon-Sat)\n• Student Name: ${studentName.trim()}\n• Parent Name: ${parentName.trim() || 'Parent'}\n• Class & Board: ${targetGrade} (${board})\n• Contact: +91 ${val.sanitized}\n• Start Preference: ${startDatePreference}\n• Focus Area: ${studentWeakness || 'General'}\n\nPlease confirm seat reservation at Thiripura Complex.`
    );
    result.whatsappUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${customWhatsAppText}`;

    setSubmissionResult(result);
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-left">
      <StepProgress currentStep={5} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {submissionResult ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8E2D8] shadow-editorial-lg text-center max-w-2xl mx-auto animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-[#181614] text-white flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 className="w-9 h-9 text-[#C2410C]" />
            </div>

            <span className="text-[11px] font-code-mono uppercase tracking-wider text-[#C2410C] font-bold block mb-1">
              Seat Reservation Confirmed
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-[#181614] tracking-tight">
              Seat Reserved & Admission Slip Generated!
            </h1>

            <p className="mt-2 text-sm text-[#57534E] max-w-md mx-auto">
              Thank you, <strong>{studentName}</strong>. Your seat reservation has been queued for <strong>{selectedBatch.name}</strong>.
            </p>

            <div className="mt-6 p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] text-xs font-code-mono text-left space-y-2 max-w-md mx-auto shadow-editorial-inset">
              <div className="flex justify-between pb-2 border-b border-[#E8E2D8]">
                <span className="text-[#78716C]">Admission Slip No:</span>
                <span className="font-bold text-[#181614]">{submissionResult.data?.id || 'FA-2026-ENR'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Batch:</span>
                <span className="font-bold text-[#C2410C] text-right truncate max-w-[200px]">{selectedBatch.shortTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Schedule:</span>
                <span className="font-bold text-[#181614]">{selectedBatch.timing} (Mon-Sat)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#78716C]">Classroom:</span>
                <span className="font-bold text-[#181614]">Thiripura Complex, 1st Floor</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8E2D8]">
                <span className="text-[#78716C]">Monthly Fee:</span>
                <span className="font-bold text-emerald-700">₹{selectedBatch.monthlyFee.toLocaleString('en-IN')} / month</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2.5 max-w-md mx-auto">
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
                  className="w-full py-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-sm rounded-xl shadow-editorial transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Send Confirmation via WhatsApp →</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-3 bg-[#181614] hover:bg-[#292524] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Return to Focus Academy Home
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#181614] tracking-tight">
                  Confirm Enrollment & Reserve Seat
                </h1>
                <p className="text-sm text-[#57534E] mt-1">
                  Review the selected batch details and submit to complete your registration.
                </p>
              </div>

              <Link
                to={`/batch/${selectedBatch.id}`}
                className="text-xs font-code-mono text-[#78716C] hover:text-[#181614] hidden sm:block"
              >
                ← Back to Batch Details
              </Link>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-editorial space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
                    <span className="text-[10px] font-code-mono uppercase font-bold text-[#78716C]">
                      Selected Evening Batch
                    </span>
                    <Link
                      to="/batches"
                      className="text-[11px] font-code-mono text-[#C2410C] hover:underline"
                    >
                      Change Batch
                    </Link>
                  </div>

                  <h3 className="text-lg font-bold text-[#181614] leading-snug">
                    {selectedBatch.name}
                  </h3>

                  <div className="space-y-2.5 text-xs font-code-mono">
                    <div className="flex items-center space-x-2 text-[#57534E]">
                      <Clock className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                      <span>{selectedBatch.timing} (Mon – Sat)</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[#57534E]">
                      <Users className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                      <span>Max 12 Students ({selectedBatch.seatsRemaining} Seats Left)</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[#57534E]">
                      <MapPin className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                      <span className="truncate">{selectedBatch.classroom}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#FAF7F2]">
                    <span className="text-[10px] font-code-mono uppercase text-[#78716C] block mb-1">
                      Subjects Included:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedBatch.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded text-[11px] font-semibold text-[#181614]"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 text-xs font-code-mono text-[#78716C] flex items-center justify-between">
                    <span>Batch Setup:</span>
                    <strong className="text-[#181614]">Small Batch (Max 12 Seats)</strong>
                  </div>

                  <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-code-mono uppercase text-[#78716C] block">
                        Monthly Tuition Fee
                      </span>
                      <span className="text-2xl font-black text-[#181614]">
                        ₹{selectedBatch.monthlyFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-xs font-code-mono text-emerald-700 font-bold">
                      Zero Reg. Fee
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#E8E2D8] text-xs font-code-mono text-[#57534E] space-y-1.5">
                  <span className="font-bold text-[#181614] block">Focus Academy Campus Desk:</span>
                  <p>{CAMPUS_CONFIG.location.fullAddress}</p>
                  <p className="text-[#C2410C] font-semibold">Phone: {CAMPUS_CONFIG.contact.primaryPhone}</p>
                </div>
              </div>

              <div className="lg:col-span-3">
                <form
                  onSubmit={handleSubmit}
                  className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-editorial space-y-5"
                >
                  <h2 className="text-base font-bold text-[#181614] pb-3 border-b border-[#FAF7F2]">
                    Student & Admission Details
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enroll-student-name" className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
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
                          nameError ? 'border-rose-500' : 'border-[#E8E2D8]'
                        } rounded-xl text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]`}
                        required
                      />
                      {nameError && (
                        <p className="text-[11px] text-rose-600 mt-1">{nameError}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="enroll-phone" className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
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
                          phoneError ? 'border-rose-500' : 'border-[#E8E2D8]'
                        } rounded-xl text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]`}
                        required
                      />
                      {phoneError && (
                        <p className="text-[11px] text-rose-600 mt-1">{phoneError}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enroll-parent-name" className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                        Parent / Guardian Name
                      </label>
                      <input
                        id="enroll-parent-name"
                        type="text"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="e.g. Mr. S. Kannan (Father)"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D8] rounded-xl text-sm font-medium text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                      />
                    </div>

                    <div>
                      <label htmlFor="enroll-school-name" className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                        Current School (In Perambalur / Thoramangalam)
                      </label>
                      <input
                        id="enroll-school-name"
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Thanthai Hans Roever, DS..."
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D8] rounded-xl text-sm font-medium text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="enroll-board" className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                        Education Board
                      </label>
                      <select
                        id="enroll-board"
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-semibold text-[#181614]"
                      >
                        <option value="TN State Board (Samacheer)">TN State Board (Samacheer)</option>
                        <option value="CBSE Board">CBSE Board (NCERT)</option>
                        <option value="ICSE Board">ICSE Board</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="enroll-start-date" className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                        Preferred Start Date
                      </label>
                      <select
                        id="enroll-start-date"
                        value={startDatePreference}
                        onChange={(e) => setStartDatePreference(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D8] rounded-xl text-xs sm:text-sm font-semibold text-[#181614]"
                      >
                        <option value="Immediate (This Week)">Immediate (This Week)</option>
                        <option value="Next Monday">From Next Monday</option>
                        <option value="First of Next Month">From 1st of Next Month</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="enroll-weakness" className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                      Specific Learning Challenge or Doubts (Optional)
                    </label>
                    <textarea
                      id="enroll-weakness"
                      rows="2"
                      value={studentWeakness}
                      onChange={(e) => setStudentWeakness(e.target.value)}
                      placeholder="e.g. Hesitant to ask doubts in school, weak in geometry proofs, needs physics derivations practice..."
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D8] rounded-xl text-xs sm:text-sm text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                    />
                  </div>

                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Zero prepayment required online. Tuition fee payable at campus desk after first session.
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/batch/${selectedBatch.id}`)}
                      className="text-xs font-semibold text-[#78716C] hover:text-[#181614]"
                    >
                      ← Back to Batch Details
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-bold rounded-xl shadow-editorial transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      <span>{isSubmitting ? 'Submitting...' : 'Complete Batch Enrollment'}</span>
                      <Send className="w-4 h-4 text-[#FED7AA]" />
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
