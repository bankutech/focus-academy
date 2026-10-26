# Focus Academy Web Portal & Lead Engine — Full-Stack Audit Report

**Date:** 26 October 2026  
**Auditor / Architect:** Principal Software Architect & QA Lead  
**Repository:** [https://github.com/bankutech/focus-academy](https://github.com/bankutech/focus-academy)  
**Live Preview Target:** [https://focus-academy-virid.vercel.app/](https://focus-academy-virid.vercel.app/)  
**Environment:** React 19.3.1, Vite 8.3.4, Tailwind CSS 4.3.3, Cloud Firestore, Vercel Edge Runtime  

---

## 1. Executive Summary

A comprehensive full-stack engineering audit was performed on the Focus Academy repository. The project is an educational coaching web application and administrative portal for **Focus Academy Educational Coaching Institute** located in **Thoramangalam, Perambalur, Tamil Nadu**. 

Prior to remediation, the codebase possessed strong architectural foundations (modular directory structure, structured state management, edge deployment configs, and accessibility test suites), but exhibited several critical defects, runtime reference errors, dead code, race conditions in mocked test suites, and broken filtering logic on academic discovery views.

All identified defects have been systematically diagnosed, resolved, and verified against unit, integration, accessibility, and end-to-end browser test suites.

---

## 2. Existing Architecture & Directory Map

```
Tutor Center/
├── api/                           # Vercel Serverless Function Endpoints
│   ├── _lib/                      # Internal backend libraries (Auth, Crypto, HTTP)
│   ├── batches.js                 # Real-time batch capacity & transactional reservations
│   ├── leads.js                   # Normalized lead capture & rate-limited persistence
│   ├── session.js                 # Cryptographic multi-step funnel admission session tokens
│   └── whatsapp.js                # Secure server-side WhatsApp webhook dispatch
├── e2e/                           # Playwright End-to-End Test Specifications
│   ├── adminPortalFlow.spec.js    # Administrator authentication, navigation, and ledger
│   ├── admissionFlow.spec.js      # 5-step sequential admission funnel
│   ├── authSplitScreen.spec.js    # Responsive split-screen login/register layout
│   └── multiStudentIsolation.spec.js # Sibling isolation & sticky navbar verification
├── public/                        # Static assets, campus photographs, SVG/PNG logos
├── src/
│   ├── components/                # Modular UI presentation components
│   │   ├── admin/                 # Admin data tables, ledger modals, and charts
│   │   ├── common/                # Shared buttons, badges, quickbars, step progress
│   │   └── Modals/                # Demo booking dialogs
│   ├── config/                    # Campus metadata & regional landmarks (campusConfig.js)
│   ├── context/                   # React context providers (AppContext, StudentFlowContext)
│   ├── data/                      # Source of truth batches, categories, and programs
│   ├── pages/                     # Public routing & administration pages
│   ├── services/                  # LeadService, BatchService, AdminDataService, Firebase
│   └── types/                     # Data schemas, timing validators, and sanitization
├── tests/                         # Vitest unit, schema, and axe-core accessibility tests
├── firestore.rules                # Production Cloud Firestore Security Rules
├── vercel.json                    # Edge security headers & client-side route rewrites
└── vite.config.js                 # Bundler and test configuration
```

---

## 3. Findings & Defect Inventory

### 3.1 Critical Runtime Reference Error in `EnrollPage.jsx`
- **Defect:** `MessageSquare` icon was rendered inside the post-submission WhatsApp confirmation block (`EnrollPage.jsx:579`), but was omitted from the top-level `lucide-react` import statement.
- **Impact:** Upon completing an admission inquiry, attempting to render the WhatsApp notification button triggered a critical unhandled `ReferenceError: MessageSquare is not defined`, crashing the confirmation screen.
- **Resolution:** Added `MessageSquare` to `lucide-react` imports and pruned unused icons (`Calendar`, `Building`, `CreditCard`, `UserCheck`).

### 3.2 Duplicate Till Management Engine in `adminDataService.js`
- **Defect:** Four till management methods (`getActiveTillSession`, `openTillSession`, `closeTillSession`, `getTillSessions`) were declared twice in the `AdminDataService` object (lines 2371–2524 and 3232–3401). The second declaration took completely different argument shapes (`{ openingFloat }` vs `(initialFloat, notes, actor)`), breaking `AdminLedgerPage.jsx` and causing OxLint `no-dupe-keys` errors.
- **Impact:** Calling `openTillSession` from `AdminLedgerPage.jsx` passed positional arguments that destructuring evaluated as `NaN`, throwing an exception every time an administrator tried to open a cash drawer.
- **Resolution:** Unified the till session methods into a single, polymorphic implementation that accepts both object configurations and positional arguments, preserving full compatibility with both the UI and test suites.

### 3.3 Broken Course Filtering by Board in `CoursesPage.jsx`
- **Defect:** In `CoursesPage.jsx`, board filtering checked whether `course.category` or `course.title` contained `"state board"` or `"cbse"`. Because course categories are categorized as `"High School Tuition"` and `"Middle School"`, selecting any curriculum board resulted in 0 matching courses.
- **Impact:** Parents exploring courses by curriculum board (State Board vs. CBSE) were presented with an empty list.
- **Resolution:** Expanded search matching across `title`, `category`, `description`, `categoryId`, and `popularSubjects`, accurately mapping TN State Board (Samacheer Kalvi), CBSE (NCERT), and Competitive Foundation tracks.

### 3.4 E2E Test Timeout on Admin Ledger Navigation
- **Defect:** `e2e/adminPortalFlow.spec.js` timed out on `await expect(page.getByText('Record Verified Payment')).toBeVisible()`. `AdminDataService` called Firestore directly when `isFirebaseConfigured()` was true, causing requests with mock tokens to hang until an 8-second timeout expired (exceeding Playwright's 5-second assertion timeout).
- **Impact:** The administrator E2E suite failed consistently on local runs.
- **Resolution:** Refined `isLive()` in `adminDataService.js` to bypass network Firestore queries when `window.__E2E_SEED__` is set, instantly returning the verified in-memory store. Also connected `location.search` to `AdminLedgerPage`'s `useEffect`, ensuring query parameter deep-links immediately open the payment recording modal.

### 3.5 OxLint Code Quality & Regex Escapes
- **Defect:** 23 OxLint warnings including unnecessary regex character escapes (`/[–\-]/`), unused variables (`step1Done`, `createdCount`), and unreferenced imports across `BatchesPage`, `HomePage`, `AdminLeadsPage`, and `AdminLedgerPage`.
- **Impact:** Cluttered linter output and potential maintenance regressions.
- **Resolution:** Cleaned all unreferenced imports, fixed character classes to `/[–-]/`, and resolved all React hook dependency warnings. OxLint now passes with **0 warnings and 0 errors**.

---

## 4. Features Confirmed to Work

1. **5-Step Ascending Admission Funnel:**
   - Step 1: Student details, Indian 10-digit mobile validation, class & board selection.
   - Step 2: Learning goal calibration (Board 95%+, NEET/JEE Foundation, Conceptual Clarity).
   - Step 3: Batch discovery filtered by grade, board, and evening slot (1:12 capacity indicator).
   - Step 4: Batch detail view with classroom facilities, timing verification, and transit alignment.
   - Step 5: Enrollment review, operational inputs (school shift, dismissal time, travel buffer calculation), and idempotent lead capture.
2. **Tuition Fee Calculator:**
   - Dynamic monthly and quarterly fee projection with sibling concession (15% off) and weekly class hour calibration.
3. **Sticky Navigation & Mobile QuickBar:**
   - Sticky navbar elevation on scroll without ancestor layout shifts.
   - Bottom mobile action bar with 48px touch targets for direct phone call and pre-populated WhatsApp messaging.
4. **Local SEO & Structured Data:**
   - Dual `EducationalOrganization` and `LocalBusiness` JSON-LD schema matching physical campus at Thiripura Complex, Thoramangalam, Perambalur.
5. **Administrative Management Portal:**
   - Role-based route guard, split-screen authentication, active batch management, student directory, fee schedules, financial ledger with receipt printing, cash till session tracking, and audit trail logging.

---

## 5. Security & Persistence Baseline

- **Cloud Firestore Security Rules:** Public reads restricted strictly to `/batches`; student documents, fee obligations, payments, and audit logs require authenticated administrator or fee manager roles with email verification. Client writes to `/leads` and `/reservations` are forbidden (must flow through verified serverless API handlers).
- **Session Tokens:** Serverless endpoint `/api/session` signs multi-step admission tokens verifying stepwise progression before seat reservations or lead submissions are accepted.
- **Offline Resilience:** `LeadService` gracefully queues inquiries in browser local storage when offline and synchronizes automatically upon network reconnection.
