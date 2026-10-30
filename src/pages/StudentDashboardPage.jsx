import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  MapPin, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  CreditCard, 
  Edit3, 
  Save, 
  RefreshCw,
  Award,
  Receipt,
  Download,
  Bell,
  Key,
  Printer,
  FileText,
  BarChart3,
  HelpCircle,
  Send,
  Users,
  Plus,
  X
} from 'lucide-react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { useStudentFlow } from '../context/useAppContext';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { 
  buildReceiptHtml, 
  buildAdmissionSlipHtml, 
  buildReportCardHtml, 
  buildStudySheetHtml, 
  openPrintableDocument 
} from '../utils/printableDocuments';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user, profile, logout, updateProfile, refreshProfile, resetPassword } = useStudentAuth();
  const { studentFlow } = useStudentFlow();

  const [activeTab, setActiveTab] = useState('enrollments');
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [enrollmentError, setEnrollmentError] = useState('');

  const [financials, setFinancials] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(true);
  const [financialsError, setFinancialsError] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editBoard, setEditBoard] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [sendingPasswordReset, setSendingPasswordReset] = useState(false);

  const [siblings, setSiblings] = useState([]);
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [lastSyncedTime, setLastSyncedTime] = useState(new Date());
  const [showLinkSiblingModal, setShowLinkSiblingModal] = useState(false);
  const [linkSiblingIdInput, setLinkSiblingIdInput] = useState('');
  const [linkSiblingError, setLinkSiblingError] = useState('');
  const [linkSiblingSuccess, setLinkSiblingSuccess] = useState('');

  const linkSiblingModalRef = React.useRef(null);
  useFocusTrap(linkSiblingModalRef, showLinkSiblingModal);

  const [doubts, setDoubts] = useState(() => (Array.isArray(profile?.doubts) ? profile.doubts : []));
  const [newDoubtSubject, setNewDoubtSubject] = useState('Physics');
  const [newDoubtTopic, setNewDoubtTopic] = useState('');
  const [newDoubtQuestion, setNewDoubtQuestion] = useState('');
  const [doubtSubmitted, setDoubtSubmitted] = useState(false);

  const academicRecords = Array.isArray(financials?.student?.assessments) ? financials.student.assessments : [];
  const attendanceRecords = Array.isArray(financials?.student?.attendance) ? financials.student.attendance : [];
  const attendancePresentCount = attendanceRecords.filter((a) => a.status === 'present').length;
  const attendanceRate = attendanceRecords.length > 0
    ? `${Math.round((attendancePresentCount / attendanceRecords.length) * 100)}%`
    : 'Not Recorded';

  const cumulativeAvg = academicRecords.length > 0
    ? `${Math.round(academicRecords.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / academicRecords.length)}%`
    : 'Not Evaluated';

  const studySheets = [
    {
      id: 'mat-1',
      title: 'Class 10 & 12 Mathematics — Tamil Nadu State Board (Samacheer) & CBSE Framework',
      subject: 'Mathematics',
      grade: 'Classes 10 & 12',
      summary: 'Focus Academy curriculum structure covering Board exam problem units, formula memory chains, and step-wise marking schemes.',
      points: [
        'Relations, Functions & Matrices: Composition properties, inverse matrices, and row operations.',
        'Differential & Integral Calculus: Limits, continuity, derivatives, and standard integrals.',
        'Coordinate Geometry & Vectors: Straight lines, planes, dot product, and cross product applications.',
        'Statistics & Probability: Variance, standard deviation, and conditional probability distributions.'
      ]
    },
    {
      id: 'mat-2',
      title: 'Class 11 & 12 Physics — Core Concepts & Numerical Blueprint',
      subject: 'Physics',
      grade: 'Classes 11 & 12',
      summary: 'Essential definitions, derivations, SI units, and circuit diagram techniques for evening coaching batches.',
      points: [
        'Electrostatics & Capacitance: Field equations, potential due to dipole, and capacitance combinations.',
        'Current Electricity & Magnetism: Kirchhoff laws, potentiometer, and moving coil galvanometer principles.',
        'Wave & Ray Optics: Reflection, refraction at spherical surfaces, and interference conditions.',
        'Modern Physics: Photoelectric effect, de Broglie relation, and semiconductor diode characteristics.'
      ]
    },
    {
      id: 'mat-3',
      title: 'Class 11 & 12 Chemistry — Reaction Mechanisms & Numerical Problem Guide',
      subject: 'Chemistry',
      grade: 'Classes 11 & 12',
      summary: 'Inorganic reaction equations, physical chemistry numerical steps, and organic functional group conversions.',
      points: [
        'Physical Chemistry: Nernst equation, rate laws, order of reaction, and Raoult law calculations.',
        'Inorganic Chemistry: d- and f-block transition metals, coordination compounds, and crystal field theory.',
        'Organic Chemistry: Reaction pathways for alcohols, phenols, aldehydes, carboxylic acids, and amines.',
        'Practical Examination Guidelines: Salt analysis scheme, volumetric titration calculations, and record verification.'
      ]
    },
    {
      id: 'mat-4',
      title: 'Focus Academy Thoramangalam — Academic Session Code & Evening Batch Schedule',
      subject: 'Institutional Guide',
      grade: 'Classes 6 to 12',
      summary: 'Campus timing standards, 1:12 faculty mentorship ratio, workbook issuance protocols, and monthly parent feedback cycles.',
      points: [
        'Classroom Mentorship: Maximum 12 students per batch to guarantee individual problem-solving supervision.',
        'Session Timings: Evening blocks (4:30 PM – 9:00 PM) at Thiripura Complex, Main Road, Thoramangalam.',
        'Daily Practice Worksheets: Completed worksheets filed in the student portfolio and checked daily.',
        'Parent Consultation Desk: Monthly progress reviews and immediate absence alert notifications.'
      ]
    }
  ];

  useEffect(() => {
    document.title = 'Student Dashboard | Focus Academy';
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.studentName || user?.displayName || '');
      setEditMobile(profile.mobile || '');
      setEditParentName(profile.parentName || '');
      setEditParentPhone(profile.parentPhone || '');
      setEditGrade(profile.grade || 'Class 10');
      setEditBoard(profile.board || 'TN State Board (Samacheer)');
    }
  }, [profile, user]);

  const fetchPortalData = useCallback(async (targetStudentId = null) => {
    if (!user) return;
    setLoadingEnrollments(true);
    setLoadingFinancials(true);
    setEnrollmentError('');
    setFinancialsError('');

    try {
      const token = await user.getIdToken();
      const effectiveStudentId = targetStudentId || activeStudentId;
      const url = effectiveStudentId
        ? `/api/student-portal?studentId=${encodeURIComponent(effectiveStudentId)}`
        : '/api/student-portal';

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || 'The campus database could not be reached. No figures are shown until the authoritative ledger loads.');
      }

      if (Array.isArray(payload.siblings) && payload.siblings.length > 0) {
        setSiblings(payload.siblings);
        if (!effectiveStudentId && payload.student?.id) {
          setActiveStudentId(payload.student.id);
        }
      } else if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('focus_academy_admin_data_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            const parentPhone = profile?.parentPhone || profile?.mobile || payload.student?.guardianPhone;
            if (parentPhone && Array.isArray(parsed.students)) {
              const cleanParent = String(parentPhone).replace(/\D/g, '').slice(-10);
              const matched = parsed.students.filter(s =>
                String(s.guardianPhone || '').replace(/\D/g, '').slice(-10) === cleanParent
              );
              if (matched.length > 0) {
                setSiblings(matched.map(s => ({
                  id: s.id,
                  studentName: s.studentName,
                  grade: s.grade,
                  board: s.board,
                  batchName: s.batchName,
                  status: s.status
                })));
              }
            }
          }
        } catch {}
      }

      const rows = (payload.enrollments || []).map((row) => ({
        id: row.id,
        studentName: row.studentName,
        batchId: row.batchId,
        batchName: row.batchName || row.subjects || 'Focus Evening Batch',
        timing: row.timing || 'Evening Session',
        grade: row.grade,
        board: row.board,
        status: row.status,
        reservationId: row.reservationId,
        enrolledAt: row.enrolledAt || row.createdAt || null,
        source: 'central_record',
        details: row
      }));
      setEnrollments(rows);

      if (!payload.linked) {
        setFinancials({
          linked: false,
          reason: payload.reason,
          studentId: null,
          enrollmentId: rows[0]?.id || null
        });
        return;
      }

      const fee = payload.fee || {};
      const billing = payload.billing || {};
      setFinancials({
        linked: true,
        studentId: payload.student?.id || null,
        studentName: payload.student?.studentName || profile?.studentName || user.displayName || 'Student',
        admissionId: rows[0]?.id || payload.student?.enrollmentId || null,
        admissionStatus: payload.student?.admissionStatus || null,
        batchName: payload.student?.batchName || rows[0]?.batchName || null,
        batchTiming: rows[0]?.timing || null,
        monthlyFee: Number(billing.amountPerCycle || rows[0]?.monthlyFee || 0),
        billingFrequency: billing.frequency || 'monthly',
        totalFeesCharged: Number(fee.totalCharged || 0),
        totalAmountPaid: Number(fee.totalPaid || 0),
        totalWaived: Number(fee.totalWaived || 0),
        balance: Number(fee.outstanding || 0),
        overdueAmount: Number(fee.overdueAmount || 0),
        status: fee.status || 'pending',
        paymentStatus: fee.paymentStatus || 'unpaid',
        isOverdue: Boolean(fee.isOverdue),
        nextDueDate: fee.dueDate || null,
        nextDueDateFormatted: fee.dueDate || 'Not scheduled',
        scheduleExplanation: fee.explanation || null,
        obligations: payload.obligations || [],
        payments: payload.payments || [],
        student: payload.student || null,
        syncedAt: payload.syncedAt
      });
      if (Array.isArray(payload.student?.doubts)) {
        setDoubts(payload.student.doubts);
      }
      setLastSyncedTime(new Date());
    } catch (err) {
      const message = err?.message || 'Could not load your admission records from the campus database.';
      setEnrollmentError(message);
      setFinancialsError(message);
      setFinancials(null);
    } finally {
      setLoadingEnrollments(false);
      setLoadingFinancials(false);
    }
  }, [user, profile, activeStudentId]);

  const fetchFinancials = fetchPortalData;

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  useEffect(() => {
    let bc;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('focus_academy_sync_bus_v1');
        bc.onmessage = (event) => {
          if (['STORE_UPDATED', 'PAYMENT_RECORDED', 'DOUBT_UPDATED', 'STORAGE_SYNC', 'RECONCILIATION_COMPLETED'].includes(event?.data?.type)) {
            fetchPortalData(activeStudentId);
          }
        };
      }
    } catch (e) {
      console.warn('Real-time sync broadcast unavailable:', e);
    }

    const handleCustomSync = () => {
      fetchPortalData(activeStudentId);
    };

    const handleStorageEvent = (e) => {
      if (e.key?.startsWith('focus_academy_')) {
        fetchPortalData(activeStudentId);
      }
    };

    window.addEventListener('focus-academy:sync', handleCustomSync);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('focus-academy:sync', handleCustomSync);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [fetchPortalData, activeStudentId]);

  const handleSwitchSibling = (siblingId) => {
    setActiveStudentId(siblingId);
    fetchPortalData(siblingId);
  };

  const handleLinkSibling = (e) => {
    e.preventDefault();
    if (!linkSiblingIdInput.trim()) return;
    setLinkSiblingError('');
    setLinkSiblingSuccess('');
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('focus_academy_admin_data_v1') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        const match = (parsed.students || []).find(s =>
          String(s.id).toLowerCase() === linkSiblingIdInput.trim().toLowerCase() ||
          String(s.studentName).toLowerCase() === linkSiblingIdInput.trim().toLowerCase()
        );
        if (match) {
          setSiblings(prev => {
            if (prev.some(s => s.id === match.id)) return prev;
            return [...prev, {
              id: match.id,
              studentName: match.studentName,
              grade: match.grade,
              board: match.board,
              batchName: match.batchName,
              status: match.status
            }];
          });
          setLinkSiblingSuccess(`Linked ${match.studentName} (${match.grade}) to household.`);
          setLinkSiblingIdInput('');
          setTimeout(() => setShowLinkSiblingModal(false), 1200);
          return;
        }
      }
      setLinkSiblingError('Student ID not found in campus directory. Please confirm with reception.');
    } catch {
      setLinkSiblingError('Could not process sibling link.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    setSavingProfile(true);

    try {
      await updateProfile({
        studentName: editName.trim(),
        mobile: editMobile.trim(),
        parentName: editParentName.trim(),
        parentPhone: editParentPhone.trim(),
        grade: editGrade,
        board: editBoard,
      });
      setProfileSuccessMsg('Profile details successfully updated.');
      setIsEditingProfile(false);
      await refreshProfile();
    } catch (err) {
      setProfileErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setSendingPasswordReset(true);
    try {
      await resetPassword(user.email);
      setPasswordResetSent(true);
    } catch (err) {
      setProfileErrorMsg(err?.message || 'Failed to send password reset email.');
    } finally {
      setSendingPasswordReset(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const studentDisplayName = profile?.studentName || user?.displayName || 'Student';
  const studentGrade = profile?.grade || 'Class 10';
  const studentBoard = profile?.board || 'TN State Board (Samacheer)';
  const studentSlipId = financials?.studentId || 'Student ID pending';

  const hasIncompleteFunnel = studentFlow && studentFlow.step >= 2 && studentFlow.step < 5 && studentFlow.selectedBatchId;

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="bg-[#0F172A] p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                  {studentDisplayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      {studentDisplayName}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Verified Student
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-2">
                    <span>{studentGrade}</span>
                    <span>•</span>
                    <span>{studentBoard}</span>
                    <span>•</span>
                    <span className="font-mono text-orange-300">{studentSlipId}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/batches"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Browse Batches</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-300 font-semibold tracking-wide">
                  Live Real-Time Sync Active
                </span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  • Connected to push event bus • Synchronized at {lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => fetchPortalData(activeStudentId)}
                className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Force refresh student ledger and doubts"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingFinancials ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>

            <div className="mt-4 p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="font-bold text-slate-200">
                  Household Sibling Switcher:
                </span>
                <span className="text-slate-400 text-[11px]">
                  ({siblings.length > 1 ? `${siblings.length} Children Enrolled` : '1 Child Enrolled'})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {siblings.map((sib) => {
                  const isCurrent = (financials?.studentId || financials?.student?.id || activeStudentId) === sib.id;
                  return (
                    <button
                      key={sib.id}
                      type="button"
                      onClick={() => handleSwitchSibling(sib.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-brand text-white shadow-xs ring-2 ring-brand-light/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>{sib.studentName}</span>
                      <span className="text-[10px] opacity-80">({sib.grade})</span>
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowLinkSiblingModal(true)}
                  className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-orange-300 hover:text-orange-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Link Sibling</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
              <div>
                <p className="text-slate-400">Campus</p>
                <p className="font-bold text-white mt-0.5">Thoramangalam, Perambalur</p>
              </div>
              <div>
                <p className="text-slate-400">Classroom Ratio</p>
                <p className="font-bold text-orange-300 mt-0.5">1:12 Max Capacity</p>
              </div>
              <div>
                <p className="text-slate-400">Batch Timing</p>
                <p className="font-bold text-white mt-0.5">Mon–Sat Evening</p>
              </div>
              <div>
                <p className="text-slate-400">Academic Year</p>
                <p className="font-bold text-emerald-400 mt-0.5">2025–2026 Session</p>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50/50 px-4 sm:px-8 flex overflow-x-auto gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('enrollments')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'enrollments'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>My Courses & Batches</span>
              {enrollments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-brand text-[10px] font-bold">
                  {enrollments.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'schedule'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>My Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fees')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'fees'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Fee Counter & Slips</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'profile'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Student Profile</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'notifications'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guidelines')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'guidelines'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Campus Guidelines</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('academics')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'academics'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Test Marks & Progress</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('doubts')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'doubts'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ask Tutors & Doubts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                activeTab === 'materials'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Study Materials & Question Vault</span>
            </button>
          </div>
        </div>

        {hasIncompleteFunnel && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-900">
                  You have an incomplete admission registration
                </h2>
                <p className="text-xs text-amber-700 mt-0.5">
                  You previously started admission for batch: <strong>{studentFlow.selectedBatchName || 'Focus Evening Batch'}</strong>. Complete step {studentFlow.step} to lock your classroom seat.
                </p>
              </div>
            </div>
            <Link
              to="/enroll"
              className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
            >
              <span>Resume Admission</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172A]">
                  My Admissions & Batch Enrollments
                </h2>
                <p className="text-xs text-slate-500">
                  View your classroom seat reservations, timing slips, and confirmation status.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchPortalData}
                disabled={loadingEnrollments}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingEnrollments ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {enrollmentError && (
              <div role="alert" className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{enrollmentError}</span>
              </div>
            )}

            {loadingEnrollments ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500">
                  Retrieving your admission records from Focus Academy...
                </p>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
                <div className="w-14 h-14 bg-orange-50 text-brand rounded-2xl flex items-center justify-center mx-auto">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">No Active Enrollments Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    You have not registered for an evening batch yet. Explore our Class 8–12 batches and reserve your seat under our 12-student capacity limit.
                  </p>
                </div>
                <Link
                  to="/batches"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <span>Browse Available Batches</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.map((enr) => {
                  const slipDate = enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'Active';

                  const whatsappPreText = `Hello Focus Academy! I am inquiring regarding my admission registration for ${enr.batchName || 'Evening Batch'} (Slip: ${enr.id}). Student: ${studentDisplayName}.`;
                  const waUrl = `https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(whatsappPreText)}`;

                  return (
                    <div 
                      key={enr.id} 
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 hover:border-orange-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-brand border border-orange-200 mb-1.5">
                            {enr.grade || studentGrade} • {enr.board || 'Samacheer'}
                          </span>
                          <h3 className="text-base font-extrabold text-[#0F172A] leading-snug">
                            {enr.batchName || enr.subjects || 'Focus Academy Evening Batch'}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmed</span>
                        </span>
                      </div>

                      <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-brand" />
                            <span>Batch Timing:</span>
                          </span>
                          <span className="font-bold text-[#0F172A]">{enr.timing || 'Evening Session (4:30 PM – 9:00 PM)'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Campus Desk:</span>
                          </span>
                          <span className="font-semibold text-slate-800">Thiripura Complex, Thoramangalam</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Registration Date:</span>
                          </span>
                          <span className="font-mono text-slate-700">{slipDate}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Admission Slip ID:</span>
                          <span className="font-mono font-bold text-brand">{enr.id}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            openPrintableDocument(buildAdmissionSlipHtml({
                              ...enr,
                              admissionId: enr.id,
                              studentName: profile?.studentName || studentFlow.studentName || 'Student',
                              studentId: enr.studentId || profile?.studentId || 'Pending assignment',
                              grade: enr.grade || profile?.grade,
                              board: enr.board || profile?.board,
                              batchName: enr.batchName || enr.subjects,
                              timing: enr.timing,
                              contact: profile?.mobile || profile?.parentPhone
                            }));
                          }}
                          className="py-2 px-3 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Slip</span>
                        </button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Desk</span>
                        </a>
                        <Link
                          to={`/batch/${enr.batchId || ''}`}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <span>Batch Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-[#0F172A]">
                  Student Academic Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Keep your academic stream, contact numbers, and parent details up to date.
                </p>
              </div>

              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {profileSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Student Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Student Mobile Phone
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Academic Class
                    </label>
                    <select
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand"
                    >
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                      <option value="Repeater / Dropper">Repeater / Dropper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Curriculum Board
                    </label>
                    <select
                      value={editBoard}
                      onChange={(e) => setEditBoard(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand"
                    >
                      <option value="TN State Board (Samacheer)">TN State Board (Samacheer)</option>
                      <option value="CBSE Board">CBSE Board</option>
                      <option value="ICSE Board">ICSE Board</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Parent / Guardian Name
                    </label>
                    <input
                      type="text"
                      value={editParentName}
                      onChange={(e) => setEditParentName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Parent Contact Phone
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={editParentPhone}
                      onChange={(e) => setEditParentPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-brand hover:bg-brand-strong text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Registered Email Address</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{user?.email || 'Not provided'}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Student Mobile Number</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{profile?.mobile || 'Not provided'}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Enrolled Academic Class</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{studentGrade}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Curriculum Board</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{studentBoard}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Parent / Guardian Name</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{profile?.parentName || 'Not recorded'}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block font-medium">Parent Contact Phone</span>
                    <span className="font-bold text-slate-800 text-sm mt-0.5 block">{profile?.parentPhone || 'Not recorded'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-200 space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Key className="w-4 h-4 text-brand" />
                <span>Account Security & Password Management</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Reset Account Password</span>
                  <span className="text-slate-500 block mt-0.5">
                    We will send a secure password reset link to your registered email: <strong>{user?.email}</strong>
                  </span>
                </div>
                {passwordResetSent ? (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reset Link Sent! Check Email</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendPasswordReset}
                    disabled={sendingPasswordReset}
                    className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    {sendingPasswordReset ? 'Sending...' : 'Send Password Reset Link'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#0F172A]">
                Class Schedule & Classroom Timings
              </h2>
              <p className="text-xs text-slate-500">
                Official evening session timetable for your enrolled courses at Thiripura Complex.
              </p>
            </div>

            {enrollments.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-[#0F172A]">No Active Class Schedule</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your personalized class schedule will appear here after you enroll in an evening tuition batch.
                </p>
                <Link
                  to="/batches"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl"
                >
                  Browse Available Batches →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enr) => (
                  <div key={enr.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                          {enr.grade || studentGrade} • {enr.board || studentBoard}
                        </span>
                        <h3 className="text-base font-extrabold text-[#0F172A] mt-1">{enr.batchName}</h3>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-xl w-fit">
                        {enr.timing || 'Evening Session (4:30 PM – 9:00 PM)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block font-medium">Days & Frequency</span>
                        <span className="font-bold text-slate-900 mt-1 block">Monday – Saturday</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">6 days / week coaching</span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block font-medium">Classroom & Center</span>
                        <span className="font-bold text-slate-900 mt-1 block">Thiripura Complex</span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Thoramangalam, Perambalur</span>
                      </div>
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                        <span className="text-slate-400 block font-medium">Classroom Policy</span>
                        <span className="font-bold text-slate-900 mt-1 block">1:12 Max Ratio</span>
                        <span className="text-[11px] text-orange-600 font-semibold mt-0.5 block">Personalized attention</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#0F172A]">
                Student Notifications & Academy Bulletins
              </h2>
              <p className="text-xs text-slate-500">
                Official notices and admission updates for {studentDisplayName}.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-950">Student Admission Confirmed</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                      {studentSlipId}
                    </span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed">
                    Your student record is verified in the Focus Academy registry. Classroom materials and syllabus blueprints are prepared for your assigned evening batch.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 text-xs">
                <Clock className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-900">Attendance & Punctuality Reminder</span>
                  <p className="text-slate-600 leading-relaxed">
                    Evening batches commence promptly as scheduled. Students are requested to be present 10 minutes prior to session start at Thiripura Complex, Thoramangalam.
                  </p>
                </div>
              </div>

              {financials && Number(financials.balance || 0) > 0 && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3 text-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-950">Fee Cycle Due Notice</span>
                    <p className="text-amber-900 leading-relaxed">
                      Upcoming tuition fee cycle: ₹{Number(financials.balance).toLocaleString('en-IN')}. Due date: {financials.nextDueDateFormatted || 'Upcoming'}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'guidelines' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#0F172A]">
                Focus Academy Classroom Discipline & Schedule Code
              </h2>
              <p className="text-xs text-slate-500">
                Standards enforced across all evening batches at Thiripura Complex, Thoramangalam.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-orange-950">
                  <Award className="w-4 h-4 text-brand" />
                  <span>12-Student Strict Batch Cap</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Every classroom batch is capped at 12 seats to ensure individual problem-solving supervision and daily question paper reviews.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span>Punctuality & Arrival Time</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Students must arrive 10 minutes prior to their batch start time. Evening batches run strictly within their designated 60-to-90 minute time blocks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <BookOpen className="w-4 h-4 text-slate-700" />
                  <span>Notebooks & Study Materials</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Printed worksheets and blueprints provided by Focus Academy must be filed in the student portfolio. Daily homework completion is verified before session start.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Phone className="w-4 h-4 text-slate-700" />
                  <span>Absence Notification</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  In case of sickness or school examination clashes, parents must inform the campus desk via WhatsApp at least 2 hours in advance to schedule revision notes.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">Campus Location</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  Thiripura Complex, Main Road (via Four Roads), Near Malar Hospital, Thoramangalam, Perambalur – 621220.
                </p>
              </div>
              <a
                href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
                className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold text-xs rounded-xl whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                Call Campus Desk
              </a>
            </div>
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-[#0F172A]">
                    Tuition Fee Schedule & Payment Ledger
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Official Student Ledger
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Authoritative fee schedule, verified receipts, and next due date synced directly from campus records.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchFinancials}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Ledger</span>
                </button>
              </div>
            </div>

            {loadingFinancials ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                <p className="text-xs font-semibold">Loading verified campus financial records...</p>
              </div>
            ) : financialsError ? (
              <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {financialsError}
              </div>
            ) : financials && financials.linked === false ? (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Fee ledger pending synchronization</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {financials.reason === 'name_mismatch' || financials.reason === 'ambiguous_student_record'
                    ? 'Your account mobile number matches more than one academy record, so no ledger is shown. Ask the campus desk to link your student ID to this account.'
                    : financials.reason === 'account_mismatch'
                      ? 'The academy record for this mobile number is already linked to another account. Please contact the campus desk for help.'
                      : 'No fee ledger is linked to this account yet. It will appear here after the campus desk completes your admission and links your student record. No amounts are estimated.'}
                </p>
                <a
                  href={`https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent('Hello Focus Academy, my student portal does not show my fee ledger yet. Please link my admission record.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-lg"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask the Campus Desk</span>
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block font-medium">Monthly Tuition Fee</span>
                    <span className="font-extrabold text-[#0F172A] text-lg font-mono mt-1 block">
                      ₹{Number(financials?.monthlyFee || 0).toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/{financials?.billingFrequency === 'monthly' ? 'mo' : financials?.billingFrequency || 'cycle'}</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">{financials?.batchName || 'Batch not assigned yet'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block font-medium">Total Fees Billed</span>
                <span className="font-extrabold text-[#0F172A] text-lg font-mono mt-1 block">
                  ₹{Number(financials?.totalFeesCharged || 0).toLocaleString('en-IN')}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">Current academic session</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <span className="text-emerald-700 block font-medium">Total Amount Paid</span>
                <span className="font-extrabold text-emerald-900 text-lg font-mono mt-1 block">
                  ₹{Number(financials?.totalAmountPaid || 0).toLocaleString('en-IN')}
                </span>
                <p className="text-[11px] text-emerald-700 mt-1">Verified campus receipts</p>
              </div>

              <div className={`p-4 rounded-xl border ${
                (financials?.balance || 0) > 0 
                  ? (financials?.isOverdue ? 'bg-rose-50/70 border-rose-200' : 'bg-amber-50/70 border-amber-200')
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`block font-medium ${
                  (financials?.balance || 0) > 0 
                    ? (financials?.isOverdue ? 'text-rose-700' : 'text-amber-800') 
                    : 'text-slate-400'
                }`}>
                  Outstanding Balance
                </span>
                <span className={`font-extrabold text-lg font-mono mt-1 block ${
                  (financials?.balance || 0) > 0 
                    ? (financials?.isOverdue ? 'text-rose-900' : 'text-amber-900') 
                    : 'text-slate-800'
                }`}>
                  ₹{Number(financials?.balance || 0).toLocaleString('en-IN')}
                </span>
                <p className={`text-[11px] mt-1 font-semibold ${
                  (financials?.balance || 0) > 0 
                    ? (financials?.isOverdue ? 'text-rose-700' : 'text-amber-700') 
                    : 'text-emerald-700'
                }`}>
                  {(financials?.balance || 0) > 0 
                    ? (financials?.isOverdue ? 'Overdue - Action Required' : 'Payment Due') 
                    : 'Fully Settled'}
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              financials?.isOverdue
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : (financials?.balance || 0) > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-start sm:items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-inherit shrink-0">
                  <Calendar className="w-5 h-5 text-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider">Next Payment Due Date:</span>
                    <span className="font-extrabold text-sm font-mono">
                      {financials?.nextDueDateFormatted || 'Not scheduled'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white border border-current">
                      {financials?.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-90">
                    {financials?.scheduleExplanation || 'No billing schedule has been assigned yet. Please contact the campus desk.'}
                  </p>
                </div>
              </div>

              {(financials?.balance || 0) > 0 && (
                <a
                  href={`https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
                    `Hello Focus Academy, I would like to pay my outstanding tuition fee of ₹${financials.balance} for student ${financials.studentName} (ID: ${financials.studentId}). Please provide the official UPI QR / payment instructions.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-xl whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Arrange Payment at Desk</span>
                </a>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand" />
                  <span>Verified Payment Receipts</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {financials?.payments?.length || 0} transaction{financials?.payments?.length === 1 ? '' : 's'}
                </span>
              </div>

              {financials?.payments && financials.payments.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Receipt No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount Paid</th>
                        <th className="py-2.5 px-3">Payment Mode</th>
                        <th className="py-2.5 px-3">Reference / Txn ID</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Receipt Slip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {financials.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-brand">{p.receiptNumber}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.paymentDate}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A]">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 capitalize text-slate-700">{String(p.paymentMethod || '').replace('_', ' ')}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">{p.referenceNumber || p.id}</td>
                          <td className="py-2.5 px-3">
                            {p.isReversed || p.reversed ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>Reversed</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                openPrintableDocument(buildReceiptHtml(p, { studentName: financials?.studentName }));
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-brand hover:underline cursor-pointer"
                            >
                              Print Slip →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500 font-semibold">No verified payment receipts found yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Receipts issued by the campus fee desk will automatically reflect here.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border">
              <div>
                <span className="font-bold text-xs text-[#0F172A] block">Official Admission Slip & Batch Pass</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Admission ID: <strong className="text-brand font-mono">{financials?.admissionId || enrollments[0]?.id || 'Pending'}</strong> • Admission Status: <strong className="capitalize">{(financials?.admissionStatus || enrollments[0]?.status || 'pending review').replace('_', ' ')}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  openPrintableDocument(buildAdmissionSlipHtml({
                    admissionId: financials?.admissionId || enrollments[0]?.id || 'Pending',
                    studentName: financials?.studentName || profile?.studentName || user?.displayName || '',
                    studentId: financials?.studentId || 'Pending central assignment',
                    grade: profile?.grade || studentGrade,
                    board: profile?.board || studentBoard,
                    batchName: financials?.batchName || enrollments[0]?.batchName || 'Focus Evening Batch',
                    batchTiming: financials?.batchTiming || enrollments[0]?.timing || 'Evening Session (4:30 PM – 9:00 PM)',
                    parentName: profile?.parentName || 'Parent',
                    contact: profile?.mobile || user?.email ? `+91 ${profile?.mobile || user?.email}` : '',
                    admissionStatus: financials?.admissionStatus || enrollments[0]?.status || 'pending review'
                  }));
                }}
                className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official Admission Slip</span>
              </button>
            </div>
          </>
        )}
      </div>
    )}

    {activeTab === 'academics' && (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#0F172A]">
                Academic Marks & Attendance Performance
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Active Term 2025–2026
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Weekly unit assessments, model board benchmarks, and attendance records verified by Thoramangalam faculty.
            </p>
          </div>

          {academicRecords.length > 0 && (
            <button
              type="button"
              onClick={() => {
                openPrintableDocument(buildReportCardHtml({
                  studentName: financials?.studentName || profile?.studentName || user?.displayName || 'Student',
                  studentId: financials?.studentId || 'Pending assignment',
                  grade: profile?.grade || studentGrade,
                  board: profile?.board || studentBoard,
                  tests: academicRecords,
                  attendanceRate,
                  cumulativeAvg
                }));
              }}
              className="px-4 py-2 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Report Card</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100">
            <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">Overall Attendance</span>
            <div className="text-2xl font-black text-brand mt-1">{attendanceRate}</div>
            <span className="text-[11px] text-orange-800 mt-0.5 block">
              {attendanceRecords.length > 0
                ? `${attendancePresentCount} / ${attendanceRecords.length} sessions attended`
                : 'Roll-call begins with batch start'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Cumulative Score</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{cumulativeAvg}</div>
            <span className="text-[11px] text-emerald-800 mt-0.5 block">
              {academicRecords.length > 0
                ? `Based on ${academicRecords.length} verified assessments`
                : 'Pending unit assessments'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Faculty Evaluation</span>
            <div className="text-xs font-semibold text-slate-800 mt-2 leading-relaxed">
              {academicRecords.length > 0
                ? 'Individual assessment history and tutor observations recorded below.'
                : 'Personalized evaluation remarks will be recorded after the first batch test.'}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Unit Assessments & Model Test Ledger
          </h3>
          {academicRecords.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Assessment Title</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-right">Score</th>
                    <th className="py-3 px-4 text-right">Percentage</th>
                    <th className="py-3 px-4">Faculty Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {academicRecords.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{t.date}</td>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">{t.title}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">{t.subject}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">{t.score} / {t.max}</td>
                      <td className="py-3 px-4 text-right font-black text-brand whitespace-nowrap">{t.percentage}%</td>
                      <td className="py-3 px-4 text-slate-600">{t.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600 font-bold">No unit assessment scores recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                Unit tests, chapter assessments, and model board marks evaluated by your batch faculty will be entered into your central record and will automatically appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    )}

    {activeTab === 'doubts' && (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#0F172A]">
                Student Doubt Desk & Academic Inquiries
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                Direct Faculty Support
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Submit problem-solving doubts to Focus Academy faculty. Verified responses appear in your portal.
            </p>
          </div>

          <a
            href={`https://wa.me/${CAMPUS_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent('Hello Focus Academy, I have an urgent academic doubt for my evening batch.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Tutor Desk</span>
          </a>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newDoubtQuestion.trim()) return;
            const newEntry = {
              id: `d-${Date.now()}`,
              subject: newDoubtSubject,
              topic: newDoubtTopic ? newDoubtTopic.trim() : 'General Topic',
              question: newDoubtQuestion.trim(),
              status: 'pending',
              date: new Date().toISOString().split('T')[0],
              response: null,
              faculty: null
            };
            setDoubts((prev) => [newEntry, ...prev]);
            const submittedTopic = newDoubtTopic;
            const submittedQuestion = newDoubtQuestion;
            setNewDoubtQuestion('');
            setNewDoubtTopic('');
            setDoubtSubmitted(true);
            setTimeout(() => setDoubtSubmitted(false), 4000);

            try {
              if (user) {
                const token = await user.getIdToken();
                await fetch('/api/student-portal', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    action: 'submit-doubt',
                    subject: newDoubtSubject,
                    topic: submittedTopic.trim(),
                    question: submittedQuestion.trim()
                  })
                });
              }
            } catch (err) {
              console.warn('Doubt submission error:', err);
            }
          }}
          className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
        >
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-brand" />
            <span>Post a New Academic Doubt</span>
          </h3>

          {doubtSubmitted && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Doubt recorded and sent to subject faculty. Tutor review will take place in class.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject
              </label>
              <select
                value={newDoubtSubject}
                onChange={(e) => setNewDoubtSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand"
              >
                <option value="Physics">Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Chapter / Topic (Optional)
              </label>
              <input
                type="text"
                value={newDoubtTopic}
                onChange={(e) => setNewDoubtTopic(e.target.value)}
                placeholder="e.g. Wave Optics, Integration by Parts"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Question Description / Problem Statement
            </label>
            <textarea
              required
              rows={3}
              value={newDoubtQuestion}
              onChange={(e) => setNewDoubtQuestion(e.target.value)}
              placeholder="Describe your question or difficulty with problem derivation..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit to Faculty Desk</span>
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Submitted Doubts & Tutor Resolutions
          </h3>

          {doubts.length > 0 ? (
            <div className="space-y-3">
              {doubts.map((d) => (
                <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                        {d.subject}
                      </span>
                      <span className="text-xs font-bold text-[#0F172A]">{d.topic}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{d.date}</span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    <strong>Q:</strong> {d.question}
                  </p>

                  {d.response ? (
                    <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                          Faculty Resolution
                        </span>
                        <span className="text-[10px] text-orange-900 font-semibold">{d.faculty || 'Subject Faculty'}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{d.response}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Status: In Review</span>
                      <span className="text-brand font-semibold">Tutor review scheduled for upcoming evening batch</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600 font-bold">No academic doubts submitted yet</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                Have a question or problem from your evening class? Submit your doubt using the form above to receive assistance from your subject tutor.
              </p>
            </div>
          )}
        </div>
      </div>
    )}

    {activeTab === 'materials' && (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#0F172A]">
                Study Materials & Question Paper Vault
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
                Official Courseware
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Download and print official Focus Academy revision sheets, chapter blueprints, and Board exam model papers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {studySheets.map((sheet) => (
            <div key={sheet.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-800 uppercase">
                    {sheet.subject}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">{sheet.grade}</span>
                </div>

                <h3 className="text-sm font-bold text-[#0F172A] leading-snug">
                  {sheet.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {sheet.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Focus Series 2026</span>
                <button
                  type="button"
                  onClick={() => openPrintableDocument(buildStudySheetHtml(sheet))}
                  className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

        {showLinkSiblingModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-sibling-modal-title"
          >
            <div
              ref={linkSiblingModalRef}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-left relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="link-sibling-modal-title" className="text-base font-bold text-slate-900">
                      Link Sibling Account
                    </h3>
                    <p className="text-xs text-slate-500">Unify sibling records under this guardian portal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLinkSiblingModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLinkSibling} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="sibling-student-id" className="block text-xs font-semibold text-slate-700 mb-1">
                    Sibling Student ID or Full Name
                  </label>
                  <input
                    id="sibling-student-id"
                    type="text"
                    value={linkSiblingIdInput}
                    onChange={(e) => setLinkSiblingIdInput(e.target.value)}
                    placeholder="e.g. FA-2026-004 or Bhavana Suresh"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand outline-none"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Both siblings share the guardian contact phone for admission slips and billing alerts.
                  </p>
                </div>

                {linkSiblingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{linkSiblingError}</span>
                  </div>
                )}

                {linkSiblingSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{linkSiblingSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkSiblingModal(false)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand hover:bg-brand-strong text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Link Sibling
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
