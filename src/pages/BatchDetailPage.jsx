import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  MapPin, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Award 
} from 'lucide-react';
import { BATCHES_DATA } from '../data/batchesData';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow } from '../context/useAppContext';
import { CAMPUS_CONFIG } from '../config/campusConfig';

export default function BatchDetailPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { studentFlow, setStudentFlow } = useStudentFlow();

  const batch = BATCHES_DATA.find((b) => b.id === batchId) || BATCHES_DATA[0];

  const handleProceedToEnroll = () => {
    setStudentFlow((prev) => ({
      ...prev,
      selectedBatchId: batch.id,
      selectedBatchName: batch.name,
      monthlyFee: batch.monthlyFee,
      timing: batch.timing,
      step: 5,
    }));
    navigate(`/enroll/${batch.id}`);
  };

  const facilities = [
    {
      title: 'Individual Ergonomic Study Desks',
      desc: 'Dedicated single-student desks designed for comfortable posture during 90-minute evening problem-solving sessions.'
    },
    {
      title: 'NCERT & Samacheer Question Bank Archive',
      desc: 'Exclusive physical repository of past 10-year board papers, answer keys, and step-by-step marking schemes.'
    },
    {
      title: 'RO Drinking Water & Air-Circulated Classrooms',
      desc: 'Hygienic, quiet classrooms insulated from traffic noise, equipped with filtered drinking water.'
    },
    {
      title: 'Four Roads & Trichy Road Bus Synchronization',
      desc: 'Batch schedules align with town and school bus routes via Four Roads, ensuring convenient and safe travel.'
    }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left">
      <StepProgress currentStep={4} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/batches"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-[#0F172A]"
          >
            <span>← Back to All Batches</span>
          </Link>

          <span className="text-xs text-slate-500">
            Enrolling for: <strong className="text-[#0F172A]">{studentFlow.studentName || 'Student'}</strong>
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-editorial mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-[#0F172A] text-white rounded-lg text-xs font-bold">
              {batch.grade} • {batch.board}
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold">
              {batch.status}
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold">
              {batch.seatsRemaining} Seats Remaining
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            {batch.name}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            {batch.description}
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-[#E2E8F0]">
              <div className="flex items-center space-x-2 text-[#EA580C] font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>Evening Timetable</span>
              </div>
              <p className="text-sm font-bold text-[#0F172A]">{batch.timing}</p>
              <p className="text-slate-500 text-xs mt-0.5">{batch.days}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-[#E2E8F0]">
              <div className="flex items-center space-x-2 text-[#EA580C] font-bold mb-1">
                <Users className="w-4 h-4" />
                <span>Small Batch Limit</span>
              </div>
              <p className="text-sm font-bold text-[#0F172A]">Strictly Max 12</p>
              <p className="text-slate-500 text-xs mt-0.5">Personalized Attention</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-[#E2E8F0]">
              <div className="flex items-center space-x-2 text-[#EA580C] font-bold mb-1">
                <Award className="w-4 h-4" />
                <span>Monthly Fee</span>
              </div>
              <p className="text-sm font-bold text-[#0F172A]">₹{batch.monthlyFee.toLocaleString('en-IN')}</p>
              <p className="text-emerald-700 font-bold text-xs mt-0.5">Zero Registration Fee</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-editorial space-y-5">
            <h2 className="text-base font-bold text-[#0F172A] pb-3 border-b border-slate-100 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#EA580C]" />
              <span>Weekly Academic Routine & Schedule</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-1">
                  Monday – Friday (Daily 90-Minute Class):
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  Line-by-line concept breakdown, NCERT / Samacheer textbook exemplars, step-marked derivations, and past-year question paper drills.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-1">
                  Daily 15-Minute Doubt Clinic:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  Immediately following every lecture, students clear individual doubts with the teacher before leaving the center.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-1">
                  Saturday 2-Hour Timed Mock Test:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  Weekly board-replica examination. Evaluated answer sheets with step-by-step remarks are handed back to parents.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-[#E2E8F0]">
                <strong className="text-[#0F172A] block mb-1">
                  Sunday Doubt & Review Sessions:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  Special 1-on-1 review sessions by appointment for students needing extra catch-up in weak chapters.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-editorial space-y-5">
            <h2 className="text-base font-bold text-[#0F172A] pb-3 border-b border-slate-100 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#EA580C]" />
              <span>Classroom Facilities & Study Materials</span>
            </h2>

            <div className="space-y-3">
              {facilities.map((fac, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-[#E2E8F0] flex items-start space-x-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">{fac.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{fac.desc}</p>
                  </div>
                </div>
              ))}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-[#E2E8F0] text-xs text-slate-600">
                <div className="flex items-center space-x-2 text-[#0F172A] font-bold mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Classroom Venue:</span>
                </div>
                <p>{batch.classroom}</p>
                <p className="text-xs text-slate-500 mt-1">{CAMPUS_CONFIG.location.fullAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0F172A] text-white rounded-3xl p-6 sm:p-8 border border-[#1E293B] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to Reserve Your Seat in This Batch?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Seats are strictly capped at 12 to maintain individual focus. Only {batch.seatsRemaining} openings remaining.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <Link
              to="/batches"
              className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/20 transition-all text-center"
            >
              Choose Other Batch
            </Link>

            <button
              type="button"
              onClick={handleProceedToEnroll}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98"
            >
              <span>Confirm Batch & Proceed to Enrollment (Step 5)</span>
              <ArrowRight className="w-4 h-4 text-orange-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
