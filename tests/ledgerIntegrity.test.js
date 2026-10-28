import { describe, it, expect, beforeEach } from 'vitest';
import { AdminDataService, normalizePaymentMethod } from '../src/services/adminDataService.js';

const actor = 'director@focusacademyperambalur.com';

beforeEach(() => {
  localStorage.clear();
  AdminDataService.resetToSeedData();
});

describe('Payment method policy', () => {
  it('accepts desk-approved methods and common aliases', () => {
    expect(normalizePaymentMethod('Cash')).toBe('cash');
    expect(normalizePaymentMethod('UPI')).toBe('upi_online');
    expect(normalizePaymentMethod('gpay')).toBe('upi_online');
    expect(normalizePaymentMethod('IMPS')).toBe('bank_transfer');
    expect(normalizePaymentMethod('dd')).toBe('demand_draft');
  });

  it('rejects unknown or missing methods instead of guessing', () => {
    expect(() => normalizePaymentMethod('bitcoin')).toThrow(/approved collection method/i);
    expect(() => normalizePaymentMethod('')).toThrow();
  });
});

describe('Authoritative fee ledger reconciliation', () => {
  it('rejects overpayment and zero/negative amounts', async () => {
    await expect(
      AdminDataService.recordPayment({ obligationId: 'OBL-2026-102', amount: 5000, paymentMethod: 'cash' }, actor)
    ).rejects.toThrow(/exceeds the remaining balance/i);

    await expect(
      AdminDataService.recordPayment({ obligationId: 'OBL-2026-102', amount: 0, paymentMethod: 'cash' }, actor)
    ).rejects.toThrow(/greater than zero/i);

    const ledger = await AdminDataService.getStudentLedger('FA-2026-002');
    expect(ledger.totalAmountPaid).toBe(1300);
  });

  it('rejects a duplicate transaction reference across the institute', async () => {
    await AdminDataService.recordPayment(
      { obligationId: 'OBL-2026-103', amount: 4800, paymentMethod: 'upi_online', referenceNumber: 'UPI/SHARED-REF-1' },
      actor
    );

    await expect(
      AdminDataService.recordPayment(
        { obligationId: 'OBL-2026-104', amount: 100, paymentMethod: 'upi_online', referenceNumber: 'UPI/SHARED-REF-1' },
        actor
      )
    ).rejects.toThrow(/duplicate transaction reference/i);
  });

  it('settles a full payment and schedules the next monthly cycle from the billing rule', async () => {
    const recorded = await AdminDataService.recordPayment(
      { obligationId: 'OBL-2026-102', amount: 1300, paymentMethod: 'cash' },
      actor
    );
    expect(recorded.receiptNumber).toMatch(/^REC-/);

    const ledger = await AdminDataService.getStudentLedger('FA-2026-002');
    expect(ledger.totalFeesCharged).toBe(2600);
    expect(ledger.totalAmountPaid).toBe(2600);
    expect(ledger.outstandingBalance).toBe(0);
    expect(ledger.nextPaymentSchedule.dueDate).toBe('2026-11-15');
  });

  it('records a partial payment without marking the obligation paid', async () => {
    await AdminDataService.recordPayment(
      { obligationId: 'OBL-2026-104', amount: 400, paymentMethod: 'cash' },
      actor
    );

    const ledger = await AdminDataService.getStudentLedger('FA-2026-004');
    expect(ledger.totalAmountPaid).toBe(400);
    expect(ledger.outstandingBalance).toBe(2000);
    const obligation = ledger.obligations.find((o) => o.id === 'OBL-2026-104');
    expect(obligation.status).toBe('partially_paid');
  });

  it('reduces outstanding by an approved waiver and never treats it as cash collected', async () => {
    await AdminDataService.waiveFeeObligation('OBL-2026-103', 800, 'Merit scholarship approved by director', actor);

    const ledger = await AdminDataService.getStudentLedger('FA-2026-003');
    expect(ledger.totalWaived).toBe(800);
    expect(ledger.totalAmountPaid).toBe(0);
    expect(ledger.outstandingBalance).toBe(4800 - 800);
    expect(ledger.overdueAmount).toBeGreaterThan(0);
  });

  it('does not count a reversed payment as a collection and restores the balance', async () => {
    const recorded = await AdminDataService.recordPayment(
      { obligationId: 'OBL-2026-104', amount: 2400, paymentMethod: 'cash' },
      actor
    );
    let ledger = await AdminDataService.getStudentLedger('FA-2026-004');
    expect(ledger.outstandingBalance).toBe(0);

    await AdminDataService.reversePayment(recorded.id, 'Payment credited to the wrong student file', actor);

    ledger = await AdminDataService.getStudentLedger('FA-2026-004');
    expect(ledger.totalAmountPaid).toBe(0);
    expect(ledger.outstandingBalance).toBe(2400);
    const reversed = ledger.payments.find((p) => p.id === recorded.id);
    expect(reversed.isReversed).toBe(true);
    expect(reversed.status).toBe('reversed');
  });

  it('prevents double reversal and requires an audit reason', async () => {
    const recorded = await AdminDataService.recordPayment(
      { obligationId: 'OBL-2026-104', amount: 2400, paymentMethod: 'cash' },
      actor
    );

    await expect(AdminDataService.reversePayment(recorded.id, 'bad', actor)).rejects.toThrow(/at least 5 characters/i);
    await AdminDataService.reversePayment(recorded.id, 'Duplicate entry corrected at the desk', actor);
    await expect(
      AdminDataService.reversePayment(recorded.id, 'Attempting to reverse twice', actor)
    ).rejects.toThrow(/already been reversed/i);
  });

  it('keeps dashboard metrics reconciled with the ledger after a payment and a reversal', async () => {
    const before = await AdminDataService.getDashboardMetrics();
    const obligation = (await AdminDataService.getFeeObligations()).find((o) => o.id === 'OBL-2026-104');
    expect(before.totalOutstandingFees).toBeGreaterThanOrEqual(obligation.balance);

    const recorded = await AdminDataService.recordPayment(
      { obligationId: 'OBL-2026-104', amount: 1000, paymentMethod: 'upi_online', referenceNumber: 'UPI/METRIC-1' },
      actor
    );
    const afterPayment = await AdminDataService.getDashboardMetrics();
    expect(afterPayment.totalOutstandingFees).toBe(before.totalOutstandingFees - 1000);

    await AdminDataService.reversePayment(recorded.id, 'Payment bounced at the bank', actor);
    const afterReversal = await AdminDataService.getDashboardMetrics();
    expect(afterReversal.totalOutstandingFees).toBe(before.totalOutstandingFees);
    expect(afterReversal.feesCollectedThisMonth).toBe(before.feesCollectedThisMonth);
  });
});
