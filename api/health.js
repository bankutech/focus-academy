import { getServices, getServiceStatus } from './_lib/firebaseAdmin.js';
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
  const checks = {
    node_runtime: { ok: nodeMajor >= 22, detail: `node ${process.versions.node}` },
    step_token_secret: { ok: hasSecret(), detail: hasSecret() ? 'configured' : 'SESSION_SECRET missing or shorter than 32 characters' },
    firestore: { ok: false, detail: 'not checked' },
  };

  if (status.ready) {
    try {
      const services = await getServices();
      await withTimeout(services.db.collection('batches').limit(1).get(), 4000);
      checks.firestore = { ok: true, detail: 'read succeeded' };
    } catch (err) {
      checks.firestore = { ok: false, detail: `Firestore round-trip failed (${err?.code || err?.message || 'unknown_error'})` };
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
