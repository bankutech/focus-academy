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
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0F172A; background: #fff; }
  .receipt { border: 2px solid #0F172A; padding: 30px; max-width: 620px; margin: 0 auto; background: #fff; }
  h1 { margin: 0 0 5px 0; color: #C2410C; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .meta { color: #334155; font-size: 12px; margin-bottom: 20px; line-height: 1.5; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #CBD5E1; padding: 9px 12px; font-size: 13px; text-align: left; }
  th { background: #F8FAFC; color: #0F172A; font-weight: 700; }
  .gst-table { width: 100%; border-collapse: collapse; margin: 16px 0 24px 0; }
  .gst-table th { background: #F1F5F9; color: #0F172A; border: 1px solid #94A3B8; padding: 8px 10px; font-size: 12px; text-transform: uppercase; }
  .gst-table td { border: 1px solid #CBD5E1; padding: 8px 10px; font-size: 12px; }
  .footer { margin-top: 24px; font-size: 11px; color: #334155; border-top: 1px solid #CBD5E1; padding-top: 10px; line-height: 1.5; }
  @media print {
    body { padding: 0 !important; color: #000000 !important; background: #ffffff !important; }
    .receipt { border: 2px solid #000000 !important; max-width: 100% !important; padding: 20px !important; color: #000000 !important; }
    h1 { color: #000000 !important; }
    .meta, .footer { color: #000000 !important; font-weight: 600 !important; border-color: #000000 !important; }
    th, td { border-color: #000000 !important; color: #000000 !important; }
    th { background: #e2e8f0 !important; }
    button { display: none !important; }
  }
`;

const SLIP_STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0F172A; background: #fff; }
  .slip { border: 2px solid #C2410C; padding: 30px; max-width: 650px; margin: 0 auto; background: #fff; }
  h1 { margin: 0 0 5px 0; color: #C2410C; font-size: 26px; font-weight: 800; }
  .badge { background: #C2410C; color: #ffffff; padding: 4px 10px; font-size: 11px; font-weight: 800; border-radius: 4px; display: inline-block; margin-bottom: 15px; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { border: 1px solid #CBD5E1; padding: 10px; font-size: 13px; text-align: left; }
  th { background: #F8FAFC; width: 40%; color: #0F172A; font-weight: 700; }
  .footer { margin-top: 30px; font-size: 11px; color: #334155; border-top: 1px solid #CBD5E1; padding-top: 10px; text-align: center; font-weight: 500; }
  @media print {
    body { padding: 0 !important; color: #000000 !important; background: #ffffff !important; }
    .slip { border: 2px solid #000000 !important; max-width: 100% !important; padding: 20px !important; color: #000000 !important; }
    h1 { color: #000000 !important; }
    .badge { background: #000000 !important; color: #ffffff !important; border: 1px solid #000000 !important; }
    th, td { border-color: #000000 !important; color: #000000 !important; }
    th { background: #e2e8f0 !important; }
    .footer { color: #000000 !important; font-weight: 600 !important; border-color: #000000 !important; }
    button { display: none !important; }
  }
`;

const documentShell = (title, style, body) =>
  `<!DOCTYPE html><html>
    <head><meta charset="utf-8"><title>${e(title)}</title><style>${style}</style></head>
    <body>${body}<script>window.print();</script></body>
  </html>`;

export const buildReceiptHtml = (payment = {}, fallbacks = {}) => {
  const status = payment.isReversed || payment.reversed
    ? 'REVERSED — NOT COUNTED AS A COLLECTION'
    : 'VERIFIED &amp; CREDITED TO ACADEMY LEDGER';

  const totalAmount = Number(payment.amount || 0);
  const taxableBase = Math.round((totalAmount / 1.18) * 100) / 100;
  const cgstAmount = Math.round((taxableBase * 0.09) * 100) / 100;
  const sgstAmount = Math.round((totalAmount - taxableBase - cgstAmount) * 100) / 100;

  const rows = [
    ['Receipt No', `<strong>${e(payment.receiptNumber || '')}</strong>`],
    ['Student Name', e(payment.studentName || fallbacks.studentName || '')],
    ['Student ID', e(payment.studentId || fallbacks.studentId || 'Pending assignment')],
    ['Date of Payment', e(payment.paymentDate || '')],
    ['Payment Mode', `<span style="text-transform: capitalize;">${e(String(payment.paymentMethod || '').replace('_', ' '))}</span>`],
    ['Transaction Ref', e(payment.referenceNumber || payment.id || '')],
    ['Payment Status', status],
    ['Center GSTIN', '<strong>33AAACB2234P1Z2</strong>']
  ];

  const body = `
    <div style="max-width: 620px; margin: 0 auto; text-align: right; margin-bottom: 12px;">
      <button onclick="window.print()" style="padding: 8px 18px; background: #C2410C; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Print / Save as PDF</button>
    </div>
    <div class="receipt">
      <h1>FOCUS ACADEMY</h1>
      <div class="meta">Thiripura Complex, Main Road (via Four Roads), Thoramangalam, Perambalur — 621220<br>Desk: +91 98424 51220 • GSTIN: 33AAACB2234P1Z2 • Official Tax Invoice &amp; Fee Receipt</div>
      <table>
        ${rows.map(([label, value]) => `<tr><th>${e(label)}</th><td>${value}</td></tr>`).join('')}
      </table>

      <h3 style="font-size: 13px; font-weight: 800; color: #0F172A; margin: 16px 0 6px 0; text-transform: uppercase;">GST Tax Invoice Itemization</h3>
      <table class="gst-table">
        <thead>
          <tr>
            <th>Description of Services</th>
            <th style="text-align: right;">Rate / HSN</th>
            <th style="text-align: right;">Taxable Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Coaching &amp; Tuition Services (Classes 6–12)</td>
            <td style="text-align: right;">SAC 999293</td>
            <td style="text-align: right;"><strong>${amount(taxableBase)}</strong></td>
          </tr>
          <tr>
            <td>Central GST (CGST)</td>
            <td style="text-align: right;">9.0%</td>
            <td style="text-align: right;">${amount(cgstAmount)}</td>
          </tr>
          <tr>
            <td>State GST (SGST)</td>
            <td style="text-align: right;">9.0%</td>
            <td style="text-align: right;">${amount(sgstAmount)}</td>
          </tr>
          <tr style="background: #F8FAFC; font-weight: bold; font-size: 13px;">
            <td colspan="2">Net Total Amount Collected (Inclusive of 18% GST)</td>
            <td style="text-align: right; color: #0F172A; font-size: 14px;"><strong>${amount(totalAmount)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="footer">Computer generated official tax receipt issued by Focus Academy Finance Desk. Verified &amp; recorded in central database under Tamil Nadu Coaching Regulation Norms.</div>
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
