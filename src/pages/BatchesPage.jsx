import { usePageMeta } from '../hooks/usePageMeta';
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation, Navigate } from 'react-router-dom';
import { 
  Users, 
  Clock, 
  MapPin, 
  BookOpen, 
  ArrowRight, 
  Edit2, 
  Filter, 
  Bus, 
  ShieldCheck, 
  Calendar,
} from 'lucide-react';
import { BATCHES_DATA, isBatchRecommendedForTrack } from '../data/batchesData';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { BatchService } from '../services/batchService';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow, getStepRedirect, isStep1Complete, isStep2Complete } from '../context/useAppContext';

const CAMPUS_TIMETABLE_ROWS = [
  {
    grade: 'Classes 6 – 8 (Middle)',
    board: 'State Board & CBSE',
    shift: 'Shift 1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Mon – Sat',
    subjects: 'Maths, Science, English Grammar',
    classroom: 'Room 101 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Class 9',
    board: 'TN State Board (Samacheer)',
    shift: 'Shift 1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Mon – Sat',
    subjects: 'Mathematics & Science Foundation',
    classroom: 'Room 102 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Class 9',
    board: 'CBSE Board',
    shift: 'Shift 1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Mon – Sat',
    subjects: 'NCERT Mathematics & Science',
    classroom: 'Room 103 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Class 10',
    board: 'TN State Board (Samacheer)',
    shift: 'Shift 2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Mon – Sat',
    subjects: 'Mathematics & Science (Centum Drills)',
    classroom: 'Room 101 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Class 10',
    board: 'CBSE Board',
    shift: 'Shift 2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Mon – Sat',
    subjects: 'NCERT Standard Maths & Science',
    classroom: 'Room 102 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Class 10',
    board: 'ICSE Board',
    shift: 'Shift 2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Mon – Sat',
    subjects: 'ICSE Mathematics & Physics',
    classroom: 'Room 103 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Class 11',
    board: 'State Board & CBSE',
    shift: 'Shift 2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Mon – Sat',
    subjects: 'Physics, Chemistry, Mathematics',
    classroom: 'Room 102 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Class 12',
    board: 'TN State Board (Samacheer)',
    shift: 'Shift 3',
    timing: '7:30 PM – 9:00 PM',
    days: 'Mon – Sat',
    subjects: 'Physics, Chemistry, Mathematics (Centum Focus)',
    classroom: 'Room 101 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Class 12',
    board: 'CBSE Board',
    shift: 'Shift 3',
    timing: '7:30 PM – 9:00 PM',
    days: 'Mon – Sat',
    subjects: 'NCERT Physics, Chemistry, Maths',
    classroom: 'Room 102 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  },
  {
    grade: 'Classes 11 & 12',
    board: 'NEET / JEE Track',
    shift: 'Shift 3',
    timing: '7:30 PM – 9:00 PM',
    days: 'Mon – Sat',
    subjects: 'Numerical Problem Drills & Shortcuts',
    classroom: 'Room 103 (Thiripura Complex)',
    capacity: 'Strictly 12 Max'
  }
];

export default function BatchesPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isTimingsView = location.pathname === '/timings';
  usePageMeta({
    title: isTimingsView
      ? 'Batch Timings and Evening Schedule (4:30–9 PM) | Focus Academy Perambalur'
      : 'Choose a Batch for Admission | Focus Academy Perambalur',
    description: isTimingsView
      ? 'Evening batch timings for Classes 6–12 at Focus Academy, Thoramangalam: shift slots, days, classroom and strict 12-student batch caps.'
      : 'Select the evening batch that fits your child\'s class, board and school shift to continue the Focus Academy admission.',
    path: isTimingsView ? '/timings' : '/batches',
  });
  const urlSlot = searchParams.get('slot') || 'all';

  const { studentFlow, setStudentFlow } = useStudentFlow();

  const [activeGradeFilter, setActiveGradeFilter] = useState(
    searchParams.get('grade') || studentFlow.grade || 'all'
  );
  const [activeBoardFilter, setActiveBoardFilter] = useState(
    searchParams.get('board') || studentFlow.board || 'all'
  );
  const [selectedSlot, setSelectedSlot] = useState(urlSlot);
  const [batchesList, setBatchesList] = useState(BATCHES_DATA);
  const [availability, setAvailability] = useState({ status: 'loading', stale: false, error: null });

  useEffect(() => {
    let mounted = true;
    BatchService.getBatches().then((result) => {
      if (!mounted) return;
      if (result.status === 'live' && result.batches.length > 0) {
        setBatchesList(result.batches);
        setAvailability({ status: 'live', stale: false, error: null });
      } else if (result.status === 'live') {
        setAvailability({ status: 'live', stale: false, error: null });
      } else {
        setAvailability({ status: 'unavailable', stale: true, error: result.error });
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const redirectPath = getStepRedirect(3, studentFlow, location.pathname);
  if (redirectPath) {
    return <Navigate to={redirectPath} state={{ redirectedFrom: 3 }} replace />;
  }

  const filteredBatches = batchesList.filter((batch) => {
    let matchGrade = true;
    if (activeGradeFilter !== 'all') {
      const g = activeGradeFilter.toLowerCase();
      if (g.includes('6') || g.includes('7') || g.includes('8')) {
        matchGrade = batch.grade.includes('6') || batch.grade.includes('7') || batch.grade.includes('8') || batch.grade.includes('6 to 8') || batch.grade.toLowerCase().includes('middle');
      } else if (g.includes('9')) {
        matchGrade = batch.grade.includes('9');
      } else if (g.includes('10')) {
        matchGrade = batch.grade.includes('10');
      } else if (g.includes('11')) {
        matchGrade = batch.grade.includes('11');
      } else if (g.includes('12')) {
        matchGrade = batch.grade.includes('12');
      } else {
        matchGrade = batch.grade.toLowerCase().includes(g);
      }
    }

    let matchBoard = true;
    if (activeBoardFilter !== 'all') {
      if (activeBoardFilter.includes('State') || activeBoardFilter.includes('Samacheer')) {
        matchBoard = batch.board.includes('State') || batch.board.includes('Samacheer');
      } else if (activeBoardFilter.includes('CBSE')) {
        matchBoard = batch.board.includes('CBSE');
      } else if (activeBoardFilter.includes('ICSE') || activeBoardFilter.includes('ISC')) {
        matchBoard = batch.board.includes('ICSE') || batch.board.includes('ISC');
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

  const prioritizedBatches = [...filteredBatches].sort((a, b) => {
    const aRec = isBatchRecommendedForTrack(a, studentFlow.examPrepId, studentFlow.board, studentFlow.examPrep);
    const bRec = isBatchRecommendedForTrack(b, studentFlow.examPrepId, studentFlow.board, studentFlow.examPrep);
    if (aRec && !bRec) return -1;
    if (!aRec && bRec) return 1;
    return 0;
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
      step: isStep2Done ? Math.max(Number(prev?.step) || 1, 4) : (prev?.step || 1)
    }));
  };

  const getBatchLink = (batch) => {
    if (!isStep1Complete(studentFlow)) {
      return '/student-details';
    }
    if (!isStep2Complete(studentFlow)) {
      return '/exam-prep';
    }
    return `/batch/${batch.id}`;
  };

  const gradeOptions = [
    { id: 'all', label: 'All Classes' },
    { id: 'Class 6', label: 'Classes 6 – 8 (Middle)' },
    { id: 'Class 9', label: 'Class 9' },
    { id: 'Class 10', label: 'Class 10' },
    { id: 'Class 11', label: 'Class 11' },
    { id: 'Class 12', label: 'Class 12' }
  ];

  const boardOptions = [
    { id: 'all', label: 'All Boards' },
    { id: 'TN State Board (Samacheer)', label: 'State Board' },
    { id: 'CBSE Board', label: 'CBSE' },
    { id: 'ICSE Board', label: 'ICSE / ISC' }
  ];

  const slots = [
    { id: 'all', label: 'All Evening Slots (4:30–9 PM)' },
    { id: 'slot-1', label: '4:30 PM – 6:00 PM' },
    { id: 'slot-2', label: '6:00 PM – 7:30 PM' },
    { id: 'slot-3', label: '7:30 PM – 9:00 PM' }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left">
      {!isTimingsView && <StepProgress currentStep={3} />}

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-12">
        {isTimingsView ? (
          <div className="space-y-10">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                  Batch Timings & Schedule
                </h1>
                <div className="inline-flex items-center space-x-2 text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full self-start sm:self-auto shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-emerald-800">Campus Hours: Mon – Sat (4:30 PM – 9:00 PM)</span>
                </div>
              </div>
                <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
                  All evening batches run Monday to Saturday between 4:30 PM and 9:00 PM at Thiripura Complex, Thoramangalam. Every batch has a strict 12-student cap, with timings synchronized with town and school bus arrivals from Four Roads and Trichy Main Road.
                </p>

                <div className="mt-6 grid sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs">
                    <div className="text-xs font-bold text-brand uppercase tracking-wide">Shift 1 (Evening)</div>
                    <div className="text-lg font-extrabold text-[#0F172A] mt-1">4:30 PM – 6:00 PM</div>
                    <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Classes 6–8 Foundation & Class 9. Synchronized with early school bus arrivals from Four Roads.
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Room 101 & 102</span>
                      <span className="font-bold text-emerald-700">Max 12 Students</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs">
                    <div className="text-xs font-bold text-brand uppercase tracking-wide">Shift 2 (Evening)</div>
                    <div className="text-lg font-extrabold text-[#0F172A] mt-1">6:00 PM – 7:30 PM</div>
                    <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Class 10 Board Distinction & Class 11 Core Science & Maths batches. Timed for town bus arrivals.
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Room 101, 102 & 103</span>
                      <span className="font-bold text-emerald-700">Max 12 Students</span>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs">
                    <div className="text-xs font-bold text-brand uppercase tracking-wide">Shift 3 (Night)</div>
                    <div className="text-lg font-extrabold text-[#0F172A] mt-1">7:30 PM – 9:00 PM</div>
                    <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Class 12 Higher Secondary Mastery & Intensive Board / Competitive prep. Safe night dispersal.
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Room 102 & 103</span>
                      <span className="font-bold text-emerald-700">Max 12 Students</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3.5 bg-orange-50/80 rounded-md border border-orange-200 text-xs text-orange-950 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-brand">Seat Reservation:</span>
                    <span>Reserve your seat in any scheduled evening slot with zero advance registration fee. Seats are opened from the admission link below.</span>
                  </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                    Campus Master Timetable & Batch Allocations
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Thiripura Complex, Thoramangalam • Monday through Saturday Academic Schedule
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-md border border-emerald-200">
                    Strict 1:12 Faculty Mentorship
                  </span>
                </div>
              </div>

              <div
                role="region"
                aria-label="Batch timetable table — scroll horizontally for all columns"
                tabIndex={0}
                className="overflow-x-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand rounded-md"
              >
                <table className="w-full text-xs text-left text-[#0F172A]">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-[#E2E8F0]">
                    <tr>
                      <th scope="col" className="py-3.5 px-4 sm:px-6">Standard / Class</th>
                      <th scope="col" className="py-3.5 px-4">Board</th>
                      <th scope="col" className="py-3.5 px-4">Shift & Slot</th>
                      <th scope="col" className="py-3.5 px-4">Days</th>
                      <th scope="col" className="py-3.5 px-4">Subjects Covered</th>
                      <th scope="col" className="py-3.5 px-4">Classroom</th>
                      <th scope="col" className="py-3.5 px-4 text-right">Batch Cap</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CAMPUS_TIMETABLE_ROWS.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80 transition-colors' : 'bg-slate-50/40 hover:bg-slate-50 transition-colors'}
                      >
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-[#0F172A] whitespace-nowrap">
                          {row.grade}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                            {row.board}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-brand whitespace-nowrap">
                          <span className="block text-[11px] text-slate-500 font-normal">{row.shift}</span>
                          <span>{row.timing}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {row.days}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {row.subjects}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap flex items-center space-x-1 pt-4">
                          <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                          <span>{row.classroom}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                            {row.capacity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-brand uppercase tracking-wide">
                  <Bus className="w-4 h-4 text-brand" />
                  <span>Four Roads & Trichy Transit</span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Bus Route Synchronization</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our Thoramangalam campus is 2 minutes from Four Roads junction. Shifts begin at 4:30 PM, giving students arriving from Perambalur town and school buses comfortable refreshment time.
                </p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-brand uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  <span>Safety & Facilities</span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Secure Monitored Classrooms</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  CCTV monitored corridors, dedicated female and male rest facilities, filtered RO drinking water, and safe night dismissals under faculty supervision.
                </p>
              </div>

              <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-brand uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-brand" />
                  <span>Transparent Evaluation</span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Transparent Evaluation Policy</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Parents and students receive complete clarity on batch timings, curriculum coverage, and faculty guidance before enrollment. Experience the 12-student focus firsthand.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center space-x-2 text-xs font-bold text-brand uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-brand"></span>
                  <span>Sequential 5-Step Admission Funnel</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                  Ready to Reserve a Seat in an Evening Batch?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  To preserve individual learning attention and maintain our strict 12-seat capacity, all applicants must follow our stepwise admission: Step 1 (Student Details) &rarr; Step 2 (Exam Goals) &rarr; Step 3 (Batch Selection) &rarr; Step 4 (Review) &rarr; Step 5 (Enrollment).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                <Link
                  to="/contact"
                  className="px-5 py-3 text-xs font-bold text-slate-700 hover:text-[#0F172A] bg-slate-50 hover:bg-slate-100 rounded-md border border-[#E2E8F0] transition-colors text-center"
                >
                  Contact Campus Desk
                </Link>
                <Link
                  to="/student-details"
                  className="px-6 py-3 text-xs font-bold text-white bg-brand hover:bg-brand-strong rounded-md shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Begin Admission at Step 1: Student Details →</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 bg-white p-4 sm:p-5 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-brand">Step 3 of 5</span>
                  <span>•</span>
                  {studentFlow.studentName ? (
                    <>
                      <span>Student: <strong className="text-[#0F172A]">{studentFlow.studentName}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-brand">{studentFlow.examPrep || 'Academic Excellence'}</strong></span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-[#0F172A]">Thoramangalam Campus Evening Schedule</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">Strict 1:12 Batch Cap</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {studentFlow.studentName
                    ? 'Showing matching small-batches at Thiripura Complex, Thoramangalam.'
                    : 'Browse available evening batches (4:30 PM – 9:00 PM) at Thiripura Complex, Thoramangalam.'}
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                {studentFlow.studentName ? (
                  <>
                    <Link
                      to="/student-details"
                      className="inline-flex items-center space-x-1 text-slate-600 hover:text-brand px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-slate-50"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Change Class/Board</span>
                    </Link>

                    <Link
                      to="/exam-prep"
                      className="inline-flex items-center space-x-1 text-slate-600 hover:text-brand px-3 py-1.5 rounded-md border border-[#E2E8F0] bg-slate-50"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Change Goal</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/student-details"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-strong px-3.5 py-2 rounded-md shadow-xs transition-colors"
                  >
                    <span>Personalize for My Child (Step 1) →</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                Available Evening Batches
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                All batches run Monday to Saturday between 4:30 PM and 9:00 PM with a strict 12-student cap. Timings are synchronized with local school buses arriving via Four Roads and Trichy Main Road so students arrive refreshed.
              </p>
              <div className="mt-3 p-3 bg-orange-50/80 rounded-md border border-orange-200 text-xs text-orange-950 inline-flex items-center space-x-2">
                <span className="font-bold text-brand">Zero Registration Fee:</span>
                <span>Reserve an evening batch slot with strict 12-student cap. Zero advance fee.</span>
              </div>
            </div>

            <div 
              data-testid="batches-filter-bar"
              className="sticky top-[108px] sm:top-28 z-20 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-lg border border-[#E2E8F0] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 overflow-hidden w-full md:w-auto">
                <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar touch-pan-x scroll-smooth w-full sm:w-auto py-0.5">
                  <span className="text-xs uppercase font-bold text-slate-500 mr-1 shrink-0 flex items-center space-x-1">
                    <Filter className="w-3 h-3 text-brand" />
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
                          ? 'bg-brand text-white shadow-xs'
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
                  {prioritizedBatches.length} {prioritizedBatches.length === 1 ? 'Batch' : 'Batches'}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {prioritizedBatches.map((batch) => {
                const isRecommended = isBatchRecommendedForTrack(
                  batch,
                  studentFlow.examPrepId,
                  studentFlow.board,
                  studentFlow.examPrep
                );
                return (
                  <div
                    key={batch.id}
                    className={`bg-white rounded-lg p-6 sm:p-7 border ${
                      isRecommended
                        ? 'border-brand ring-1 ring-brand/20 shadow-sm'
                        : 'border-[#E2E8F0] shadow-xs'
                    } flex flex-col justify-between hover:border-brand/40 transition-all`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 bg-[#0F172A] text-white rounded-md text-xs uppercase font-bold">
                            {batch.grade} • {batch.board}
                          </span>

                          {isRecommended && (
                            <span className="px-2.5 py-1 bg-orange-100 text-brand border border-orange-200 rounded-md text-xs font-bold flex items-center space-x-1">
                              <span>Recommended for Your Track</span>
                            </span>
                          )}
                        </div>

                        <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-xs font-bold">
                          {batch.status}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#0F172A] leading-snug">
                        {batch.name}
                      </h3>

                      <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-md border border-[#E2E8F0]">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-brand shrink-0" />
                          <div>
                            <span className="font-bold text-[#0F172A] block">{batch.timing}</span>
                            <span className="text-slate-500 text-xs">{batch.days}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-brand shrink-0" />
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
                        <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span className="truncate">{batch.classroom}</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-brand" />
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
                          to={getBatchLink(batch)}
                          onClick={() => handleSelectBatch(batch)}
                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-5 py-3 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer active:scale-98"
                        >
                          <span>{isTimingsView && !isStep1Complete(studentFlow) ? 'Enroll (Start at Step 1)' : 'Select Batch & Details (Step 4)'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-orange-100" />
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
        )}
      </div>
    </div>
  );
}
