import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axe from 'axe-core';
import { AppProvider } from '../src/context/AppContext';
import StudentDetailsPage from '../src/pages/StudentDetailsPage';
import ExamPrepPage from '../src/pages/ExamPrepPage';
import BatchesPage from '../src/pages/BatchesPage';
import BatchDetailPage from '../src/pages/BatchDetailPage';
import EnrollPage from '../src/pages/EnrollPage';

describe('WCAG 2.1 AA Programmatic Accessibility Audits', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies Step 1 StudentDetailsPage has zero critical accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/student-details']}>
        <AppProvider>
          <StudentDetailsPage />
        </AppProvider>
      </MemoryRouter>
    );

    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations.length).toBe(0);
  });

  it('verifies Step 2 ExamPrepPage has zero critical accessibility violations', async () => {
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

    const { container } = render(
      <MemoryRouter initialEntries={['/exam-prep']}>
        <AppProvider>
          <ExamPrepPage />
        </AppProvider>
      </MemoryRouter>
    );

    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations.length).toBe(0);
  });

  it('verifies Step 3 BatchesPage has zero critical accessibility violations', async () => {
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

    const { container } = render(
      <MemoryRouter initialEntries={['/batches']}>
        <AppProvider>
          <BatchesPage />
        </AppProvider>
      </MemoryRouter>
    );

    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations.length).toBe(0);
  });

  it('verifies Step 4 BatchDetailPage has zero critical accessibility violations', async () => {
    localStorage.setItem(
      'focus_academy_student_flow',
      JSON.stringify({
        studentName: 'S. Kaviya',
        phone: '9842451220',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        examPrep: '10th Board Exam Mastery',
        selectedBatchId: 'batch-10-state-board',
        step: 4
      })
    );

    const { container } = render(
      <MemoryRouter initialEntries={['/batch/batch-10-state-board']}>
        <AppProvider>
          <Routes>
            <Route path="/batch/:batchId" element={<BatchDetailPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations.length).toBe(0);
  });

  it('verifies Step 5 EnrollPage has zero critical accessibility violations', async () => {
    localStorage.setItem(
      'focus_academy_student_flow',
      JSON.stringify({
        studentName: 'S. Kaviya',
        phone: '9842451220',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        examPrep: '10th Board Exam Mastery',
        selectedBatchId: 'batch-10-state-board',
        step: 5
      })
    );

    const { container } = render(
      <MemoryRouter initialEntries={['/enroll/batch-10-state-board']}>
        <AppProvider>
          <Routes>
            <Route path="/enroll/:batchId" element={<EnrollPage />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations.length).toBe(0);
  });
});
