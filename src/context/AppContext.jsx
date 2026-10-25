import React, { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
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
      const saved = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('focus_academy_student_flow')) ||
                    localStorage.getItem('focus_academy_student_flow');
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

  const setStudentFlowWithStorage = useCallback((updaterOrValue) => {
    setStudentFlow((prev) => {
      const nextRaw = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      const nextStep = Math.max(Number(prev?.step) || 1, Number(nextRaw?.step) || 1);
      const next = { ...nextRaw, step: nextStep };
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('focus_academy_student_flow', JSON.stringify(next));
        }
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

  const flowRef = useRef(studentFlow);
  useEffect(() => {
    flowRef.current = studentFlow;
  }, [studentFlow]);
  const syncInFlight = useRef(null);
  const [syncError, setSyncError] = useState('');

  const ensureVerifiedSession = useCallback(async (targetStep = 4) => {
    if (syncInFlight.current) {
      await syncInFlight.current.catch(() => {});
    }
    const run = (async () => {
      const result = await SessionAuthService.syncUpTo(targetStep, flowRef.current);
      setStudentFlowWithStorage((prev) => ({ ...prev, ...result }));
      return result;
    })();
    syncInFlight.current = run;
    try {
      const result = await run;
      setSyncError('');
      return result;
    } catch (err) {
      setSyncError(err.message);
      throw err;
    } finally {
      if (syncInFlight.current === run) syncInFlight.current = null;
    }
  }, [setStudentFlowWithStorage]);

  useEffect(() => {
    const flow = studentFlow;
    const step = Number(flow.step) || 1;
    const hasIdentity = Boolean(flow.studentName?.trim() && flow.phone?.trim());
    const phoneKey = String(flow.phone || '').replace(/\D/g, '').slice(-10);
    const upToDate = flow.syncedPhone === phoneKey && (Number(flow.syncedStep) || 1) >= Math.min(step, 4);
    if (step < 2 || !hasIdentity || upToDate || syncInFlight.current) return;
    ensureVerifiedSession(step).catch(() => {});
  }, [studentFlow, ensureVerifiedSession]);

  const lookupSavedStudent = useCallback((phone, studentName) => {
    try {
      const list = JSON.parse(localStorage.getItem('focus_academy_students') || '[]');
      let matched = null;
      if (studentName) {
        matched = list.find((s) => s.phone === phone && s.studentName?.toLowerCase().trim() === studentName.toLowerCase().trim());
      }
      if (!matched) {
        matched = list.find((s) => s.phone === phone);
      }
      if (!matched) return null;
      return {
        phone: matched.phone,
        studentName: matched.studentName,
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
      const storage = typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage;
      const list = JSON.parse(storage.getItem('focus_academy_students') || '[]');
      const filtered = list.filter((s) => !(s.phone === record.phone && s.studentName?.toLowerCase().trim() === record.studentName?.toLowerCase().trim()));
      filtered.unshift(savedRecord);
      storage.setItem('focus_academy_students', JSON.stringify(filtered));
      if (storage !== localStorage && typeof localStorage !== 'undefined') {
        localStorage.setItem('focus_academy_students', JSON.stringify(filtered));
      }
    } catch {
    }
    return savedRecord;
  }, []);

  const resetStudentFlow = useCallback(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('focus_academy_student_flow');
      }
      localStorage.removeItem('focus_academy_student_flow');
    } catch {
    }
    setStudentFlow({
      step: 1,
      studentName: '',
      parentName: '',
      phone: '',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      examPrep: '',
      examPrepId: '',
      selectedBatchId: '',
      selectedBatchName: '',
      batchTiming: '',
      subjects: '',
      monthlyFee: 0,
      stepToken: undefined,
      applicationId: undefined,
      syncedStep: undefined,
      syncedPhone: undefined,
    });
    setSyncError('');
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
    resetStudentFlow,
    ensureVerifiedSession,
    syncError,
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
