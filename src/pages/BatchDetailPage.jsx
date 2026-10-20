import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Users, 
  Award, 
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import StepProgress from '../components/common/StepProgress';
import { getBatchById, batchesData, resolveBoardForBatch } from '../data/batchesData';
import { useStudentFlow } from '../context/useAppContext';
import { CAMPUS_CONFIG } from '../config/campusConfig';

export default function BatchDetailPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { studentFlow, updateStudentFlow } = useStudentFlow();

  const batch = useMemo(() => {
    return getBatchById(batchId) || batchesData[0];
  }, [batchId]);

  const handleProceedToEnroll = () => {
    const resolvedBoard = resolveBoardForBatch(batch, studentFlow.board);
    const resolvedGrade = studentFlow.grade && (
      batch.grade.includes(studentFlow.grade.replace('Class ', '')) ||
      (batch.grade.includes('6 to 8') && ['Class 6', 'Class 7', 'Class 8'].includes(studentFlow.grade))
    ) ? studentFlow.grade : batch.grade;

    updateStudentFlow({
      selectedBatchId: batch.id,
      grade: resolvedGrade,
      board: resolvedBoard,
    });
    navigate(`/enroll/${batch.id}`);
  };

  const facilities = [
    {
      title: 'Dedicated Study Desks & Whiteboard Hall',
      desc: 'Spacious, well-ventilated classroom with dedicated seating capped strictly at 12 students.'
    },
    {
      title: 'Printed Formula Handbooks & Question Banks',
      desc: 'Every student receives chapter-wise formula summaries and curated 10-year question banks.'
    },
    {
      title: 'Daily 15-Minute Doubt Clearance Desk',
      desc: 'Immediate one-on-one doubt resolution after every 90-minute lecture session.'
    },
    {
      title: 'Weekly Evaluated Saturday Mock Tests',
      desc: 'Standard board-pattern test series with answer evaluations reviewed with parents.'
    },
    {
      title: 'Four Roads & Trichy Road Bus Synchronization',
      desc: 'Batch schedules align with town and school bus routes via Four Roads, ensuring convenient and safe travel.'
    }
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-left">
      <StepProgress currentStep={4} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/batches"
            className="inline-flex items-center space-x-1.5 text-xs font-code-mono text-[#57534E] hover:text-[#181614]"
          >
            <span>← Back to All Batches</span>
          </Link>

          <span className="text-xs font-code-mono text-[#78716C]">
            Enrolling for: <strong className="text-[#181614]">{studentFlow.studentName || 'Student'}</strong>
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8E2D8] shadow-editorial mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-[#181614] text-white rounded-lg text-xs font-code-mono font-bold">
              {batch.grade} • {batch.board}
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-code-mono font-bold">
              {batch.status}
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-code-mono font-bold">
              {batch.seatsRemaining} Seats Remaining
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#181614] tracking-tight">
            {batch.name}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#57534E] leading-relaxed">
            {batch.description}
          </p>

          <div className="mt-6 pt-6 border-t border-[#FAF7F2] grid sm:grid-cols-3 gap-4 text-xs font-code-mono">
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8]">
              <div className="flex items-center space-x-2 text-[#C2410C] font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>Evening Timetable</span>
              </div>
              <p className="text-sm font-black text-[#181614]">{batch.timing}</p>
              <p className="text-[#78716C] text-[11px] mt-0.5">{batch.days}</p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8]">
              <div className="flex items-center space-x-2 text-[#C2410C] font-bold mb-1">
                <Users className="w-4 h-4" />
                <span>Small Batch Limit</span>
              </div>
              <p className="text-sm font-black text-[#181614]">Strictly Max 12</p>
              <p className="text-[#78716C] text-[11px] mt-0.5">Personalized Attention</p>
            </div>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8]">
              <div className="flex items-center space-x-2 text-[#C2410C] font-bold mb-1">
                <Award className="w-4 h-4" />
                <span>Monthly Fee</span>
              </div>
              <p className="text-sm font-black text-[#181614]">₹{batch.monthlyFee.toLocaleString('en-IN')}</p>
              <p className="text-emerald-700 font-bold text-[11px] mt-0.5">Zero Registration Fee</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-editorial space-y-5">
            <h2 className="text-base font-bold text-[#181614] pb-3 border-b border-[#FAF7F2] flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#C2410C]" />
              <span>Weekly Academic Routine & Schedule</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8]">
                <strong className="text-[#181614] block font-code-mono mb-1">
                  Monday – Friday (Daily 90-Minute Class):
                </strong>
                <p className="text-[#57534E] leading-relaxed">
                  Line-by-line concept breakdown, NCERT / Samacheer textbook exemplars, step-marked derivations, and past-year question paper drills.
                </p>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8]">
                <strong className="text-[#181614] block font-code-mono mb-1">
                  Daily 15-Minute Doubt Clinic:
                </strong>
                <p className="text-[#57534E] leading-relaxed">
                  Immediately following every lecture, students clear individual doubts with the teacher before leaving the center.
                </p>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8]">
                <strong className="text-[#181614] block font-code-mono mb-1">
                  Saturday 2-Hour Timed Mock Test:
                </strong>
                <p className="text-[#57534E] leading-relaxed">
                  Weekly board-replica examination. Evaluated answer sheets with step-by-step remarks are handed back to parents.
                </p>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D8]">
                <strong className="text-[#181614] block font-code-mono mb-1">
                  Sunday Doubt & Review Sessions:
                </strong>
                <p className="text-[#57534E] leading-relaxed">
                  Special 1-on-1 review sessions by appointment for students needing extra catch-up in weak chapters.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-editorial space-y-5">
            <h2 className="text-base font-bold text-[#181614] pb-3 border-b border-[#FAF7F2] flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#C2410C]" />
              <span>Classroom Facilities & Study Materials</span>
            </h2>

            <div className="space-y-3">
              {facilities.map((fac, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] flex items-start space-x-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-[#181614]">{fac.title}</h4>
                    <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed">{fac.desc}</p>
                  </div>
                </div>
              ))}

              <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] text-xs font-code-mono text-[#57534E]">
                <div className="flex items-center space-x-2 text-[#181614] font-bold mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C2410C]" />
                  <span>Classroom Venue:</span>
                </div>
                <p>{batch.classroom}</p>
                <p className="text-[10px] text-[#78716C] mt-1">{CAMPUS_CONFIG.location.fullAddress}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#181614] text-white rounded-3xl p-6 sm:p-8 border border-[#2A2623] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-code-mono uppercase tracking-wider text-[#FED7AA] font-bold block mb-1">
              Step 4 of 5 • Batch Selection & Confirmation
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Ready to Reserve Your Seat in This Batch?
            </h3>
            <p className="text-xs sm:text-sm text-[#A8A29E] mt-1">
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
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-bold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98"
            >
              <span>Confirm Batch & Proceed to Enrollment (Step 5)</span>
              <ArrowRight className="w-4 h-4 text-[#FED7AA]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
