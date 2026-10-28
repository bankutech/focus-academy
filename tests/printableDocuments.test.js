import { describe, it, expect } from 'vitest';
import { escapeHtml, buildReceiptHtml, buildAdmissionSlipHtml } from '../src/utils/printableDocuments';

describe('Printable receipt and admission slip', () => {
  it('escapes HTML so a crafted student name or reference cannot inject markup', () => {
    const payload = `<img src=x onerror="alert('xss')">`;
    const html = buildReceiptHtml({
      receiptNumber: 'REC-2026-0001',
      studentName: payload,
      paymentDate: '2026-10-28',
      amount: 2200,
      paymentMethod: 'cash',
      referenceNumber: `"><script>alert('ref')</script>`
    });

    expect(html).not.toContain('<img');
    expect(html).not.toContain(`<script>alert`);
    expect(html).toContain('&lt;img src=x onerror');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes admission slip fields', () => {
    const html = buildAdmissionSlipHtml({
      admissionId: 'FA-2026-0001',
      studentName: `</td><script>alert('slip')</script>`,
      grade: 'Class 10',
      board: 'TN State Board',
      batchName: 'Evening Batch',
      contact: '+91 9842451220',
      admissionStatus: 'confirmed'
    });

    expect(html).not.toContain(`<script>alert`);
    expect(html).toContain('FA-2026-0001');
    expect(html).toContain('Class 10 • TN State Board');
    expect(html).toContain('CONFIRMED');
  });

  it('keeps reversal and verified status wording intact', () => {
    const reversed = buildReceiptHtml({ isReversed: true, amount: 100 });
    const verified = buildReceiptHtml({ amount: 100 });
    expect(reversed).toContain('REVERSED');
    expect(verified).toContain('VERIFIED');
  });

  it('provides an escapeHtml primitive', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
    expect(escapeHtml(null)).toBe('');
  });
});
