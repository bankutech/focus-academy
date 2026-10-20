import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  ArrowRight, 
  Edit2 
} from 'lucide-react';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow } from '../context/useAppContext';

export default function ExamPrepPage() {
  const navigate = useNavigate();
  const { studentFlow, updateStudentFlow } = useStudentFlow();

  const grade = studentFlow.grade || 'Class 10';
  const board = studentFlow.board || 'TN State Board (Samacheer)';

  const availableTracks = useMemo(() => {
    if (grade.includes('10')) {
      return [
        {
          id: '10th Board Exam Mastery (Target 95%+)',
          title: 'Class 10 Board Exam Mastery (Target 95%+)',
          category: 'Board Excellence',
          badge: 'Most Selected Track',
          desc: 'Comprehensive coverage of Board exam blueprints (Maths, Physics, Chemistry, Biology). In-depth Samacheer/NCERT problem solving and past 10-year question paper drills.',
          points: [
            'Full syllabus completion with formula flashcards',
            'Weekly Saturday timed board-replica mock tests',
            'Step-by-step marking rubrics to maximize score'
          ]
        },
        {
          id: 'Maths & Science Conceptual Clarity',
          title: 'Mathematics & Science Conceptual Clarity',
          category: 'Concept Building',
          badge: 'Foundation Clarity',
          desc: 'Focused coaching to eliminate math fear and science confusion. Daily 15-minute doubt clearance after class so students never leave with unanswered doubts.',
          points: [
            'Step-by-step geometry proofs and algebra factoring',
            'Hands-on physics and chemistry concept clarity',
            'Daily homework checks and personalized help'
          ]
        },
        {
          id: 'Board Mock Test Series & Revision Drills',
          title: 'Board Mock Exam Series & Time Management',
          category: 'Exam Practice',
          badge: 'Revision & Speed',
          desc: 'Intensive answer-writing practice, blueprint analysis, and speed drills to ensure students finish their 3-hour board examination with 20 minutes for revision.',
          points: [
            'Evaluated answer sheets returned with teacher feedback',
            'Answer presentation and neatness coaching',
            'Frequent chapter-wise rapid-fire diagnostic tests'
          ]
        }
      ];
    }

    if (grade.includes('12')) {
      return [
        {
          id: '12th Higher Secondary Board Exams (HSC / CBSE)',
          title: 'Class 12 Board Exam 95%+ Target Track',
          category: 'Senior Board',
          badge: 'High Yield',
          desc: 'Master higher secondary derivations, organic reaction mechanisms, and calculus problem solving. Designed for 12th board candidates aiming for top percentile.',
          points: [
            'Derivations master book and physics formula cards',
            'Organic mechanism flowcharts and reactions drills',
            'Saturday board-replica test evaluated on official rubrics'
          ]
        },
        {
          id: 'NEET & JEE Academic Foundation',
          title: 'NEET & JEE Numerical Clarity & Foundation',
          category: 'Competitive Foundation',
          badge: 'Entrance Ready',
          desc: 'Deep NCERT line-by-line deconstruction and numerical problem solving for students preparing for medical and engineering entrance examinations.',
          points: [
            'High-yield numerical drills across Physics & Chemistry',
            'Eliminating conceptual confusion in mechanics & bonding',
            'Speed and accuracy shortcuts without guessing'
          ]
        },
        {
          id: 'Physics & Chemistry Core Revision',
          title: 'Physics & Chemistry Core Problem Solving',
          category: 'Subject Core',
          badge: 'Targeted Gap Fix',
          desc: 'Dedicated coaching for students finding Class 12 Physics derivations and Physical Chemistry calculations challenging.',
          points: [
            'Step-by-step guidance on calculus-based derivations',
            'Equilibrium, thermodynamics & electrochemistry drills',
            'Daily 15-minute personal doubt session'
          ]
        }
      ];
    }

    if (grade.includes('9') || grade.includes('11')) {
      return [
        {
          id: 'School Annual Examinations & High-Score Prep',
          title: `${grade} School Exam Preparation & Rank Target`,
          category: 'Curriculum Core',
          badge: 'School Success',
          desc: 'Master the full school syllabus with systematic chapter worksheets, numerical practice, and periodic unit test preparation.',
          points: [
            'Complete school textbook syllabus coverage',
            'Regular homework guidance and formula notebooks',
            'Preparation aligned with school exam blueprints'
          ]
        },
        {
          id: 'Pre-Board Bridge Foundation',
          title: `${grade} Pre-Board Bridge & Board Readiness`,
          category: 'Bridge Foundation',
          badge: 'Zero Learning Debt',
          desc: 'Build strong conceptual bridges in algebra, physics equations, and chemistry fundamentals before entering your board examination year.',
          points: [
            'Eliminate syllabus gaps from previous standards',
            'Early exposure to board-style analytical questions',
            'Small-batch attention to build genuine academic discipline'
          ]
        }
      ];
    }

    return [
      {
        id: 'School Term Exams & Foundation Excellence',
        title: 'Middle School Science & Math Foundation',
        category: 'Junior Foundation',
        badge: 'Recommended',
        desc: 'Build curious minds and solid academic discipline. Daily arithmetic exercises, geometry proofs, and intuitive science experiments that replace blind memorization.',
        points: [
          'Early evening timing (4:30 PM - 6:00 PM) fits school schedule',
          'Eliminates homework stress with daily classroom guidance',
          'Regular mental arithmetic and speed math exercises'
        ]
      },
      {
        id: 'Conceptual Clarity & Homework Guidance',
        title: 'Conceptual Clarity & Daily Study Routine',
        category: 'Habit & Clarity',
        badge: 'Stress-Free',
        desc: 'A friendly and encouraging learning environment where students freely ask doubts and build lifelong study habits.',
        points: [
          'Patient 1-on-1 explanations with real-life examples',
          'Reading fluency and handwriting clarity support',
          'Monthly parent progress updates'
        ]
      }
    ];
  }, [grade]);

  const [selectedGoal, setSelectedGoal] = useState(
    studentFlow.examPrep || availableTracks[0]?.id || ''
  );
  const [customGoal, setCustomGoal] = useState('');

  const handleContinue = (e) => {
    e.preventDefault();
    const finalGoal = customGoal.trim() ? customGoal.trim() : selectedGoal;
    updateStudentFlow({ examPrep: finalGoal });
    navigate('/batches');
  };

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-left">
      <StepProgress currentStep={2} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-6 bg-white p-4 rounded-2xl border border-[#E8E2D8] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-code-mono text-[#57534E]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Student: <strong className="text-[#181614]">{studentFlow.studentName || 'New Student'}</strong></span>
            <span>•</span>
            <span>Class: <strong className="text-[#C2410C]">{grade}</strong></span>
            <span>•</span>
            <span>Board: <strong className="text-[#181614]">{board}</strong></span>
          </div>

          <Link
            to="/student-details"
            className="inline-flex items-center space-x-1 text-xs font-code-mono text-[#C2410C] hover:underline"
          >
            <Edit2 className="w-3 h-3" />
            <span>Change Details</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-[#181614] tracking-tight">
            What Are You Preparing For?
          </h1>
          <p className="text-sm text-[#57534E] mt-1">
            Select the primary academic focus so we can present the exact evening batch timetable and seat availability.
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-6">
          <div className="space-y-4">
            {availableTracks.map((track) => {
              const isSelected = selectedGoal === track.id && !customGoal.trim();
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    setSelectedGoal(track.id);
                    setCustomGoal('');
                  }}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#C2410C] shadow-editorial-lg ring-2 ring-[#C2410C]/10'
                      : 'bg-white/70 hover:bg-white border-[#E8E2D8] shadow-editorial'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          isSelected
                            ? 'bg-[#C2410C] border-[#C2410C] text-white'
                            : 'bg-white border-[#D6D3D1]'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[10px] font-code-mono uppercase font-bold px-2 py-0.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded text-[#C2410C]">
                            {track.badge}
                          </span>
                          <span className="text-xs font-code-mono text-[#78716C]">
                            {track.category}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-[#181614]">
                          {track.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#57534E] mt-1.5 leading-relaxed">
                          {track.desc}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-code-mono text-[#78716C]">
                          {track.points.map((pt, i) => (
                            <span key={i} className="flex items-center space-x-1">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span>{pt}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8E2D8]">
            <label className="block text-xs font-code-mono font-bold uppercase text-[#78716C] mb-1.5">
              Or Specify Your Custom Learning Goal (Optional)
            </label>
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g. Need extra help in Class 10 Trigonometry & Physics electricity derivations..."
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs sm:text-sm text-[#181614] focus:outline-hidden focus:border-[#C2410C]"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <Link
              to="/student-details"
              className="text-xs font-semibold text-[#78716C] hover:text-[#181614]"
            >
              ← Back to Student Details
            </Link>

            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white text-sm font-bold rounded-xl shadow-editorial transition-all cursor-pointer active:scale-98"
            >
              <span>View Available Batches (Step 3)</span>
              <ArrowRight className="w-4 h-4 text-[#FED7AA]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
