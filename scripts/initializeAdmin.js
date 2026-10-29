#!/usr/bin/env node

/**
 * Focus Academy - Initial Administrator Provisioning & Verification Script
 *
 * Resolves the "first administrator" dependency in a secure, trusted server-side environment
 * using the Firebase Admin SDK.
 *
 * Required Environment Variables (or CLI flags):
 * - FIREBASE_SERVICE_ACCOUNT: Raw JSON string, base64-encoded JSON, or path to service account key file
 * - INITIAL_ADMIN_EMAIL (or --email=user@example.com): The explicitly designated administrator
 *
 * Optional Environment Variables:
 * - INITIAL_ADMIN_NAME (or --name="Name"): Display name (defaults to "Focus Academy Director")
 * - INITIAL_ADMIN_ROLE (or --role=owner): Role to grant (defaults to "owner")
 * - CREATE_IF_MISSING (or --create-if-missing): If true, creates user in Firebase Auth if not found
 *
 * Usage:
 *   node scripts/initializeAdmin.js --email=director@focusacademyperambalur.com
 *   npm run admin:init -- --email=director@focusacademyperambalur.com
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Parse command line arguments
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    if (arg.startsWith('--')) {
      const parts = arg.slice(2).split('=');
      const key = parts[0];
      const val = parts.length > 1 ? parts.slice(1).join('=') : true;
      args[key] = val;
    }
  });
  return args;
}

// Load service account from environment or file
function resolveServiceAccount() {
  const envRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (googleAppCreds && fs.existsSync(googleAppCreds)) {
    try {
      const fileData = fs.readFileSync(googleAppCreds, 'utf8');
      return JSON.parse(fileData);
    } catch {
      throw new Error(`Failed to parse service account from GOOGLE_APPLICATION_CREDENTIALS file: ${googleAppCreds}`);
    }
  }

  if (!envRaw) {
    // Check local service-account.json if present (never committed to git)
    const localSaPath = path.resolve(process.cwd(), 'service-account.json');
    if (fs.existsSync(localSaPath)) {
      try {
        return JSON.parse(fs.readFileSync(localSaPath, 'utf8'));
      } catch {}
    }
    throw new Error(
      'Missing Firebase credentials. Please configure FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }

  const trimmed = envRaw.trim();

  // Try direct JSON
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT contains invalid JSON.');
    }
  }

  // Try base64 decoded
  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    if (decoded.startsWith('{')) {
      return JSON.parse(decoded);
    }
  } catch {}

  // Try file path
  if (fs.existsSync(trimmed)) {
    try {
      return JSON.parse(fs.readFileSync(trimmed, 'utf8'));
    } catch {
      throw new Error(`Failed to read service account key file at: ${trimmed}`);
    }
  }

  throw new Error('FIREBASE_SERVICE_ACCOUNT format not recognized (must be JSON string, base64 string, or filepath).');
}

export async function initializeAdmin(options = {}) {
  const cliArgs = parseArgs();
  const email = (options.email || cliArgs.email || process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
  const name = (options.name || cliArgs.name || process.env.INITIAL_ADMIN_NAME || 'Focus Academy Director').trim();
  const role = (options.role || cliArgs.role || process.env.INITIAL_ADMIN_ROLE || 'owner').trim().toLowerCase();
  const createIfMissing = Boolean(
    options.createIfMissing || cliArgs['create-if-missing'] || process.env.CREATE_IF_MISSING === 'true'
  );

  if (!email || !email.includes('@')) {
    throw new Error('A valid administrator email must be provided via --email=<email> or INITIAL_ADMIN_EMAIL.');
  }

  const validRoles = ['owner', 'administrator', 'admissions', 'fee_manager', 'teacher', 'read_only'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid administrator role '${role}'. Must be one of: ${validRoles.join(', ')}.`);
  }

  const serviceAccount = resolveServiceAccount();
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('Service account is missing required fields (project_id, private_key, or client_email).');
  }

  // Fix private key formatting if newlines were escaped
  if (typeof serviceAccount.private_key === 'string' && serviceAccount.private_key.includes('\\n')) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log(`[InitAdmin] Connected to Firebase Project: ${serviceAccount.project_id}`);
  console.log(`[InitAdmin] Target administrator: ${email} (Role: ${role})`);

  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`[InitAdmin] Existing user located in Firebase Auth (UID: ${user.uid})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      if (createIfMissing) {
        console.log(`[InitAdmin] Account does not exist. Creating new verified user for ${email}...`);
        user = await auth.createUser({
          email,
          emailVerified: true,
          displayName: name,
        });
        console.log(`[InitAdmin] Created Firebase Auth user (UID: ${user.uid})`);
      } else {
        throw new Error(
          `User account for '${email}' does not exist in Firebase Authentication. Create the user first or rerun with --create-if-missing.`
        );
      }
    } else {
      throw err;
    }
  }

  // Assign Custom Claims
  const claims = {
    role,
    admin: true,
    initializedAt: new Date().toISOString(),
  };
  await auth.setCustomUserClaims(user.uid, claims);
  console.log(`[InitAdmin] Assigned Firebase Custom Claims: role="${role}", admin=true`);

  // Reconcile Firestore academy_settings/main_config
  const settingsDocRef = db.collection('academy_settings').doc('main_config');
  const snap = await settingsDocRef.get();
  let existingSettings = snap.exists ? snap.data() : {};
  let authorizedAdmins = Array.isArray(existingSettings.authorizedAdmins)
    ? [...existingSettings.authorizedAdmins]
    : [];

  const existingIndex = authorizedAdmins.findIndex(
    (a) => String(a.email || '').toLowerCase() === email
  );

  const adminRecord = {
    email,
    name,
    role,
    active: true,
    uid: user.uid,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    authorizedAdmins[existingIndex] = { ...authorizedAdmins[existingIndex], ...adminRecord };
    console.log(`[InitAdmin] Reconciled existing entry in academy_settings.authorizedAdmins`);
  } else {
    authorizedAdmins.push(adminRecord);
    console.log(`[InitAdmin] Added new entry to academy_settings.authorizedAdmins`);
  }

  await settingsDocRef.set({ ...existingSettings, authorizedAdmins }, { merge: true });
  console.log(`[InitAdmin] Successfully saved academy_settings/main_config in Firestore`);

  // Reconcile admin profile document in admin_profiles/{uid}
  const profileDocRef = db.collection('admin_profiles').doc(user.uid);
  const profileSnap = await profileDocRef.get();
  const existingProfile = profileSnap.exists ? profileSnap.data() : {};

  await profileDocRef.set(
    {
      ...existingProfile,
      uid: user.uid,
      email,
      displayName: existingProfile.displayName || name,
      role,
      updatedAt: new Date().toISOString(),
      updatedBy: 'scripts/initializeAdmin.js',
    },
    { merge: true }
  );
  console.log(`[InitAdmin] Reconciled admin profile in admin_profiles/${user.uid}`);

  console.log('\n======================================================');
  console.log(' INITIAL ADMINISTRATOR PROVISIONING COMPLETE');
  console.log('======================================================');
  console.log(` Project:      ${serviceAccount.project_id}`);
  console.log(` User UID:     ${user.uid}`);
  console.log(` Email:        ${email}`);
  console.log(` Role:         ${role.toUpperCase()}`);
  console.log(' Status:       Active & Authorized');
  console.log('======================================================\n');

  return {
    success: true,
    uid: user.uid,
    email,
    role,
    projectId: serviceAccount.project_id,
  };
}

// Self-executing CLI runner
const isDirectCli = process.argv[1] && (
  process.argv[1].endsWith('initializeAdmin.js') ||
  process.argv[1].endsWith('initializeAdmin')
);

if (isDirectCli) {
  initializeAdmin()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(`\n[InitAdmin ERROR] ${err.message}`);
      process.exit(1);
    });
}
