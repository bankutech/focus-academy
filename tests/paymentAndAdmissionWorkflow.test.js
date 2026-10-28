import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateNextPaymentDueDate } from '../src/types/schemas.js';
import { AdminDataService } from '../src/services/adminDataService.js';
import { createFakeServices, mockResponse } from './helpers/fakeFirestore.js';

const holder = vi.hoisted(() => ({ current: null }));
vi.mock('../api/_lib/firebaseAdmin.js', () => ({ getServices: () => holder.current?.services || null }));

import paymentsHandler from '../api/payments.js';

const call = async (handler, body, { method = 'POST', ip = '10.0.0.1', query = {}, headers = {} } = {}) => {
  const res = mockResponse();
  await handler({ method, body, query, headers: { 'x-forwarded-for': ip, ...headers } }, res);
  return res;
};

describe('Authoritative Next Payment Due Date Engine (Section 5)', () => {
  it('returns next month 5th when current monthly fee is paid in full', () => {
    const result = calculateNextPaymentDueDate({
      student: { status: 'active' },
      feeConfig: { billingFrequency: 'monthly', amountPerCycle: 2200 },
      obligations: [
        {
          id: 'OBL-01',
          billingCycle: '2026-10',
          amountDue: 2200,
          amountPaid: 2200,
          balance: 0,
          dueDate: '2026-10-05'
        }
      ],
      payments: [
        { id: 'PAY-01', amount: 2200, paymentDate: '2026-10-04' }
      ],
      referenceDate: '2026-10-10'
    });

    expect(result.status).toBe('paid');
    expect(result.dueDate).toBe('2026-11-05');
    expect(result.isOverdue).toBe(false);
    expect(result.outstandingBalance).toBe(0);
  });

  it('preserves current cycle due date when payment is partial and not yet overdue', () => {
    const result = calculateNextPaymentDueDate({
      student: { status: 'active' },
      feeConfig: { billingFrequency: 'monthly', amountPerCycle: 2200 },
      obligations: [
        {
          id: 'OBL-01',
          billingCycle: '2026-10',
          amountDue: 2200,
          amountPaid: 1000,
          balance: 1200,
          dueDate: '2026-10-05'
        }
      ],
      payments: [
        { id: 'PAY-01', amount: 1000, paymentDate: '2026-10-03' }
      ],
      referenceDate: '2026-10-04'
    });

    expect(result.status).toBe('partially_paid');
    expect(result.dueDate).toBe('2026-10-05');
    expect(result.outstandingBalance).toBe(1200);
    expect(result.isOverdue).toBe(false);
  });

  it('flags overdue balance when past due date and obligation is unpaid', () => {
    const result = calculateNextPaymentDueDate({
      student: { status: 'active' },
      feeConfig: { billingFrequency: 'monthly', amountPerCycle: 2200 },
      obligations: [
        {
          id: 'OBL-01',
          billingCycle: '2026-10',
          amountDue: 2200,
          amountPaid: 0,
          balance: 2200,
          dueDate: '2026-10-05'
        }
      ],
      payments: [],
      referenceDate: '2026-10-15'
    });

    expect(result.status).toBe('overdue');
    expect(result.outstandingBalance).toBe(2200);
    expect(result.overdueAmount).toBe(2200);
    expect(result.isOverdue).toBe(true);
  });

  it('returns Not scheduled for paused or archived student', () => {
    const pausedResult = calculateNextPaymentDueDate({
      student: { status: 'paused' },
      feeConfig: { billingFrequency: 'monthly' }
    });
    expect(pausedResult.status).toBe('not_scheduled');
    expect(pausedResult.dueDate).toBe(null);
    expect(pausedResult.formatted).toBe('Not scheduled');

    const archivedResult = calculateNextPaymentDueDate({
      student: { status: 'archived' },
      feeConfig: { billingFrequency: 'monthly' }
    });
    expect(archivedResult.status).toBe('not_scheduled');
    expect(archivedResult.dueDate).toBe(null);
    expect(archivedResult.formatted).toBe('Not scheduled');
  });

  it('returns Not scheduled when no obligations or configured due date exist', () => {
    const emptyResult = calculateNextPaymentDueDate({
      student: { status: 'active' },
      feeConfig: {}
    });
    expect(emptyResult.status).toBe('not_scheduled');
    expect(emptyResult.formatted).toBe('Not scheduled');
  });
});

describe('Admin Data Service Payment Synchronization (Section 4 & 5)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('synchronously settles obligation, generates receipt, and updates ledger on payment', async () => {
    const preLedger = await AdminDataService.getStudentLedger('FA-2026-002');
    expect(preLedger.student.studentName).toBe('R. Rajesh');
    expect(preLedger.outstandingBalance).toBe(1300);

    const recorded = await AdminDataService.recordPayment({
      obligationId: 'OBL-2026-102',
      studentId: 'FA-2026-002',
      studentName: 'R. Rajesh',
      amount: 1300,
      paymentMethod: 'UPI',
      notes: 'Final settlement for October'
    });

    expect(recorded.receiptNumber).toMatch(/^REC-2026-/);
    expect(recorded.amount).toBe(1300);

    const postLedger = await AdminDataService.getStudentLedger('FA-2026-002');
    expect(postLedger.totalAmountPaid).toBe(2600);
    expect(postLedger.outstandingBalance).toBe(0);
    expect(postLedger.nextPaymentSchedule.dueDate).toBe('2026-11-15');
  });

  it('keeps partial payment status and prioritizes overdue status when balance is past due', async () => {
    const recorded = await AdminDataService.recordPayment({
      obligationId: 'OBL-2026-102',
      studentId: 'FA-2026-002',
      studentName: 'R. Rajesh',
      amount: 500,
      paymentMethod: 'Cash',
      notes: 'Partial advance'
    });

    expect(recorded.receiptNumber).toMatch(/^REC-2026-/);

    const ledger = await AdminDataService.getStudentLedger('FA-2026-002');
    expect(ledger.totalAmountPaid).toBe(1800);
    expect(ledger.outstandingBalance).toBe(800);
    expect(ledger.nextPaymentSchedule.outstandingBalance).toBe(800);
    expect(ledger.nextPaymentSchedule.status).toBe('overdue');
    expect(ledger.nextPaymentSchedule.isOverdue).toBe(true);
  });
});

describe('Server-Side Payments API (api/payments.js)', () => {
  let fake;

  beforeEach(() => {
    fake = createFakeServices();
    holder.current = fake;
    process.env.SESSION_SECRET = 's'.repeat(48);

    fake.seed('fee_obligations', 'OBL-TEST-01', {
      id: 'OBL-TEST-01',
      studentId: 'STU-API-01',
      studentName: 'Priya S',
      batchId: 'batch-10-state-board',
      amountDue: 2200,
      amountPaid: 0,
      waivedAmount: 0,
      balance: 2200,
      status: 'unpaid',
      billingCycle: '2026-10'
    });

    fake.seed('students', 'STU-API-01', {
      id: 'STU-API-01',
      studentName: 'Priya S',
      guardianPhone: '9842451222',
      feeConfig: { monthlyFee: 2200, nextDueDate: '2026-10-05' }
    });
    fake.seed('academy_settings', 'main_config', {
      authorizedAdmins: [{ email: 'coordinator@focusacademyperambalur.com', role: 'fee_manager', active: true }]
    });
    fake.addAccount('fee-desk', { uid: 'u-fee', email: 'coordinator@focusacademyperambalur.com', email_verified: true });
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
    holder.current = null;
  });

  const deskAuth = { headers: { authorization: 'Bearer fee-desk' } };

  it('refuses anonymous payment writes so nobody can credit a fee without authorisation', async () => {
    const res = await call(paymentsHandler, {
      action: 'verify',
      obligationId: 'OBL-TEST-01',
      amount: 2200
    });
    expect(res.statusCode).toBe(401);
    expect(fake.read('fee_obligations', 'OBL-TEST-01').amountPaid).toBe(0);
  });

  it('initiates payment and generates reference ID with validated amount', async () => {
    const res = await call(paymentsHandler, {
      action: 'initiate',
      obligationId: 'OBL-TEST-01',
      amount: 2200,
      paymentMethod: 'upi_online'
    }, deskAuth);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.referenceId).toMatch(/^PAY-INTENT-/);
    expect(res.body.amount).toBe(2200);
    expect(res.body.currency).toBe('INR');
  });

  it('rejects initiation exceeding remaining obligation balance', async () => {
    const res = await call(paymentsHandler, {
      action: 'initiate',
      obligationId: 'OBL-TEST-01',
      amount: 5000
    }, deskAuth);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('exceeds the remaining balance');
  });

  it('verifies payment idempotently without duplicate receipt creation', async () => {
    const initRes = await call(paymentsHandler, {
      action: 'initiate',
      obligationId: 'OBL-TEST-01',
      amount: 2200
    }, deskAuth);
    const referenceId = initRes.body.referenceId;

    const verify1 = await call(paymentsHandler, {
      action: 'verify',
      referenceId,
      providerRef: 'PG-TXN-998877',
      amount: 2200
    }, deskAuth);

    expect(verify1.statusCode).toBe(200);
    expect(verify1.body.success).toBe(true);
    expect(verify1.body.verified).toBe(true);
    expect(verify1.body.receiptNumber).toMatch(/^REC-2026-/);

    const verify2 = await call(paymentsHandler, {
      action: 'verify',
      referenceId,
      providerRef: 'PG-TXN-998877',
      amount: 2200
    }, deskAuth);

    expect(verify2.statusCode).toBe(200);
    expect(verify2.body.idempotent).toBe(true);
    expect(verify2.body.receiptNumber).toBe(verify1.body.receiptNumber);
  });
});
