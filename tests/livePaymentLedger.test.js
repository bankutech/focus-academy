import { describe, it, expect, beforeEach, vi } from 'vitest';

const memory = vi.hoisted(() => new Map());
const faults = vi.hoisted(() => ({ failSetDoc: false, failTransaction: false }));

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const keyOf = (name, id) => `${name}/${id}`;

const docRef = (name, id) => ({ __kind: 'doc', name, id, path: keyOf(name, id) });

const queryRef = (name, clauses = []) => ({
  __kind: 'query',
  name,
  clauses,
  where(field, op, value) {
    return queryRef(name, [...clauses, { field, op, value }]);
  },
  limit() {
    return this;
  },
  orderBy() {
    return this;
  },
  doc(id) {
    return docRef(name, id);
  },
});

const rowsFor = (query) => {
  const rows = [];
  memory.forEach((value, key) => {
    const [name, id] = key.split('/');
    if (name !== query.name) return;
    rows.push({ id, exists: true, ref: docRef(name, id), data: () => clone(value) });
  });
  const filtered = rows.filter((row) => query.clauses.every(({ field, op, value }) => {
    const current = row.data()[field];
    if (op === 'in') return Array.isArray(value) && value.includes(current);
    return current === value;
  }));
  return { docs: filtered, empty: filtered.length === 0 };
};

const snapshotOf = (ref) => {
  if (ref.__kind === 'query') return rowsFor(ref);
  const value = memory.get(ref.path);
  return { exists: () => value !== undefined, id: ref.id, ref, data: () => clone(value) };
};

const applyWrites = (writes) => {
  writes.forEach(({ type, ref, value }) => {
    if (type === 'delete') {
      memory.delete(ref.path);
      return;
    }
    const current = memory.get(ref.path);
    memory.set(ref.path, value === undefined ? current : clone(value));
  });
};

vi.mock('firebase/firestore', () => ({
  collection: (_db, name) => queryRef(name),
  doc: (_db, name, id) => docRef(name, id),
  query: (base, ...parts) => queryRef(base.name, [
    ...(base.clauses || []),
    ...parts.flatMap((part) => (part && Array.isArray(part.clauses) ? part.clauses : [])),
    ...parts.filter((part) => part && part.__kind === 'clause'),
  ]),
  where: (base, field, op, value) => queryRef(base.name, [...(base.clauses || []), { __kind: 'clause', field, op, value }]),
  orderBy: (base) => base,
  limit: (base) => base,
  getDocs: async (ref) => snapshotOf(ref),
  getDoc: async (ref) => snapshotOf(ref),
  setDoc: async (ref, value, options) => {
    if (faults.failSetDoc) throw new Error('simulated write failure');
    const current = memory.get(ref.path);
    memory.set(ref.path, options?.merge ? { ...(current || {}), ...clone(value) } : clone(value));
  },
  updateDoc: async (ref, value) => {
    const current = memory.get(ref.path);
    if (current === undefined) throw new Error('NOT_FOUND');
    memory.set(ref.path, { ...current, ...clone(value) });
  },
  deleteDoc: async (ref) => memory.delete(ref.path),
  writeBatch: () => {
    const writes = [];
    return {
      set: (ref, value) => writes.push({ type: 'set', ref, value }),
      update: (ref, value) => writes.push({ type: 'set', ref, value: { ...(memory.get(ref.path) || {}), ...value } }),
      delete: (ref) => writes.push({ type: 'delete', ref }),
      commit: async () => applyWrites(writes),
    };
  },
  runTransaction: async (_db, handler) => {
    if (faults.failTransaction) throw new Error('simulated transaction failure');
    const writes = [];
    const tx = {
      get: async (ref) => snapshotOf(ref),
      set: (ref, value, options) => writes.push({
        type: 'set',
        ref,
        value: options?.merge ? { ...(memory.get(ref.path) || {}), ...clone(value) } : clone(value),
      }),
      update: (ref, value) => writes.push({ type: 'set', ref, value: { ...(memory.get(ref.path) || {}), ...clone(value) } }),
      delete: (ref) => writes.push({ type: 'delete', ref }),
    };
    const result = await handler(tx);
    applyWrites(writes);
    return result;
  },
}));

vi.mock('../src/services/firebase.js', () => ({
  db: { __mock: true },
  auth: null,
  isFirebaseConfigured: () => true,
}));

import { AdminDataService } from '../src/services/adminDataService.js';
import { setVerifiedAdmin } from '../src/services/adminIdentity.js';

const director = 'director@focusacademyperambalur.com';

beforeEach(() => {
  memory.clear();
  faults.failSetDoc = false;
  faults.failTransaction = false;
  localStorage.clear();
  setVerifiedAdmin({ email: director, displayName: 'Director' });

  memory.set('academy_settings/main_config', {
    authorizedAdmins: [{ email: director, role: 'owner', active: true }],
  });
  memory.set('fee_obligations/OBL-LIVE-1', {
    id: 'OBL-LIVE-1',
    studentId: 'FA-LIVE-1',
    studentName: 'Live Student',
    batchId: 'batch-live',
    billingCycle: 'October 2026',
    dueDate: '2026-10-05',
    amountDue: 2200,
    amountPaid: 0,
    waivedAmount: 0,
    balance: 2200,
    status: 'pending',
    enrollmentId: 'FA-ENR-LIVE-1',
  });
  memory.set('batches/batch-live', {
    id: 'batch-live', name: 'Live Batch One', grade: 'Class 10', board: 'TN State Board', capacity: 12, enrolledCount: 1, seatsRemaining: 11, isArchived: false,
  });
  memory.set('batches/batch-live-2', {
    id: 'batch-live-2', name: 'Live Batch Two', grade: 'Class 10', board: 'TN State Board', capacity: 12, enrolledCount: 0, seatsRemaining: 12, isArchived: false,
  });
  memory.set('students/FA-LIVE-1', {
    id: 'FA-LIVE-1',
    studentName: 'Live Student',
    guardianPhone: '9842451299',
    grade: 'Class 10',
    board: 'TN State Board',
    status: 'active',
    batchId: 'batch-live',
    enrollmentId: 'FA-ENR-LIVE-1',
    feeConfig: { billingFrequency: 'monthly', amountPerCycle: 2200, billingStartDate: '2026-10-01', nextDueDate: '2026-10-05' },
  });
  memory.set('enrollments/FA-ENR-LIVE-1', {
    id: 'FA-ENR-LIVE-1',
    studentUid: null,
    phone: '9842451299',
    studentName: 'Live Student',
    status: 'confirmed',
    paymentStatus: 'unpaid',
  });
});

describe('Live Firestore payment transaction', () => {
  it('persists the payment, obligation, receipt, audit entry, student due date and enrollment status atomically', async () => {
    const result = await AdminDataService.recordPayment({
      obligationId: 'OBL-LIVE-1',
      amount: 2200,
      paymentMethod: 'cash',
      notes: 'Desk collection',
    }, director);

    expect(result.payment.receiptNumber).toMatch(/^REC-\d{4}-0001$/);
    expect(result.payment.recordedBy).toBe(director);
    expect(result.nextDueDate).toBe('2026-11-05');

    const obligation = memory.get('fee_obligations/OBL-LIVE-1');
    expect(obligation.amountPaid).toBe(2200);
    expect(obligation.balance).toBe(0);
    expect(obligation.status).toBe('paid');

    const student = memory.get('students/FA-LIVE-1');
    expect(student.feeConfig.nextDueDate).toBe('2026-11-05');
    expect(student.feeConfig.lastPaymentAmount).toBe(2200);

    expect(memory.get('enrollments/FA-ENR-LIVE-1').paymentStatus).toBe('paid');

    const paymentEntry = [...memory.keys()].find((key) => key.startsWith('payments/'));
    expect(paymentEntry).toBeTruthy();
    expect([...memory.keys()].some((key) => key.startsWith('audit_logs/'))).toBe(true);
  });

  it('keeps a partial payment open on the original due date instead of inventing the next cycle', async () => {
    const result = await AdminDataService.recordPayment({
      obligationId: 'OBL-LIVE-1',
      amount: 1000,
      paymentMethod: 'upi_online',
      referenceNumber: 'UPI/LIVE-1',
    }, director);

    expect(result.nextDueDate).toBe('2026-10-05');
    const obligation = memory.get('fee_obligations/OBL-LIVE-1');
    expect(obligation.balance).toBe(1200);
    expect(obligation.status).toBe('partially_paid');
    expect(memory.get('enrollments/FA-ENR-LIVE-1').paymentStatus).toBe('partial');
    expect(memory.get('students/FA-LIVE-1').feeConfig.nextDueDate).toBe('2026-10-05');
  });

  it('reversal re-credits the balance, resets the enrollment and recomputes the schedule', async () => {
    const recorded = await AdminDataService.recordPayment({
      obligationId: 'OBL-LIVE-1',
      amount: 2200,
      paymentMethod: 'cash',
    }, director);

    const reversal = await AdminDataService.reversePayment(
      recorded.payment.id,
      'Receipt voided at the fee desk',
      director
    );

    expect(reversal.success).toBe(true);
    const obligation = memory.get('fee_obligations/OBL-LIVE-1');
    expect(obligation.amountPaid).toBe(0);
    expect(obligation.balance).toBe(2200);
    expect(reversal.nextDueDate).toBe('2026-10-05');
    expect(memory.get('enrollments/FA-ENR-LIVE-1').paymentStatus).toBe('unpaid');
    expect(memory.get('students/FA-LIVE-1').feeConfig.nextDueDate).toBe('2026-10-05');
  });

  it('persists independent reconciliation totals and flags a mismatch without touching receipts', async () => {
    const recorded = await AdminDataService.recordPayment({
      obligationId: 'OBL-LIVE-1',
      amount: 2200,
      paymentMethod: 'cash',
    }, director);
    const date = recorded.payment.paymentDate;
    const obligationBefore = memory.get('fee_obligations/OBL-LIVE-1');

    const result = await AdminDataService.recordCollectionReconciliation({
      date,
      verifiedCash: 2000,
      notes: 'Cash count sheet differs by 200',
    }, director);

    expect(result.status).toBe('discrepancy');
    expect(result.difference).toBe(-200);
    expect(memory.get(`collection_reconciliations/${date}`).status).toBe('discrepancy');
    expect(memory.get('fee_obligations/OBL-LIVE-1')).toEqual(obligationBefore);
  });

  it('transfers a student and both batch counters in one central transaction', async () => {
    const result = await AdminDataService.transferStudentBatch(
      'FA-LIVE-1',
      'batch-live-2',
      'Parent requested the evening batch',
      director
    );

    expect(result.success).toBe(true);
    expect(memory.get('students/FA-LIVE-1').batchId).toBe('batch-live-2');
    expect(memory.get('batches/batch-live').enrolledCount).toBe(0);
    expect(memory.get('batches/batch-live-2').enrolledCount).toBe(1);
  });

  it('archives a student and releases the seat in the same transaction', async () => {
    await AdminDataService.withdrawStudent(
      'FA-LIVE-1',
      { reason: 'Family relocated out of Perambalur' },
      director
    );

    expect(memory.get('students/FA-LIVE-1').status).toBe('archived');
    expect(memory.get('batches/batch-live').enrolledCount).toBe(0);
    expect(memory.get('fee_obligations/OBL-LIVE-1')).toBeTruthy();
  });

  it('fails closed when the reconciliation write is rejected and records no audit entry', async () => {
    faults.failSetDoc = true;
    await expect(AdminDataService.recordCollectionReconciliation({
      date: '2026-10-20',
      verifiedCash: 100,
    }, director)).rejects.toThrow(/could not be saved/i);

    expect(memory.get('collection_reconciliations/2026-10-20')).toBeUndefined();
    const auditRows = [...memory.entries()].filter(([key]) => key.startsWith('audit_logs/'));
    expect(auditRows.some(([, row]) => row.action === 'COLLECTIONS_RECONCILED')).toBe(false);
  });

  it('does not report a batch transfer when the central transaction fails', async () => {
    faults.failTransaction = true;
    await expect(AdminDataService.transferStudentBatch(
      'FA-LIVE-1',
      'batch-live-2',
      'Parent requested the evening batch',
      director
    )).rejects.toThrow(/could not be saved centrally/i);

    expect(memory.get('students/FA-LIVE-1').batchId).toBe('batch-live');
    expect(memory.get('batches/batch-live').enrolledCount).toBe(1);
    expect(memory.get('batches/batch-live-2').enrolledCount).toBe(0);
  });

  it('refuses a payment method that is not approved for desk collection', async () => {
    await expect(AdminDataService.recordPayment({
      obligationId: 'OBL-LIVE-1',
      amount: 100,
      paymentMethod: 'crypto',
    }, director)).rejects.toThrow(/approved collection method/i);

    expect(memory.get('fee_obligations/OBL-LIVE-1').amountPaid).toBe(0);
  });
});
