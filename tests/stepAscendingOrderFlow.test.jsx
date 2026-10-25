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
import HomePage from '../src/pages/HomePage';
import Navbar from '../src/components/Navbar';
import { BatchService } from '../src/services/batchService';

describe('Ascending Order Multi-Step Admission Guard Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
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

  it('treats client step state as a UX guard and never as proof of progress', () => {
    expect(isStep1Complete({ step: 5, stepToken: 'v2.forged.5.9999999999999.abc' })).toBe(true);
    expect(isStep1Complete({ step: 1, stepToken: 'v2.forged.5.9999999999999.abc' })).toBe(false);
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

  it('strictly validates student name and mobile number on StudentDetailsPage to prevent step 1 bypass', async () => {
    render(
      <MemoryRouter initialEntries={['/student-details']}>
        <AppProvider>
          <StudentDetailsPage />
        </AppProvider>
      </MemoryRouter>
    );

    const form = screen.getByTestId('student-details-form');
    fireEvent.submit(form);

    expect(screen.getByText(/Please enter the student's full name/i)).toBeDefined();

    const nameInput = screen.getByLabelText(/Student Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'K. Vignesh' } });
    fireEvent.submit(form);

    expect(screen.getAllByText(/Phone number is required/i).length).toBeGreaterThanOrEqual(1);

    const phoneInput = screen.getByLabelText(/Mobile Number/i);
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.submit(form);
    expect(screen.getAllByText(/Please enter a valid 10-digit/i).length).toBeGreaterThanOrEqual(1);
  });

  it('ensures Navbar Timings link is active strictly on /timings and NOT on /batches admission step', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/timings']}>
        <AppProvider>
          <Navbar />
        </AppProvider>
      </MemoryRouter>
    );

    const timingLinks = screen.getAllByRole('link', { name: /^Timings$/i });
    expect(timingLinks.length).toBeGreaterThanOrEqual(1);
    expect(timingLinks[0].getAttribute('aria-current')).toBe('page');

    unmount();

    render(
      <MemoryRouter initialEntries={['/batches']}>
        <AppProvider>
          <Navbar />
        </AppProvider>
      </MemoryRouter>
    );

    const batchesTimingLinks = screen.getAllByRole('link', { name: /^Timings$/i });
    for (const link of batchesTimingLinks) {
      expect(link.getAttribute('aria-current')).toBeNull();
    }
  });

  it('renders EnrollPage with 3 structured sections and excludes marketing questions', async () => {
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
      <MemoryRouter initialEntries={['/enroll/batch-10-state-board']}>
        <AppProvider>
          <Routes>
            <Route path="/enroll/:batchId" element={<EnrollPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Academic Background & School Identity/i)).toBeDefined();
    expect(screen.getByText(/Operational & Contact Details/i)).toBeDefined();
    expect(screen.getByText(/Logistics, Verification & Invoicing/i)).toBeDefined();

    expect(screen.queryByText(/How did you hear about us/i)).toBeNull();
    expect(screen.queryByText(/Referral Source/i)).toBeNull();

    expect(screen.getByLabelText(/School \/ College Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Education Board \/ University/i)).toBeDefined();
    expect(screen.getByLabelText(/Target Year \/ Exam Cycle/i)).toBeDefined();
    expect(screen.getByLabelText(/School \/ College Shift Timing/i)).toBeDefined();
    expect(screen.getByText(/WhatsApp number is same as calling phone number/i)).toBeDefined();
    expect(screen.getByLabelText(/Medium \/ Language of Instruction/i)).toBeDefined();
    expect(screen.getByLabelText(/Contact Person Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Emergency Phone/i)).toBeDefined();
    expect(screen.getByLabelText(/Identity Proof \/ Student ID Number/i)).toBeDefined();
  });

  it('renders EnrollPage with horizontal selected batch summary and removes campus desk address block', async () => {
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
      <MemoryRouter initialEntries={['/enroll/batch-10-state-board']}>
        <AppProvider>
          <Routes>
            <Route path="/enroll/:batchId" element={<EnrollPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Selected Evening Batch/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /Change Batch/i })).toBeDefined();
    expect(screen.getByText(/Zero Reg\. Fee/i)).toBeDefined();
    expect(screen.queryByText(/Focus Academy Campus Desk:/i)).toBeNull();
  });

  it('ensures all HomePage admission step cards enforce sequential entry to Step 1', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <HomePage />
        </AppProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Step 1: Details →/i)).toBeDefined();
    const startStep1Links = screen.getAllByRole('link', { name: /Start at Step 1 →/i });
    expect(startStep1Links.length).toBe(4);
    for (const link of startStep1Links) {
      expect(link.getAttribute('href')).toBe('/student-details');
    }
    expect(screen.queryByRole('link', { name: /Step 2: Goals →/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /Step 3: Batches →/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /Step 5: Enroll →/i })).toBeNull();
  });

  it('renders school shift timing dropdown with 3 options and optional dismissal and transit duration inputs', async () => {
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
      <MemoryRouter initialEntries={['/enroll/batch-10-state-board']}>
        <AppProvider>
          <Routes>
            <Route path="/enroll/:batchId" element={<EnrollPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    const shiftSelect = screen.getByLabelText(/What is your child's school timing/i);
    expect(shiftSelect).toBeDefined();
    expect(screen.getByRole('option', { name: /^Morning shift$/i })).toBeDefined();
    expect(screen.getByRole('option', { name: /^Day\/Afternoon shift$/i })).toBeDefined();
    expect(screen.getByRole('option', { name: /^Other \/ Varies$/i })).toBeDefined();

    expect(screen.getByLabelText(/School usually finishes at/i)).toBeDefined();
    expect(screen.getByLabelText(/Approximate travel time from school to the academy/i)).toBeDefined();
    expect(screen.getByText(/This information helps the academy understand your student's schedule and recommend a suitable batch/i)).toBeDefined();
  });

  it('renders intelligent scheduling advisory warning and recommended alternative batch when school dismissal causes delay', async () => {
    localStorage.setItem(
      'focus_academy_student_flow',
      JSON.stringify({
        studentName: 'S. Kaviya',
        phone: '9842451220',
        parentName: 'S. Sundaram',
        board: 'TN State Board (Samacheer)',
        grade: 'Class 10',
        examPrep: '10th Board Exam Mastery',
        selectedBatchId: 'batch-remedial-maths',
        step: 5
      })
    );

    render(
      <MemoryRouter initialEntries={['/enroll/batch-remedial-maths']}>
        <AppProvider>
          <Routes>
            <Route path="/enroll/:batchId" element={<EnrollPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    const dismissalInput = screen.getByLabelText(/School usually finishes at/i);
    const travelInput = screen.getByLabelText(/Approximate travel time from school to the academy/i);

    fireEvent.change(dismissalInput, { target: { value: '16:15' } });
    fireEvent.change(travelInput, { target: { value: '30' } });

    await waitFor(() => {
      expect(screen.getByText(/Scheduling Advisory/i)).toBeDefined();
      expect(screen.getByText(/Your school schedule may make this batch difficult to reach on time\. Please review the timing or contact the academy for assistance\./i)).toBeDefined();
    });

    expect(screen.getByText(/Suggested Alternative:/i)).toBeDefined();
    const switchBtn = screen.getByRole('button', { name: /Switch to .* Batch/i });
    expect(switchBtn).toBeDefined();
  });

  it('renders comfortable timing notification when student arrival is well before batch start', async () => {
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
      <MemoryRouter initialEntries={['/enroll/batch-10-state-board']}>
        <AppProvider>
          <Routes>
            <Route path="/enroll/:batchId" element={<EnrollPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    const dismissalInput = screen.getByLabelText(/School usually finishes at/i);
    const travelInput = screen.getByLabelText(/Approximate travel time from school to the academy/i);

    fireEvent.change(dismissalInput, { target: { value: '15:00' } });
    fireEvent.change(travelInput, { target: { value: '30' } });

    await waitFor(() => {
      expect(screen.getByText(/Comfortable Schedule:/i)).toBeDefined();
    });
  });
});
