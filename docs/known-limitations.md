# Focus Academy — Known Limitations & Architectural Disclosures

**Date:** 28 October 2026  
**Status:** Certified with Disclosures (production persistence blocked on hosting configuration)

---

## 0. Current Production Status (28 October 2026)

- `GET https://focus-academy-virid.vercel.app/api/health` returns **HTTP 503**. `node_runtime` and `step_token_secret` are healthy; `firestore` reports `Missing required environment variables: FIREBASE_SERVICE_ACCOUNT`.
- Every database-backed API (`/api/batches`, `/api/leads`, `/api/enrollments`, `/api/session`) therefore returns the structured 503 response. The public site still loads, but online admission cannot be persisted centrally until the owner adds the service-account variable in Vercel and redeploys.
- The repository fixes in this pass (single-writer enrollment, self-healing legacy enrollment documents, student-portal API, atomic payment/due-date updates, removal of demo-data fallbacks) take effect only after the next authorized deployment. Nothing was pushed or deployed during the audit.
- The student dashboard now requires the deployed `/api/student-portal` function. Until that deployment, the dashboard shows an error rather than fabricated or device-local figures.
- The operational additions in this pass (`collection_reconciliations`, six-role administration, `/api/admin/ops-health`, transactional lifecycle/transfer, checksum-verified backup restore) are tested locally and against a mocked Firestore only. They are not deployed and have not been exercised against the production Firestore project.

### Operational controls added (28 October 2026)

- **Roles:** `owner`, `administrator`, `admissions`, `fee_manager`, `teacher`, `read_only`. The previous rules gave every allow-listed staff email owner privileges; that escalation path has been removed. Firestore rules still use a fixed owner/administrator/finance email list as a fallback, so staff added only to `authorizedAdmins` should also receive a matching Firebase custom claim (`role`).
- **Daily reconciliation:** an authorised finance user records independently counted cash/UPI/bank/card/cheque totals for a business date. The system stores the difference and revision history and flags discrepancies; it never edits receipts automatically. This is manual desk verification, not an automated bank feed.
- **Backups:** snapshots are checksum-verified JSON containing personal and financial data. Restore is owner-only and rejects missing/mismatched checksums. No off-site/scheduled Firestore export or restore drill is configured; the owner must store downloads in an approved encrypted location.
- **Teacher/read-only access:** these accounts can view the roster and batches only. Direct navigation to a hidden financial page reaches the page shell, but Firestore rules and service permissions deny the underlying reads/writes.

### Billing policy boundaries (owner decisions still required)

- Implemented: monthly/quarterly/half-yearly/yearly cycles anchored on the **5th of the month (Asia/Kolkata)**; next due date advances from the last settled cycle. Full payments close the cycle; partial payments keep the original due date open; waivers reduce the obligation but are never counted as collections; reversals restore the balance and remove the transaction from collections.
- Not implemented: **advance payments covering future, not-yet-generated cycles** (the ledger rejects any amount above the current open balance), **cash refunds after a reversal** (reversal is the only correction path), and **automatic sibling discounts** (discounts/waivers are applied explicitly by an administrator). These need an owner-approved rule before they are added.
- **Account linking:** a student account is linked to a roster record by verified `studentUid` or by guardian mobile **plus exact normalized student name**. Shared guardian phones (siblings) are therefore safe, but a student who registers under a different spelling must ask the campus desk to set `studentUid` on the roster record. The portal shows “pending synchronization” instead of guessing.

---

## 1. Disclosed Technical Limitations

In accordance with Section 2 of the engineering guidelines, the following real-world limitations and operational boundaries are explicitly disclosed:

### 1.1 WhatsApp Outbound Linking vs. Delivery Receipts
- Generating a `https://wa.me/919842451220?text=...` URI is a client-side intent invocation. Opening WhatsApp on the student or parent's phone confirms that the application composed the enrollment docket, but **does not constitute cryptographic proof of message delivery** or confirmation of admission by the institute director. Final seat allocation requires direct communication with institute counselors.

### 1.2 Google Maps Embed & Offline Rendering
- The campus map on the Contact page utilizes a lazy-loaded Google Maps iframe (`maps.google.com/maps?q=Thiripura+Complex...`). When visitors are operating under completely offline conditions or with strict content-blockers, the embedded map cannot render tiles. A prominent, accessible text address and direct directions hyperlink (`https://maps.google.com/?q=...`) are provided as accessible fallbacks.

### 1.3 Offline Inquiries Synchronization
- The `LeadService` offline queue persists unsent inquiries in browser `localStorage`. While queued inquiries automatically sync upon network restoration, this relies on the user returning to or keeping the website tab open. If the browser cache is manually cleared while offline before returning online, queued inquiries will be purged.

### 1.4 Live Real-Time Seat Counters vs. Batch Capacity Policy
- Batch capacity is strictly capped at 12 students per batch according to institute policy. In the event that serverless backend connectivity is temporarily interrupted, the frontend defaults to verified static batch capacities rather than displaying artificial dynamic countdown timers.

### 1.5 Tuition Fee Projections as Non-Contractual Quotations
- The Tuition Fee Calculator provides provisional educational estimates based on standard hourly rates (₹180–₹340/hr) and documented sibling/quarterly concessions. The calculator is an informational planning tool and does not process direct monetary transactions. Official fee schedules are finalized during on-campus enrollment review at Thiripura Complex.

### 1.6 Operational Monitoring Scope
- `/api/admin/ops-health` reports aggregate Firestore latency, queue/notification counts, reconciliation state and backup age. It does not capture arbitrary API failures, server logs, provider webhooks or background-job traces. Those require a hosting-level log drain or an external monitoring service, which is not configured here.

### 1.7 Production SMS Gateway
- Automated SMS dispatch via telecom DLT gateways (TRAI regulations) is currently not wired directly to the web client; lead notifications are routed via direct WhatsApp webhook and cellular telephone contact.
