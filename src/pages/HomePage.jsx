import { usePageMeta } from '../hooks/usePageMeta';
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  MessageCircle, 
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Award
} from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { 
  HOME_PROGRAMS, 
  HOME_BATCH_SLOTS, 
  HOME_ADMISSION_STEPS, 
  HOME_FEATURES 
} from '../data/homeData';
import { useStudentFlow } from '../context/useAppContext';

export default function HomePage() {
  usePageMeta({
    title: 'Focus Academy — Tuition Center in Thoramangalam, Perambalur | Classes 6 to 12',
    description: 'Focus Academy in Thoramangalam, Perambalur runs evening tuition for Classes 6–12 (State Board & CBSE), strictly capped at 12 students per batch.',
    path: '/',
  });
  const { studentFlow: _studentFlow } = useStudentFlow();
  const whatsappInquiryUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy! I would like to inquire about evening batch timings and admissions at Thiripura Complex, Thoramangalam.'
  )}`;

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] text-left">
      <section id="hero" aria-labelledby="hero-heading" className="pt-6 pb-10 sm:pt-8 sm:pb-14 lg:pt-10 lg:pb-14 border-b border-[#E2E8F0]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center space-x-2.5 mb-3.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                <p className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide">
                  ஃபோகஸ் அகாடமி • Focus Academy, Thoramangalam, Perambalur
                </p>
              </div>

              <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-[3.25rem] font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
                Disciplined Evening Coaching for <span className="whitespace-nowrap">Classes 6 to 12</span>
              </h1>

              <p className="mt-4 sm:mt-5 text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl font-normal">
                Strictly capped at 12 students per batch. Daily concept clarity, step-marked problem solving, notebook checks, and weekly Saturday mock exams at Thiripura Complex.
              </p>

              <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/student-details"
                  aria-label="Enroll"
                  className="min-h-[52px] inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 bg-brand hover:bg-brand-strong text-white text-base font-bold rounded-md shadow-sm transition-all cursor-pointer active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span>Enroll</span>
                  <ArrowRight className="w-4 h-4 text-orange-100" />
                </Link>

                <Link
                  to="/timings"
                  aria-label="View Batch Timings (4–9 PM) — evening batch timetable and schedule"
                  className="min-h-[52px] inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-[#0F172A] text-sm sm:text-base font-bold rounded-md border border-[#E2E8F0] shadow-xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <Clock className="w-4 h-4 text-brand" />
                  <span>View Batch Timings (4–9 PM)</span>
                </Link>

                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 py-2.5 px-1"
                >
                  <MessageCircle className="w-4 h-4 text-whatsapp" />
                  <span>Chat with Center on WhatsApp</span>
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero Advance Fee to Register</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Strictly Max 12 Seats</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>State Board & CBSE Curriculum</span>
                </span>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 grid sm:grid-cols-2 gap-5 text-xs sm:text-sm text-slate-600">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0F172A] block">Operating Hours:</span>
                    <span className="text-slate-700">{CAMPUS_CONFIG.timings.workingDays}: {CAMPUS_CONFIG.timings.dailyHours}</span>
                    <span className="block text-slate-500 text-xs mt-0.5">{CAMPUS_CONFIG.timings.sundayPolicy}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0F172A] block">Campus Venue (Thoramangalam):</span>
                    <a
                      href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-700 hover:text-brand hover:underline block font-medium"
                    >
                      {CAMPUS_CONFIG.location.complex}, {CAMPUS_CONFIG.location.doorNo}
                    </a>
                    <span className="block text-slate-500 text-xs mt-0.5">Opp. EB Office • 2 mins from Four Roads</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 mt-6 lg:mt-0">
              <div id="campus-landmark" className="bg-white rounded-lg p-3 sm:p-4 border border-[#E2E8F0] shadow-sm relative">
                <span id="campus" className="absolute -top-24 left-0 pointer-events-none" />
                <div className="relative rounded-md overflow-hidden bg-slate-100 border border-[#E2E8F0]">
                  <img
                    src="/focus-academy-perambalur.jpg"
                    alt="Focus Academy campus signboard and tuition center at Thiripura Complex, Perambalur"
                    width={2000}
                    height={900}
                    className="w-full aspect-[16/9] object-cover object-center"
                    loading="eager"
                  />
                  <div className="absolute bottom-3 right-3 bg-[#0F172A]/90 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1 rounded">
                    Thiripura Complex Campus • Perambalur
                  </div>
                </div>

                <div className="p-4 sm:p-5 text-left border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
                        Focus Academy & Tuition Center
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        No. 50, 1st Floor, Thiripura Complex, Rajanagar, Thoramangalam
                      </p>
                    </div>
                    <a
                      href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs sm:text-sm font-bold text-brand hover:underline shrink-0"
                    >
                      <span>Get Directions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                    <span>Opposite EB Office • Near Malar Hospital</span>
                    <span className="text-emerald-700 font-bold">2 mins from Four Roads Junction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 sm:mt-16 pt-10 sm:pt-12 border-t border-slate-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="pt-4 sm:pt-0 sm:pr-6 text-left">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] block tracking-tight">12 Max</span>
                <span className="text-xs sm:text-sm font-bold text-brand uppercase tracking-wider block mt-1.5">Strict Batch Cap</span>
                <span className="text-xs sm:text-sm text-slate-600 block mt-1 leading-relaxed">Individual student attention and daily real-time notebook review</span>
              </div>
              <div className="pt-4 sm:pt-0 sm:px-6 text-left">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] block tracking-tight">Daily</span>
                <span className="text-xs sm:text-sm font-bold text-brand uppercase tracking-wider block mt-1.5">Notebook Check</span>
                <span className="text-xs sm:text-sm text-slate-600 block mt-1 leading-relaxed">Step-marked problem checking and personalized concept feedback every evening</span>
              </div>
              <div className="pt-4 sm:pt-0 sm:px-6 text-left">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] block tracking-tight">4 – 9 PM</span>
                <span className="text-xs sm:text-sm font-bold text-brand uppercase tracking-wider block mt-1.5">Evening Slots</span>
                <span className="text-xs sm:text-sm text-slate-600 block mt-1 leading-relaxed">Three 90-min sessions synchronized with town bus arrivals at Four Roads</span>
              </div>
              <div className="pt-4 sm:pt-0 sm:pl-6 text-left">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] block tracking-tight">100%</span>
                <span className="text-xs sm:text-sm font-bold text-brand uppercase tracking-wider block mt-1.5">Board Aligned</span>
                <span className="text-xs sm:text-sm text-slate-600 block mt-1 leading-relaxed">Rigorous Tamil Nadu State Board (Samacheer) & CBSE blueprint coaching</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="courses" aria-labelledby="courses-heading" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
            <div>
              <h2 id="courses-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                Academic Programs for Classes 6 to 12
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mt-2.5 max-w-3xl leading-relaxed">
                Subject-focused coaching aligned with Tamil Nadu State Board (Samacheer Kalvi) and CBSE blueprints. Classes are conducted in English and Tamil with step-by-step problem banks and formula mastery.
              </p>
            </div>

            <Link
              to="/courses"
              className="inline-flex items-center space-x-1.5 text-sm sm:text-base font-bold text-brand hover:underline shrink-0"
            >
              <span>View Full Subject Curriculum & Fees →</span>
            </Link>
          </div>

          <div className="divide-y divide-slate-200 border-b border-slate-200">
            {HOME_PROGRAMS.map((program) => (
              <div
                key={program.id}
                className="py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start hover:bg-slate-50/60 transition-colors px-2 sm:px-6"
              >
                <div className="lg:col-span-4">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-brand mb-1.5">
                    <span>{program.grade}</span>
                    <span>•</span>
                    <span>{program.board}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                    {program.title}
                  </h3>
                  <div className="mt-3 text-xs sm:text-sm text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">Timing: {program.timing}</p>
                    <p>{program.batchSize} • Daily 1-on-1 Doubt Clearance</p>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {program.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {program.subjects.map((sub, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium rounded-md"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-center gap-3">
                  <Link
                    to={`/student-details?grade=${encodeURIComponent(
                      program.id === 'high-school' ? 'Class 10' :
                      program.id === 'middle-school' ? 'Class 6' :
                      'Class 10'
                    )}`}
                    className="w-full sm:w-auto lg:w-full min-h-[46px] inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-brand hover:bg-brand-strong text-white text-sm font-bold rounded-md transition-colors shadow-xs"
                  >
                    <span>Enroll in {program.id === 'middle-school' ? 'Class 6' : 'Class 10'} →</span>
                  </Link>

                  <Link
                    to="/timings"
                    className="w-full sm:w-auto lg:w-full min-h-[44px] inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-md border border-[#E2E8F0] transition-colors"
                  >
                    <span>View Batch Timings</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="timings" aria-labelledby="timings-heading" className="py-16 sm:py-20 lg:py-24 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="max-w-3xl mb-10">
            <h2 id="timings-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Class Timetable & Daily Schedule
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mt-2.5 leading-relaxed">
              Operating Monday through Saturday from 4:00 PM to 9:00 PM at Thiripura Complex. Structured in three 90-minute evening slots synchronized with school dismissals and town bus arrivals at Four Roads and Trichy Main Road.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs divide-y divide-slate-200 overflow-hidden">
            {HOME_BATCH_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
              >
                <div className="md:col-span-3">
                  <span className="text-xs sm:text-sm font-bold text-brand uppercase tracking-wide block">
                    {slot.slotNum}
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#0F172A] block mt-1">
                    {slot.time}
                  </span>
                  <span className="inline-block mt-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                    {slot.status}
                  </span>
                </div>

                <div className="md:col-span-6">
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                    {slot.grades}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-1.5 leading-relaxed">
                    {slot.focus}
                  </p>
                  <span className="inline-block text-xs sm:text-sm font-semibold text-slate-500 mt-2">
                    Batch Capacity: {slot.seats} • 1:12 Teacher Ratio
                  </span>
                </div>

                <div className="md:col-span-3 flex sm:flex-row md:flex-col lg:flex-row items-center gap-2.5 justify-end">
                  <Link
                    to={`/timings?slot=${slot.id}`}
                    className="flex-1 w-full min-h-[46px] inline-flex items-center justify-center px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-md text-center transition-colors"
                  >
                    Check Seats
                  </Link>

                  <Link
                    to={`/student-details?grade=${slot.id === 'slot-1' ? 'Class+6' : slot.id === 'slot-2' ? 'Class+10' : 'Class+12'}`}
                    className="flex-1 w-full min-h-[46px] inline-flex items-center justify-center px-4 py-2.5 bg-brand hover:bg-brand-strong text-white text-xs sm:text-sm font-bold rounded-md text-center transition-colors"
                  >
                    Hold Seat
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-5 sm:p-6 bg-white rounded-lg border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1 text-sm sm:text-base">
              <span className="font-bold text-[#0F172A] block">
                Saturday Timed Mock Exams & Bus Synchronization:
              </span>
              <span className="text-slate-600 block leading-relaxed">
                Batches align with Four Roads bus arrivals. Timed mock examinations are held every Saturday, and evaluated answer sheets with teacher corrections are returned before Monday classes.
              </span>
            </div>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ask Schedule on WhatsApp — batch timetable enquiry"
              className="min-h-[46px] inline-flex items-center space-x-2 px-5 py-2.5 bg-whatsapp hover:bg-whatsapp-strong text-white text-xs sm:text-sm font-bold rounded-md shadow-xs transition-all shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask Schedule on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      <section id="steps" aria-labelledby="steps-heading" className="py-16 sm:py-20 lg:py-24 bg-[#0F172A] text-white border-b border-[#1E293B]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="max-w-2xl mb-12 text-left">
            <h2 id="steps-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              How Admission Works in 5 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2.5 leading-relaxed">
              A transparent, structured path from grade selection and goal setting to classroom seat reservation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 text-left">
            {HOME_ADMISSION_STEPS.map((st) => (
              <div
                key={st.num}
                className="border-t border-slate-700/80 pt-5 flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-orange-400 block tracking-tight">
                    0{st.num}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2.5">
                    {st.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-800">
                  <Link
                    to="/student-details"
                    className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-semibold text-orange-300 hover:text-orange-100"
                  >
                    <span>{Number(st.num) === 1 ? 'Step 1: Details →' : 'Start at Step 1 →'}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-left">
            <Link
              to="/student-details"
              className="min-h-[50px] inline-flex items-center space-x-2.5 px-8 py-3.5 bg-brand hover:bg-brand-strong text-white text-sm sm:text-base font-bold rounded-md shadow-xs transition-all active:scale-98"
            >
              <span>Begin Student Registration (Step 1) →</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="about" aria-labelledby="about-heading" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-[#E2E8F0] relative">
        <span id="features" className="absolute -top-24 left-0 pointer-events-none" />
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
            <div>
              <h2 id="about-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                Academic Standards & Institutional Assurances
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mt-2.5 max-w-3xl leading-relaxed">
                Academic discipline, senior subject teachers, and parent transparency at Thiripura Complex, Thoramangalam.
              </p>
            </div>

            <Link
              to="/about"
              className="inline-flex items-center space-x-1.5 text-sm sm:text-base font-bold text-brand hover:underline shrink-0"
            >
              <span>Learn More About Focus Academy →</span>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 lg:gap-14">
            {HOME_FEATURES.map((feat, idx) => (
              <div key={idx} className="border-l-3 border-brand pl-5 sm:pl-6 text-left">
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                  {feat.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 p-6 sm:p-8 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] grid sm:grid-cols-3 gap-6 text-left">
            <div className="flex items-start space-x-3.5">
              <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Senior Subject Faculty</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Classes are taught by experienced postgraduate specialists with 8+ years board coaching background. No college student substitutes.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <BookOpen className="w-6 h-6 text-brand shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Parents Welcome in Class</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Parents may sit in on a live session at Thiripura Complex and inspect the student's corrected notebooks before deciding.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <Award className="w-6 h-6 text-brand shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Weekly Board Mocks</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Simulated board examination conditions every Saturday. Graded answer sheets with teacher corrections shared directly with parents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
