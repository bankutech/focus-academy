import { setVerifiedAdmin } from '../src/services/adminIdentity';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminDataService } from '../src/services/adminDataService';

describe('Section 19: Additional Business Requirements Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    AdminDataService.resetToSeedData();
  });

  describe('A. Fee Collection Accountability & Reconciliation', () => {
    it('generates collection reports attributed to administrators', async () => {
      const adminReport = await AdminDataService.getAdminCollectionReport();
      expect(Array.isArray(adminReport)).toBe(true);
      expect(adminReport.length).toBeGreaterThan(0);
      
      const adminEntry = adminReport.find(r => r.admin === 'admin' || r.admin === 's.ramanathan');
      expect(adminEntry).toBeDefined();
      expect(adminEntry.totalCollected).toBeGreaterThan(0);
      expect(adminEntry.transactionCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(adminEntry.transactions)).toBe(true);
    });

    it('generates daily collection reports breakdown by payment modes', async () => {
      const dailyReport = await AdminDataService.getDailyCollectionReport();
      expect(Array.isArray(dailyReport)).toBe(true);
      expect(dailyReport.length).toBeGreaterThan(0);

      const todayReport = dailyReport[0];
      expect(todayReport).toHaveProperty('date');
      expect(todayReport).toHaveProperty('total');
      expect(todayReport).toHaveProperty('modes');
      expect(todayReport.modes).toHaveProperty('cash');
      expect(todayReport.modes).toHaveProperty('upi');
      expect(todayReport.total).toBe(
        todayReport.modes.cash + todayReport.modes.upi + todayReport.modes.card + todayReport.modes.bank_transfer
      );
    });

    it('generates batch collection summary with collection rates', async () => {
      const batchSummary = await AdminDataService.getBatchCollectionSummary();
      expect(Array.isArray(batchSummary)).toBe(true);
      expect(batchSummary.length).toBeGreaterThan(0);

      for (const summary of batchSummary) {
        expect(summary).toHaveProperty('batchId');
        expect(summary).toHaveProperty('batchName');
        expect(summary).toHaveProperty('studentCount');
        expect(summary).toHaveProperty('totalDue');
        expect(summary).toHaveProperty('totalCollected');
        expect(summary).toHaveProperty('outstandingBalance');
        expect(summary.totalDue).toBe(summary.totalCollected + summary.outstandingBalance);
      }
    });

    it('reconciles ledger transactions against fee obligations with 0 discrepancies', async () => {
      const reconciliation = await AdminDataService.reconcileLedger();
      expect(reconciliation).toHaveProperty('isBalanced');
      expect(reconciliation).toHaveProperty('discrepancies');
      expect(Array.isArray(reconciliation.discrepancies)).toBe(true);
      expect(reconciliation.discrepancies.length).toBe(0);
      expect(reconciliation.isBalanced).toBe(true);
    });

    it('records administrator attribution on fee payments and logs audit trail', async () => {
      const obligations = await AdminDataService.getFeeObligations();
      const pendingObl = obligations.find(o => o.balance > 0);
      expect(pendingObl).toBeDefined();

      const payment = await AdminDataService.recordFeePayment({
        studentId: pendingObl.studentId,
        studentName: pendingObl.studentName,
        batchId: pendingObl.batchId,
        obligationId: pendingObl.id,
        amount: 500,
        paymentMethod: 'upi',
        referenceNumber: 'UPI-REC-9988'
      }, 'coordinator@focusacademyperambalur.com');

      expect(payment.recordedBy).toBe('coordinator@focusacademyperambalur.com');

      const logs = await AdminDataService.getAuditLogs();
      const paymentLog = logs.find(l => l.action === 'PAYMENT_RECORDED' && l.actor === 'coordinator@focusacademyperambalur.com');
      expect(paymentLog).toBeDefined();
    });
  });

  describe('B. Student Enrollment & Lifecycle Management', () => {
    it('manages all 5 student lifecycle statuses and records lifecycle dates', async () => {
      const students = await AdminDataService.getStudents({ includeArchived: true });
      const student = students[0];

      const paused = await AdminDataService.updateStudentLifecycleStatus(
        student.id,
        'paused',
        'Medical leave for two weeks',
        'director@focusacademyperambalur.com'
      );
      expect(paused.status).toBe('paused');
      expect(paused.lifecycleHistory.length).toBeGreaterThanOrEqual(1);

      const completed = await AdminDataService.updateStudentLifecycleStatus(
        student.id,
        'completed',
        'Academic year successfully finished',
        'director@focusacademyperambalur.com'
      );
      expect(completed.status).toBe('completed');
      expect(completed.courseEndDate).toBeDefined();

      const archived = await AdminDataService.updateStudentLifecycleStatus(
        student.id,
        'archived',
        'Moved to another city',
        'director@focusacademyperambalur.com'
      );
      expect(archived.status).toBe('archived');

      const activeList = await AdminDataService.getStudents();
      expect(activeList.some(s => s.id === student.id)).toBe(false);

      const fullList = await AdminDataService.getStudents({ includeArchived: true });
      expect(fullList.some(s => s.id === student.id)).toBe(true);

      const restored = await AdminDataService.updateStudentLifecycleStatus(
        student.id,
        'active',
        'Student returned and resumed studies',
        'director@focusacademyperambalur.com'
      );
      expect(restored.status).toBe('active');
    });

    it('adjusts batch capacity when students transition between active and inactive statuses', async () => {
      const batch = await AdminDataService.getBatchById('batch-10-state-board');
      const initialEnrolled = batch.enrolledCount;

      const newStudent = await AdminDataService.createStudent({
        studentName: 'Test Capacity Student',
        guardianPhone: '9842499110',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        batchId: 'batch-10-state-board'
      });

      const batchAfterEnroll = await AdminDataService.getBatchById('batch-10-state-board');
      expect(batchAfterEnroll.enrolledCount).toBe(initialEnrolled + 1);

      await AdminDataService.updateStudentLifecycleStatus(newStudent.id, 'paused', 'Temporary pause');
      const batchAfterPause = await AdminDataService.getBatchById('batch-10-state-board');
      expect(batchAfterPause.enrolledCount).toBe(initialEnrolled);

      await AdminDataService.updateStudentLifecycleStatus(newStudent.id, 'active', 'Reactivated');
      const batchAfterResume = await AdminDataService.getBatchById('batch-10-state-board');
      expect(batchAfterResume.enrolledCount).toBe(initialEnrolled + 1);
    });
  });

  describe('C. Duplicate Student Prevention', () => {
    it('detects duplicate guardian phone number', async () => {
      const students = await AdminDataService.getStudents();
      const existing = students[0];

      const dupCheck = await AdminDataService.checkDuplicateStudent({
        studentName: 'Different Name',
        guardianPhone: existing.guardianPhone,
        grade: 'Class 10'
      });

      expect(dupCheck.hasDuplicate).toBe(true);
      expect(dupCheck.reasons.some(r => r.includes('phone'))).toBe(true);
      expect(dupCheck.existingStudents.some(s => s.id === existing.id)).toBe(true);
    });

    it('detects duplicate student name in the same academic grade', async () => {
      const students = await AdminDataService.getStudents();
      const existing = students[0];

      const dupCheck = await AdminDataService.checkDuplicateStudent({
        studentName: existing.studentName,
        guardianPhone: '9842400000',
        grade: existing.grade
      });

      expect(dupCheck.hasDuplicate).toBe(true);
      expect(dupCheck.reasons.some(r => r.includes('name'))).toBe(true);
    });

    it('assigns unique institutional student ID format FA-YYYY-XXX', async () => {
      const student = await AdminDataService.createStudent({
        studentName: 'Format Check Student',
        guardianPhone: '9842488112',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        batchId: 'batch-10-state-board'
      });

      const currentYear = new Date().getFullYear();
      const pattern = new RegExp(`^FA-${currentYear}-\\d{3}$`);
      expect(student.id).toMatch(pattern);
    });
  });

  describe('D. Fee Discounts & Special Cases', () => {
    it('applies merit scholarship discount with authorization and adjustment history', async () => {
      const students = await AdminDataService.getStudents();
      const targetStudent = students[0];

      const result = await AdminDataService.applyFeeDiscount(
        targetStudent.id,
        {
          category: 'merit_scholarship',
          amount: 500,
          reason: 'Centum score in Class 9 Annual Mathematics Exam'
        },
        'director@focusacademyperambalur.com'
      );

      expect(result.feeConfig.discountAdjustment).toBe(500);
      expect(result.feeConfig.discountCategory).toBe('merit_scholarship');
      expect(result.feeConfig.discountHistory.length).toBeGreaterThanOrEqual(1);

      const historyEntry = result.feeConfig.discountHistory[result.feeConfig.discountHistory.length - 1];
      expect(historyEntry.category).toBe('merit_scholarship');
      expect(historyEntry.amount).toBe(500);
      expect(historyEntry.approvedBy).toBe('director@focusacademyperambalur.com');

      const logs = await AdminDataService.getAuditLogs();
      const discountLog = logs.find(l => l.action === 'FEE_DISCOUNT_APPLIED' && l.entityId === targetStudent.id);
      expect(discountLog).toBeDefined();
    });

    it('rejects fee discount if reason or amount is missing or invalid', async () => {
      const students = await AdminDataService.getStudents();
      const targetStudent = students[0];

      await expect(
        AdminDataService.applyFeeDiscount(targetStudent.id, {
          category: 'sibling_concession',
          amount: -100,
          reason: 'Valid reason'
        })
      ).rejects.toThrow(/positive number/i);

      await expect(
        AdminDataService.applyFeeDiscount(targetStudent.id, {
          category: 'financial_aid',
          amount: 500,
          reason: 'No'
        })
      ).rejects.toThrow(/reason/i);
    });
  });

  describe('E. Notification Preferences & Retry Failed Reminders', () => {
    it('updates guardian notification preferences and consent', async () => {
      const students = await AdminDataService.getStudents();
      const student = students[0];

      const updated = await AdminDataService.updateNotificationPreferences(
        student.id,
        {
          preferredChannel: 'sms',
          reminderTimingDays: 5,
          remindersDisabled: true,
          communicationConsent: false
        },
        'admin'
      );

      expect(updated.notificationPreferences.preferredChannel).toBe('sms');
      expect(updated.notificationPreferences.reminderTimingDays).toBe(5);
      expect(updated.notificationPreferences.remindersDisabled).toBe(true);
      expect(updated.notificationPreferences.communicationConsent).toBe(false);
    });

    it('retries failed reminder without duplicating fee obligations', async () => {
      const obligationsBefore = await AdminDataService.getFeeObligations();
      const reminders = await AdminDataService.getReminders();
      const failedReminder = reminders.find(r => r.status === 'failed') || reminders[0];

      const retried = await AdminDataService.retryFailedReminder(failedReminder.id, 'admin');
      expect(retried.status).toBe('sent');
      expect(retried.deliveryStatus).toBe('delivered');
      expect(retried.retriedAt).toBeDefined();

      const obligationsAfter = await AdminDataService.getFeeObligations();
      expect(obligationsAfter.length).toBe(obligationsBefore.length);
    });
  });

  describe('F. Backup and Recovery', () => {
    it('creates full backup snapshot with RTO/RPO disaster recovery metadata', async () => {
      const snapshot = await AdminDataService.createFullBackupSnapshot('director@focusacademyperambalur.com');
      
      expect(snapshot).toHaveProperty('version');
      expect(snapshot).toHaveProperty('exportedAt');
      expect(snapshot).toHaveProperty('exportedBy', 'director@focusacademyperambalur.com');
      expect(snapshot).toHaveProperty('rtoTarget', 'RTO < 1 Hour');
      expect(snapshot).toHaveProperty('rpoTarget', 'RPO < 24 Hours');
      expect(snapshot).toHaveProperty('data');
      expect(snapshot.data).toHaveProperty('students');
      expect(snapshot.data).toHaveProperty('batches');
      expect(snapshot.data).toHaveProperty('obligations');
      expect(snapshot.data).toHaveProperty('payments');
      expect(snapshot.data).toHaveProperty('settings');
      expect(snapshot.data.students.length).toBeGreaterThan(0);
    });

    it('restores state from validated backup snapshot and recovers data', async () => {
      const originalSnapshot = await AdminDataService.createFullBackupSnapshot();
      const studentCount = originalSnapshot.data.students.length;

      await AdminDataService.createStudent({
        studentName: 'Temporary Restore Student',
        guardianPhone: '9842477665',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        batchId: 'batch-10-state-board'
      });

      const studentsAfterAdd = await AdminDataService.getStudents();
      expect(studentsAfterAdd.length).toBe(studentCount + 1);

      const restoreResult = await AdminDataService.restoreFromBackupSnapshot(originalSnapshot, 'director');
      expect(restoreResult.success).toBe(true);

      const studentsAfterRestore = await AdminDataService.getStudents();
      expect(studentsAfterRestore.length).toBe(studentCount);
      expect(studentsAfterRestore.some(s => s.studentName === 'Temporary Restore Student')).toBe(false);
    });

    it('rejects corrupted or invalid backup snapshots', async () => {
      await expect(
        AdminDataService.restoreFromBackupSnapshot({ invalid: 'payload' })
      ).rejects.toThrow(/Corrupted or invalid backup/i);
    });
  });

  describe('G. Data Import and Export', () => {
    it('validates and parses student CSV with live duplicate and batch capacity detection', async () => {
      const csvText = `studentName,guardianName,guardianPhone,grade,board,batchId,amountPerCycle
K. Rajesh,R. Krishnan,9842411999,Class 10,TN State Board (Samacheer),batch-10-state-board,2000
P. Anand,V. Palani,9842411888,Class 10,TN State Board (Samacheer),batch-10-state-board,2000`;

      const validation = await AdminDataService.validateAndParseStudentCSV(csvText);
      expect(validation.isValid).toBe(true);
      expect(validation.totalRows).toBe(2);
      expect(validation.errors.length).toBe(0);
      expect(validation.students.length).toBe(2);
    });

    it('flags invalid phone number and batch capacity overflow in CSV preflight', async () => {
      const invalidCsv = `studentName,guardianName,guardianPhone,grade,board,batchId,amountPerCycle
Invalid Phone Student,Parent,12345,Class 10,TN State Board (Samacheer),batch-10-state-board,2000`;

      const validation = await AdminDataService.validateAndParseStudentCSV(invalidCsv);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0].error).toMatch(/10-digit Indian phone/i);
    });

    it('imports validated CSV students and updates batch enrollment numbers', async () => {
      const csvText = `studentName,guardianName,guardianPhone,grade,board,batchId,amountPerCycle
CSV Import Test Student,A. Guardian,9842433333,Class 10,TN State Board (Samacheer),batch-10-state-board,2200`;

      const validation = await AdminDataService.validateAndParseStudentCSV(csvText);
      expect(validation.isValid).toBe(true);

      const importResult = await AdminDataService.importStudentsFromCSV(validation.students, 'importer_admin');
      expect(importResult.importedCount).toBe(1);
      expect(importResult.students[0].id).toMatch(/^FA-\d{4}-\d{3}$/);

      const batch = await AdminDataService.getBatchById('batch-10-state-board');
      expect(batch.enrolledCount).toBeGreaterThan(0);
    });
  });

  describe('H. Role & Permission Management (RBAC)', () => {
    it('verifies owner, administrator, and fee_manager permission boundaries', async () => {
      expect(AdminDataService.hasPermission('director@focusacademyperambalur.com', 'MANAGE_SETTINGS')).toBe(true);
      expect(AdminDataService.hasPermission('director@focusacademyperambalur.com', 'BACKUP_RESTORE')).toBe(true);
      expect(AdminDataService.hasPermission('principal@focusacademyperambalur.com', 'MANAGE_SETTINGS')).toBe(true);
      expect(AdminDataService.hasPermission('principal@focusacademyperambalur.com', 'BACKUP_RESTORE')).toBe(false);
      expect(AdminDataService.hasPermission('coordinator@focusacademyperambalur.com', 'MANAGE_FEES')).toBe(true);
      expect(AdminDataService.hasPermission('coordinator@focusacademyperambalur.com', 'DELETE_BATCH')).toBe(false);
      expect(AdminDataService.hasPermission('coordinator@focusacademyperambalur.com', 'MANAGE_SETTINGS')).toBe(false);
    });

    it('throws unauthorized error when user lacks required permission', () => {
      expect(() => {
        AdminDataService.verifyPermission('coordinator@focusacademyperambalur.com', 'MANAGE_SETTINGS');
      }).toThrow(/Unauthorized/i);

      expect(() => {
        AdminDataService.verifyPermission('principal@focusacademyperambalur.com', 'MANAGE_SETTINGS');
      }).not.toThrow();
    });

    it('updates admin role and writes audit log', async () => {
      const updatedAdmins = await AdminDataService.updateAdminRole(
        'rajesh@focusacademyperambalur.com',
        'administrator',
        'director@focusacademyperambalur.com'
      );

      const user = updatedAdmins.find(u => u.email === 'rajesh@focusacademyperambalur.com');
      expect(user.role).toBe('administrator');

      const logs = await AdminDataService.getAuditLogs();
      const roleLog = logs.find(l => l.action === 'ADMIN_ROLE_UPDATED');
      expect(roleLog).toBeDefined();
    });
  });

  describe('I. Academy Settings & WhatsApp Templates', () => {
    it('retrieves and updates academy settings with persistence', async () => {
      const initialSettings = await AdminDataService.getSettings();
      expect(initialSettings.academyName).toContain('Focus Academy');

      const updated = await AdminDataService.updateSettings({
        academyName: 'Focus Academy Tuition Centre & NEET Coaching',
        receiptPrefix: 'FATC-REC'
      }, 'director');

      expect(updated.academyName).toBe('Focus Academy Tuition Centre & NEET Coaching');
      expect(updated.receiptPrefix).toBe('FATC-REC');

      const reloaded = await AdminDataService.getSettings();
      expect(reloaded.academyName).toBe('Focus Academy Tuition Centre & NEET Coaching');
    });

    it('generates WhatsApp message using dynamic settings template placeholders', async () => {
      const message = await AdminDataService.generateWhatsAppMessage({
        studentName: 'S. Kaviya',
        balance: 2000,
        dueDate: '2026-11-05'
      });

      expect(message).toContain('Focus Academy');
      expect(message).toContain('S. Kaviya');
      expect(message).toContain('₹2000');
      expect(message).toContain('2026-11-05');
    });
  });

  describe('J. Reliability, Idempotency & Edge Case Robustness', () => {
    it('executes recordPayment idempotently on repeated submissions with same referenceNumber or id', async () => {
      const obligations = await AdminDataService.getFeeObligations();
      const obl = obligations.find(o => o.balance >= 1000);
      expect(obl).toBeDefined();

      const initialBalance = obl.balance;
      const refNum = 'IDEMPOTENT-REF-001';

      const p1 = await AdminDataService.recordPayment({
        studentId: obl.studentId,
        obligationId: obl.id,
        amount: 500,
        paymentMethod: 'upi',
        referenceNumber: refNum
      }, 'admin');

      expect(p1.amount).toBe(500);

      const oblAfterFirst = (await AdminDataService.getFeeObligations()).find(o => o.id === obl.id);
      expect(oblAfterFirst.balance).toBe(initialBalance - 500);

      const p2 = await AdminDataService.recordPayment({
        studentId: obl.studentId,
        obligationId: obl.id,
        amount: 500,
        paymentMethod: 'upi',
        referenceNumber: refNum
      }, 'admin');

      expect(p2.id).toBe(p1.id);
      expect(p2.receiptNumber).toBe(p1.receiptNumber);

      const oblAfterSecond = (await AdminDataService.getFeeObligations()).find(o => o.id === obl.id);
      expect(oblAfterSecond.balance).toBe(initialBalance - 500);
    });

    it('rejects discount amount exceeding the student billing cycle fee obligation', async () => {
      const students = await AdminDataService.getStudents();
      const student = students[0];
      const cycleFee = student.feeConfig.amountPerCycle;

      await expect(
        AdminDataService.applyFeeDiscount(student.id, {
          discountType: 'merit_scholarship',
          amount: cycleFee + 1000,
          reason: 'Excessive discount beyond monthly fee'
        }, 'director@focusacademyperambalur.com')
      ).rejects.toThrow(/cannot exceed the billing cycle fee/i);
    });

    it('preserves originalAmountDue on fee obligations when discounts are applied for auditing', async () => {
      const studentId = 'FA-2026-004';
      const obligations = await AdminDataService.getFeeObligations(studentId);
      const obl = obligations.find(o => o.balance > 0);
      expect(obl).toBeDefined();
      const originalAmount = obl.amountDue;

      await AdminDataService.applyFeeDiscount(studentId, {
        discountType: 'sibling_concession',
        amount: 300,
        reason: 'Elder sibling enrolled in NEET coaching'
      }, 'director@focusacademyperambalur.com');

      const updatedObl = (await AdminDataService.getFeeObligations(studentId)).find(o => o.id === obl.id);
      expect(updatedObl.originalAmountDue).toBe(originalAmount);
      expect(updatedObl.discountAmount).toBe(300);
      expect(updatedObl.amountDue).toBe(originalAmount - 300);
    });

    it('records waivedBy and waivedAt attribution on fee waivers', async () => {
      const obligations = await AdminDataService.getFeeObligations();
      const obl = obligations.find(o => o.balance > 0);
      expect(obl).toBeDefined();

      const waived = await AdminDataService.waiveFeeObligation(
        obl.id,
        200,
        'Special management waiver approved by director',
        'director@focusacademyperambalur.com'
      );

      expect(waived.waivedBy).toBe('director@focusacademyperambalur.com');
      expect(waived.waivedAt).toBeDefined();
    });

    it('detects cumulative batch 12-seat capacity overflow across multiple CSV rows during preflight', async () => {
      const batch = await AdminDataService.getBatchById('batch-10-cbse');
      const seatsLeft = 12 - batch.enrolledCount;
      expect(seatsLeft).toBeGreaterThan(0);

      const rows = [];
      rows.push('studentName,guardianName,guardianPhone,grade,board,batchId,amountPerCycle');
      for (let i = 0; i < seatsLeft + 1; i++) {
        const phone = `98420${String(i).padStart(5, '0')}`;
        rows.push(`Student Seat ${i},Guardian ${i},${phone},Class 10,CBSE Board,batch-10-cbse,2400`);
      }
      const csvText = rows.join('\n');

      const preflight = AdminDataService.validateAndParseStudentCSV(csvText);
      expect(preflight.isValid).toBe(false);
      expect(preflight.validRows.length).toBe(seatsLeft);
      expect(preflight.invalidRows.length).toBe(1);
      expect(preflight.invalidRows[0].reason).toMatch(/12 seats exceeded/i);
    });

    it('rejects non-existent explicit batchId in CSV preflight', async () => {
      const csvText = `studentName,guardianName,guardianPhone,grade,board,batchId,amountPerCycle
Test NonExistent,Parent,9842411999,Class 10,CBSE Board,non-existent-batch-id-xyz,2400`;

      const preflight = AdminDataService.validateAndParseStudentCSV(csvText);
      expect(preflight.isValid).toBe(false);
      expect(preflight.invalidRows.length).toBe(1);
      expect(preflight.invalidRows[0].reason).toMatch(/does not exist/i);
    });

    it('correctly parses CSV with RFC4180 escaped quotes and commas within quotes', async () => {
      const csvText = `studentName,guardianName,guardianPhone,grade,board,batchId,amountPerCycle
"Rajesh, R.","Krishnan ""Senior""",9842400999,Class 10,TN State Board (Samacheer),batch-10-state-board,2000`;

      const preflight = AdminDataService.validateAndParseStudentCSV(csvText);
      expect(preflight.isValid).toBe(true);
      expect(preflight.validRows[0].studentName).toBe('Rajesh, R.');
      expect(preflight.validRows[0].guardianName).toBe('Krishnan "Senior"');
    });

    it('detects reversed student name initials as duplicate candidate in checkDuplicateStudent', async () => {
      const dup1 = AdminDataService.checkDuplicateStudent({
        studentName: 'Kaviya S',
        guardianPhone: '9842400000'
      });
      expect(dup1.hasDuplicate).toBe(true);
      expect(dup1.duplicates.some(d => d.student.studentName === 'S. Kaviya')).toBe(true);

      const dup2 = AdminDataService.checkDuplicateStudent({
        studentName: 'Rajesh R',
        guardianPhone: '9842400000'
      });
      expect(dup2.hasDuplicate).toBe(true);
      expect(dup2.duplicates.some(d => d.student.studentName === 'R. Rajesh')).toBe(true);
    });

    it('forbids fee_manager from creating full institutional backup snapshot', async () => {
      await expect(
        AdminDataService.createFullBackupSnapshot('coordinator@focusacademyperambalur.com')
      ).rejects.toThrow(/Unauthorized/i);
    });

    it('resolves the actor from the verified identity, never from browser storage', () => {
      sessionStorage.setItem('focus_academy_admin_session', JSON.stringify({
        email: 'director@focusacademyperambalur.com'
      }));
      setVerifiedAdmin(null);

      expect(() => AdminDataService.getUserRole('admin')).toThrow(/Authentication required/);

      setVerifiedAdmin({ email: 'principal@focusacademyperambalur.com' });
      expect(AdminDataService.getUserRole('admin')).toBe('administrator');

      sessionStorage.removeItem('focus_academy_admin_session');
    });

    it('never grants a role from words inside an actor string', () => {
      expect(AdminDataService.getUserRole('super_admin_owner@evil.test')).toBe('viewer');
      expect(AdminDataService.hasPermission('owner@evil.test', 'MANAGE_SETTINGS')).toBe(false);
    });
  });
});

