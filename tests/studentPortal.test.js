import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFakeServices, mockResponse } from './helpers/fakeFirestore.js';

const holder = vi.hoisted(() => ({ current: null }));
vi.mock('../api/_lib/firebaseAdmin.js', () => ({ getServices: () => holder.current?.services || null }));

import portalHandler from '../api/student-portal.js';

const call = async (token, { ip = '10.7.0.1', query = {}, method = 'GET', body = {} } = {}) => {
  const res = mockResponse();
  await portalHandler(
    { method, body, query, headers: { 'x-forwarded-for': ip, ...(token ? { authorization: `Bearer ${token}` } : {}) }, socket: {} },
    res
  );
  return res;
};

let fake;

beforeEach(() => {
  fake = createFakeServices();
  holder.current = fake;

  fake.seed('student_profiles', 'uid-kaviya', {
    uid: 'uid-kaviya',
    email: 'kaviya@example.com',
    studentName: 'Kaviya S',
    mobile: '9842451220',
  });
  fake.seed('student_profiles', 'uid-aarav', {
    uid: 'uid-aarav',
    email: 'aarav@example.com',
    studentName: 'Aarav S',
    mobile: '9842451220',
  });
  fake.addAccount('tok-kaviya', { uid: 'uid-kaviya', email: 'kaviya@example.com', email_verified: true });
  fake.addAccount('tok-aarav', { uid: 'uid-aarav', email: 'aarav@example.com', email_verified: true });

  fake.seed('students', 'FA-2026-001', {
    id: 'FA-2026-001',
    studentName: 'Kaviya S',
    guardianPhone: '9842451220',
    batchId: 'batch-10-state-board',
    batchName: 'Class 10 State Board',
    status: 'active',
    enrollmentId: 'FA-ENR-001',
    studentUid: null,
    feeConfig: { billingFrequency: 'monthly', amountPerCycle: 2200, billingStartDate: '2026-10-01', nextDueDate: '2026-10-05' },
  });
  fake.seed('students', 'FA-2026-002', {
    id: 'FA-2026-002',
    studentName: 'Aarav S',
    guardianPhone: '9842451220',
    batchId: 'batch-9-preboard',
    batchName: 'Class 9 Pre-Board',
    status: 'active',
    enrollmentId: 'FA-ENR-002',
    studentUid: null,
    feeConfig: { billingFrequency: 'monthly', amountPerCycle: 2400, nextDueDate: '2026-10-10' },
  });

  fake.seed('fee_obligations', 'OBL-K-1', {
    id: 'OBL-K-1', studentId: 'FA-2026-001', studentName: 'Kaviya S', batchId: 'batch-10-state-board',
    billingCycle: 'October 2026', dueDate: '2026-10-05', amountDue: 2200, amountPaid: 700, waivedAmount: 0, balance: 1500, status: 'partially_paid',
  });
  fake.seed('fee_obligations', 'OBL-A-1', {
    id: 'OBL-A-1', studentId: 'FA-2026-002', studentName: 'Aarav S', batchId: 'batch-9-preboard',
    billingCycle: 'October 2026', dueDate: '2026-10-10', amountDue: 2400, amountPaid: 0, waivedAmount: 0, balance: 2400, status: 'pending',
  });

  fake.seed('payments', 'TXN-K-1', {
    id: 'TXN-K-1', receiptNumber: 'REC-2026-0001', studentId: 'FA-2026-001', obligationId: 'OBL-K-1',
    amount: 700, paymentDate: '2026-10-04', paymentMethod: 'cash', createdAt: '2026-10-04T10:00:00.000Z',
  });
  fake.seed('payments', 'TXN-K-REV', {
    id: 'TXN-K-REV', receiptNumber: 'REC-2026-0002', studentId: 'FA-2026-001', obligationId: 'OBL-K-1',
    amount: 300, paymentDate: '2026-10-03', paymentMethod: 'cash', isReversed: true, reversed: true,
    createdAt: '2026-10-03T10:00:00.000Z',
  });

  fake.seed('enrollments', 'FA-ENR-001', {
    id: 'FA-ENR-001', studentName: 'Kaviya S', phone: '9842451220', studentUid: null,
    batchId: 'batch-10-state-board', batchName: 'Class 10 State Board', status: 'confirmed', enrolledAt: '2026-10-01T10:00:00.000Z',
  });
  fake.seed('enrollments', 'FA-ENR-002', {
    id: 'FA-ENR-002', studentName: 'Aarav S', phone: '9842451220', studentUid: null,
    batchId: 'batch-9-preboard', batchName: 'Class 9 Pre-Board', status: 'confirmed', enrolledAt: '2026-10-02T10:00:00.000Z',
  });
});

afterEach(() => {
  holder.current = null;
});

describe('Student portal API', () => {
  it('requires an authenticated student session', async () => {
    const res = await call(null);
    expect(res.statusCode).toBe(401);
    expect(fake.read('students', 'FA-2026-001').studentUid).toBeNull();
  });

  it('rejects an invalid or revoked token', async () => {
    const res = await call('not-a-real-token');
    expect(res.statusCode).toBe(401);
  });

  it('links the signed-in account to its central student record and ledger', async () => {
    const res = await call('tok-kaviya');
    expect(res.statusCode).toBe(200);
    expect(res.body.linked).toBe(true);
    expect(res.body.student.id).toBe('FA-2026-001');
    expect(res.body.student.admissionStatus).toBe('confirmed');
    expect(res.body.fee.totalCharged).toBe(2200);
    expect(res.body.fee.totalPaid).toBe(700);
    expect(res.body.fee.outstanding).toBe(1500);
    expect(res.body.fee.dueDate).toBe('2026-10-05');
    expect(res.body.payments).toHaveLength(2);
    expect(fake.read('students', 'FA-2026-001').studentUid).toBe('uid-kaviya');
    expect(fake.read('enrollments', 'FA-ENR-001').studentUid).toBe('uid-kaviya');
  });

  it('never returns another sibling’s ledger even though the guardian phone is shared', async () => {
    const res = await call('tok-aarav');
    expect(res.statusCode).toBe(200);
    expect(res.body.student.id).toBe('FA-2026-002');
    expect(res.body.obligations.map((o) => o.id)).toEqual(['OBL-A-1']);
    expect(res.body.fee.totalCharged).toBe(2400);
    expect(res.body.fee.totalPaid).toBe(0);
    expect(res.body.enrollments.map((e) => e.id)).toEqual(['FA-ENR-002']);
  });

  it('does not bind a record when the account name does not match the shared phone', async () => {
    fake.seed('student_profiles', 'uid-cousin', { uid: 'uid-cousin', studentName: 'Someone Else', mobile: '9842451220' });
    fake.addAccount('tok-cousin', { uid: 'uid-cousin', email: 'cousin@example.com', email_verified: true });
    const res = await call('tok-cousin');
    expect(res.statusCode).toBe(200);
    expect(res.body.linked).toBe(false);
    expect(res.body.reason).toBe('name_mismatch');
    expect(res.body.student).toBeNull();
    expect(res.body.obligations).toHaveLength(0);
  });

  it('refuses a student record already bound to a different account', async () => {
    fake.seed('students', 'FA-2026-001', { ...fake.read('students', 'FA-2026-001'), studentUid: 'uid-someone-else' });
    const res = await call('tok-kaviya');
    expect(res.body.linked).toBe(false);
    expect(res.body.reason).toBe('account_mismatch');
    expect(res.body.fee).toBeNull();
  });

  it('ignores client-supplied student identifiers and always uses the token identity', async () => {
    const res = await call('tok-kaviya', { query: { studentId: 'FA-2026-002', studentUid: 'uid-aarav' } });
    expect(res.body.student.id).toBe('FA-2026-001');
    expect(res.body.fee.totalCharged).toBe(2200);
  });

  it('excludes reversed payments and applies approved waivers to the outstanding balance', async () => {
    fake.seed('fee_obligations', 'OBL-K-1', {
      ...fake.read('fee_obligations', 'OBL-K-1'), waivedAmount: 500,
    });
    const res = await call('tok-kaviya');
    expect(res.body.fee.totalWaived).toBe(500);
    expect(res.body.fee.outstanding).toBe(2200 - 700 - 500);
    expect(res.body.fee.totalPaid).toBe(700);
    expect(res.body.fee.paymentStatus).toBe('partial');
  });

  it('reports an unlinked profile honestly instead of inventing numbers', async () => {
    fake.seed('student_profiles', 'uid-new', { uid: 'uid-new', studentName: 'New Student', mobile: '9811111111' });
    fake.addAccount('tok-new', { uid: 'uid-new', email: 'new@example.com', email_verified: true });
    const res = await call('tok-new');
    expect(res.body.linked).toBe(false);
    expect(res.body.reason).toBe('no_student_record');
    expect(res.body.fee).toBeNull();
  });

  it('records and persists genuine student doubts without canned fake answers', async () => {
    const res = await call('tok-kaviya', {
      method: 'POST',
      body: {
        action: 'submit-doubt',
        subject: 'Physics',
        topic: 'Wave Optics',
        question: 'How do you derive the fringe width formula beta = lambda * D / d?'
      }
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.doubt.subject).toBe('Physics');
    expect(res.body.doubt.status).toBe('pending');
    expect(res.body.doubt.response).toBeNull();
    expect(res.body.doubt.faculty).toBeNull();

    const portalRes = await call('tok-kaviya');
    expect(portalRes.body.student.doubts).toHaveLength(1);
    expect(portalRes.body.student.doubts[0].question).toContain('fringe width');
  });

  it('rejects doubt submission with empty or short question', async () => {
    const res = await call('tok-kaviya', {
      method: 'POST',
      body: { action: 'submit-doubt', question: 'hi' }
    });
    expect(res.statusCode).toBe(400);
  });

  it('resolves student email by registered Student ID in rate-limited lookup', async () => {
    const res = await call(null, {
      method: 'POST',
      body: { action: 'resolve-id', identifier: 'FA-2026-001' }
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe('kaviya@example.com');
  });
});
