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
8. Verify that `https://focus-academy-virid.vercel.app/api/health` returns HTTP 200 with `{"firestore":{"ok":true}}`.

---

## 3. Pre-Deployment Verification Checklist

Before triggering a production deployment:
1. Run linter: `npm run lint` (Must pass with 0 errors and 0 warnings).
2. Run type check: `npm run typecheck` (Must pass with 0 errors).
3. Run unit & integration test suite: `npm run test` (All 21 test files must pass).
4. Run browser E2E test suite: `npx playwright test --project=msedge` (All 17 specs must pass).
5. Compile production build: `npm run build` (Ensures bundle size remains compact: main chunk <320kB gzipped).
6. Verify Cloud Firestore Security Rules: `firebase deploy --only firestore:rules` (Ensures rules match `firestore.rules`).

---

## 4. Post-Deployment Verification Steps

After deployment completes:
1. Navigate to the live URL (`https://focus-academy-virid.vercel.app/`).
2. Verify homepage assets load eagerly (Campus photograph, SVG logo, fonts).
3. Click "Enroll" and test the complete 5-step funnel.
4. Verify phone call link triggers cellular dialer with `+919842451220`.
5. Verify WhatsApp button opens pre-populated chat with `919842451220`.
6. Inspect browser console for zero unhandled runtime exceptions.
