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
        const matches = course.description.toLowerCase().includes('tamil nadu') ||
                        course.description.toLowerCase().includes('samacheer') ||
                        course.title.toLowerCase().includes('board');
        if (!matches) return false;
      } else if (selectedBoard === 'cbse') {
        const matches = course.description.toLowerCase().includes('cbse') ||
                        course.popularSubjects.some(s => s.toLowerCase().includes('cbse'));
        if (!matches && !course.title.toLowerCase().includes('board')) return false;
      } else if (selectedBoard === 'foundation') {
        const matches = course.categoryId === 'skill-test-prep' ||
                        course.title.toLowerCase().includes('foundation') ||
                        course.tag.toLowerCase().includes('competitive');
        if (!matches) return false;
      }

      if (selectedGrade === 'class-6-8') {
        if (!course.id.includes('class-6') && !course.id.includes('class-7') && !course.id.includes('class-8') && course.categoryId !== 'middle-school') {
          return false;
        }
      } else if (selectedGrade === 'class-9') {
        if (!course.id.includes('class-9') && !course.title.includes('Class 9')) return false;
      } else if (selectedGrade === 'class-10') {
        if (!course.id.includes('class-10') && !course.title.includes('Class 10')) return false;
      } else if (selectedGrade === 'class-11') {
        if (!course.id.includes('class-11') && !course.title.includes('Class 11')) return false;
      } else if (selectedGrade === 'class-12') {
        if (!course.id.includes('class-12') && !course.title.includes('Class 12')) return false;
      }

      if (selectedGoal === 'board-exam') {
        if (!course.tag.toLowerCase().includes('board') && !course.title.toLowerCase().includes('board')) return false;
      } else if (selectedGoal === 'concept-clarity') {
        if (!course.description.toLowerCase().includes('clarity') && !course.description.toLowerCase().includes('understanding') && !course.tag.toLowerCase().includes('foundation')) return false;
      } else if (selectedGoal === 'competitive') {
        if (!course.tag.toLowerCase().includes('competitive') && !course.title.toLowerCase().includes('neet')) return false;
      } else if (selectedGoal === 'doubt-clearing') {
        if (!course.id.includes('doubt') && !course.description.toLowerCase().includes('doubt')) return false;
      }

      if (initialSearch) {
        const term = initialSearch.toLowerCase();
        const matches = course.title.toLowerCase().includes(term) ||
                        course.description.toLowerCase().includes(term) ||
                        course.popularSubjects.some(s => s.toLowerCase().includes(term));
        if (!matches) return false;
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
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-screen text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center space-x-2 text-xs font-code-mono text-[#78716C] mb-2">
            <Link to="/" className="hover:text-[#C2410C]">Home</Link>
            <span>/</span>
            <span className="text-[#181614] font-bold">Class & Board Selection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#181614] tracking-tight">
            Academic Programs & Preparation Tracks
          </h1>
          <p className="mt-3 text-base text-[#57534E] max-w-3xl leading-relaxed">
            Select your Board, Grade, and what you are preparing for to view our tailored coaching curriculum and evening batch options at Thiripura Complex, Thoramangalam.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-editorial-lg mb-12 space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#181614] text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#181614] font-code-mono">
                Select Your Curriculum Board:
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {boards.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBoard(b.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedBoard === b.id
                      ? 'bg-[#C2410C] text-white shadow-editorial'
                      : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F4EFEA] border border-[#E8E2D8]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#FAF7F2]" />

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#181614] text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#181614] font-code-mono">
                Select Student's Grade / Class:
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {grades.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGrade(g.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedGrade === g.id
                      ? 'bg-[#181614] text-white shadow-editorial'
                      : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F4EFEA] border border-[#E8E2D8]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#FAF7F2]" />

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-[#181614] text-white text-[11px] font-bold flex items-center justify-center">3</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#181614] font-code-mono">
                What are you preparing for? (Preparation Goal):
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {goals.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedGoal === goal.id
                      ? 'bg-[#292524] text-[#FED7AA] shadow-editorial border border-[#C2410C]'
                      : 'bg-[#FAF7F2] text-[#57534E] hover:bg-[#F4EFEA] border border-[#E8E2D8]'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          {(selectedBoard !== 'all' || selectedGrade !== 'all' || selectedGoal !== 'all') && (
            <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs font-code-mono">
              <span className="text-[#78716C]">
                Showing {filteredCourses.length} matching curriculum track{filteredCourses.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[#C2410C] hover:underline font-bold cursor-pointer"
              >
                Reset All Filters ↺
              </button>
            </div>
          )}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E8E2D8] shadow-editorial max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-[#A8A29E] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#181614]">No Direct Courses Matching Selection</h3>
            <p className="text-xs text-[#57534E] mt-2 leading-relaxed">
              We offer personalized evening tuition for all students from Classes 6 to 12. Speak with our campus coordinator to arrange custom subject coaching.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#181614] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
              <a
                href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
                className="px-4 py-2 bg-[#C2410C] text-white text-xs font-bold rounded-xl cursor-pointer"
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
                className="bg-white rounded-3xl border border-[#E8E2D8] shadow-editorial hover:shadow-editorial-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-[#181614] overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover filter contrast-[102%] hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181614]/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      <span className="font-code-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg bg-[#FAF7F2]/90 backdrop-blur-md text-[#181614] shadow-sm">
                        {course.tag}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between text-xs font-code-mono">
                      <span>Focus Academy Thoramangalam</span>
                      <span className="text-emerald-300 font-bold">1:12 Small Batch</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="font-code-mono text-[11px] text-[#C2410C] font-bold uppercase mb-1">
                      {course.category}
                    </div>
                    
                    <h3 className="text-lg font-bold text-[#181614] leading-snug">
                      {course.title}
                    </h3>

                    <p className="mt-2 text-xs text-[#57534E] leading-relaxed line-clamp-3">
                      {course.description}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#FAF7F2]">
                      <span className="font-code-mono text-[10px] text-[#78716C] uppercase font-bold block mb-2">
                        Key Subjects Included:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {course.popularSubjects.map((subj, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium bg-[#FAF7F2] text-[#44403C] px-2 py-0.5 rounded-md border border-[#E8E2D8]"
                          >
                            {subj}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D8] flex items-center justify-between mb-4">
                    <div>
                      <span className="block text-[10px] font-code-mono text-[#78716C]">Tuition Model</span>
                      <span className="text-xs font-bold text-[#181614]">Monthly Flexible</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-code-mono text-[#78716C]">Timings</span>
                      <span className="text-xs font-bold text-[#C2410C]">4:00 PM – 9:00 PM</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => toggleSyllabus(course.id)}
                      className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] hover:bg-[#F4EFEA] text-[#181614] transition-colors cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>{expandedSyllabusId === course.id ? 'Hide Syllabus' : 'Syllabus Details'}</span>
                      <span className="text-[10px] text-[#C2410C] font-bold">{expandedSyllabusId === course.id ? '▲' : '▼'}</span>
                    </button>

                    <Link
                      to="/contact"
                      className="py-2 px-3 text-xs font-semibold rounded-xl border border-[#E8E2D8] bg-white hover:bg-[#FAF7F2] text-[#C2410C] transition-colors cursor-pointer"
                    >
                      Inquire
                    </Link>
                  </div>

                  {expandedSyllabusId === course.id && (
                    <div className="p-3 bg-white rounded-xl border border-[#E8E2D8] mb-3 text-xs space-y-1.5 animate-in fade-in">
                      <span className="font-code-mono text-[10px] uppercase font-bold text-[#C2410C] block">
                        Curriculum Highlights:
                      </span>
                      <p className="text-[#57534E] leading-relaxed text-[11px]">
                        Structured NCERT & Samacheer blueprint coverage with step-by-step numerical drills, chapter formula sheets, and Saturday timed mock exams.
                      </p>
                      <div className="pt-1.5 border-t border-[#FAF7F2] flex items-center justify-between text-[11px] font-code-mono text-[#78716C]">
                        <span>Small Batch: Max 12 Seats</span>
                        <Link to="/contact" className="text-[#C2410C] font-bold hover:underline">
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
                    className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-[#181614] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl shadow-editorial transition-all cursor-pointer group"
                  >
                    <span>View Evening Batches & Timings</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FED7AA] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8E2D8] shadow-editorial flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C2410C]/10 text-[#C2410C] flex items-center justify-center shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#181614]">Need guidance choosing between State Board & CBSE batches?</h4>
              <p className="text-xs text-[#57534E] mt-0.5">
                Our academic counseling desk at Thiripura Complex provides complimentary syllabus guidance for parents.
              </p>
            </div>
          </div>

          <a
            href={`tel:${CAMPUS_CONFIG.contact.primaryPhoneRaw}`}
            className="px-5 py-2.5 bg-[#181614] hover:bg-[#292524] text-white text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer shrink-0"
          >
            Call Campus Desk: {CAMPUS_CONFIG.contact.primaryPhone}
          </a>
        </div>
      </div>
    </div>
  );
}
