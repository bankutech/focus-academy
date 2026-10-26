import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  User, 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useStudentAuth } from '../context/StudentAuthContext';
import { useStudentFlow } from '../context/useAppContext';
import { validateIndianMobile } from '../types/schemas';

export default function StudentRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated, loading, error, clearError } = useStudentAuth();
  const { studentFlow, updateStudentFlow } = useStudentFlow();

  const [studentName, setStudentName] = useState(studentFlow?.studentName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState(studentFlow?.phone || '');
  const [parentName, setParentName] = useState(studentFlow?.parentName || '');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState(studentFlow?.grade || 'Class 10');
  const [board, setBoard] = useState(studentFlow?.board || 'TN State Board (Samacheer)');
  
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/student-dashboard';

  useEffect(() => {
    document.title = 'Student Registration | Focus Academy';
  }, []);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, from, navigate]);

  const gradeOptions = [
    { id: 'Class 8', label: 'Class 8 (Foundation)' },
    { id: 'Class 9', label: 'Class 9 (Pre-Board)' },
    { id: 'Class 10', label: 'Class 10 (SSLC Board)' },
    { id: 'Class 11', label: 'Class 11 (Senior STEM / Commerce)' },
    { id: 'Class 12', label: 'Class 12 (HSC Board)' },
    { id: 'Repeater / Dropper', label: 'NEET / JEE Target Batches' },
  ];

  const boardOptions = [
    { id: 'TN State Board (Samacheer)', name: 'TN State Board (Samacheer Kalvi)' },
    { id: 'CBSE Board', name: 'CBSE (NCERT Blueprint)' },
    { id: 'ICSE Board', name: 'ICSE / ISC Curriculum' },
  ];

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!studentName.trim() || studentName.trim().length < 2) {
      setLocalError('Please enter the student\'s full legal name.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Please provide a valid email address.');
      return;
    }

    const phoneValidation = validateIndianMobile(mobile);
    if (!phoneValidation.valid) {
      setLocalError(phoneValidation.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!password || password.length < 6) {
      setLocalError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify your password.');
      return;
    }

    if (parentPhone.trim()) {
      const pValidation = validateIndianMobile(parentPhone);
      if (!pValidation.valid) {
        setLocalError('Parent phone number must be a valid 10-digit mobile number.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        studentName: studentName.trim(),
        mobile: phoneValidation.sanitized,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim() ? validateIndianMobile(parentPhone).sanitized : '',
        grade,
        board,
      });

      // Synchronize student flow with registration details
      updateStudentFlow({
        studentName: studentName.trim(),
        phone: phoneValidation.sanitized,
        parentName: parentName.trim(),
        grade,
        board,
        step: Math.max(studentFlow?.step || 1, 2)
      });

      // Navigation is triggered by useEffect on isAuthenticated
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Please verify your information and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="w-7 h-7 text-[#EA580C]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Create Student Account
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            Register with Focus Academy to view batch schedules, manage your enrolled courses, and track academic progress.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {displayError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 leading-relaxed font-medium">
                {displayError}
              </div>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Student's Full Name"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Student Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                We'll send verification and admission confirmations to this address.
              </p>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Academic Class & Board */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Class / Grade <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all cursor-pointer"
                  >
                    {gradeOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  School Board <span className="text-rose-500">*</span>
                </label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all cursor-pointer"
                >
                  {boardOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parent Details (Optional) */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Parent / Guardian Information (Recommended)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Father / Mother name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Parent Contact Mobile
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#EA580C] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Privacy & Academy Code */}
            <div className="flex items-start gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                By creating an account, you agree to Focus Academy's classroom discipline code, batch timing integrity, and privacy standards. Your contact details remain confidential.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Your Student Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Student Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-[#EA580C] hover:underline cursor-pointer"
              >
                Sign in to Student Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
