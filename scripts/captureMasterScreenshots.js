import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '../e2e/screenshots');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  console.log('Launching browser to capture master quality screenshots...');
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('1. Capturing Desktop Home...');
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '01-desktop-home.png') });

  console.log('2. Capturing Student Login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('#login-email', { timeout: 4000 });
  await page.fill('#login-email', 'FA-THORA-00418');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '02-desktop-student-login.png') });

  console.log('3. Capturing Student Register...');
  await page.goto('http://localhost:5173/student-register');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '03-desktop-student-register.png') });

  console.log('4. Capturing Step 1 Student Details...');
  await page.goto('http://localhost:5173/student-details');
  await page.waitForTimeout(400);
  await page.fill('#signup-student-name', 'Kavitha Sundaram');
  await page.fill('#signup-phone', '9443182910');
  const class12Btn = page.getByRole('button', { name: 'Class 12' });
  if (await class12Btn.count() > 0) await class12Btn.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '04-desktop-step1-student-details.png') });

  console.log('5. Capturing Step 2 Exam Prep...');
  const continueBtn = page.getByRole('button', { name: /Continue to Exam Preparation/i });
  if (await continueBtn.count() > 0) {
    await continueBtn.click();
  } else {
    await page.goto('http://localhost:5173/exam-prep');
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '05-desktop-step2-exam-prep.png') });

  console.log('6. Capturing Step 3 Batches (with centered batch cards)...');
  const viewBatchesBtn = page.getByRole('button', { name: /View Available Batches/i });
  if (await viewBatchesBtn.count() > 0) {
    await viewBatchesBtn.click();
  } else {
    await page.goto('http://localhost:5173/batches');
  }
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollBy(0, 320));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '06-desktop-step3-batches.png') });

  console.log('7. Capturing Step 4 Batch Details (with classroom profile & reservation)...');
  const selectBatchBtn = page.locator('a:has-text("Select This Batch"), button:has-text("Select This Batch"), a[href*="/batch/"]').first();
  if (await selectBatchBtn.count() > 0) {
    await selectBatchBtn.click();
  } else {
    await page.goto('http://localhost:5173/batch/batch-12-science');
  }
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 120));
  await page.screenshot({ path: path.join(outDir, '07-desktop-step4-batch-detail.png') });

  console.log('8. Capturing Student Dashboard (My Batches & Classroom)...');
  const demoStudentData = {
    id: 'STU-2025-0418',
    studentId: 'STU-2025-0418',
    studentName: 'Kavitha Sundaram',
    email: 'kavitha.sundaram@focusacademy.in',
    grade: 'Class 12',
    board: 'TN State Board (Samacheer)',
    mobile: '94431 82910',
    parentName: 'Sundaram RM',
    parentPhone: '94431 82910',
    enrolledBatch: 'Class 12 Pure Science Super-12',
    batchTiming: '05:30 PM - 08:30 PM (Evening Session)',
    doubts: [
      {
        id: 'dbt-101',
        subject: 'Physics',
        topic: 'Electrostatics & Dipole Fields',
        question: 'Can you verify the derivation for electric field on the equatorial axis of a dipole?',
        submittedAt: '24 Oct 2025, 08:30 PM',
        status: 'resolved',
        resolution: 'Resolved during Tuesday Doubt Clinic: Vector components along y-axis cancel, components along x-axis add to p/(4πε₀r³).',
        resolvedAt: '25 Oct 2025, 05:30 PM',
        teacher: 'Er. Sundararajan (Physics Mentor)'
      }
    ]
  };

  await page.evaluate((data) => {
    localStorage.setItem('focus_demo_student', JSON.stringify(data));
  }, demoStudentData);

  await page.goto('http://localhost:5173/student-dashboard');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '08-desktop-student-dashboard.png') });

  console.log('9. Capturing Student Dashboard - Doubts Desk tab...');
  const doubtsTab = page.locator('button:has-text("Ask Tutors")');
  if (await doubtsTab.count() > 0) {
    await doubtsTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '09-desktop-student-doubts.png') });
  }

  console.log('9b. Capturing Student Dashboard - Academics tab...');
  const academicsTab = page.locator('button:has-text("Test Marks")');
  if (await academicsTab.count() > 0) {
    await academicsTab.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '09b-desktop-student-academics.png') });
  }

  console.log('10. Capturing Admin Dashboard...');
  const demoAdminData = {
    email: 'admin@focusacademyperambalur.com',
    displayName: 'Director of Academics',
    isAdmin: true
  };
  await page.evaluate((data) => {
    localStorage.setItem('focus_demo_admin', JSON.stringify(data));
  }, demoAdminData);

  await page.goto('http://localhost:5173/admin-portal');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '10-desktop-admin-dashboard.png') });

  console.log('11. Capturing Admin Students Roster & Lifecycle...');
  await page.goto('http://localhost:5173/admin-portal/students');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, '11-desktop-admin-students.png') });

  console.log('12. Capturing Courses Page...');
  await page.goto('http://localhost:5173/courses');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '12-desktop-courses.png') });

  console.log('13. Capturing Fees Page...');
  await page.goto('http://localhost:5173/fees');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '13-desktop-fees.png') });

  console.log('14. Capturing Contact & Campus Location...');
  await page.goto('http://localhost:5173/contact');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '14-desktop-contact.png') });

  console.log('15. Capturing Admin Login Split-Screen...');
  await page.goto('http://localhost:5173/admin-portal/login');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '15-desktop-admin-login.png') });

  console.log('16. Capturing Privacy Policy...');
  await page.goto('http://localhost:5173/privacy');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '16-desktop-privacy.png') });

  console.log('17. Capturing Mobile Responsive Views (375x667)...');
  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '17-mobile-home.png') });

  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '18-mobile-student-login.png') });

  await page.goto('http://localhost:5173/student-details');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '19-mobile-step1-details.png') });

  await page.goto('http://localhost:5173/batches');
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollBy(0, 180));
  await page.screenshot({ path: path.join(outDir, '20-mobile-batches.png') });

  console.log('18. Capturing Official Printable Documents...');
  const { buildReceiptHtml, buildAdmissionSlipHtml, buildReportCardHtml } = await import('../src/utils/printableDocuments.js');

  await page.setViewportSize({ width: 850, height: 750 });

  const slipHtml = buildAdmissionSlipHtml({
    admissionId: 'ADM-2025-019',
    studentName: 'Kavitha Sundaram',
    studentId: 'STU-2025-0418',
    grade: 'Class 12',
    board: 'TN State Board (Samacheer)',
    batchName: 'Class 12 Pure Science Super-12',
    batchTiming: '05:30 PM - 08:30 PM (Evening Session)',
    parentName: 'Sundaram RM',
    contact: '94431 82910',
    admissionStatus: 'Confirmed & Seated'
  });
  await page.setContent(slipHtml.replace('window.print();', ''));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, '21-printable-admission-slip.png') });

  const receiptHtml = buildReceiptHtml({
    receiptNumber: 'REC-2025-0842',
    studentName: 'Kavitha Sundaram',
    studentId: 'STU-2025-0418',
    paymentDate: '24 Oct 2025',
    amount: 14500,
    paymentMethod: 'UPI / GPay',
    referenceNumber: 'UPI/329482910482',
    status: 'VERIFIED & CREDITED'
  });
  await page.setContent(receiptHtml.replace('window.print();', ''));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, '22-printable-fee-receipt.png') });

  const reportHtml = buildReportCardHtml({
    studentName: 'Kavitha Sundaram',
    studentId: 'STU-2025-0418',
    grade: 'Class 12',
    board: 'TN State Board',
    attendanceRate: '98.2%',
    cumulativeAvg: '94.5%',
    tests: [
      { date: '12 Oct 2025', title: 'Unit Test 1 - Electrostatics & Current', subject: 'Physics', score: 48, max: 50, percentage: 96, remarks: 'Excellent derivation rigor and problem setup.' },
      { date: '18 Oct 2025', title: 'Unit Test 2 - Coordination Compounds', subject: 'Chemistry', score: 46, max: 50, percentage: 92, remarks: 'Good grasp of IUPAC nomenclature and ligand field.' },
      { date: '25 Oct 2025', title: 'Mid-Term Revision - Calculus & Vectors', subject: 'Mathematics', score: 96, max: 100, percentage: 96, remarks: 'Outstanding step clarity and neat graphing.' }
    ]
  });
  await page.setContent(reportHtml.replace('window.print();', ''));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, '23-printable-report-card.png') });

  await browser.close();
  console.log('SUCCESS! All 23 master quality screenshots captured!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
