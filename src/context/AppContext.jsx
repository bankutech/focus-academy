import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { 
  ModalContext, 
  FilterContext, 
  StudentFlowContext 
} from './useAppContext';
import { SessionAuthService } from '../services/sessionAuthService';

const BookDemoModal = lazy(() => import('../components/Modals/BookDemoModal'));

export function AppProvider({ children }) {
  const [studentFlow, setStudentFlow] = useState(() => {
    try {
      const saved = localStorage.getItem('focus_academy_student_flow');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          if (!parsed.step) {
            parsed.step = (parsed.studentName?.trim() && parsed.phone?.trim()) ? 2 : 1;
          }
          return parsed;
        }
      }
    } catch {
    }
    return {
      studentName: '',
      phone: '',
      parentName: '',
      board: 'TN State Board (Samacheer)',
      grade: 'Class 10',
      examPrep: '',
      selectedBatchId: '',
      step: 1
    };
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

  const setStudentFlowWithStorage = useCallback((updaterOrValue) => {
    setStudentFlow((prev) => {
      const nextRaw = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      const nextStep = Math.max(Number(prev?.step) || 1, Number(nextRaw?.step) || 1);
      const studentName = nextRaw?.studentName || prev?.studentName || '';
      const phone = nextRaw?.phone || prev?.phone || '';
      const stepToken = nextStep > 1 
        ? SessionAuthService.createClientStepToken(nextStep, studentName, phone)
        : undefined;
      const next = { ...nextRaw, step: nextStep, ...(stepToken ? { stepToken } : {}) };
      try {
        localStorage.setItem('focus_academy_student_flow', JSON.stringify(next));
      } catch {
      }
      return next;
    });
  }, []);

  const updateStudentFlow = useCallback((updates) => {
    setStudentFlowWithStorage((prev) => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      return next;
    });
  }, [setStudentFlowWithStorage]);

  const lookupSavedStudent = useCallback((phone) => {
    try {
      const list = JSON.parse(localStorage.getItem('focus_academy_students') || '[]');
      const matched = list.find((s) => s.phone === phone);
      if (!matched) return null;
      return {
        phone: matched.phone,
        grade: matched.grade || 'Class 10',
        board: matched.board || 'TN State Board (Samacheer)',
      };
    } catch {
      return null;
    }
  }, []);

  const registerStudent = useCallback((record) => {
    const id = `FA-${Date.now().toString().slice(-6)}`;
    const savedRecord = { ...record, id };
    try {
      const list = JSON.parse(localStorage.getItem('focus_academy_students') || '[]');
      const filtered = list.filter((s) => s.phone !== record.phone);
      filtered.unshift(savedRecord);
      localStorage.setItem('focus_academy_students', JSON.stringify(filtered));
    } catch {
    }
    return savedRecord;
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
    setStudentFlow: setStudentFlowWithStorage,
    updateStudentFlow,
    lookupSavedStudent,
    registerStudent,
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
