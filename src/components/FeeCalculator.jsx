import React, { useState } from 'react';
import { 
  ArrowRight, 
  TrendingDown, 
  CheckCircle2, 
  Building2, 
  Laptop 
} from 'lucide-react';

export default function FeeCalculator({ onOpenDemoModal }) {
  const [grade, setGrade] = useState('class-10');
  const [board, setBoard] = useState('State Board');
  const [center, setCenter] = useState('Thoramangalam');
  const [mode, setMode] = useState('classroom');
  const [hoursPerWeek, setHoursPerWeek] = useState(4);

  const baseMonthlyFees = {
    'class-1-5': 1500,
    'class-6-8': 1800,
    'class-9-10': 2400,
    'class-11-12': 2800,
    'iit-jee-neet': 3200,
    'languages': 2000,
    'it-coding': 2400,
    'hobbies': 1600,
  };

  const boardMultiplier = {
    'State Board': 1.0,
    'CBSE': 1.05,
    'ICSE': 1.1,
    'Other': 1.0,
  };

  const modeMultiplier = mode === 'classroom' ? 1.0 : 0.95;

  const hoursFactor = hoursPerWeek / 4;

  const estimatedMonthlyFee = Math.round(
    (baseMonthlyFees[grade] || 2400) * 
    (boardMultiplier[board] || 1.0) * 
    modeMultiplier * 
    (hoursFactor > 0.8 ? hoursFactor : 0.8)
  );

  const monthlyHours = hoursPerWeek * 4;
  const discountedPackageFee = Math.round(estimatedMonthlyFee * 0.88);

  const getFriendlyGradeLabel = (g) => {
    switch(g) {
      case 'class-6-8': return 'Class 6 to 8 (Middle School Foundation)';
      case 'class-9-10': return 'Class 9 & 10 (SSLC / Board Exam Focus)';
      case 'class-11-12': return 'Class 11 & 12 (Higher Secondary HSC & CBSE)';
      case 'iit-jee-neet': return 'NEET & JEE Academic Foundation';
      default: return 'Class 10 (Board Exam Focus)';
    }
  };

  const handleBookTrial = () => {
    const selectedGradeLabel = getFriendlyGradeLabel(grade);
    const modeLabel = mode === 'classroom' ? 'Classroom Batch' : 'Online Session';
    onOpenDemoModal(`Fee Inquiry: ${selectedGradeLabel} (${board}) at ${center} • ${modeLabel} at ₹${estimatedMonthlyFee}/mo`);
  };

  return (
    <div id="fee-calculator" className="bg-white rounded-3xl border border-[#E8E2D8] shadow-editorial-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-4">
      <div className="p-6 sm:p-7 lg:col-span-7 space-y-4 border-b lg:border-b-0 lg:border-r border-[#E8E2D8]">
        <div>
          <label htmlFor="calculator-grade" className="block font-code-mono text-[10px] uppercase tracking-wider text-[#78716C] mb-1.5 font-bold">
            1. Select Class / Grade
          </label>
          <select
            id="calculator-grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full min-h-[44px] bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
          >
            <option value="class-6-8">Class 6 to 8 (Middle School Foundation)</option>
            <option value="class-9-10">Class 9 & 10 (SSLC / Board Exam Focus)</option>
            <option value="class-11-12">Class 11 & 12 (Higher Secondary HSC & CBSE)</option>
            <option value="iit-jee-neet">NEET & JEE Academic Foundation</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="calculator-board" className="block font-code-mono text-[10px] uppercase tracking-wider text-[#78716C] mb-1.5 font-bold">
              2. Board (CBSE / State Board)
            </label>
            <select
              id="calculator-board"
              value={board}
              onChange={(e) => setBoard(e.target.value)}
              className="w-full min-h-[44px] bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
            >
              <option value="State Board">TN State Board (Samacheer)</option>
              <option value="CBSE">CBSE Board (NCERT)</option>
              <option value="ICSE">ICSE / ISC Board</option>
              <option value="Other">Foundation / Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="calculator-center" className="block font-code-mono text-[10px] uppercase tracking-wider text-[#78716C] mb-1.5 font-bold">
              3. Campus Location
            </label>
            <select
              id="calculator-center"
              value={center}
              onChange={(e) => setCenter(e.target.value)}
              className="w-full min-h-[44px] bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-semibold text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
            >
              <option value="Thoramangalam">Thiripura Complex, Thoramangalam (Main Center)</option>
              <option value="Four Roads Access">Four Roads / Rajanagar Campus Desk</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-code-mono text-[10px] uppercase tracking-wider text-[#78716C] mb-1.5 font-bold">
            4. Batch Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('classroom')}
              className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                mode === 'classroom'
                  ? 'bg-[#181614] text-white border-[#181614] shadow-xs'
                  : 'bg-[#FAF7F2] text-[#57534E] border-[#E8E2D8] hover:bg-[#EBE5DC]'
              }`}
            >
              <Building2 className={`w-4 h-4 ${mode === 'classroom' ? 'text-[#FED7AA]' : 'text-[#C2410C]'}`} />
              <span>Classroom Center Batch</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('online')}
              className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-2 ${
                mode === 'online'
                  ? 'bg-[#181614] text-white border-[#181614] shadow-xs'
                  : 'bg-[#FAF7F2] text-[#57534E] border-[#E8E2D8] hover:bg-[#EBE5DC]'
              }`}
            >
              <Laptop className={`w-4 h-4 ${mode === 'online' ? 'text-[#FED7AA]' : 'text-[#C2410C]'}`} />
              <span>Online Interactive</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="calculator-frequency" className="font-code-mono text-[10px] uppercase tracking-wider text-[#78716C] font-bold">
              5. Weekly Class Hours
            </label>
            <span className="font-code-mono text-xs font-bold text-[#C2410C] bg-[#FAF7F2] px-2.5 py-0.5 rounded-lg border border-[#E8E2D8]">
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
            className="w-full accent-[#C2410C] cursor-pointer"
          />
          <div className="flex justify-between font-code-mono text-[10px] text-[#A8A29E] mt-1">
            <span>2 hrs (Catch-up)</span>
            <span>4 hrs (Recommended Standard)</span>
            <span>8 hrs (Intensive)</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 lg:col-span-5 bg-[#FAF7F2] flex flex-col justify-between text-left">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
            <span className="font-code-mono text-[10px] uppercase font-bold text-[#78716C] tracking-wider">
              Estimated Monthly Fee
            </span>
            <span className="text-[10px] font-code-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              All Study Materials Included
            </span>
          </div>

          <div className="mt-4">
            <span className="font-code-mono text-[10px] uppercase text-[#78716C] block">
              Standard Monthly Tuition
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="font-code-mono text-3xl sm:text-4xl font-black text-[#181614]">
                ₹{estimatedMonthlyFee.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-[#78716C]">/ month</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E2D8] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#57534E]">
              <span>Estimated Batch Sessions:</span>
              <span className="font-code-mono font-bold text-[#181614]">{monthlyHours} Hours / Month</span>
            </div>

            <div className="flex justify-between text-[#C2410C] font-semibold">
              <span className="flex items-center space-x-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Quarterly Concession (12% Off):</span>
              </span>
              <span className="font-code-mono font-bold">₹{discountedPackageFee.toLocaleString('en-IN')}/mo</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-2xl bg-white border border-[#E8E2D8] text-[11px] text-[#57534E] space-y-1 shadow-editorial-inset">
            <p className="font-bold text-[#181614] font-code-mono text-[10px] uppercase">
              ✓ What Is Included in This Fee:
            </p>
            <ul className="space-y-1 text-[#57534E]">
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
            className="w-full min-h-[46px] py-3 px-4 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs rounded-xl shadow-editorial transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>Book 1-Day Free Trial at this Rate</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FED7AA]" />
          </button>
        </div>
      </div>
    </div>
  );
}
