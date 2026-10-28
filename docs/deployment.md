# Focus Academy — Release & Deployment Guide

**Target Platform:** Vercel Edge & Cloud Firestore  
**Verified serving origin (2026-10-27):** `https://focus-academy-virid.vercel.app/`  
**Intended custom domain:** `https://focusacademyperambalur.com/` — did not resolve/serve (HTTP 000) during the audit  

> Canonical URLs, OpenGraph tags, `sitemap.xml`, `robots.txt` and the JSON-LD block all use the verified serving
> origin. When the custom domain is attached in Vercel, change it in those four files plus `VITE_SITE_URL`
> (`src/hooks/usePageMeta.js` reads it) and re-run the accessibility/SEO checks.

---

## 1. Build & Release Specification

### Build Configuration
- **Build Command:** `npm run build` (`vite build`)
- **Output Directory:** `dist`
- **Node Runtime:** Node.js 20+
- **Package Manager:** `npm` (with `package-lock.json` dependency pinning)

### Edge Rewrites & Security Headers (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 2. Environment Variables Checklist

The following environment variables must be configured in the hosting environment (Vercel Project Settings > Environment Variables):

| Variable Name | Environment | Sensitive? | Purpose |
| :--- | :--- | :--- | :--- |
| `SESSION_SECRET` | Production & Preview | **Yes** | Cryptographic key used to sign HMAC-SHA256 multi-step admission tokens (`api/session.js`). |
| `FIREBASE_SERVICE_ACCOUNT` | Production & Preview | **Yes** | Base64-encoded or raw JSON Google Cloud service account credentials for admin serverless functions. |
| `WHATSAPP_CLOUD_API_TOKEN` | Production Only | **Yes** | Meta Graph API access token for WhatsApp Business automation. |
| `WHATSAPP_PHONE_NUMBER_ID` | Production Only | No | Meta Business phone number identification ID. |
| `LEAD_WEBHOOK_URL` | Optional | No | Optional external CRM / Google Sheets webhook synchronization endpoint. |
| `VITE_FIREBASE_API_KEY` | All Environments | No | Public Firebase Web SDK API key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | All Environments | No | Firebase Auth domain (e.g. `focus-academy-7efeb.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | All Environments | No | Google Cloud Project ID (`focus-academy-7efeb`). |
| `VITE_FIREBASE_STORAGE_BUCKET`| All Environments | No | Cloud Storage bucket name. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| All Environments | No | Firebase Cloud Messaging Sender ID. |
| `VITE_FIREBASE_APP_ID` | All Environments | No | Firebase Web Application ID. |
| `VITE_ADMIN_ALLOWLIST` | Optional | No | Comma-delimited list of extra authorized administrator emails. |
### Configuring FIREBASE_SERVICE_ACCOUNT in Vercel

1. Open the [Firebase Console](https://console.firebase.google.com/) for project `focus-academy-7efeb`.
2. Navigate to **Project Settings** (gear icon) > **Service accounts**.
3. Under the **Firebase Admin SDK** tab, click **Generate new private key** and confirm.
4. Open the downloaded JSON file locally (do NOT commit this file to Git, paste it in public chat, or include it in client bundles).
5. Open your project in the [Vercel Dashboard](https://vercel.com/) > **Settings** > **Environment Variables**.
6. Add the environment variable:
   - **Key:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Paste the raw JSON string directly, OR encode as Base64 (`[Convert]::ToBase64String([System.IO.File]::ReadAllBytes('serviceAccountKey.json'))` in PowerShell) and paste the Base64 string. `api/_lib/firebaseAdmin.js` automatically detects and parses either format.
   - **Target Environments:** Select **Production** and **Preview**.
7. Trigger a redeployment in Vercel.
8. Verify that `https://focus-academy-virid.vercel.app/api/health` returns HTTP 200 with `"status":"ready"` and every check reporting `"ok":true`.

### Credential formats accepted by the backend

`api/_lib/firebaseAdmin.js` parses `FIREBASE_SERVICE_ACCOUNT` in any of these forms:

| Paste style | Example | Notes |
| :--- | :--- | :--- |
| Raw JSON | `{"type":"service_account","project_id":"focus-academy-7efeb",...}` | Preferred. |
| Quoted JSON | `"{\"type\":\"service_account\",...}"` | Leading/trailing quotes are stripped. |
| Base64 | `/9j/4AAQSkZJRg...` | Decoded automatically when the value does not start with `{`. |
| Escaped newlines | `"private_key":"-----BEGIN PRIVATE KEY-----\nMIIE..."` | Literal `\n` sequences are converted back into line breaks. |

Validation is fail-closed: `project_id`, `client_email` and a PEM `private_key` are required. Never commit the JSON to Git, paste it into chat, or expose it through a `VITE_` variable. The health endpoint only reports which variables are missing and whether the project matches; it never echoes credential values.

### Troubleshooting a 503 from `/api/health`

1. Read the `checks` object. `firebase_admin.ok:false` with `missing_environment` means the variable is absent for the environment that served the request. Confirm it is enabled for **Production** (and **Preview** if previews must work), not only Development.
2. Confirm the variable name is exactly `FIREBASE_SERVICE_ACCOUNT` with no surrounding spaces or quotes.
3. `firestore_project.ok:false` means the key belongs to a different Firebase project than `FIREBASE_PROJECT_ID` (defaults to `focus-academy-7efeb`). Generate a key from the correct project instead of reusing another academy's key.
4. `malformed_credentials`, `incomplete_credentials` or `malformed_private_key` mean the value was truncated or altered when pasted. Re-paste the downloaded JSON, or upload it with `vercel env add FIREBASE_SERVICE_ACCOUNT production`.
5. After any environment change, redeploy. Vercel does not apply new environment variables to an existing deployment.

### Production status observed on 28 October 2026

`GET https://focus-academy-virid.vercel.app/api/health` returned HTTP 503 with `firestore.detail = "Missing required environment variables: FIREBASE_SERVICE_ACCOUNT"` while `node_runtime` and `step_token_secret` were healthy. Every database-backed API (`/api/batches`, `/api/leads`, `/api/enrollments`) returned the structured 503 response. This is a hosting-configuration blocker, not a code failure: the variable must be added in Vercel by the project owner, after which the deployment must be redeployed and the health endpoint re-checked.

The operational additions in this repository (six-role administration, daily reconciliation, action-required dashboard, transactional lifecycle/transfer, `/api/admin/ops-health`, checksum-verified restore) were not deployed during this pass. Until they are, the production site does not contain these controls.

---

## 3. Pre-Deployment Verification Checklist

Before triggering a production deployment:
1. Run linter: `npm run lint` (Must pass with 0 errors and 0 warnings).
2. Run type check: `npm run typecheck` (Must pass with 0 errors).
3. Run unit & integration test suite: `npm run test` (All 31 test files must pass).
4. Run browser E2E test suite: `npx playwright test --project=msedge` (All installed specs must pass).
5. Compile production build: `npm run build` (The main shared chunk currently exceeds 500 kB minified, so the build emits a chunk-size warning).
6. Verify Cloud Firestore Security Rules: `firebase deploy --only firestore:rules` (Ensures rules match `firestore.rules`, including the six-role and reconciliation rules).
7. Grant Firebase custom claims (`role`: owner/administrator/admissions/fee_manager/teacher/read_only) to staff added through `authorizedAdmins`, or update the fallback email lists in `firestore.rules`.

---

## 4. Post-Deployment Verification Steps

After deployment completes:
1. Navigate to the live URL (`https://focus-academy-virid.vercel.app/`).
2. Verify homepage assets load eagerly (Campus photograph, SVG logo, fonts).
3. Click "Enroll" and test the complete 5-step funnel.
4. Verify phone call link triggers cellular dialer with `+919842451220`.
5. Verify WhatsApp button opens pre-populated chat with `919842451220`.
6. Inspect browser console for zero unhandled runtime exceptions.
7. Sign in as each staff role and confirm the hidden modules are absent and direct API writes return 403.
8. Call `GET /api/admin/ops-health` as an owner/administrator; confirm 200 and no student names or phone numbers in the payload.
9. Record a non-production reconciliation, confirm a deliberate ₹1 difference is flagged, then correct it; verify the earlier revision remains in `history` and no receipt changed.
10. Download a backup, confirm it contains `checksum` and `schemaVersion: 2`, and verify a tampered copy is rejected before any restore.
