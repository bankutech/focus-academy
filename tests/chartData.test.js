import { describe, it, expect } from 'vitest';
import { feeStatusBreakdown, batchOccupancy, monthlyCollections, paymentMethodSplit, studentsByGrade, outstandingByBatch } from '../src/components/admin/chartData';

describe('Admin chart data', () => {
  const obligations = [
    { batchId: 'b1', amountDue: 2000, amountPaid: 2000, waivedAmount: 0, dueDate: '2020-01-01', status: 'paid' },
    { batchId: 'b1', amountDue: 2000, amountPaid: 500, waivedAmount: 0, dueDate: '2099-01-01', status: 'partially_paid' },
    { batchId: 'b2', amountDue: 1800, amountPaid: 0, waivedAmount: 300, dueDate: '2020-01-01', status: 'overdue' },
    { batchId: 'b2', amountDue: 1800, amountPaid: 0, waivedAmount: 0, dueDate: '2099-01-01', status: 'cancelled' },
  ];

  it('splits money across paid, partial, overdue and waived without double counting', () => {
    const rows = Object.fromEntries(feeStatusBreakdown(obligations).map((r) => [r.label, r.value]));
    expect(rows.Collected).toBe(2500);
    expect(rows['Partly paid, balance']).toBe(1500);
    expect(rows.Overdue).toBe(1500);
    expect(rows.Waived).toBe(300);
    expect(rows.Pending).toBe(0);
  });

  it('flags full and nearly full batches', () => {
    const rows = batchOccupancy([
      { id: 'a', name: 'Class 10 CBSE - Prime', capacity: 12, enrolledCount: 12 },
      { id: 'b', name: 'Class 9 - Pre', capacity: 12, enrolledCount: 9 },
      { id: 'c', name: 'Old', capacity: 12, enrolledCount: 1, isArchived: true },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].color).toBe('#E11D48');
    expect(rows[1].color).toBe('#EA580C');
    expect(rows[0].sub).toBe('12/12');
  });

  it('buckets six months of collections and skips reversed payments', () => {
    const now = new Date(2026, 9, 25);
    const rows = monthlyCollections([
      { amount: 1000, paymentDate: '2026-10-03' },
      { amount: 500, paymentDate: '2026-10-20', isReversed: true },
      { amount: 700, paymentDate: '2026-05-30' },
      { amount: 900, paymentDate: '2025-01-01' },
    ], 6, now);
    expect(rows).toHaveLength(6);
    expect(rows[5].value).toBe(1000);
    expect(rows[0].value).toBe(700);
    expect(rows.reduce((s, r) => s + r.value, 0)).toBe(1700);
  });

  it('groups payment methods, students by grade and outstanding by batch', () => {
    const methods = paymentMethodSplit([{ amount: 100, paymentMethod: 'upi' }, { amount: 50, paymentMethod: 'UPI' }, { amount: 70, paymentMethod: 'bank_transfer' }]);
    expect(methods.find((m) => m.label === 'Upi').value).toBe(150);
    expect(methods.find((m) => m.label === 'Bank Transfer').value).toBe(70);

    const grades = studentsByGrade([{ grade: 'Class 12' }, { grade: 'Class 9' }, { grade: 'Class 9' }, { grade: 'Class 10', status: 'inactive' }]);
    expect(grades.map((g) => g.label)).toEqual(['Class 9', 'Class 12']);
    expect(grades[0].value).toBe(2);

    const out = outstandingByBatch(obligations, [{ id: 'b1', name: 'Class 10 State - Prime' }, { id: 'b2', name: 'Class 9 - Pre' }]);
    expect(out[0].value).toBe(1500);
    expect(out).toHaveLength(2);
  });
});
