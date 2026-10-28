import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createFakeServices, mockResponse } from './helpers/fakeFirestore.js';

const holder = vi.hoisted(() => ({ current: null }));
vi.mock('../api/_lib/firebaseAdmin.js', () => ({ getServices: () => holder.current?.services || null }));

import sessionHandler from '../api/session.js';
import batchesHandler from '../api/batches.js';
import leadsHandler from '../api/leads.js';
import whatsappHandler from '../api/whatsapp.js';
import paymentsHandler from '../api/payments.js';
import opsHealthHandler from '../api/admin/ops-health.js';

const call = async (handler, body, { method = 'POST', ip = '10.0.0.1', headers = {} } = {}) => {
  const res = mockResponse();
  await handler({ method, body, headers: { 'x-forwarded-for': ip, ...headers } }, res);
  return res;
};

const BATCH = (id, grade, board, enrolledCount = 9) => ({
  id, name: id, grade, board, capacity: 12, enrolledCount, isArchived: false, timing: '6:00 PM – 7:30 PM', monthlyFee: 2200,
});

const person = (n, grade = 'Class 10', board = 'TN State Board (Samacheer)') => ({
  studentName: `Student ${n}`, phone: `98421000${String(n).padStart(2, '0')}`, grade, board,
});

const reachStep4 = async (p, ip) => {
  let applicationId;
  let token;
  for (const step of [2, 3, 4]) {
    const res = await call(sessionHandler, { ...p, step, applicationId }, { ip });
    expect(res.statusCode).toBe(200);
    applicationId = res.body.applicationId;
    token = res.body.token;
  }
  return { applicationId, token };
};

let fake;

beforeEach(() => {
  process.env.SESSION_SECRET = 'k'.repeat(48);
  fake = createFakeServices();
  holder.current = fake;
  fake.seed('batches', 'batch-10-state-board', BATCH('batch-10-state-board', 'Class 10', 'TN State Board (Samacheer)'));
  fake.seed('batches', 'batch-12-science-board', BATCH('batch-12-science-board', 'Class 12', 'TN State Board, CBSE & ISC'));
});

afterEach(() => {
  delete process.env.SESSION_SECRET;
  holder.current = null;
});

describe('Admission session API', () => {
  it('fails closed when the secret or database is missing', async () => {
    delete process.env.SESSION_SECRET;
    expect((await call(sessionHandler, { ...person(1), step: 2 })).statusCode).toBe(503);
    process.env.SESSION_SECRET = 'k'.repeat(48);
    holder.current = null;
    expect((await call(sessionHandler, { ...person(1), step: 2 })).statusCode).toBe(503);
  });

  it('only advances one step at a time and keeps an application bound to its phone', async () => {
    const jump = await call(sessionHandler, { ...person(1), step: 4 });
    expect(jump.statusCode).toBe(409);

    const first = await call(sessionHandler, { ...person(1), step: 2 });
    expect(first.statusCode).toBe(200);
    const skip = await call(sessionHandler, { ...person(1), step: 4, applicationId: first.body.applicationId });
    expect(skip.statusCode).toBe(409);

    const other = await call(sessionHandler, { ...person(2), step: 3, applicationId: first.body.applicationId });
    expect(other.statusCode).toBe(403);
  });

  it('rejects malformed identity fields and out-of-range steps', async () => {
    expect((await call(sessionHandler, { ...person(1), phone: '12345', step: 2 })).statusCode).toBe(400);
    expect((await call(sessionHandler, { ...person(1), step: 9 })).statusCode).toBe(400);
    expect((await call(sessionHandler, { ...person(1), step: 1 })).statusCode).toBe(400);
  });

  it('rate limits through the shared store, not process memory', async () => {
    let last;
    for (let i = 0; i < 41; i += 1) last = await call(sessionHandler, { ...person(i % 50), step: 2 }, { ip: '10.9.9.9' });
    expect(last.statusCode).toBe(429);
  });
});

describe('Seat reservation API', () => {
  it('requires a verified step-4 token', async () => {
    const anon = await call(batchesHandler, { batchId: 'batch-10-state-board', ...person(1) });
    expect(anon.statusCode).toBe(401);

    const early = await call(sessionHandler, { ...person(1), step: 2 });
    const res = await call(batchesHandler, { batchId: 'batch-10-state-board', ...person(1), stepToken: early.body.token });
    expect(res.statusCode).toBe(401);

    const forged = await call(batchesHandler, { batchId: 'batch-10-state-board', ...person(1), stepToken: 'v2.APP-X.4.9999999999999.deadbeef' });
    expect(forged.statusCode).toBe(401);
  });

  it('holds a seat once per application and is idempotent on retries', async () => {
    const p = person(1);
    const { token } = await reachStep4(p);
    const a = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token });
    const b = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token });
    expect(a.statusCode).toBe(200);
    expect(b.body.reservationId).toBe(a.body.reservationId);
    expect(b.body.seatsRemaining).toBe(2);
  });

  it('never sells more than 12 seats', async () => {
    const outcomes = [];
    for (let n = 1; n <= 5; n += 1) {
      const p = person(n);
      const { token } = await reachStep4(p, `10.1.0.${n}`);
      outcomes.push((await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token }, { ip: `10.1.0.${n}` })).statusCode);
    }
    expect(outcomes.filter((s) => s === 200)).toHaveLength(3);
    expect(outcomes.filter((s) => s === 409)).toHaveLength(2);
  });

  it('frees a seat when a hold expires', async () => {
    fake.seed('reservations', 'APP-OLD__batch-10-state-board', {
      reservationId: 'RES-OLD', applicationId: 'APP-OLD', batchId: 'batch-10-state-board', phone: '9800000000',
      status: 'held', expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const listing = await call(batchesHandler, undefined, { method: 'GET' });
    expect(listing.body.batches.find((b) => b.id === 'batch-10-state-board').seatsRemaining).toBe(3);
  });

  it('rejects a batch that does not fit the student grade or board', async () => {
    const p = person(1, 'Class 10');
    const { token } = await reachStep4(p);
    const res = await call(batchesHandler, { batchId: 'batch-12-science-board', ...p, stepToken: token });
    expect(res.statusCode).toBe(422);
  });

  it('refuses a token used with a different mobile number', async () => {
    const { token } = await reachStep4(person(1));
    const res = await call(batchesHandler, { batchId: 'batch-10-state-board', ...person(2), stepToken: token });
    expect(res.statusCode).toBe(403);
  });
});

describe('Lead API', () => {
  const inquiry = (extra = {}) => ({ ...person(7), parentName: 'Parent', ...extra });

  it('stores a sanitized inquiry in the database', async () => {
    const res = await call(leadsHandler, inquiry({ studentName: '<script>alert(1)</script>Kaviya', notes: "x'; DROP" }), { ip: '10.2.0.1' });
    expect(res.statusCode).toBe(200);
    const stored = fake.all('leads')[0];
    expect(stored.studentName).not.toMatch(/[<>]/);
    expect(stored.notes).not.toMatch(/['";]/);
  });

  it('rejects oversized and invalid payloads', async () => {
    expect((await call(leadsHandler, inquiry({ notes: 'A'.repeat(9000) }), { ip: '10.2.0.2' })).statusCode).toBe(413);
    expect((await call(leadsHandler, inquiry({ phone: '123' }), { ip: '10.2.0.3' })).statusCode).toBe(400);
  });

  it('rejects automated spambots populating honeypot fields', async () => {
    const res = await call(leadsHandler, inquiry({ website_url: 'http://spam.ru' }), { ip: '10.2.0.7' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Automated submission rejected/i);
  });

  it('safeguards child secondary phone and medical alert fields', async () => {
    const res = await call(leadsHandler, inquiry({
      secondaryPhone: '+91 98424 51221',
      medicalAlert: 'Asthma inhaler in backpack'
    }), { ip: '10.2.0.8' });
    expect(res.statusCode).toBe(200);
    const stored = fake.all('leads').find(l => l.secondaryPhone === '9842451221');
    expect(stored).toBeDefined();
    expect(stored.secondaryPhone).toBe('9842451221');
    expect(stored.medicalAlert).toBe('Asthma inhaler in backpack');
  });

  it('rate limits bursts per client', async () => {
    let last;
    for (let i = 0; i < 11; i += 1) last = await call(leadsHandler, inquiry(), { ip: '10.2.0.9' });
    expect(last.statusCode).toBe(429);
  });

  const submitEnrollment = async (p, ip = '10.3.0.1', extra = {}) => {
    const { applicationId, token } = await reachStep4(p, ip);
    const hold = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token }, { ip });
    const res = await call(leadsHandler, {
      ...p,
      parentName: 'Parent',
      batchId: 'batch-10-state-board',
      selectedBatchName: 'Class 10 State Board Evening',
      reservationId: hold.body.reservationId,
      stepToken: token,
      ...extra
    }, { ip });
    return { res, applicationId, reservationId: hold.body.reservationId };
  };

  it('confirms the held seat and registers the student in the official roster', async () => {
    const p = person(3);
    const { res, reservationId } = await submitEnrollment(p, '10.3.0.1');
    expect(res.statusCode).toBe(200);

    const lead = fake.all('leads')[0];
    expect(lead.source).toBe('enrollment');
    expect(lead.status).toBe('converted');
    expect(lead.enrollmentStatus).toBe('confirmed');

    const enrollment = fake.all('enrollments')[0];
    expect(enrollment.id).toBe(lead.id);
    expect(enrollment.status).toBe('confirmed');
    expect(enrollment.studentId).toBeTruthy();
    expect(enrollment.feeStatus).toBe('pending');
    expect(enrollment.paymentStatus).toBe('unpaid');

    const student = fake.read('students', enrollment.studentId);
    expect(student.studentName).toBe(p.studentName);
    expect(student.batchId).toBe('batch-10-state-board');
    expect(student.enrollmentId).toBe(enrollment.id);
    expect(student.source).toBe('online_enrollment');

    const obligation = fake.read('fee_obligations', enrollment.feeObligationId);
    expect(obligation.studentId).toBe(student.id);
    expect(obligation.amountDue).toBe(2200);
    expect(obligation.amountPaid).toBe(0);
    expect(obligation.balance).toBe(2200);
    expect(obligation.status).toBe('pending');
    expect(obligation.dueDate).toMatch(/^\d{4}-\d{2}-05$/);
    expect(obligation.billingCycle).toMatch(/^[A-Z][a-z]+ \d{4}$/);

    // No payment is invented because no money changed hands.
    expect(fake.all('payments')).toHaveLength(0);

    // The seat is counted exactly once: the hold is released as the student is rostered.
    const reservation = fake.all('reservations').find(r => r.reservationId === reservationId);
    expect(reservation.status).toBe('enrolled');
    expect(fake.read('batches', 'batch-10-state-board').enrolledCount).toBe(10);
  });

  it('keeps a repeated submission idempotent instead of duplicating records', async () => {
    const p = person(3);
    const first = await submitEnrollment(p, '10.3.0.5');
    expect(first.res.statusCode).toBe(200);
    expect(first.res.body.meta.duplicate).toBe(false);

    const second = await call(leadsHandler, {
      ...p,
      parentName: 'Parent',
      batchId: 'batch-10-state-board',
      selectedBatchName: 'Class 10 State Board Evening',
      reservationId: first.reservationId,
      stepToken: (await reachStep4(p, '10.3.0.5')).token,
      enrollmentId: first.res.body.data.id
    }, { ip: '10.3.0.5' });

    expect(second.statusCode).toBe(200);
    expect(second.body.duplicate).toBe(true);
    expect(second.body.data.id).toBe(first.res.body.data.id);
    expect(second.body.meta.studentId).toBe(first.res.body.meta.studentId);
    expect(second.body.meta.feeObligationId).toBe(first.res.body.meta.feeObligationId);
    expect(second.body.meta.enrollmentStatus).toBe('confirmed');
    expect(fake.all('leads')).toHaveLength(1);
    expect(fake.all('enrollments')).toHaveLength(1);
    expect(fake.all('students')).toHaveLength(1);
    expect(fake.all('fee_obligations')).toHaveLength(1);
    expect(fake.read('batches', 'batch-10-state-board').enrolledCount).toBe(10);
  });

  it('does not promote a waitlisted application into a confirmed seat', async () => {
    const p = person(6);
    const { applicationId, token } = await reachStep4(p, '10.3.0.6');
    // Fill the classroom so the reservation request is forced onto the waitlist.
    fake.seed('batches', 'batch-10-state-board', {
      ...fake.read('batches', 'batch-10-state-board'),
      enrolledCount: 12
    });
    const hold = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token, allowWaitlist: true }, { ip: '10.3.0.6' });
    expect(hold.body.waitlisted).toBe(true);

    const res = await call(leadsHandler, {
      ...p,
      parentName: 'Parent',
      batchId: 'batch-10-state-board',
      reservationId: hold.body.reservationId,
      stepToken: token
    }, { ip: '10.3.0.6' });
    expect(res.statusCode).toBe(200);

    const enrollment = fake.all('enrollments')[0];
    expect(enrollment.status).toBe('waitlisted');
    expect(enrollment.studentId).toBeUndefined();
    expect(enrollment.feeObligationId).toBeUndefined();
    expect(fake.all('students')).toHaveLength(0);
    expect(fake.all('fee_obligations')).toHaveLength(0);
    expect(fake.all('reservations').find(r => r.applicationId === applicationId).status).toBe('waitlist');
  });

  it('stores and validates operational, academic, emergency contact, dispatch, and verification details', async () => {
    const p = person(5);
    const { token } = await reachStep4(p);
    const hold = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token });
    const payload = {
      ...p,
      batchId: 'batch-10-state-board',
      reservationId: hold.body.reservationId,
      stepToken: token,
      schoolName: 'Roever Matric Higher Secondary School',
      educationBoard: 'State Board',
      targetYear: '2027',
      previousScore: '91%',
      schoolShift: 'Morning Shift',
      whatsappNumber: '9842451220',
      mediumOfInstruction: 'English',
      emergencyContactName: 'Mr. S. Kannan',
      emergencyRelationship: 'Father',
      emergencyPhone: '9842451222',
      studentIdNumber: 'SCH-ROEVER-2026',
      gstin: '33AAAAA0000A1Z5',
      addressStreet: 'Door 10, Trichy Main Road',
      addressCityState: 'Perambalur, Tamil Nadu',
      addressPincode: '621212',
    };
    const res = await call(leadsHandler, payload, { ip: '10.3.0.4' });
    expect(res.statusCode).toBe(200);
    const stored = fake.all('leads').find(l => l.studentIdNumber === 'SCH-ROEVER-2026');
    expect(stored).toBeDefined();
    expect(stored.schoolName).toBe('Roever Matric Higher Secondary School');
    expect(stored.educationBoard).toBe('State Board');
    expect(stored.targetYear).toBe('2027');
    expect(stored.previousScore).toBe('91%');
    expect(stored.schoolShift).toBe('Morning Shift');
    expect(stored.whatsappNumber).toBe('9842451220');
    expect(stored.mediumOfInstruction).toBe('English');
    expect(stored.emergencyContactName).toBe('Mr. S. Kannan');
    expect(stored.emergencyRelationship).toBe('Father');
    expect(stored.emergencyPhone).toBe('9842451222');
    expect(stored.gstin).toBe('33AAAAA0000A1Z5');
    expect(stored.addressStreet).toBe('Door 10, Trichy Main Road');
    expect(stored.addressPincode).toBe('621212');
  });

  it('rejects malformed GSTIN or invalid pincode in lead submissions', async () => {
    const invalidGst = await call(leadsHandler, inquiry({ gstin: 'INVALID_GSTIN_123' }), { ip: '10.2.0.12' });
    expect(invalidGst.statusCode).toBe(400);

    const invalidPin = await call(leadsHandler, inquiry({ addressPincode: '01234' }), { ip: '10.2.0.13' });
    expect(invalidPin.statusCode).toBe(400);
  });

  it('rejects an enrollment lead without a valid hold', async () => {
    const p = person(4);
    const { token } = await reachStep4(p);
    const res = await call(leadsHandler, { ...p, batchId: 'batch-10-state-board', reservationId: 'RES-FAKE', stepToken: token }, { ip: '10.3.0.2' });
    expect(res.statusCode).toBe(409);
    const noToken = await call(leadsHandler, { ...p, batchId: 'batch-10-state-board', reservationId: 'RES-FAKE' }, { ip: '10.3.0.3' });
    expect(noToken.statusCode).toBe(401);
  });

  it('completes a half-saved enrollment left behind by an older browser flow', async () => {
    const p = person(9);
    const { token } = await reachStep4(p, '10.3.0.9');
    const hold = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token }, { ip: '10.3.0.9' });

    fake.seed('enrollments', 'FA-LEGACY-001', {
      id: 'FA-LEGACY-001',
      studentName: p.studentName,
      phone: p.phone,
      grade: p.grade,
      board: p.board,
      batchId: 'batch-10-state-board',
      status: 'pending',
      reservationId: hold.body.reservationId
    });

    const res = await call(leadsHandler, {
      ...p,
      parentName: 'Parent',
      batchId: 'batch-10-state-board',
      reservationId: hold.body.reservationId,
      stepToken: token,
      enrollmentId: 'FA-LEGACY-001'
    }, { ip: '10.3.0.9' });

    expect(res.statusCode).toBe(200);
    const enrollment = fake.read('enrollments', 'FA-LEGACY-001');
    expect(enrollment.status).toBe('confirmed');
    expect(enrollment.studentId).toBeTruthy();
    expect(enrollment.feeObligationId).toBeTruthy();

    const student = fake.read('students', enrollment.studentId);
    expect(student.studentName).toBe(p.studentName);
    expect(student.enrollmentId).toBe('FA-LEGACY-001');

    const obligation = fake.read('fee_obligations', enrollment.feeObligationId);
    expect(obligation.amountDue).toBe(2200);
    expect(obligation.amountPaid).toBe(0);
    expect(obligation.balance).toBe(2200);
    expect(fake.all('payments')).toHaveLength(0);
  });

  it('ignores a client-supplied studentUid so an admission cannot be attached to another account', async () => {
    const p = person(13);
    const { token } = await reachStep4(p, '10.3.1.3');
    const hold = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token }, { ip: '10.3.1.3' });

    const res = await call(leadsHandler, {
      ...p,
      parentName: 'Parent',
      batchId: 'batch-10-state-board',
      reservationId: hold.body.reservationId,
      stepToken: token,
      studentUid: 'uid-victim-account',
      email: 'victim@example.com'
    }, { ip: '10.3.1.3' });

    expect(res.statusCode).toBe(200);
    const enrollment = fake.read('enrollments', res.body.data.id);
    expect(enrollment.studentUid).toBeNull();
    expect(enrollment.email).toBeNull();
    const student = fake.read('students', enrollment.studentId);
    expect(student.studentUid).toBeNull();
  });

  it('links a signed-in student identity only when the token verifies', async () => {
    fake.addAccount('student-token', { uid: 'uid-verified-student', email: 'student@example.com', email_verified: true });
    const p = person(14);
    const { token } = await reachStep4(p, '10.3.1.4');
    const hold = await call(batchesHandler, { batchId: 'batch-10-state-board', ...p, stepToken: token }, { ip: '10.3.1.4' });

    const res = await call(leadsHandler, {
      ...p,
      parentName: 'Parent',
      batchId: 'batch-10-state-board',
      reservationId: hold.body.reservationId,
      stepToken: token
    }, { ip: '10.3.1.4', headers: { authorization: 'Bearer student-token' } });

    expect(res.statusCode).toBe(200);
    const enrollment = fake.read('enrollments', res.body.data.id);
    expect(enrollment.studentUid).toBe('uid-verified-student');
    expect(enrollment.email).toBe('student@example.com');
    const student = fake.read('students', enrollment.studentId);
    expect(student.studentUid).toBe('uid-verified-student');
  });

  it('assigns unique server-generated admission slip numbers per submission', async () => {
    const first = await submitEnrollment(person(11), '10.3.1.1');
    const second = await submitEnrollment(person(12), '10.3.1.2');
    expect(first.res.statusCode).toBe(200);
    expect(second.res.statusCode).toBe(200);

    const ids = [first.res.body.data.id, second.res.body.data.id];
    expect(ids[0]).not.toBe(ids[1]);
    ids.forEach((id) => expect(id).toMatch(/^FA-[0-9A-F]+$/));
    expect(fake.all('students')).toHaveLength(2);
  });
});

describe('Role-based financial API authorization', () => {
  const auth = (token) => ({ headers: { authorization: `Bearer ${token}` }, ip: '10.5.0.1' });

  beforeEach(() => {
    fake.seed('academy_settings', 'main_config', {
      authorizedAdmins: [
        { email: 'admissions@focusacademyperambalur.com', role: 'admissions', active: true },
        { email: 'teacher@focusacademyperambalur.com', role: 'teacher', active: true },
        { email: 'coordinator@focusacademyperambalur.com', role: 'fee_manager', active: true }
      ],
    });
    fake.addAccount('admissions', { uid: 'u-adm', email: 'admissions@focusacademyperambalur.com', email_verified: true, role: 'admissions' });
    fake.addAccount('teacher', { uid: 'u-t', email: 'teacher@focusacademyperambalur.com', email_verified: true, role: 'teacher' });
    fake.addAccount('finance', { uid: 'u-f', email: 'coordinator@focusacademyperambalur.com', email_verified: true, role: 'fee_manager' });
  });

  it('exposes aggregate operational health to administrators without leaking student data', async () => {
    fake.seed('academy_settings', 'main_config', {
      authorizedAdmins: [
        { email: 'principal@focusacademyperambalur.com', role: 'administrator', active: true },
        { email: 'admissions@focusacademyperambalur.com', role: 'admissions', active: true },
      ],
    });
    fake.addAccount('principal', { uid: 'u-p', email: 'principal@focusacademyperambalur.com', email_verified: true });
    fake.seed('enrollments', 'E-1', { status: 'pending', studentName: 'Private Student', phone: '9842451220' });
    fake.seed('reminders', 'R-1', { deliveryStatus: 'failed', studentName: 'Private Student' });
    fake.seed('collection_reconciliations', '2026-10-27', { date: '2026-10-27', status: 'discrepancy', difference: 200 });
    fake.seed('audit_logs', 'L-1', { action: 'BACKUP_CREATED', timestamp: '2026-10-20T10:00:00.000Z' });

    const denied = await call(opsHealthHandler, undefined, { method: 'GET', headers: { authorization: 'Bearer admissions' } });
    expect(denied.statusCode).toBe(403);

    const res = await call(opsHealthHandler, undefined, { method: 'GET', headers: { authorization: 'Bearer principal' } });
    expect(res.statusCode).toBe(200);
    expect(res.body.firestore.ok).toBe(true);
    expect(res.body.queues.pendingAdmissions).toBe(1);
    expect(res.body.notifications.failed).toBe(1);
    expect(res.body.collections.latestReconciliationStatus).toBe('discrepancy');
    expect(JSON.stringify(res.body)).not.toContain('Private Student');
    expect(JSON.stringify(res.body)).not.toContain('9842451220');
  });

  it('rejects admissions and teacher accounts from recording a payment', async () => {
    const body = { action: 'verify', obligationId: 'OBL-1', amount: 100, paymentMethod: 'cash' };
    expect((await call(paymentsHandler, body, auth('admissions'))).statusCode).toBe(403);
    expect((await call(paymentsHandler, body, auth('teacher'))).statusCode).toBe(403);
    expect((await call(paymentsHandler, body)).statusCode).toBe(401);
  });
});

describe('WhatsApp reminder API', () => {
  const auth = (token) => ({ headers: { authorization: `Bearer ${token}` }, ip: '10.4.0.1' });

  beforeEach(() => {
    fake.seed('academy_settings', 'main_config', {
      authorizedAdmins: [
        { email: 'coordinator@focusacademyperambalur.com', role: 'fee_manager', active: true },
      ],
    });
    fake.addAccount('good', { uid: 'u1', email: 'coordinator@focusacademyperambalur.com', email_verified: true });
    fake.addAccount('stranger', { uid: 'u2', email: 'stranger@example.com', email_verified: true });
    fake.addAccount('unverified', { uid: 'u3', email: 'coordinator@focusacademyperambalur.com', email_verified: false });
    fake.seed('students', 'STU-1', { studentName: 'Kaviya', guardianPhone: '9842451220' });
    fake.seed('fee_obligations', 'OBL-1', { studentId: 'STU-1', studentName: 'Kaviya', amountDue: 2200, amountPaid: 700, waivedAmount: 0, status: 'partially_paid', dueDate: '2026-11-05' });
  });

  it('rejects anonymous, unverified and unauthorized callers', async () => {
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' })).statusCode).toBe(401);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('stranger'))).statusCode).toBe(403);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('unverified'))).statusCode).toBe(403);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('nope'))).statusCode).toBe(401);
  });

  it('uses the balance and guardian number stored on the server, ignoring the request', async () => {
    const res = await call(whatsappHandler, { obligationId: 'OBL-1', amount: 1, phone: '9999999999' }, auth('good'));
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('₹1500');
    expect(res.body.clickToChatUrl).toContain('919842451220');
    expect(res.body.clickToChatUrl).not.toContain('9999999999');
  });

  it('does not invent obligations and sends at most one reminder per day', async () => {
    expect((await call(whatsappHandler, { obligationId: 'MADE-UP' }, auth('good'))).statusCode).toBe(404);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('good'))).statusCode).toBe(200);
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('good'))).statusCode).toBe(409);
  });

  it('respects opt-out and cleared balances', async () => {
    fake.seed('students', 'STU-1', { studentName: 'Kaviya', guardianPhone: '9842451220', communicationConsent: false });
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('good'))).statusCode).toBe(403);
    fake.seed('students', 'STU-1', { studentName: 'Kaviya', guardianPhone: '9842451220' });
    fake.seed('fee_obligations', 'OBL-1', { studentId: 'STU-1', studentName: 'Kaviya', amountDue: 2200, amountPaid: 2200, status: 'paid' });
    expect((await call(whatsappHandler, { obligationId: 'OBL-1' }, auth('good'))).statusCode).toBe(409);
  });
});
