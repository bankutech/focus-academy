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

      // Immediate second dispatch must be rejected by 24h rate limiting
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
      // Create student with truncated phone simulation
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
      // OBL-2026-102 has amountDue: 2600, amountPaid: 1300, balance: 1300
      const firstWaiver = await AdminDataService.waiveFeeObligation(
        'OBL-2026-102',
        500,
        'First approved sports concession'
      );
      expect(firstWaiver.waivedAmount).toBe(500);
      expect(firstWaiver.balance).toBe(800);

      // Attempt second waiver for 1000 when only 800 balance remains
      const secondWaiver = await AdminDataService.waiveFeeObligation(
        'OBL-2026-102',
        1000,
        'Second approved merit concession'
      );
      expect(secondWaiver.waivedAmount).toBe(1300); // 500 + 800
      expect(secondWaiver.balance).toBe(0);
      expect(secondWaiver.status).toBe('waived');

      // Third attempt on settled obligation must be rejected
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
});
