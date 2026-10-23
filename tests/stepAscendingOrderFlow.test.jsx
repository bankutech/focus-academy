import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { 
  isStep1Complete, 
  isStep2Complete, 
  isStep3Complete, 
  isStep4Complete, 
  getStepRedirect 
} from '../src/context/useAppContext';
import { AppProvider } from '../src/context/AppContext';
import StudentDetailsPage from '../src/pages/StudentDetailsPage';
import ExamPrepPage from '../src/pages/ExamPrepPage';
import BatchesPage from '../src/pages/BatchesPage';
import BatchDetailPage from '../src/pages/BatchDetailPage';
import EnrollPage from '../src/pages/EnrollPage';
import { SessionAuthService } from '../src/services/sessionAuthService';
import { BatchService } from '../src/services/batchService';

describe('Ascending Order Multi-Step Admission Guard Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('evaluates step completion predicates accurately across stages', () => {
    expect(isStep1Complete(null)).toBe(false);
    expect(isStep1Complete({ step: 1 })).toBe(false);
    expect(isStep1Complete({ step: 2 })).toBe(true);

    expect(isStep2Complete({ step: 2 })).toBe(false);
    expect(isStep2Complete({ step: 3 })).toBe(true);

    expect(isStep3Complete({ step: 3 })).toBe(false);
    expect(isStep3Complete({ step: 4 })).toBe(true);

    expect(isStep4Complete({ step: 4 })).toBe(false);
    expect(isStep4Complete({ step: 5 })).toBe(true);
  });

  it('prevents direct entry to step 2, 3, 4, 5 without step 1 completion', () => {
    const unstartedFlow = { step: 1, studentName: '', phone: '' };

    expect(getStepRedirect(1, unstartedFlow)).toBeNull();
    expect(getStepRedirect(2, unstartedFlow)).toBe('/student-details');
    expect(getStepRedirect(3, unstartedFlow, '/batches')).toBe('/student-details');
    expect(getStepRedirect(4, unstartedFlow)).toBe('/student-details');
    expect(getStepRedirect(5, unstartedFlow)).toBe('/student-details');
  });

  it('allows public access to /timings schedule without prerequisite redirect', () => {
    const unstartedFlow = { step: 1, studentName: '', phone: '' };
    expect(getStepRedirect(3, unstartedFlow, '/timings')).toBeNull();
  });

  it('enforces sequential progression when step 1 is completed', () => {
    const step1Flow = {
      step: 2,
      studentName: 'S. Kaviya',
      phone: '9842451220',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)'
    };

    expect(getStepRedirect(1, step1Flow)).toBeNull();
    expect(getStepRedirect(2, step1Flow)).toBeNull();
    expect(getStepRedirect(3, step1Flow, '/batches')).toBe('/exam-prep');
    expect(getStepRedirect(4, step1Flow)).toBe('/exam-prep');
    expect(getStepRedirect(5, step1Flow)).toBe('/exam-prep');
  });

  it('enforces sequential progression when step 2 is completed', () => {
    const step2Flow = {
      step: 3,
      studentName: 'S. Kaviya',
      phone: '9842451220',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      examPrep: '10th Board Exam Mastery'
    };

    expect(getStepRedirect(1, step2Flow)).toBeNull();
    expect(getStepRedirect(2, step2Flow)).toBeNull();
    expect(getStepRedirect(3, step2Flow, '/batches')).toBeNull();
    expect(getStepRedirect(4, step2Flow)).toBe('/batches');
    expect(getStepRedirect(5, step2Flow)).toBe('/batches');
  });

  it('enforces sequential progression when step 3 is completed', () => {
    const step3Flow = {
      step: 4,
      studentName: 'S. Kaviya',
      phone: '9842451220',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      examPrep: '10th Board Exam Mastery',
      selectedBatchId: 'batch-10-state-board'
    };

    expect(getStepRedirect(1, step3Flow)).toBeNull();
    expect(getStepRedirect(2, step3Flow)).toBeNull();
    expect(getStepRedirect(3, step3Flow, '/batches')).toBeNull();
    expect(getStepRedirect(4, step3Flow)).toBeNull();
    expect(getStepRedirect(5, step3Flow)).toBe('/batch/batch-10-state-board');
  });

  it('allows access to all steps in ascending order once step 4 is completed', () => {
    const step4Flow = {
      step: 5,
      studentName: 'S. Kaviya',
      phone: '9842451220',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      examPrep: '10th Board Exam Mastery',
      selectedBatchId: 'batch-10-state-board'
    };

    expect(getStepRedirect(1, step4Flow)).toBeNull();
    expect(getStepRedirect(2, step4Flow)).toBeNull();
    expect(getStepRedirect(3, step4Flow, '/batches')).toBeNull();
    expect(getStepRedirect(4, step4Flow)).toBeNull();
    expect(getStepRedirect(5, step4Flow)).toBeNull();
  });

  it('redirects directly accessed /enroll (step 5) to /student-details when not completed', () => {
    render(
      <MemoryRouter initialEntries={['/enroll']}>
        <AppProvider>
          <Routes>
            <Route path="/student-details" element={<div data-testid="student-details-screen">Student Details Step 1</div>} />
            <Route path="/enroll" element={<EnrollPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('student-details-screen')).toBeDefined();
    expect(screen.queryByText(/Step 5: Enrollment/i)).toBeNull();
  });

  it('redirects directly accessed /batch/:batchId (step 4) to /student-details when unstarted', () => {
    render(
      <MemoryRouter initialEntries={['/batch/batch-10-state-board']}>
        <AppProvider>
          <Routes>
            <Route path="/student-details" element={<div data-testid="student-details-screen">Student Details Step 1</div>} />
            <Route path="/batch/:batchId" element={<BatchDetailPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('student-details-screen')).toBeDefined();
  });

  it('redirects directly accessed /batches (step 3) to /student-details when unstarted', () => {
    render(
      <MemoryRouter initialEntries={['/batches']}>
        <AppProvider>
          <Routes>
            <Route path="/student-details" element={<div data-testid="student-details-screen">Student Details Step 1</div>} />
            <Route path="/batches" element={<BatchesPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('student-details-screen')).toBeDefined();
  });

  it('redirects directly accessed /exam-prep (step 2) to /student-details when unstarted', () => {
    render(
      <MemoryRouter initialEntries={['/exam-prep']}>
        <AppProvider>
          <Routes>
            <Route path="/student-details" element={<div data-testid="student-details-screen">Student Details Step 1</div>} />
            <Route path="/exam-prep" element={<ExamPrepPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('student-details-screen')).toBeDefined();
  });

  it('allows Step 5 to render successfully once all prior steps are completed', () => {
    localStorage.setItem(
      'focus_academy_student_flow',
      JSON.stringify({
        studentName: 'S. Kaviya',
        phone: '9842451220',
        parentName: 'S. Sundaram',
        board: 'TN State Board (Samacheer)',
        grade: 'Class 10',
        examPrep: '10th Board Exam Mastery',
        selectedBatchId: 'batch-10-state-board',
        step: 5
      })
    );

    render(
      <MemoryRouter initialEntries={['/enroll']}>
        <AppProvider>
          <Routes>
            <Route path="/student-details" element={<StudentDetailsPage />} />
            <Route path="/enroll" element={<EnrollPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/5\. Enrollment/i)).toBeDefined();
    expect(screen.getByDisplayValue('S. Kaviya')).toBeDefined();
  });

  it('displays and dismisses sequential step requirement notice on StudentDetailsPage', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/student-details', state: { redirectedFrom: 5 } }]}>
        <AppProvider>
          <StudentDetailsPage />
        </AppProvider>
      </MemoryRouter>
    );

    const matches = screen.getAllByText(/Please provide basic student details first to unlock batches/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Step 1 Required \(Sequential Admission\)/i)).toBeDefined();

    const dismissButtons = screen.getAllByRole('button', { name: /Dismiss/i });
    expect(dismissButtons.length).toBeGreaterThanOrEqual(1);
    for (const btn of dismissButtons) {
      fireEvent.click(btn);
    }

    expect(screen.queryAllByText(/Please provide basic student details first to unlock batches/i).length).toBe(0);
  });

  it('renders sticky mobile filter chips on BatchesPage and filters batches by class chip', async () => {
    localStorage.setItem(
      'focus_academy_student_flow',
      JSON.stringify({
        studentName: 'S. Kaviya',
        phone: '9842451220',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        examPrep: '10th Board Exam Mastery',
        step: 3
      })
    );

    render(
      <MemoryRouter initialEntries={['/batches']}>
        <AppProvider>
          <BatchesPage />
        </AppProvider>
      </MemoryRouter>
    );

    const filterBar = screen.getByTestId('batches-filter-bar');
    expect(filterBar).toBeDefined();
    expect(filterBar.className).toContain('sticky');

    const class12Btn = screen.getByRole('button', { name: /^Class 12$/i });
    fireEvent.click(class12Btn);

    await waitFor(() => {
      expect(screen.getByText(/Class 12 Higher Secondary/i)).toBeDefined();
    });
    expect(screen.queryByText(/Class 10 Board Distinction/i)).toBeNull();
  });

  it('displays sequential step requirement notice on ExamPrepPage when redirected from step 4', () => {
    localStorage.setItem(
      'focus_academy_student_flow',
      JSON.stringify({
        studentName: 'S. Kaviya',
        phone: '9842451220',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        step: 2
      })
    );

    render(
      <MemoryRouter initialEntries={[{ pathname: '/exam-prep', state: { redirectedFrom: 4 } }]}>
        <AppProvider>
          <ExamPrepPage />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Step 2 Required \(Sequential Admission\)/i)).toBeDefined();
    expect(screen.getByText(/proceeding to Step 4/i)).toBeDefined();
  });

  it('prevents client-side localStorage tampering using SessionAuthService token validation', () => {
    const validToken = SessionAuthService.createClientStepToken(4, 'S. Kaviya', '9842451220');
    expect(SessionAuthService.verifyClientStepToken(validToken, 4, 'S. Kaviya', '9842451220')).toBe(true);

    expect(SessionAuthService.verifyClientStepToken(validToken, 5, 'S. Kaviya', '9842451220')).toBe(false);

    expect(SessionAuthService.verifyClientStepToken(validToken, 4, 'Hacker', '9842451220')).toBe(false);
    expect(SessionAuthService.verifyClientStepToken('fake.token', 4, 'S. Kaviya', '9842451220')).toBe(false);

    const expiredToken = SessionAuthService.createClientStepToken(4, 'S. Kaviya', '9842451220', -1000);
    expect(SessionAuthService.verifyClientStepToken(expiredToken, 4, 'S. Kaviya', '9842451220')).toBe(false);

    const tamperedFlow = {
      step: 5,
      studentName: 'Hacker',
      phone: '9842451220',
      stepToken: 'v1.5.12345.fake'
    };
    expect(isStep1Complete(tamperedFlow)).toBe(false);
  });

  it('retrieves headless batch data and handles seat reservation through BatchService', async () => {
    const batches = await BatchService.getBatches();
    expect(batches.length).toBeGreaterThanOrEqual(6);

    const reserved = await BatchService.reserveSeat('batch-10-state-board');
    expect(typeof reserved).toBe('boolean');
  });

  it('distinguishes public /timings view from step 3 /batches admission view', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/timings']}>
        <AppProvider>
          <BatchesPage />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText(/Step 3 of 5/i)).toBeNull();
    expect(screen.getByRole('heading', { name: /Batch Timings & Schedule/i })).toBeDefined();
    expect(screen.getByText(/Shift 1 \(Evening\)/i)).toBeDefined();
    expect(screen.getByText(/Shift 2 \(Evening\)/i)).toBeDefined();
    expect(screen.getByText(/Shift 3 \(Night\)/i)).toBeDefined();
    expect(screen.queryByText(/Back to Exam Preparation Goals/i)).toBeNull();

    unmount();

    localStorage.setItem(
      'focus_academy_student_flow',
      JSON.stringify({
        studentName: 'S. Kaviya',
        phone: '9842451220',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        examPrep: '10th Board Exam Mastery',
        step: 3
      })
    );

    render(
      <MemoryRouter initialEntries={['/batches']}>
        <AppProvider>
          <BatchesPage />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Step 3 of 5/i)).toBeDefined();
    expect(screen.getByRole('heading', { name: /Available Evening Batches/i })).toBeDefined();
    expect(screen.getByText(/Back to Exam Preparation Goals/i)).toBeDefined();
  });
});
