import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  LogIn, 
  UserPlus 
} from 'lucide-react';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow } from '../context/useAppContext';
import { validateIndianMobile } from '../types/schemas';

export default function StudentDetailsPage() {
  const navigate = useNavigate();
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
      setPhoneError(validation.message);
      return;
    }

    const found = lookupSavedStudent(validation.sanitized);
    if (found) {
      setStudentName(found.studentName || '');
      setParentName(found.parentName || '');
      if (found.grade) setGrade(found.grade);
      if (found.board) setBoard(found.board);
      setLoginFeedback(`Welcome back, ${found.studentName || 'Student'}! Preferences restored.`);
    } else {
      setLoginFeedback('No previous registration found for this number. You can enter details and proceed with sign up.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPhoneError('');
    setNameError('');

    if (authMode === 'login') {
      const validation = validateIndianMobile(phone);
      if (!validation.valid) {
        setPhoneError(validation.message);
        return;
      }
    } else {
      if (phone.trim()) {
        const validation = validateIndianMobile(phone);
        if (!validation.valid) {
          setPhoneError(validation.message);
          return;
        }
      }
    }

    setStudentFlow((prev) => ({
      ...prev,
      studentName: studentName.trim() || 'Focus Student',
      parentName: parentName.trim(),
      phone: phone.trim(),
      board,
      grade,
      step: 2,
    }));

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
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

        <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-[#E2E8F0] shadow-xs mb-8 max-w-md">
          <button
            type="button"
            onClick={() => handleSwitchTab('signup')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              authMode === 'signup'
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-500 hover:text-[#0F172A]'
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
                ? 'bg-[#0F172A] text-white shadow-xs'
                : 'text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Returning Student (Log In)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-editorial space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0F172A]">
                1. {authMode === 'login' ? 'Log In with Mobile Number' : 'Student Contact Details'}
              </h2>
              <span className="text-xs text-slate-500">
                Thoramangalam / Perambalur
              </span>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="login-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="login-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="e.g. 98424 51220"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          phoneError ? 'border-rose-500' : 'border-[#E2E8F0]'
                        } rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupProfile}
                      className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                      Find Profile
                    </button>
                  </div>
                  {phoneError && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{phoneError}</p>
                  )}
                  {loginFeedback && (
                    <div className="mt-2.5 p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{loginFeedback}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="login-student-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                    Student Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="login-student-name"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. K. Vignesh"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signup-student-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Student Full Name (Optional)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="signup-student-name"
                        type="text"
                        value={studentName}
                        onChange={(e) => {
                          setStudentName(e.target.value);
                          if (nameError) setNameError('');
                        }}
                        placeholder="e.g. K. Vignesh"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          nameError ? 'border-rose-500' : 'border-[#E2E8F0]'
                        } rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                      />
                    </div>
                    {nameError && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{nameError}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-phone" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                      Mobile Number (Optional at this step)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder="e.g. 98424 51220"
                        className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                          phoneError ? 'border-rose-500' : 'border-[#E2E8F0]'
                        } rounded-xl text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]`}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-parent-name" className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
                    Parent / Guardian Name (Optional)
                  </label>
                  <input
                    id="signup-parent-name"
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="e.g. Mr. S. Kannan (Father)"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-editorial space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0F172A]">
                2. Select Education Board
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
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-editorial'
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

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-editorial space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#0F172A]">
                3. Select Student Class / Grade
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
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-editorial font-bold'
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
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98"
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
