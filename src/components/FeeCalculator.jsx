import React, { useState } from 'react';
import { 
  Building2, 
  Laptop, 
  TrendingDown, 
  ArrowRight, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { calculateFee } from '../data/homeData';

export default function FeeCalculator({ onSelectPackage, onOpenDemoModal }) {
  const [grade, setGrade] = useState('class-9-10');
  const [board, setBoard] = useState('State Board');
  const [mode, setMode] = useState('classroom');
  const [hoursPerWeek, setHoursPerWeek] = useState(4);
  const [center, setCenter] = useState('Thoramangalam');
  const [hasSiblingDiscount, setHasSiblingDiscount] = useState(false);

  const hourlyRates = {
    'class-6-8': 180,
    'class-9-10': 220,
    'class-11-12': 280,
    'iit-jee-neet': 340,
  };

  const currentRate = hourlyRates[grade] || 220;
  const baseCalculatedFee = calculateFee(currentRate, hoursPerWeek);

  const modeMultiplier = mode === 'classroom' ? 1.0 : 0.9;
  const centerAdjustment = center === 'Thoramangalam' ? 1.0 : 1.05;
  const siblingMultiplier = hasSiblingDiscount ? 0.85 : 1.0;

  const estimatedMonthlyFee = Math.round(baseCalculatedFee * modeMultiplier * centerAdjustment * siblingMultiplier);
  const discountedPackageFee = Math.round(estimatedMonthlyFee * 0.88);
  const monthlyHours = hoursPerWeek * 4;

  const handleBookTrial = () => {
    const pkg = {
      grade,
      board,
      mode,
      center,
      hoursPerWeek,
      monthlyHours,
      hasSiblingDiscount,
      estimatedMonthlyFee,
      discountedPackageFee,
    };
    if (onSelectPackage) {
      onSelectPackage(pkg);
    }
    if (onOpenDemoModal) {
      const gradeMap = {
        'class-6-8': 'Classes 6–8 Foundation',
        'class-9-10': 'Class 10 State Board (SSLC)',
        'class-11-12': 'Class 12 Higher Mathematics',
        'iit-jee-neet': 'NEET / JEE Numerical Clarity',
      };
      onOpenDemoModal(gradeMap[grade] || 'Class 10 State Board (SSLC)');
    }
  };

  return (
    <div id="fee-calculator" className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-4">
      <div className="p-6 sm:p-7 lg:col-span-7 space-y-4 border-b lg:border-b-0 lg:border-r border-[#E2E8F0]">
        <div>
          <label htmlFor="calculator-grade" className="block text-xs uppercase tracking-wider text-slate-600 mb-1.5 font-bold">
            Class / Grade
          </label>
          <select
            id="calculator-grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full min-h-[44px] bg-slate-50 border border-[#E2E8F0] rounded-md px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand"
          >
            <option value="class-6-8">Class 6 to 8 (Middle School Foundation)</option>
            <option value="class-9-10">Class 9 & 10 (SSLC / Board Exam Focus)</option>
            <option value="class-11-12">Class 11 & 12 (Higher Secondary HSC & CBSE)</option>
            <option value="iit-jee-neet">NEET & JEE Academic Foundation</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="calculator-board" className="block text-xs uppercase tracking-wider text-slate-600 mb-1.5 font-bold">
              Curriculum Board
            </label>
            <select
              id="calculator-board"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full min-h-[44px] bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand"
            >
              <option value="State Board">TN State Board (Samacheer)</option>
              <option value="CBSE">CBSE Board (NCERT)</option>
              <option value="ICSE">ICSE / ISC Board</option>
              <option value="Other">Foundation / Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="calculator-center" className="block text-xs uppercase tracking-wider text-slate-600 mb-1.5 font-bold">
              Campus Location
            </label>
            <select
              id="calculator-center"
              value={center}
              onChange={(e) => setCenter(e.target.value)}
              className="w-full min-h-[44px] bg-slate-50 border border-[#E2E8F0] rounded-md px-3 py-2 text-xs font-semibold text-[#0F172A] focus:outline-hidden focus:border-brand"
            >
              <option value="Thoramangalam">Thiripura Complex, Thoramangalam (Main Center)</option>
              <option value="Four Roads Access">Four Roads / Rajanagar Campus Desk</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-600 mb-1.5 font-bold">
            Batch Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('classroom')}
              className={`min-h-[44px] py-2.5 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                mode === 'classroom'
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              <Building2 className={`w-4 h-4 ${mode === 'classroom' ? 'text-orange-100' : 'text-brand'}`} />
              <span>Classroom Center Batch</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('online')}
              className={`min-h-[44px] py-2.5 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                mode === 'online'
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              <Laptop className={`w-4 h-4 ${mode === 'online' ? 'text-orange-100' : 'text-brand'}`} />
              <span>Online Interactive</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-600 mb-1.5 font-bold">
            Sibling Concession
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setHasSiblingDiscount(false)}
              className={`min-h-[44px] py-2.5 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                !hasSiblingDiscount
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              <span>Single Student</span>
            </button>

            <button
              type="button"
              onClick={() => setHasSiblingDiscount(true)}
              className={`min-h-[44px] py-2.5 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                hasSiblingDiscount
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-[#E2E8F0] hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-brand" />
              <span>2+ Children (15% Off)</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="calculator-frequency" className="text-xs uppercase tracking-wider text-slate-600 font-bold">
              Weekly Class Hours
            </label>
            <span className="text-xs font-bold text-brand bg-orange-50 px-2.5 py-0.5 rounded border border-orange-200">
              {hoursPerWeek} Hours / Week ({monthlyHours} hrs/mo)
            </span>
          </div>
          <input
            id="calculator-frequency"
            type="range"
            min="2"
            max="8"
            step="1"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="w-full accent-brand cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>2 hrs (Catch-up)</span>
            <span>4 hrs (Recommended Standard)</span>
            <span>8 hrs (Intensive)</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 lg:col-span-5 bg-[#F8FAFC] flex flex-col justify-between text-left">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Estimated Monthly Fee
            </span>
            <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              All Study Materials Included
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs uppercase text-slate-500 block">
              Standard Monthly Tuition
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0F172A]">
                ₹{estimatedMonthlyFee.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500">/ month</span>
            </div>
            {hasSiblingDiscount && (
              <span className="inline-block mt-1 text-xs text-emerald-700 font-bold">
                ✓ 15% Sibling concession applied
              </span>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E2E8F0] space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Estimated Batch Sessions:</span>
              <span className="font-bold text-[#0F172A]">{monthlyHours} Hours / Month</span>
            </div>

            <div className="flex justify-between text-brand font-semibold">
              <span className="flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Quarterly Concession (12% Off):</span>
              </span>
              <span className="font-bold">₹{discountedPackageFee.toLocaleString('en-IN')}/mo</span>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-md bg-white border border-[#E2E8F0] text-xs text-slate-600 space-y-1">
            <p className="font-bold text-[#0F172A] text-xs uppercase">
              ✓ What Is Included in This Fee:
            </p>
            <ul className="space-y-1 text-slate-600">
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Strictly small 12-student evening batch teaching</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Weekly Saturday mock tests with evaluated answer sheets</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Printed formula books, chapter worksheets & question banks</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Daily 15-minute 1-on-1 doubt clearing clinic</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-2">
          <button
            type="button"
            onClick={handleBookTrial}
            className="w-full min-h-[46px] py-3 px-4 bg-brand hover:bg-brand-strong text-white font-bold text-xs rounded-md shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>Enroll at this Rate</span>
            <ArrowRight className="w-3.5 h-3.5 text-orange-100" />
          </button>
        </div>
      </div>
    </div>
  );
}
