import { usePageMeta } from '../hooks/usePageMeta';
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Bus, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  ArrowRight, 
  Target, 
  MessageSquare, 
  ExternalLink 
} from 'lucide-react';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { HOME_BATCH_SLOTS } from '../data/homeData';

export default function AboutPage() {
  usePageMeta({
    title: 'About Focus Academy | Campus and Teaching Method in Perambalur',
    description: 'How Focus Academy teaches: 12-student batches, daily notebook inspection, Saturday timed mock exams and direct parent feedback in Thoramangalam, Perambalur.',
    path: '/about',
  });
  const whatsappInquiryUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    'Hello Focus Academy Perambalur! I would like to learn more about your 12-student batch philosophy, campus facilities, and admissions.'
  )}`;

  const facilities = [
    {
      title: 'Ergonomic Individual Student Desks',
      description: 'Spacious single-student seating designed for comfortable posture during 90-minute evening problem-solving sessions.'
    },
    {
      title: 'High-Contrast Whiteboards & Clear Sightlines',
      description: 'Unobstructed visual access from every seat. Every step of mathematical derivations and scientific diagrams is clearly visible.'
    },
    {
      title: 'Well-Ventilated & Acoustic-Insulated Rooms',
      description: 'Quiet, air-circulated classrooms situated on the first floor away from main road vehicle horns and distractions.'
    },
    {
      title: 'Curated Board Exam Reference Library',
      description: 'Complete collection of past 10-year Tamil Nadu State Board question banks, NCERT exemplars, and step-marked solutions.'
    },
    {
      title: 'Dedicated Two-Wheeler & Bicycle Parking',
      description: 'Secure ground-floor parking space inside Thiripura Complex for students arriving from Thoramangalam and nearby areas.'
    },
    {
      title: 'Pure Filtered RO Drinking Water & Amenities',
      description: 'Clean RO drinking water dispenser and hygienic washroom facilities maintained daily for student comfort.'
    }
  ];

  const methodologyPillars = [
    {
      icon: Target,
      title: 'Conceptual Clarity Over Rote Learning',
      description: 'Students understand the fundamental "why" behind mathematical formulas and scientific principles before attempting exam questions. No blind memorization.'
    },
    {
      icon: ShieldCheck,
      title: 'Personalized Daily Notebook Inspection',
      description: 'Because our classes have only 12 students, the teacher personally checks student calculations and algebraic steps in real-time each evening.'
    },
    {
      icon: Clock,
      title: 'Saturday Timed Mock Exam Rhythm',
      description: 'Every Saturday, students write timed exam papers replicating exact board exam conditions. Detailed feedback is given before the next class.'
    },
    {
      icon: CheckCircle2,
      title: 'Direct Parent Transparency',
      description: 'Parents receive honest diagnostic feedback, attendance records, and test performance analysis directly from teaching faculty.'
    }
  ];

  return (
    <div className="py-10 sm:py-14 bg-[#F8FAFC] min-h-screen text-left">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-4">
          <Link to="/" className="hover:text-brand">Home</Link>
          <span>/</span>
          <span className="text-[#0F172A] font-bold">About Focus Academy</span>
        </div>

        <div className="mb-6 bg-orange-50/90 border border-orange-200/80 rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand text-white font-bold text-xs shrink-0">FA</span>
            <span>Looking for tuition batches, syllabus details, or student admission?</span>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/" className="font-bold text-brand hover:text-brand-strong hover:underline inline-flex items-center space-x-1">
              <span>Explore Homepage & Admissions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <section aria-labelledby="about-hero-heading" className="bg-white rounded-lg p-6 sm:p-10 lg:p-12 border border-[#E2E8F0] shadow-xs mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <h1 id="about-hero-heading" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                Academic Coaching Built on Direct Attention
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                Founded in 2018 at Thiripura Complex, Focus Academy was established on a single non-negotiable principle: students excel when coaching is intimate, disciplined, and strictly capped at 12 students per batch.
              </p>

              <div className="mt-6 grid sm:grid-cols-2 gap-3.5">
                <div className="p-4 bg-white rounded-md border border-[#E2E8F0] text-xs text-[#0F172A] flex items-start space-x-3 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Academic Satisfaction Guarantee</span>
                    <span className="text-slate-600 mt-0.5 block">Enroll with complete confidence in our 12-student batch attention and disciplined daily coaching.</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-md border border-[#E2E8F0] text-xs text-[#0F172A] flex items-start space-x-3 shadow-xs">
                  <Bus className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">Bus-Synchronized Timings</span>
                    <span className="text-slate-600 mt-0.5 block">Slots aligned with Perambalur town buses via Four Roads & Trichy Main Road for student safety.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/timings"
                  className="min-h-[46px] inline-flex items-center justify-center space-x-2 px-6 py-3 bg-brand hover:bg-brand-strong text-white text-xs sm:text-sm font-bold rounded-md shadow-xs transition-all active:scale-98 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <span>View Batch Timings & Seats</span>
                  <ArrowRight className="w-4 h-4 text-orange-100" />
                </Link>

                <Link
                  to="/contact"
                  className="min-h-[46px] inline-flex items-center justify-center space-x-2 px-6 py-3 bg-white hover:bg-slate-50 text-[#0F172A] text-xs sm:text-sm font-bold rounded-md border border-[#E2E8F0] shadow-xs transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <MapPin className="w-4 h-4 text-brand" />
                  <span>Visit Campus</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-[#F8FAFC] rounded-lg p-5 border border-[#E2E8F0]">
                <div className="relative rounded-md overflow-hidden border border-[#E2E8F0] mb-4 bg-slate-100">
                  <img
                    src="/focus-academy-perambalur.jpg"
                    alt="Focus Academy premises at Thiripura Complex, Thoramangalam, Perambalur"
                    width={1200}
                    height={700}
                    className="w-full aspect-[16/9] object-cover object-center"
                    loading="eager"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F172A]/85 text-white text-xs font-semibold px-2.5 py-1 rounded-md flex items-center space-x-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Campus Premises</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start space-x-2.5">
                    <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#0F172A] block">Address:</span>
                      <span className="leading-relaxed">{CAMPUS_CONFIG.location.fullAddress}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-brand shrink-0" />
                    <span>{CAMPUS_CONFIG.timings.workingDays}: {CAMPUS_CONFIG.timings.dailyHours}</span>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <Phone className="w-4 h-4 text-brand shrink-0" />
                    <span>Campus Helpdesk: {CAMPUS_CONFIG.contact.primaryPhone}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#E2E8F0] flex items-center justify-between">
                  <a
                    href={CAMPUS_CONFIG.location.googleMapsDirectionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-brand hover:underline"
                  >
                    <span>Directions on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={whatsappInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-whatsapp" />
                    <span>WhatsApp Desk</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="philosophy-heading" className="mb-12">
          <div className="max-w-3xl mb-8">
            <h2 id="philosophy-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Why We Strictly Cap Batches at 12 Students
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              In commercial coaching centers with 40 to 60 students per hall, teaching turns into a one-way lecture. Hesitant students hold back their doubts, while teachers cannot inspect student notebooks or check step-by-step working.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 sm:p-7 border border-[#E2E8F0] shadow-xs">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-rose-50 text-rose-700 rounded-md text-xs font-bold mb-4">
                <span>The Conventional 50-Student Problem</span>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                  <span>Slow-learning students feel intimidated and stay silent rather than asking questions.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                  <span>Teachers cannot verify whether every student has written step-by-step derivations correctly.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                  <span>Homework checking is rushed or delegated, hiding conceptual gaps until board results arrive.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                  <span>Parents only receive generic marks reports with no personalized diagnostic feedback.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 sm:p-7 border-2 border-orange-500/40 shadow-xs">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-md text-xs font-bold mb-4">
                <span>The Focus Academy 12-Student Guarantee</span>
              </div>
              <ul className="space-y-3.5 text-xs sm:text-sm text-[#0F172A]">
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Every student solves problems on the whiteboard under direct teacher observation.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Daily notebook inspection identifies calculation errors and algebraic slips immediately.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Dedicated 15 minutes reserved after every class for individual, one-on-one doubt resolution.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>Direct phone updates and monthly parent meetings with actual test papers reviewed together.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="methodology-heading" className="mb-12">
          <div className="max-w-3xl mb-8">
            <h2 id="methodology-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Curriculum & Coaching Methodology
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              We prepare students for high scores through structured daily practice, board question drills, and consistent weekly testing.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {methodologyPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-md bg-orange-50 text-brand flex items-center justify-center mb-3.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#0F172A] mb-2 leading-snug">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="timings-sync-heading" className="mb-12 bg-white rounded-lg p-6 sm:p-8 lg:p-10 border border-[#E2E8F0] shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5">
              <h2 id="timings-sync-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Coordinated with Perambalur Bus Routes
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Focus Academy is situated at Thiripura Complex, Rajanagar, Thoramangalam, just 2 minutes from the Four Roads junction and Trichy Main Road.
              </p>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our batch timings are intentionally scheduled so school students coming from Perambalur town schools or nearby areas can arrive via town and school buses and safely depart before evening transit finishes.
              </p>

              <div className="mt-6 p-4 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] text-xs space-y-2">
                <div className="flex items-center space-x-2 text-[#0F172A] font-bold">
                  <MapPin className="w-4 h-4 text-brand" />
                  <span>Strategic Campus Landmark</span>
                </div>
                <p className="text-slate-600">
                  Near Malar Hospital / Opp. EB Office on Main Road via Four Roads. Safe walking route with well-lit streets and active commercial surroundings.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="space-y-3.5">
                {HOME_BATCH_SLOTS.map((slot) => (
                  <div key={slot.id} className="p-4 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-brand uppercase">
                          {slot.slotNum}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          {slot.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-base font-bold text-[#0F172A] mt-1">
                        <Clock className="w-4 h-4 text-brand" />
                        <span>{slot.time}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#0F172A] mt-0.5">
                        {slot.grades}
                      </p>
                    </div>

                    <Link
                      to={`/timings?slot=${slot.id}`}
                      className="min-h-[38px] px-4 py-2 bg-white hover:bg-[#0F172A] hover:text-white text-[#0F172A] text-xs font-bold rounded-md border border-[#E2E8F0] transition-colors shrink-0 inline-flex items-center justify-center space-x-1"
                    >
                      <span>Check Seats</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="facilities-heading" className="mb-12">
          <div className="max-w-3xl mb-8">
            <h2 id="facilities-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Campus Facilities at Thiripura Complex
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Every facility has been designed to provide an orderly, distraction-free environment for concentrated evening learning.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((fac, idx) => (
              <div key={idx} className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs">
                <div className="w-8 h-8 rounded-md bg-orange-50 border border-orange-200 flex items-center justify-center text-brand mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#0F172A] mb-1.5 leading-snug">
                  {fac.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {fac.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="trial-cta-heading" className="bg-[#0F172A] text-white rounded-lg p-6 sm:p-10 border border-[#1E293B] shadow-sm text-center">
          <div className="max-w-2xl mx-auto">
            <h2 id="trial-cta-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Experience the 12-Student Classroom
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Meet our subject teachers, inspect our classroom setup at Thiripura Complex, and experience our structured coaching methods with zero advance registration fee.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to="/student-details"
                className="min-h-[46px] inline-flex items-center space-x-2 px-6 py-3 bg-brand hover:bg-brand-strong text-white text-xs sm:text-sm font-bold rounded-md shadow-xs transition-all active:scale-98"
              >
                <span>Enroll in Evening Batch →</span>
              </Link>

              <Link
                to="/contact"
                className="min-h-[46px] inline-flex items-center space-x-2 px-6 py-3 bg-[#1E293B] hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-md border border-slate-700 transition-all"
              >
                <MapPin className="w-4 h-4 text-orange-100" />
                <span>Visit Campus at Thoramangalam</span>
              </Link>

              <a
                href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
                className="min-h-[46px] inline-flex items-center space-x-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-md border border-white/15 transition-all"
              >
                <Phone className="w-4 h-4 text-orange-100" />
                <span>Call {CAMPUS_CONFIG.contact.primaryPhone}</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
