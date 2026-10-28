const REQUIRED_ENV = ['FIREBASE_SERVICE_ACCOUNT'];
const DEFAULT_PROJECT_ID = 'focus-academy-7efeb';

let cachedServices = null;
let cachedFailure = null;
let lastAttemptAt = 0;
let cachedProjectId = null;
let cachedCredentialFormat = null;

const RETRY_COOLDOWN_MS = 30_000;

const unquote = (value) => {
  const text = String(value ?? '').trim().replace(/^\uFEFF/, '');
  if (text.length >= 2) {
    const first = text[0];
    const last = text[text.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return text.slice(1, -1).trim();
    }
  }
  return text;
};

const looksLikeServiceAccount = (value) =>
  Boolean(value && typeof value === 'object' && value.project_id && value.private_key && value.client_email);

const normalizePrivateKey = (key) => {
  const raw = String(key ?? '');
  const withNewlines = raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
  return withNewlines.replace(/\r\n/g, '\n').trim();
};

export const parseServiceAccount = (rawValue) => {
  const raw = unquote(rawValue);
  if (!raw) return { ok: false, reason: 'missing_env', missing: ['FIREBASE_SERVICE_ACCOUNT'] };

  const attempts = [];
  const pushAttempt = (text, format) => {
    if (!text) return;
    try {
      attempts.push({ parsed: JSON.parse(text), format });
    } catch {
      // Try the next decoding strategy.
    }
  };

  pushAttempt(raw, 'json');
  if (!raw.startsWith('{')) {
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8').trim();
      pushAttempt(unquote(decoded), 'base64');
    } catch {
      // Not base64 encoded.
    }
  }

  const valid = attempts.find((attempt) => looksLikeServiceAccount(attempt.parsed));
  if (!valid) {
    const parsedJson = attempts[0]?.parsed;
    if (parsedJson && typeof parsedJson === 'object') {
      const missingFields = ['project_id', 'private_key', 'client_email'].filter((field) => !parsedJson[field]);
      return { ok: false, reason: 'incomplete_credentials', missingFields };
    }
    return { ok: false, reason: 'malformed_credentials' };
  }

  const account = { ...valid.parsed, private_key: normalizePrivateKey(valid.parsed.private_key) };
  if (!account.private_key.includes('BEGIN PRIVATE KEY')) {
    return { ok: false, reason: 'malformed_private_key' };
  }

  return { ok: true, value: account, format: valid.format };
};

export const missingEnvironment = () => REQUIRED_ENV.filter((name) => !unquote(process.env[name]));

export const expectedProjectId = () => unquote(process.env.FIREBASE_PROJECT_ID) || DEFAULT_PROJECT_ID;

export const getServiceStatus = () => {
  const missing = missingEnvironment();
  if (missing.length) {
    return {
      ready: false,
      reason: 'missing_environment',
      detail: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }
  if (cachedServices) {
    return {
      ready: true,
      reason: 'ready',
      projectId: cachedProjectId,
      credentialFormat: cachedCredentialFormat,
    };
  }
  if (cachedFailure) return { ready: false, reason: cachedFailure.reason, detail: cachedFailure.detail };
  return { ready: false, reason: 'not_initialized', detail: 'Service bindings have not been initialized yet.' };
};

const describeCredentialFailure = (credentials) => {
  switch (credentials.reason) {
    case 'missing_env':
      return 'FIREBASE_SERVICE_ACCOUNT is not set.';
    case 'incomplete_credentials':
      return `FIREBASE_SERVICE_ACCOUNT is missing required service-account fields: ${(credentials.missingFields || []).join(', ')}.`;
    case 'malformed_private_key':
      return 'FIREBASE_SERVICE_ACCOUNT private_key must be a PEM key beginning with "-----BEGIN PRIVATE KEY-----".';
    default:
      return 'FIREBASE_SERVICE_ACCOUNT is present but is not valid service-account JSON (or base64 of that JSON).';
  }
};

const classifyInitializationError = (err) => {
  const code = String(err?.code || err?.name || 'unknown_error');
  const message = String(err?.message || '');
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|fetch failed/i.test(message)) {
    return { reason: 'network_unavailable', detail: 'Firebase Admin could not reach Google identity services.' };
  }
  if (code === 'auth/invalid-credential' || /DECODER|PEM|error:0909006C|error:1E08010C/i.test(message)) {
    return { reason: 'invalid_private_key', detail: 'Firebase Admin rejected the service-account private key.' };
  }
  return {
    reason: 'initialization_failed',
    detail: `Firebase Admin failed to initialize (${code}${message ? `: ${message.slice(0, 100)}` : ''}). Check that the service account is valid and that the Node runtime matches the installed firebase-admin version.`,
  };
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

  const credentials = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (!credentials.ok) {
    cachedFailure = { reason: credentials.reason, detail: describeCredentialFailure(credentials) };
    console.warn(`[firebase-admin] credential rejection code=${credentials.reason}`);
    return null;
  }

  try {
    const [{ initializeApp, getApps, cert }, { getFirestore }] = await Promise.all([
      import('firebase-admin/app'),
      import('firebase-admin/firestore'),
    ]);
    const app = getApps()[0] || initializeApp({ credential: cert(credentials.value) });
    const db = getFirestore(app);

    let auth = null;
    try {
      const authMod = await import('firebase-admin/auth');
      auth = authMod.getAuth(app);
    } catch (authErr) {
      console.warn(`[firebase-admin] auth sub-module initialization warning (${authErr?.code || authErr?.message || authErr}), continuing with firestore`);
    }

    cachedServices = { db, auth };
    cachedProjectId = credentials.value.project_id;
    cachedCredentialFormat = credentials.format;
    cachedFailure = null;
    console.info(`[firebase-admin] initialized project=${cachedProjectId} format=${cachedCredentialFormat} authReady=${Boolean(auth)}`);
    return cachedServices;
  } catch (err) {
    cachedFailure = classifyInitializationError(err);
    console.error(`[firebase-admin] initialization failed reason=${cachedFailure.reason}`);
    return null;
  }
};

export const getServiceAccountProjectId = () => cachedProjectId;

export const resetServiceCache = () => {
  cachedServices = null;
  cachedFailure = null;
  lastAttemptAt = 0;
  cachedProjectId = null;
  cachedCredentialFormat = null;
};
