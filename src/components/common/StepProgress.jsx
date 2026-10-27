import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { useStudentFlow } from '../../context/useAppContext';

export default function StepProgress({ currentStep }) {
  const { studentFlow } = useStudentFlow();
  const batchId = studentFlow.selectedBatchId || 'batch-10-state-board';

  const steps = [
    { number: 1, title: '1. Student Details', path: '/student-details' },
    { number: 2, title: '2. Exam Prep', path: '/exam-prep' },
    { number: 3, title: '3. Batches', path: '/batches' },
    { number: 4, title: '4. Batch Selection', path: `/batch/${batchId}` },
    { number: 5, title: '5. Enrollment', path: `/enroll/${batchId}` },
  ];

  return (
    <div className="bg-white border-b border-[#E2E8F0] py-3.5 px-4 sticky top-16 z-30 shadow-xs">
      <div
        role="region"
        aria-label="Admission progress steps"
        tabIndex={0}
        className="max-w-5xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand rounded-md"
      >
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <React.Fragment key={step.number}>
              <div className="flex items-center space-x-2 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 border border-[#E2E8F0]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.number}
                </div>

                {isCompleted ? (
                  <Link
                    to={step.path}
                    className="text-xs font-semibold text-slate-600 hover:text-brand transition-colors"
                  >
                    {step.title}
                  </Link>
                ) : (
                  <span
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-[#0F172A] font-bold' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                )}
              </div>

              {idx < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
