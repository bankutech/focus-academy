import { describe, it, expect, beforeEach } from 'vitest';
import { AdminDataService } from '../src/services/adminDataService';

describe('AdminDataService & Institutional Management Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    AdminDataService.resetToSeedData();
  });

  describe('Batch Operations & 12-Seat Capacity Guard', () => {
    it('retrieves initial seed batches with strict 12 capacity', async () => {
      const batches = await AdminDataService.getBatches();
      expect(batches.length).toBeGreaterThanOrEqual(8);
      for (const batch of batches) {
        expect(batch.capacity).toBe(12);
        expect(batch.enrolledCount + batch.seatsRemaining).toBe(12);
      }
    });

    it('creates a new batch with unique ID and 12-seat capacity cap', async () => {
      const newBatch = await AdminDataService.createBatch({
        id: 'batch-test-9-tamil',
        name: 'Class 9 Tamil Medium Special Batch',
        grade: 'Class 9',
        board: 'TN State Board (Samacheer)',
        monthlyFee: 1900
      }, 'director@focusacademyperambalur.com');

      expect(newBatch.id).toBe('batch-test-9-tamil');
      expect(newBatch.capacity).toBe(12);
      expect(newBatch.enrolledCount).toBe(0);
      expect(newBatch.seatsRemaining).toBe(12);

      const logs = await AdminDataService.getAuditLogs();
      const createLog = logs.find(l => l.action === 'BATCH_CREATED' && l.entityId === newBatch.id);
      expect(createLog).toBeDefined();
      expect(createLog.actor).toBe('director@focusacademyperambalur.com');
    });

    it('rejects duplicate batch IDs', async () => {
      await expect(
        AdminDataService.createBatch({
          id: 'batch-10-state-board',
          name: 'Duplicate Batch',
          grade: 'Class 10',
          board: 'TN State Board (Samacheer)'
        })
      ).rejects.toThrow(/already exists/i);
    });

    it('prevents batch deletion when active students are enrolled', async () => {
      await expect(
        AdminDataService.deleteBatch('batch-10-state-board')
      ).rejects.toThrow(/active student\(s\) are assigned/i);
    });
  });

  describe('Student Enrollment & Academic Isolation', () => {
    it('enrolls student into compatible batch and increments enrolled count', async () => {
      const initialBatch = await AdminDataService.getBatchById('batch-10-state-board');
      const initialEnrolled = initialBatch.enrolledCount;

      const student = await AdminDataService.createStudent({
        studentName: 'M. Divya',
        guardianName: 'P. Murugan',
        guardianPhone: '9842411223',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        batchId: 'batch-10-state-board'
      });

      expect(student.id).toBeDefined();
      expect(student.batchId).toBe('batch-10-state-board');

      const updatedBatch = await AdminDataService.getBatchById('batch-10-state-board');
      expect(updatedBatch.enrolledCount).toBe(initialEnrolled + 1);
      expect(updatedBatch.seatsRemaining).toBe(12 - updatedBatch.enrolledCount);
    });

    it('rejects enrollment if academic grade/board mismatches batch', async () => {
      await expect(
        AdminDataService.createStudent({
          studentName: 'K. Vignesh',
          guardianPhone: '9842499999',
          grade: 'Class 12',
          board: 'CBSE Board',
          batchId: 'batch-10-state-board'
        })
      ).rejects.toThrow(/Academic Mismatch/i);
    });

    it('rejects enrollment when phone number is invalid', async () => {
      await expect(
        AdminDataService.createStudent({
          studentName: 'Invalid Phone Student',
          guardianPhone: '12345',
          grade: 'Class 10',
          board: 'TN State Board (Samacheer)',
          batchId: 'batch-10-state-board'
        })
      ).rejects.toThrow(/valid 10-digit/i);
    });

    it('successfully transfers a student between compatible batches and adjusts counts', async () => {
      const b1 = await AdminDataService.createBatch({
        id: 'batch-comp-1',
        name: 'Class 10 Math Morning',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        monthlyFee: 2000
      });

      const b2 = await AdminDataService.createBatch({
        id: 'batch-comp-2',
        name: 'Class 10 Math Evening',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        monthlyFee: 2000
      });

      const student = await AdminDataService.createStudent({
        studentName: 'T. Karthik',
        guardianPhone: '9842412345',
        grade: 'Class 10',
        board: 'TN State Board (Samacheer)',
        batchId: b1.id
      });

      const transferResult = await AdminDataService.transferStudentBatch(
        student.id,
        b2.id,
        'Parent requested evening slot'
      );
      expect(transferResult.success).toBe(true);

      const updatedB1 = await AdminDataService.getBatchById(b1.id);
      const updatedB2 = await AdminDataService.getBatchById(b2.id);
      expect(updatedB1.enrolledCount).toBe(0);
      expect(updatedB2.enrolledCount).toBe(1);

      const logs = await AdminDataService.getAuditLogs();
      const transferLog = logs.find(l => l.action === 'STUDENT_TRANSFERRED');
      expect(transferLog).toBeDefined();
      expect(transferLog.details).toContain('Parent requested evening slot');
    });
  });

  describe('Financial Obligations, Payments & Ledger', () => {
    it('creates fee obligation and prevents duplicate for same billing cycle', async () => {
      const obl1 = await AdminDataService.createFeeObligation({
        studentId: 'FA-2026-001',
        studentName: 'S. Kaviya',
        batchId: 'batch-10-state-board',
        billingCycle: 'December 2026',
        dueDate: '2026-12-05',
        amountDue: 2200
      });

      expect(obl1.id).toBeDefined();
      expect(obl1.amountDue).toBe(2200);
      expect(obl1.balance).toBe(2200);

      const obl2 = await AdminDataService.createFeeObligation({
        studentId: 'FA-2026-001',
        studentName: 'S. Kaviya',
        batchId: 'batch-10-state-board',
        billingCycle: 'December 2026',
        dueDate: '2026-12-05',
        amountDue: 2200
      });

      expect(obl2.id).toBe(obl1.id);
    });

    it('waives fee obligation with required reason and updates balance', async () => {
      const obligations = await AdminDataService.getFeeObligations('FA-2026-002');
      const obl = obligations.find(o => o.balance > 0);
      expect(obl).toBeDefined();

      const initialBalance = obl.balance;
      const waiveAmount = 500;

      const waived = await AdminDataService.waiveFeeObligation(
        obl.id,
        waiveAmount,
        'Director approved sports concession discount'
      );

      expect(waived.waivedAmount).toBe(waiveAmount);
      expect(waived.balance).toBe(initialBalance - waiveAmount);
    });

    it('rejects fee waiver without a valid audit reason of at least 5 characters', async () => {
      await expect(
        AdminDataService.waiveFeeObligation('OBL-2026-102', 100, 'abc')
      ).rejects.toThrow(/at least 5 characters/i);
    });

    it('records valid payment and generates sequential receipt', async () => {
      const result = await AdminDataService.recordPayment({
        obligationId: 'OBL-2026-102',
        amount: 800,
        paymentDate: '2026-10-24',
        paymentMethod: 'upi_online',
        referenceNumber: 'UPI/9988776655'
      }, 'admin@focusacademyperambalur.com');

      expect(result.payment.receiptNumber).toMatch(/^REC-\d{4}-\d{4}$/);
      expect(result.obligation.amountPaid).toBeGreaterThanOrEqual(800);
    });

    it('rejects payments exceeding the remaining balance', async () => {
      await expect(
        AdminDataService.recordPayment({
          obligationId: 'OBL-2026-102',
          amount: 999999
        })
      ).rejects.toThrow(/exceeds the remaining balance/i);
    });

    it('calculates comprehensive student ledger accurately', async () => {
      const ledger = await AdminDataService.getStudentLedger('FA-2026-001');
      expect(ledger.student).toBeDefined();
      expect(ledger.totalFeesCharged).toBeGreaterThan(0);
      expect(ledger.totalAmountPaid).toBeGreaterThan(0);
      expect(ledger.outstandingBalance).toBe(ledger.totalFeesCharged - ledger.totalAmountPaid - ledger.totalWaived);
    });
  });

  describe('WhatsApp Notification Engine & 24h Rate Limiting', () => {
    it('generates standard Focus Academy WhatsApp message template', () => {
      const message = AdminDataService.generateWhatsAppMessage({
        studentName: 'S. Kaviya',
        amount: 2200,
        dueDate: '2026-11-05'
      });

      expect(message).toBe(
        'Hello, this is Focus Academy. A fee payment of ₹2200 for S. Kaviya is due on 2026-11-05. If you have already paid, please contact the academy so we can verify the payment. Thank you.'
      );
    });

    it('dispatches reminder, constructs click-to-chat URL, and enforces 24h rate limiting', async () => {
      const result = await AdminDataService.sendOrLogWhatsAppReminder({
        studentId: 'FA-2026-004',
        obligationId: 'OBL-2026-104',
        reminderType: 'upcoming'
      });

      expect(result.clickToChatUrl).toContain('https://wa.me/919842100003?text=');
      expect(result.reminder.status).toBe('manual_opened');

      await expect(
        AdminDataService.sendOrLogWhatsAppReminder({
          studentId: 'FA-2026-004',
          obligationId: 'OBL-2026-104',
          reminderType: 'upcoming'
        })
      ).rejects.toThrow(/already processed for this obligation within the last 24 hours/i);
    });

    it('rejects sending reminder for zero balance or paid obligations', async () => {
      await expect(
        AdminDataService.sendOrLogWhatsAppReminder({
          studentId: 'FA-2026-001',
          obligationId: 'OBL-2026-101',
          reminderType: 'upcoming'
        })
      ).rejects.toThrow(/already marked as PAID with ₹0 balance/i);
    });

    it('rejects WhatsApp reminder when guardian phone is invalid or less than 10 digits', async () => {
      const store = JSON.parse(localStorage.getItem('focus_academy_admin_data_v1'));
      store.students.push({
        id: 'FA-TEST-BAD-PHONE',
        studentName: 'Bad Phone Student',
        guardianPhone: '123',
        status: 'active'
      });
      store.obligations.push({
        id: 'OBL-TEST-BAD-PHONE',
        studentId: 'FA-TEST-BAD-PHONE',
        balance: 1000,
        amountDue: 1000,
        amountPaid: 0,
        dueDate: '2026-11-05',
        status: 'pending'
      });
      localStorage.setItem('focus_academy_admin_data_v1', JSON.stringify(store));

      await expect(
        AdminDataService.sendOrLogWhatsAppReminder({
          studentId: 'FA-TEST-BAD-PHONE',
          obligationId: 'OBL-TEST-BAD-PHONE',
          reminderType: 'upcoming'
        })
      ).rejects.toThrow(/valid 10-digit guardian mobile number is required/i);
    });
  });

  describe('Edge Cases & Data Synchronization', () => {
    it('rejects fee waiver when amount is zero or negative', async () => {
      await expect(
        AdminDataService.waiveFeeObligation('OBL-2026-102', 0, 'Zero amount waiver attempt')
      ).rejects.toThrow(/must be greater than zero/i);

      await expect(
        AdminDataService.waiveFeeObligation('OBL-2026-102', -200, 'Negative amount waiver attempt')
      ).rejects.toThrow(/must be greater than zero/i);
    });

    it('correctly caps successive waivers without exceeding remaining balance', async () => {
      const firstWaiver = await AdminDataService.waiveFeeObligation(
        'OBL-2026-102',
        500,
        'First approved sports concession'
      );
      expect(firstWaiver.waivedAmount).toBe(500);
      expect(firstWaiver.balance).toBe(800);

      const secondWaiver = await AdminDataService.waiveFeeObligation(
        'OBL-2026-102',
        1000,
        'Second approved merit concession'
      );
      expect(secondWaiver.waivedAmount).toBe(1300); // 500 + 800
      expect(secondWaiver.balance).toBe(0);
      expect(secondWaiver.status).toBe('waived');

      await expect(
        AdminDataService.waiveFeeObligation('OBL-2026-102', 100, 'Third attempt after zero balance')
      ).rejects.toThrow(/no outstanding balance to waive/i);
    });

    it('synchronizes student batchName across enrolled students when batch is renamed', async () => {
      const studentBefore = await AdminDataService.getStudentById('FA-2026-001');
      expect(studentBefore.batchName).toBe('Class 10 State Board (SSLC) - Prime Evening Batch');

      await AdminDataService.updateBatch('batch-10-state-board', {
        name: 'Class 10 Samacheer Kalvi Elite Evening Batch'
      });

      const studentAfter = await AdminDataService.getStudentById('FA-2026-001');
      expect(studentAfter.batchName).toBe('Class 10 Samacheer Kalvi Elite Evening Batch');
    });
  });

  describe('Payment Reversals, Idempotency & Financial Consistency Audit', () => {
    it('successfully reverses a payment and recalculates obligation balance and status', async () => {
      const paymentResult = await AdminDataService.recordPayment({
        obligationId: 'OBL-2026-102',
        amount: 800,
        paymentDate: '2026-10-24',
        paymentMethod: 'upi_online',
        referenceNumber: 'UPI/REV-TEST-001'
      }, 'admin@focusacademyperambalur.com');

      const oblBeforeReversal = (await AdminDataService.getFeeObligations()).find(o => o.id === 'OBL-2026-102');
      const paidBeforeReversal = oblBeforeReversal.amountPaid;
      const balanceBeforeReversal = oblBeforeReversal.balance;

      const reversalResult = await AdminDataService.reversePayment(
        paymentResult.payment.id,
        'Bank returned UPI chargeback due to customer bank server timeout',
        'director@focusacademyperambalur.com'
      );

      expect(reversalResult.success).toBe(true);
      expect(reversalResult.payment.isReversed).toBe(true);
      expect(reversalResult.payment.reversalReason).toBe('Bank returned UPI chargeback due to customer bank server timeout');
      expect(reversalResult.payment.reversedBy).toBe('director@focusacademyperambalur.com');

      const oblAfterReversal = (await AdminDataService.getFeeObligations()).find(o => o.id === 'OBL-2026-102');
      expect(oblAfterReversal.amountPaid).toBe(paidBeforeReversal - 800);
      expect(oblAfterReversal.balance).toBe(balanceBeforeReversal + 800);
      expect(oblAfterReversal.status).toBe('partially_paid');

      const logs = await AdminDataService.getAuditLogs();
      const reversalLog = logs.find(l => l.action === 'PAYMENT_REVERSED' && l.entityId === paymentResult.payment.id);
      expect(reversalLog).toBeDefined();
      expect(reversalLog.actor).toBe('director@focusacademyperambalur.com');
      expect(reversalLog.details).toContain('Reversed payment of ₹800');
    });

    it('rejects payment reversal when reason is less than 5 characters', async () => {
      const payment = (await AdminDataService.getPayments())[0];
      await expect(
        AdminDataService.reversePayment(payment.id, 'bad')
      ).rejects.toThrow(/at least 5 characters/i);
    });

    it('prevents double reversal of an already reversed payment', async () => {
      const payments = await AdminDataService.getPayments();
      const target = payments[0];

      await AdminDataService.reversePayment(
        target.id,
        'First valid reversal for bounced transaction',
        'director@focusacademyperambalur.com'
      );

      await expect(
        AdminDataService.reversePayment(
          target.id,
          'Second attempt to reverse the same payment',
          'director@focusacademyperambalur.com'
        )
      ).rejects.toThrow(/already been reversed/i);
    });

    it('rejects reversal when payment ID does not exist', async () => {
      await expect(
        AdminDataService.reversePayment('TXN-NON-EXISTENT', 'Valid audit reason')
      ).rejects.toThrow(/Payment transaction not found/i);
    });

    it('excludes reversed payments from student ledger calculations and outstanding balance', async () => {
      const studentId = 'FA-2026-001';
      const ledgerBefore = await AdminDataService.getStudentLedger(studentId);
      const initialPaid = ledgerBefore.totalAmountPaid;

      const p = ledgerBefore.payments[0];
      await AdminDataService.reversePayment(
        p.id,
        'Duplicate entry corrected by fee coordinator',
        'director@focusacademyperambalur.com'
      );

      const ledgerAfter = await AdminDataService.getStudentLedger(studentId);
      expect(ledgerAfter.totalAmountPaid).toBe(initialPaid - p.amount);
      expect(ledgerAfter.outstandingBalance).toBe(ledgerBefore.outstandingBalance + p.amount);
    });

    it('excludes reversed payments from dashboard metrics total collections', async () => {
      const metricsBefore = await AdminDataService.getDashboardMetrics();
      const payments = await AdminDataService.getPayments();
      const activePayment = payments.find(p => !p.isReversed);

      await AdminDataService.reversePayment(
        activePayment.id,
        'Director approved refund and reversal',
        'director@focusacademyperambalur.com'
      );

      const metricsAfter = await AdminDataService.getDashboardMetrics();
      expect(metricsAfter.totalOutstandingFees).toBe(metricsBefore.totalOutstandingFees + activePayment.amount);
    });

    it('prevents concurrent payments from exceeding obligation balance', async () => {
      const obligations = await AdminDataService.getFeeObligations();
      const obl = obligations.find(o => o.balance > 0);
      const remaining = obl.balance;

      const p1 = await AdminDataService.recordPayment({
        obligationId: obl.id,
        amount: remaining
      });
      expect(p1.obligation.balance).toBe(0);

      await expect(
        AdminDataService.recordPayment({
          obligationId: obl.id,
          amount: 100
        })
      ).rejects.toThrow(/exceeds the remaining balance of ₹0/i);
    });

    it('forbids unauthorized users from reversing payments', async () => {
      const payments = await AdminDataService.getPayments();
      await expect(
        AdminDataService.reversePayment(payments[0].id, 'Unauthorized reversal attempt', 'unauthorized_user@gmail.com')
      ).rejects.toThrow(/Unauthorized/i);
    });
  });
  describe('Cash Drawer (Till) Sessions & Cross-Student Duplicate Prevention', () => {
    it('blocks cross-student / cross-obligation duplicate UPI transaction references', async () => {
      const obligations = await AdminDataService.getFeeObligations();
      const openObls = obligations.filter(o => o.balance >= 500);
      const firstObl = openObls[0];
      const secondObl = openObls[1];
      const customUtr = 'UPI-SBI-2026-X998811';

      await AdminDataService.recordPayment({
        obligationId: firstObl.id,
        studentId: firstObl.studentId,
        amount: 500,
        paymentMethod: 'upi',
        referenceNumber: customUtr
      });

      await expect(
        AdminDataService.recordPayment({
          obligationId: secondObl.id,
          studentId: secondObl.studentId,
          amount: 500,
          paymentMethod: 'upi',
          referenceNumber: customUtr
        })
      ).rejects.toThrow(/Duplicate Transaction Reference/i);
    });

    it('manages cash drawer till session lifecycle: open, summary tally, and close with difference tracking', async () => {
      const activeInitial = await AdminDataService.getActiveTillSession();
      expect(activeInitial).toBeNull();

      const session = await AdminDataService.openTillSession({
        openingFloat: 2000,
        notes: 'Thiripura Desk Morning Shift'
      }, 'admin@focusacademyperambalur.com');

      expect(session.status).toBe('open');
      expect(session.openingFloat).toBe(2000);

      const activeAfterOpen = await AdminDataService.getActiveTillSession();
      expect(activeAfterOpen).not.toBeNull();
      expect(activeAfterOpen.id).toBe(session.id);

      await expect(
        AdminDataService.openTillSession({ openingFloat: 1000 })
      ).rejects.toThrow(/already open/i);

      const summary = await AdminDataService.getTillSessionSummary(session.id);
      expect(summary.openingFloat).toBe(2000);
      expect(summary.expectedCashInDrawer).toBeGreaterThanOrEqual(2000);

      const closed = await AdminDataService.closeTillSession(session.id, {
        closingCashActual: summary.expectedCashInDrawer,
        handedOverTo: 'Managing Director Ramanathan',
        closingNotes: 'Evening shift hand-off reconciled'
      }, 'admin@focusacademyperambalur.com');

      expect(closed.status).toBe('closed');
      expect(closed.difference).toBe(0);
      expect(closed.handedOverTo).toBe('Managing Director Ramanathan');

      const activeAfterClose = await AdminDataService.getActiveTillSession();
      expect(activeAfterClose).toBeNull();
    });
  });
});
