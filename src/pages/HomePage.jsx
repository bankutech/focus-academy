import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Clock, 
  MapPin, 
  BookOpen, 
  CheckCircle2, 
  Users, 
  Calendar, 
  MessageCircle, 
  ExternalLink 
} from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { 
  HOME_PROGRAMS, 
  HOME_BATCH_SLOTS, 
  HOME_ADMISSION_STEPS, 
  HOME_FEATURES 
} from '../data/homeData';

export default function HomePage() {
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappInquiryUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy! I would like to inquire about evening batch timings and trial admissions at Thiripura Complex, Thoramangalam.'
  )}`;

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] text-left">
      <section id="hero" aria-labelledby="hero-heading" className="pt-8 pb-14 sm:pt-14 sm:pb-20 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs sm:text-sm font-semibold text-[#EA580C] mb-3">
                ஃபோகஸ் அகாடமி • தொரமங்கலம், பெரம்பலூர் (மாலை நேர சிறப்பு வகுப்புகள் - 6 முதல் 12 ஆம் வகுப்பு வரை)
              </p>

              <h1 id="hero-heading" className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                {CAMPUS_CONFIG.brand.heroHeadline}
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                No 50-student crowded classrooms. No blind rote memorization. Just 12 students per batch, daily doubt clearance, and weekly Saturday board mock tests at Thiripura Complex.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/student-details"
                  aria-label="Enroll now and start student onboarding"
                  className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                >
                  <span>Enroll Now (Join Today)</span>
                  <ArrowRight className="w-4 h-4 text-orange-200" />
                </Link>

                <a
                  href="#courses"
                  onClick={(e) => scrollToSection(e, 'courses')}
                  aria-label="Explore coaching courses and subjects"
                  className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-[#0F172A] text-sm font-bold rounded-xl border border-[#E2E8F0] shadow-editorial-inset transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                >
                  <BookOpen className="w-4 h-4 text-[#EA580C]" />
                  <span>Explore Courses & Batches</span>
                </a>

                <a
                  href="#timings"
                  onClick={(e) => scrollToSection(e, 'timings')}
                  aria-label="View evening batch timetable and schedule"
                  className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-5 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                >
                  <Clock className="w-4 h-4 text-orange-200" />
                  <span>Batch Timings (4–9 PM) →</span>
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E2E8F0] grid sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="flex items-start space-x-2.5">
                  <Clock className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0F172A] block">Operating Hours:</span>
                    <span>{CAMPUS_CONFIG.timings.workingDays}: {CAMPUS_CONFIG.timings.dailyHours}</span>
                    <span className="block text-slate-500 text-xs mt-0.5">{CAMPUS_CONFIG.timings.sundayPolicy}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#0F172A] block">Campus Venue (Thoramangalam):</span>
                    <a
                      href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-[#EA580C] hover:underline block"
                    >
                      {CAMPUS_CONFIG.location.complex}, {CAMPUS_CONFIG.location.doorNo}
                    </a>
                    <span className="block text-[#EA580C] font-semibold text-xs mt-0.5">Near Malar Hospital / Opp. EB Office (via Four Roads)</span>
                    <span className="block text-slate-500 text-xs mt-0.5">2 mins from Four Roads • Dedicated two-wheeler & cycle parking</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 mt-8 lg:mt-0">
              <div id="campus-landmark" className="bg-white rounded-3xl p-3.5 sm:p-4 border border-[#E2E8F0] shadow-editorial-lg relative">
                <span id="campus" className="absolute -top-24 left-0 pointer-events-none" />
                <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-[#E2E8F0]">
                  <img
                    src="/focus-academy-perambalur.jpg"
                    alt="Focus Academy campus signboard and tuition center at Thiripura Complex, Perambalur"
                    width={2000}
                    height={900}
                    className="w-full h-56 sm:h-64 lg:h-72 object-cover object-center transform hover:scale-[1.02] transition-transform duration-500"
                    loading="eager"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F172A]/85 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Campus Landmark</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-[#0F172A] text-xs font-bold px-2 py-0.5 rounded shadow-xs border border-[#E2E8F0]">
                    Perambalur 621220
                  </div>
                </div>

                <div className="p-3 sm:p-4 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug">
                        Focus Academy & Tuition Center
                      </h2>
                      <a
                        href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-600 hover:text-[#EA580C] hover:underline mt-0.5 block"
                      >
                        No. 50, 1st Floor, Thiripura Complex, Rajanagar
                      </a>
                    </div>
                    <span className="text-xs font-bold text-[#EA580C] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md shrink-0">
                      Opp. EB Office
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Small Batches (Max 12)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Classes 6 to 12</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Evening 4 PM – 9 PM</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Weekly Mock Tests</span>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Photo via Google Listing
                    </span>
                    <a
                      href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-[#EA580C] hover:underline"
                    >
                      <span>Get Directions</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="courses" aria-labelledby="courses-heading" className="py-12 sm:py-16 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 id="courses-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Programs Offered at Focus Academy
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Targeted evening coaching designed around regular school hours for school students seeking academic excellence and foundation building.
              </p>
            </div>

            <Link
              to="/courses"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#EA580C] hover:underline shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded"
            >
              <span>View All Subject Tracks →</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOME_PROGRAMS.map((program) => {
              const Icon = program.icon;
              return (
                <div
                  key={program.id}
                  className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-editorial hover:shadow-editorial-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#EA580C]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold uppercase px-2.5 py-1 bg-[#0F172A] text-white rounded-md">
                        {program.batchSize}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A] leading-snug">
                      {program.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <span className="px-2 py-0.5 bg-slate-100 border border-[#E2E8F0] rounded text-slate-700">
                        {program.grade}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 border border-[#E2E8F0] rounded text-slate-700">
                        {program.board}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                      {program.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="text-xs uppercase font-bold text-slate-500 block mb-1.5">
                        Core Subjects:
                      </span>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {program.subjects.map((sub, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E2E8F0] space-y-2">
                    <Link
                      to={`/student-details?grade=${encodeURIComponent(
                        program.id === 'high-school' ? 'Class 10' :
                        program.id === 'middle-school' ? 'Class 6' :
                        'Class 10'
                      )}`}
                      className="w-full min-h-[44px] inline-flex items-center justify-center space-x-1.5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                    >
                      <span>Enroll in {program.grade.split(',')[0]} →</span>
                    </Link>

                    <Link
                      to="/timings"
                      className="w-full min-h-[44px] inline-flex items-center justify-center space-x-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-[#E2E8F0] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                    >
                      <span>View Batch Timings</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="timings" aria-labelledby="timings-heading" className="py-12 sm:py-16 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 id="timings-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Class Timetable & Daily Schedule
            </h2>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Operating Monday to Saturday from 4:00 PM to 9:00 PM at Thiripura Complex. Structured in three 90-minute evening slots synchronized with school and town bus schedules via Four Roads and Trichy Main Road so students arrive refreshed and return home safely.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOME_BATCH_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-editorial flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span className="text-xs font-bold text-[#EA580C] uppercase">
                      {slot.slotNum}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {slot.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xl font-bold text-[#0F172A]">
                    <Clock className="w-5 h-5 text-[#EA580C]" />
                    <span>{slot.time}</span>
                  </div>

                  <p className="mt-2 text-xs font-bold text-[#0F172A]">
                    {slot.grades}
                  </p>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {slot.focus}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>{slot.seats}</span>
                    </span>
                    <span className="text-emerald-700 font-bold">1:12 Ratio</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center gap-2">
                  <Link
                    to={`/batches?slot=${slot.id}`}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                  >
                    Check Seats
                  </Link>

                  <Link
                    to={`/student-details?grade=${slot.id === 'slot-1' ? 'Class+6' : slot.id === 'slot-2' ? 'Class+10' : 'Class+12'}`}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl text-center transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
                  >
                    Hold Seat
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white p-5 rounded-2xl border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs">
              <Calendar className="w-5 h-5 text-[#EA580C] shrink-0" />
              <div>
                <span className="font-bold text-[#0F172A] block">Saturday Timed Mock Exams (Every Week):</span>
                <span className="text-slate-600">Evaluated answer sheets returned with individualized teacher corrections.</span>
              </div>
            </div>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ask about batch schedule on WhatsApp"
              className="min-h-[44px] inline-flex items-center space-x-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold rounded-xl shadow-xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ask Schedule on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      <section id="steps" aria-labelledby="steps-heading" className="py-12 sm:py-16 bg-[#0F172A] text-white border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 id="steps-heading" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              How Admission Works in 5 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Navigate step-by-step from student registration to batch confirmation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {HOME_ADMISSION_STEPS.map((st) => (
              <div
                key={st.num}
                className="bg-[#1E293B] p-4.5 rounded-2xl border border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#EA580C] text-white flex items-center justify-center text-sm font-bold mb-3">
                    {st.num}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    {st.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <Link
                    to={st.link}
                    className="inline-flex items-center space-x-1 text-xs text-orange-200 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-200 rounded"
                  >
                    <span>{st.linkText} →</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/student-details"
              className="min-h-[48px] inline-flex items-center space-x-2 px-8 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold rounded-xl shadow-editorial transition-all active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C]"
            >
              <span>Begin Student Registration (Step 1) →</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="about" aria-labelledby="about-heading" className="py-12 sm:py-16 border-b border-[#E2E8F0] relative">
        <span id="features" className="absolute -top-24 left-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 id="about-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Classroom Standards & Features
              </h2>
            </div>

            <Link
              to="/about"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#EA580C] hover:underline shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#EA580C] rounded"
            >
              <span>Learn More About Focus Academy →</span>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOME_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-editorial"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#EA580C] flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-1.5 leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
