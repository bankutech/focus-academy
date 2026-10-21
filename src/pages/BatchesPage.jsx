import React, { useState } from 'react';
import { Link, useSearchParams, useLocation, Navigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  MapPin, 
  BookOpen, 
  ArrowRight, 
  Edit2,
  Filter 
} from 'lucide-react';
import { BATCHES_DATA } from '../data/batchesData';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow, getStepRedirect, isStep1Complete, isStep2Complete } from '../context/useAppContext';

export default function BatchesPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const urlSlot = searchParams.get('slot') || 'all';

  const { studentFlow, setStudentFlow } = useStudentFlow();

  const [activeGradeFilter, setActiveGradeFilter] = useState(
    searchParams.get('grade') || studentFlow.grade || 'all'
  );
  const [activeBoardFilter, setActiveBoardFilter] = useState(
    searchParams.get('board') || studentFlow.board || 'all'
  );
  const [selectedSlot, setSelectedSlot] = useState(urlSlot);

  const redirectPath = getStepRedirect(3, studentFlow, location.pathname);
  if (redirectPath) {
    return <Navigate to={redirectPath} state={{ redirectedFrom: 3 }} replace />;
  }

  const filteredBatches = BATCHES_DATA.filter((batch) => {
    let matchGrade = true;
    if (activeGradeFilter !== 'all') {
      if (activeGradeFilter.includes('6') || activeGradeFilter.includes('7') || activeGradeFilter.includes('8')) {
        matchGrade = batch.grade.includes('6') || batch.grade.includes('7') || batch.grade.includes('8') || batch.grade.includes('6 to 8');
      } else {
        matchGrade = batch.grade.toLowerCase().includes(activeGradeFilter.toLowerCase());
      }
    }

    let matchBoard = true;
    if (activeBoardFilter !== 'all') {
      if (activeBoardFilter.includes('State')) {
        matchBoard = batch.board.includes('State') || batch.board.includes('Samacheer');
      } else if (activeBoardFilter.includes('CBSE')) {
        matchBoard = batch.board.includes('CBSE');
      }
    }

    let matchSlot = true;
    if (selectedSlot !== 'all') {
      if (selectedSlot === 'slot-1') matchSlot = batch.timing.includes('4:30');
      if (selectedSlot === 'slot-2') matchSlot = batch.timing.includes('6:00');
      if (selectedSlot === 'slot-3') matchSlot = batch.timing.includes('7:30');
    }

    return matchGrade && matchBoard && matchSlot;
  });

  const handleSelectBatch = (batch) => {
    const isStep2Done = isStep2Complete(studentFlow);
    setStudentFlow((prev) => ({
      ...prev,
      selectedBatchId: batch.id,
      selectedBatchName: batch.name,
      timing: batch.timing,
      monthlyFee: batch.monthlyFee,
      subjects: Array.isArray(batch.subjects) ? batch.subjects.join(', ') : (batch.subjects || ''),
      step: isStep2Done ? Math.max(Number(prev?.step) || 1, 4) : (prev?.step || 1),
    }));
  };

  const getBatchLink = (batchId) => {
    if (!isStep1Complete(studentFlow)) {
      return '/student-details';
    }
    if (!isStep2Complete(studentFlow)) {
      return '/exam-prep';
    }
    return `/batch/${batchId}`;
  };

  const gradeOptions = [
    { id: 'all', label: 'All Classes' },
    { id: 'Class 6', label: 'Classes 6 – 8 (Middle)' },
    { id: 'Class 9', label: 'Class 9' },
    { id: 'Class 10', label: 'Class 10' },
    { id: 'Class 11', label: 'Class 11' },
    { id: 'Class 12', label: 'Class 12' },
  ];

  const boardOptions = [
    { id: 'all', label: 'All Boards' },
    { id: 'TN State Board (Samacheer)', label: 'State Board' },
    { id: 'CBSE Board', label: 'CBSE' },
  ];

  const slots = [
    { id: 'all', label: 'All Evening Slots (4–9 PM)' },
    { id: 'slot-1', label: '4:30 PM – 6:00 PM' },
    { id: 'slot-2', label: '6:00 PM – 7:30 PM' },
    { id: 'slot-3', label: '7:30 PM – 9:00 PM' },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left">
      <StepProgress currentStep={3} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-6 bg-white p-4 sm:p-5 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Student: <strong className="text-[#0F172A]">{studentFlow.studentName || 'Student'}</strong></span>
              <span>•</span>
              <span>Target: <strong className="text-[#EA580C]">{studentFlow.examPrep || 'Academic Excellence'}</strong></span>
            </div>
            <p className="text-xs text-slate-500">
              Showing matching small-batches at Thiripura Complex, Thoramangalam.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Link
              to="/student-details"
              className="inline-flex items-center space-x-1 text-slate-600 hover:text-[#EA580C] px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-slate-50"
            >
              <Edit2 className="w-3 h-3" />
              <span>Change Class/Board</span>
            </Link>

            <Link
              to="/exam-prep"
              className="inline-flex items-center space-x-1 text-slate-600 hover:text-[#EA580C] px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-slate-50"
            >
              <Edit2 className="w-3 h-3" />
              <span>Change Goal</span>
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Available Evening Batches
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            All batches run Monday to Saturday between 4:00 PM and 9:00 PM with a strict 12-student cap. Timings are synchronized with local school buses arriving via Four Roads and Trichy Main Road so students arrive refreshed.
          </p>
          <div className="mt-3 p-3 bg-orange-50/80 rounded-md border border-orange-200 text-xs text-orange-950 inline-flex items-center space-x-2">
            <span className="font-bold text-[#EA580C]">1-Day Free Trial:</span>
            <span>Attend one complete evening session before paying any fees. Zero registration fee.</span>
          </div>
        </div>

        <div 
          data-testid="batches-filter-bar"
          className="sticky top-[108px] sm:top-28 z-20 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-lg border border-[#E2E8F0] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 overflow-hidden w-full md:w-auto">
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar touch-pan-x scroll-smooth w-full sm:w-auto py-0.5">
              <span className="text-xs uppercase font-bold text-slate-500 mr-1 shrink-0 flex items-center space-x-1">
                <Filter className="w-3 h-3 text-[#EA580C]" />
                <span>Class:</span>
              </span>
              {gradeOptions.map((g) => {
                const isGradeActive = activeGradeFilter === g.id ||
                  (g.id === 'Class 6' && (activeGradeFilter === 'Class 7' || activeGradeFilter === 'Class 8' || activeGradeFilter.includes('6 to 8')));
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveGradeFilter(g.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center ${
                      isGradeActive
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-[#E2E8F0]'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar touch-pan-x scroll-smooth w-full sm:w-auto py-0.5">
              <span className="text-xs uppercase font-bold text-slate-500 mr-1 shrink-0">
                Board:
              </span>
              {boardOptions.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveBoardFilter(b.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 min-h-[34px] flex items-center ${
                    activeBoardFilter === b.id
                      ? 'bg-[#EA580C] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-[#E2E8F0]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
            <div className="flex items-center space-x-2">
              <label htmlFor="batch-slot-select" className="text-xs uppercase font-bold text-slate-500">
                Slot:
              </label>
              <select
                id="batch-slot-select"
                aria-label="Filter batches by timing slot"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="bg-slate-50 border border-[#E2E8F0] text-xs font-bold rounded-md px-3 py-1.5 text-[#0F172A] focus:outline-hidden min-h-[34px]"
              >
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-md border border-slate-200 shrink-0">
              {filteredBatches.length} {filteredBatches.length === 1 ? 'Batch' : 'Batches'}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {filteredBatches.map((batch) => {
            return (
              <div
                key={batch.id}
                className="bg-white rounded-lg p-6 sm:p-7 border border-[#E2E8F0] shadow-xs flex flex-col justify-between hover:border-[#EA580C]/40 transition-all"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                    <span className="px-2.5 py-1 bg-[#0F172A] text-white rounded-md text-xs uppercase font-bold">
                      {batch.grade} • {batch.board}
                    </span>

                    <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-xs font-bold">
                      {batch.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0F172A] leading-snug">
                    {batch.name}
                  </h3>

                  <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-md border border-[#E2E8F0]">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-[#EA580C] shrink-0" />
                      <div>
                        <span className="font-bold text-[#0F172A] block">{batch.timing}</span>
                        <span className="text-slate-500 text-xs">{batch.days}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-[#EA580C] shrink-0" />
                      <div>
                        <span className="font-bold text-[#0F172A] block">Max 12 Students</span>
                        <span className="text-emerald-700 font-bold text-xs">{batch.seatsRemaining} Seats Left</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-xs uppercase font-bold text-slate-500 block mb-1.5">
                      Subjects Covered:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {batch.subjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] rounded-md shadow-xs"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                    <span className="truncate">{batch.classroom}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Curriculum:</span>
                    </span>
                    <strong className="text-[#0F172A]">Samacheer Kalvi & NCERT Aligned</strong>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-500 block">
                      Monthly Tuition Fee
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-[#0F172A]">
                      ₹{batch.monthlyFee.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-emerald-700 block">
                      All study materials included
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <Link
                      to={getBatchLink(batch.id)}
                      onClick={() => handleSelectBatch(batch)}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-5 py-3 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      <span>Select Batch & Details (Step 4)</span>
                      <ArrowRight className="w-3.5 h-3.5 text-orange-200" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-lg p-6 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-[#0F172A] block">Focus Academy Thoramangalam Guarantee:</span>
            <span>100% No-Questions-Asked Rematch or Refund Guarantee after Session 1.</span>
          </div>

          <Link
            to="/exam-prep"
            className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] shrink-0"
          >
            ← Back to Exam Preparation Goals
          </Link>
        </div>
      </div>
    </div>
  );
}
