import { describe, it, expect, beforeEach } from 'vitest';
import { AdminDataService } from '../src/services/adminDataService';

const ADMIN = 'director@focusacademyperambalur.com';
const LOG_KEY = 'focus_academy_submitted_leads_v1';

const seedLocalEnrollment = (overrides = {}) => {
  const enrollment = {
    id: 'FA-999001',
    studentName: 'K. Testha',
    parentName: 'R. Parent',
    phone: '9842451999',
    grade: 'Class 10',
    board: 'TN State Board (Samacheer)',
    batchId: 'batch-10-state-board',
    batchName: 'Class 10 State Board (SSLC) - Prime Evening Batch',
    timing: '4:30 PM – 6:00 PM',
    status: 'confirmed',
    source: 'enrollment',
    enrolledAt: new Date().toISOString(),
    feeStatus: 'pending',
    paymentStatus: 'unpaid',
    studentId: null,
    ...overrides
  };
  const logs = [{ ...enrollment, submittedAt: enrollment.enrolledAt, serverConfirmed: true }];
  const serialized = JSON.stringify(logs);
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(LOG_KEY, serialized);
  localStorage.setItem(LOG_KEY, serialized);
  return enrollment;
};

describe('Enrollment record management workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    AdminDataService.resetToSeedData();
  });

  it('lists a completed enrollment and persists edits outside React state', async () => {
    const seeded = seedLocalEnrollment();
    const before = await AdminDataService.getEnrollments();
    expect(before.map(e => e.id)).toContain(seeded.id);

    await AdminDataService.updateEnrollment(seeded.id, {
      studentName: 'K. Testha Updated',
      phone: '9842451888',
      schoolName: 'Roever Matric Higher Secondary School'
    }, ADMIN);

    const reloaded = await AdminDataService.getEnrollmentById(seeded.id);
    expect(reloaded.studentName).toBe('K. Testha Updated');
    expect(reloaded.phone).toBe('9842451888');
    expect(reloaded.schoolName).toBe('Roever Matric Higher Secondary School');

    const stored = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    expect(stored[0].studentName).toBe('K. Testha Updated');
    expect(stored[0].phone).toBe('9842451888');

    const logs = await AdminDataService.getAuditLogs();
    expect(logs.find(l => l.action === 'ENROLLMENT_UPDATED' && l.entityId === seeded.id)).toBeDefined();
  });

  it('rejects invalid enrollment edits instead of saving them', async () => {
    const seeded = seedLocalEnrollment();
    await expect(
      AdminDataService.updateEnrollment(seeded.id, { phone: '123' }, ADMIN)
    ).rejects.toThrow(/10-digit/i);

    await expect(
      AdminDataService.updateEnrollment(seeded.id, { batchId: 'batch-does-not-exist' }, ADMIN)
    ).rejects.toThrow(/not found/i);

    await expect(
      AdminDataService.updateEnrollment(seeded.id, { isReversed: true }, ADMIN)
    ).rejects.toThrow(/cannot be edited/i);

    await expect(
      AdminDataService.updateEnrollment('FA-MISSING', { studentName: 'Someone' }, ADMIN)
    ).rejects.toThrow(/not found/i);

    const unchanged = await AdminDataService.getEnrollmentById(seeded.id);
    expect(unchanged.studentName).toBe('K. Testha');
    expect(unchanged.phone).toBe('9842451999');
  });

  it('registers the student and creates an unpaid fee obligation when an enrollment is confirmed', async () => {
    const seeded = seedLocalEnrollment({ status: 'pending', studentId: null });
    const batchBefore = await AdminDataService.getBatchById('batch-10-state-board');
    const studentsBefore = (await AdminDataService.getStudents({ includeArchived: true })).length;

    const result = await AdminDataService.updateEnrollmentStatus(seeded.id, 'confirmed', {}, ADMIN);
    expect(result.success).toBe(true);
    expect(result.enrollment.status).toBe('confirmed');
    expect(result.enrollment.studentId).toBeTruthy();

    const students = await AdminDataService.getStudents({ includeArchived: true });
    expect(students.length).toBe(studentsBefore + 1);
    const created = students.find(s => s.enrollmentId === seeded.id);
    expect(created).toBeDefined();
    expect(created.studentName).toBe('K. Testha');
    expect(created.source).toBe('online_enrollment');

    const obligations = await AdminDataService.getFeeObligations(created.id);
    expect(obligations).toHaveLength(1);
    expect(obligations[0].amountPaid).toBe(0);
    expect(obligations[0].status).toBe('pending');
    expect(obligations[0].balance).toBe(obligations[0].amountDue);

    const payments = await AdminDataService.getPayments(created.id);
    expect(payments).toHaveLength(0);

    const batchAfter = await AdminDataService.getBatchById('batch-10-state-board');
    expect(batchAfter.enrolledCount).toBe(batchBefore.enrolledCount + 1);
  });

  it('enforces valid status transitions and required reasons', async () => {
    const seeded = seedLocalEnrollment({ status: 'confirmed', studentId: 'FA-2026-001' });

    await expect(
      AdminDataService.updateEnrollmentStatus(seeded.id, 'waitlisted', {}, ADMIN)
    ).rejects.toThrow(/Invalid enrollment status change/i);

    await expect(
      AdminDataService.updateEnrollmentStatus(seeded.id, 'confirmed', {}, ADMIN)
    ).rejects.toThrow(/already 'confirmed'/i);

    await expect(
      AdminDataService.updateEnrollmentStatus(seeded.id, 'cancelled', { reason: 'no' }, ADMIN)
    ).rejects.toThrow(/at least 5 characters/i);

    await expect(
      AdminDataService.updateEnrollmentStatus(seeded.id, 'paid', {}, ADMIN)
    ).rejects.toThrow(/Invalid enrollment status/i);
  });

  it('blocks cancellation while verified payments exist, and archives instead of deleting', async () => {
    const seeded = seedLocalEnrollment({ status: 'confirmed', studentId: 'FA-2026-003', phone: '9842100002' });

    const payment = await AdminDataService.recordPayment({
      obligationId: 'OBL-2026-103',
      amount: 500,
      paymentMethod: 'upi_online',
      referenceNumber: 'UTR-ENROLL-778811',
      paymentDate: new Date().toISOString().split('T')[0]
    }, ADMIN);
    expect(payment.receiptNumber).toBeTruthy();

    await expect(
      AdminDataService.updateEnrollmentStatus(seeded.id, 'cancelled', { reason: 'Guardian changed their mind' }, ADMIN)
    ).rejects.toThrow(/verified payments/i);

    const archived = await AdminDataService.archiveEnrollment(seeded.id, 'Duplicate application from a second form submission', ADMIN);
    expect(archived.success).toBe(true);
    expect(archived.enrollment.status).toBe('archived');

    const active = await AdminDataService.getEnrollments();
    const stored = active.find(e => e.id === seeded.id);
    expect(stored.status).toBe('archived');

    const payments = await AdminDataService.getPayments('FA-2026-003');
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(500);
    const obligations = await AdminDataService.getFeeObligations('FA-2026-003');
    expect(obligations.find(o => o.id === 'OBL-2026-103').amountPaid).toBe(500);

    const logs = await AdminDataService.getAuditLogs();
    expect(logs.find(l => l.action === 'ENROLLMENT_STATUS_CHANGED' && l.entityId === seeded.id)).toBeDefined();
  });

  it('does not report success when a lead status update targets a missing record', async () => {
    await expect(
      AdminDataService.updateLeadStatus('lead-that-does-not-exist', 'contacted', ADMIN)
    ).rejects.toThrow(/not found/i);

    seedLocalEnrollment({ status: 'new' });
    const res = await AdminDataService.updateLeadStatus('FA-999001', 'contacted', ADMIN);
    expect(res.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    expect(stored[0].status).toBe('contacted');
  });
});

describe('Payment ledger consistency', () => {
  beforeEach(() => {
    localStorage.clear();
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    AdminDataService.resetToSeedData();
  });

  it('records multiple payments for multiple students with distinct transactions', async () => {
    const seedCount = (await AdminDataService.getPayments()).length;

    const first = await AdminDataService.recordPayment({
      obligationId: 'OBL-2026-103', amount: 700, paymentMethod: 'cash',
      referenceNumber: 'UTR-CASH-001', paymentDate: '2026-10-20'
    }, ADMIN);
    const second = await AdminDataService.recordPayment({
      obligationId: 'OBL-2026-103', amount: 800, paymentMethod: 'upi_online',
      referenceNumber: 'UTR-UPI-002', paymentDate: '2026-10-21'
    }, ADMIN);
    const third = await AdminDataService.recordPayment({
      obligationId: 'OBL-2026-104', amount: 1000, paymentMethod: 'bank_transfer',
      referenceNumber: 'UTR-BANK-003', paymentDate: '2026-10-22'
    }, ADMIN);

    expect(new Set([first.id, second.id, third.id]).size).toBe(3);
    expect(new Set([first.receiptNumber, second.receiptNumber, third.receiptNumber]).size).toBe(3);

    const all = await AdminDataService.getPayments();
    expect(all).toHaveLength(seedCount + 3);
    expect(all.filter(p => p.studentId === 'FA-2026-003')).toHaveLength(2);
    expect(all.filter(p => p.studentId === 'FA-2026-004')).toHaveLength(1);

    const studentThree = all.filter(p => p.studentId === 'FA-2026-003' && !p.isReversed);
    expect(studentThree.reduce((sum, p) => sum + p.amount, 0)).toBe(1500);

    const obligations = await AdminDataService.getFeeObligations('FA-2026-003');
    const target = obligations.find(o => o.id === 'OBL-2026-103');
    expect(target.amountPaid).toBe(1500);
    expect(target.balance).toBe(target.amountDue - 1500);
    expect(target.status).toBe(target.balance === 0 ? 'paid' : 'partially_paid');

    expect(first.verificationStatus).toBe('verified');
    expect(first.receiptStatus).toBe('issued');
    expect(first.refundStatus).toBe('none');
    expect(first.gatewayTransactionId).toBe('UTR-CASH-001');
    expect(first.enrollmentId === null || typeof first.enrollmentId === 'string').toBe(true);
  });

  it('rejects duplicate transaction references across the whole institute', async () => {
    const seedCount = (await AdminDataService.getPayments()).length;
    await AdminDataService.recordPayment({
      obligationId: 'OBL-2026-103', amount: 300, paymentMethod: 'upi_online',
      referenceNumber: 'UTR-DUP-900', paymentDate: '2026-10-20'
    }, ADMIN);

    await expect(AdminDataService.recordPayment({
      obligationId: 'OBL-2026-104', amount: 400, paymentMethod: 'upi_online',
      referenceNumber: 'UTR-DUP-900', paymentDate: '2026-10-21'
    }, ADMIN)).rejects.toThrow(/Duplicate Transaction Reference/i);

    expect(await AdminDataService.getPayments()).toHaveLength(seedCount + 1);
  });

  it('refuses a payment larger than the remaining balance and validates amounts', async () => {
    const seedCount = (await AdminDataService.getPayments()).length;
    await expect(
      AdminDataService.recordPayment({ obligationId: 'OBL-2026-103', amount: 0 }, ADMIN)
    ).rejects.toThrow(/greater than zero/i);
    await expect(
      AdminDataService.recordPayment({ obligationId: 'OBL-2026-101', amount: 500 }, ADMIN)
    ).rejects.toThrow(/exceeds the remaining balance/i);
    expect(await AdminDataService.getPayments()).toHaveLength(seedCount);
  });

  it('marks a reversed transaction as reversed and restores the balance', async () => {
    const payment = await AdminDataService.recordPayment({
      obligationId: 'OBL-2026-104', amount: 600, paymentMethod: 'cash',
      referenceNumber: 'UTR-REV-100', paymentDate: '2026-10-23'
    }, ADMIN);
    const before = (await AdminDataService.getFeeObligations('FA-2026-004')).find(o => o.id === 'OBL-2026-104');
    expect(before.amountPaid).toBe(600);

    const res = await AdminDataService.reversePayment(payment.id, 'Wrong amount entered at the counter', ADMIN);
    expect(res.success).toBe(true);
    expect(res.payment.isReversed).toBe(true);
    expect(res.payment.refundStatus).toBe('reversed');
    expect(res.payment.status).toBe('reversed');

    const after = (await AdminDataService.getFeeObligations('FA-2026-004')).find(o => o.id === 'OBL-2026-104');
    expect(after.amountPaid).toBe(0);
    expect(after.balance).toBe(after.amountDue);

    const stored = (await AdminDataService.getPayments('FA-2026-004')).find(p => p.id === payment.id);
    expect(stored.receiptNumber).toBe(payment.receiptNumber);
    expect(stored.isReversed).toBe(true);
  });
});