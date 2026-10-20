import React from 'react';
import { Link } from 'react-router-dom';
import FeeCalculator from '../components/FeeCalculator';
import { useModals } from '../context/useAppContext';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function FeesPage() {
  const { openDemoModal } = useModals();

  return (
    <div className="pt-8 pb-12 sm:pt-10 sm:pb-14 bg-[#FAF7F2] min-h-screen text-left">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-xs font-code-mono text-[#78716C] mb-2.5">
            <Link to="/" className="hover:text-[#C2410C]">Home</Link>
            <span>/</span>
            <span className="text-[#181614] font-bold">Tuition Fees & Calculator</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#181614] tracking-tight leading-tight">
              Calculate Your Monthly Tuition
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <p className="text-sm sm:text-base text-[#57534E] leading-relaxed">
                Simple, honest pricing. Includes all worksheets, weekly mock tests, and 1-on-1 doubt clearing.
              </p>

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white rounded-full border border-[#E8E2D8] text-xs font-code-mono text-emerald-800 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold">Flexible Monthly Model: Pay month-by-month as your child progresses</span>
              </div>
            </div>
          </div>
        </div>

        <FeeCalculator onOpenDemoModal={openDemoModal} />

        <div className="mt-6 mb-10 bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E2D8] shadow-editorial flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="max-w-2xl">
            <h3 className="text-base sm:text-lg font-bold text-[#181614]">
              Have multiple children or need special subject combinations?
            </h3>
            <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
              We offer a 10% sibling discount and tailored combinations for students needing support across mathematics, science, and languages.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              to="/batches"
              className="w-full md:w-auto min-h-[44px] inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-xs font-bold rounded-xl shadow-editorial transition-all active:scale-98"
            >
              <span>Check Batch Timings & Enroll</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FED7AA]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
