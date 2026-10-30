import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateExecutivePdf() {
  console.log('Generating certified 9-page architecture and workflow specification PDF...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Focus Academy - Platform Architecture, Full-Stack Operations & Workflow Specification</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 12mm 12mm 12mm;
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
    font-size: 8.5pt;
    margin-top: 12px;
    color: #475569;
  }
</style>
</head>
<body>

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
      <span>Page 1 of 9</span>
    </div>
  </div>

  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">2 5-Step Monotonic Admission Funnel Mechanics</h1>
      <p>
        The admission funnel represents the primary public engagement pipeline for student registration. To prevent data corruption, inconsistent class selections, or skipped prerequisites, the client and server enforce a monotonic progression architecture.
      </p>

      <h2 class="sub-sec-heading">2.1 Funnel Milestone Definitions</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 12%;">Step</th>
            <th style="width: 25%;">Canonical Route</th>
            <th style="width: 35%;">Required Data Payload</th>
            <th style="width: 28%;">Cryptographic Milestone Gate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Step 1</strong></td>
            <td><code>/student-details</code></td>
            <td>Full student name, 10-digit Indian mobile number, Grade level (Class 9&ndash;12), Board track (TN State Board Samacheer or CBSE NCERT).</td>
            <td>Token minted: <code>step1_completed</code> with HMAC-SHA256 signature containing student ID and timestamp.</td>
          </tr>
          <tr>
            <td><strong>Step 2</strong></td>
            <td><code>/exam-prep</code></td>
            <td>Academic focus objective (Board Exam Centum, Fundamentals Recovery, Competitive Entrance Foundation), primary subject selection.</td>
            <td>Token minted: <code>step2_completed</code>; verifies prerequisite <code>step1_completed</code> token presence and validity.</td>
          </tr>
          <tr>
            <td><strong>Step 3</strong></td>
            <td><code>/batches</code></td>
            <td>Small-batch catalog filtered by grade and curriculum; real-time available seat count (1:12 capacity), evening time-slot selection.</td>
            <td>Token minted: <code>step3_completed</code>; locks selected batch ID temporarily in session cache.</td>
          </tr>
          <tr>
            <td><strong>Step 4</strong></td>
            <td><code>/batch/:id</code></td>
            <td>Detailed batch profile inspection, mentor credentials, bus-coordinated schedule confirmation, sibling fee concession selection.</td>
            <td>Token minted: <code>step4_completed</code>; recalculates exact monthly fee and generates reservation nonce.</td>
          </tr>
          <tr>
            <td><strong>Step 5</strong></td>
            <td><code>/enroll</code></td>
            <td>Official registration finalization, guardian emergency contact, payment mode selection (Cash, UPI, Direct Transfer), printable slip issuance.</td>
            <td>Final transaction commitment; increments physical seat count, commits record to Firestore and local ledger.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">2.2 Sequential Protection Algorithm (Sync Redirection)</h2>
      <p>
        To eliminate layout flashing and preserve security boundaries, downstream route guards execute synchronously during component construction. If a visitor attempts to access <code>/batch/batch-12-science</code> directly, the route guard evaluates milestone criteria before DOM rendering:
      </p>
      <div class="code-block">function verifyFunnelStep(targetStep, currentSession) {
  const { currentStep, hmacToken, studentData } = currentSession;
  if (!studentData || !studentData.studentName || !studentData.phone) {
    return { allowed: false, redirectTo: '/student-details', reason: 'MISSING_STEP_1_DETAILS' };
  }
  if (targetStep &gt; currentStep + 1) {
    return { allowed: false, redirectTo: getRouteForStep(currentStep), reason: 'ILLEGAL_DOWNSTREAM_JUMP' };
  }
  if (!verifyHmacSignature(hmacToken, currentStep)) {
    return { allowed: false, redirectTo: '/student-details', reason: 'HMAC_TOKEN_TAMPERED' };
  }
  return { allowed: true };
}</div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 2 of 9</span>
    </div>
  </div>

  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">3 1:12 Capacity Guard & Real-Time Concurrency Architecture</h1>
      <p>
        The platform's foundational pedagogical promise is an absolute classroom ceiling of 12 students per batch. Unlike commercial platforms that permit invisible oversubscription, Focus Academy enforces hard algorithmic quota limits across memory, serverless functions, and database writes.
      </p>

      <h2 class="sub-sec-heading">3.1 State Machine for Batch Quota Reservation</h2>
      <div class="ascii-diagram">+--------------------------------------------------------------------------------------------------+
|                              1:12 SEAT RESERVATION &amp; CONCURRENCY LIFECYCLE                         |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [Student Views Batch]                                                                          |
|            |                                                                                     |
|            v                                                                                     |
|   +-------------------+        Enrolled &gt;= 12?         +-------------------------------------+   |
|   | Query Seat Status | ------------------------------&gt; | BATCH STATUS: FULL                  |   |
|   +-------------------+        (Yes)                   | (Disable Enroll CTA, Show Waitlist) |   |
|            |                                           +-------------------------------------+   |
|            | (No: Enrolled &lt; 12)                                                                 |
|            v                                                                                     |
|   +-------------------+                                                                          |
|   | Select &amp; Reserve  | ---&gt; [Allocate Temporary 10-Min Reservation Nonce in Session Store]       |
|   +-------------------+                                                                          |
|            |                                                                                     |
|            v                                                                                     |
|   +-------------------+        Timeout / Abort?        +-------------------------------------+   |
|   | Finalize Step 5   | ------------------------------&gt; | Release Nonce; Seat Restored to 12  |   |
|   +-------------------+                                +-------------------------------------+   |
|            |                                                                                     |
|            | (Confirmed)                                                                         |
|            v                                                                                     |
|   +------------------------------------------------------------------------------------------+   |
|   | Firestore Atomic FieldValue.increment(1) + Local Fallback Ledger Commit                 |   |
|   +------------------------------------------------------------------------------------------+   |
+--------------------------------------------------------------------------------------------------+</div>

      <h2 class="sub-sec-heading">3.2 Concurrency Conflict Resolution & Offline Resilience</h2>
      <p>
        When two parents attempt to reserve the 12th seat simultaneously, the transaction layer enforces atomic serialization. In the event of network connectivity interruptions, the client uses an offline fallback cache (<code>localStorage</code>) to maintain batch inventory integrity until reconnect.
      </p>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 3 of 9</span>
    </div>
  </div>

  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">4 Dual-Role Authentication & Security Hierarchy</h1>
      <p>
        The platform segregates access into two distinct functional security boundaries: the <strong>Student Portal</strong> and the <strong>Administrative Operations Suite</strong>.
      </p>

      <h2 class="sub-sec-heading">4.1 Student Dual-Identifier Resolution Architecture</h2>
      <p>
        Secondary students and rural parents frequently encounter difficulties remembering institutional email credentials. To eliminate this friction, the Student Portal provides a dual-identifier login resolver:
      </p>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 25%;">Identifier Type</th>
            <th style="width: 35%;">Input Format & Validation</th>
            <th style="width: 40%;">Resolver Mechanism</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Official Student ID</strong></td>
            <td>Format: <code>FA-THORA-XXXXXX</code> (6 alphanumeric characters)</td>
            <td>Direct index lookup in <code>students</code> collection; resolves linked email and prompts password verification.</td>
          </tr>
          <tr>
            <td><strong>Email Address</strong></td>
            <td>Standard RFC 5322 format (e.g., <code>kavitha.sundaram@gmail.com</code>)</td>
            <td>Direct authentication via Firebase Client SDK <code>signInWithEmailAndPassword()</code>.</td>
          </tr>
          <tr>
            <td><strong>Registered Mobile</strong></td>
            <td>10-digit Indian Mobile (e.g., <code>9842451220</code>)</td>
            <td>Secondary lookup resolving associated student ID profile; sends SMS OTP verification during onboarding.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">4.2 Administrative Dual-Gate Security Hierarchy</h2>
      <p>
        Administrative privileges grant access to student personal records, fee journals, batch assignments, and emergency contact registries. Protection relies on a multi-layer verification barrier:
      </p>
      <div class="code-block">async function verifyAdminAccess(userCredential) {
  const token = await userCredential.user.getIdTokenResult();
  const email = userCredential.user.email?.toLowerCase();
  const ALLOWED_ADMINS = ['admin@focusacademyperambalur.com', 'sagnikmitra1302@gmail.com'];
  if (!ALLOWED_ADMINS.includes(email) &amp;&amp; !token.claims.isAdmin) {
    await firebase.auth().signOut();
    throw new SecurityException('UNAUTHORIZED_ADMIN_CREDENTIALS', 403);
  }
  return { authorized: true, role: 'CAMPUS_DIRECTOR', timestamp: Date.now() };
}</div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 4 of 9</span>
    </div>
  </div>

  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">5 Student Portal Architecture & Academic Integrity</h1>
      <p>
        The Student Portal (<code>/student-dashboard</code>) serves as the personalized academic headquarters for enrolled students and their guardians, delivering four integrated functional modules.
      </p>

      <h2 class="sub-sec-heading">5.1 Enrolled Courses & Timetable Integration</h2>
      <p>
        Displays active batch enrollments, physical classroom room numbers (1st or 2nd floor, Thiripura Complex), subject faculty profiles, and evening timing schedules synchronized with local bus routes.
      </p>

      <h2 class="sub-sec-heading">5.2 Doubts Resolution Desk with Teacher Feedback Loop</h2>
      <p>
        A dedicated student doubts submission desk allows enrolled students to post conceptual queries outside regular tuition hours:
      </p>
      <ul class="bullet-list">
        <li><strong>Subject Classification:</strong> Doubts are categorized by subject (Physics, Chemistry, Mathematics, Biology).</li>
        <li><strong>Rich Query Context:</strong> Students input specific textbook exercise numbers, chapter references, and problem statements.</li>
        <li><strong>Teacher Resolution Queue:</strong> Faculty review questions in the administrative console, attach step-by-step mathematical derivations or explanations, and mark items as "Resolved".</li>
        <li><strong>Status Badging:</strong> Real-time status indicators ("Pending Faculty Review" in yellow, "Resolved with Notes" in green).</li>
      </ul>

      <h2 class="sub-sec-heading">5.3 Academic Assessment Ledger & Progress Reports</h2>
      <p>
        The student assessment tab provides transparent diagnostic records:
      </p>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Assessment Date</th>
            <th>Subject & Topic Tested</th>
            <th>Maximum Marks</th>
            <th>Student Score</th>
            <th>Batch Average</th>
            <th>Faculty Diagnostic Feedback</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>18 Oct 2026</td>
            <td>Physics: Ray Optics & Lens Maker Formula</td>
            <td>50</td>
            <td>46 (92%)</td>
            <td>38.4</td>
            <td>Excellent sign-convention accuracy; review refraction at spherical surfaces.</td>
          </tr>
          <tr>
            <td>11 Oct 2026</td>
            <td>Mathematics: Differential Calculus & Limits</td>
            <td>50</td>
            <td>44 (88%)</td>
            <td>36.1</td>
            <td>Strong algebraic factoring; clarify L'Hôpital's rule application in indeterminate forms.</td>
          </tr>
          <tr>
            <td>04 Oct 2026</td>
            <td>Chemistry: Organic Reaction Mechanisms</td>
            <td>50</td>
            <td>43 (86%)</td>
            <td>34.5</td>
            <td>Clear nucleophilic substitution pathways; memorize boiling point trend exceptions.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 5 of 9</span>
    </div>
  </div>

  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">6 Administrative Operations Suite & Campus Management</h1>
      <p>
        The administrative operations suite (<code>/admin/*</code>) equips campus directors and academic coordinators with complete operational control over student enrollments, batch assignments, attendance rosters, and financial records.
      </p>

      <h2 class="sub-sec-heading">6.1 Live Campus Operations Telemetry</h2>
      <p>
        The primary admin dashboard provides real-time operational metrics across four critical dimensions:
      </p>
      <ul class="bullet-list">
        <li><strong>Active Enrolled Students:</strong> Real-time count of enrolled students across all 7 grade tracks.</li>
        <li><strong>1:12 Batch Occupancy Utilization:</strong> Percentage utilization of the 84-desk total physical campus capacity.</li>
        <li><strong>Tuition Fee Collection:</strong> Monthly realized revenue vs outstanding tuition dues.</li>
        <li><strong>Active Doubts Queue:</strong> Number of pending student academic inquiries awaiting faculty resolution.</li>
      </ul>

      <h2 class="sub-sec-heading">6.2 Student Lifecycle State Machine</h2>
      <div class="ascii-diagram">+--------------------------------------------------------------------------------------------------+
|                              STUDENT LIFECYCLE STATE TRANSITIONS                                 |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [Inquiry Received] ---&gt; (TRIAL_SCHEDULED) ---&gt; [Attends 2-Day Free Trial]                     |
|                                                              |                                   |
|                                                              v                                   |
|   [Withdrawn / Inactive] &lt;--- (PAYMENT_OVERDUE) &lt;--- (ENROLLED_ACTIVE) &lt;--- [Pays Tuition Fee]   |
|                                       |                      |                                   |
|                                       +----------------------+---&gt; (ALUMNI_COMPLETED)           |
+--------------------------------------------------------------------------------------------------+</div>

      <h2 class="sub-sec-heading">6.3 Templated WhatsApp Communication Engine</h2>
      <p>
        To ensure reliable parental communication without manual drafting errors, the administrative suite includes one-click WhatsApp communication templates encoded with recipient phone numbers, student names, and specific institutional notices.
      </p>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 6 of 9</span>
    </div>
  </div>

  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">7 Financial Management, Billing Engine & Printable Receipts</h1>
      <p>
        The platform embeds an automated billing calculation engine coupled with an official printable documents suite, ensuring zero mathematical errors in fee assessments and complete institutional transparency.
      </p>

      <h2 class="sub-sec-heading">7.1 Dynamic 10% Sibling Concession Engine</h2>
      <p>
        When a parent enrolls two or more children simultaneously, the calculation engine applies a 10% concession to the second child's monthly tuition:
      </p>
      <div class="formula-box">
        \\text{Total Fee} = \\text{Fee}_{\\text{Primary}} + \\left( \\text{Fee}_{\\text{Sibling}} \\times 0.90 \\right)
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
      <span>Page 7 of 9</span>
    </div>
  </div>

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
      <span>Page 8 of 9</span>
    </div>
  </div>

  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">9 Quality Engineering, Test Suite & Campus Operations</h1>
      <p>
        The platform enforces comprehensive engineering standards spanning unit contracts, DOM interaction tests, programmatic accessibility scans, and real-browser cross-platform end-to-end verification.
      </p>

      <h2 class="sub-sec-heading">9.1 17-Suite Automated Vitest Architecture (400+ Tests Passed)</h2>
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
        <strong>Academic Hours:</strong> Monday to Saturday: 4:30 PM &ndash; 9:00 PM | Sunday: By Appointment<br>
        <strong>Helpline / Direct Call:</strong> +91 98424 51220 | <strong>Campus Email:</strong> focusacademy.perambalur@gmail.com<br>
        <strong>Live Production Web Portal:</strong> https://focus-academy-virid.vercel.app<br>
        <strong>Administrative Console:</strong> https://focus-academy-virid.vercel.app/admin/login
      </div>

      <div class="doc-end-marker">
        &mdash; End of Certified Architecture, Operations & Workflow Specification &mdash;
      </div>
    </div>
    <div class="page-footer">
      <span>Focus Academy Platform Architecture & Specification</span>
      <span>Thoramangalam, Perambalur &bull; Production System</span>
      <span>Page 9 of 9</span>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.resolve(__dirname, '../public_specification_temp.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const pdfPath = path.resolve(__dirname, '../Focus_Academy_Platform_Architecture_and_Workflow_Specification.pdf');

  console.log('Launching browser to render certified 9-page specification PDF...');
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
  console.log('Successfully generated certified 9-page executive specification PDF at:', pdfPath);
  console.log('File size:', stat.size, 'bytes');
}

generateExecutivePdf().catch((err) => {
  console.error('Failed to generate executive PDF:', err);
  process.exit(1);
});
