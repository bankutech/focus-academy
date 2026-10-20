import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Phone,
  LogIn,
  UserPlus
} from 'lucide-react';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow } from '../context/useAppContext';
import { validateIndianMobile } from '../types/schemas';

export default function StudentDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { studentFlow, updateStudentFlow } = useStudentFlow();

  const [tabMode, setTabMode] = useState(
    location.pathname === '/login' ? 'login' : 'signup'
  );
  const authMode = location.pathname === '/login' ? 'login' : (location.pathname === '/signup' ? 'signup' : tabMode);

  const initialGrade = searchParams.get('grade') || studentFlow.grade || 'Class 10';
  const initialBoard = searchParams.get('board') || studentFlow.board || 'TN State Board (Samacheer)';

  const [studentName, setStudentName] = useState(studentFlow.studentName || '');
  const [phone, setPhone] = useState(studentFlow.phone || '');
  const [parentName, setParentName] = useState(studentFlow.parentName || '');
  const [board, setBoard] = useState(initialBoard);
  const [grade, setGrade] = useState(initialGrade);
  
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [loginFeedback, setLoginFeedback] = useState('');

  const boards = [
    {
      id: 'TN State Board (Samacheer)',
      name: 'TN State Board (Samacheer)',
      subtitle: 'Tamil Nadu State Syllabus & SSLC/HSC Board Blueprints',
      badge: 'Most Popular in Perambalur',
    },
    {
      id: 'CBSE Board',
      name: 'CBSE (Central Board)',
      subtitle: 'NCERT Curriculum, Competency & Exemplar Problem Solving',
      badge: 'NCERT Focus',
    },
    {
      id: 'ICSE Board',
      name: 'ICSE Board',
      subtitle: 'Comprehensive Conceptual Curriculum & Step-Marking Training',
      badge: 'CISCE Standards',
    },
  ];

  const gradeOptions = [
    { id: 'Class 6', label: 'Class 6', stage: 'Middle School' },
    { id: 'Class 7', label: 'Class 7', stage: 'Middle School' },
    { id: 'Class 8', label: 'Class 8', stage: 'Middle School' },
    { id: 'Class 9', label: 'Class 9', stage: 'Pre-Board' },
    { id: 'Class 10', label: 'Class 10', stage: 'SSLC / Board' },
    { id: 'Class 11', label: 'Class 11', stage: 'Senior STEM' },
    { id: 'Class 12', label: 'Class 12', stage: 'HSC / Board' },
  ];

  const handleLookupProfile = () => {
    setPhoneError('');
    setLoginFeedback('');

    if (!phone.trim()) {
      setPhoneError('Please enter your 10-digit mobile number to log in.');
      return;
    }

    const val = validateIndianMobile(phone);
    if (!val.valid) {
      setPhoneError(val.error);
      return;
    }

    try {
      const savedFlow = localStorage.getItem('focus_academy_student_flow');
      const savedLogs = localStorage.getItem('focus_academy_submitted_leads_v1');
      let foundData = null;

      if (savedFlow) {
        const parsed = JSON.parse(savedFlow);
        if (parsed.phone && parsed.phone.includes(val.sanitized)) {
          foundData = parsed;
        }
      }

      if (!foundData && savedLogs) {
        const logs = JSON.parse(savedLogs);
        const match = logs.find((l) => l.phone && l.phone.includes(val.sanitized));
        if (match) foundData = match;
      }

      if (foundData) {
        if (foundData.studentName) setStudentName(foundData.studentName);
        if (foundData.parentName) setParentName(foundData.parentName);
        if (foundData.board) setBoard(foundData.board);
        if (foundData.grade) setGrade(foundData.grade);
        setLoginFeedback(`Welcome back, ${foundData.studentName || 'Student'}! Profile loaded for ${foundData.grade || 'your class'}.`);
      } else {
        setLoginFeedback('Number recognized. Please select or confirm your Board and Grade below to continue.');
      }
    } catch {
      setLoginFeedback('Preferences saved. Please select your Board and Grade below.');
    }
  };

  const handleSwitchTab = useCallback((mode) => {
    setTabMode(mode);
    setLoginFeedback('');
    setPhoneError('');
    navigate(mode === 'login' ? '/login' : '/signup', { replace: true });
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPhoneError('');
    setNameError('');

    let sanitizedPhone = '';
    if (authMode === 'login') {
      if (!phone.trim()) {
        setPhoneError('Please enter your 10-digit mobile number to log in.');
        return;
      }
      const val = validateIndianMobile(phone);
      if (!val.valid) {
        setPhoneError(val.error);
        return;
      }
      sanitizedPhone = val.sanitized;
    } else if (phone.trim()) {
      const val = validateIndianMobile(phone);
      if (!val.valid) {
        setPhoneError(val.error);
        return;
      }
      sanitizedPhone = val.sanitized;
    }

    updateStudentFlow({
      studentName: studentName.trim() || studentFlow.studentName || '',
      phone: sanitizedPhone || studentFlow.phone || '',
      parentName: parentName.trim() || studentFlow.parentName || '',
      board,
      grade,
    });

    navigate('/exam-prep');
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-left">
      <StepProgress currentStep={1} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-[#181614] tracking-tight">
            {authMode === 'login' ? 'Student Account Log In' : 'Student Registration & Board Selection'}
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            {authMode === 'login' 
              ? 'Log in with your mobile number to restore your previous batch preferences and enrollment details.' 
              : 'Enter your basic details, select your education board, and choose your class to view tailored batches.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-[#E8E2D8] shadow-xs mb-8 max-w-md">
          <button
            type="button"
            onClick={() => handleSwitchTab('signup')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              authMode === 'signup'
                ? 'bg-[#181614] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#181614]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Student (Sign Up)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('login')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              authMode === 'login'
                ? 'bg-[#181614] text-white shadow-xs'
                : 'text-[#78716C] hover:text-[#181614]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Returning Student (Log In)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-editorial space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
              <h2 className="text-base font-bold text-[#181614]">
                1. {authMode === 'login' ? 'Log In with Mobile Number' : 'Student Contact Details'}
              </h2>
              <span className="text-[11px] font-code-mono text-[#78716C]">
                Thoramangalam / Perambalur
              </span>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="e.g. 98424 51220"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          phoneError ? 'border-rose-500' : 'border-[#E8E2D8]'
                        } rounded-xl text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupProfile}
                      className="px-5 py-2.5 bg-[#181614] hover:bg-[#2A2623] text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                      Find Profile
                    </button>
                  </div>
                  {phoneError && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{phoneError}</p>
                  )}
                  {loginFeedback && (
                    <div className="mt-2.5 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{loginFeedback}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                    Student Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. K. Vignesh"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E8E2D8] rounded-xl text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                      Student Full Name (Optional)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => {
                          setStudentName(e.target.value);
                          if (nameError) setNameError('');
                        }}
                        placeholder="e.g. K. Vignesh"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          nameError ? 'border-rose-500' : 'border-[#E8E2D8]'
                        } rounded-xl text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]`}
                      />
                    </div>
                    {nameError && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{nameError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                      Mobile Number (Optional at this step)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#A8A29E] absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="e.g. 98424 51220"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          phoneError ? 'border-rose-500' : 'border-[#E8E2D8]'
                        } rounded-xl text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]`}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
                    Parent / Guardian Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Mr. S. Kannan (Father)"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D8] rounded-xl text-sm font-medium text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-editorial space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
              <h2 className="text-base font-bold text-[#181614]">
                2. Select Education Board
              </h2>
              <span className="text-[11px] font-code-mono text-[#78716C]">
                Selected: <strong className="text-[#C2410C]">{board}</strong>
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
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#181614] text-white border-[#181614] shadow-editorial'
                        : 'bg-[#FAF7F2] hover:bg-white text-[#181614] border-[#E8E2D8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[9px] font-code-mono uppercase font-bold px-2 py-0.5 rounded ${
                            isSelected ? 'bg-[#C2410C] text-white' : 'bg-white text-[#78716C] border border-[#E8E2D8]'
                          }`}
                        >
                          {b.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FED7AA]" />}
                      </div>
                      <p className="text-sm font-bold leading-tight">{b.name}</p>
                      <p
                        className={`text-xs mt-1 leading-snug ${
                          isSelected ? 'text-[#A8A29E]' : 'text-[#57534E]'
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

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E8E2D8] shadow-editorial space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#FAF7F2]">
              <h2 className="text-base font-bold text-[#181614]">
                3. Select Student Class / Grade
              </h2>
              <span className="text-[11px] font-code-mono text-[#78716C]">
                Selected: <strong className="text-[#C2410C]">{grade}</strong>
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
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#C2410C] text-white border-[#C2410C] shadow-editorial font-bold'
                        : 'bg-[#FAF7F2] hover:bg-white text-[#181614] border-[#E8E2D8]'
                    }`}
                  >
                    <span className="text-sm font-black">{opt.label}</span>
                    <span
                      className={`text-[10px] font-code-mono mt-0.5 ${
                        isSelected ? 'text-[#FED7AA]' : 'text-[#78716C]'
                      }`}
                    >
                      {opt.stage}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Your information is strictly private and used only for academic batch allocation at Focus Academy Thoramangalam.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-[#78716C] hover:text-[#181614] order-2 sm:order-1"
            >
              ← Back to Home
            </button>

            <div className="flex flex-col items-stretch sm:items-end w-full sm:w-auto order-1 sm:order-2">
              {phoneError && (
                <p className="text-xs text-rose-600 font-semibold mb-2 text-center sm:text-right">{phoneError}</p>
              )}
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-bold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98"
              >
                <span>Continue to Exam Preparation (Step 2)</span>
                <ArrowRight className="w-4 h-4 text-[#FED7AA]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
