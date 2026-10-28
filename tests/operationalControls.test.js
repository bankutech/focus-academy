import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import { resolve } from 'path';
import {
  AdminDataService,
  ROLE_PERMISSIONS,
  ADMIN_ROLES,
  summariseRecordedCollections,
  computeBackupChecksum,
} from '../src/services/adminDataService';
import { buildActionItems, unmetActionCount } from '../src/components/admin/actionItems';
import { authenticateAdmin } from '../api/_lib/adminAuth.js';
import { createFakeServices } from './helpers/fakeFirestore.js';

const OWNER = 'director@focusacademyperambalur.com';
const PRINCIPAL = 'principal@focusacademyperambalur.com';
const COORDINATOR = 'coordinator@focusacademyperambalur.com';
const ADMISSIONS = 'admissions@focusacademyperambalur.com';
const TEACHER = 'teacher@focusacademyperambalur.com';
const readText = (p) => fs.readFileSync(resolve(process.cwd(), p), 'utf8');

describe('Expanded administrative role model', () => {
  beforeEach(() => {
    localStorage.clear();
    AdminDataService.resetToSeedData();
  });

  it('exposes owner, administrator, admissions, fee manager, teacher and read-only roles', () => {
    expect(ADMIN_ROLES).toEqual(['owner', 'administrator', 'admissions', 'fee_manager', 'teacher', 'read_only']);
    expect(ROLE_PERMISSIONS.admissions).toContain('canManageStudents');
    expect(ROLE_PERMISSIONS.admissions).not.toContain('canRecordPayments');
    expect(ROLE_PERMISSIONS.admissions).not.toContain('canReconcileCollections');
    expect(ROLE_PERMISSIONS.fee_manager).toContain('canReconcileCollections');
    expect(ROLE_PERMISSIONS.fee_manager).not.toContain('canManageStudents');
    expect(ROLE_PERMISSIONS.teacher).toEqual([]);
    expect(ROLE_PERMISSIONS.read_only).toEqual([]);
  });

  it('persists newly supported roles and audits the change', async () => {
    await AdminDataService.updateAdminRole(ADMISSIONS, 'admissions', OWNER);
    await AdminDataService.updateAdminRole(TEACHER, 'teacher', OWNER);
    const admins = await AdminDataService.getAuthorizedAdmins();
    expect(admins.find((a) => a.email === ADMISSIONS).role).toBe('admissions');
    expect(admins.find((a) => a.email === TEACHER).role).toBe('teacher');

    const logs = await AdminDataService.getAuditLogs();
    expect(logs.some((l) => l.action === 'ADMIN_ROLE_UPDATED' && l.entityId === TEACHER)).toBe(true);
  });

  it('stops an admissions user from recording money or reconciling collections', async () => {
    await AdminDataService.updateAdminRole(ADMISSIONS, 'admissions', OWNER);
    const obligation = (await AdminDataService.getFeeObligations()).find((o) => o.balance > 0);

    expect(AdminDataService.hasPermission(ADMISSIONS, 'canManageStudents')).toBe(true);
    await expect(
      AdminDataService.recordPayment({ obligationId: obligation.id, amount: 100, paymentMethod: 'cash' }, ADMISSIONS)
    ).rejects.toThrow(/Unauthorized/i);
    await expect(
      AdminDataService.recordCollectionReconciliation({ date: '2026-10-01', verifiedCash: 100 }, ADMISSIONS)
    ).rejects.toThrow(/Unauthorized/i);
  });

  it('implements capabilities server-side rather than trusting role rank alone', async () => {
    const fake = createFakeServices();
    fake.seed('academy_settings', 'main_config', {
      authorizedAdmins: [
        { email: ADMISSIONS, role: 'admissions', active: true },
        { email: TEACHER, role: 'teacher', active: true },
        { email: COORDINATOR, role: 'fee_manager', active: true },
        { email: PRINCIPAL, role: 'administrator', active: true },
      ],
    });
    fake.addAccount('adm-token', { uid: 'u-adm', email: ADMISSIONS, email_verified: true, role: 'admissions' });
    fake.addAccount('teacher-token', { uid: 'u-t', email: TEACHER, email_verified: true, role: 'teacher' });
    fake.addAccount('fee-token', { uid: 'u-f', email: COORDINATOR, email_verified: true, role: 'fee_manager' });
    fake.addAccount('admin-token', { uid: 'u-a', email: PRINCIPAL, email_verified: true, role: 'administrator' });

    const call = (token, requirement) =>
      authenticateAdmin({ headers: { authorization: `Bearer ${token}` } }, fake.services, requirement);

    expect((await call('adm-token', { permission: 'canRecordPayments' })).ok).toBe(false);
    expect((await call('adm-token', { permission: 'canManageStudents' })).ok).toBe(true);
    expect((await call('teacher-token', { permission: 'canManageStudents' })).ok).toBe(false);
    expect((await call('fee-token', { permission: 'canRecordPayments' })).ok).toBe(true);
    expect((await call('admin-token', { permission: 'canManageStudents' })).ok).toBe(true);
    expect((await call('admin-token', { permission: 'canManageAdmins' })).ok).toBe(false);
  });
});

describe('Firestore authorization hardening', () => {
  const rules = readText('firestore.rules');

  it('no longer grants owner privileges to every allow-listed staff email', () => {
    const ownerFn = rules.match(/function isOwner\(\) \{[\s\S]*?\n    \}/)[0];
    const ownerEmails = rules.match(/function isOwnerEmail\(\) \{[\s\S]*?\n    \}/)?.[0] || '';
    expect(ownerFn).toContain('isOwnerEmail()');
    expect(ownerEmails).toContain('director@focusacademyperambalur.com');
    expect(ownerEmails).not.toContain('coordinator@focusacademyperambalur.com');
    expect(ownerEmails).not.toContain('principal@focusacademyperambalur.com');
  });

  it('prevents students from forging audit entries and prevents hard deletion of student history', () => {
    const auditBlock = rules.match(/match \/audit_logs\/\{logId\} \{[\s\S]*?\n    \}/)[0];
    expect(auditBlock).not.toMatch(/allow create: if isAuthenticated\(\)/);
    expect(auditBlock).toContain('allow update, delete: if false;');

    const studentBlock = rules.match(/match \/students\/\{studentId\} \{[\s\S]*?\n    \}/)[0];
    expect(studentBlock).toContain('allow delete: if false;');
  });

  it('defines reconciliation rules without permitting deletion', () => {
    const block = rules.match(/match \/collection_reconciliations\/\{reconciliationId\} \{[\s\S]*?\n    \}/)[0];
    expect(block).toContain('isFeeManager()');
    expect(block).toContain('allow delete: if false;');
  });
});

describe('Daily collection reconciliation', () => {
  beforeEach(() => {
    localStorage.clear();
    AdminDataService.resetToSeedData();
  });

  it('saves independently verified totals when they match recorded receipts', async () => {
    const payments = await AdminDataService.getPayments();
    const date = payments.find((p) => !p.isReversed && p.paymentDate)?.paymentDate;
    const recorded = summariseRecordedCollections(payments, date);

    const result = await AdminDataService.recordCollectionReconciliation({
      date,
      verifiedCash: recorded.byMethod.cash,
      verifiedUpi: recorded.byMethod.upi_online,
      verifiedBank: recorded.byMethod.bank_transfer,
      verifiedCard: recorded.byMethod.card,
      notes: 'Bank statement and cash count sheet verified',
    }, COORDINATOR);

    expect(result.status).toBe('reconciled');
    expect(result.difference).toBe(0);
    expect(result.recorded.netTotal).toBe(recorded.netTotal);
    expect(result.reconciledBy).toBe(COORDINATOR);
  });

  it('flags a discrepancy without changing any payment or obligation', async () => {
    const paymentsBefore = await AdminDataService.getPayments();
    const obligationsBefore = await AdminDataService.getFeeObligations();
    const date = paymentsBefore.find((p) => !p.isReversed && p.paymentDate)?.paymentDate;
    const recorded = summariseRecordedCollections(paymentsBefore, date);

    const result = await AdminDataService.recordCollectionReconciliation({
      date,
      verifiedCash: recorded.byMethod.cash + 250,
      verifiedUpi: recorded.byMethod.upi_online,
      verifiedBank: recorded.byMethod.bank_transfer,
      discrepanciesExplained: 'Cash count sheet pending supervisor sign-off',
    }, COORDINATOR);

    expect(result.status).toBe('discrepancy');
    expect(result.difference).toBe(250);
    expect(result.methodDifferences.cash).toBe(250);
    expect(await AdminDataService.getPayments()).toEqual(paymentsBefore);
    expect(await AdminDataService.getFeeObligations()).toEqual(obligationsBefore);
  });

  it('excludes reversed receipts from the amount compared with verified collections', () => {
    const summary = summariseRecordedCollections([
      { paymentDate: '2026-10-05', amount: 1000, paymentMethod: 'cash', status: 'verified' },
      { paymentDate: '2026-10-05', amount: 400, paymentMethod: 'cash', status: 'reversed' },
      { paymentDate: '2026-10-05', amount: 300, paymentMethod: 'upi_online', refundStatus: 'refunded' },
      { paymentDate: '2026-10-05', amount: 200, paymentMethod: 'UPI', status: 'verified' },
      { paymentDate: '2026-10-06', amount: 999, paymentMethod: 'cash' },
    ], '2026-10-05');

    expect(summary.grossTotal).toBe(1900);
    expect(summary.reversedTotal).toBe(700);
    expect(summary.netTotal).toBe(1200);
    expect(summary.byMethod.cash).toBe(1000);
    expect(summary.byMethod.upi_online).toBe(200);
    expect(summary.receiptCount).toBe(4);
    expect(summary.validReceipts).toBe(2);
  });

  it('preserves earlier revisions when a reconciliation is corrected', async () => {
    const payments = await AdminDataService.getPayments();
    const date = payments.find((p) => !p.isReversed && p.paymentDate)?.paymentDate;
    const recorded = summariseRecordedCollections(payments, date);

    await AdminDataService.recordCollectionReconciliation({ date, verifiedCash: 0 }, COORDINATOR);
    const second = await AdminDataService.recordCollectionReconciliation({
      date,
      verifiedCash: recorded.byMethod.cash,
      verifiedUpi: recorded.byMethod.upi_online,
      verifiedBank: recorded.byMethod.bank_transfer,
    }, COORDINATOR);

    expect(second.revision).toBe(2);
    expect(second.history).toHaveLength(1);
    expect(second.history[0].status).toBe('discrepancy');
    expect(second.history[0].reconciledBy).toBe(COORDINATOR);
  });

  it('rejects future dates and negative verified amounts', async () => {
    const future = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
    await expect(
      AdminDataService.recordCollectionReconciliation({ date: future, verifiedCash: 10 }, COORDINATOR)
    ).rejects.toThrow(/future date/i);
    await expect(
      AdminDataService.recordCollectionReconciliation({ date: '2026-10-01', verifiedCash: -1 }, COORDINATOR)
    ).rejects.toThrow(/non-negative/i);
  });
});

describe('Student lifecycle and financial preservation', () => {
  beforeEach(() => {
    localStorage.clear();
    AdminDataService.resetToSeedData();
  });

  it('archives/withdraws a student while preserving every fee and receipt record', async () => {
    const students = await AdminDataService.getStudents({ includeArchived: true });
    const withLedger = students.find((s) => s.status === 'active');
    const obligationsBefore = (await AdminDataService.getFeeObligations(withLedger.id)).map((o) => o.id);
    const paymentsBefore = (await AdminDataService.getPayments(withLedger.id)).map((p) => p.id);
    const batchBefore = await AdminDataService.getBatchById(withLedger.batchId);

    const withdrawn = await AdminDataService.withdrawStudent(
      withLedger.id,
      { reason: 'Family relocated to Chennai', effectiveDate: '2026-10-31' },
      OWNER
    );

    expect(withdrawn.status).toBe('archived');
    expect(withdrawn.dropoutReason).toMatch(/Family relocated/);
    expect((await AdminDataService.getFeeObligations(withLedger.id)).map((o) => o.id)).toEqual(obligationsBefore);
    expect((await AdminDataService.getPayments(withLedger.id)).map((p) => p.id)).toEqual(paymentsBefore);
    expect((await AdminDataService.getPayments(withLedger.id)).length).toBe(paymentsBefore.length);
   expect((await AdminDataService.getBatchById(withLedger.batchId)).enrolledCount).toBe(
      Math.max(0, batchBefore.enrolledCount - 1)
    );

    const activeRoster = await AdminDataService.getStudents();
    expect(activeRoster.some((s) => s.id === withLedger.id)).toBe(false);
    const historical = await AdminDataService.getStudents({ includeArchived: true });
    expect(historical.some((s) => s.id === withLedger.id)).toBe(true);
  });

  it('requires a written reason to withdraw and blocks unauthorized lifecycle changes', async () => {
    const student = (await AdminDataService.getStudents())[0];
    await expect(AdminDataService.withdrawStudent(student.id, { reason: '' }, OWNER)).rejects.toThrow(/reason/i);
    await expect(
      AdminDataService.withdrawStudent(student.id, { reason: 'Parent request to leave' }, TEACHER)
    ).rejects.toThrow(/Unauthorized/i);
  });

  it('re-enrolls an archived student only when capacity exists', async () => {
    const student = (await AdminDataService.getStudents())[0];
    await AdminDataService.withdrawStudent(student.id, { reason: 'Temporary break from classes' }, OWNER);
    const restored = await AdminDataService.restoreStudent(student.id, OWNER);
    expect(restored.status).toBe('active');
    expect(restored.lifecycleHistory.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Backup integrity and restore verification', () => {
  beforeEach(() => {
    localStorage.clear();
    AdminDataService.resetToSeedData();
  });

  it('attaches a checksum and rejects a tampered snapshot without changing records', async () => {
    const snapshot = await AdminDataService.createFullBackupSnapshot(OWNER);
    expect(snapshot.schemaVersion).toBe(2);
    expect(snapshot.checksum).toBe(computeBackupChecksum(snapshot));

    const studentsBefore = await AdminDataService.getStudents({ includeArchived: true });
    const tampered = JSON.parse(JSON.stringify(snapshot));
    tampered.data.students[0].studentName = 'Tampered Name';
    await expect(AdminDataService.restoreFromBackupSnapshot(tampered, OWNER)).rejects.toThrow(/integrity check failed/i);
    expect(await AdminDataService.getStudents({ includeArchived: true })).toEqual(studentsBefore);
  });

  it('restores a checksum-verified snapshot and confirms the counts', async () => {
    const snapshot = await AdminDataService.createFullBackupSnapshot(OWNER);
    const result = await AdminDataService.restoreFromBackupSnapshot(snapshot, OWNER);
    expect(result.success).toBe(true);
    expect(result.checksumVerified).toBe(true);
    expect(result.counts.students).toBe(snapshot.counts.students);
    expect(result.counts.payments).toBe(snapshot.counts.payments);
  });

  it('only permits an owner to restore', async () => {
    const snapshot = await AdminDataService.createFullBackupSnapshot(OWNER);
    await expect(AdminDataService.restoreFromBackupSnapshot(snapshot, PRINCIPAL)).rejects.toThrow(/Unauthorized/i);
  });
});

describe('Action-required dashboard alerts', () => {
  const now = new Date('2026-10-28T10:00:00.000Z');

  it('derives alerts and links only from supplied records', () => {
    const items = buildActionItems({
      now,
      enrollments: [
        { id: 'E1', status: 'pending', enrolledAt: '2026-10-27T10:00:00.000Z' },
        { id: 'E2', status: 'confirmed', enrolledAt: '2026-10-01T10:00:00.000Z', studentUid: null },
      ],
      obligations: [
        { id: 'O1', status: 'pending', dueDate: '2026-10-20', amountDue: 1000, amountPaid: 200, balance: 800 },
        { id: 'O2', status: 'pending', dueDate: '2026-11-01', amountDue: 500, amountPaid: 0, balance: 500 },
      ],
      batches: [{ id: 'B1', name: 'Class 10 Evening', capacity: 12, enrolledCount: 11 }],
      reconciliations: [],
      reminders: [{ id: 'R1', deliveryStatus: 'failed' }],
      dataErrors: [],
      auditLogs: [],
    });

    const ids = items.map((i) => i.id);
    expect(ids).toContain('pending-admissions');
    expect(ids).toContain('overdue-fees');
    expect(ids).toContain('upcoming-dues');
    expect(ids).toContain('activation-pending');
    expect(ids).toContain('batch-capacity');
    expect(ids).toContain('reconciliation-missing');
    expect(ids).toContain('notification-failures');
    expect(ids).toContain('backup-overdue');
    expect(items.find((i) => i.id === 'overdue-fees').to).toBe('/admin-portal/reminders?tab=overdue');
    expect(unmetActionCount(items)).toBeGreaterThanOrEqual(5);
  });

  it('does not invent alerts when the records are clean', () => {
    const items = buildActionItems({
      now,
      enrollments: [],
      obligations: [],
      batches: [],
      reconciliations: [{ date: '2026-10-27', status: 'reconciled', difference: 0 }],
      reminders: [],
      dataErrors: [],
      auditLogs: [{ action: 'BACKUP_CREATED', timestamp: '2026-10-26T10:00:00.000Z' }],
    });
    expect(items).toEqual([]);
    expect(unmetActionCount(items)).toBe(0);
  });
});
