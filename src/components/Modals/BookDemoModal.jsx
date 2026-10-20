import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Video, 
  ClipboardCheck, 
  PhoneCall,
  Building2 
} from 'lucide-react';

import { LeadService } from '../../services/leadService';
import { validateIndianMobile } from '../../types/schemas';
import { CAMPUS_CONFIG } from '../../config/campusConfig';

export default function BookDemoModal({ isOpen, onClose, preselectedSubject }) {
  const [step, setStep] = useState(1);
  const [sessionType, setSessionType] = useState(
    preselectedSubject && preselectedSubject.includes('Parent') ? 'alignment-call' : 'diagnostic-trial'
  );
  const [subject, setSubject] = useState(preselectedSubject || 'Class 10 State Board (SSLC)');
  const [mode, setMode] = useState('offline');
  const [timing, setTiming] = useState('Batch 2: 6:00 PM – 7:30 PM');
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('');
  const [childChallenge, setChildChallenge] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNext = async (e) => {
    e.preventDefault();
    if (step === 1 && !subject) return;
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      setPhoneError('');
      setNameError('');
      if (!studentName.trim()) {
        setNameError('Please provide student or parent name.');
        return;
      }
      const val = validateIndianMobile(phone);
      if (!val.valid) {
        setPhoneError(val.error);
        return;
      }

      await LeadService.submitLead({
        studentName: studentName.trim(),
        phone: val.sanitized,
        grade: subject.slice(0, 15),
        board: 'Focus Academy Track',
        subjects: subject,
        notes: `${sessionType === 'alignment-call' ? '5-Min Alignment Call' : '1-Day Free Trial'} | Timing: ${timing} | Challenge: ${childChallenge || 'None specified'}`
      });

      const customWhatsAppText = encodeURIComponent(
        `Hello Focus Academy Thoramangalam! 👋\n\nI want to confirm a ${sessionType === 'alignment-call' ? '5-Min Parent Alignment Call' : '1-Day Free Trial'}:\n\n• Student: ${studentName.trim()}\n• Contact: +91 ${val.sanitized}\n• Subject: ${subject}\n• Format: ${mode === 'online' ? 'Online Interactive' : 'Classroom Batch (Thiripura Complex)'}\n• Preferred Slot: ${timing}\n• Challenge/Goal: ${childChallenge || 'General'}\n\nPlease confirm availability.`
      );
      setWhatsappUrl(`https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${customWhatsAppText}`);
      setIsSubmitted(true);
      return;
    }
    setStep(step + 1);
  };

  const handleReset = () => {
    setStep(1);
    setIsSubmitted(false);
    setPhoneError('');
    setNameError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-modal-headline"
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#F8FAFC] rounded-3xl shadow-editorial-lg border border-[#E2E8F0] overflow-hidden my-auto text-left animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="bg-[#0F172A] p-5 sm:p-6 text-white relative border-b border-[#1E293B] shrink-0">
          <button
            type="button"
            onClick={handleReset}
            aria-label="Close diagnostic trial booking modal"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1.5 text-xs uppercase tracking-wider text-orange-200 mb-1">
            <ClipboardCheck className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Focus Academy Pedagogical Protocol</span>
          </div>

          <h3 id="demo-modal-headline" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {sessionType === 'alignment-call' ? 'Schedule 5-Min Parent Alignment Call' : 'Schedule 45-Min Diagnostic Trial'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-normal">
            {sessionType === 'alignment-call' 
              ? 'Direct 5-minute phone conversation for parents to calibrate student temperament & anxiety. 100% free.'
              : 'Identify prior syllabus gaps with classroom diagnostic assessment. 100% complimentary.'
            }
          </p>

          <div className="mt-3 inline-flex p-1 bg-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setSessionType('diagnostic-trial')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                sessionType === 'diagnostic-trial' ? 'bg-[#EA580C] text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              45-Min Trial Session
            </button>
            <button
              type="button"
              onClick={() => setSessionType('alignment-call')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 ${
                sessionType === 'alignment-call' ? 'bg-[#EA580C] text-white font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <PhoneCall className="w-3 h-3" />
              <span>5-Min Parent Call</span>
            </button>
          </div>

          {!isSubmitted && (
            <div className="mt-3 flex items-center space-x-2 text-xs">
              <span className={`px-2 py-0.5 rounded ${step >= 1 ? 'bg-[#EA580C] text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>
                1. Syllabus
              </span>
              <span className="text-slate-500">→</span>
              <span className={`px-2 py-0.5 rounded ${step >= 2 ? 'bg-[#EA580C] text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>
                2. Format
              </span>
              <span className="text-slate-500">→</span>
              <span className={`px-2 py-0.5 rounded ${step >= 3 ? 'bg-[#EA580C] text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>
                3. Registry
              </span>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-7 overflow-y-auto">
          {isSubmitted ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-[#0F172A] text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-[#EA580C]" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-[#0F172A]">
                  {sessionType === 'alignment-call' ? 'Parent Alignment Call Scheduled' : 'Diagnostic Trial Confirmed'}
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Our academic desk will confirm classroom trial batch allocation for <strong>{subject}</strong>.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] text-xs text-left space-y-2 max-w-sm mx-auto shadow-editorial-inset">
                <div className="flex justify-between">
                  <span className="text-slate-500">Parent / Student:</span>
                  <span className="font-bold text-[#0F172A]">{studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Syllabus / Track:</span>
                  <span className="font-bold text-[#EA580C]">{subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Format:</span>
                  <span className="font-bold text-[#0F172A]">
                    {sessionType === 'alignment-call' 
                      ? '5-Min Direct Phone Calibration' 
                      : (mode === 'online' ? '1-on-1 Live Whiteboard' : 'Classroom Center (Thiripura Complex)')}
                  </span>
                </div>
                {childChallenge && (
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Focus Area:</span>
                    <span className="font-bold text-[#0F172A] truncate">{childChallenge}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Fee:</span>
                  <span className="font-bold text-emerald-700">₹0.00 (Zero Fee • 100% Free)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2 max-w-sm mx-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Protected by 100% No-Questions-Asked Rematch Guarantee.</span>
              </div>

              <p className="text-xs text-slate-500">
                SMS confirmation dispatched to {phone}.
              </p>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow-editorial transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Chat on WhatsApp Directly →</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Return to Batches
              </button>
            </div>
          ) : (
            <form onSubmit={handleNext} className="space-y-4">
              {step === 1 && (
                <div className="space-y-3">
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-600">
                    Enter Target Subject or Academic Exam *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Class 10 State Board Maths, Physics Derivations, CBSE Science..."
                    className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                    required
                  />

                  <div className="pt-2">
                    <span className="text-xs uppercase text-slate-500 block mb-1.5 font-bold">Frequent Disciplines:</span>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {[
                        'Class 10 State Board (SSLC)',
                        'Class 10 CBSE Maths & Science',
                        'Class 12 Physics & Chemistry',
                        'Class 12 Higher Mathematics',
                        'Classes 6–8 Foundation',
                        'NEET / JEE Numerical Clarity'
                      ].map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSubject(item)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            subject === item
                              ? 'bg-[#0F172A] text-white font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border border-[#E2E8F0]'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-600">
                    Session Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('offline')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === 'offline'
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-white border-[#E2E8F0] text-slate-600'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-[#EA580C] mb-1" />
                      <p className="text-xs font-bold">Classroom Center Batch</p>
                      <p className="text-xs opacity-70">Thiripura Complex, Thoramangalam</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('online')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        mode === 'online'
                          ? 'bg-[#0F172A] text-white border-[#0F172A]'
                          : 'bg-white border-[#E2E8F0] text-slate-600'
                      }`}
                    >
                      <Video className="w-4 h-4 text-[#EA580C] mb-1" />
                      <p className="text-xs font-bold">1-on-1 Online</p>
                      <p className="text-xs opacity-70">HD Whiteboard Workspace</p>
                    </button>
                  </div>

                  <div>
                    <label htmlFor="demo-timing" className="block text-xs uppercase font-bold tracking-wider text-slate-600 mb-1">
                      Preferred Evening Batch Slot
                    </label>
                    <select
                      id="demo-timing"
                      value={timing}
                      onChange={(e) => setTiming(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A]"
                    >
                      <option value="Batch 1: 4:30 PM – 6:00 PM">Batch 1: 4:30 PM – 6:00 PM (Middle / Foundation)</option>
                      <option value="Batch 2: 6:00 PM – 7:30 PM">Batch 2: 6:00 PM – 7:30 PM (Secondary Board Slot)</option>
                      <option value="Batch 3: 7:30 PM – 9:00 PM">Batch 3: 7:30 PM – 9:00 PM (Senior 11 & 12 Slot)</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="demo-student-name" className="block text-xs uppercase font-bold tracking-wider text-slate-600 mb-1">
                      Student / Parent Name *
                    </label>
                    <input
                      id="demo-student-name"
                      type="text"
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      placeholder="e.g. S. Kannan (Parent)"
                      className={`w-full bg-white border ${
                        nameError ? 'border-rose-500' : 'border-[#E2E8F0]'
                      } rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-[#0F172A]`}
                      required
                    />
                    {nameError && (
                      <p className="text-xs text-rose-600 mt-1">{nameError}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="demo-phone" className="block text-xs uppercase font-bold tracking-wider text-slate-600 mb-1">
                      Mobile Number (For Confirmation & Reminders) *
                    </label>
                    <input
                      id="demo-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) setPhoneError('');
                      }}
                      placeholder="e.g. 98424 51220"
                      className={`w-full bg-white border ${
                        phoneError ? 'border-rose-500' : 'border-[#E2E8F0]'
                      } rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-[#0F172A]`}
                      required
                    />
                    {phoneError && (
                      <p className="text-xs text-rose-600 mt-1">{phoneError}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="demo-challenge" className="block text-xs uppercase font-bold tracking-wider text-slate-600 mb-1">
                      Child's Specific Learning Challenge (Optional)
                    </label>
                    <input
                      id="demo-challenge"
                      type="text"
                      value={childChallenge}
                      onChange={(e) => setChildChallenge(e.target.value)}
                      placeholder="e.g. Pre-board exam anxiety, lacks algebra foundation, shy to ask doubts..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A]"
                    />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-slate-600 flex items-center space-x-2 shadow-editorial-inset">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="text-emerald-900 block text-xs uppercase">
                        100% No-Questions-Asked Rematch Guarantee
                      </strong>
                      <span>If your child doesn't click after Session 1, rematch instantly with zero penalty.</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
                  >
                    ← Back
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98"
                >
                  <span>
                    {step === 3 
                      ? (sessionType === 'alignment-call' ? 'Confirm 5-Min Alignment Call' : 'Confirm 45-Min Diagnostic') 
                      : 'Next Step →'}
                  </span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
