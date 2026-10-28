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
    ['Student ID', e(payment.studentId || fallbacks.studentId || 'Pending assignment')],
    ['Date of Payment', e(payment.paymentDate || '')],
    ['Amount Paid', `<strong>${e(amount(payment.amount))}</strong>`],
    ['Payment Mode', `<span style="text-transform: capitalize;">${e(String(payment.paymentMethod || '').replace('_', ' '))}</span>`],
    ['Transaction Ref', e(payment.referenceNumber || payment.id || '')],
    ['Payment Status', status],
    ['Center GSTIN', '33AAACB2234P1Z2']
  ];
  const body = `
    <div style="max-width: 600px; margin: 0 auto; text-align: right; margin-bottom: 12px;">
      <button onclick="window.print()" style="padding: 8px 18px; background: #C2410C; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Print / Save as PDF</button>
    </div>
    <div class="receipt">
      <h1>FOCUS ACADEMY</h1>
      <div class="meta">Thiripura Complex, Main Road (via Four Roads), Thoramangalam, Perambalur — 621220<br>Desk: +91 98424 51220 • GSTIN: 33AAACB2234P1Z2 • Official Fee Receipt</div>
      <table>
        ${rows.map(([label, value]) => `<tr><th>${e(label)}</th><td>${value}</td></tr>`).join('')}
      </table>
      <div class="footer">Computer generated official tax receipt issued by Focus Academy Finance Desk. Verified &amp; recorded in central database.</div>
    </div>`;
  return documentShell(`Receipt ${payment.receiptNumber || ''} - Focus Academy`, RECEIPT_STYLE, body);
};

export const buildAdmissionSlipHtml = (data = {}) => {
  const rows = [
    ['Admission Slip No', `<strong>${e(data.admissionId || data.id || 'Pending')}</strong>`],
    ['Student Name', `<strong>${e(data.studentName || '')}</strong>`],
    ['Student ID', e(data.studentId || 'Pending central assignment')],
    ['Class & Board', e(`${data.grade || ''}${data.grade && data.board ? ' • ' : ''}${data.board || ''}`)],
    ['Enrolled Batch', `<strong>${e(data.batchName || data.subjects || 'Focus Evening Batch')}</strong>`],
    ['Session Timing', e(data.batchTiming || data.timing || 'Evening Session (4:00 PM – 8:30 PM)')],
    ['Classroom Ratio', '1:12 Strict Faculty Supervision Capped'],
    ['Parent / Contact', `${e(data.parentName || 'Parent')}${data.contact || data.phone ? ` (${e(data.contact || data.phone)})` : ''}`],
    ['Admission Status', e(String(data.admissionStatus || data.status || 'pending review').replace('_', ' ').toUpperCase())],
    ['Center Location', 'Thiripura Complex, Main Road, Thoramangalam, Perambalur — 621220']
  ];
  const body = `
    <div style="max-width: 650px; margin: 0 auto; text-align: right; margin-bottom: 12px;">
      <button onclick="window.print()" style="padding: 8px 18px; background: #C2410C; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Print / Save as PDF</button>
    </div>
    <div class="slip">
      <h1>FOCUS ACADEMY</h1>
      <div class="badge">OFFICIAL ADMISSION SLIP (SESSION 2025–2026)</div>
      <div>Thiripura Complex, Main Road, Thoramangalam, Perambalur — 621220 • Desk: +91 98424 51220</div>
      <table>
        ${rows.map(([label, value]) => `<tr><th>${e(label)}</th><td>${value}</td></tr>`).join('')}
      </table>
      <div class="footer">
        Please present this slip at Thiripura Complex reception for textbook workbook issuance.
      </div>
    </div>`;
  return documentShell('Official Admission Slip - Focus Academy', SLIP_STYLE, body);
};

export const buildReportCardHtml = (data = {}) => {
  const tests = Array.isArray(data.tests) ? data.tests : [];
  const testRows = tests.map((t) => `
    <tr>
      <td>${e(t.date || '')}</td>
      <td><strong>${e(t.title || '')}</strong></td>
      <td>${e(t.subject || '')}</td>
      <td style="text-align: right;"><strong>${e(t.score || 0)} / ${e(t.max || 0)}</strong></td>
      <td style="text-align: right; color: #C2410C; font-weight: bold;">${e(t.percentage || 0)}%</td>
      <td>${e(t.remarks || 'Satisfactory')}</td>
    </tr>
  `).join('');

  const body = `
    <div style="max-width: 700px; margin: 0 auto; text-align: right; margin-bottom: 12px;">
      <button onclick="window.print()" style="padding: 8px 18px; background: #C2410C; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Print / Save as PDF</button>
    </div>
    <div class="slip" style="max-width: 700px; border-color: #0F172A;">
      <h1 style="color: #0F172A;">FOCUS ACADEMY</h1>
      <div class="badge" style="background: #0F172A;">ACADEMIC PROGRESS REPORT & SCORECARD</div>
      <div style="font-size: 12px; color: #64748B; margin-bottom: 16px;">
        Thiripura Complex, Thoramangalam, Perambalur — 621220 • Official Student Performance Record
      </div>
      <table style="margin-bottom: 20px;">
        <tr>
          <th>Student Name</th><td><strong>${e(data.studentName || '')}</strong></td>
          <th>Student ID</th><td><code style="font-weight: bold; color: #C2410C;">${e(data.studentId || '')}</code></td>
        </tr>
        <tr>
          <th>Class & Board</th><td>${e(data.grade || '')} (${e(data.board || '')})</td>
          <th>Overall Attendance</th><td><strong>${e(data.attendanceRate || '96%')}</strong> (Active Regular)</td>
        </tr>
        <tr>
          <th>Cumulative Average</th><td colspan="3"><strong style="color: #15803D; font-size: 15px;">${e(data.cumulativeAvg || '89.4%')}</strong> — Grade A1 Distinction</td>
        </tr>
      </table>
      <div style="font-size: 13px; font-weight: bold; color: #0F172A; margin: 16px 0 8px 0;">Unit Assessments & Model Exam Ledger</div>
      <table>
        <thead>
          <tr style="background: #F8FAFC;">
            <th>Date</th>
            <th>Examination / Unit</th>
            <th>Subject</th>
            <th style="text-align: right;">Score</th>
            <th style="text-align: right;">%</th>
            <th>Faculty Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${testRows}
        </tbody>
      </table>
      <div class="footer" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 15px;">
        <div style="text-align: left;">
          <div>Focus Academy Evaluation Desk</div>
          <small>Verified by Subject Faculty Leads</small>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; color: #0F172A;">Academic Director Signoff</div>
          <small>Thoramangalam Campus, Perambalur</small>
        </div>
      </div>
    </div>
  `;
  return documentShell(`Report Card - ${e(data.studentName || 'Student')}`, SLIP_STYLE, body);
};

export const buildStudySheetHtml = (sheet = {}) => {
  const body = `
    <div style="max-width: 700px; margin: 0 auto; text-align: right; margin-bottom: 12px;">
      <button onclick="window.print()" style="padding: 8px 18px; background: #C2410C; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Print / Save as PDF</button>
    </div>
    <div class="receipt" style="max-width: 700px;">
      <h1>FOCUS ACADEMY</h1>
      <div class="meta">EXAM BLUEPRINT & REVISION MASTER SHEET • ${e(sheet.subject || 'All Subjects')}</div>
      <h2 style="font-size: 18px; color: #0F172A; margin-top: 0;">${e(sheet.title || 'Revision Sheet')}</h2>
      <div style="font-size: 12px; color: #64748B; margin-bottom: 15px;">
        Applicable: <strong>${e(sheet.grade || 'Classes 10–12')}</strong> • Thoramangalam Academic Desk
      </div>
      <div style="background: #FFF7ED; border-left: 4px solid #EA580C; padding: 12px; font-size: 13px; line-height: 1.6; color: #9A3412; margin-bottom: 20px;">
        ${e(sheet.summary || '')}
      </div>
      <div style="font-size: 14px; font-weight: bold; color: #0F172A; margin-bottom: 8px;">Key Formulations & Core Principles</div>
      <ul style="font-size: 13px; line-height: 1.8; color: #334155; padding-left: 20px;">
        ${(sheet.points || []).map((p) => `<li>${e(p)}</li>`).join('')}
      </ul>
      <div class="footer">Focus Academy Academic Department • Thiripura Complex, Thoramangalam, Perambalur.</div>
    </div>
  `;
  return documentShell(sheet.title || 'Focus Academy Study Blueprint', RECEIPT_STYLE, body);
};

export const openPrintableDocument = (html) => {
  try {
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      return true;
    }
  } catch {
  }
  try {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  } catch {
    return false;
  }
};
