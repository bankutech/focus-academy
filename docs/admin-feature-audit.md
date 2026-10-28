# Admin Feature Audit Report

Date: 2026-10-27
Scope: enrollment records, enrollment management actions, transfer messaging, payment ledger,
false-success error handling, and every section in the admin navigation.

Verification commands run:

| Gate | Command | Result |
| --- | --- | --- |
| Unit / component tests | `npm test` | **31 files, 391 tests passed** |
| Lint | `npm run lint` | **0 errors, 0 warnings** after this pass |
| Type check | `npm run typecheck` | **Passed**, no errors |
| Production build | `npm run build` | **Passed** (`dist/` produced) |
| End-to-end (chromium) | `npx playwright test --project=chromium` | **34 passed, 2 failed** — both failures pre-existing and unrelated (see "Remaining defects") |

---

## 1. Enrollment records

| Item | Detail |
| --- | --- |
| **Feature** | Enrollment submission → admin enrollment list → student roster → dashboard count |
| **Original problem** | The final enrollment form wrote three unrelated records: a `leads` doc (id `FA-<hex>`), an `enrollments` doc (only when the student was signed in), and a browser `localStorage` slip (id `FA-<timestamp>`). Nothing ever reached the official `students` roster, so an admin had to re-create each student by hand. Because the client and server generated different IDs for the same submission, the dashboard merged duplicates or dropped records; a failed Firestore read silently fell back to browser-local data, so records "disappeared" on refresh. Duplicate retries created a second lead/enrollment each time. |
| **Code changes** | `api/leads.js` (submission idempotency + new `finalizeEnrollment()` pipeline), `src/pages/EnrollPage.jsx` (sends a stable `enrollmentId` and `isWaitlisted`; the direct client write now uses `{merge:true}` so it cannot overwrite the server record), `src/services/adminDataService.js` (`getEnrollments`, `getLeads`, `getStudents`, `getDashboardMetrics`). |
| **Database / API changes** | For every completed enrollment the API now writes, idempotently: `leads/{enrollmentId}` with `status:'converted'`, `enrollments/{enrollmentId}` (status, fee/payment status, links), `students/{FA-YYYY-NNN}` (allocated from a `counters/admissions-YYYY` transaction, collision-checked) and `fee_obligations/{OBL-<enrollmentId>-YYYY}` (pending, `amountPaid: 0`). Matching seat hold is released to `enrolled` so capacity counts each student exactly once. Duplicate submissions are detected by idempotency key, enrollment ID and phone+name+batch within 24 h and return the original record instead of creating another. Waitlisted applications stay `waitlisted` (no student, no fee) instead of being promoted into a confirmed seat. |
| **Tests performed** | `tests/apiEndpoints.test.js` (extended): full pipeline test asserts lead + enrollment + student + obligation written, zero payments invented, seat counted once; duplicate-submission test asserts exactly 1 lead/enrollment/student/obligation after a resubmit; waitlist test asserts no student and no obligation. `tests/enrollmentManagement.test.js` (new, 10 tests) covers listing, editing, transitions and persistence. E2E `adminPortalFlow.spec.js` now opens the Enrollments & Admission Inquiries page and asserts the "Enrollment Records (Admission Funnel)" section renders. |
| **Result** | **Fixed.** Completed enrollments receive a unique enrollment ID, land in the correct collections, appear in the admin enrollment list and the Students roster without manual re-creation, and survive refresh (reads now surface errors instead of silently returning browser-local data). Dashboard `totalEnrollments` counts the enrollment documents themselves. |
| **Remaining blocker** | Requires `FIREBASE_SERVICE_ACCOUNT` on the hosting provider; without it the API returns 503 and the form queues the submission on the device (existing, documented behaviour). |

## 2. Transfer message / actions

| Item | Detail |
| --- | --- |
| **Feature** | Batch transfer vs completed-enrollment presentation |
| **Original problem** | Every student row led with a button titled "Transfer Batch", the modal said "Transfer Batch: <name>", and there was no view showing that a student had simply completed an enrollment — so a newly enrolled student read as "being transferred". |
| **Code changes** | `src/pages/admin/AdminStudentsPage.jsx`. |
| **Database / API changes** | None (`transferStudentBatch()` unchanged and still used for real batch moves, including internal batch changes made while editing an enrollment). |
| **Tests performed** | `tests/adminDataService.test.js` transfer test still passes; e2e student-module navigation passes; lint clean. |
| **Result** | **Fixed.** The action is now labelled "Change Batch" with a tooltip restricting it to moving an *already enrolled* student; the modal explains that enrollments are already registered in their selected batch and need no transfer; the student profile now opens with an **Enrollment Summary** panel showing exactly: enrollment completed, student registered, selected batch, enrollment date, admission ID, fee status, payment status. |
| **Remaining blocker** | None. |

## 3. Enrollment records editable / deletable / status management

| Item | Detail |
| --- | --- |
| **Feature** | Enrollment management actions on `Admin Portal → Inquiries & Leads` |
| **Original problem** | No enrollment record could be opened, edited, re-stated or removed from the active list; the only action was archiving the *lead*. |
| **Code changes** | `src/pages/admin/AdminLeadsPage.jsx` (new Enrollment Records table with View / Edit / Status / Archive and four modals), `src/services/adminDataService.js` (new `getEnrollmentById`, `updateEnrollment`, `updateEnrollmentStatus`, `archiveEnrollment`, `ENROLLMENT_STATUSES`, `ENROLLMENT_TRANSITIONS`). |
| **Database / API changes** | Every mutation writes to `enrollments/{id}` **and** the linked `leads/{id}` doc, plus the linked `students` doc where one exists; each write is read back from Firestore before success is reported. Statuses: pending, confirmed, waitlisted, cancelled, archived with validated transitions (confirmed → waitlisted and other illegal moves are rejected with the allowed set in the message). Confirming an enrollment with no roster record calls `createStudent()` (which also creates the first fee obligation). Cancelling is blocked while verified payments exist and tells the admin to reverse receipts first or archive instead; archiving removes the record from the default active list while preserving obligations, payments and audit entries. A batch change made through Edit goes through `transferStudentBatch()` so seat counts and the audit trail stay correct. |
| **Tests performed** | New `tests/enrollmentManagement.test.js`: edit persisted outside React state, invalid phone/batch/field/id rejected with no change saved, confirm creates student + unpaid obligation + increments batch seats, illegal transitions and missing reasons rejected, cancellation blocked with payments, archive keeps payments/obligations/audit intact, missing-lead status update throws instead of reporting success. E2E covers navigation to the section. |
| **Result** | **Fixed**, with no fake UI: every button calls the service, refreshes from the database afterwards and shows the real success or error message. |
| **Remaining blocker** | Hard *deletion* of documents is intentionally blocked by `firestore.rules` (`allow delete: if false` for enrollments, students, payments, audit logs); removal from the active list is implemented as archive/cancel, which is the audit-safe workflow the requirement allows. |

## 4. Payment ledger

| Item | Detail |
| --- | --- |
| **Feature** | `Admin Portal → Ledger & Payments` + dashboard/reports totals |
| **Original problem** | Enrollments never produced a fee obligation, so there was nothing to pay against; payment records lacked verification/receipt/refund status and any enrollment link; failed reads silently returned a local (empty) list, hiding real receipts. |
| **Code changes** | `src/services/adminDataService.js` (`recordPayment`, `recordPaymentLive`, `reversePayment`, `reversePaymentLive`, `createFeeObligation`, `getPayments`, `getFeeObligations`), `src/pages/admin/AdminLedgerPage.jsx`, `src/pages/admin/AdminStudentsPage.jsx`, `firestore.rules`. |
| **Database / API changes** | Enrollment now creates the pending fee obligation that feeds the ledger. Every payment record carries: transaction ID, receipt number, student ID + name, enrollment ID, fee obligation ID, amount in INR, payment date/time, method, gateway transaction ID / UTR (`referenceNumber`), `verificationStatus`, `receiptStatus`, `refundStatus` and `status`. Reversal sets `status` and `refundStatus` to `reversed` and restores the balance (rules updated to permit exactly those two extra keys on update). Duplicate references are blocked institute-wide (local check + `payment_refs` transaction guard); receipt numbers come from a `counters/receipts-YYYY` transaction, so retries cannot double-issue. Reads now throw on failure instead of returning an empty local list. |
| **Tests performed** | New payment tests: three payments across two students all listed with unique IDs and receipt numbers, partial payments reduce the balance correctly, duplicate reference rejected, over-balance and zero amounts rejected, reversal marks the transaction reversed and restores the balance. Ledger UI additions (status column, verified/reversed/pending filter, count + verified-total strip, search by student/enrollment/obligation ID) verified by lint/build/unit tests. |
| **Result** | **Fixed for real administrator-recorded payments.** Multiple students and multiple payments per student all appear; partial payments and balances are consistent across ledger, student profile, obligations, dashboard and reports; refresh/logout cannot delete history (all reads are server-side). |
| **Remaining blocker** | **No payment gateway is integrated with the enrollment form** — the project has no gateway credentials or webhook. Nothing is recorded as paid on enrollment: the fee obligation stays `pending`/`unpaid` and the enrollment record says so explicitly in the UI. Online verification must not be claimed until a gateway is configured. |

## 5. Database errors reporting false success

| Item | Detail |
| --- | --- |
| **Feature** | All administrator write actions in `adminDataService.js` |
| **Original problem** | `updateLeadStatus()` caught the Firestore error, still wrote an audit entry and returned `{success:true}`. `openTillSession()` swallowed its write failure and returned a "saved" session. Most read methods silently fell back to browser-local data (empty) so failures looked like empty-but-successful results. |
| **Code changes** | `src/services/adminDataService.js` (all read/write paths), plus load-error banners in `AdminLedgerPage`, `AdminStudentsPage`, `AdminBatchesPage`, `AdminFeesPage`, `AdminReportsPage`, `AdminAuditLogsPage`. |
| **Database / API changes** | None structural; writes now verify by read-back (`updateLeadStatus`, `updateEnrollment*`, `openTillSession`, `updateAdminRole` already did). |
| **Tests performed** | `tests/enrollmentManagement.test.js` (missing lead → throws), full suite, lint. |
| **Result** | **Fixed.** Every write either succeeds and is read back, or throws a message that names the problem; reads surface the error in the page instead of rendering an empty list. Status values are validated before hitting the database. |
| **Remaining blocker** | None. |

## 6. Permissions and account separation

| Item | Detail |
| --- | --- |
| **Feature** | Admin access control |
| **Original problem** | Not broken; verified rather than changed. |
| **Verification** | `AdminProtectedRoute` redirects unauthenticated users to the login route and shows an Access Denied screen for non-allowlisted accounts; `verifyPermission()` enforces six roles (`owner` / `administrator` / `admissions` / `fee_manager` / `teacher` / `read_only`) inside every privileged service method; `firestore.rules` enforces owner, admissions and finance scopes server-side; `api/payments.js` requires `canRecordPayments`, `api/whatsapp.js` requires `canTriggerReminders`, and `api/admin/ops-health.js` requires `canManageSettings`; admin navigation hides modules the role cannot use. |
| **Tests performed** | `tests/adminRoleAuthorization.test.js` (17), `tests/securityAudit.test.js` (11), and `tests/operationalControls.test.js` (20) pass. |
| **Result** | **Fixed.** The previous rules treated every allow-listed staff email as an owner; owner access is now limited to the three owner addresses (or an owner claim). Admissions can manage student/admission records but not money, reconciliation, roles or settings. Teachers and read-only accounts can view the roster/batches only. Audit entries must carry the authenticated actor's email, and payments must carry the authenticated recorder's email. |
| **Remaining blocker** | A user who navigates directly to a hidden module still reaches the page shell; every read/write is denied by Firestore rules or the service permission gate, so no data is exposed or changed. Server-side role claims must match the `authorizedAdmins` record for full separation. |

## 7. Section-by-section navigation status

| Nav section | Status | Notes |
| --- | --- | --- |
| Dashboard | Works | Counts come from `students`, `enrollments`, `batches`, `obligations`, `payments`; partial failures now surface in the amber banner with a Retry button. |
| Inquiries & Leads | **Rebuilt** | Now hosts the Enrollment Records table (view/edit/status/archive) plus the inquiry pipeline; "Register" only appears when no roster record exists yet. |
| Batches | Works | Load failures now reported in-page; create/update/archive/delete throw real errors. |
| Students | Works | Edit, lifecycle, discount, archive/restore, CSV import, ledger/profile (with new Enrollment Summary); edit- and archive-time load failures reported. |
| Fee Schedules | Works | Cycle generation, waivers; load failures reported. |
| Ledger & Payments | Works | Record/reverse/till/receipt printing + new status column, filters and totals. |
| WhatsApp Reminders | Works, config-dependent | Needs `WHATSAPP_CLOUD_API_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` for automated delivery; without them the API honestly reports `deliveryChannel: manual_click_to_chat_fallback` and the UI opens a click-to-chat message. |
| Reports & Analytics | Works | Exports, reconciliation, collection reports; load failures now shown with Retry. |
| Audit Logs | Works | JSON/CSV export; load failures now shown with Retry. |
| Academy Settings | Works | Persists to `academy_settings/main_config`; role changes run in a transaction with read-back verification; `authorizedAdmins` only editable by owners (rules + service). |

## 8. Operational controls added in this pass (28 October 2026)

| Control | Implementation | Verification | Honest status |
| --- | --- | --- | --- |
| **Student lifecycle** | `withdrawStudent()` archives the student, releases the seat and requires a written reason. Fee obligations, receipts, waivers and audit entries are left untouched. Lifecycle status + batch occupancy now commit in one Firestore transaction; a failure rolls both back. Re-enrolment uses `restoreStudent()`, which re-checks capacity. | `tests/operationalControls.test.js` (archive preserves obligations/payments, reason required, teacher blocked, restore works) and `tests/livePaymentLedger.test.js` (transactional archive). | **Tested locally with a mocked Firestore transaction.** Not exercised against production. |
| **Batch transfer atomicity** | The live path previously updated only the student and swallowed batch-counter failures. It now writes the student plus both batch counters in one transaction and throws on failure. | `tests/livePaymentLedger.test.js` asserts both counters move and a simulated transaction failure leaves all three documents unchanged. | **Tested locally with mocks.** The production Firestore path is the same SDK call, but has not been run against the live project. |
| **Daily collection reconciliation** | New `collection_reconciliations` collection. An authorised finance user records independently counted cash, UPI, bank, card and cheque totals against the ledger's recorded net receipts for one business date. The record stores method-level differences, status (`reconciled` / `discrepancy`), verifier, explanation and revision history. Payments and obligations are never modified. | `tests/operationalControls.test.js` (match, discrepancy, reversed/refunded exclusion, revision history, authorisation, future/negative rejection) and `tests/livePaymentLedger.test.js` (persists centrally; a failed write records no audit entry). | **Tested locally and against a mocked live Firestore.** Production API/collection not deployed by this pass. |
| **Action-required dashboard** | `src/components/admin/actionItems.js` derives alerts only from loaded records: pending admissions, overdue fees, 7-day upcoming dues, data-source failures, unactivated accounts, near-capacity batches, missing/discrepant reconciliations, failed notifications and stale backups. Every item links to the working module. | `tests/operationalControls.test.js` checks each source item and that clean records produce no alerts. | **Tested locally (pure function + loaded dashboard data).** |
| **Operational health** | New admin-only `GET /api/admin/ops-health` returns aggregate counts/timestamps for Firestore latency, pending admissions, failed sync records, failed/pending notifications, reconciliation state, open till sessions and backup age. It returns no names, phones, amounts or secrets. | `tests/apiEndpoints.test.js` verifies admin access, 403 for admissions, aggregate values and absence of student data. | **Tested locally with a mocked Firestore/API.** Not deployed or probed on production. |
| **Backup integrity** | Snapshots are version 2 with a checksum over the complete payload. Restore refuses missing/mismatched checksums, validates record IDs and fails loudly instead of warning when a central write fails. The UI no longer claims the download is encrypted. | `tests/operationalControls.test.js` (checksum, tamper rejection, owner-only restore, successful restore). | **Local restore verified with non-production seed data. No off-site production backup or restore drill exists.** |
| **Report accuracy** | Reports now exclude reversed/refunded receipts from collections, collection rate and method split; financial CSV exports label reversed rows explicitly. Every CSV export now checks `canExportData` before generating data. | Full unit suite + build; report totals share the same valid-payment predicate as chart helpers. | **Tested locally.** |

### Remaining owner decisions and production gaps

1. **No off-site backup**: the checksum-verified JSON snapshot is downloaded by an owner and must be stored in an approved encrypted location. Firestore scheduled exports are not configured in this repository and were not tested.
2. **`FIREBASE_SERVICE_ACCOUNT` is still absent from Vercel**, so production Firestore, the new ops-health endpoint and the reconciliation collection remain unverified live. Only code-level and mocked-Firestore verification was possible.
3. **Server custom claims**: Firestore rules fall back to a fixed email list for owner/administrator/finance access. If staff are added in `authorizedAdmins` without matching Firebase custom claims, the client SDK will deny their writes even though the service allowlist recognises them. Set `role` claims when provisioning staff or keep the email list aligned.
4. **No advance-payment, refund-after-reversal or automatic sibling-discount rule** has been invented; these remain explicit owner decisions.
5. **Reconciliation is desk verification, not a bank feed**: an administrator enters figures from the bank/UPI statement and cash count. There is no automated bank integration.

## Remaining defects and blockers (honest list)

1. **`e2e/authSplitScreen.spec.js:50` fails** — the admin register panel shows a vertical scrollbar at 1280×720. This is pre-existing: the auth pages (`AuthFields.jsx`, `StudentLoginPage.jsx`, `AdminLoginPage.jsx`) carried uncommitted modifications from before this task and were not touched here.
2. **`e2e/_probe2.spec.js` fails** — an untracked diagnostic probe left in `e2e/` by an earlier session (it only prints scroll metrics). It is not part of the product tests; remove it if you want a green `npm run test:e2e`.
3. **Full `npm run test:e2e` also needs msedge/firefox/webkit browsers**, which are not installed on this machine; only the chromium project was run (34 passed).
4. **No local `.env`** exists (only `.env.example`): live Firestore, the admissions API and WhatsApp delivery cannot be exercised here. Required for production: `FIREBASE_SERVICE_ACCOUNT`, `SESSION_SECRET`, optionally `WHATSAPP_CLOUD_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `LEAD_WEBHOOK_URL`.
5. **No payment gateway** — see section 4. Fees created by enrollment are pending until an administrator records a verified payment.
6. **Lint warnings** (21) are the pre-existing baseline (unused vars / exhaustive-deps) and were not introduced by this work.