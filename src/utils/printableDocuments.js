export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const e = escapeHtml;
const amount = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const RECEIPT_STYLE = `
  body { font-family: sans-serif; padding: 40px; color: #0F172A; }
  .receipt { border: 2px solid #0F172A; padding: 30px; max-width: 600px; margin: 0 auto; }
  h1 { margin: 0 0 5px 0; color: #C2410C; font-size: 24px; }
  .meta { color: #64748B; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #E2E8F0; padding: 10px; font-size: 13px; text-align: left; }
  th { background: #F8FAFC; }
  .footer { margin-top: 30px; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px; }
`;

const SLIP_STYLE = `
  body { font-family: sans-serif; padding: 40px; color: #0F172A; }
  .slip { border: 2px solid #C2410C; padding: 30px; max-width: 650px; margin: 0 auto; }
  h1 { margin: 0 0 5px 0; color: #C2410C; font-size: 26px; }
  .badge { background: #EA580C; color: white; padding: 3px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; display: inline-block; margin-bottom: 15px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #E2E8F0; padding: 10px; font-size: 13px; text-align: left; }
  th { background: #F8FAFC; width: 40%; }
  .footer { margin-top: 30px; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px; text-align: center; }
`;

const documentShell = (title, style, body) =>
  `<html>
    <head><title>${e(title)}</title><style>${style}</style></head>
    <body>${body}<script>window.print();</script></body>
  </html>`;

export const buildReceiptHtml = (payment = {}, fallbacks = {}) => {
  const status = payment.isReversed || payment.reversed
    ? 'REVERSED — NOT COUNTED AS A COLLECTION'
    : 'VERIFIED &amp; CREDITED TO ACADEMY LEDGER';
  const rows = [
    ['Receipt No', `<strong>${e(payment.receiptNumber || '')}</strong>`],
    ['Student Name', e(payment.studentName || fallbacks.studentName || '')],
    ['Date', e(payment.paymentDate || '')],
    ['Amount Paid', `<strong>${e(amount(payment.amount))}</strong>`],
    ['Payment Mode', `<span style="text-transform: capitalize;">${e(String(payment.paymentMethod || '').replace('_', ' '))}</span>`],
    ['Transaction Ref', e(payment.referenceNumber || payment.id || '')],
    ['Status', status]
  ];
  const body = `
    <div class="receipt">
      <h1>FOCUS ACADEMY</h1>
      <div class="meta">Thiripura Complex, Thoramangalam, Perambalur — 621220 • Official Receipt</div>
      <table>
        ${rows.map(([label, value]) => `<tr><th>${e(label)}</th><td>${value}</td></tr>`).join('')}
      </table>
      <div class="footer">Computer generated official receipt issued by Focus Academy Finance Desk.</div>
    </div>`;
  return documentShell(`Receipt ${payment.receiptNumber || ''} - Focus Academy`, RECEIPT_STYLE, body);
};

export const buildAdmissionSlipHtml = (data = {}) => {
  const rows = [
    ['Admission Slip No', `<strong>${e(data.admissionId || 'Pending')}</strong>`],
    ['Student Name', `<strong>${e(data.studentName || '')}</strong>`],
    ['Student ID', e(data.studentId || 'Pending central assignment')],
    ['Class & Board', e(`${data.grade || ''}${data.grade && data.board ? ' • ' : ''}${data.board || ''}`)],
    ['Enrolled Batch', `<strong>${e(data.batchName || 'Focus Evening Batch')}</strong>`],
    ['Session Timing', e(data.batchTiming || 'Evening Session (4:00 PM – 8:30 PM)')],
    ['Classroom Ratio', '1:12 Strict Faculty Supervision Capped'],
    ['Parent / Contact', `${e(data.parentName || 'Parent')}${data.contact ? ` (${e(data.contact)})` : ''}`],
    ['Admission Status', e(String(data.admissionStatus || 'pending review').replace('_', ' ').toUpperCase())]
  ];
  const body = `
    <div class="slip">
      <h1>FOCUS ACADEMY</h1>
      <div class="badge">OFFICIAL ADMISSION SLIP (SESSION 2025–2026)</div>
      <div>Thiripura Complex, Main Road, Thoramangalam, Perambalur — 621220</div>
      <table>
        ${rows.map(([label, value]) => `<tr><th>${e(label)}</th><td>${value}</td></tr>`).join('')}
      </table>
      <div class="footer">
        Please present this slip at Thiripura Complex reception for textbook workbook issuance.
      </div>
    </div>`;
  return documentShell('Official Admission Slip - Focus Academy', SLIP_STYLE, body);
};

export const openPrintableDocument = (html) => {
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
};
