import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { 
  ModalContext, 
  FilterContext, 
  StudentFlowContext 
} from './useAppContext';

const BookDemoModal = lazy(() => import('../components/Modals/BookDemoModal'));

export function AppProvider({ children }) {
  const [studentFlow, setStudentFlow] = useState(() => {
    try {
      const saved = localStorage.getItem('focus_academy_student_flow');
      return saved ? JSON.parse(saved) : {
        studentName: '',
        phone: '',
        parentName: '',
        board: 'TN State Board (Samacheer)',
        grade: 'Class 10',
        examPrep: '10th Board Exam Mastery (Target 95%+)',
        selectedBatchId: 'batch-10-state-board'
      };
    } catch {
      return {
        studentName: '',
        phone: '',
        parentName: '',
        board: 'TN State Board (Samacheer)',
        grade: 'Class 10',
        examPrep: '10th Board Exam Mastery (Target 95%+)',
        selectedBatchId: 'batch-10-state-board'
      };
    }
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'focus_academy_student_flow' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setStudentFlow(parsed);
        } catch {
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateStudentFlow = useCallback((updates) => {
    setStudentFlow((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('focus_academy_student_flow', JSON.stringify(next));
      } catch {
      }
      return next;
    });
  }, []);

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoModalSubject, setDemoModalSubject] = useState('');

  const [selectedCity, setSelectedCity] = useState('Thoramangalam');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  const openDemoModal = useCallback((subject = '') => {
    setDemoModalSubject(subject);
    setDemoModalOpen(true);
  }, []);

  const closeDemoModal = useCallback(() => {
    setDemoModalOpen(false);
    setDemoModalSubject('');
  }, []);

  const executeSearch = useCallback((query) => {
    setSearchQuery(query);
    const batchesSection = document.getElementById('batches') || document.getElementById('courses');
    if (batchesSection) {
      batchesSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const selectCategoryFilter = useCallback((catId) => {
    setActiveCategoryFilter(catId);
    setSearchQuery('');
    const el = document.getElementById('courses') || document.getElementById('categories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const clearCategoryFilter = useCallback(() => {
    setActiveCategoryFilter('all');
    setSearchQuery('');
  }, []);

  const modalContextValue = {
    demoModalOpen,
    demoModalSubject,
    openDemoModal,
    closeDemoModal,
  };

  const filterContextValue = {
    selectedCity,
    setSelectedCity,
    searchQuery,
    setSearchQuery,
    activeCategoryFilter,
    selectCategoryFilter,
    clearCategoryFilter,
    executeSearch,
  };

  const studentFlowValue = {
    studentFlow,
    updateStudentFlow,
  };

  return (
    <ModalContext.Provider value={modalContextValue}>
      <FilterContext.Provider value={filterContextValue}>
        <StudentFlowContext.Provider value={studentFlowValue}>
          {children}
          {demoModalOpen && (
            <Suspense fallback={null}>
              <BookDemoModal
                isOpen={demoModalOpen}
                onClose={closeDemoModal}
                preselectedSubject={demoModalSubject}
              />
            </Suspense>
          )}
        </StudentFlowContext.Provider>
      </FilterContext.Provider>
    </ModalContext.Provider>
  );
}
