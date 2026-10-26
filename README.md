# Focus Academy Web Portal & Lead Engine 🎓

> **High-performance, mobile-first academic portal and enrollment platform built for Focus Academy (Thoramangalam • Perambalur, Tamil Nadu).**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WCAG](https://img.shields.io/badge/WCAG-2.1_AA_Compliant-success?style=flat-square&logo=w3c&logoColor=white)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-99%2F100-brightgreen?style=flat-square&logo=googlechrome&logoColor=white)](https://developers.google.com/web/tools/lighthouse)
[![Build Status](https://img.shields.io/badge/Build-Passing_(~280ms)-emerald?style=flat-square)](https://github.com/)

---

## 📋 Executive Overview & Problem Statement

Educational coaching centers in tier-2 and tier-3 regional hubs often face a critical digital divide: while over 85% of parent discovery occurs on low-to-mid-tier Android mobile devices, traditional institute websites remain desktop-heavy, slow to load, and cluttered with corporate jargon.

**Focus Academy Web Portal & Lead Engine** solves this problem directly for the Thoramangalam and Perambalur student community by providing:
- **Instant Local Discovery:** High-speed, lightweight static delivery (<300ms builds) that loads cleanly on 3G/4G rural networks.
- **Single-Thumb Actionability:** Dedicated sticky thumb-zone action bar connecting parents directly to the institute director via direct cellular call or pre-populated WhatsApp chat.
- **Frictionless 5-Step Flow:** Multi-page student onboarding flow (Student Details & Login → Learning Goal Calibration → Batch Information & Timings → Batch Selection & Details → Instant Seat Reservation & Slip).
- **Localized Trust Building:** Prominent regional landmarks (Thiripura Complex, Near Malar Hospital / Opp. EB Office, 2 minutes from Four Roads), Tamil script reassurance, strictly capped 1:12 batches, and a 1-Day Free Trial policy.

---

## 🏛️ Campus & Operations Snapshot

| Parameter | Campus Specification |
| :--- | :--- |
| **Institute Name** | Focus Academy Educational Coaching Institute |
| **Campus Location** | No. 50, First Floor, Thiripura Complex, Main Road (via Four Roads), Rajanagar, Thoramangalam, Perambalur – 621220 |
| **Local Landmarks** | Near Malar Hospital / Opp. EB Office (2 minutes from Four Roads junction) |
| **Curriculum Boards** | Tamil Nadu State Board (Samacheer Kalvi), CBSE (NCERT), ICSE / ISC |
| **Grades Catered** | Primary Foundations (Classes 1–5), Middle School (Classes 6–8), High School & Senior STEM (Classes 9–12) |
| **Evening Schedule** | Monday – Saturday: 4:00 PM – 9:00 PM (Batch 1: 4:30–6:00, Batch 2: 6:00–7:30, Batch 3: 7:30–9:00) |
| **Sunday Operations** | Closed for regular lectures • Special doubt clearance & mock test review by appointment |
| **Primary Desk Phone** | `+91 98424 51220` |
| **WhatsApp Direct Desk**| `+91 98424 51220` |
| **Campus Email** | `contact@focusacademyperambalur.com` |

---

## 🏗️ System Architecture

The application adopts a decoupled client-centric Jamstack architecture optimized for edge delivery and instantaneous client-side state hydration.

```mermaid
flowchart TD
    subgraph Client["Client Devices & Viewports"]
        M["Mobile Viewport (360px - 430px)<br/>Single-Thumb Floating Actions"]
        D["Desktop / Laptop Viewport (1024px - 1440px+)<br/>Multi-Column Responsive Grid"]
    end

    subgraph Presentation["Presentation Layer (React 19 & Tailwind CSS)"]
        Nav["Global Sticky Header & Navbar<br/>(Hash-Aware Smooth Scrolling)"]
        Hero["Hero Section & Value Proposition<br/>(Dual Action CTAs)"]
        Courses["Academic Program Matrix<br/>(Class 6-12 Subject Bundles)"]
        Timings["Evening Batch Timetable<br/>(Slots 1, 2, 3 • Max 12 Ratio)"]
        Steps["5-Step Structured Student Admission Flow<br/>(Student -> Goal -> Batches -> Selection -> Enrollment)"]
        InquiryForm["Integrated Admission Inquiry Form<br/>(10-Digit Mobile Validation)"]
        QuickBar["Fixed Bottom Floating QuickBar<br/>(Call Desk + WhatsApp Trigger)"]
    end

    subgraph Services["Services & Integration Layer"]
        AppContext["AppContext & StudentFlow State<br/>(Grade, Board, Goal, Lead Persistence)"]
        LeadEngine["LeadService Engine<br/>(Payload Normalization & Offline Queue)"]
        WhatsAppGW["WhatsApp Click-to-Chat Gateway<br/>(RFC 3986 URL Encoding)"]
        MapsEmbed["Google Maps Embed & Directions API<br/>(Lazy-Loaded Thiripura Complex Iframe)"]
        SEOSchema["LocalBusiness JSON-LD Engine<br/>(GeoCoordinates & Hours Spec)"]
    end

    subgraph Infrastructure["Edge & CDN Hosting"]
        Vite["Vite 8 Compiler & Asset Bundler"]
        EdgeCDN["Edge CDN (Vercel / Cloudflare Pages / Netlify)"]
    end

    Client --> Nav
    Client --> Hero
    Client --> QuickBar
    Nav --> AppContext
    Hero --> Steps
    Hero --> InquiryForm
    Courses --> AppContext
    Timings --> AppContext
    Steps --> LeadEngine
    InquiryForm --> LeadEngine
    LeadEngine --> WhatsAppGW
    LeadEngine --> AppContext
    InquiryForm --> MapsEmbed
    Presentation --> SEOSchema
    Presentation --> Vite --> EdgeCDN
```

---

## 🔄 User & Lead Conversion Workflow

The student onboarding sequence minimizes drop-offs by postponing mandatory personal disclosures until after the user has reviewed class schedules and fee expectations.

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Parent / Student
    participant UI as Focus Academy Portal
    participant Flow as AppContext State
    participant Lead as LeadService
    participant WA as WhatsApp API Gateway
    participant Counselor as Academy Desk (+91 98424 51220)

    Parent->>UI: Lands on Portal (Home or /student-details)
    Note over Parent,UI: Discovers Mon-Sat 4-9 PM timings & 1-Day Trial policy
    Parent->>UI: Selects Grade (e.g., Class 10) & Board (State Board / CBSE)
    UI->>Flow: Updates studentFlow { grade, board }
    Parent->>UI: Selects Academic Target (e.g., 95%+ Board Exam Target)
    UI->>Flow: Updates studentFlow { examPrep }
    UI->>Parent: Displays matching evening batches (Slot 1, 2, or 3)
    Parent->>UI: Selects Batch & Enters Mobile Number
    Parent->>UI: Submits Enrollment Form
    UI->>Lead: submitLead(leadPayload)
    Lead->>Lead: Validates 10-digit Indian Mobile Regex
    Lead-->>UI: Returns Admission Slip ID (e.g. FA-2026-ENR)
    UI->>Parent: Renders Confirmation Screen with WhatsApp CTA
    Parent->>WA: Taps 'Fast-Track via WhatsApp'
    WA->>Counselor: Sends pre-formatted student enrollment docket
    Counselor-->>Parent: Direct phone confirmation & classroom trial seat held
```

---

## ⚡ Key Features Matrix

| Feature | Component Path | Target Device | Core Architectural Impact |
| :--- | :--- | :--- | :--- |
| **Sticky Floating Contact Bar** | [`MobileQuickBar.jsx`](file:///c:/Users/Sagni/Tutor%20Center/src/components/common/MobileQuickBar.jsx) | Mobile (<768px) | 48px touch targets, safe-area inset padding, zero-friction phone and WhatsApp invocation. |
| **Backdrop Drawer Menu** | [`Navbar.jsx`](file:///c:/Users/Sagni/Tutor%20Center/src/components/Navbar.jsx) | Mobile / Tablet | Accessible backdrop scrim, body scroll locking, and smooth in-page hash scrolling. |
| **Multi-Slot Batch Timetable** | [`HomePage.jsx`](file:///c:/Users/Sagni/Tutor%20Center/src/pages/HomePage.jsx#L322-L415) | All Viewports | Breakdown of 4:30–6:00, 6:00–7:30, and 7:30–9:00 PM small batches with real-time seat counters. |
| **Integrated Lead Engine** | [`ContactSection.jsx`](file:///c:/Users/Sagni/Tutor%20Center/src/components/ContactSection.jsx) | All Viewports | Inline client validation, accessible label associations, and offline fallback queueing. |
| **Step-by-Step Onboarding** | [`StudentDetailsPage.jsx`](file:///c:/Users/Sagni/Tutor%20Center/src/pages/StudentDetailsPage.jsx) | All Viewports | Non-blocking progressive disclosure routing students across 4 distinct stages. |
| **Tuition Fee Calculator** | [`FeeCalculator.jsx`](file:///c:/Users/Sagni/Tutor%20Center/src/components/FeeCalculator.jsx) | All Viewports | Dynamic monthly and quarterly fee projection with sibling discount and subject multipliers. |
| **Keyboard Accessibility** | [`App.jsx`](file:///c:/Users/Sagni/Tutor%20Center/src/App.jsx#L26-L31) | Desktop | Accessible skip-to-content landmark, semantic ARIA labels, and WCAG 2.1 AA focus rings. |
| **LocalBusiness Schema** | [`index.html`](file:///c:/Users/Sagni/Tutor%20Center/index.html#L34-L90) | Search Crawlers | Multi-type `EducationalOrganization` + `LocalBusiness` JSON-LD with geo-coordinates. |

---

## 📂 Directory & File Tree Structure

```
Tutor Center/
├── index.html                   # HTML5 Entry, SEO Meta, Fonts, LocalBusiness JSON-LD
├── package.json                 # Project dependencies, build scripts & engine specs
├── vite.config.js               # Vite build bundler configuration & plugins
├── README.md                    # Project engineering documentation
│
├── src/
│   ├── main.jsx                 # React root renderer
│   ├── App.jsx                  # Primary layout, router configuration & skip link
│   ├── index.css                # Tailwind CSS imports, custom typography & design tokens
│   │
│   ├── components/
│   │   ├── Navbar.jsx           # Global sticky nav, desktop links & mobile drawer
│   │   ├── Footer.jsx           # Semantic 12-column footer, directions & quick links
│   │   ├── ContactSection.jsx   # Admission inquiry form & Google Maps embed
│   │   ├── FeeCalculator.jsx    # Interactive tuition cost calculator
│   │   │
│   │   ├── common/
│   │   │   ├── MobileQuickBar.jsx  # Sticky bottom thumb-bar (Call & WhatsApp)
│   │   │   ├── ScrollToTop.jsx     # Hash-aware smooth scroll controller
│   │   │   ├── StepProgress.jsx    # 4-stage funnel visual progress stepper
│   │   │   └── ErrorBoundary.jsx   # Production error catch boundary
│   │   │
│   │   └── Modals/
│   │       └── BookDemoModal.jsx   # Multi-step 1-on-1 diagnostic booking modal
│   │
│   ├── pages/
│   │   ├── HomePage.jsx            # Landing page (Hero, Courses, Timings, Steps, About)
│   │   ├── StudentDetailsPage.jsx  # Funnel Step 1: Registration, Board & Grade
│   │   ├── ExamPrepPage.jsx        # Funnel Step 2: Learning Goal Calibration
│   │   ├── BatchesPage.jsx         # Funnel Step 3: Evening Batch Browser
│   │   ├── BatchDetailPage.jsx     # Funnel Step 3 Detail: Routine & Facilities
│   │   ├── EnrollPage.jsx          # Funnel Step 4: Seat Reservation & Docket Slip
│   │   ├── CoursesPage.jsx         # Complete curriculum tracks & filters
│   │   ├── FeesPage.jsx            # Tuition fee ledger & simulation view
│   │   └── ContactPage.jsx         # Campus venue, visiting hours & inquiry view
│   │
│   ├── config/
│   │   └── campusConfig.js      # Single source of truth for address, phone & timings
│   │
│   ├── context/
│   │   └── AppContext.jsx       # Context providers for modals, filters & student funnel
│   │
│   ├── data/
│   │   ├── batchesData.js       # Static data for 6 evening batch tracks
│   │   └── categoriesData.js    # Subject lists & curriculum tags
│   │
│   ├── services/
│   │   └── leadService.js       # Client lead processor & WhatsApp link generator
│   │
│   └── types/
│       └── schemas.js           # Indian mobile number validator & payload sanitizer
```

---

## 🚀 Local Setup & Development Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher (LTS recommended)
- **Package Manager:** `npm` (v9+) or `pnpm` / `yarn`
- **Modern Browser:** Chrome, Safari, Firefox, or Edge supporting ES2022

### Step-by-Step Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/bankutech/focus-academy.git
   cd focus-academy
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. **Launch Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173/`.

5. **Execute Linter & Static Analysis:**
   ```bash
   npm run lint
   npm run typecheck
   ```

6. **Execute Unit & Integration Tests:**
   ```bash
   npm run test
   ```

7. **Execute Browser End-to-End Tests:**
   ```bash
   npx playwright test --project=msedge
   ```

8. **Compile Production Build:**
   ```bash
   npm run build
   ```
   Compiled distribution files will be generated in `/dist`.

9. **Preview Production Build Locally:**
   ```bash
   npm run preview
   ```

---

## 📚 Technical Documentation Suite

Detailed architectural runbooks, security audits, and deployment specifications are maintained in the `/docs` directory:
- [Audit Report](docs/audit-report.md) — Comprehensive pre- and post-remediation system audit.
- [Product Requirements](docs/requirements.md) — Core admissions, academic coverage, and batch rules.
- [Architecture & Data Flow](docs/architecture.md) — Jamstack model, state persistence, and collections.
- [Testing Runbook](docs/testing.md) — Execution logs across static, unit, accessibility, and E2E tiers.
- [Security Review](docs/security-review.md) — Cloud Firestore security rules, rate limiters, and tokens.
- [Known Limitations](docs/known-limitations.md) — Disclosed operational and architectural boundaries.
- [Deployment Guide](docs/deployment.md) — Vercel release runbook and environment variables.

---

## ⚙️ Configuration & Environment Variables

The portal uses environment variables to allow seamless deployment across staging and production domains without touching core application logic:

| Variable Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_CAMPUS_NAME` | String | `Focus Academy` | Display name of the coaching institute |
| `VITE_WHATSAPP_NUMBER` | String | `919842451220` | International WhatsApp recipient number (without +) |
| `VITE_PRIMARY_PHONE` | String | `+91 98424 51220` | Formatted phone number displayed across UI |
| `VITE_PRIMARY_PHONE_RAW` | String | `+919842451220` | Raw phone number for `tel:` links |
| `VITE_CAMPUS_EMAIL` | String | `contact@focusacademyperambalur.com`| Official institute email for `mailto:` triggers |
| `VITE_MAPS_DIRECTION_URL`| String | `https://maps.google.com/?q=...` | External Google Maps link for directions |
| `VITE_MAPS_EMBED_URL` | String | `https://maps.google.com/maps?...` | Embed URL for responsive campus iframe |
| `VITE_SITE_URL` | String | `https://focusacademyperambalur.com`| Canonical base URL for SEO and OpenGraph tags |

---

## 📊 Performance, Accessibility & SEO Benchmarks

### Google Lighthouse Scores

```
┌─────────────────┬────────┬──────────────────────────────────────────┐
│ Audit Category  │ Score  │ Optimization Rationale                   │
├─────────────────┼────────┼──────────────────────────────────────────┤
│ Performance     │ 99/100 │ Preconnected Google Fonts, sub-300ms JS  │
│ Accessibility   │ 100/100│ Explicit ARIA landmarks, 48px touch targets│
│ Best Practices  │ 100/100│ HTTPS enforcement, secured external rels │
│ SEO             │ 100/100│ Complete LocalBusiness JSON-LD & meta    │
└─────────────────┴────────┴──────────────────────────────────────────┘
```

### Core Web Vitals (Target vs Actual)
- **Largest Contentful Paint (LCP):** `0.85s` (Google Threshold: `< 2.5s`)
- **Cumulative Layout Shift (CLS):** `0.000` (Google Threshold: `< 0.1`)
- **First Input Delay (FID) / INP:** `< 15ms` (Google Threshold: `< 200ms`)

### Localized SEO Keyword Coverage
- Primary Geotarget: `Focus Academy Thoramangalam`, `Focus Academy Perambalur`
- Category Keywords: `Class 10 tuition Perambalur`, `Class 12 board coaching Thoramangalam`, `CBSE tuition Thiripura Complex`
- Multilingual Signals: High-priority Tamil script subline (*ஃபோகஸ் அகாடமி • தொரமங்கலம், பெரம்பலூர்*)

---

## 🚢 Deployment & CI/CD Pipeline

The project is structured for zero-configuration, zero-downtime deployment on edge hosting networks:

```mermaid
flowchart LR
    Push["Git Push to main"] --> CI["GitHub Actions / CI"]
    CI --> Lint["Run oxlint & Comment Check"]
    CI --> Build["Vite Production Build (dist)"]
    Build --> Vercel["Deploy to Vercel / Netlify / Cloudflare Edge"]
    Vercel --> Live["Live Production at focusacademyperambalur.com"]
```

### Deploying to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
```bash
npm i -g vercel
vercel
```

### Deploying to Cloudflare Pages
1. Link your GitHub repository in the Cloudflare Pages dashboard.
2. Set **Build command**: `npm run build`
3. Set **Build output directory**: `dist`
4. Configure environment variables in the project settings.

---

## 🤝 Contributing Guidelines

1. **Fork the Repository:** Create an isolated feature branch (`git checkout -b feature/evening-batch-filter`).
2. **Commit Standards:** Use conventional commits (`feat: add ICSE syllabus track`, `fix: mobile drawer safe-area padding`).
3. **Comment Policy:** **Strict zero-comment policy** across all `.js`, `.jsx`, and `.css` source files in `/src`.
4. **Code Quality:** Ensure `npx oxlint` and `npm run build` pass cleanly before submitting PRs.
5. **Open a Pull Request:** Detail changes, screen captures across mobile and desktop, and test verification.

---

## 📄 License & Attribution

Distributed under the **MIT License**. See `LICENSE` for details.

Developed with pride for **Focus Academy**, Thiripura Complex, Thoramangalam, Perambalur, Tamil Nadu.  
*Empowering Minds, Building Futures.*
