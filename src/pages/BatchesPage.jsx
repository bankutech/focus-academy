import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  ArrowRight, 
  Users, 
  Edit2,
  BookOpen
} from 'lucide-react';
import StepProgress from '../components/common/StepProgress';
import { batchesData, getBatchesFiltered, resolveBoardForBatch } from '../data/batchesData';
import { useStudentFlow } from '../context/useAppContext';

export default function BatchesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { studentFlow, updateStudentFlow } = useStudentFlow();

  const courseParam = searchParams.get('course') || '';
  const slotParam = searchParams.get('slot') || 'all';

  let initialGrade = searchParams.get('grade') || studentFlow.grade || 'all';
  if (courseParam) {
    if (courseParam.includes('12')) initialGrade = 'Class 12';
    else if (courseParam.includes('11')) initialGrade = 'Class 11';
    else if (courseParam.includes('10')) initialGrade = 'Class 10';
    else if (courseParam.includes('9')) initialGrade = 'Class 9';
    else if (courseParam.includes('6') || courseParam.includes('7') || courseParam.includes('8') || courseParam.includes('foundation')) initialGrade = 'Class 6';
  }
  if (initialGrade === 'Class 7' || initialGrade === 'Class 8' || initialGrade.includes('6 to 8')) {
    initialGrade = 'Class 6';
  }

  const [activeGradeFilter, setActiveGradeFilter] = useState(initialGrade);
  const [activeBoardFilter, setActiveBoardFilter] = useState(
    searchParams.get('board') || studentFlow.board || 'all'
  );
  const [selectedSlot, setSelectedSlot] = useState(
    ['slot-1', 'slot-2', 'slot-3'].includes(slotParam) ? slotParam : 'all'
  );

  const filteredBatches = useMemo(() => {
    let list = getBatchesFiltered({
      grade: activeGradeFilter,
      board: activeBoardFilter === 'all' ? null : activeBoardFilter,
    });

    if (list.length === 0) {
      list = batchesData.filter(b => {
        if (activeGradeFilter === 'all') return true;
        return b.grade.toLowerCase().includes(activeGradeFilter.toLowerCase().replace('class ', ''));
      });
    }

    if (selectedSlot !== 'all') {
      list = list.filter(b => b.slotId === selectedSlot);
    }

    if (list.length === 0) {
      list = batchesData;
    }

    return list;
  }, [activeGradeFilter, activeBoardFilter, selectedSlot]);

  const handleSelectBatch = (batch) => {
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
    navigate(`/batch/${batch.id}`);
  };

  const gradeOptions = [
    { id: 'all', label: 'All Classes' },
    { id: 'Class 6', label: 'Classes 6–8' },
    { id: 'Class 9', label: 'Class 9' },
    { id: 'Class 10', label: 'Class 10' },
    { id: 'Class 11', label: 'Class 11' },
    { id: 'Class 12', label: 'Class 12' },
  ];

  const boardOptions = [
    { id: 'all', label: 'All Boards' },
    { id: 'TN State Board (Samacheer)', label: 'State Board' },
    { id: 'CBSE Board', label: 'CBSE' },
    { id: 'ICSE Board', label: 'ICSE' },
  ];

  const slots = [
    { id: 'all', label: 'All Slots (4 PM – 9 PM)' },
    { id: 'slot-1', label: '4:30 PM – 6:00 PM' },
    { id: 'slot-2', label: '6:00 PM – 7:30 PM' },
    { id: 'slot-3', label: '7:30 PM – 9:00 PM' },
  ];

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-left">
      <StepProgress currentStep={3} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-[#E8E2D8] shadow-editorial flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-code-mono text-[#57534E]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Student: <strong className="text-[#181614]">{studentFlow.studentName || 'Student'}</strong></span>
              <span>•</span>
              <span>Target: <strong className="text-[#C2410C]">{studentFlow.examPrep || 'Academic Excellence'}</strong></span>
            </div>
            <p className="text-xs text-[#78716C]">
              Showing matching small-batches at Thiripura Complex, Thoramangalam.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-code-mono">
            <Link
              to="/student-details"
              className="inline-flex items-center space-x-1 text-[#57534E] hover:text-[#C2410C] px-3 py-1.5 rounded-lg border border-[#E8E2D8] bg-[#FAF7F2]"
            >
              <Edit2 className="w-3 h-3" />
              <span>Change Class/Board</span>
            </Link>

            <Link
              to="/exam-prep"
              className="inline-flex items-center space-x-1 text-[#57534E] hover:text-[#C2410C] px-3 py-1.5 rounded-lg border border-[#E8E2D8] bg-[#FAF7F2]"
            >
              <Edit2 className="w-3 h-3" />
              <span>Change Goal</span>
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <span className="text-[11px] font-code-mono uppercase tracking-wider text-[#C2410C] font-bold block mb-1">
            Step 3 of 5 • Batch Information & Schedule
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#181614] tracking-tight">
            Available Evening Batches
          </h1>
          <p className="text-sm text-[#57534E] mt-1 max-w-2xl leading-relaxed">
            All batches run Monday to Saturday between 4:00 PM and 9:00 PM with a strict 12-student cap. Timings are synchronized with local school buses arriving via Four Roads and Trichy Main Road so students arrive refreshed.
          </p>
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 inline-flex items-center space-x-2">
            <span className="font-bold text-[#C2410C]">1-Day Free Trial:</span>
            <span>Attend one complete evening session before paying any fees. Zero registration fee.</span>
          </div>
        </div>

        <div className="mb-8 bg-white p-4 rounded-2xl border border-[#E8E2D8] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-code-mono uppercase font-bold text-[#78716C] mr-1 shrink-0">
              Class:
            </span>
            {gradeOptions.map((g) => {
              const isGradeActive = activeGradeFilter === g.id ||
                (g.id === 'Class 6' && (activeGradeFilter === 'Class 7' || activeGradeFilter === 'Class 8' || activeGradeFilter.includes('6 to 8')));
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGradeFilter(g.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    isGradeActive
                      ? 'bg-[#181614] text-white'
                      : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#E8E2D8]'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-code-mono uppercase font-bold text-[#78716C] mr-1 shrink-0">
              Board:
            </span>
            {boardOptions.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveBoardFilter(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  activeBoardFilter === b.id
                    ? 'bg-[#C2410C] text-white'
                    : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#E8E2D8]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-code-mono uppercase font-bold text-[#78716C]">
              Slot:
            </span>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-bold rounded-xl px-3 py-1.5 text-[#181614] focus:outline-hidden"
            >
              {slots.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredBatches.map((batch) => {
            return (
              <div
                key={batch.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D8] shadow-editorial flex flex-col justify-between hover:border-[#C2410C]/40 transition-all"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#FAF7F2] mb-4">
                    <span className="px-2.5 py-1 bg-[#181614] text-white rounded-lg text-[10px] font-code-mono uppercase font-bold">
                      {batch.grade} • {batch.board}
                    </span>

                    <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-code-mono font-bold">
                      {batch.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#181614] leading-snug">
                    {batch.name}
                  </h3>

                  <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs font-code-mono bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8E2D8]">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <div>
                        <span className="font-bold text-[#181614] block">{batch.timing}</span>
                        <span className="text-[#78716C] text-[10px]">{batch.days}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-[#C2410C] shrink-0" />
                      <div>
                        <span className="font-bold text-[#181614] block">Max 12 Students</span>
                        <span className="text-emerald-700 font-bold text-[10px]">{batch.seatsRemaining} Seats Left</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] font-code-mono uppercase text-[#78716C] block mb-1.5">
                      Subjects Covered:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {batch.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-white border border-[#E8E2D8] text-xs font-semibold text-[#181614] rounded-lg shadow-xs"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#FAF7F2] text-xs font-code-mono text-[#57534E] flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-[#C2410C] shrink-0" />
                    <span className="truncate">{batch.classroom}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#FAF7F2] text-xs font-code-mono text-[#78716C] flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#C2410C]" />
                      <span>Curriculum:</span>
                    </span>
                    <strong className="text-[#181614]">Samacheer Kalvi & NCERT Aligned</strong>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-code-mono uppercase text-[#78716C] block">
                      Monthly Tuition Fee
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[#181614]">
                      ₹{batch.monthlyFee.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-code-mono text-emerald-700 block">
                      All study materials included
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSelectBatch(batch)}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-5 py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98"
                    >
                      <span>Select Batch & Details (Step 4)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#FED7AA]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-3xl p-6 border border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-code-mono text-[#57534E]">
            <span className="font-bold text-[#181614] block">Focus Academy Thoramangalam Guarantee:</span>
            <span>100% No-Questions-Asked Rematch or Refund Guarantee after Session 1.</span>
          </div>

          <Link
            to="/exam-prep"
            className="text-xs font-semibold text-[#78716C] hover:text-[#181614] shrink-0"
          >
            ← Back to Exam Preparation Goals
          </Link>
        </div>
      </div>
    </div>
  );
}
