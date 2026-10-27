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
  Download
} from 'lucide-react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { useStudentFlow } from '../context/useAppContext';
import { db, isFirebaseConfigured } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { CAMPUS_CONFIG } from '../config/campusConfig';
import { AdminDataService } from '../services/adminDataService';
import { calculateNextPaymentDueDate } from '../types/schemas';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user, profile, logout, updateProfile, refreshProfile } = useStudentAuth();
  const { studentFlow } = useStudentFlow();

  const [activeTab, setActiveTab] = useState('enrollments');
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [enrollmentError, setEnrollmentError] = useState('');

  const [financials, setFinancials] = useState(null);
  const [loadingFinancials, setLoadingFinancials] = useState(true);
  const [financialsError, setFinancialsError] = useState('');

  // Profile Edit State
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

  useEffect(() => {
    document.title = 'Student Dashboard | Focus Academy';
  }, []);

  // Sync edit state with loaded profile
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

  const fetchEnrollments = useCallback(async () => {
    if (!user) return;
    setLoadingEnrollments(true);
    setEnrollmentError('');

    const records = [];

    // 1. Try fetching from Firestore enrollments collection
    if (isFirebaseConfigured() && db) {
      try {
        const enrollmentsRef = collection(db, 'enrollments');
        // Match by studentUid
        const qUid = query(enrollmentsRef, where('studentUid', '==', user.uid));
        const snapUid = await getDocs(qUid);
        snapUid.forEach(doc => {
          records.push({ id: doc.id, ...doc.data(), source: 'firestore_enrollment' });
        });

        // Also match by email if studentUid query didn't return
        if (records.length === 0 && user.email) {
          const qEmail = query(enrollmentsRef, where('email', '==', user.email));
          const snapEmail = await getDocs(qEmail);
          snapEmail.forEach(doc => {
            if (!records.find(r => r.id === doc.id)) {
              records.push({ id: doc.id, ...doc.data(), source: 'firestore_enrollment' });
            }
          });
        }
      } catch (err) {
        console.warn('Could not query enrollments collection:', err);
        setEnrollmentError('Could not sync remote admissions records. Showing local records.');
      }
    }

    // 2. Check local admission submissions in storage as fallback/supplement
    try {
      const localLogs = JSON.parse(
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('focus_academy_submitted_leads_v1')) ||
        localStorage.getItem('focus_academy_submitted_leads_v1') || '[]'
      );
      const studentStorage = JSON.parse(localStorage.getItem('focus_academy_students') || '[]');

      localLogs.forEach(log => {
        const matchesUser = 
          (profile?.mobile && log.phone === profile.mobile) || 
          (user.email && log.email === user.email) ||
          (profile?.studentName && log.studentName?.toLowerCase() === profile.studentName.toLowerCase());
        
        if (matchesUser && !records.find(r => r.id === log.id || (r.batchId === log.batchId && r.timestamp === log.timestamp))) {
          records.push({
            id: log.id || `lead-${Date.now()}`,
            studentName: log.studentName || profile?.studentName || user.displayName,
            batchId: log.batchId,
            batchName: log.selectedBatchName || log.subjects || 'Focus Evening Batch',
            timing: log.timing || 'Evening Session (4:00 PM – 8:30 PM)',
            grade: log.grade || profile?.grade,
            board: log.board || profile?.board,
            status: log.serverConfirmed ? 'confirmed' : 'pending_review',
            reservationId: log.reservationId,
            enrolledAt: log.submittedAt || log.timestamp || new Date().toISOString(),
            source: 'local_record',
            details: log
          });
        }
      });

      studentStorage.forEach(s => {
        if (s.phone === profile?.mobile && !records.find(r => r.id === s.id)) {
          records.push({
            id: s.id || `FA-${Date.now()}`,
            studentName: s.studentName,
            batchId: s.selectedBatchId,
            batchName: s.selectedBatchName || 'Focus Evening Batch',
            timing: s.timing || 'Mon-Sat Evening',
            grade: s.grade,
            board: s.board,
            status: 'confirmed',
            reservationId: s.reservationId,
            enrolledAt: s.createdAt || new Date().toISOString(),
            source: 'student_slip',
            details: s
          });
        }
      });
    } catch {
      // Local storage read error
    }

    // Sort by enrollment date (newest first)
    records.sort((a, b) => new Date(b.enrolledAt || 0) - new Date(a.enrolledAt || 0));

    setEnrollments(records);
    setLoadingEnrollments(false);
  }, [user, profile]);

  const fetchFinancials = useCallback(async () => {
    if (!user) return;
    setLoadingFinancials(true);
    setFinancialsError('');

    try {
      const allStudents = await AdminDataService.getStudents({ includeArchived: true }).catch(() => []);
      const matchedStudent = allStudents.find(s => 
        (s.studentUid && s.studentUid === user.uid) ||
        (user.email && s.email && s.email.toLowerCase() === user.email.toLowerCase()) ||
        (profile?.mobile && s.guardianPhone && s.guardianPhone.replace(/\D/g, '').slice(-10) === profile.mobile.replace(/\D/g, '').slice(-10)) ||
        (profile?.studentName && s.studentName && s.studentName.toLowerCase().trim() === profile.studentName.toLowerCase().trim())
      );

      const studentId = matchedStudent?.id || null;
      let obligations = [];
      let payments = [];

      if (studentId) {
        const ledger = await AdminDataService.getStudentLedger(studentId).catch(() => null);
        if (ledger) {
          obligations = ledger.obligations || [];
          payments = ledger.payments || [];
        }
      }

      if (isFirebaseConfigured() && db) {
        try {
          if (studentId) {
            const oblSnap = await getDocs(query(collection(db, 'fee_obligations'), where('studentId', '==', studentId)));
            if (!oblSnap.empty) {
              obligations = oblSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
            const paySnap = await getDocs(query(collection(db, 'payments'), where('studentId', '==', studentId)));
            if (!paySnap.empty) {
              payments = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
          }
        } catch (err) {
          console.warn('Could not query remote ledger:', err);
        }
      }

      const activePayments = payments.filter(p => !p.isReversed && !p.reversed);
      const totalFeesCharged = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
      const totalAmountPaid = activePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalWaived = obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
      const balance = Math.max(0, totalFeesCharged - totalAmountPaid - totalWaived);

      const schedule = calculateNextPaymentDueDate({
        student: matchedStudent,
        obligations,
        payments: activePayments
      });

      setFinancials({
        studentId: studentId || (matchedStudent ? matchedStudent.id : 'STD-PENDING'),
        studentName: matchedStudent?.studentName || profile?.studentName || user.displayName || 'Student',
        admissionId: matchedStudent?.admissionId || (enrollments[0]?.id) || 'ADM-FA-2026',
        batchName: matchedStudent?.batchName || enrollments[0]?.batchName || 'Focus Evening Batch',
        batchTiming: matchedStudent?.timing || enrollments[0]?.timing || '6:00 PM – 7:30 PM',
        monthlyFee: matchedStudent?.feeConfig?.amountPerCycle || (enrollments[0]?.monthlyFee) || 2200,
        totalFeesCharged,
        totalAmountPaid,
        balance,
        status: schedule.status,
        isOverdue: schedule.isOverdue,
        nextDueDate: schedule.dueDate,
        nextDueDateFormatted: schedule.formatted,
        scheduleExplanation: schedule.explanation,
        obligations,
        payments: activePayments
      });
    } catch (err) {
      console.warn('Failed to fetch student financials:', err);
      setFinancialsError('Unable to load authoritative fee ledger.');
    } finally {
      setLoadingFinancials(false);
    }
  }, [user, profile, enrollments]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

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
  const studentSlipId = `FA-STU-${(user?.uid || '000000').slice(0, 6).toUpperCase()}`;

  // Incomplete enrollment detection
  const hasIncompleteFunnel = studentFlow && studentFlow.step >= 2 && studentFlow.step < 5 && studentFlow.selectedBatchId;

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header Card */}
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

            {/* Quick Metrics Bar */}
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

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 bg-slate-50/50 px-4 sm:px-8 flex overflow-x-auto">
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
              <span>My Batches & Admissions</span>
              {enrollments.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-brand text-[10px] font-bold">
                  {enrollments.length}
                </span>
              )}
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
          </div>
        </div>

        {/* Incomplete Admission Notice */}
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

        {/* TAB 1: ENROLLMENTS */}
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
                onClick={fetchEnrollments}
                disabled={loadingEnrollments}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingEnrollments ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {enrollmentError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
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
                          <span className="font-bold text-[#0F172A]">{enr.timing || 'Evening Session (4:00 PM – 8:30 PM)'}</span>
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

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Desk</span>
                        </a>
                        <Link
                          to={`/batch/${enr.batchId || ''}`}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
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

        {/* TAB 2: STUDENT PROFILE */}
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
          </div>
        )}

        {/* TAB 3: CAMPUS GUIDELINES */}
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

            {/* Campus Address Box */}
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

        {/* TAB 4: FEES & RECEIPTS */}
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
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {financialsError}
              </div>
            ) : (
              <>
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block font-medium">Monthly Tuition Fee</span>
                    <span className="font-extrabold text-[#0F172A] text-lg font-mono mt-1 block">
                      ₹{Number(financials?.monthlyFee || 2200).toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/mo</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">{financials?.batchName || 'Focus Evening Batch'}</p>
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

            {/* Next Due Date Banner */}
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
                    {financials?.scheduleExplanation || 'Official tuition schedule governed by 5th-of-month institutional billing.'}
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
                  <span>Pay Tuition Online</span>
                </a>
              )}
            </div>

            {/* Verified Payment Receipts */}
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                window.open('', '_blank')?.document.write(`
                                  <html>
                                    <head><title>Receipt ${p.receiptNumber} - Focus Academy</title>
                                    <style>
                                      body { font-family: sans-serif; padding: 40px; color: #0F172A; }
                                      .receipt { border: 2px solid #0F172A; padding: 30px; max-width: 600px; margin: 0 auto; }
                                      h1 { margin: 0 0 5px 0; color: #C2410C; font-size: 24px; }
                                      .meta { color: #64748B; font-size: 12px; margin-bottom: 20px; }
                                      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                      th, td { border: 1px solid #E2E8F0; padding: 10px; font-size: 13px; text-align: left; }
                                      th { background: #F8FAFC; }
                                      .footer { margin-top: 30px; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px; }
                                    </style>
                                    </head>
                                    <body>
                                      <div class="receipt">
                                        <h1>FOCUS ACADEMY</h1>
                                        <div class="meta">Thiripura Complex, Thoramangalam, Perambalur — 621220 • Official Receipt</div>
                                        <table>
                                          <tr><th>Receipt No</th><td><strong>${p.receiptNumber}</strong></td></tr>
                                          <tr><th>Student Name</th><td>${p.studentName || financials.studentName}</td></tr>
                                          <tr><th>Date</th><td>${p.paymentDate}</td></tr>
                                          <tr><th>Amount Paid</th><td><strong>₹${Number(p.amount).toLocaleString('en-IN')}</strong></td></tr>
                                          <tr><th>Payment Mode</th><td style="text-transform: capitalize;">${String(p.paymentMethod || '').replace('_', ' ')}</td></tr>
                                          <tr><th>Transaction Ref</th><td>${p.referenceNumber || p.id}</td></tr>
                                          <tr><th>Status</th><td>VERIFIED & CREDITED TO ACADEMY LEDGER</td></tr>
                                        </table>
                                        <div class="footer">Computer generated official receipt issued by Focus Academy Finance Desk.</div>
                                      </div>
                                      <script>window.print();</script>
                                    </body>
                                  </html>
                                `);
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
                    Receipts issued at the campus counter or online gateway will automatically reflect here.
                  </p>
                </div>
              )}
            </div>

            {/* Downloadable / Printable Official Admission Slip Section */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border">
              <div>
                <span className="font-bold text-xs text-[#0F172A] block">Official Admission Slip & Batch Pass</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Admission ID: <strong className="text-brand font-mono">{financials?.admissionId || enrollments[0]?.id || 'ADM-FA-2026'}</strong> • Seat Status: <strong>1:12 Guaranteed Reserved</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.open('', '_blank')?.document.write(`
                    <html>
                      <head><title>Official Admission Slip - Focus Academy</title>
                      <style>
                        body { font-family: sans-serif; padding: 40px; color: #0F172A; }
                        .slip { border: 2px solid #C2410C; padding: 30px; max-width: 650px; margin: 0 auto; }
                        h1 { margin: 0 0 5px 0; color: #C2410C; font-size: 26px; }
                        .badge { background: #EA580C; color: white; padding: 3px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; display: inline-block; margin-bottom: 15px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #E2E8F0; padding: 10px; font-size: 13px; text-align: left; }
                        th { background: #F8FAFC; width: 40%; }
                        .footer { margin-top: 30px; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px; text-align: center; }
                      </style>
                      </head>
                      <body>
                        <div class="slip">
                          <h1>FOCUS ACADEMY</h1>
                          <div class="badge">OFFICIAL ADMISSION SLIP (SESSION 2025–2026)</div>
                          <div>Thiripura Complex, Main Road, Thoramangalam, Perambalur — 621220</div>
                          <table>
                            <tr><th>Admission Slip No</th><td><strong>${financials?.admissionId || enrollments[0]?.id || 'FA-2026-ADM'}</strong></td></tr>
                            <tr><th>Student Name</th><td><strong>${financials?.studentName || profile?.studentName || user?.displayName}</strong></td></tr>
                            <tr><th>Student ID</th><td>${financials?.studentId || 'STD-2026-REG'}</td></tr>
                            <tr><th>Class & Board</th><td>${profile?.grade || studentGrade} • ${profile?.board || studentBoard}</td></tr>
                            <tr><th>Enrolled Batch</th><td><strong>${financials?.batchName || enrollments[0]?.batchName || 'Focus Evening Batch'}</strong></td></tr>
                            <tr><th>Session Timing</th><td>${financials?.batchTiming || enrollments[0]?.timing || 'Evening Session (4:00 PM – 8:30 PM)'}</td></tr>
                            <tr><th>Classroom Ratio</th><td>1:12 Strict Faculty Supervision Capped</td></tr>
                            <tr><th>Parent / Contact</th><td>${profile?.parentName || 'Parent'} (+91 ${profile?.mobile || user?.email})</td></tr>
                            <tr><th>Admission Status</th><td>CONFIRMED & SEAT RESERVED</td></tr>
                          </table>
                          <div class="footer">
                            Please present this slip at Thiripura Complex reception for textbook workbook issuance.
                          </div>
                        </div>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `);
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

      </div>
    </div>
  );
}
