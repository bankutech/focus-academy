import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

import { isUserAdmin, getAdminAllowlist } from '../src/services/firebase';
import AdminLayout from '../src/pages/admin/AdminLayout';
import AdminDashboardPage from '../src/pages/admin/AdminDashboardPage';
import AdminBatchesPage from '../src/pages/admin/AdminBatchesPage';
import AdminStudentsPage from '../src/pages/admin/AdminStudentsPage';
import AdminLeadsPage from '../src/pages/admin/AdminLeadsPage';
import AdminFeesPage from '../src/pages/admin/AdminFeesPage';
import AdminLedgerPage from '../src/pages/admin/AdminLedgerPage';
import AdminRemindersPage from '../src/pages/admin/AdminRemindersPage';
import AdminReportsPage from '../src/pages/admin/AdminReportsPage';
import AdminAuditLogsPage from '../src/pages/admin/AdminAuditLogsPage';
import { AdminDataService } from '../src/services/adminDataService';

describe('Admin Portal Pages & Routing Integrity', () => {
  beforeEach(() => {
    localStorage.clear();
    AdminDataService.resetToSeedData();
  });

  it('preserves the strict zero-comment rule on src/App.jsx', () => {
    const appFileContent = fs.readFileSync(path.resolve(__dirname, '../src/App.jsx'), 'utf-8');
    const lines = appFileContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      expect(line.startsWith('//')).toBe(false);
      expect(line.startsWith('/*')).toBe(false);
      expect(line.startsWith('<!--')).toBe(false);
      expect(line.includes('{/*')).toBe(false);
    }
  });

  it('validates administrator allowlist and custom claims correctly', () => {
    const allowlist = getAdminAllowlist();
    expect(allowlist).toContain('admin@focusacademyperambalur.com');
    expect(allowlist).toContain('director@focusacademyperambalur.com');

    expect(isUserAdmin({ email: 'admin@focusacademyperambalur.com' })).toBe(true);
    expect(isUserAdmin({ email: 'director@focusacademyperambalur.com' })).toBe(true);
    expect(isUserAdmin({ email: 'random.student@gmail.com' })).toBe(false);
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin({ email: 'random@test.com' }, { admin: true })).toBe(true);
    expect(isUserAdmin({ email: 'random@test.com' }, { role: 'admin' })).toBe(true);
  });

  it('verifies firestore.rules exists and contains all required collections and rules', () => {
    const rulesContent = fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf-8');
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toContain('function isAdmin()');
    expect(rulesContent).toContain('match /batches/{batchId}');
    expect(rulesContent).toContain('match /students/{studentId}');
    expect(rulesContent).toContain('match /fee_obligations/{obligationId}');
    expect(rulesContent).toContain('match /payments/{paymentId}');
    expect(rulesContent).toContain('match /reminders/{reminderId}');
    expect(rulesContent).toContain('match /audit_logs/{logId}');
    expect(rulesContent).toContain('match /reservations/{reservationId}');
    expect(rulesContent).toContain('allow update, delete: if false;');
  });

  it('renders AdminLayout with all 8 institutional navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/admin-portal']}>
        <AdminLayout />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Focus Academy').length).toBeGreaterThan(0);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Batches')).toBeDefined();
    expect(screen.getByText('Students')).toBeDefined();
    expect(screen.getByText('Fee Schedules')).toBeDefined();
    expect(screen.getByText('Ledger & Payments')).toBeDefined();
    expect(screen.getByText('WhatsApp Reminders')).toBeDefined();
    expect(screen.getByText('Reports & Analytics')).toBeDefined();
    expect(screen.getByText('Audit Logs')).toBeDefined();
  });

  it('renders AdminDashboardPage with financial summary metrics', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Active Students')).toBeDefined();
      expect(screen.getByText('Active Batches')).toBeDefined();
      expect(screen.getByText('Collected This Month')).toBeDefined();
      expect(screen.getByText('Total Outstanding')).toBeDefined();
    });
  });

  it('renders AdminRemindersPage with pending tabs and actions', async () => {
    render(
      <MemoryRouter>
        <AdminRemindersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('WhatsApp Fee Reminders')).toBeDefined();
      expect(screen.getByText(/Action Required/i)).toBeDefined();
      expect(screen.getByText(/Dispatch History/i)).toBeDefined();
    });
  });

  it('renders AdminReportsPage with batch utilization and export buttons', async () => {
    render(
      <MemoryRouter>
        <AdminReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Institutional Reports & Analytics')).toBeDefined();
      expect(screen.getByText('Export Students CSV')).toBeDefined();
      expect(screen.getByText('Export Financials CSV')).toBeDefined();
    });
  });

  it('renders AdminAuditLogsPage with chronological action trail', async () => {
    render(
      <MemoryRouter>
        <AdminAuditLogsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Administrative Audit Trail')).toBeDefined();
      expect(screen.getByText('All Actions')).toBeDefined();
    });
  });

  it('renders AdminBatchesPage with batch list and Create New Batch action', async () => {
    render(
      <MemoryRouter>
        <AdminBatchesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Batch Management')).toBeDefined();
      expect(screen.getByText('Create New Batch')).toBeDefined();
      expect(screen.getByText(/Class 10 State Board/i)).toBeDefined();
    });
  });

  it('renders AdminStudentsPage with student records, Add Student button, and Edit actions', async () => {
    render(
      <MemoryRouter>
        <AdminStudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Student Management')).toBeDefined();
      expect(screen.getByText('Add New Student')).toBeDefined();
      expect(screen.getByText('S. Kaviya')).toBeDefined();
      expect(screen.getAllByTitle('Edit Student').length).toBeGreaterThan(0);
    });
  });

  it('renders AdminFeesPage with schedules and billing cycle generation', async () => {
    render(
      <MemoryRouter>
        <AdminFeesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Recurring Fee Schedules/i)).toBeDefined();
      expect(screen.getByText('Generate Next Billing Cycle')).toBeDefined();
      expect(screen.getByText('S. Kaviya')).toBeDefined();
    });
  });

  it('renders AdminLedgerPage with payment transactions and Record New Payment action', async () => {
    render(
      <MemoryRouter>
        <AdminLedgerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Financial Ledger & Payments')).toBeDefined();
      expect(screen.getByText('Record New Payment')).toBeDefined();
      expect(screen.getByText('REC-2026-0001')).toBeDefined();
    });
  });

  it('renders AdminStudentsPage with school shift, dismissal, travel duration and timing warning badge', async () => {
    const studentWithTiming = {
      studentName: 'P. Rahul',
      guardianName: 'P. Perumal',
      guardianPhone: '9842451220',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      batchId: 'batch-10-state-board',
      schoolShift: 'Morning shift',
      schoolDismissalTime: '15:30',
      travelDurationMinutes: 25,
      scheduleClashWarning: 'Timing risk advisory',
      status: 'active'
    };
    await AdminDataService.createStudent(studentWithTiming, 'admin@focusacademyperambalur.com');

    render(
      <MemoryRouter>
        <AdminStudentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('P. Rahul')).toBeDefined();
      expect(screen.getByText(/Shift: Morning shift/i)).toBeDefined();
      expect(screen.getByText(/Finishes: 3:30 PM/i)).toBeDefined();
      expect(screen.getByText(/Travel: 25m/i)).toBeDefined();
      expect(screen.getByText(/Timing Risk/i)).toBeDefined();
    });
  });

  it('renders AdminLeadsPage with lead school shift, dismissal, travel duration and timing warning badge', async () => {
    localStorage.setItem(
      'focus_academy_submitted_leads_v1',
      JSON.stringify([
        {
          id: 'FA-LEAD-991',
          studentName: 'M. Harish',
          parentName: 'M. Mohan',
          phone: '9842451220',
          grade: 'Class 10',
          board: 'CBSE',
          batchId: 'batch-10-cbse',
          schoolShift: 'Day/Afternoon shift',
          schoolDismissalTime: '16:00',
          travelDurationMinutes: 30,
          scheduleClashWarning: 'Your school schedule may make this batch difficult to reach on time.',
          status: 'new',
          timestamp: new Date().toISOString()
        }
      ])
    );

    render(
      <MemoryRouter>
        <AdminLeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('M. Harish')).toBeDefined();
      expect(screen.getByText(/Shift: Day\/Afternoon shift/i)).toBeDefined();
      expect(screen.getByText(/Finishes: 4:00 PM/i)).toBeDefined();
      expect(screen.getByText(/Travel: 30m/i)).toBeDefined();
      expect(screen.getByText(/Timing Risk/i)).toBeDefined();
    });
  });
});
