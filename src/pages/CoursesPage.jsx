import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  ArrowRight, 
  PhoneCall 
} from 'lucide-react';
import { categoriesData } from '../data/categoriesData';
import { CAMPUS_CONFIG } from '../config/campusConfig';

export default function CoursesPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [selectedBoard, setSelectedBoard] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedGoal, setSelectedGoal] = useState('all');
  const [expandedSyllabusId, setExpandedSyllabusId] = useState(null);

  const toggleSyllabus = (courseId) => {
    setExpandedSyllabusId((prev) => (prev === courseId ? null : courseId));
  };

  const boards = [
    { id: 'all', label: 'All Boards' },
    { id: 'state', label: 'TN State Board (Samacheer)' },
    { id: 'cbse', label: 'CBSE Board (NCERT)' },
    { id: 'foundation', label: 'NEET / JEE Foundation' },
  ];

  const grades = [
    { id: 'all', label: 'All Classes' },
    { id: 'class-6-8', label: 'Classes 6 – 8 (Middle)' },
    { id: 'class-9', label: 'Class 9 (Pre-Board)' },
    { id: 'class-10', label: 'Class 10 (SSLC / Board)' },
    { id: 'class-11', label: 'Class 11 (Senior Core)' },
    { id: 'class-12', label: 'Class 12 (HSC / Board)' },
  ];

  const goals = [
    { id: 'all', label: 'All Preparation Goals' },
    { id: 'board-exam', label: 'Board Exam 95%+ Marks Target' },
    { id: 'concept-clarity', label: 'Math & Science Conceptual Clarity' },
    { id: 'competitive', label: 'NEET & JEE Numerical Foundation' },
    { id: 'doubt-clearing', label: 'Daily Doubt Clearance & Homework Support' },
  ];

  const allCourses = useMemo(() => {
    const list = [];
    categoriesData.forEach(cat => {
      cat.items.forEach(item => {
        list.push({ ...item, categoryName: cat.name, categoryId: cat.id });
      });
    });
    return list;
  }, []);

  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      if (selectedBoard === 'state') {
        if (!course.category.toLowerCase().includes('state board') && !course.title.toLowerCase().includes('state')) {
          return false;
        }
      } else if (selectedBoard === 'cbse') {
        if (!course.category.toLowerCase().includes('cbse') && !course.title.toLowerCase().includes('cbse')) {
          return false;
        }
      } else if (selectedBoard === 'foundation') {
        if (!course.category.toLowerCase().includes('foundation') && !course.title.toLowerCase().includes('foundation') && !course.title.toLowerCase().includes('competitive')) {
          return false;
        }
      }

      if (selectedGrade !== 'all') {
        if (selectedGrade === 'class-6-8' && !(course.id.includes('6') || course.id.includes('7') || course.id.includes('8') || course.title.includes('6') || course.title.includes('7') || course.title.includes('8'))) {
          return false;
        }
        if (selectedGrade === 'class-9' && !course.title.includes('9') && !course.id.includes('9')) {
          return false;
        }
        if (selectedGrade === 'class-10' && !course.title.includes('10') && !course.id.includes('10')) {
          return false;
        }
        if (selectedGrade === 'class-11' && !course.title.includes('11') && !course.id.includes('11')) {
          return false;
        }
        if (selectedGrade === 'class-12' && !course.title.includes('12') && !course.id.includes('12')) {
          return false;
        }
      }

      if (selectedGoal !== 'all') {
        if (selectedGoal === 'board-exam' && !course.title.toLowerCase().includes('board') && !course.description.toLowerCase().includes('board')) {
          return false;
        }
        if (selectedGoal === 'concept-clarity' && !course.description.toLowerCase().includes('concept') && !course.description.toLowerCase().includes('fundamental') && !course.description.toLowerCase().includes('coverage')) {
          return false;
        }
        if (selectedGoal === 'competitive' && !course.category.toLowerCase().includes('foundation') && !course.title.toLowerCase().includes('foundation') && !course.description.toLowerCase().includes('foundation')) {
          return false;
        }
        if (selectedGoal === 'doubt-clearing' && !course.description.toLowerCase().includes('test') && !course.description.toLowerCase().includes('support') && !course.description.toLowerCase().includes('comprehensive')) {
          return false;
        }
      }

      if (initialSearch.trim()) {
        const query = initialSearch.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesCat = course.category.toLowerCase().includes(query);
        const matchesSubj = course.popularSubjects.some(s => s.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCat && !matchesSubj) {
          return false;
        }
      }

      return true;
    });
  }, [allCourses, selectedBoard, selectedGrade, selectedGoal, initialSearch]);

  const handleResetFilters = () => {
    setSelectedBoard('all');
    setSelectedGrade('all');
    setSelectedGoal('all');
  };

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC] min-h-screen text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-2">
            <Link to="/" className="hover:text-[#EA580C]">Home</Link>
            <span>/</span>
            <span className="text-[#0F172A] font-bold">Class & Board Selection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tight">
            Academic Programs & Preparation Tracks
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
            Select your Board, Grade, and what you are preparing for to view our tailored coaching curriculum and evening batch options at Thiripura Complex, Thoramangalam.
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 sm:p-8 border border-[#E2E8F0] shadow-xs mb-12 space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">1</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Select Your Curriculum Board:
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {boards.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBoard(b.id)}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedBoard === b.id
                      ? 'bg-[#EA580C] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-[#E2E8F0]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                Select Student's Grade / Class:
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {grades.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGrade(g.id)}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedGrade === g.id
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-[#E2E8F0]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                What are you preparing for? (Preparation Goal):
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {goals.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedGoal === goal.id
                      ? 'bg-[#0F172A] text-orange-200 shadow-xs border border-[#EA580C]'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-[#E2E8F0]'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          {(selectedBoard !== 'all' || selectedGrade !== 'all' || selectedGoal !== 'all') && (
            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing {filteredCourses.length} matching curriculum track{filteredCourses.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[#EA580C] hover:underline font-bold cursor-pointer"
              >
                Reset All Filters ↺
              </button>
            </div>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-[#E2E8F0] shadow-xs max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#0F172A]">No Direct Courses Matching Selection</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              We offer personalized evening tuition for all students from Classes 6 to 12. Speak with our campus coordinator to arrange custom subject coaching.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-md cursor-pointer"
              >
                Reset Filters
              </button>
              <a
                href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
                className="px-4 py-2 bg-[#EA580C] text-white text-xs font-bold rounded-md cursor-pointer"
              >
                Call Counselor: {CAMPUS_CONFIG.contact.primaryPhone}
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs hover:border-[#EA580C]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-[#0F172A] overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover filter contrast-[102%] hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-md text-[#0F172A] shadow-xs">
                        {course.tag}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between text-xs">
                      <span>Focus Academy Thoramangalam</span>
                      <span className="text-emerald-300 font-bold">1:12 Small Batch</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-xs text-[#EA580C] font-bold uppercase mb-1">
                      {course.category}
                    </div>
                    
                    <h3 className="text-lg font-bold text-[#0F172A] leading-snug">
                      {course.title}
                    </h3>

                    <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {course.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-500 uppercase font-bold block mb-2">
                        Key Subjects Included:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {course.popularSubjects.map((subj, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-[#E2E8F0]"
                          >
                            {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="p-3.5 bg-slate-50 rounded-md border border-[#E2E8F0] flex items-center justify-between mb-4">
                    <div>
                      <span className="block text-xs text-slate-500">Tuition Model</span>
                      <span className="text-xs font-bold text-[#0F172A]">Monthly Flexible</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-slate-500">Timings</span>
                      <span className="text-xs font-bold text-[#EA580C]">4:00 PM – 9:00 PM</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => toggleSyllabus(course.id)}
                      className="flex-1 py-2 px-3 text-xs font-semibold rounded-md border border-[#E2E8F0] bg-slate-50 hover:bg-slate-100 text-[#0F172A] transition-colors cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>{expandedSyllabusId === course.id ? 'Hide Syllabus' : 'Syllabus Details'}</span>
                      <span className="text-xs text-[#EA580C] font-bold">{expandedSyllabusId === course.id ? '▲' : '▼'}</span>
                    </button>

                    <Link
                      to="/contact"
                      className="py-2 px-3 text-xs font-semibold rounded-md border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#EA580C] transition-colors cursor-pointer"
                    >
                      Inquire
                    </Link>
                  </div>

                  {expandedSyllabusId === course.id && (
                    <div className="p-3 bg-white rounded-md border border-[#E2E8F0] mb-3 text-xs space-y-1.5 animate-in fade-in">
                      <span className="text-xs uppercase font-bold text-[#EA580C] block">
                        Curriculum Highlights:
                      </span>
                      <p className="text-slate-600 leading-relaxed text-xs">
                        Structured NCERT & Samacheer blueprint coverage with step-by-step numerical drills, chapter formula sheets, and Saturday timed mock exams.
                      </p>
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Small Batch: Max 12 Seats</span>
                        <Link to="/contact" className="text-[#EA580C] font-bold hover:underline">
                          Enroll in Batch →
                        </Link>
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/batches?course=${course.id}&grade=${encodeURIComponent(
                      course.id.includes('12') ? 'Class 12' :
                      course.id.includes('11') ? 'Class 11' :
                      course.id.includes('10') ? 'Class 10' :
                      course.id.includes('9') ? 'Class 9' :
                      'Class 6'
                    )}`}
                    className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-[#0F172A] hover:bg-[#EA580C] text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer group"
                  >
                    <span>View Evening Batches & Timings</span>
                    <ArrowRight className="w-3.5 h-3.5 text-orange-200 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 bg-white rounded-lg p-6 sm:p-8 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-md bg-orange-50 text-[#EA580C] flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#0F172A]">Need guidance choosing between State Board & CBSE batches?</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Our academic counseling desk at Thiripura Complex provides complimentary syllabus guidance for parents.
              </p>
            </div>
          </div>

          <a
            href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
            className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-md shadow-xs whitespace-nowrap cursor-pointer shrink-0"
          >
            Call Campus Desk: {CAMPUS_CONFIG.contact.primaryPhone}
          </a>
        </div>
      </div>
    </div>
  );
}
