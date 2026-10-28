import { getServices, getServiceStatus, expectedProjectId } from './_lib/firebaseAdmin.js';
import { prepare } from './_lib/http.js';
import { hasSecret } from './_lib/stepToken.js';

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('health_check_timeout')), ms).unref?.()),
  ]);

export default async function handler(req, res) {
  prepare(res, ['GET']);
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const status = getServiceStatus();
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const expected = expectedProjectId();
  const checks = {
    node_runtime: { ok: nodeMajor >= 22, detail: `node ${process.versions.node}` },
    step_token_secret: {
      ok: hasSecret(),
      detail: hasSecret() ? 'configured' : 'SESSION_SECRET is missing or shorter than 32 characters',
    },
    firebase_admin: {
      ok: status.ready,
      detail: status.ready ? `initialized (${status.credentialFormat || 'json'} credentials)` : status.detail,
    },
    firestore_project: {
      ok: false,
      detail: 'not checked',
    },
    firestore: { ok: false, detail: 'not checked' },
  };

  if (status.ready) {
    const actual = status.projectId || null;
    checks.firestore_project = {
      ok: actual ? actual === expected : true,
      detail: actual
        ? actual === expected
          ? 'service account project matches the deployment'
          : `service account project does not match the expected project (${expected})`
        : 'credential project id not reported by this runtime',
    };

    try {
      const services = await getServices();
      if (!services) throw new Error('firebase_admin_unavailable');
      await withTimeout(services.db.collection('batches').limit(1).get(), 4000);
      checks.firestore = { ok: true, detail: 'read succeeded' };
    } catch (err) {
      const code = err?.code || err?.message || 'unknown_error';
      checks.firestore = { ok: false, detail: `Firestore round-trip failed (${String(code).slice(0, 80)})` };
    }
  } else {
    checks.firestore = { ok: false, detail: status.detail };
  }

  const ready = Object.values(checks).every((check) => check.ok);

  return res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
}
