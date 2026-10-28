import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getBase64Image(filename) {
  const fullPath = path.resolve(__dirname, '../e2e/screenshots', filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`Warning: Screenshot file not found: ${fullPath}`);
    return '';
  }
  const ext = path.extname(filename).replace('.', '');
  const base64 = fs.readFileSync(fullPath).toString('base64');
  return `data:image/${ext};base64,${base64}`;
}

async function generateExecutivePdf() {
  console.log('Loading high-resolution screenshot assets from e2e/screenshots/...');

  const img01 = getBase64Image('01-desktop-home.png');
  const img02 = getBase64Image('02-desktop-student-login.png');
  const img03 = getBase64Image('03-desktop-student-register.png');
  const img04 = getBase64Image('04-desktop-step1-student-details.png');
  const img05 = getBase64Image('05-desktop-step2-exam-prep.png');
  const img06 = getBase64Image('06-desktop-step3-batches.png');
  const img07 = getBase64Image('07-desktop-step4-batch-detail.png');
  const img08 = getBase64Image('08-desktop-dashboard-protected-redirect.png');
  const img09 = getBase64Image('09-mobile-student-login.png');
  const img10 = getBase64Image('10-mobile-student-register.png');
  const img11 = getBase64Image('11-mobile-step1-details.png');
  const img12 = getBase64Image('12-desktop-courses.png');
  const img13 = getBase64Image('13-desktop-fees.png');
  const img14 = getBase64Image('14-desktop-contact.png');
  const img15 = getBase64Image('15-desktop-admin-login.png');
  const img16 = getBase64Image('16-desktop-privacy.png');
  const img17 = getBase64Image('17-mobile-batches.png');
  const img18 = getBase64Image('18-mobile-contact.png');
  const img19 = getBase64Image('19-printable-admission-slip.png');
  const img20 = getBase64Image('20-printable-fee-receipt.png');
  const img21 = getBase64Image('21-printable-report-card.png');

  console.log('Assembling publication-grade HTML specification with embedded visual plates...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Focus Academy - Platform Architecture, Full-Stack Operations & Workflow Specification</title>
<style>
  @page {
    size: A4 portrait;
    margin: 14mm 14mm 14mm 14mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Times New Roman', Times, 'Liberation Serif', Georgia, serif;
    color: #111111;
    background: #ffffff;
    font-size: 9pt;
    line-height: 1.35;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 100%;
    height: 268mm;
    max-height: 268mm;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .page:last-child {
    page-break-after: auto;
  }

  .content-area {
    flex-grow: 1;
    overflow: hidden;
  }

  .page-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #555555;
    padding-top: 5px;
    border-top: 0.5px solid #cccccc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }

  .doc-title-block {
    text-align: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid #000000;
  }

  .doc-main-title {
    font-size: 18pt;
    font-weight: bold;
    letter-spacing: -0.3px;
    line-height: 1.2;
    margin-bottom: 3px;
    color: #0f172a;
  }

  .doc-sub-title {
    font-size: 10.5pt;
    font-weight: bold;
    margin-bottom: 4px;
    color: #c2410c;
  }

  .doc-blueprint-meta {
    font-size: 8pt;
    font-weight: bold;
    color: #111111;
    margin-bottom: 2px;
    line-height: 1.3;
  }

  .doc-signoff-meta {
    font-size: 7.8pt;
    font-style: italic;
    color: #475569;
  }

  h1.sec-heading {
    font-size: 11.5pt;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 5px;
    color: #0f172a;
    line-height: 1.2;
    border-bottom: 0.75px solid #333333;
    padding-bottom: 2px;
  }

  h2.sub-sec-heading {
    font-size: 9.8pt;
    font-weight: bold;
    margin-top: 7px;
    margin-bottom: 3px;
    color: #111111;
  }

  p {
    margin-bottom: 5px;
    text-align: justify;
    text-justify: inter-word;
  }

  ol.num-list, ul.bullet-list {
    margin-left: 16px;
    margin-bottom: 6px;
  }

  ol.num-list li, ul.bullet-list li {
    margin-bottom: 3px;
    text-align: justify;
  }

  .ascii-diagram {
    font-family: 'Courier New', Courier, monospace;
    font-size: 6.3pt;
    line-height: 1.1;
    background: #ffffff;
    color: #000000;
    padding: 4px 0;
    white-space: pre;
    overflow: hidden;
    margin: 5px 0 7px 0;
    border: 0.5px solid #cbd5e1;
  }

  .code-block {
    font-family: 'Courier New', Courier, monospace;
    font-size: 7.2pt;
    line-height: 1.18;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    padding: 5px 8px;
    white-space: pre;
    margin: 5px 0 7px 0;
  }

  .spec-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.6pt;
    margin: 6px 0 8px 0;
    border-top: 1.5px solid #000000;
    border-bottom: 1.5px solid #000000;
  }

  .spec-table th {
    font-weight: bold;
    text-align: left;
    padding: 4px 5px;
    border-bottom: 1px solid #000000;
    background: #f1f5f9;
    vertical-align: top;
  }

  .spec-table td {
    padding: 3.5px 5px;
    border-bottom: 0.5px solid #e2e8f0;
    vertical-align: top;
    text-align: justify;
  }

  .spec-table tr:last-child td {
    border-bottom: none;
  }

  .formula-box {
    text-align: center;
    font-family: 'Times New Roman', Times, serif;
    font-style: italic;
    font-size: 9pt;
    padding: 4px 0;
    margin: 4px 0 6px 0;
    background: #fdfdfd;
    border: 0.5px solid #e2e8f0;
  }

  .callout-quote {
    border-left: 3px solid #ea580c;
    background: #fffbf9;
    padding: 5px 9px;
    margin: 5px 0 7px 0;
    font-style: italic;
    color: #1e293b;
    font-size: 8.5pt;
  }

  .doc-end-marker {
    text-align: center;
    font-style: italic;
    font-size: 8pt;
    margin-top: 12px;
    color: #64748b;
  }

  /* Visual Screenshot Plates Styles */
  .plate-header {
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1.5px solid #0f172a;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .plate-title {
    font-size: 13pt;
    font-weight: bold;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .plate-subtitle {
    font-size: 8.2pt;
    color: #c2410c;
    font-weight: bold;
  }

  .plate-meta {
    font-size: 7.5pt;
    color: #64748b;
    font-style: italic;
  }

  .figure-card {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 4px;
    padding: 6px;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .figure-img-wrap {
    width: 100%;
    background: #0f172a;
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .figure-img {
    width: 100%;
    height: auto;
    max-height: 94mm;
    object-fit: contain;
    display: block;
  }

  .figure-caption-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 5px;
    padding-top: 4px;
    border-top: 0.5px solid #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  }

  .figure-caption-title {
    font-size: 8.2pt;
    font-weight: bold;
    color: #0f172a;
  }

  .figure-caption-tag {
    font-size: 6.8pt;
    background: #ea580c;
    color: #ffffff;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: bold;
    letter-spacing: 0.3px;
  }

  .figure-caption-desc {
    font-size: 7.3pt;
    color: #475569;
    margin-top: 2px;
    line-height: 1.25;
    text-align: justify;
  }

  /* Multi-column grid for mobile screens */
  .mobile-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .mobile-card {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 4px;
    padding: 5px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }

  .mobile-img-wrap {
    width: 100%;
    background: #0f172a;
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .mobile-img {
    width: 100%;
    height: 98mm;
    object-fit: cover;
    object-position: top;
    display: block;
  }

  /* Printable docs 3-column grid */
  .printable-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 8px;
  }

  .printable-card {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    border-radius: 4px;
    padding: 5px;
  }

  .printable-img {
    width: 100%;
    height: 82mm;
    object-fit: contain;
    background: #f8fafc;
    border: 0.5px solid #e2e8f0;
    display: block;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1: EXECUTIVE SUMMARY ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="doc-title-block">
        <div class="doc-main-title">Focus Academy Thoramangalam</div>
        <div class="doc-sub-title">Small-Batch Tutoring (1:12 Capped), Dual-Role Digital Architecture & Operations Specification</div>
        <div class="doc-blueprint-meta">Production Baseline: 5-Step Admission Funnel, Secured Student Portal, Doubts Resolution Desk, Academic Assessment Ledger, Double-Entry Financial Journal & Vercel Edge Deployment</div>
        <div class="doc-signoff-meta">Certified Engineering Specification & Audit Sign-Off | Thiripura Complex, Thoramangalam, Perambalur, Tamil Nadu &ndash; 621220</div>
      </div>

      <h1 class="sec-heading">1 Executive Summary & Dual-Portal Product Architecture</h1>
      <p>
        Commercial coaching centers across semi-urban educational hubs frequently suffer from chronic classroom overcrowding (often packing 45 to 60 students into single lecture halls), generic rote-learning curricula, uncoordinated public transit timetables, and unverified manual paper administration. Under these commercial tuition dynamics, struggling students hesitate to ask questions, homework notebook checking is delegated or skipped, and parents receive no transparent diagnostic feedback until high-stakes board examinations conclude.
      </p>
      <p>
        <strong>Focus Academy (ஃபோகஸ் அகாடமி)</strong> establishes an institutional academic coaching platform engineered explicitly for the community of <strong>Thoramangalam, Perambalur</strong> (1st & 2nd Floors, Thiripura Complex, adjacent to Four Roads Junction and Trichy Main Road). The platform couples an uncompromising <strong>1:12 faculty-to-student batch cap</strong> with two unified software engines:
      </p>
      <ul class="bullet-list">
        <li><strong>Public 5-Step Sequential Admission Funnel:</strong> A cryptographically guarded, monotonic student onboarding funnel ($1 \to 5$) enforcing real-time batch seat reservations, dynamic sibling fee calculations, and bus-synchronized evening timetables.</li>
        <li><strong>Dedicated Student Portal (<code>/student-dashboard</code>):</strong> A secured student gateway providing real-time batch schedules, an interactive Doubts Resolution Desk with subject categorization and faculty feedback, a unit-test assessment ledger, downloadable official tax receipts, and PWA offline access.</li>
        <li><strong>Administrative Operations Suite (<code>/admin/*</code>):</strong> A secured operational console featuring split-screen multi-mode authentication, live campus telemetry, batch quota guards, full student lifecycle state transitions, a double-entry financial ledger, templated WhatsApp due reminders, and an immutable cryptographic audit log.</li>
      </ul>

      <h2 class="sub-sec-heading">1.1 Core Non-Negotiable System Invariants</h2>
      <ol class="num-list">
        <li><strong>Strict Ascending Funnel Enforcement:</strong> The admission journey is a strictly monotonic sequence ($1 \to 2 \to 3 \to 4 \to 5$). Direct browser navigation to downstream routes (e.g., Step 4 Batch Profile or Step 5 Enrollment) is intercepted synchronously during the initial render phase and redirected to Step 1 with clear contextual feedback without layout flashing.</li>
        <li><strong>Cryptographic Session Token Verification:</strong> Client-side storage is non-authoritative. Each milestone completion is bound to an HMAC-SHA256 digital signature minted by the serverless session layer. Manual modification of client-side step values immediately fails verification and resets state safely.</li>
        <li><strong>Uncompromising 1:12 Classroom Capacity Guard:</strong> Every physical batch is hard-capped at 12 desks. The batch engine tracks reservations and enrollments in real time, locking out oversubscription while gracefully falling back to deterministic static catalogs during network partitioning.</li>
        <li><strong>Dual-Gate Administrative Security:</strong> Access to the administrative console requires both valid Firebase Authentication (Google OAuth or Email/Password) and strict verification against an institutional administrator allowlist (e.g., <code>admin@focusacademyperambalur.com</code>, <code>sagnikmitra1302@gmail.com</code>).</li>
        <li><strong>Authentic Zero-Fake-Data Architecture:</strong> The user interface strictly eliminates artificial placeholder testimonials, fake counters, and generic AI template marketing. Headings lead with concrete institutional subjects, preserving authentic bilingual campus identity (<code>ஃபோகஸ் அகாடமி • Focus Academy, Thoramangalam, Perambalur</code>).</li>
        <li><strong>Digital Personal Data Protection (DPDP) Compliance:</strong> Student personal records, guardian telephone numbers, and academic marks are handled under strict purpose limitation with parent consent, encryption in transit (TLS 1.3), and zero third-party advertising cookies.</li>
      </ol>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 1 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 2: ARCHITECTURAL TOPOGRAPHY ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">2 Architectural Topography & System Boundaries</h1>
      <p>
        The platform operates on a reactive single-page architecture built with React 19, React Router 7, and Tailwind CSS v4, deployed globally on the Vercel Edge Network and integrated with Cloud Firestore, Firebase Authentication, and a Progressive Web App (PWA) service worker layer.
      </p>

      <h2 class="sub-sec-heading">2.1 System Topography & Component Interconnect Diagram</h2>
      <div class="ascii-diagram">
+--------------------------------------------------------------------------------------------------------------------------------+
| PRESENTATION LAYER (React 19 + React Router 7 + Tailwind CSS v4 on Vercel Global Edge & PWA Service Worker)                   |
| [PUBLIC ADMISSION FUNNEL]:              [STUDENT PORTAL (/login & /student-dashboard)]:   [ADMIN OPERATIONS SUITE (/admin/*)]: |
|  - Step 1: Student Details (/student-details)  - Multi-tab Dashboard (Schedule, Batches)      - Split-Screen Gateway (/admin/login)  |
|  - Step 2: Exam Goal (/exam-prep)       - Academic Ledger (Unit Tests & Marks)         - Campus Telemetry (/admin/dashboard)  |
|  - Step 3: Batches Catalog (/batches)   - Interactive Doubts Desk (Filing & Teacher)   - 12-Seat Scheduler (/admin/batches)   |
|  - Step 4: Batch Detail (/batch/:id)    - Fee Ledger & Downloadable Tax Receipts       - Student Lifecycle (/admin/students)  |
|  - Step 5: Enrollment Confirmation      - Study Material Sheets & Syllabus Guides      - Financial Ledger (/admin/ledger)     |
|  - Public Courses, Fees, Contact, Privacy - DPDP Account & Credential Management        - WhatsApp Reminders & Cryptographic   |
|                                                                                        - Audit Logs (/admin/audit-logs)       |
+-----------------------------------------+----------------------------------------------+--------------------------------------+
                         |                                       |                                       |
     Synchronous Step    |  (Monotonic Guard Algorithm)          | Student Token & Session Verification  | Role & Allowlist Guard
     Render-Time Probe   v                                       v                                       v
+--------------------------------------------------------------------------------------------------------------------------------+
| CLIENT APPLICATION STATE & SECURITY CORE                                                                                       |
|  - AppContext: Monotonic 5-Step Funnel Progression Engine, StudentFlow Store, & Local Persistence Buffer                      |
|  - StudentAuthContext: Firebase Auth Client Binding, Profile Synchronization, Session Token Cache & Error Boundary             |
|  - PrintableDocumentEngine: Zero-Dependency HTML Template Builders (Admission Slip, GSTIN Tax Receipt, Progress Report Card)   |
|  - AdminDataService: Local/Cloud Sync, 12-Seat Capacity Validation, Double-Entry Payment Journal & Audit Dispatch              |
|  - SessionAuthService: HMAC Token Signing, Verification & Tamper Detection Engine                                              |
|  - BatchService: Real-Time Seat Cache, 15-Minute Reservation Locks & Static Failover Catalog                                   |
+------------------------+---------------------------------------+---------------------------------------+-----------------------+
                         |                                       |                                       |
      Signed Step Tokens | Lead Ingestion & Doubt Dispatch       | Student Auth & Profile Queries        | OAuth & Firestore
      & Dynamic Seats    v                                       v                                       v Operations
==================================================================================================================================
MANAGED CLOUD & SERVERLESS BACKEND (Firebase Cloud Services & Vercel Edge Serverless)
+----------------------------------------------------------------+---------------------------------------------------------------+
| FIREBASE AUTHENTICATION (focus-academy-7efeb)                  | CLOUD FIRESTORE NOSQL DATABASE                                |
|  - Google OAuth with Authorized Domain Check                   |  - Collections: students, student_profiles, batches, ledger,  |
|    (focus-academy-virid.vercel.app, localhost)                 |    feeSchedules, auditLogs, doubts, campusSettings            |
|  - Email / Password Identity Management for Students & Staff   |  - Declarative firestore.rules Security Policies              |
|  - Institutional Administrator Allowlist Gate (Strict Domain)  |  - Atomic Batch Commits & Multi-Document Transactions         |
+----------------------------------------------------------------+---------------------------------------------------------------+
| VERCEL SERVERLESS FUNCTIONS (/api/student-portal.js, /api/session.js, /api/batches.js, /api/leads.js)                         |
|  - Student ID Resolution & Auth Linking                         - Cryptographic HMAC-SHA256 Token Minting                      |
|  - Real-time Doubts Submission & Resolution Gateway            - Atomic 15-Min Seat Reservation Leasing & Quota Protection    |
+--------------------------------------------------------------------------------------------------------------------------------+
      </div>

      <h2 class="sub-sec-heading">2.2 Decoupled Route Isolation & Modular Bundle Budgets</h2>
      <p>
        The client codebase leverages route-level lazy loading (<code>React.lazy()</code> and <code>Suspense</code>) across all public views, the student portal, and administrative sub-modules. The production JavaScript bundle compiles via Vite into highly optimized ES modules, maintaining an initial gzipped bundle footprint under 96 kB.
      </p>
      <p>
        The boundary between public admission routing, student private data, and administrative operations is strictly decoupled. Administrative routes are protected by <code>AdminProtectedRoute.jsx</code>, while student dashboard views are secured by <code>StudentProtectedRoute.jsx</code>, ensuring unauthorized visitors cannot access private test scores or firestore data.
      </p>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 2 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 3: FUNNEL PROGRESSION & GUARDS ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">3 Sequential State Machine & Funnel Progression</h1>
      <p>
        The public student registration workflow is modeled as a formal, deterministic finite-state machine where each forward step requires verified completion of all prerequisite milestones. The progression index is strictly monotonic: parents may return to earlier steps to inspect options without forfeiting already-completed milestones unless foundational curriculum attributes (grade or board) are altered.
      </p>

      <h2 class="sub-sec-heading">3.1 Step-by-Step Monotonic Progression</h2>
      <ul class="bullet-list">
        <li><strong>Step 1 &rarr; Step 2 Transition (Identity & Board):</strong> Captures student full name, parent mobile number (validated against strict Indian telecommunications regex), academic grade (Classes 6 through 12), and curriculum board (Tamil Nadu Samacheer Kalvi, CBSE, or ICSE). Mints cryptographic Step 1 token.</li>
        <li><strong>Step 2 &rarr; Step 3 Transition (Goal Setting):</strong> Captures target academic orientation (Board Exam Distinction, Conceptual Fundamentals Clinic, or Advanced Competitive Numericals). Mints Step 2 token and unlocks the evening batch schedule.</li>
        <li><strong>Step 3 &rarr; Step 4 Transition (Batch Selection):</strong> Parent reviews matching batches filtered by grade and curriculum. Selecting a batch records the batch identifier, timetable slot, and monthly tuition rate, issuing Step 3 token.</li>
        <li><strong>Step 4 &rarr; Step 5 Transition (Classroom Profile):</strong> Presents classroom environment, study desk ergonomics, mentor credentials, and timing synchronization with town school buses. Confirming details issues Step 4 token.</li>
        <li><strong>Step 5 Completion (Enrollment & Slip):</strong> Collects guardian contact details, applies automatic multi-child sibling concessions, assigns a unique permanent enrollment identifier (<code>FA-THORA-XXXXXX</code>), and triggers the 3-tier lead ingestion pipeline.</li>
      </ul>

      <h2 class="sub-sec-heading">3.2 Synchronous Render-Time Route Guarding Algorithm</h2>
      <p>
        To prevent visual flashing and navigation artifacts caused by asynchronous <code>useEffect</code> redirects, route guarding executes synchronously during component render:
      </p>
      <div class="code-block">
export function getStepRedirect(targetStep, studentFlow, currentPath = '') {
  if (currentPath === '/courses' || currentPath === '/fees' || currentPath === '/contact') return null;
  const isStep1Done = Boolean(studentFlow?.studentName && studentFlow?.grade && studentFlow?.board);
  const isStep2Done = Boolean(isStep1Done && studentFlow?.examPrep);
  const isStep3Done = Boolean(isStep2Done && studentFlow?.selectedBatchId);

  if (targetStep >= 2 && !isStep1Done) return '/student-details';
  if (targetStep >= 3 && !isStep2Done) return '/exam-prep';
  if (targetStep >= 4 && !isStep3Done) return '/batches';
  if (targetStep >= 5 && (!isStep3Done || !studentFlow?.selectedBatchId)) return '/batches';
  return null;
}
      </div>

      <h2 class="sub-sec-heading">3.3 Canonical Step Token JSON & Cryptographic Signing</h2>
      <p>
        Step milestone tokens are formatted as canonical JSON structures signed with an asymmetric HMAC secret:
      </p>
      <div class="code-block">
{
  "token_id": "tok_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "campus_id": "thoramangalam_perambalur_01",
  "student_name": "Kavitha Sundaram",
  "grade": "Class 12",
  "board": "TN State Board (Samacheer)",
  "verified_step": 4,
  "issued_at": 1774181400000,
  "signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 3 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 4: STUDENT PORTAL & AUTHENTICATION ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">4 Student Authentication & Dedicated Portal Architecture</h1>
      <p>
        Focus Academy features an isolated, student-facing portal (<code>/login</code>, <code>/student-register</code>, <code>/student-dashboard</code>) designed to bridge the daily feedback loop between classroom instruction and home revision.
      </p>

      <h2 class="sub-sec-heading">4.1 Dual-Identifier Login & Student ID Resolution Engine</h2>
      <p>
        Secondary school students in Perambalur frequently access the web through family mobile devices and may not recall a personal email address. The authentication gateway implements an intelligent dual-identifier resolver:
      </p>
      <ul class="bullet-list">
        <li><strong>Standard Email Credentials:</strong> Direct login with registered email (<code>student@example.com</code>) via Firebase Auth.</li>
        <li><strong>Student ID Resolver:</strong> Students may enter their unique institutional enrollment identifier (e.g. <code>FA-THORA-00418</code> or <code>STU-2025-0418</code>). The serverless endpoint (<code>/api/student-portal</code>, action <code>resolve-id</code>) queries Firestore <code>student_profiles</code> and <code>students</code> collections, looks up the associated verified account email, and transparently routes the sign-in attempt.</li>
        <li><strong>Brute-Force & Rate-Limiting Protection:</strong> The serverless resolver enforces an in-memory sliding window rate limiter (maximum 10 resolution queries per IP per minute), protecting against identity enumeration attacks.</li>
      </ul>

      <h2 class="sub-sec-heading">4.2 Student Dashboard Sub-Modules & Data Flow</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 20%;">Dashboard Tab</th>
            <th style="width: 25%;">Underlying Data Source</th>
            <th style="width: 55%;">Student Capabilities & Academic Operations</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>My Batches</strong></td>
            <td>Firestore <code>students</code> / <code>batches</code></td>
            <td>Views enrolled small-batch schedule, allocated classroom room number, mentor credentials, and active seat allocation.</td>
          </tr>
          <tr>
            <td><strong>Academic Ledger</strong></td>
            <td>Firestore <code>student_profiles.tests</code></td>
            <td>Live unit assessment scorecard: date, test title, subject, score obtained vs max marks, percentage badge, and faculty feedback.</td>
          </tr>
          <tr>
            <td><strong>Doubts Desk</strong></td>
            <td>Firestore <code>student_profiles.doubts</code></td>
            <td>Interactive doubt submission engine: subject categorization, question submission, review status badge, and teacher resolution notes.</td>
          </tr>
          <tr>
            <td><strong>Fee Ledger</strong></td>
            <td>Firestore <code>ledger</code> / <code>feeSchedules</code></td>
            <td>Transparent fee ledger, monthly payment history, verified transaction modes, and 1-click printable official tax receipts.</td>
          </tr>
          <tr>
            <td><strong>Study Materials</strong></td>
            <td>Static / Cloud Document Library</td>
            <td>Topic-wise formula sheets, derivation guides, and 10-year question banks for Tamil Nadu Samacheer and CBSE curricula.</td>
          </tr>
          <tr>
            <td><strong>Profile Settings</strong></td>
            <td>Firestore <code>student_profiles</code></td>
            <td>Guardian phone management, contact updates, password reset email trigger, and DPDP privacy settings.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">4.3 Progressive Web App (PWA) Offline Integration</h2>
      <p>
        The student portal is configured as a standalone Progressive Web App (<code>manifest.webmanifest</code> and <code>sw.js</code>). The service worker caches static assets, style sheets, and offline timetable data, allowing students to check their evening batch schedules and review formula guides even during network fluctuations.
      </p>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 4 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 5: ACADEMIC LEDGER & DOUBTS ENGINE ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">5 Academic Performance, Attendance & Doubts Desk Engine</h1>
      <p>
        To ensure no student in Thoramangalam falls behind, the platform replaces manual paper marksheets with an integrated academic performance ledger and an interactive doubt resolution desk.
      </p>

      <h2 class="sub-sec-heading">5.1 1-Click Attendance Roll-Call Engine</h2>
      <p>
        At the commencement of each evening session (4:30 PM, 6:00 PM, 7:30 PM), the mentor or campus admin opens the batch roster in the administrative console. The roll-call engine provides 1-click status toggles:
      </p>
      <div class="formula-box">
        \text{Status} \in \{\text{Present (Green)}, \text{Absent (Red)}, \text{Late (Amber)}\}
      </div>
      <p>
        Attendance is committed atomically to Firestore with timestamp and batch ID. When an absence is recorded, the system flags the student profile and prepares an automated WhatsApp advisory for the parent, ensuring immediate family awareness.
      </p>

      <h2 class="sub-sec-heading">5.2 Unit Test Assessment Scorecard & Progress Tracking</h2>
      <p>
        Weekly Saturday diagnostic assessments and chapter-end unit tests are entered into the centralized academic ledger. Each test record comprises:
      </p>
      <ul class="bullet-list">
        <li><strong>Subject & Examination Title:</strong> E.g., <em>"Physics: Electrostatics & Current Electricity"</em> or <em>"Mathematics: Calculus & Differential Equations"</em>.</li>
        <li><strong>Quantitative Metrics:</strong> Score obtained, maximum marks, and auto-calculated percentage score.</li>
        <li><strong>Faculty Qualitative Remarks:</strong> Concrete mentor observations highlighting procedural rigor, algebraic accuracy, or areas requiring focused re-explanation.</li>
      </ul>

      <h2 class="sub-sec-heading">5.3 Interactive Academic Doubts Resolution Desk</h2>
      <p>
        Students can submit academic questions directly through their student dashboard when revising at home:
      </p>
      <div class="code-block">
// Sample Academic Doubt Schema
{
  "id": "dbt_1774189201482",
  "subject": "Physics",
  "question": "Can you explain the derivation for electric field on the equatorial plane of an electric dipole?",
  "submittedAt": "24 Oct 2025, 08:45 PM",
  "status": "resolved", // "under_review" | "resolved"
  "resolution": "Resolved during Tuesday Doubt Clinic. Note: Verify vector angle cos(theta) cancellation along y-axis.",
  "resolvedAt": "25 Oct 2025, 05:15 PM",
  "teacher": "Er. Sundararajan (Physics Mentor)"
}
      </div>
      <p>
        Tutors review incoming doubts from the administrative modal, formulate step-by-step guidance, and mark the item resolved. The student dashboard updates dynamically, showing status badges and mentor explanations.
      </p>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 5 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 6: ADMINISTRATIVE SUITE ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">6 Administrative Operations Suite (<code>/admin/*</code>)</h1>
      <p>
        Focus Academy features an integrated administrative operating system engineered for desktop and mobile management of campus admissions, batch quotas, student retention, fee collection, and institutional governance.
      </p>

      <h2 class="sub-sec-heading">6.1 Administrative Module Topography & Operational Matrix</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 22%;">Module Route</th>
            <th style="width: 28%;">Primary Operational Function</th>
            <th style="width: 50%;">Key Capabilities & Integrity Controls</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>/admin/dashboard</code></td>
            <td>Campus Telemetry Dashboard</td>
            <td>Real-time KPI metrics: Active Students, 1:12 Batches, Collections, Outstanding balances, and Overdue lists.</td>
          </tr>
          <tr>
            <td><code>/admin/batches</code></td>
            <td>12-Seat Batch Management</td>
            <td>Classroom scheduler, capacity guard enforcement, batch archiving, subject & mentor assignment.</td>
          </tr>
          <tr>
            <td><code>/admin/students</code></td>
            <td>Student Lifecycle & Roster</td>
            <td>5-stage lifecycle state machine, duplicate prevention, attendance tracking, marks entry, and doubts resolution modal.</td>
          </tr>
          <tr>
            <td><code>/admin/fees</code></td>
            <td>Recurring Fee Schedules</td>
            <td>Automated monthly fee generation, grace period tracking, payment obligation status matrix.</td>
          </tr>
          <tr>
            <td><code>/admin/ledger</code></td>
            <td>Double-Entry Financial Journal</td>
            <td>Payment recording (Cash, UPI - GPay/PhonePe, Bank), receipt issuance (<code>REC-XXXXX</code>), void controls.</td>
          </tr>
          <tr>
            <td><code>/admin/reminders</code></td>
            <td>WhatsApp Reminders Engine</td>
            <td>Templated fee notices, phone link dispatch with custom student name, batch, and balance parameters.</td>
          </tr>
          <tr>
            <td><code>/admin/reports</code></td>
            <td>Institutional Analytics</td>
            <td>Monthly revenue trends, batch capacity utilization percentages, overdue aging analysis tables.</td>
          </tr>
          <tr>
            <td><code>/admin/audit-logs</code></td>
            <td>Cryptographic Audit Trail</td>
            <td>Immutable event stream: actor email, timestamp, entity identifier, previous state and diff log.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">6.2 Split-Screen Responsive Ergonomics (Zero Scrollbars)</h2>
      <p>
        The authentication gateway (<code>/admin/login</code>) employs an editorial split-screen architecture: an atmospheric left branding showcase paired with an elevated glassmorphic right authentication form. Using responsive padding scales (<code>py-2.5 sm:py-3.5</code>) and viewport-bounded flexbox layouts, the panel renders with <strong>zero vertical or horizontal scrollbars</strong> across all standard desktop resolutions: 1920&times;1080, 1440&times;900, 1366&times;768, and 1280&times;720, transitioning gracefully to single-column stacking on mobile viewports.
      </p>

      <h2 class="sub-sec-heading">6.3 Dual-Gate Allowlist Security Architecture</h2>
      <p>
        Administrative authentication is enforced through a dual-gate validation architecture:
      </p>
      <ol class="num-list">
        <li><strong>OAuth Domain Authorization:</strong> Requests originating from non-authorized hostnames are blocked at the identity layer with <code>auth/unauthorized-domain</code>. Production domains (<code>focus-academy-virid.vercel.app</code>) and local development hostnames (<code>localhost</code>) are explicitly registered in Firebase Console.</li>
        <li><strong>Institutional Allowlist Security Gate:</strong> Even upon successful Google OAuth identity verification, the application evaluates the user's email against <code>getAdminAllowlist()</code>. Only authorized personnel receive session tokens. Non-allowlisted accounts are rejected immediately with an Access Denied security event.</li>
      </ol>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 6 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 7: FINANCIAL ARCHITECTURE & PRINTABLE DOCS ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">7 Financial Architecture, Sibling Concession & Printable Documents</h1>
      <p>
        The tuition billing model eliminates hidden registration fees, annual maintenance costs, and facility charges. Printed worksheets, past 10-year question banks, Saturday mock examinations, and 1-on-1 doubt clinics are included in the transparent monthly fee.
      </p>

      <h2 class="sub-sec-heading">7.1 Transparent Monthly Fee Engine & Sibling Concession Formula</h2>
      <p>
        When a parent enrolls two or more children simultaneously, the calculation engine applies a 10% concession to the second child's monthly tuition:
      </p>
      <div class="formula-box">
        \text{Total Fee} = \text{Fee}_{\text{Primary}} + \left( \text{Fee}_{\text{Sibling}} \times 0.90 \right)
      </div>

      <h2 class="sub-sec-heading">7.2 Official Printable Documents Suite</h2>
      <p>
        To ensure legal, institutional, and administrative rigor across offline campus operations, the platform includes a zero-dependency printable documents generator (<code>src/utils/printableDocuments.js</code>):
      </p>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 25%;">Document Name</th>
            <th style="width: 30%;">Generator Function</th>
            <th style="width: 45%;">Institutional Purpose & Key Embedded Metadata</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Official Admission Slip</strong></td>
            <td><code>buildAdmissionSlipHtml()</code></td>
            <td>Issued upon trial or confirmed admission; includes Admission Slip ID, student name, assigned batch timing, 1:12 capacity cap seal, and reception check-in instructions.</td>
          </tr>
          <tr>
            <td><strong>Tax & Tuition Fee Receipt</strong></td>
            <td><code>buildReceiptHtml()</code></td>
            <td>Official computer-generated receipt with unique receipt number (<code>REC-XXXX-XXXX</code>), GSTIN <code>33AAACB2234P1Z2</code>, payment mode, transaction reference, and verified ledger credit stamp.</td>
          </tr>
          <tr>
            <td><strong>Academic Progress Report Card</strong></td>
            <td><code>buildReportCardHtml()</code></td>
            <td>Formal student performance record: cumulative percentage score, attendance rate, term rank, unit test score breakdown, and faculty qualitative remarks.</td>
          </tr>
          <tr>
            <td><strong>Subject Revision Study Sheet</strong></td>
            <td><code>buildStudySheetHtml()</code></td>
            <td>Printable topic summary sheet: key formulas, derivation blueprints, and high-frequency board examination questions.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">7.3 Double-Entry Financial Ledger & Receipt Verification</h2>
      <p>
        The administrative ledger (<code>/admin/ledger</code>) functions as a verified audit journal. Every payment entry is stamped with a unique receipt ID, recorded transaction mode (Cash, UPI - GPay/PhonePe, or Direct Bank Transfer), and commits real-time adjustments to student outstanding fee balances.
      </p>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 7 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 8: INVENTORY, TIMINGS & DPDP PRIVACY ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">8 Small-Batch Inventory, Schedule Matrix & DPDP Privacy</h1>
      <p>
        The user interface combines high-density operational utility with clean editorial typography, eliminating generic marketing copy while providing rapid schedule filtering across mobile and desktop devices.
      </p>

      <h2 class="sub-sec-heading">8.1 Small-Batch Inventory & Evening Schedule Matrix</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Grade & Board Track</th>
            <th>Evening Timing</th>
            <th>Days</th>
            <th>Academic Focus & Subjects</th>
            <th>Capacity</th>
            <th>Monthly Fee</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Class 6–8 Foundation (State/CBSE)</td>
            <td>4:30 PM – 6:00 PM</td>
            <td>Mon – Sat</td>
            <td>Maths, Science, English, Tamil Foundations</td>
            <td>12 Seats</td>
            <td>₹1,500</td>
          </tr>
          <tr>
            <td>Class 9 State Board (Samacheer)</td>
            <td>6:00 PM – 7:30 PM</td>
            <td>Mon – Sat</td>
            <td>Mathematics, Science, Step-by-Step Factoring</td>
            <td>12 Seats</td>
            <td>₹1,800</td>
          </tr>
          <tr>
            <td>Class 10 State Board (SSLC Prime)</td>
            <td>6:00 PM – 7:30 PM</td>
            <td>Mon – Sat</td>
            <td>Maths, Science (Physics/Chem/Bio), Blueprint Tests</td>
            <td>12 Seats</td>
            <td>₹2,200</td>
          </tr>
          <tr>
            <td>Class 10 CBSE Board (NCERT)</td>
            <td>7:30 PM – 9:00 PM</td>
            <td>Mon – Sat</td>
            <td>Standard Mathematics, Integrated Science</td>
            <td>12 Seats</td>
            <td>₹2,500</td>
          </tr>
          <tr>
            <td>Class 11 Science & Maths Core</td>
            <td>4:30 PM – 6:00 PM</td>
            <td>Mon – Sat</td>
            <td>Physics, Chemistry, Pure Higher Mathematics</td>
            <td>12 Seats</td>
            <td>₹2,800</td>
          </tr>
          <tr>
            <td>Class 12 State Board (Centum Focus)</td>
            <td>6:00 PM – 7:30 PM</td>
            <td>Mon – Sat</td>
            <td>Physics Derivations, Chemistry, Higher Calculus</td>
            <td>12 Seats</td>
            <td>₹3,200</td>
          </tr>
          <tr>
            <td>Class 12 CBSE & Entrance Foundation</td>
            <td>7:30 PM – 9:00 PM</td>
            <td>Mon – Sat</td>
            <td>Physics, Chemistry, Maths, NEET/JEE Numericals</td>
            <td>12 Seats</td>
            <td>₹3,500</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">8.2 Digital Personal Data Protection (DPDP Act 2023) Compliance</h2>
      <p>
        The platform operates under strict privacy and student data protection standards (<code>/privacy</code>):
      </p>
      <ul class="bullet-list">
        <li><strong>Purpose Limitation:</strong> Student personal data (name, phone, grade, marks) is used exclusively for classroom allocation, attendance roll-call, and academic progress tracking. Data is never sold or shared with commercial lead aggregators.</li>
        <li><strong>Parental Consent & Verification:</strong> All enrollment requests require explicit parental phone verification. Minors cannot register without parental acknowledgment.</li>
        <li><strong>Zero Commercial Trackers:</strong> The application contains zero third-party advertising pixels, Google Tag Manager scripts, or invasive telemetry cookies.</li>
      </ul>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 8 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 9: QUALITY ENGINEERING & TEST SUITES ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">9 Quality Engineering, Test Suite & Campus Operations</h1>
      <p>
        The platform enforces comprehensive engineering standards spanning unit contracts, DOM interaction tests, programmatic accessibility scans, and real-browser cross-platform end-to-end verification.
      </p>

      <h2 class="sub-sec-heading">9.1 17-Suite Automated Vitest Architecture (200+ Tests Passed)</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 32%;">Test Suite File</th>
            <th style="width: 10%;">Tests</th>
            <th style="width: 58%;">Coverage Scope & Assertions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>academicDoubtsAndAuthenticity.test.jsx</code></td>
            <td>18</td>
            <td>Doubts desk submission, teacher resolution, status badges, and authentic zero-fake-data invariants.</td>
          </tr>
          <tr>
            <td><code>studentJourneyAndPortalRouting.test.jsx</code></td>
            <td>15</td>
            <td>Student portal route guards, session binding, identifier resolution, and redirection flows.</td>
          </tr>
          <tr>
            <td><code>studentPortal.test.js</code></td>
            <td>14</td>
            <td>Student portal serverless API contracts, rate-limiting, and student ID lookups.</td>
          </tr>
          <tr>
            <td><code>adminDataService.test.js</code></td>
            <td>31</td>
            <td>12-seat capacity guards, student lifecycle transitions, duplicate prevention, and ledger math.</td>
          </tr>
          <tr>
            <td><code>adminSection19.test.js</code></td>
            <td>35</td>
            <td>Fee schedule automation, receipt generation, grace period calculations, and discount rules.</td>
          </tr>
          <tr>
            <td><code>stepAscendingOrderFlow.test.jsx</code></td>
            <td>18</td>
            <td>Ascending funnel progression ($1 \to 5$), cryptographic token verification, and dynamic seat locks.</td>
          </tr>
          <tr>
            <td><code>navigationAndTriggers.test.js</code></td>
            <td>13</td>
            <td>Security hygiene (<code>noopener noreferrer</code>), phone link protocols, zero comments across source files.</td>
          </tr>
          <tr>
            <td><code>adminPagesAndRouting.test.jsx</code></td>
            <td>12</td>
            <td>Admin route guards, split-screen auth layouts, allowlist checks, and zero-comment rule on App.jsx.</td>
          </tr>
          <tr>
            <td><code>securityAudit.test.js</code></td>
            <td>10</td>
            <td>HMAC tampering rejection, token expiration checks, and state injection resilience.</td>
          </tr>
          <tr>
            <td><code>accessibilityAudit.test.jsx</code></td>
            <td>5</td>
            <td>Programmatic WCAG 2.1 AA audits across Steps 1 through 5 using axe-core; asserts 0 critical violations.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">9.2 Campus Operational Directory & Verification Links</h2>
      <div class="callout-quote">
        <strong>Thoramangalam Campus Address:</strong><br>
        Focus Academy (ஃபோகஸ் அகாடமி), 1st & 2nd Floors, Thiripura Complex, Rajanagar, Thoramangalam,<br>
        Perambalur, Tamil Nadu &ndash; 621220 (Landmarks: Opposite EB Office, near Malar Hospital, 2 mins from Four Roads).<br><br>
        <strong>Academic Hours:</strong> Monday to Saturday: 4:00 PM &ndash; 9:00 PM | Sunday: By Appointment<br>
        <strong>Helpline / Direct Call:</strong> +91 98424 51220 | <strong>Campus Email:</strong> focusacademy.perambalur@gmail.com<br>
        <strong>Live Production Web Portal:</strong> https://focus-academy-virid.vercel.app<br>
        <strong>Administrative Console:</strong> https://focus-academy-virid.vercel.app/admin/login
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 9 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 10: VISUAL PLATE 1 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="plate-header">
        <div>
          <div class="plate-title">Visual Plate 1 &mdash; Public Landing Experience & Campus Showcase</div>
          <div class="plate-subtitle">Desktop Campus Hero & Responsive Navigation</div>
        </div>
        <div class="plate-meta">Figure 1.1 &bull; Resolution: 1280&times;800</div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" src="${img01}" alt="Desktop Home Page">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 1.1: Focus Academy Public Homepage & Thoramangalam Campus Showcase (Route: /)</span>
          <span class="figure-caption-tag">DESKTOP 1280px</span>
        </div>
        <div class="figure-caption-desc">
          Renders the authentic bilingual hero (ஃபோகஸ் அகாடமி • Focus Academy), 1:12 faculty ratio badge, evening class timing schedules, and primary admission funnel CTA button. Clean editorial typography replaces generic AI placeholders.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Visual Specifications &bull; Visual Plate 1</span>
      <span>Production Deployment Capture</span>
      <span>Page 10 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 11: VISUAL PLATE 2 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="plate-header">
        <div>
          <div class="plate-title">Visual Plate 2 &mdash; 5-Step Admission Progression Funnel (Steps 1 & 2)</div>
          <div class="plate-subtitle">Student Details & Exam Preparation Goal Setting</div>
        </div>
        <div class="plate-meta">Figures 2.1 & 2.2 &bull; Desktop Resolution: 1280&times;800</div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 88mm;" src="${img04}" alt="Step 1 Student Details">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 2.1: Step 1 &mdash; Student Identity & Board Selection (Route: /student-details)</span>
          <span class="figure-caption-tag">STEP 1 FUNNEL</span>
        </div>
        <div class="figure-caption-desc">
          Captures student full name, 10-digit Indian mobile number, class selection (Classes 9&ndash;12), and curriculum board (Tamil Nadu Samacheer Kalvi vs CBSE). Validates inputs and mints cryptographic Step 1 milestone token.
        </div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 88mm;" src="${img05}" alt="Step 2 Exam Prep">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 2.2: Step 2 &mdash; Academic Goal Setting & Subject Focus (Route: /exam-prep)</span>
          <span class="figure-caption-tag">STEP 2 FUNNEL</span>
        </div>
        <div class="figure-caption-desc">
          Allows student or parent to select their primary academic objective: Board Exam Centum Distinction, Fundamentals Recovery Clinic, or Advanced Numerical Problem Solving. Unlocks dynamic evening batch catalog.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Visual Specifications &bull; Visual Plate 2</span>
      <span>Production Deployment Capture</span>
      <span>Page 11 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 12: VISUAL PLATE 3 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="plate-header">
        <div>
          <div class="plate-title">Visual Plate 3 &mdash; 12-Seat Batch Quotas & Reservation Engine (Steps 3 & 4)</div>
          <div class="plate-subtitle">Real-Time Capacity Guard & Sibling Concession Breakdown</div>
        </div>
        <div class="plate-meta">Figures 3.1 & 3.2 &bull; Desktop Resolution: 1280&times;800</div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 88mm;" src="${img06}" alt="Step 3 Batches">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 3.1: Step 3 &mdash; Real-Time Small-Batch Catalog (Route: /batches)</span>
          <span class="figure-caption-tag">STEP 3 FUNNEL</span>
        </div>
        <div class="figure-caption-desc">
          Displays matching 1:12 batches filtered by grade and curriculum. Shows real-time available seats out of 12, evening time slots synchronized with school buses, and monthly tuition fee.
        </div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 88mm;" src="${img07}" alt="Step 4 Batch Detail">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 3.2: Step 4 &mdash; Batch Profile, Mentor & Seat Reservation (Route: /batch/:id)</span>
          <span class="figure-caption-tag">STEP 4 FUNNEL</span>
        </div>
        <div class="figure-caption-desc">
          Presents classroom environment, teacher credentials, exact evening timings, and reservation controls with dynamic sibling fee calculation prior to final enrollment slip generation.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Visual Specifications &bull; Visual Plate 3</span>
      <span>Production Deployment Capture</span>
      <span>Page 12 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 13: VISUAL PLATE 4 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="plate-header">
        <div>
          <div class="plate-title">Visual Plate 4 &mdash; Student Portal Authentication & Registration</div>
          <div class="plate-subtitle">Dual-Identifier Gateway & New Account Onboarding</div>
        </div>
        <div class="plate-meta">Figures 4.1 & 4.2 &bull; Desktop Resolution: 1280&times;800</div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 88mm;" src="${img02}" alt="Student Login">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 4.1: Dedicated Student Login Gateway (Route: /login)</span>
          <span class="figure-caption-tag">STUDENT PORTAL</span>
        </div>
        <div class="figure-caption-desc">
          Supports dual-mode sign-in: Email address or unique Student ID (e.g. FA-THORA-XXXXXX). Resolves student profile seamlessly via serverless endpoint with client-side session persistence.
        </div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 88mm;" src="${img03}" alt="Student Register">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 4.2: Student Account Creation & Guardian Linkage (Route: /student-register)</span>
          <span class="figure-caption-tag">ONBOARDING</span>
        </div>
        <div class="figure-caption-desc">
          Enables new students to register an authenticated profile with student mobile, parent name, guardian emergency contact, grade, and board, creating a linked Firestore record.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Visual Specifications &bull; Visual Plate 4</span>
      <span>Production Deployment Capture</span>
      <span>Page 13 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 14: VISUAL PLATE 5 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="plate-header">
        <div>
          <div class="plate-title">Visual Plate 5 &mdash; Security Guarding & Administrative Gateway</div>
          <div class="plate-subtitle">Route Protection & Split-Screen Multi-Mode Administration</div>
        </div>
        <div class="plate-meta">Figures 5.1 & 5.2 &bull; Desktop Resolution: 1280&times;800</div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 88mm;" src="${img08}" alt="Protected Route Redirect">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 5.1: Student Protected Route Interception (Attempt: /student-dashboard &rarr; /login)</span>
          <span class="figure-caption-tag">SECURITY GUARD</span>
        </div>
        <div class="figure-caption-desc">
          Demonstrates synchronous route guarding by StudentProtectedRoute. Unauthenticated visitors are intercepted without layout flashing and redirected to the login gateway with target route preservation.
        </div>
      </div>

      <div class="figure-card">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 88mm;" src="${img15}" alt="Admin Login Gateway">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 5.2: Split-Screen Administrative Gateway (Route: /admin/login)</span>
          <span class="figure-caption-tag">ADMIN SUITE</span>
        </div>
        <div class="figure-caption-desc">
          Editorial split-screen layout: atmospheric campus branding showcase on the left, paired with an elevated multi-mode administrative authentication form on the right (Google OAuth, Passcode, & Allowlist validation). Zero scrollbars.
        </div>
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Visual Specifications &bull; Visual Plate 5</span>
      <span>Production Deployment Capture</span>
      <span>Page 14 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 15: VISUAL PLATE 6 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="plate-header">
        <div>
          <div class="plate-title">Visual Plate 6 &mdash; Academic Curriculum, Fees & DPDP Privacy</div>
          <div class="plate-subtitle">Course Offerings, Transparent Tuition & Data Protection Standards</div>
        </div>
        <div class="plate-meta">Figures 6.1, 6.2 & 6.3 &bull; Desktop Resolution: 1280&times;800</div>
      </div>

      <div class="figure-card" style="margin-bottom: 6px;">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 52mm;" src="${img12}" alt="Courses Page">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 6.1: Academic Courses & 1:12 Faculty Ratio Overview (Route: /courses)</span>
          <span class="figure-caption-tag">CURRICULUM</span>
        </div>
      </div>

      <div class="figure-card" style="margin-bottom: 6px;">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 52mm;" src="${img13}" alt="Fees Page">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 6.2: Transparent Fee Schedule & 10% Sibling Concession Matrix (Route: /fees)</span>
          <span class="figure-caption-tag">TUITION POLICY</span>
        </div>
      </div>

      <div class="figure-card" style="margin-bottom: 0;">
        <div class="figure-img-wrap">
          <img class="figure-img" style="max-height: 52mm;" src="${img16}" alt="Privacy Policy">
        </div>
        <div class="figure-caption-bar">
          <span class="figure-caption-title">Figure 6.3: Digital Personal Data Protection (DPDP Act 2023) Compliance (Route: /privacy)</span>
          <span class="figure-caption-tag">DPDP COMPLIANCE</span>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Visual Specifications &bull; Visual Plate 6</span>
      <span>Production Deployment Capture</span>
      <span>Page 15 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 16: VISUAL PLATE 7 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="plate-header">
        <div>
          <div class="plate-title">Visual Plate 7 &mdash; Mobile Responsive Ergonomics (375px Viewport)</div>
          <div class="plate-subtitle">Touch-Optimized Small Viewports: Login, Registration, Details & Batches</div>
        </div>
        <div class="plate-meta">Figures 7.1 &ndash; 7.4 &bull; Viewport: 375&times;667</div>
      </div>

      <div class="mobile-grid">
        <div class="mobile-card">
          <div class="mobile-img-wrap">
            <img class="mobile-img" src="${img09}" alt="Mobile Login">
          </div>
          <div class="figure-caption-bar">
            <span class="figure-caption-title">Fig 7.1: Mobile Student Login</span>
            <span class="figure-caption-tag">375px</span>
          </div>
          <div class="figure-caption-desc">Full-width tap targets & single-column login.</div>
        </div>

        <div class="mobile-card">
          <div class="mobile-img-wrap">
            <img class="mobile-img" src="${img10}" alt="Mobile Register">
          </div>
          <div class="figure-caption-bar">
            <span class="figure-caption-title">Fig 7.2: Mobile Account Register</span>
            <span class="figure-caption-tag">375px</span>
          </div>
          <div class="figure-caption-desc">Streamlined guardian and student fields.</div>
        </div>

        <div class="mobile-card">
          <div class="mobile-img-wrap">
            <img class="mobile-img" src="${img11}" alt="Mobile Step 1">
          </div>
          <div class="figure-caption-bar">
            <span class="figure-caption-title">Fig 7.3: Mobile Step 1 Details</span>
            <span class="figure-caption-tag">375px</span>
          </div>
          <div class="figure-caption-desc">Touch-friendly Class & Board selector pills.</div>
        </div>

        <div class="mobile-card">
          <div class="mobile-img-wrap">
            <img class="mobile-img" src="${img17}" alt="Mobile Batches">
          </div>
          <div class="figure-caption-bar">
            <span class="figure-caption-title">Fig 7.4: Mobile Batches Catalog</span>
            <span class="figure-caption-tag">375px</span>
          </div>
          <div class="figure-caption-desc">Sticky chips & real-time seat availability.</div>
        </div>
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Visual Specifications &bull; Visual Plate 7</span>
      <span>Production Deployment Capture</span>
      <span>Page 16 of 17</span>
    </div>
  </div>

  <!-- ==================== PAGE 17: VISUAL PLATE 8 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="plate-header">
        <div>
          <div class="plate-title">Visual Plate 8 &mdash; Official Printable Documents & Campus Location</div>
          <div class="plate-subtitle">Zero-Dependency Admission Slip, Tax Receipt, Report Card & Campus Map</div>
        </div>
        <div class="plate-meta">Figures 8.1 &ndash; 8.4 &bull; High-Fidelity Rendering</div>
      </div>

      <div class="printable-grid">
        <div class="printable-card">
          <img class="printable-img" src="${img19}" alt="Admission Slip">
          <div class="figure-caption-bar">
            <span class="figure-caption-title">Figure 8.1: Official Admission Slip</span>
            <span class="figure-caption-tag">PRINTABLE SLIP</span>
          </div>
          <div class="figure-caption-desc">Includes Admission ID, batch timing, and 1:12 capacity cap seal.</div>
        </div>

        <div class="printable-card">
          <img class="printable-img" src="${img20}" alt="Fee Receipt">
          <div class="figure-caption-bar">
            <span class="figure-caption-title">Figure 8.2: Official Tax & Fee Receipt</span>
            <span class="figure-caption-tag">GSTIN RECEIPT</span>
          </div>
          <div class="figure-caption-desc">Computer-generated receipt with unique REC-ID and GSTIN.</div>
        </div>

        <div class="printable-card">
          <img class="printable-img" src="${img21}" alt="Report Card">
          <div class="figure-caption-bar">
            <span class="figure-caption-title">Figure 8.3: Academic Progress Report Card</span>
            <span class="figure-caption-tag">SCORECARD</span>
          </div>
          <div class="figure-caption-desc">Unit test marks ledger, cumulative %, and faculty observations.</div>
        </div>

        <div class="printable-card">
          <img class="printable-img" src="${img14}" alt="Contact & Map">
          <div class="figure-caption-bar">
            <span class="figure-caption-title">Figure 8.4: Thoramangalam Campus Location</span>
            <span class="figure-caption-tag">CAMPUS & MAP</span>
          </div>
          <div class="figure-caption-desc">Thiripura Complex, Four Roads Junction, bus transit directions.</div>
        </div>
      </div>

      <div class="doc-end-marker">
        &mdash; End of Certified Architecture, Operations & Visual Specification &mdash;
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Visual Specifications &bull; Visual Plate 8</span>
      <span>Production Deployment Sign-Off</span>
      <span>Page 17 of 17</span>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.resolve(__dirname, '../public_specification_temp.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const pdfPath = path.resolve(__dirname, '../Focus_Academy_Platform_Architecture_and_Workflow_Specification.pdf');

  console.log('Launching browser to render executive 17-page specification PDF...');
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  await browser.close();

  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }

  const stat = fs.statSync(pdfPath);
  console.log('Successfully generated 17-page executive specification PDF with ALL screenshots at:', pdfPath);
  console.log('File size:', stat.size, 'bytes');
}

generateExecutivePdf().catch((err) => {
  console.error('Failed to generate executive PDF:', err);
  process.exit(1);
});
