import React from 'react';
import { Link } from 'react-router-dom';
import FeeCalculator from '../components/FeeCalculator';
import { useModals } from '../context/useAppContext';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function FeesPage() {
  const { openDemoModal } = useModals();

  return (
    <div className="pt-8 pb-12 sm:pt-10 sm:pb-14 bg-[#F8FAFC] min-h-screen text-left">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2.5">
            <Link to="/" className="hover:text-[#EA580C]">Home</Link>
            <span>/</span>
            <span className="text-[#0F172A] font-bold">Tuition Fees & Calculator</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
              Calculate Your Monthly Tuition
            </h1>

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Simple, honest pricing. Includes all worksheets, weekly mock tests, and 1-on-1 doubt clearing.
              </p>

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white rounded-full border border-[#E2E8F0] text-xs text-emerald-800 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-bold">Flexible Monthly Model: Pay month-by-month as your child progresses</span>
              </div>
            </div>
          </div>
        </div>

        <FeeCalculator onOpenDemoModal={openDemoModal} onSelectPackage={(pkg) => openDemoModal(pkg.grade)} />

        <div className="mt-6 mb-10 bg-white rounded-3xl p-5 sm:p-6 border border-[#E2E8F0] shadow-editorial flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="max-w-2xl">
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
              Have multiple children or need special subject combinations?
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              We offer a 10% sibling discount and tailored combinations for students needing support across mathematics, science, and languages.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              to="/batches"
              className="w-full md:w-auto min-h-[44px] inline-flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl shadow-editorial transition-all active:scale-98"
            >
              <span>Check Batch Timings & Enroll</span>
              <ArrowRight className="w-3.5 h-3.5 text-orange-200" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
