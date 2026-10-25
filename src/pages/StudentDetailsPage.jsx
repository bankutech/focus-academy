import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { 
  User, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  LogIn, 
  UserPlus,
  Info,
  X
} from 'lucide-react';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow } from '../context/useAppContext';
import { validateIndianMobile } from '../types/schemas';

export default function StudentDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialGrade = searchParams.get('grade');
  const initialBoard = searchParams.get('board');
  const initialMode = searchParams.get('mode') || 'signup';

  const { studentFlow, setStudentFlow, lookupSavedStudent } = useStudentFlow();

  const [authMode, setAuthMode] = useState(initialMode === 'login' ? 'login' : 'signup');
  const [studentName, setStudentName] = useState(studentFlow.studentName || '');
  const [parentName, setParentName] = useState(studentFlow.parentName || '');
  const [phone, setPhone] = useState(studentFlow.phone || '');
  const [board, setBoard] = useState(initialBoard || studentFlow.board || 'TN State Board (Samacheer)');
  const [grade, setGrade] = useState(initialGrade || studentFlow.grade || 'Class 10');

  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [loginFeedback, setLoginFeedback] = useState('');
  const [dismissNotice, setDismissNotice] = useState(false);

  const redirectedFrom = location.state?.redirectedFrom || searchParams.get('from');

  useEffect(() => {
    if (redirectedFrom) {
      const timer = setTimeout(() => {
        setDismissNotice(true);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [redirectedFrom]);

  const boards = [
    { 
      id: 'TN State Board (Samacheer)', 
      name: 'Tamil Nadu State Board', 
      subtitle: 'Samacheer Kalvi syllabus with 10-year question paper drills',
      badge: 'State Board'
    },
    { 
      id: 'CBSE Board', 
      name: 'CBSE Board', 
      subtitle: 'NCERT aligned blueprint drills and conceptual numericals',
      badge: 'CBSE (NCERT)'
    },
    { 
      id: 'ICSE Board', 
      name: 'ICSE Board', 
      subtitle: 'Comprehensive theory with analytical reasoning',
      badge: 'ICSE / ISC'
    },
  ];

  const gradeOptions = [
    { id: 'Class 6', label: 'Class 6', stage: 'Middle' },
    { id: 'Class 7', label: 'Class 7', stage: 'Middle' },
    { id: 'Class 8', label: 'Class 8', stage: 'Middle' },
    { id: 'Class 9', label: 'Class 9', stage: 'Pre-Board' },
    { id: 'Class 10', label: 'Class 10', stage: 'Board SSLC' },
    { id: 'Class 11', label: 'Class 11', stage: 'Senior STEM' },
    { id: 'Class 12', label: 'Class 12', stage: 'Board HSC' },
  ];

  const handleLookupProfile = () => {
    setPhoneError('');
    setLoginFeedback('');

    const validation = validateIndianMobile(phone);
    if (!validation.valid) {
      setPhoneError(validation.error || validation.message);
      return;
    }

    const found = lookupSavedStudent(validation.sanitized);
    if (found) {
      if (found.grade) setGrade(found.grade);
      if (found.board) setBoard(found.board);
      setLoginFeedback(`Academic preferences restored for ${found.grade} (${found.board}). For student privacy on shared devices, please confirm the student's name to continue.`);
    } else {
      setLoginFeedback('No prior admission found for this mobile. Enter details below to begin registration.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPhoneError('');
    setNameError('');

    const trimmedName = studentName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setNameError('Please enter the student\'s full name (minimum 2 characters).');
      return;
    }

    const validation = validateIndianMobile(phone);
    if (!validation.valid) {
      setPhoneError(validation.error || validation.message || 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setStudentFlow((prev) => {
      const gradeChanged = prev.grade !== grade || prev.board !== board;
      return {
        ...prev,
        studentName: trimmedName,
        parentName: parentName.trim(),
        phone: validation.sanitized || phone.trim(),
        board,
        grade,
        step: 2,
        selectedBatchId: gradeChanged ? '' : prev.selectedBatchId,
        selectedBatchName: gradeChanged ? '' : prev.selectedBatchName,
        batchTiming: gradeChanged ? '' : prev.batchTiming,
        examPrep: gradeChanged ? '' : prev.examPrep,
        examPrepId: gradeChanged ? '' : prev.examPrepId,
      };
    });

    navigate('/exam-prep');
  };

  const handleSwitchTab = (mode) => {
    setAuthMode(mode);
    setPhoneError('');
    setNameError('');
    setLoginFeedback('');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left">
      <StepProgress currentStep={1} />

      {redirectedFrom && !dismissNotice && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-50 w-[92%] sm:w-auto max-w-lg shadow-2xl rounded-full bg-[#0F172A] text-white py-2.5 px-4 sm:px-5 border border-slate-700 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 fade-in duration-300"
        >
          <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EA580C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EA580C]"></span>
            </span>
            <span className="text-slate-100">
              <strong className="text-white font-bold mr-1">Step 1 Required:</strong>
              Please provide basic student details first to unlock batches
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDismissNotice(true)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {redirectedFrom && !dismissNotice && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start justify-between gap-3 text-xs text-orange-950 animate-in fade-in">
            <div className="flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-[#0F172A]">
                  Step 1 Required (Sequential Admission)
                </strong>
                <span className="text-slate-600 mt-0.5 block leading-relaxed">
                  Please provide basic student details first to unlock batches. Admission steps must be entered in ascending order: 1 &rarr; 2 &rarr; 3 &rarr; 4 &rarr; 5.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissNotice(true)}
              aria-label="Dismiss notice"
              className="text-slate-400 hover:text-[#0F172A] p-1 rounded transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            {authMode === 'login' ? 'Student Account Log In' : 'Student Registration & Board Selection'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {authMode === 'login' 
              ? 'Log in with your mobile number to restore your previous batch preferences and enrollment details.' 
              : 'Enter your basic details, select your education board, and choose your class to view tailored batches.'}
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-md border border-[#E2E8F0] mb-8 max-w-md">
          <button
            type="button"
            onClick={() => handleSwitchTab('signup')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              authMode === 'signup'
                ? 'bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1]'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Student (Sign Up)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('login')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              authMode === 'login'
                ? 'bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1]'
                : 'text-slate-600 hover:text-[#0F172A]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Returning Student (Log In)</span>
          </button>
        </div>

        <form data-testid="student-details-form" onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#E2E8F0] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0F172A]">
                {authMode === 'login' ? 'Log In with Mobile Number' : 'Student Contact Details'}
              </h2>
              <span className="text-xs text-slate-500">
                Thoramangalam / Perambalur
              </span>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="login-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                    Registered Mobile Number * <span className="text-[11px] font-normal text-slate-500">/ பதிவு செய்யப்பட்ட கைபேசி எண் *</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="login-phone"
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="e.g. 98424 51220"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          phoneError ? 'border-rose-500' : 'border-[#E2E8F0]'
                        } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupProfile}
                      className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-md shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                      Find Profile
                    </button>
                  </div>
                  {phoneError && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{phoneError}</p>
                  )}
                  {loginFeedback && (
                    <div className="mt-2.5 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md text-xs font-semibold flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{loginFeedback}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="login-student-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                    Student Full Name * <span className="text-[11px] font-normal text-slate-500">/ மாணவர் பெயர் *</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="login-student-name"
                      required
                      type="text"
                      value={studentName}
                      onChange={(e) => {
                        setStudentName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      placeholder="e.g. K. Vignesh"
                      className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                        nameError ? 'border-rose-500' : 'border-[#E2E8F0]'
                      } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                    />
                  </div>
                  {nameError && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{nameError}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  name="website_url"
                  tabIndex="-1"
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signup-student-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Student Full Name * <span className="text-[11px] font-normal text-slate-500">/ மாணவர் பெயர் *</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="signup-student-name"
                        required
                        type="text"
                        value={studentName}
                        onChange={(e) => {
                          setStudentName(e.target.value);
                          if (nameError) setNameError('');
                        }}
                        placeholder="e.g. K. Vignesh"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          nameError ? 'border-rose-500' : 'border-[#E2E8F0]'
                        } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                      />
                    </div>
                    {nameError && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{nameError}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Mobile Number * <span className="text-[11px] font-normal text-slate-500">/ கைபேசி எண் *</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="signup-phone"
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="e.g. 98424 51220"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          phoneError ? 'border-rose-500' : 'border-[#E2E8F0]'
                        } rounded-md text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-parent-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                    Parent / Guardian Name <span className="text-[11px] font-normal text-slate-500">/ பெற்றோர் பெயர் (Optional)</span>
                  </label>
                  <input
                    id="signup-parent-name"
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Mr. S. Kannan (Father)"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-md text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0F172A]">
                Education Board
              </h2>
              <span className="text-xs text-slate-500">
                Selected: <strong className="text-[#EA580C]">{board}</strong>
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {boards.map((b) => {
                const isSelected = board === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBoard(b.id)}
                    className={`p-4 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                        : 'bg-slate-50 hover:bg-white text-[#0F172A] border-[#E2E8F0]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${
                            isSelected ? 'bg-[#EA580C] text-white' : 'bg-white text-slate-600 border border-[#E2E8F0]'
                          }`}
                        >
                          {b.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-orange-200" />}
                      </div>
                      <p className="text-sm font-bold leading-tight">{b.name}</p>
                      <p
                        className={`text-xs mt-1 leading-snug ${
                          isSelected ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {b.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-lg border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0F172A]">
                Student Class / Grade
              </h2>
              <span className="text-xs text-slate-500">
                Selected: <strong className="text-[#EA580C]">{grade}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {gradeOptions.map((opt) => {
                const isSelected = grade === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGrade(opt.id)}
                    className={`p-3 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs font-bold'
                        : 'bg-slate-50 hover:bg-white text-[#0F172A] border-[#E2E8F0]'
                    }`}
                  >
                    <span className="text-sm font-bold">{opt.label}</span>
                    <span
                      className={`text-xs mt-0.5 ${
                        isSelected ? 'text-orange-200' : 'text-slate-500'
                      }`}
                    >
                      {opt.stage}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Verifiable Parental / Guardian Consent (DPDP Act 2023 Compliance)</span>
            </div>
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                defaultChecked={true}
                className="mt-0.5 rounded text-[#EA580C] focus:ring-[#EA580C] h-4 w-4 border-emerald-300"
              />
              <span className="leading-snug text-emerald-900 font-medium">
                I confirm that I am the parent or legal guardian of this student, and I consent to Focus Academy collecting and processing educational details strictly for academic batch allocation and counseling.
              </span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] order-2 sm:order-1"
            >
              ← Back to Home
            </button>

            <div className="flex flex-col items-stretch sm:items-end w-full sm:w-auto order-1 sm:order-2">
              {phoneError && (
                <p className="text-xs text-rose-600 font-semibold mb-2 text-center sm:text-right">{phoneError}</p>
              )}
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold rounded-md shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <span>Continue to Exam Preparation (Step 2)</span>
                <ArrowRight className="w-4 h-4 text-orange-200" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
