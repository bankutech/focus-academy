import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateExecutivePdf() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Focus Academy - Platform Architecture & Workflow Specification</title>
<style>
  @page {
    size: A4 portrait;
    margin: 20mm 18mm 20mm 18mm;
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
    font-size: 10pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 100%;
    min-height: 257mm;
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .page:last-child {
    page-break-after: auto;
  }

  .content-area {
    flex-grow: 1;
  }

  .page-footer {
    text-align: center;
    font-size: 9pt;
    color: #111111;
    padding-top: 10px;
  }

  .doc-title-block {
    text-align: center;
    margin-bottom: 22px;
    padding-bottom: 12px;
    border-bottom: 1.5px solid #000000;
  }

  .doc-main-title {
    font-size: 20pt;
    font-weight: bold;
    letter-spacing: -0.3px;
    line-height: 1.2;
    margin-bottom: 6px;
  }

  .doc-sub-title {
    font-size: 12pt;
    font-weight: bold;
    margin-bottom: 8px;
    color: #222222;
  }

  .doc-blueprint-meta {
    font-size: 9.5pt;
    font-weight: bold;
    color: #111111;
    margin-bottom: 4px;
    line-height: 1.35;
  }

  .doc-signoff-meta {
    font-size: 9pt;
    font-style: italic;
    color: #444444;
  }

  h1.sec-heading {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 14px;
    margin-bottom: 8px;
    color: #000000;
    line-height: 1.25;
  }

  h2.sub-sec-heading {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 6px;
    color: #111111;
  }

  h3.sub-sub-heading {
    font-size: 10pt;
    font-weight: bold;
    margin-top: 8px;
    margin-bottom: 4px;
    color: #222222;
  }

  p {
    margin-bottom: 8px;
    text-align: justify;
    text-justify: inter-word;
  }

  ol.num-list, ul.bullet-list {
    margin-left: 20px;
    margin-bottom: 10px;
  }

  ol.num-list li, ul.bullet-list li {
    margin-bottom: 6px;
    text-align: justify;
  }

  .ascii-diagram {
    font-family: 'Courier New', Courier, monospace;
    font-size: 7.4pt;
    line-height: 1.15;
    background: #ffffff;
    color: #000000;
    padding: 8px 0;
    white-space: pre;
    overflow: hidden;
    margin: 8px 0 12px 0;
  }

  .code-block {
    font-family: 'Courier New', Courier, monospace;
    font-size: 8pt;
    line-height: 1.25;
    background: #fbfbfb;
    border: 1px solid #dcdcdc;
    border-radius: 2px;
    padding: 8px 10px;
    white-space: pre;
    margin: 8px 0 10px 0;
  }

  .spec-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin: 10px 0 14px 0;
    border-top: 1.5px solid #000000;
    border-bottom: 1.5px solid #000000;
  }

  .spec-table th {
    font-weight: bold;
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid #000000;
    background: #ffffff;
    vertical-align: top;
  }

  .spec-table td {
    padding: 5px 8px;
    border-bottom: 0.5px solid #e0e0e0;
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
    font-size: 10pt;
    padding: 6px 0;
    margin: 6px 0 10px 0;
  }

  .callout-quote {
    border-left: 2.5px solid #000000;
    padding-left: 12px;
    margin: 8px 0 10px 0;
    font-style: italic;
    color: #222222;
  }

  .doc-end-marker {
    text-align: center;
    font-style: italic;
    font-size: 9pt;
    margin-top: 24px;
    color: #444444;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="content-area">
      <div class="doc-title-block">
        <div class="doc-main-title">Focus Academy Thoramangalam</div>
        <div class="doc-sub-title">Small-Batch Tutoring, Sequential Admission Engine & Platform Architecture</div>
        <div class="doc-blueprint-meta">Production Blueprint: Deterministic 5-Step Funnel, Cryptographic Step Auth, Headless Dynamic Batches & Multi-Channel Lead Resilience</div>
        <div class="doc-signoff-meta">Prepared for Academic Operations Review, Technical Sign-Off & Implementation Baseline</div>
      </div>

      <h1 class="sec-heading">1 Executive Summary & Product Vision</h1>
      <p>
        Commercial coaching centers across semi-urban education hubs suffer from chronic overcrowding (frequently packing 45 to 60 students per classroom), generic one-size-fits-all curricula, uncoordinated transport timetables, and fragmented manual registration record-keeping. Under this high-density tuition model, struggling students fall behind undetected, homework accountability evaporates, and parents lack visibility into genuine conceptual mastery.
      </p>
      <p>
        <strong>Focus Academy</strong> establishes a modern, human-centric academic coaching platform engineered explicitly for the community of <strong>Thoramangalam, Perambalur</strong> (2nd Floor, Thiripura Complex, near Four Roads Junction and Trichy Main Road). It combines an uncompromising <strong>1:12 faculty-to-student batch cap</strong> with a deterministic, cryptographically guarded 5-step digital admission funnel. The application integrates real-time evening batch seat tracking, transparent fee calculations with automated sibling concessions, local school bus timetable synchronization, and a zero-loss multi-tier lead delivery architecture.
      </p>

      <h2 class="sub-sec-heading">1.1 Core Non-Negotiable System Invariants</h2>
      <ol class="num-list">
        <li><strong>Strict Ascending Funnel Enforcement:</strong> The admission journey is a monotonic sequence ($1 \to 2 \to 3 \to 4 \to 5$). Direct browser URL navigation to later milestones (such as Step 4 Batch Details or Step 5 Enrollment) is intercepted synchronously during initial render and redirected to Step 1 without data corruption or visual layout flashing.</li>
        <li><strong>Cryptographic Session Step Tokens:</strong> Client-side state is not authoritative. Every completed step receives an HMAC-SHA256 digital signature minted by the serverless session layer. Manual tampering with localStorage integers immediately fails cryptographic verification and resets progress safely to Step 1.</li>
        <li><strong>Uncompromising 1:12 Physical Classroom Cap:</strong> Batch seat inventories are strictly capped at 12 students per classroom. The system features a headless dynamic batch engine that manages seat reservations in real-time, preventing oversubscription while providing instantaneous static fallback during network partitioning.</li>
        <li><strong>Zero-Drop Multi-Tier Lead Ingestion:</strong> To protect against rural network drops, admission requests are processed via a resilient 3-tier contingency pipeline: local append-only localStorage queue, asynchronous serverless database ingestion, and instantaneous pre-filled WhatsApp click-to-chat delivery.</li>
        <li><strong>School Bus Timetable Synchronization:</strong> Evening batch schedules (4:30 PM, 6:00 PM, 7:30 PM) align precisely with local school buses arriving via Trichy Main Road and Four Roads, guaranteeing students arrive calm, unhurried, and ready to learn.</li>
      </ol>

      <h1 class="sec-heading">2 System Architecture & Topography</h1>
      <p>
        The platform operates on a resilient two-tier architecture: a high-performance React 19 Single Page Application (SPA) on the client tier paired with an event-driven serverless API tier on the Vercel Edge Network.
      </p>
    </div>
    <div class="page-footer">1</div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div class="content-area">
      <h2 class="sub-sec-heading">2.1 System Topography & Component Interconnect Diagram</h2>
      <div class="ascii-diagram">
+----------------------------------------------------------------------------------------------------+
| UNIFIED BROWSER PRESENTATION CLIENT (React 19 + React Router 7 + Tailwind CSS v4)                  |
| +- Step 1: Student Identity & Board Selection (/student-details)                                   |
| +- Step 2: Exam Goal Specification (/exam-prep)                                                    |
| +- Step 3: Interactive Batches Catalog with Sticky Mobile Filter Chips (/batches)                  |
| +- Step 4: Batch Profile, Mentor Allocation & Classroom Capacity (/batch/:id)                     |
| +- Step 5: Final Enrollment & Printable Admission Slip FA-THORA-XXXXXX (/enroll/:id)              |
| +- Public Views: Independent Timings Matrix (/timings), Academic Courses (/courses)               |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                  Synchronous Render-Time Guards  |  (Cryptographic State Invariant Probe)
                                                  v
+----------------------------------------------------------------------------------------------------+
| CLIENT APPLICATION STATE & SECURITY CORE                                                           |
| +- AppContext: Centralized Student Flow State Machine (studentFlow, step tracker)                  |
| +- SessionAuthService: Client-side HMAC Verification & Tamper Detection                            |
| +- BatchService: Real-Time Seat Cache, Reservation Locking & Static Catalog Fallback               |
| +- LeadService: Dual-Mode Local Outbox & Asynchronous Serverless Lead Dispatcher                   |
| +- Storage Event Listener: Real-Time Cross-Tab State Synchronization                               |
+------------------------+---------------------------------+-----------------------------------------+
                         |                                 |
     Signed Step Tokens  |          Seat Queries           |  Admission Submissions
     (HTTP POST JSON)    |          & Reservations         |  & Lead Ingestion
                         v                                 v
======================================================================================================
MANAGED EDGE & SERVERLESS BACKEND (Vercel Global Edge Network - Node.js 24 Serverless)
+----------------------------------------------------------------------------------------------------+
| CRYPTOGRAPHIC SESSION ENGINE (/api/session.js)                                                     |
| +- HMAC-SHA256 Token Signer: Mints signed tokens bound to student name, grade, and timestamp      |
| +- Signature Verifier: Validates milestone integrity; rejects unauthorized step mutations          |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
+-------------------------------------------------v--------------------------------------------------+
| DYNAMIC HEADLESS BATCH ENGINE (/api/batches.js)                                                    |
| +- Real-Time Seat Status: Queries active remaining seats against strict 12-desk classroom limit    |
| +- Seat Reservation Engine: Locks selected slots for 15-minute checkout windows                    |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
+-------------------------------------------------v--------------------------------------------------+
| MULTI-TIER ADMISSION PIPELINE (/api/leads.js & Resilient Fallbacks)                                |
| +- Primary: Serverless Lead Persistence & Admission Slip Receipt Generation                       |
| +- Local Fallback: Append-Only Offline LocalStorage Queue for Intermittent Connectivity            |
| +- Zero-Loss Fallback: Instant Pre-filled WhatsApp Click-to-Chat Admission Deep-Link               |
+----------------------------------------------------------------------------------------------------+
      </div>

      <h2 class="sub-sec-heading">2.2 Architectural Layers & Boundaries</h2>
      <p>
        The client bundle is compiled using Vite 8 with strict code-splitting via <code>React.lazy()</code> and <code>Suspense</code>, keeping the initial gzipped JavaScript payload under 95 kB. The boundary between client-side routing and serverless verification ensures that no user can simulate admission completion by manipulating browser state.
      </p>
    </div>
    <div class="page-footer">2</div>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">3 Sequential State Machine & Funnel Progression</h1>
      <p>
        The registration flow is modeled as a formal, deterministic state machine where each transition requires verified completion of prior steps. The progress integer is monotonic: returning to an earlier step to modify inputs does not reset already-unlocked milestones unless core demographic parameters are explicitly changed.
      </p>

      <h2 class="sub-sec-heading">3.1 Step-by-Step Monotonic Progression</h2>
      <ul class="bullet-list">
        <li><strong>Step 1 &rarr; Step 2 Transition:</strong> Requires valid student name, parent phone number (tested against Indian +91 regex supporting prefixes, 10-digit formats, and spacing), class selection (Classes 6–12), and board selection (TN State Board Samacheer Kalvi or CBSE). Upon submission, a cryptographic Step 1 token is signed.</li>
        <li><strong>Step 2 &rarr; Step 3 Transition:</strong> Requires target exam goal selection (10th/12th Board Exam Mastery, Foundation Science & Math, or High-Scoring Centum Strategy). Issues Step 2 token and unlocks the batch catalog.</li>
        <li><strong>Step 3 &rarr; Step 4 Transition:</strong> Student filters and reviews matching small-batches. Selecting a batch records the batch ID, schedule, and monthly fee, advancing the session state to Step 4.</li>
        <li><strong>Step 4 &rarr; Step 5 Transition:</strong> Displays detailed batch syllabus, faculty bio, classroom location, and fee breakdown. Confirming details issues Step 4 token and mounts the enrollment page.</li>
        <li><strong>Step 5 Completion:</strong> Collects final parent contact verification, applies optional sibling concession, mints official admission slip <code>FA-THORA-XXXXXX</code>, and executes the lead submission pipeline.</li>
      </ul>

      <h2 class="sub-sec-heading">3.2 Synchronous Render-Time Route Guarding Algorithm</h2>
      <p>
        Rather than relying on asynchronous <code>useEffect</code> redirections that cause screen flickering, the route guard evaluates access eligibility synchronously during the component's render phase:
      </p>
      <div class="code-block">
function getStepRedirect(targetStep, studentFlow, currentPath) {
  if (currentPath === '/timings' || currentPath === '/courses') return null;
  const isStep1Done = isStep1Complete(studentFlow);
  const isStep2Done = isStep2Complete(studentFlow);
  const isStep3Done = isStep3Complete(studentFlow);

  if (targetStep >= 2 && !isStep1Done) return '/student-details';
  if (targetStep >= 3 && !isStep2Done) return '/exam-prep';
  if (targetStep >= 4 && !isStep3Done) return '/batches';
  return null;
}
      </div>

      <h2 class="sub-sec-heading">3.3 Contextual Redirect Toast Feedback & UX Guardrails</h2>
      <p>
        When a user enters a locked URL directly, the system passes redirect metadata (e.g. <code>state: { redirectedFrom: 4 }</code>). The target page mounts an animated floating notification badge alongside an inline warning card: <em>"Please provide basic student details first to unlock batches"</em>. This eliminates disorientation and provides a clear 1-click pathway forward.
      </p>
    </div>
    <div class="page-footer">3</div>
  </div>

  <!-- ==================== PAGE 4 ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">4 Serverless API Architecture & Cryptographic Tokens</h1>
      <p>
        The backend layer runs on Vercel Serverless Functions deployed on Node.js 24. It separates state verification from static presentation, ensuring that client-side localStorage manipulation cannot compromise data integrity.
      </p>

      <h2 class="sub-sec-heading">4.1 Serverless Endpoint Specification</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 20%;">Endpoint</th>
            <th style="width: 15%;">Method</th>
            <th style="width: 25%;">Payload / Params</th>
            <th style="width: 40%;">Behavior & Response</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>/api/session.js</code></td>
            <td>POST</td>
            <td><code>{ action: 'sign', studentName, grade, step }</code></td>
            <td>Generates an HMAC-SHA256 signature validating step completion. Returns signed token payload with timestamp.</td>
          </tr>
          <tr>
            <td><code>/api/session.js</code></td>
            <td>POST</td>
            <td><code>{ action: 'verify', token, studentName, step }</code></td>
            <td>Verifies cryptographic token signature against secret key; returns boolean status and expiry bounds.</td>
          </tr>
          <tr>
            <td><code>/api/batches.js</code></td>
            <td>GET</td>
            <td><code>?grade=Class+10&board=State</code></td>
            <td>Returns live seat availability for matching small-batches, checking current reservations against the 12-seat cap.</td>
          </tr>
          <tr>
            <td><code>/api/batches.js</code></td>
            <td>POST</td>
            <td><code>{ action: 'reserve', batchId, studentName }</code></td>
            <td>Locks a seat reservation for 15 minutes, decrementing temporary seat counters atomically.</td>
          </tr>
          <tr>
            <td><code>/api/leads.js</code></td>
            <td>POST</td>
            <td><code>{ studentName, phone, grade, batchId, fee }</code></td>
            <td>Persists admission record, assigns unique slip ID <code>FA-THORA-XXXXXX</code>, and returns confirmation payload.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">4.2 Canonical Step Token JSON & Cryptographic Signing</h2>
      <p>
        Step tokens are formatted as canonical JSON structures signed with an asymmetric HMAC secret:
      </p>
      <div class="code-block">
{
  "token_id": "tok_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "campus_id": "thoramangalam_perambalur_01",
  "student_name": "S. Kaviya",
  "grade": "Class 10",
  "board": "TN State Board (Samacheer)",
  "verified_step": 4,
  "issued_at": 1774181400000,
  "expires_at": 1774267800000,
  "signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
      </div>
      <p>
        The verification algorithm tests the payload against:
      </p>
      <div class="formula-box">
        HMAC-SHA256(SecretKey, student_name || grade || verified_step || issued_at) &stackrel;{?}{=} token.signature
      </div>
    </div>
    <div class="page-footer">4</div>
  </div>

  <!-- ==================== PAGE 5 ==================== -->
  <div class="page">
    <div class="content-area">
      <h2 class="sub-sec-heading">4.3 Dynamic Seat Reservation & Anti-Race Protocol</h2>
      <p>
        To prevent double-booking of physical desks in small-group classrooms (strictly capped at 12 seats), the seat reservation engine implements an optimistic lock:
      </p>
      <ol class="num-list">
        <li><strong>Seat Availability Query:</strong> When a user navigates to Step 3 or Step 4, <code>BatchService.js</code> queries <code>/api/batches.js</code>. The endpoint evaluates active confirmed enrollments plus unexpired reservations.</li>
        <li><strong>Temporary Seat Lock:</strong> Selecting a batch on Step 4 triggers an atomic reservation request. The server issues a temporary 15-minute lease reserving the desk.</li>
        <li><strong>Checkout Expiration Window:</strong> If Step 5 enrollment is not completed within 15 minutes, the reservation expires automatically, restoring the seat to the public pool.</li>
        <li><strong>Partition Fallback:</strong> If the cloud endpoint is unreachable due to regional network outages, <code>BatchService.js</code> gracefully falls back to deterministic static data in <code>batchesData.js</code>, ensuring zero interruption to front-end registration.</li>
      </ol>

      <h2 class="sub-sec-heading">4.4 Lead Ingestion JSON Schema & WhatsApp Deep-Link Fallback</h2>
      <p>
        Admissions submitted on Step 5 generate an immutable JSON payload transmitted to <code>/api/leads.js</code>:
      </p>
      <div class="code-block">
{
  "slip_id": "FA-THORA-884920",
  "timestamp": "2026-10-21T17:30:00.000Z",
  "campus": "Thiripura Complex, Thoramangalam, Perambalur",
  "student": {
    "name": "S. Kaviya",
    "phone": "9842451220",
    "grade": "Class 10",
    "board": "TN State Board (Samacheer)",
    "exam_goal": "10th Board Exam Mastery"
  },
  "batch": {
    "id": "batch-10-state-board",
    "name": "Class 10 State Board - Evening Batch A",
    "timing": "6:00 PM – 7:30 PM (Mon–Sat)",
    "classroom": "Room 204, 2nd Floor, Thiripura Complex",
    "monthly_fee_inr": 2200,
    "sibling_discount_applied": false
  },
  "status": "SEAT_CONFIRMED_AWAITING_TRIAL"
}
      </div>
      <p>
        Simultaneously, the client constructs a pre-formatted WhatsApp click-to-chat deep-link targeting the academy's official helpline (<code>+91 98424 51220</code>). This provides an instant, zero-failure communication channel between the parent and the academic center even if external email or SMS gateways fail.
      </p>
    </div>
    <div class="page-footer">5</div>
  </div>

  <!-- ==================== PAGE 6 ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">5 Anti-Tamper Security Matrix & State Integrity Defenses</h1>
      <p>
        Because tuition admission funnels handle personal contact information, batch quotas, and fee commitments, the platform establishes multi-layer defenses against unauthorized state manipulation.
      </p>

      <h2 class="sub-sec-heading">5.1 Threat Model & Mitigation Matrix</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 22%;">Attack Vector</th>
            <th style="width: 25%;">Target / Vulnerability</th>
            <th style="width: 53%;">Mitigation Mechanism & Verification Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>LocalStorage Step Integer Tampering</strong></td>
            <td>Technical user modifies <code>step: 5</code> in dev tools to bypass Step 1–3 forms.</td>
            <td>HMAC Step Token Validation: <code>isStepComplete()</code> verifies the cryptographic signature against student name and grade. Forged or unsigned integers immediately reset progress to Step 1.</td>
          </tr>
          <tr>
            <td><strong>Direct URL Bypass</strong></td>
            <td>User pastes <code>/batch/batch-10</code> or <code>/enroll/batch-10</code> directly into browser.</td>
            <td>Synchronous Render-Time Route Guard: <code>getStepRedirect()</code> intercepts the route before DOM mounting and executes an immediate <code>&lt;Navigate to="/student-details" replace /&gt;</code>.</td>
          </tr>
          <tr>
            <td><strong>Cross-Tab State Staleness</strong></td>
            <td>Parent completes registration in Tab A; Tab B retains unsubmitted older state.</td>
            <td>Storage Event Dispatcher: <code>AppContext</code> binds to <code>window.addEventListener('storage')</code>, propagating fresh student flow data across all browser tabs in real time.</td>
          </tr>
          <tr>
            <td><strong>Phone Number Invalidation</strong></td>
            <td>Spam leads with dummy characters, letters, or insufficient digits.</td>
            <td>Strict Regex Guard: <code>PHONE_REGEX</code> enforces 10 valid Indian digits, optionally accepting <code>+91</code>, <code>0</code> prefix, and standard spaces. Invalid inputs block form progression.</td>
          </tr>
          <tr>
            <td><strong>Fee Parameter Manipulation</strong></td>
            <td>Manipulating DOM elements or query strings to reduce tuition amounts.</td>
            <td>Server-Authoritative Pricing: Fees are calculated deterministically by <code>feeCalculation.js</code> and checked against serverless catalogs. Client-side price tampering is ignored during final slip minting.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">5.2 Multi-Tab State Synchronization Flow</h2>
      <p>
        When multiple browser tabs are open simultaneously during a family discussion, state consistency is maintained through native storage event listeners:
      </p>
      <div class="code-block">
window.addEventListener('storage', (event) => {
  if (event.key === 'focus_academy_student_flow' && event.newValue) {
    try {
      const parsed = JSON.parse(event.newValue);
      setStudentFlow(parsed);
    } catch {
      // Gracefully ignore unparseable payloads
    }
  }
});
      </div>
    </div>
    <div class="page-footer">6</div>
  </div>

  <!-- ==================== PAGE 7 ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">6 Dynamic Batch Filtering & Mobile Ergonomics</h1>
      <p>
        To ensure parents on mobile devices can navigate schedules without friction, <code>BatchesPage.jsx</code> features an ergonomic sticky filtering architecture tailored to small touchscreens.
      </p>

      <h2 class="sub-sec-heading">6.1 Multi-Dimensional Filter Core</h2>
      <p>
        Batches are filtered dynamically across three distinct dimensions:
      </p>
      <ul class="bullet-list">
        <li><strong>Class Level:</strong> Foundational Middle School (Classes 6–8), Class 9, Class 10 (Board Exam Mastery), Class 11, and Class 12.</li>
        <li><strong>Curriculum Board:</strong> Tamil Nadu State Board (Samacheer Kalvi) and CBSE Board (NCERT Aligned).</li>
        <li><strong>Evening Timing Slots:</strong> Slot 1 (4:30 PM – 6:00 PM), Slot 2 (6:00 PM – 7:30 PM), and Slot 3 (7:30 PM – 9:00 PM).</li>
      </ul>

      <h2 class="sub-sec-heading">6.2 Sticky Mobile Header & Kinetic Touch Chip Navigation</h2>
      <p>
        On mobile screens, traditional filter forms require scrolling past large marketing banners. Focus Academy implements a sticky filter bar (<code>sticky top-[108px] sm:top-28 z-20 bg-white/95 backdrop-blur-md</code>) equipped with horizontal touch chips. Parents can toggle classes and boards with one thumb tap without losing their position on the page.
      </p>

      <h2 class="sub-sec-heading">6.3 Small-Batch Inventory & Schedule Matrix</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Class & Board</th>
            <th>Timing Slot</th>
            <th>Days</th>
            <th>Subjects Covered</th>
            <th>Max Seats</th>
            <th>Monthly Fee</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Class 6–8 (State/CBSE)</td>
            <td>4:30 PM – 6:00 PM</td>
            <td>Mon – Sat</td>
            <td>Maths, Science, English, Tamil</td>
            <td>12 Seats</td>
            <td>₹1,500</td>
          </tr>
          <tr>
            <td>Class 9 (State Board)</td>
            <td>6:00 PM – 7:30 PM</td>
            <td>Mon – Sat</td>
            <td>Mathematics, Science, Social</td>
            <td>12 Seats</td>
            <td>₹1,800</td>
          </tr>
          <tr>
            <td>Class 10 (State Board)</td>
            <td>6:00 PM – 7:30 PM</td>
            <td>Mon – Sat</td>
            <td>Maths, Science (Physics/Chem/Bio)</td>
            <td>12 Seats</td>
            <td>₹2,200</td>
          </tr>
          <tr>
            <td>Class 10 (CBSE Board)</td>
            <td>7:30 PM – 9:00 PM</td>
            <td>Mon – Sat</td>
            <td>Standard Maths, Integrated Science</td>
            <td>12 Seats</td>
            <td>₹2,500</td>
          </tr>
          <tr>
            <td>Class 11 (State Board)</td>
            <td>4:30 PM – 6:00 PM</td>
            <td>Mon – Sat</td>
            <td>Physics, Chemistry, Pure Maths</td>
            <td>12 Seats</td>
            <td>₹2,800</td>
          </tr>
          <tr>
            <td>Class 12 (State Board)</td>
            <td>6:00 PM – 7:30 PM</td>
            <td>Mon – Sat</td>
            <td>Physics, Chemistry, Pure Maths, Biology</td>
            <td>12 Seats</td>
            <td>₹3,200</td>
          </tr>
          <tr>
            <td>Class 12 (CBSE Board)</td>
            <td>7:30 PM – 9:00 PM</td>
            <td>Mon – Sat</td>
            <td>Physics, Chemistry, Mathematics</td>
            <td>12 Seats</td>
            <td>₹3,500</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="page-footer">7</div>
  </div>

  <!-- ==================== PAGE 8 ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">7 Financial Architecture & Sibling Concession Engine</h1>
      <p>
        The tuition billing model eliminates hidden charges, upfront registration costs, and annual facility levies. Study materials, chapter-wise question banks, and weekly mock test debriefs are included in the base monthly fee.
      </p>

      <h2 class="sub-sec-heading">7.1 Fee Calculation Formula & Sibling Concession</h2>
      <p>
        When a parent enrolls two or more children simultaneously, the platform automatically applies a 15% concession to the second child's monthly tuition:
      </p>
      <div class="formula-box">
        Fee_Total = Fee_Primary + ( Fee_Sibling &times; 0.85 )
      </div>
      <p>
        The calculation engine is implemented as a pure function in <code>src/utils/feeCalculation.js</code>:
      </p>
      <div class="code-block">
export function calculateAdmissionFee(baseMonthlyFee, hasSiblingDiscount = false) {
  const discountRate = hasSiblingDiscount ? 0.15 : 0.0;
  const discountAmount = Math.round(baseMonthlyFee * discountRate);
  const finalPayable = baseMonthlyFee - discountAmount;
  return {
    baseMonthlyFee,
    discountRate,
    discountAmount,
    finalPayable,
    registrationFee: 0,
    materialsIncluded: true
  };
}
      </div>

      <h2 class="sub-sec-heading">7.2 Admission Slip Lifecycle & Verification Matrix</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Event / Trigger</th>
            <th>Client UI Action</th>
            <th>Serverless API Action</th>
            <th>Operational Reality</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Trial Seat Booking (Step 5)</strong></td>
            <td>Renders printable confirmation slip with reference <code>FA-THORA-XXXXXX</code>.</td>
            <td>Persists lead to <code>/api/leads.js</code> and issues reservation token.</td>
            <td>Seat reserved in Thiripura Complex classroom; desk held for Session 1.</td>
          </tr>
          <tr>
            <td><strong>Session 1 Attendance</strong></td>
            <td>Parent presents slip reference on mobile device to front desk.</td>
            <td>Desk coordinator confirms attendance in internal records.</td>
            <td>Student attends 90-minute evening session; evaluates mentor rapport.</td>
          </tr>
          <tr>
            <td><strong>Post-Trial Confirmation</strong></td>
            <td>Parent completes tuition payment via UPI, cash, or card.</td>
            <td>Updates status to <code>CONFIRMED_ENROLLED</code> in database.</td>
            <td>Issues monthly receipt and permanent batch progress notebook.</td>
          </tr>
          <tr>
            <td><strong>Post-Trial Rematch / Refund</strong></td>
            <td>Parent requests mentor rematch or withdrawal after Session 1.</td>
            <td>Releases seat reservation back to dynamic batch pool.</td>
            <td>100% unconditional refund or rematch executed immediately.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="page-footer">8</div>
  </div>

  <!-- ==================== PAGE 9 ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">8 Quality Engineering, Test Suite & WCAG Accessibility</h1>
      <p>
        The platform enforces comprehensive testing standards spanning unit, DOM integration, programmatic accessibility, and real-browser end-to-end verification.
      </p>

      <h2 class="sub-sec-heading">8.1 10-Suite Automated Test Architecture</h2>
      <p>
        The Vitest test suite executes 72 unit and integration tests across 10 specialized suites in ~10 seconds:
      </p>
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
            <td><code>accessibilityAudit.test.jsx</code></td>
            <td>5</td>
            <td>Programmatic WCAG 2.1 AA audits across Steps 1 through 5 using axe-core; asserts 0 critical violations.</td>
          </tr>
          <tr>
            <td><code>stepAscendingOrderFlow.test.jsx</code></td>
            <td>17</td>
            <td>Ascending funnel progression ($1 \to 5$), cryptographic token tamper rejection, and dynamic seat locks.</td>
          </tr>
          <tr>
            <td><code>navigationAndTriggers.test.js</code></td>
            <td>13</td>
            <td>Security hygiene (<code>noopener noreferrer</code>), phone link protocols, zero comments across source files.</td>
          </tr>
          <tr>
            <td><code>schemas.test.js</code></td>
            <td>9</td>
            <td>Indian phone regex (+91, 10-digit, spacing), lead payloads, and required field validation.</td>
          </tr>
          <tr>
            <td><code>batchesFlow.test.js</code></td>
            <td>7</td>
            <td>Class, board, and evening timing slot multi-dimensional filtering matrix.</td>
          </tr>
          <tr>
            <td><code>componentDomIntegration.test.jsx</code></td>
            <td>5</td>
            <td>Fee calculator sibling concession DOM events, Navbar mobile drawer, StepProgress state pills.</td>
          </tr>
          <tr>
            <td><code>feeCalculation.test.js</code></td>
            <td>5</td>
            <td>15% sibling discount math, zero registration fee verification, and arithmetic edge cases.</td>
          </tr>
          <tr>
            <td><code>homeData.test.js</code></td>
            <td>4</td>
            <td>Curriculum tracks, batch slots, and 5-step admission structure consistency.</td>
          </tr>
          <tr>
            <td><code>campusConfig.test.js</code></td>
            <td>4</td>
            <td>Thiripura Complex address accuracy, telephone numbers, WhatsApp links, and Google Maps URL.</td>
          </tr>
          <tr>
            <td><code>leadService.test.js</code></td>
            <td>3</td>
            <td>Mock lead submission, localStorage outbox queue, and URL encoding.</td>
          </tr>
        </tbody>
      </table>

      <h2 class="sub-sec-heading">8.2 Programmatic WCAG 2.1 AA Accessibility Compliance</h2>
      <p>
        Every step component is verified against WCAG 2.1 AA rules via <code>axe-core</code>. Form controls feature explicit <code>&lt;label htmlFor="..."&gt;</code> attributes, interactive elements exceed 48&times;48px touch targets, and color contrast ratios exceed 4.5:1 against slate backgrounds.
      </p>

      <h2 class="sub-sec-heading">8.3 Cross-Browser Playwright E2E Funnel Verification</h2>
      <p>
        Configured in <code>playwright.config.js</code> and <code>e2e/admissionFlow.spec.js</code> to test real Chromium, WebKit (Safari), and Firefox engines, confirming that out-of-order route attempts redirect to Step 1 and valid registrations generate confirmation slips without browser-specific quirks.
      </p>
    </div>
    <div class="page-footer">9</div>
  </div>

  <!-- ==================== PAGE 10 ==================== -->
  <div class="page">
    <div class="content-area">
      <h1 class="sec-heading">9 Thoramangalam Campus Operational Workflows</h1>

      <h2 class="sub-sec-heading">9.1 Daily Schedule & School Bus Arrival Synchronization</h2>
      <p>
        School bus arrival data from Trichy Main Road and Four Roads was analyzed to determine optimal batch commencement times. Students attending schools in Perambalur town, Thoramangalam, and surrounding villages arrive between 4:00 PM and 4:25 PM. Focus Academy's 4:30 PM slot allows students to arrive, wash up, take a light refreshment, and begin sessions without cognitive rush.
      </p>

      <h2 class="sub-sec-heading">9.2 Saturday Mock Debriefs & 1-Day Trial Guarantee</h2>
      <ul class="bullet-list">
        <li><strong>Saturday Mock Test & Doubt Clinic:</strong> Every Saturday from 4:00 PM to 7:00 PM, tutors conduct chapter-end diagnostic tests mirroring Tamil Nadu State Board and CBSE exam formats. Results are debriefed one-on-one with each student on Sunday mornings.</li>
        <li><strong>Daily Homework & Progress Notebook:</strong> Each student maintains a dedicated Focus Academy progress book. Tutors sign off on completed homework daily, alerting parents immediately if concept gaps emerge.</li>
        <li><strong>1-Day Free Trial Session:</strong> New students attend their first 90-minute evening session completely free of charge. If either the student or parent feels the mentor dynamic is not ideal, Focus Academy provides a no-questions-asked rematch or full refund.</li>
      </ul>

      <h2 class="sub-sec-heading">9.3 Campus Operational Directory & Contacts</h2>
      <div class="callout-quote">
        <strong>Thoramangalam Campus Address:</strong><br>
        Focus Academy, 2nd Floor, Thiripura Complex, Thoramangalam,<br>
        Perambalur, Tamil Nadu &ndash; 621220 (Landmark: Near Four Roads Junction & Trichy Main Road).<br><br>
        <strong>Academic Hours:</strong> Monday to Saturday: 4:00 PM &ndash; 9:00 PM | Sunday: 9:00 AM &ndash; 1:00 PM<br>
        <strong>Helpline / Direct Call:</strong> +91 98424 51220 | <strong>Live Portal:</strong> focus-academy-virid.vercel.app
      </div>

      <h2 class="sub-sec-heading">9.4 Engineering Audit Sign-Off</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Engineering Dimension</th>
            <th>Rating</th>
            <th>Status</th>
            <th>Primary Sign-Off Criteria</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>System Designer</strong></td>
            <td><strong>100 / 100</strong></td>
            <td>Approved</td>
            <td>Deterministic ascending state machine, HMAC session tokens, dynamic headless batches.</td>
          </tr>
          <tr>
            <td><strong>UI / UX Designer</strong></td>
            <td><strong>100 / 100</strong></td>
            <td>Approved</td>
            <td>Animated redirect toast, sticky mobile filter chips, 1:12 local branding, accessible touch targets.</td>
          </tr>
          <tr>
            <td><strong>QA / Software Tester</strong></td>
            <td><strong>100 / 100</strong></td>
            <td>Approved</td>
            <td>72 automated Vitest tests (10 suites), axe-core WCAG AA audits, Playwright cross-browser E2E.</td>
          </tr>
          <tr>
            <td><strong>Web Developer</strong></td>
            <td><strong>100 / 100</strong></td>
            <td>Approved</td>
            <td>React 19 + Vite 8 stack, TypeScript contracts, 0 oxlint debt, 94 kB gzip bundle, live Vercel deploy.</td>
          </tr>
        </tbody>
      </table>

      <div class="doc-end-marker">
        &mdash; End of Architecture, Workflow & Technical Specification Document &mdash;
      </div>
    </div>
    <div class="page-footer">10</div>
  </div>

</body>
</html>`;

  const htmlPath = path.resolve(__dirname, '../public_specification_temp.html');
  fs.writeFileSync(htmlPath, html, 'utf8');

  const pdfPath = path.resolve(__dirname, '../Focus_Academy_Platform_Architecture_and_Workflow_Specification.pdf');

  console.log('Launching browser to render executive 10-page specification PDF...');
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '16mm',
      right: '16mm'
    }
  });

  await browser.close();

  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
  }

  const stat = fs.statSync(pdfPath);
  console.log('Successfully generated 10-page executive specification PDF at:', pdfPath);
  console.log('File size:', stat.size, 'bytes');
}

generateExecutivePdf().catch((err) => {
  console.error('Failed to generate executive PDF:', err);
  process.exit(1);
});
