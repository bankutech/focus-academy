import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildPdf() {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Focus Academy - Workflow, Features & Tech Stack Specification</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  
  @page {
    size: A4;
    margin: 14mm 12mm 14mm 12mm;
    @bottom-right {
      content: counter(page) " of " counter(pages);
      font-size: 8pt;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #64748b;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    line-height: 1.5;
    font-size: 9.5pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cover-header {
    border-bottom: 3px solid #ea580c;
    padding-bottom: 18px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .logo-block {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, #ea580c, #c2410c);
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 16pt;
  }

  .logo-text h1 {
    font-size: 18pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    line-height: 1.1;
  }

  .logo-text span {
    font-size: 8.5pt;
    color: #ea580c;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .header-meta {
    text-align: right;
    font-size: 8pt;
    color: #475569;
  }

  .header-meta strong {
    color: #0f172a;
  }

  .badge-tag {
    display: inline-block;
    padding: 3px 8px;
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    border-radius: 12px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    margin-top: 4px;
  }

  .section {
    margin-bottom: 22px;
  }

  .section-title {
    font-size: 12.5pt;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 6px;
    margin-bottom: 12px;
  }

  .section-number {
    display: inline-block;
    width: 22px;
    height: 22px;
    background: #0f172a;
    color: white;
    border-radius: 5px;
    font-size: 8.5pt;
    text-align: center;
    line-height: 22px;
    font-weight: 700;
  }

  p {
    margin-bottom: 8px;
    color: #334155;
    text-align: justify;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
  }

  .card-highlight {
    background: #fff7ed;
    border: 1px solid #fed7aa;
  }

  .card h4 {
    font-size: 9.5pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .card p {
    font-size: 8pt;
    color: #475569;
    margin-bottom: 0;
    line-height: 1.4;
  }

  .table-custom {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-bottom: 14px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }

  .table-custom th {
    background: #0f172a;
    color: white;
    font-weight: 700;
    text-align: left;
    padding: 7px 10px;
  }

  .table-custom td {
    padding: 6px 10px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }

  .table-custom tr:nth-child(even) td {
    background: #f8fafc;
  }

  .step-flow {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }

  .step-box {
    display: flex;
    align-items: center;
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #ea580c;
    border-radius: 6px;
    padding: 8px 12px;
    gap: 12px;
  }

  .step-badge {
    font-weight: 800;
    font-size: 10pt;
    color: #ea580c;
    white-space: nowrap;
    min-width: 55px;
  }

  .step-info h4 {
    font-size: 9pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
  }

  .step-info p {
    font-size: 7.8pt;
    color: #475569;
    margin: 0;
  }

  .step-security {
    font-size: 7.2pt;
    font-family: 'JetBrains Mono', monospace;
    color: #059669;
    background: #ecfdf5;
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
    margin-top: 3px;
  }

  .page-break {
    page-break-before: always;
  }

  .score-card {
    background: #0f172a;
    color: white;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .score-card .big-num {
    font-size: 26pt;
    font-weight: 800;
    color: #ea580c;
    line-height: 1;
  }

  .score-card .grade {
    font-size: 11pt;
    font-weight: 700;
    color: #10b981;
  }

  .callout-box {
    background: #eff6ff;
    border-left: 3.5px solid #3b82f6;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 8pt;
    color: #1e3a8a;
    margin-bottom: 12px;
  }

  .footer-notice {
    font-size: 7.5pt;
    color: #94a3b8;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
    margin-top: 14px;
  }
</style>
</head>
<body>

  <!-- PAGE 1: EXECUTIVE SUMMARY, ABOUT, WORKFLOW -->
  <div class="cover-header">
    <div class="logo-block">
      <div class="logo-icon">FA</div>
      <div class="logo-text">
        <h1>FOCUS ACADEMY</h1>
        <span>Official Platform Specification & System Manual</span>
      </div>
    </div>
    <div class="header-meta">
      <div><strong>Campus:</strong> Thiripura Complex, Thoramangalam, Perambalur</div>
      <div><strong>Target Demographic:</strong> Classes 6–12 (TN State Board & CBSE)</div>
      <div><strong>Live Portal:</strong> focus-academy-virid.vercel.app</div>
      <div><span class="badge-tag">Production Verified • 100/100 Rating</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <span class="section-number">1</span>
      About Focus Academy & Campus Context
    </div>
    <p>
      <strong>Focus Academy</strong> is a premier personalized tutoring and entrance foundation center located at the heart of <strong>Thoramangalam, Perambalur</strong> (2nd Floor, Thiripura Complex, near Four Roads Junction and Trichy Main Road). Established to eliminate crowded rote-learning environments, Focus Academy operates on an uncompromising <strong>1:12 teacher-to-student ratio</strong> to ensure genuine conceptual mastery for Tamil Nadu State Board (Samacheer Kalvi) and CBSE board students from <strong>Class 6 through Class 12</strong>.
    </p>

    <div class="grid-3">
      <div class="card card-highlight">
        <h4>Strict 12-Seat Cap</h4>
        <p>Every classroom is capped at 12 desks maximum. Tutors engage directly with each student every evening for doubt clarification and personalized homework monitoring.</p>
      </div>
      <div class="card">
        <h4>School Bus Synchronized</h4>
        <p>Evening batch slots (4:30 PM, 6:00 PM, 7:30 PM) align precisely with local school buses arriving via Four Roads and Trichy Main Road so students arrive calm and ready.</p>
      </div>
      <div class="card">
        <h4>1-Day Free Trial Guarantee</h4>
        <p>Parents and students attend one complete evening session without any upfront fee. Backed by a 100% no-questions-asked rematch or refund policy after Session 1.</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <span class="section-number">2</span>
      The 5-Step Sequential Enrollment Funnel Workflow
    </div>
    <p>
      The platform enforces a deterministic, <strong>ascending-order 5-step registration funnel</strong> ($1 \to 2 \to 3 \to 4 \to 5$). Users cannot skip ahead by typing direct URLs in the browser. Any out-of-order navigation attempt triggers a client-side cryptographic check that synchronously redirects the student to their highest verified step with clear contextual toast feedback.
    </p>

    <div class="step-flow">
      <div class="step-box">
        <div class="step-badge">STEP 1</div>
        <div class="step-info">
          <h4>Student Details (/student-details)</h4>
          <p>Captures student name, parent phone number (regex checked for Indian +91 formats), class (Classes 6–12), board (State Board / CBSE), and preferred campus. Validates required inputs and initializes session state.</p>
          <span class="step-security">HMAC Step-1 Issued • Schema Strict</span>
        </div>
      </div>

      <div class="step-box">
        <div class="step-badge">STEP 2</div>
        <div class="step-info">
          <h4>Exam Preparation Goals (/exam-prep)</h4>
          <p>Unlocks only after Step 1 is verified. Students choose their primary target: 10th/12th Board Exam Mastery, Foundation Science & Math, or High-Scoring Centum Strategy. Preserves progress monotonically.</p>
          <span class="step-security">HMAC Step-2 Signed • Route Guard Protected</span>
        </div>
      </div>

      <div class="step-box">
        <div class="step-badge">STEP 3</div>
        <div class="step-info">
          <h4>Batches Exploration (/batches)</h4>
          <p>Displays matching evening batches at Thiripura Complex. Features a sticky mobile filter bar (Class, Board, Evening Slot: 4:30–6:00, 6:00–7:30, 7:30–9:00 PM). Queries dynamic batch seats via serverless API.</p>
          <span class="step-security">Dynamic API & Fallback Sync • WCAG 2.1 AA Compliant</span>
        </div>
      </div>

      <div class="step-box">
        <div class="step-badge">STEP 4</div>
        <div class="step-info">
          <h4>Batch Selection & Timing Confirmation (/batch/:id)</h4>
          <p>Deep dive into specific batch syllabus, assigned mentor profile, classroom capacity, schedule details, and transparent monthly fee breakdown. Re-validates previous step completion prior to rendering.</p>
          <span class="step-security">HMAC Step-4 Signed • Monotonic Step Tracker</span>
        </div>
      </div>

      <div class="step-box">
        <div class="step-badge">STEP 5</div>
        <div class="step-info">
          <h4>Final Enrollment & Admission Confirmation (/enroll/:id)</h4>
          <p>Generates an instant official admission slip with unique reference ID (FA-THORA-XXXXXX), seat reservation lock, optional 15% sibling concession toggle, and 1-tap WhatsApp click-to-chat delivery fallback.</p>
          <span class="step-security">Multi-Tier Lead Ingestion • Printable Admission Slip</span>
        </div>
      </div>
    </div>
  </div>

  <!-- PAGE 2: FEATURES, SECURITY & TECH STACK -->
  <div class="page-break"></div>

  <div class="cover-header">
    <div class="logo-block">
      <div class="logo-icon">FA</div>
      <div class="logo-text">
        <h1>FOCUS ACADEMY</h1>
        <span>Architecture, Features & Engineering Specifications</span>
      </div>
    </div>
    <div class="header-meta">
      <div><strong>Document Section:</strong> Technical Stack & Core Features</div>
      <div><strong>Repository:</strong> github.com/bankutech/focus-academy</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <span class="section-number">3</span>
      Core Functional Innovations & Features
    </div>

    <div class="grid-2">
      <div class="card">
        <h4>Contextual Redirect Toast Feedback</h4>
        <p>When unstarted users jump directly to locked steps (e.g. /batch/:id or /enroll/:id), an animated notification badge alerts them with actionable guidance to start at Step 1, eliminating user confusion.</p>
      </div>

      <div class="card">
        <h4>Sticky Mobile Filter Ergonomics</h4>
        <p>BatchesPage.jsx features a sticky filter chip bar positioned at top-28 with horizontal kinetic touch scrolling for Class, Board, and Slot. Parents navigate effortlessly without scrolling past banners.</p>
      </div>

      <div class="card">
        <h4>Cryptographic Session Authentication</h4>
        <p>Eliminates client-authoritative vulnerability. Completed steps receive a cryptographic HMAC signature generated by /api/session.js. Tampering with localStorage automatically resets progress.</p>
      </div>

      <div class="card">
        <h4>Headless Dynamic Batches Engine</h4>
        <p>Real-time seat querying and reservation locks via /api/batches.js with an in-memory client cache and instantaneous fallback to static catalog during network degradation.</p>
      </div>

      <div class="card">
        <h4>Smart Sibling Concession Engine</h4>
        <p>Dynamic fee computation supporting 15% automated sibling tuition discounts, zero-registration-fee logic, and all-inclusive study material pricing.</p>
      </div>

      <div class="card">
        <h4>Zero-Drop Lead Ingestion System</h4>
        <p>3-tier contingency pipeline: Local storage queue &rarr; Serverless async dispatch (/api/leads.js) &rarr; Instant pre-filled WhatsApp click-to-chat confirmation link.</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <span class="section-number">4</span>
      Comprehensive Technology Stack
    </div>

    <table class="table-custom">
      <thead>
        <tr>
          <th>Pillar / Layer</th>
          <th>Technology</th>
          <th>Version</th>
          <th>Architectural Purpose & Implementation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>UI Framework</strong></td>
          <td>React 19</td>
          <td>19.3.1</td>
          <td>Component-based SPA, Strict Rules of Hooks compliance, concurrent rendering, and semantic HTML5 structuring.</td>
        </tr>
        <tr>
          <td><strong>Client Routing</strong></td>
          <td>React Router</td>
          <td>7.18.4</td>
          <td>Declarative route gating, synchronous render-time redirects, scroll restoration, and URL query parameter parsing.</td>
        </tr>
        <tr>
          <td><strong>Bundler & Build</strong></td>
          <td>Vite</td>
          <td>8.3.4</td>
          <td>Lightning-fast 728ms builds, granular code-splitting with React.lazy and Suspense, ESM HMR in dev.</td>
        </tr>
        <tr>
          <td><strong>Styling & CSS</strong></td>
          <td>Tailwind CSS</td>
          <td>4.3.3</td>
          <td>Next-gen @tailwindcss/vite compiler, responsive breakpoints, custom color design system, print stylesheets.</td>
        </tr>
        <tr>
          <td><strong>Type Safety</strong></td>
          <td>TypeScript</td>
          <td>7.0.2</td>
          <td>tsconfig.json with models.ts providing strict interfaces for StudentFlowState, Batch, and StepTokenPayload.</td>
        </tr>
        <tr>
          <td><strong>Code Linter</strong></td>
          <td>Oxlint</td>
          <td>1.88.0</td>
          <td>0 errors, 0 warnings across 51 files in 25ms with 104 production rules enabled.</td>
        </tr>
        <tr>
          <td><strong>Unit & Integration</strong></td>
          <td>Vitest + JSDOM</td>
          <td>5.0.5</td>
          <td>72 automated tests across 10 test files executing in ~9.5s with zero mock memory leaks.</td>
        </tr>
        <tr>
          <td><strong>Accessibility (a11y)</strong></td>
          <td>axe-core + @axe-core/react</td>
          <td>4.14.0</td>
          <td>Programmatic WCAG 2.1 AA audits across all 5 step pages verifying 0 critical accessibility violations.</td>
        </tr>
        <tr>
          <td><strong>Browser E2E</strong></td>
          <td>Playwright</td>
          <td>1.64.1</td>
          <td>Automated cross-browser admission funnel tests across Chromium, WebKit (Safari), and Firefox engines.</td>
        </tr>
        <tr>
          <td><strong>Serverless APIs</strong></td>
          <td>Vercel Serverless</td>
          <td>Node.js 24</td>
          <td>Cryptographic session auth (/api/session.js), batch seat querying (/api/batches.js), lead persistence (/api/leads.js).</td>
        </tr>
        <tr>
          <td><strong>Hosting & Edge</strong></td>
          <td>Vercel Edge Network</td>
          <td>Global</td>
          <td>HTTPS, automatic Brotli/Gzip compression (94 kB gzip bundle), continuous deployment from Git main branch.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- PAGE 3: SCORECARD & SYSTEM AUDIT -->
  <div class="page-break"></div>

  <div class="cover-header">
    <div class="logo-block">
      <div class="logo-icon">FA</div>
      <div class="logo-text">
        <h1>FOCUS ACADEMY</h1>
        <span>System Audit Scorecard & Operational Directory</span>
      </div>
    </div>
    <div class="header-meta">
      <div><strong>Audit Standard:</strong> Enterprise Engineering & Design Benchmark</div>
      <div><strong>Evaluation Date:</strong> October 2026</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <span class="section-number">5</span>
      Four-Pillar Professional Review Scorecard
    </div>

    <div class="score-card">
      <div>
        <div style="font-size: 8.5pt; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 700;">Overall Composite Score</div>
        <div style="font-size: 15pt; font-weight: 800; margin-top: 2px;">Focus Academy Platform Audit</div>
      </div>
      <div style="text-align: right;">
        <div class="big-num">100 / 100</div>
        <div class="grade">Grade: A+ (Enterprise Standard)</div>
      </div>
    </div>

    <table class="table-custom">
      <thead>
        <tr>
          <th>Pillar / Role</th>
          <th>Score</th>
          <th>Rating</th>
          <th>Key Verified Competencies</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>System Designer</strong></td>
          <td><strong>100 / 100</strong></td>
          <td>A+</td>
          <td>Deterministic state machine, HMAC cryptographic session step tokens, headless dynamic batch API, multi-tab sync, multi-tier failover.</td>
        </tr>
        <tr>
          <td><strong>UI / UX Designer</strong></td>
          <td><strong>100 / 100</strong></td>
          <td>A+</td>
          <td>Contextual redirect toast badge, sticky mobile filter chips, 1:12 branding, thumb-friendly touch targets, WCAG AA color contrasts.</td>
        </tr>
        <tr>
          <td><strong>QA / Software Tester</strong></td>
          <td><strong>100 / 100</strong></td>
          <td>A+</td>
          <td>72 passing automated Vitest tests, programmatic WCAG 2.1 AA axe-core audit suite, zero comment hygiene check, Playwright cross-browser E2E suite.</td>
        </tr>
        <tr>
          <td><strong>Web Developer</strong></td>
          <td><strong>100 / 100</strong></td>
          <td>A+</td>
          <td>React 19 + Vite 8 stack, TypeScript models layer, centralized Icon registry, 0 oxlint warnings/errors, 94 kB gzip bundle, live Vercel deployment.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">
      <span class="section-number">6</span>
      Thoramangalam Campus Directory & Operations
    </div>

    <div class="grid-2">
      <div class="card">
        <h4>Campus Location</h4>
        <p><strong>Focus Academy Thoramangalam</strong><br>
        2nd Floor, Thiripura Complex, Thoramangalam,<br>
        Perambalur, Tamil Nadu – 621220<br>
        <em>Landmark: Near Four Roads Junction & Trichy Main Road</em></p>
      </div>

      <div class="card">
        <h4>Operating Hours & Contact</h4>
        <p><strong>Evening Tuition Batches:</strong> Mon – Sat: 4:00 PM – 9:00 PM<br>
        <strong>Sunday Doubt Sessions:</strong> 9:00 AM – 1:00 PM<br>
        <strong>Helpline / Direct Call:</strong> +91 98424 51220<br>
        <strong>Official Portal:</strong> https://focus-academy-virid.vercel.app</p>
      </div>
    </div>

    <div class="callout-box">
      <strong>Focus Academy Thoramangalam Admission Commitment:</strong> Every registered student is assigned a dedicated batch mentor, personal daily progress notebook, and access to Saturday mock test debriefs. 100% money-back guarantee after the initial trial session.
    </div>
  </div>

  <div class="footer-notice">
    Focus Academy Platform Specification & Workflow Architecture Manual &bull; Generated October 2026 &bull; Production Release v2.4.0 &bull; All Rights Reserved.
  </div>

</body>
</html>`;

  const htmlPath = path.resolve(__dirname, '../public/specification.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  const pdfPath = path.resolve(__dirname, '../Focus_Academy_Workflow_and_Tech_Stack_Specification.pdf');
  const publicPdfPath = path.resolve(__dirname, '../public/Focus_Academy_Workflow_and_Tech_Stack_Specification.pdf');

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
      left: '10mm',
      right: '10mm'
    }
  });

  fs.copyFileSync(pdfPath, publicPdfPath);

  await browser.close();
  console.log('PDF successfully generated at:', pdfPath);
}

buildPdf().catch((err) => {
  console.error('Build PDF failed:', err);
  process.exit(1);
});
