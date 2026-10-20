import { createContext, useContext } from 'react';
import { CAMPUS_CONFIG } from '../config/campusConfig';

export const ModalContext = createContext(null);
export const FilterContext = createContext(null);
export const StudentFlowContext = createContext(null);

export function useModals() {
  const context = useContext(ModalContext);
  if (!context) {
    return {
      demoModalOpen: false,
      demoModalSubject: '',
      openDemoModal: () => {},
      closeDemoModal: () => {},
    };
  }
  return context;
}

export function useSearchFilter() {
  const context = useContext(FilterContext);
  if (!context) {
    return {
      selectedCity: 'Thoramangalam',
      setSelectedCity: () => {},
      searchQuery: '',
      setSearchQuery: () => {},
      activeCategoryFilter: 'all',
      selectCategoryFilter: () => {},
      clearCategoryFilter: () => {},
      executeSearch: () => {},
    };
  }
  return context;
}

export function useStudentFlow() {
  const context = useContext(StudentFlowContext);
  if (!context) {
    return {
      studentFlow: {
        studentName: '',
        phone: '',
        parentName: '',
        board: 'TN State Board (Samacheer)',
        grade: 'Class 10',
        examPrep: '',
        selectedBatchId: '',
        step: 1,
      },
      setStudentFlow: () => {},
      updateStudentFlow: () => {},
      lookupSavedStudent: () => null,
      registerStudent: () => ({ id: 'FA-000000' }),
    };
  }
  return context;
}

export function isStep1Complete(studentFlow) {
  if (!studentFlow) return false;
  return Number(studentFlow.step) >= 2;
}

export function isStep2Complete(studentFlow) {
  if (!isStep1Complete(studentFlow)) return false;
  return Number(studentFlow.step) >= 3;
}

export function isStep3Complete(studentFlow) {
  if (!isStep2Complete(studentFlow)) return false;
  return Number(studentFlow.step) >= 4;
}

export function isStep4Complete(studentFlow) {
  if (!isStep3Complete(studentFlow)) return false;
  return Number(studentFlow.step) >= 5;
}

export function getStepRedirect(targetStep, studentFlow, currentPath = '') {
  if (currentPath === '/timings') {
    return null;
  }
  if (targetStep >= 2 && !isStep1Complete(studentFlow)) {
    return '/student-details';
  }
  if (targetStep >= 3 && !isStep2Complete(studentFlow)) {
    return '/exam-prep';
  }
  if (targetStep >= 4 && !isStep3Complete(studentFlow)) {
    return '/batches';
  }
  if (targetStep >= 5 && !isStep4Complete(studentFlow)) {
    const fallbackBatchId = studentFlow?.selectedBatchId || 'batch-10-state-board';
    return `/batch/${fallbackBatchId}`;
  }
  return null;
}

export function useCampus() {
  return CAMPUS_CONFIG;
}
