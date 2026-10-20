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
  Building2,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { LeadService } from '../services/leadService';

const CURRENT_YEAR = new Date().getFullYear();

export default function ContactSection() {
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('Class 10');
  const [board, setBoard] = useState('TN State Board (Samacheer)');
  const [subjects, setSubjects] = useState('Mathematics & Science');
  const [message, setMessage] = useState('');
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    if (!result.success) {
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
    <section id="contact" aria-labelledby="contact-heading" className="py-16 sm:py-20 bg-white border-b border-[#E8E2D8] text-left relative">
      <span id="enroll" className="absolute -top-24 left-0 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <h2 id="contact-heading" className="text-2xl sm:text-3xl md:text-4xl font-black text-[#181614] tracking-tight">
            Visit Focus Academy in Thoramangalam, Perambalur
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#57534E] leading-relaxed">
            Parents and students are welcome to visit our campus, inspect our classrooms, and discuss batch timings and admissions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#E8E2D8] shadow-editorial text-left">
              <div className="flex items-center space-x-2 text-[10px] font-code-mono uppercase font-bold text-[#C2410C] mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Campus Address</span>
              </div>
              
              <h3 className="text-lg font-bold text-[#181614]">
                {CAMPUS_CONFIG.brand.name}, {CAMPUS_CONFIG.location.area}
              </h3>
              
              <a
                href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs sm:text-sm text-[#57534E] hover:text-[#C2410C] leading-relaxed block transition-colors"
              >
                {CAMPUS_CONFIG.location.fullAddress}
              </a>

              <div className="mt-4 pt-4 border-t border-[#E8E2D8] space-y-2.5 text-xs">
                <div className="flex items-center space-x-2.5 text-[#181614]">
                  <Phone className="w-4 h-4 text-[#C2410C] shrink-0" />
                  <a href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`} className="font-semibold hover:underline">
                    {CAMPUS_CONFIG.contact.primaryPhone}
                  </a>
                </div>

                <div className="flex items-center space-x-2.5 text-[#57534E]">
                  <Mail className="w-4 h-4 text-[#C2410C] shrink-0" />
                  <a href={`mailto:${CAMPUS_CONFIG.contact.email}`} className="font-code-mono text-[11px] truncate hover:underline">
                    {CAMPUS_CONFIG.contact.email}
                  </a>
                </div>

                <div className="flex items-center space-x-2.5 text-[#57534E]">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-code-mono text-[11px]">
                    {CAMPUS_CONFIG.timings.workingDays}: {CAMPUS_CONFIG.timings.dailyHours}
                  </span>
                </div>

                <div className="flex items-center space-x-2.5 text-emerald-700">
                  <MessageSquare className="w-4 h-4 text-[#25D366] shrink-0" />
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

            <div className="bg-[#FAF7F2] rounded-3xl border border-[#E8E2D8] overflow-hidden shadow-editorial">
              <div className="p-4 bg-[#181614] text-white flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold">
                  <MapPin className="w-4 h-4 text-[#C2410C]" />
                  <span>Map Target: Thiripura Complex, Thoramangalam, Perambalur</span>
                </div>
                <a
                  href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-code-mono text-[#FED7AA] hover:underline flex items-center space-x-1"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative h-60 w-full bg-[#E5E0D8]">
                <iframe
                  title="Focus Academy Thiripura Complex Perambalur Map"
                  src={CAMPUS_CONFIG.location.googleMapsEmbedUrl}
                  className="w-full h-full border-0 filter contrast-[102%]"
                  loading="lazy"
                  allowFullScreen
                />
              </div>

              <div className="p-3.5 bg-white text-[11px] text-[#78716C] flex items-center justify-between border-t border-[#E8E2D8]">
                <span>Landmark: {CAMPUS_CONFIG.location.landmark}</span>
                <span className="text-[#C2410C] font-semibold">Easy Parking Available</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-editorial-lg text-left">
            <div className="mb-6 pb-4 border-b border-[#E8E2D8]">
              <span className="font-code-mono text-[10px] uppercase font-bold text-[#C2410C] block mb-1">
                Admissions Open for {CURRENT_YEAR} Academic Year
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#181614]">
                Enroll Your Child in Focus Academy Evening Batches
              </h3>
              <p className="text-xs text-[#57534E] mt-1">
                Fill this inquiry form to reserve a seat or schedule a complimentary 45-minute diagnostic session.
              </p>
            </div>

            {submissionResult ? (
              <div className="text-center py-6 space-y-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                
                <h4 className="text-xl font-bold text-[#181614]">Enrollment Inquiry Received</h4>
                
                <p className="text-xs text-[#57534E] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{submissionResult.data.parentName || submissionResult.data.studentName}</strong>. Our academic counselor at the Thoramangalam campus will contact you within 2 business hours regarding evening batch availability for <strong>{submissionResult.data.studentName} ({submissionResult.data.grade})</strong>.
                </p>

                {submissionResult.offlineQueued && (
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs font-code-mono max-w-sm mx-auto flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Inquiry saved in offline queue. Auto-syncing upon reconnection.</span>
                  </div>
                )}

                <div className="pt-2">
                  <a
                    href={submissionResult.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-5 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Fast-Track Admission on WhatsApp →</span>
                  </a>
                  <p className="text-[10px] text-[#78716C] mt-1.5 font-code-mono">
                    Direct chat with Focus Academy Thoramangalam Coordinator
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-[#181614] hover:underline font-code-mono cursor-pointer"
                  >
                    Submit Another Inquiry ↺
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="student-name" className="block font-code-mono text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Student Full Name *
                    </label>
                    <input
                      id="student-name"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. K. Vignesh"
                      className={`w-full min-h-[48px] bg-white border ${
                        validationErrors.studentName ? 'border-rose-500' : 'border-[#E8E2D8]'
                      } rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]`}
                      required
                    />
                    {validationErrors.studentName && (
                      <p role="alert" className="text-[10px] text-rose-600 mt-1">{validationErrors.studentName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="parent-name" className="block font-code-mono text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Parent / Guardian Name
                    </label>
                    <input
                      id="parent-name"
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="e.g. Mr. S. Kannan"
                      className="w-full min-h-[48px] bg-white border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-phone" className="block font-code-mono text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Contact Mobile Number (10 Digits) *
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98424 51220"
                      className={`w-full min-h-[48px] bg-white border ${
                        validationErrors.phone ? 'border-rose-500' : 'border-[#E8E2D8]'
                      } rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]`}
                      required
                    />
                    {validationErrors.phone && (
                      <p role="alert" className="text-[10px] text-rose-600 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="target-grade" className="block font-code-mono text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Target Grade / Class *
                    </label>
                    <select
                      id="target-grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full min-h-[48px] bg-white border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
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
                    <label htmlFor="curriculum-board" className="block font-code-mono text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Curriculum Board *
                    </label>
                    <select
                      id="curriculum-board"
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full min-h-[48px] bg-white border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                    >
                      <option value="TN State Board (Samacheer)">TN State Board (Samacheer Kalvi)</option>
                      <option value="CBSE Board">CBSE Board (NCERT)</option>
                      <option value="ICSE Board">ICSE / ISC Council</option>
                      <option value="Other / Competitive">NEET / JEE Foundation</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="support-subjects" className="block font-code-mono text-[10px] uppercase font-bold text-[#78716C] mb-1">
                      Subjects Needing Support
                    </label>
                    <input
                      id="support-subjects"
                      type="text"
                      value={subjects}
                      onChange={(e) => setSubjects(e.target.value)}
                      placeholder="e.g. Maths, Physics, Chemistry, Biology"
                      className="w-full min-h-[48px] bg-white border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="specific-notes" className="block font-code-mono text-[10px] uppercase font-bold text-[#78716C] mb-1">
                    Student Specific Challenges or Goals (Optional)
                  </label>
                  <textarea
                    id="specific-notes"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. Struggles with algebra factoring, pre-board test panic, wants to target 95%+ in 10th boards..."
                    className="w-full bg-white border border-[#E8E2D8] rounded-xl p-3 text-xs sm:text-sm font-medium text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E8E2D8] text-[11px] text-[#57534E] flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Small batches guaranteed (Strictly Max 12 Students) • Mon–Sat Evening Schedule (4 PM – 9 PM)</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] py-3.5 bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl shadow-editorial hover:shadow-editorial-lg transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
                >
                  <Send className="w-4 h-4 text-[#FED7AA]" />
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
