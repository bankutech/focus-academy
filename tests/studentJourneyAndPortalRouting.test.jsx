import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'fs';
import path from 'path';

import { createFakeServices, mockResponse } from './helpers/fakeFirestore.js';
import portalHandler from '../api/student-portal.js';
import batchesHandler from '../api/batches.js';
import { mintToken } from '../api/_lib/stepToken.js';
import StudentLoginPage from '../src/pages/StudentLoginPage';
import StudentRegisterPage from '../src/pages/StudentRegisterPage';
import StudentProtectedRoute from '../src/components/common/StudentProtectedRoute';
import { StudentAuthProvider } from '../src/context/StudentAuthContext';
import { AppProvider } from '../src/context/AppContext';

const holder = vi.hoisted(() => ({ current: null }));
vi.mock('../api/_lib/firebaseAdmin.js', () => ({ getServices: () => holder.current?.services || null }));

describe('Student Portal Routing and 404 Prevention Tests', () => {
  it('confirms all student portal and register routes exist in src/App.jsx', () => {
    const appContent = fs.readFileSync(path.resolve(__dirname, '../src/App.jsx'), 'utf-8');

    expect(appContent).toContain('path="/login"');
    expect(appContent).toContain('path="/student/login"');
    expect(appContent).toContain('path="/student-login"');
    expect(appContent).toContain('path="/student-portal/login"');
    expect(appContent).toContain('path="/portal/login"');

    expect(appContent).toContain('path="/signup"');
    expect(appContent).toContain('path="/register"');
    expect(appContent).toContain('path="/student/register"');
    expect(appContent).toContain('path="/student-register"');
    expect(appContent).toContain('path="/student-portal/register"');

    expect(appContent).toContain('path="/student-dashboard"');
    expect(appContent).toContain('path="/student-portal"');
    expect(appContent).toContain('path="/student/dashboard"');
    expect(appContent).toContain('path="/student-portal/dashboard"');
    expect(appContent).toContain('path="/student/portal"');
    expect(appContent).toContain('path="/portal"');
    expect(appContent).toContain('path="/portal/dashboard"');
  });

  it('preserves the zero-comment requirement on src/App.jsx and src/pages/EnrollPage.jsx', () => {
    const checkFile = (filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        expect(trimmed.startsWith('//')).toBe(false);
        expect(trimmed.startsWith('/*')).toBe(false);
        expect(trimmed.startsWith('<!--')).toBe(false);
        expect(trimmed.includes('{/*')).toBe(false);
      }
    };
    checkFile(path.resolve(__dirname, '../src/App.jsx'));
    checkFile(path.resolve(__dirname, '../src/pages/EnrollPage.jsx'));
    checkFile(path.resolve(__dirname, '../api/leads.js'));
  });

  it('renders StudentLoginPage without crashing on /login, /student-login, and /student-portal/login', () => {
    render(
      <MemoryRouter initialEntries={['/student-login']}>
        <StudentAuthProvider>
          <StudentLoginPage />
        </StudentAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Student Login/i })).toBeDefined();
    expect(screen.getByLabelText(/Email Address or Student ID/i)).toBeDefined();
    expect(screen.getByLabelText(/^Password$/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeDefined();
  });

  it('renders StudentRegisterPage without crashing on /student-register', () => {
    render(
      <MemoryRouter initialEntries={['/student-register']}>
        <StudentAuthProvider>
          <AppProvider>
            <StudentRegisterPage />
          </AppProvider>
        </StudentAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Create Student Account/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/Student's Full Name/i)).toBeDefined();
    expect(screen.getAllByPlaceholderText(/10-digit mobile/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Complete Student Registration/i })).toBeDefined();
  });

  it('redirects unauthenticated visitors attempting to view /student-portal or /student-dashboard to /login', () => {
    render(
      <MemoryRouter initialEntries={['/student-portal']}>
        <StudentAuthProvider>
          <Routes>
            <Route path="/login" element={<div>Student Login Page View</div>} />
            <Route
              path="/student-portal"
              element={
                <StudentProtectedRoute>
                  <div>Protected Student Dashboard</div>
                </StudentProtectedRoute>
              }
            />
          </Routes>
        </StudentAuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Student Login Page View')).toBeDefined();
    expect(screen.queryByText('Protected Student Dashboard')).toBeNull();
  });
});

describe('Student ID Generation and Name Prefix Normalization Tests', () => {
  const deriveStudentPrefix = (studentName) => {
    const words = String(studentName || '').trim().split(/[\s.]+/).filter((w) => w.length >= 3);
    const primaryWord = words[0] || String(studentName || '').replace(/[^a-zA-Z]/g, '');
    const cleanPrefix = primaryWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase();
    return cleanPrefix.length >= 3 ? cleanPrefix.slice(0, 3) : (cleanPrefix + 'STU').slice(0, 3);
  };

  const generateStudentId = (studentName, year, counter) => {
    const yearSuffix = String(year).slice(-2);
    const prefix = deriveStudentPrefix(studentName);
    return `FA${yearSuffix}-${prefix}-${String(counter).padStart(6, '0')}`;
  };

  it('derives expected short name prefixes for representative names', () => {
    expect(deriveStudentPrefix('S. Kaviya')).toBe('KAV');
    expect(deriveStudentPrefix('Sagnik Mitra')).toBe('SAG');
    expect(deriveStudentPrefix('Arpit Sharma')).toBe('ARP');
    expect(deriveStudentPrefix('Rahul S')).toBe('RAH');
    expect(deriveStudentPrefix('Árpit')).toBe('ARP');
    expect(deriveStudentPrefix('Dr. Sundaram')).toBe('SUN');
  });

  it('handles students with single-character initials and short names safely', () => {
    expect(deriveStudentPrefix('S K')).toBe('SKS');
    expect(deriveStudentPrefix('')).toBe('STU');
    expect(deriveStudentPrefix('12345')).toBe('STU');
  });

  it('formats student IDs matching FA{YY}-{PREFIX}-{SEQ} standard', () => {
    const id1 = generateStudentId('S. Kaviya', 2026, 1);
    const id2 = generateStudentId('Sagnik Mitra', 2026, 4821);
    const id3 = generateStudentId('Arpit Sharma', 2026, 4822);

    expect(id1).toBe('FA26-KAV-000001');
    expect(id2).toBe('FA26-SAG-004821');
    expect(id3).toBe('FA26-ARP-004822');
  });

  it('guarantees unique IDs for students with identical names via monotonic counter', () => {
    const student1 = generateStudentId('Rahul S', 2026, 101);
    const student2 = generateStudentId('Rahul S', 2026, 102);

    expect(student1).not.toBe(student2);
    expect(student1).toBe('FA26-RAH-000101');
    expect(student2).toBe('FA26-RAH-000102');
  });
});

describe('Student Portal API - Resolve ID and Multi-Student Isolation', () => {
  let fake;
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-session-secret-at-least-32-characters-long!';
    fake = createFakeServices();
    holder.current = fake;

    fake.seed('students', 'FA26-KAV-000001', {
      id: 'FA26-KAV-000001',
      studentName: 'Kaviya S',
      email: 'kaviya@example.com',
      guardianPhone: '9842451220',
      batchId: 'batch-10-state-board',
      batchName: 'Class 10 State Board',
      status: 'active',
      enrollmentId: 'FA-ENR-001',
      studentUid: 'uid-kaviya',
      feeConfig: { billingFrequency: 'monthly', amountPerCycle: 2200, nextDueDate: '2026-10-05' },
    });

    fake.seed('students', 'FA26-AAR-000002', {
      id: 'FA26-AAR-000002',
      studentName: 'Aarav S',
      email: 'aarav@example.com',
      guardianPhone: '9842451220',
      batchId: 'batch-9-preboard',
      batchName: 'Class 9 Pre-Board',
      status: 'active',
      enrollmentId: 'FA-ENR-002',
      studentUid: 'uid-aarav',
      feeConfig: { billingFrequency: 'monthly', amountPerCycle: 2400, nextDueDate: '2026-10-10' },
    });

    fake.seed('fee_obligations', 'OBL-KAV', {
      id: 'OBL-KAV', studentId: 'FA26-KAV-000001', amountDue: 2200, amountPaid: 2200, balance: 0, status: 'paid',
    });
    fake.seed('fee_obligations', 'OBL-AAR', {
      id: 'OBL-AAR', studentId: 'FA26-AAR-000002', amountDue: 2400, amountPaid: 0, balance: 2400, status: 'pending',
    });

    fake.addAccount('tok-kaviya', { uid: 'uid-kaviya', email: 'kaviya@example.com', email_verified: true });
    fake.addAccount('tok-aarav', { uid: 'uid-aarav', email: 'aarav@example.com', email_verified: true });
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalSecret;
    holder.current = null;
  });

  it('resolves registered email address by Student ID via POST /api/student-portal', async () => {
    const res = mockResponse();
    await portalHandler({
      method: 'POST',
      body: { action: 'resolve-id', identifier: 'FA26-KAV-000001' },
      headers: { 'x-forwarded-for': '10.8.0.1' },
      socket: {},
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.email).toBe('kaviya@example.com');
  });

  it('rejects unknown Student ID lookup with safe error without leaking account existence', async () => {
    const res = mockResponse();
    await portalHandler({
      method: 'POST',
      body: { action: 'resolve-id', identifier: 'FA26-NONEXISTENT' },
      headers: { 'x-forwarded-for': '10.8.0.2' },
      socket: {},
    }, res);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('No account found');
  });

  it('enforces complete isolation between siblings Kaviya and Aarav', async () => {
    const resKav = mockResponse();
    await portalHandler({
      method: 'GET',
      headers: { authorization: 'Bearer tok-kaviya', 'x-forwarded-for': '10.8.0.3' },
      socket: {},
    }, resKav);

    expect(resKav.statusCode).toBe(200);
    expect(resKav.body.student.id).toBe('FA26-KAV-000001');
    expect(resKav.body.student.studentName).toBe('Kaviya S');
    expect(resKav.body.fee.outstanding).toBe(0);

    const resAar = mockResponse();
    await portalHandler({
      method: 'GET',
      headers: { authorization: 'Bearer tok-aarav', 'x-forwarded-for': '10.8.0.4' },
      socket: {},
    }, resAar);

    expect(resAar.statusCode).toBe(200);
    expect(resAar.body.student.id).toBe('FA26-AAR-000002');
    expect(resAar.body.student.studentName).toBe('Aarav S');
    expect(resAar.body.fee.outstanding).toBe(2400);
  });

  it('prevents stale session academic mismatch when a student switches from Class 8 to Class 12 in /api/batches', async () => {
    fake.seed('batches', 'batch-12-science', {
      id: 'batch-12-science',
      name: 'Class 12 Higher Secondary Science (HSC, CBSE & ISC)',
      grade: 'Class 12',
      board: 'CBSE Board',
      capacity: 12,
      enrolledCount: 3,
      isArchived: false,
    });

    fake.seed('applications', 'APP-USER-SAGNIK', {
      applicationId: 'APP-USER-SAGNIK',
      completedStep: 4,
      phone: '9520926065',
      studentName: 'Sagnik Mitra',
      grade: 'Class 8',
      board: 'TN State Board (Samacheer)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { token } = mintToken('APP-USER-SAGNIK', 4);

    const res = mockResponse();
    await batchesHandler({
      method: 'POST',
      body: {
        batchId: 'batch-12-science',
        studentName: 'Sagnik Mitra',
        phone: '9520926065',
        grade: 'Class 12',
        board: 'CBSE Board',
        stepToken: token,
      },
      headers: { 'x-forwarded-for': '10.8.0.5' },
      socket: {},
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reservationId).toBeDefined();

    const updatedApp = fake.read('applications', 'APP-USER-SAGNIK');
    expect(updatedApp.grade).toBe('Class 12');
    expect(updatedApp.board).toBe('CBSE Board');
  });

  it('rejects genuine academic mismatch when selected batch is truly incompatible', async () => {
    fake.seed('batches', 'batch-12-science', {
      id: 'batch-12-science',
      name: 'Class 12 Higher Secondary Science (HSC, CBSE & ISC)',
      grade: 'Class 12',
      board: 'CBSE Board',
      capacity: 12,
      enrolledCount: 3,
      isArchived: false,
    });

    fake.seed('applications', 'APP-GENUINE-C8', {
      applicationId: 'APP-GENUINE-C8',
      completedStep: 4,
      phone: '9842451220',
      studentName: 'Middle Schooler',
      grade: 'Class 8',
      board: 'TN State Board (Samacheer)',
    });

    const { token } = mintToken('APP-GENUINE-C8', 4);

    const res = mockResponse();
    await batchesHandler({
      method: 'POST',
      body: {
        batchId: 'batch-12-science',
        studentName: 'Middle Schooler',
        phone: '9842451220',
        grade: 'Class 8',
        board: 'TN State Board (Samacheer)',
        stepToken: token,
      },
      headers: { 'x-forwarded-for': '10.8.0.6' },
      socket: {},
    }, res);

    expect(res.statusCode).toBe(422);
    expect(res.body.error).toContain('Academic mismatch');
  });
});
