import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  ArrowRight, 
  Edit2 
} from 'lucide-react';
import StepProgress from '../components/common/StepProgress';
import { useStudentFlow, getStepRedirect } from '../context/useAppContext';

export default function ExamPrepPage() {
  const navigate = useNavigate();
  const { studentFlow, setStudentFlow } = useStudentFlow();

  const grade = studentFlow.grade || 'Class 10';
  const board = studentFlow.board || 'TN State Board (Samacheer)';

  const getPrepTracks = () => {
    if (grade.includes('10')) {
      return [
        {
          id: 'sslc-95-plus',
          title: 'Class 10 Board Exam 95%+ Target Track',
          badge: 'Top Recommendation',
          category: 'Board Focused',
          desc: 'Intensive coverage of Maths and Science blueprints with weekly Saturday 2-hour mock exams replicating exact board pattern.',
          points: [
            'Full blueprint coverage with step-by-step marking schemes',
            'Weekly Saturday timed mock tests with evaluated answer sheets',
            'Daily 15-minute doubt clinic directly with faculty'
          ]
        },
        {
          id: 'concept-mastery',
          title: 'Core Conceptual Foundations & Remedial Clinic',
          badge: 'Fundamentals',
          category: 'Subject Deep Dive',
          desc: 'Step-by-step rebuilding of fundamental algebraic factoring, geometry theorems, and physics mechanics for hesitant students.',
          points: [
            'Whiteboard problem-solving with 1:1 teacher supervision',
            'Zero embarrassment environment with max 12 students',
            'Daily individual notebook checking'
          ]
        },
        {
          id: 'foundation-olympiad',
          title: 'Early Foundation (IIT / NEET Orientation)',
          badge: 'Advanced Numericals',
          category: 'Competitive Edge',
          desc: 'High-order thinking questions (HOTS) and analytical problem-solving extending beyond the school syllabus.',
          points: [
            'Numerical speed and accuracy drills',
            'Concept linkage across secondary physics and chemistry'
          ]
        }
      ];
    }

    if (grade.includes('12')) {
      return [
        {
          id: 'hsc-board-95',
          title: 'Class 12 Higher Secondary Board Distinction (Centum Focus)',
          badge: 'Board Priority',
          category: 'Centum Drills',
          desc: 'Rigorous step-marking mastery in Physics derivations, Chemistry organic mechanisms, and Higher Mathematics calculus.',
          points: [
            'Past 10 years Tamil Nadu & CBSE question bank drills',
            'Saturday timed mock examinations under actual board conditions',
            'Personalized formula and reaction mechanism cheat sheets'
          ]
        },
        {
          id: 'neet-jee-foundations',
          title: 'NEET & JEE Main Integrated Numerical Focus',
          badge: 'Competitive Track',
          category: 'Entrance Foundations',
          desc: 'Daily numerical problem drills, short-cut verification techniques, and conceptual physics problem-solving.',
          points: [
            'Deep problem-solving sessions on the whiteboard',
            'Formula applications and dimensional analysis drills'
          ]
        }
      ];
    }

    if (grade.includes('11')) {
      return [
        {
          id: 'class-11-core',
          title: 'Class 11 Science & Mathematics Core Mastery',
          badge: 'Crucial Transition',
          category: 'Senior Foundation',
          desc: 'Transition smoothly from Class 10 to Class 11. Master advanced trigonometry, calculus basics, and organic chemistry foundations.',
          points: [
            'Bridging conceptual gaps between secondary and senior secondary',
            'Structured evening problem drills with step-by-step feedback'
          ]
        }
      ];
    }

    if (grade.includes('9')) {
      return [
        {
          id: 'class-9-preboard',
          title: 'Class 9 Pre-Board Foundation & Mathematical Accuracy',
          badge: 'Pre-Board Preparation',
          category: 'Middle to High School Bridge',
          desc: 'Prepare the foundation for Class 10 boards with thorough mastery of Coordinate Geometry, Polynomials, and Physics Laws of Motion.',
          points: [
            'Strengthening fundamentals before entering Class 10',
            'Daily notebook corrections to fix calculation errors early'
          ]
        }
      ];
    }

    return [
      {
        id: 'middle-school-foundations',
        title: 'Middle School Conceptual Clarity (Classes 6 – 8)',
        badge: 'Habit & Foundation',
        category: 'Study Discipline',
        desc: 'Build strong study habits, eliminate math anxiety, and develop clear scientific curiosity with daily evening homework support.',
        points: [
          'Daily homework checking and arithmetic clarity',
          'Small 12-student batch where hesitant students speak up freely'
        ]
      }
    ];
  };

  const availableTracks = getPrepTracks();
  const [selectedGoal, setSelectedGoal] = useState(
    studentFlow.examPrepId || availableTracks[0].id
  );
  const [customGoal, setCustomGoal] = useState(
    studentFlow.examPrep && !availableTracks.some(t => t.title === studentFlow.examPrep) 
      ? studentFlow.examPrep 
      : ''
  );

  const redirectPath = getStepRedirect(2, studentFlow);
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleContinue = (e) => {
    e.preventDefault();
    const chosenTrack = availableTracks.find((t) => t.id === selectedGoal);
    const finalGoalTitle = customGoal.trim() || (chosenTrack ? chosenTrack.title : 'Board Distinction');

    setStudentFlow((prev) => ({
      ...prev,
      examPrepId: selectedGoal,
      examPrep: finalGoalTitle,
      step: 3,
    }));

    navigate('/batches');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-left">
      <StepProgress currentStep={2} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-6 bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Student: <strong className="text-[#0F172A]">{studentFlow.studentName || 'New Student'}</strong></span>
            <span>•</span>
            <span>Class: <strong className="text-[#EA580C]">{grade}</strong></span>
            <span>•</span>
            <span>Board: <strong className="text-[#0F172A]">{board}</strong></span>
          </div>

          <Link
            to="/student-details"
            className="inline-flex items-center space-x-1 text-xs text-[#EA580C] hover:underline"
          >
            <Edit2 className="w-3 h-3" />
            <span>Change Details</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            What Are You Preparing For?
          </h1>
          <p className="text-sm text-slate-600 mt-1">
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
                  className={`p-5 sm:p-6 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#EA580C] shadow-sm ring-1 ring-[#EA580C]'
                      : 'bg-white hover:border-slate-300 border-[#E2E8F0] shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          isSelected
                            ? 'bg-[#EA580C] border-[#EA580C] text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs uppercase font-bold px-2 py-0.5 bg-orange-50 border border-orange-200 rounded text-[#EA580C]">
                            {track.badge}
                          </span>
                          <span className="text-xs text-slate-500">
                            {track.category}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                          {track.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                          {track.desc}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
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

          <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-xs">
            <label className="block text-xs uppercase font-bold text-slate-600 mb-1.5">
              Or Specify Your Custom Learning Goal (Optional)
            </label>
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g. Need extra help in Class 10 Trigonometry & Physics electricity derivations..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-md text-xs sm:text-sm text-[#0F172A] focus:outline-hidden focus:border-[#EA580C]"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <Link
              to="/student-details"
              className="text-xs font-semibold text-slate-500 hover:text-[#0F172A]"
            >
              ← Back to Student Details
            </Link>

            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold rounded-md shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <span>View Available Batches (Step 3)</span>
              <ArrowRight className="w-4 h-4 text-orange-200" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
