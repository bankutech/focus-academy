import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink, 
  MessageSquare, 
  AlertCircle 
} from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { LeadService } from '../services/leadService';

export default function ContactSection({ isPage = false }) {
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('Class 10');
  const [board, setBoard] = useState('TN State Board (Samacheer)');
  const [subjects, setSubjects] = useState('Mathematics & Science');
  const [message, setMessage] = useState('');
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setValidationErrors({});
    setIsSubmitting(true);

    const leadPayload = {
      studentName,
      parentName,
      phone,
      grade,
      board,
      subjects,
      notes: message,
    };

    const result = await LeadService.submitLead(leadPayload);
    setIsSubmitting(false);

    if (!result.success && result.status === 'invalid') {
      setValidationErrors(result.errors || {});
      return;
    }

    setSubmissionResult(result);
  };

  const handleResetForm = () => {
    setStudentName('');
    setParentName('');
    setPhone('');
    setMessage('');
    setSubmissionResult(null);
    setValidationErrors({});
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className={`text-left relative ${isPage ? 'pt-2 pb-8' : 'py-16 sm:py-20 bg-white border-b border-[#E2E8F0]'}`}>
      <span id="enroll" className="absolute -top-24 left-0 pointer-events-none" />
      <div className={isPage ? '' : 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10'}>
        {!isPage && (
          <div className="max-w-2xl mb-12">
            <h2 id="contact-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Visit Focus Academy in Thoramangalam, Perambalur
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Parents and students are welcome to visit our campus, inspect our classrooms, and discuss batch timings and admissions.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#F8FAFC] p-6 rounded-lg border border-[#E2E8F0] shadow-xs text-left">
              {isPage ? (
                <h2 id="contact-heading" className="text-lg font-bold text-[#0F172A]">
                  {CAMPUS_CONFIG.brand.name}, {CAMPUS_CONFIG.location.area}
                </h2>
              ) : (
                <h3 className="text-lg font-bold text-[#0F172A]">
                  {CAMPUS_CONFIG.brand.name}, {CAMPUS_CONFIG.location.area}
                </h3>
              )}
              
              <a
                href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs sm:text-sm text-slate-600 hover:text-brand leading-relaxed block transition-colors"
              >
                {CAMPUS_CONFIG.location.fullAddress}
              </a>

              <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2.5 text-xs">
                <div className="flex items-center space-x-2.5 text-[#0F172A]">
                  <Phone className="w-4 h-4 text-brand shrink-0" />
                  <a href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`} className="font-semibold hover:underline">
                    {CAMPUS_CONFIG.contact.primaryPhone}
                  </a>
                </div>

                <div className="flex items-center space-x-2.5 text-slate-600">
                  <Mail className="w-4 h-4 text-brand shrink-0" />
                  <a href={`mailto:${CAMPUS_CONFIG.contact.email}`} className="text-xs truncate hover:underline">
                    {CAMPUS_CONFIG.contact.email}
                  </a>
                </div>

                <div className="flex items-center space-x-2.5 text-slate-600">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs">
                    {CAMPUS_CONFIG.timings.workingDays}: {CAMPUS_CONFIG.timings.dailyHours}
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 text-emerald-700">
                  <MessageSquare className="w-4 h-4 text-whatsapp shrink-0" />
                  <a
                    href={`https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
                      'Hello Focus Academy Thoramangalam! I would like to inquire about evening batch admissions at Thiripura Complex.'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                  >
                    WhatsApp Desk: +91 98424 51220
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] overflow-hidden shadow-xs">
              <div className="p-4 bg-[#0F172A] text-white flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-brand" />
                  <span>Map Target: Thiripura Complex, Thoramangalam, Perambalur</span>
                </div>
                <a
                  href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-100 hover:underline flex items-center space-x-1"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="relative h-60 w-full bg-slate-100">
                <iframe
                  title="Focus Academy Thiripura Complex Perambalur Map"
                  src={CAMPUS_CONFIG.location.googleMapsEmbedUrl}
                  className="w-full h-full border-0 filter contrast-[102%]"
                  loading="lazy"
                  allowFullScreen
                />
              </div>

              <div className="p-3.5 bg-white text-xs text-slate-500 flex items-center justify-between border-t border-[#E2E8F0]">
                <span>Landmark: {CAMPUS_CONFIG.location.landmark}</span>
                <span className="text-brand font-semibold">Easy Parking Available</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#F8FAFC] p-6 sm:p-8 rounded-lg border border-[#E2E8F0] shadow-xs text-left">
            <div className="mb-6 pb-4 border-b border-[#E2E8F0]">
              <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                Enroll Your Child in Focus Academy Evening Batches
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Fill this inquiry form to reserve a seat or schedule a complimentary 45-minute diagnostic session.
              </p>
            </div>

            {submissionResult ? (
              <div
                role={submissionResult.success ? undefined : 'alert'}
                className="text-center py-6 space-y-4 animate-in fade-in"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                  submissionResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {submissionResult.success
                    ? <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    : <AlertCircle className="w-8 h-8 text-amber-600" />}
                </div>

                <h4 className="text-xl font-bold text-[#0F172A]">
                  {submissionResult.success ? 'Enrollment Inquiry Received' : 'Your details are saved, but not yet sent'}
                </h4>

                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  {submissionResult.success ? (
                    <>Thank you, <strong>{submissionResult.data.parentName || submissionResult.data.studentName}</strong>. Our academic counselor at the Thoramangalam campus will contact you within 2 business hours regarding evening batch availability for <strong>{submissionResult.data.studentName} ({submissionResult.data.grade})</strong>.</>
                  ) : (
                    <>{submissionResult.message} You can retry below, or send your details directly on WhatsApp so the campus receives them right away.</>
                  )}
                </p>

                {!submissionResult.success && submissionResult.retryable && (
                  <button
                    type="button"
                    disabled={isRetrying}
                    onClick={async () => {
                      setIsRetrying(true);
                      const retry = await LeadService.retryLastAttempt(submissionResult.data);
                      setIsRetrying(false);
                      setSubmissionResult(retry);
                    }}
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs rounded-md shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isRetrying ? 'Sending…' : 'Retry Sending My Inquiry'}</span>
                  </button>
                )}

                <div className="pt-2">
                  <a
                    href={submissionResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-whatsapp hover:bg-whatsapp-strong text-white font-bold text-xs rounded-md shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Fast-Track Admission on WhatsApp →</span>
                  </a>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Direct chat with Focus Academy Thoramangalam Coordinator
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-[#0F172A] hover:underline cursor-pointer"
                  >
                    Submit Another Inquiry ↺
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="student-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Student Full Name *
                    </label>
                    <input
                      id="student-name"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. K. Vignesh"
                      className={`w-full min-h-[48px] bg-white border ${
                        validationErrors.studentName ? 'border-rose-500' : 'border-[#E2E8F0]'
                      } rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand`}
                      required
                    />
                    {validationErrors.studentName && (
                      <p role="alert" className="text-xs text-rose-600 mt-1">{validationErrors.studentName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="parent-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Parent / Guardian Name
                    </label>
                    <input
                      id="parent-name"
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Mr. S. Kannan"
                      className="w-full min-h-[48px] bg-white border border-[#E2E8F0] rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Contact Mobile Number (10 Digits) *
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98424 51220"
                      className={`w-full min-h-[48px] bg-white border ${
                        validationErrors.phone ? 'border-rose-500' : 'border-[#E2E8F0]'
                      } rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand`}
                      required
                    />
                    {validationErrors.phone && (
                      <p role="alert" className="text-xs text-rose-600 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="target-grade" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Target Grade / Class *
                    </label>
                    <select
                      id="target-grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full min-h-[48px] bg-white border border-[#E2E8F0] rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand"
                    >
                      <option value="Class 10">Class 10 (Secondary Board Preparation)</option>
                      <option value="Class 12">Class 12 (Higher Secondary STEM / Commerce)</option>
                      <option value="Class 9">Class 9 (Pre-Board Foundation)</option>
                      <option value="Class 11">Class 11 (Senior Science / Maths)</option>
                      <option value="Class 8">Class 8 (Middle School Core)</option>
                      <option value="Class 7">Class 7 (Middle School Core)</option>
                      <option value="Class 6">Class 6 (Transition & Basics)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="curriculum-board" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Curriculum Board *
                    </label>
                    <select
                      id="curriculum-board"
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full min-h-[48px] bg-white border border-[#E2E8F0] rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand"
                    >
                      <option value="TN State Board (Samacheer)">TN State Board (Samacheer Kalvi)</option>
                      <option value="CBSE Board">CBSE Board (NCERT)</option>
                      <option value="ICSE Board">ICSE / ISC Council</option>
                      <option value="Other / Competitive">NEET / JEE Foundation</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="support-subjects" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Subjects Needing Support
                    </label>
                    <input
                      id="support-subjects"
                      type="text"
                      value={subjects}
                      onChange={(e) => setSubjects(e.target.value)}
                      placeholder="e.g. Maths, Physics, Chemistry, Biology"
                      className="w-full min-h-[48px] bg-white border border-[#E2E8F0] rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="specific-notes" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                    Student Specific Challenges or Goals (Optional)
                  </label>
                  <textarea
                    id="specific-notes"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Struggles with algebra factoring, pre-board test panic, wants to target 95%+ in 10th boards..."
                    className="w-full bg-white border border-[#E2E8F0] rounded-md p-3 text-xs sm:text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-brand"
                  />
                </div>

                <div className="p-3 bg-white rounded-md border border-[#E2E8F0] text-xs text-slate-600 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Small batches guaranteed (Strictly Max 12 Students) • Mon–Sat Evening Schedule (4 PM – 9 PM)</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] py-3.5 bg-brand hover:bg-brand-strong disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-md shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Send className="w-4 h-4 text-orange-100" />
                  <span>{isSubmitting ? 'Validating & Submitting...' : 'Submit Enrollment Inquiry (Evening Batches)'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
