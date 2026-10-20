import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Clock, 
  MapPin, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Calendar, 
  MessageCircle, 
  ExternalLink, 
  Bus 
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
    <div className="bg-[#FAF7F2] text-[#181614] text-left">
      <section id="hero" aria-labelledby="hero-heading" className="pt-8 pb-14 sm:pt-14 sm:pb-20 border-b border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs sm:text-sm font-semibold text-[#C2410C] font-code-mono mb-3">
                ஃபோகஸ் அகாடமி • தொரமங்கலம், பெரம்பலூர் (மாலை நேர சிறப்பு வகுப்புகள் - 6 முதல் 12 ஆம் வகுப்பு வரை)
              </p>

              <h1 id="hero-heading" className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#181614] tracking-tight leading-tight">
                {CAMPUS_CONFIG.brand.heroHeadline}
              </h1>

              <p className="mt-4 text-base sm:text-lg text-[#57534E] leading-relaxed">
                No 50-student crowded classrooms. No blind rote memorization. Just 12 students per batch, daily doubt clearance, and weekly Saturday board mock tests at Thiripura Complex.
              </p>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                  <span><strong>1-Day Free Trial:</strong> Attend one evening session with zero fee commitment. Join only after complete satisfaction.</span>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-[#E8E2D8] text-xs text-[#57534E] flex items-start space-x-2.5 shadow-xs">
                  <Bus className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                  <span><strong>Bus Synchronized:</strong> Batch timings match town & school buses via Four Roads & Trichy Main Road for safe return.</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/student-details"
                  aria-label="Enroll now and start student onboarding"
                  className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-bold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
                >
                  <span>Enroll Now (Join Today)</span>
                  <ArrowRight className="w-4 h-4 text-[#FED7AA]" />
                </Link>

                <a
                  href="#courses"
                  onClick={(e) => scrollToSection(e, 'courses')}
                  aria-label="Explore coaching courses and subjects"
                  className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-white hover:bg-[#F4EFEA] text-[#181614] text-sm font-bold rounded-xl border border-[#E8E2D8] shadow-editorial-inset transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
                >
                  <BookOpen className="w-4 h-4 text-[#C2410C]" />
                  <span>Explore Courses & Batches</span>
                </a>

                <a
                  href="#timings"
                  onClick={(e) => scrollToSection(e, 'timings')}
                  aria-label="View evening batch timetable and schedule"
                  className="min-h-[48px] inline-flex items-center justify-center space-x-2 px-5 py-3.5 bg-[#181614] hover:bg-[#2A2623] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
                >
                  <Clock className="w-4 h-4 text-[#FED7AA]" />
                  <span>Batch Timings (4–9 PM) →</span>
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E8E2D8] grid sm:grid-cols-2 gap-4 text-xs font-code-mono text-[#57534E]">
                <div className="flex items-start space-x-2.5">
                  <Clock className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#181614] block">Operating Hours:</span>
                    <span>{CAMPUS_CONFIG.timings.workingDays}: {CAMPUS_CONFIG.timings.dailyHours}</span>
                    <span className="block text-[#78716C] text-[11px] mt-0.5">{CAMPUS_CONFIG.timings.sundayPolicy}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#181614] block">Campus Venue (Thoramangalam):</span>
                    <a
                      href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#57534E] hover:text-[#C2410C] hover:underline block"
                    >
                      {CAMPUS_CONFIG.location.complex}, {CAMPUS_CONFIG.location.doorNo}
                    </a>
                    <span className="block text-[#C2410C] font-semibold text-[11px] mt-0.5">Near Malar Hospital / Opp. EB Office (via Four Roads)</span>
                    <span className="block text-[#78716C] text-[10px] mt-0.5">2 mins from Four Roads • Dedicated two-wheeler & cycle parking</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 mt-8 lg:mt-0">
              <div id="campus-landmark" className="bg-white rounded-3xl p-3.5 sm:p-4 border border-[#E8E2D8] shadow-editorial-lg relative">
                <span id="campus" className="absolute -top-24 left-0 pointer-events-none" />
                <div className="relative rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#E8E2D8]">
                  <img
                    src="/focus-academy-perambalur.jpg"
                    alt="Focus Academy campus signboard and tuition center at Thiripura Complex, Perambalur"
                    width={2000}
                    height={900}
                    className="w-full h-56 sm:h-64 lg:h-72 object-cover object-center transform hover:scale-[1.02] transition-transform duration-500"
                    loading="eager"
                  />
                  <div className="absolute top-3 left-3 bg-[#181614]/85 backdrop-blur-xs text-white text-[11px] font-code-mono font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Campus Landmark</span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-[#181614] text-[10px] font-code-mono font-bold px-2 py-0.5 rounded shadow-xs border border-[#E8E2D8]">
                    Perambalur 621220
                  </div>
                </div>

                <div className="p-3 sm:p-4 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-[#181614] leading-snug">
                        Focus Academy & Tuition Center
                      </h2>
                      <a
                        href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#57534E] hover:text-[#C2410C] hover:underline mt-0.5 block"
                      >
                        No. 50, 1st Floor, Thiripura Complex, Rajanagar
                      </a>
                    </div>
                    <span className="text-[10px] font-code-mono font-bold text-[#C2410C] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md shrink-0">
                      Opp. EB Office
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#FAF7F2] grid grid-cols-2 gap-2 text-[11px] text-[#57534E]">
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

                  <div className="mt-3.5 pt-3 border-t border-[#E8E2D8] flex items-center justify-between">
                    <span className="text-[11px] font-code-mono text-[#78716C]">
                      Photo via Google Listing
                    </span>
                    <a
                      href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-code-mono font-bold text-[#C2410C] hover:underline"
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

      <section id="courses" aria-labelledby="courses-heading" className="py-12 sm:py-16 border-b border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 id="courses-heading" className="text-2xl sm:text-3xl font-black text-[#181614] tracking-tight">
                Programs Offered at Focus Academy
              </h2>
              <p className="text-sm text-[#57534E] mt-1 max-w-2xl">
                Targeted evening coaching designed around regular school hours for school students seeking academic excellence and foundation building.
              </p>
            </div>

            <Link
              to="/courses"
              className="inline-flex items-center space-x-1.5 text-xs font-code-mono font-bold text-[#C2410C] hover:underline shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded"
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
                  className="bg-white rounded-3xl p-6 border border-[#E8E2D8] shadow-editorial hover:shadow-editorial-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center text-[#C2410C]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-code-mono font-bold uppercase px-2.5 py-1 bg-[#181614] text-white rounded-md">
                        {program.batchSize}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#181614] leading-snug">
                      {program.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-code-mono">
                      <span className="px-2 py-0.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded text-[#57534E]">
                        {program.grade}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded text-[#57534E]">
                        {program.board}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-[#57534E] leading-relaxed">
                      {program.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#FAF7F2]">
                      <span className="text-[10px] font-code-mono uppercase text-[#78716C] block mb-1.5">
                        Core Subjects:
                      </span>
                      <div className="flex flex-wrap gap-1 text-[11px]">
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

                  <div className="mt-6 pt-4 border-t border-[#E8E2D8] space-y-2">
                    <Link
                      to={`/student-details?grade=${encodeURIComponent(
                        program.id === 'high-school' ? 'Class 10' :
                        program.id === 'middle-school' ? 'Class 6' :
                        'Class 10'
                      )}`}
                      className="w-full min-h-[44px] inline-flex items-center justify-center space-x-1.5 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold rounded-xl transition-colors shadow-xs active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
                    >
                      <span>Enroll in {program.grade.split(',')[0]} →</span>
                    </Link>

                    <Link
                      to="/timings"
                      className="w-full min-h-[44px] inline-flex items-center justify-center space-x-1.5 py-2 bg-[#FAF7F2] hover:bg-[#EBE5DC] text-[#57534E] text-xs font-semibold rounded-xl border border-[#E8E2D8] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
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

      <section id="timings" aria-labelledby="timings-heading" className="py-12 sm:py-16 bg-[#FAF7F2] border-b border-[#E8E2D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <h2 id="timings-heading" className="text-2xl sm:text-3xl font-black text-[#181614] tracking-tight">
              Class Timetable & Daily Schedule
            </h2>
            <p className="text-sm text-[#57534E] mt-1 leading-relaxed">
              Operating Monday to Saturday from 4:00 PM to 9:00 PM at Thiripura Complex. Structured in three 90-minute evening slots synchronized with school and town bus schedules via Four Roads and Trichy Main Road so students arrive refreshed and return home safely.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOME_BATCH_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-editorial flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2] mb-3">
                    <span className="text-xs font-code-mono font-bold text-[#C2410C] uppercase">
                      {slot.slotNum}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-code-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {slot.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xl font-black text-[#181614]">
                    <Clock className="w-5 h-5 text-[#C2410C]" />
                    <span>{slot.time}</span>
                  </div>

                  <p className="mt-2 text-xs font-bold text-[#181614]">
                    {slot.grades}
                  </p>

                  <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                    {slot.focus}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#FAF7F2] flex items-center justify-between text-xs font-code-mono text-[#78716C]">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-[#C2410C]" />
                      <span>{slot.seats}</span>
                    </span>
                    <span className="text-emerald-700 font-bold">1:12 Ratio</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E8E2D8] flex items-center gap-2">
                  <Link
                    to={`/batches?slot=${slot.id}`}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center py-2.5 bg-[#181614] hover:bg-[#2A2623] text-white text-xs font-bold rounded-xl text-center transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
                  >
                    Check Seats
                  </Link>

                  <Link
                    to={`/student-details?grade=${slot.id === 'slot-1' ? 'Class+6' : slot.id === 'slot-2' ? 'Class+10' : 'Class+12'}`}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold rounded-xl text-center transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
                  >
                    Hold Seat
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white p-5 rounded-2xl border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs">
              <Calendar className="w-5 h-5 text-[#C2410C] shrink-0" />
              <div>
                <span className="font-bold text-[#181614] block">Saturday Timed Mock Exams (Every Week):</span>
                <span className="text-[#57534E]">Evaluated answer sheets returned with individualized teacher corrections.</span>
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

      <section id="steps" aria-labelledby="steps-heading" className="py-12 sm:py-16 bg-[#181614] text-white border-b border-[#2A2623]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 id="steps-heading" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              How Admission Works in 5 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-[#A8A29E] mt-1">
              Navigate step-by-step from student registration to batch confirmation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {HOME_ADMISSION_STEPS.map((st) => (
              <div
                key={st.num}
                className="bg-[#24201D] p-4.5 rounded-2xl border border-[#2A2623] flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#C2410C] text-white flex items-center justify-center font-code-mono text-sm font-bold mb-3">
                    {st.num}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">
                    {st.title}
                  </h3>
                  <p className="text-xs text-[#A8A29E] leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10">
                  <Link
                    to={st.link}
                    className="inline-flex items-center space-x-1 text-xs font-code-mono text-[#FED7AA] hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FED7AA] rounded"
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
              className="min-h-[48px] inline-flex items-center space-x-2 px-8 py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-bold rounded-xl shadow-editorial transition-all active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C]"
            >
              <span>Begin Student Registration (Step 1) →</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="about" aria-labelledby="about-heading" className="py-12 sm:py-16 border-b border-[#E8E2D8] relative">
        <span id="features" className="absolute -top-24 left-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 id="about-heading" className="text-2xl sm:text-3xl font-black text-[#181614] tracking-tight">
                Classroom Standards & Features
              </h2>
            </div>

            <Link
              to="/about"
              className="inline-flex items-center space-x-1.5 text-xs font-code-mono font-bold text-[#C2410C] hover:underline shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded"
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
                  className="bg-white p-5 rounded-2xl border border-[#E8E2D8] shadow-editorial"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#C2410C] flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#181614] mb-1.5 leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
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
