const REQUIRED_ENV = ['FIREBASE_SERVICE_ACCOUNT'];

let cachedServices = null;
let cachedFailure = null;
let lastAttemptAt = 0;

const RETRY_COOLDOWN_MS = 30_000;

const readCredentials = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return { ok: false, reason: 'missing_env', missing: ['FIREBASE_SERVICE_ACCOUNT'] };
  try {
    const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const parsed = JSON.parse(text);
    if (!parsed || !parsed.project_id || !parsed.private_key || !parsed.client_email) {
      return { ok: false, reason: 'malformed_credentials' };
    }
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, reason: 'malformed_credentials' };
  }
};

export const missingEnvironment = () => REQUIRED_ENV.filter((name) => !process.env[name]);

export const getServiceStatus = () => {
  const missing = missingEnvironment();
  if (missing.length) {
    return { ready: false, reason: 'missing_environment', detail: `Missing required environment variables: ${missing.join(', ')}` };
  }
  if (cachedServices) return { ready: true, reason: 'ready' };
  if (cachedFailure) return { ready: false, reason: cachedFailure.reason, detail: cachedFailure.detail };
  return { ready: false, reason: 'not_initialized', detail: 'Service bindings have not been initialized yet.' };
};

export const getServices = async () => {
  if (cachedServices) return cachedServices;

  const missing = missingEnvironment();
  if (missing.length) {
    cachedFailure = {
      reason: 'missing_environment',
      detail: `Missing required environment variables: ${missing.join(', ')}. Set them in the hosting provider's project settings.`,
    };
    return null;
  }

  if (cachedFailure && Date.now() - lastAttemptAt < RETRY_COOLDOWN_MS) return null;
  lastAttemptAt = Date.now();

  const credentials = readCredentials();
  if (!credentials.ok) {
    cachedFailure = {
      reason: credentials.reason,
      detail:
        credentials.reason === 'missing_env'
          ? 'FIREBASE_SERVICE_ACCOUNT is not set.'
          : 'FIREBASE_SERVICE_ACCOUNT is present but is not a valid service-account JSON (or base64 of one).',
    };
    return null;
  }

  try {
    const [{ initializeApp, getApps, cert }, { getFirestore }, { getAuth }] = await Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/firestore'),
      import('firebase-admin/auth'),
    ]);
    const app = getApps()[0] || initializeApp({ credential: cert(credentials.value) });
    cachedServices = { db: getFirestore(app), auth: getAuth(app) };
    cachedFailure = null;
    return cachedServices;
  } catch (err) {
    cachedFailure = {
      reason: 'initialization_failed',
      detail: `Firebase Admin failed to initialize (${err?.code || err?.name || 'unknown_error'}). Check that the service account is valid and that the Node runtime matches the installed firebase-admin version.`,
    };
    return null;
  }
};

export const resetServiceCache = () => {
  cachedServices = null;
  cachedFailure = null;
  lastAttemptAt = 0;
};
