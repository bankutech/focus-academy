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
        examPrep: '10th Board Exam Mastery (Target 95%+)',
        selectedBatchId: 'batch-10-state-board',
      },
      updateStudentFlow: () => {},
    };
  }
  return context;
}

export function useCampus() {
  return CAMPUS_CONFIG;
}
