import { getServices } from '../_lib/firebaseAdmin.js';
import { prepare, fail, unavailable, crashed } from '../_lib/http.js';
import { authenticateAdmin } from '../_lib/adminAuth.js';

const countWhere = async (db, collectionName, field, value) => {
  const snap = await db.collection(collectionName).where(field, '==', value).get();
  return snap.empty ? 0 : snap.size ?? snap.docs.length;
};

const newest = (rows, field) => {
  const values = rows
    .map((row) => row[field])
    .filter(Boolean)
    .sort();
  return values.length ? values[values.length - 1] : null;
};

/**
 * Admin-only operational monitoring. Returns aggregate counts and timestamps
 * only — never student names, phone numbers, amounts or credentials.
 */
export default async function handler(req, res) {
  prepare(res, ['GET']);
  if (req.method !== 'GET') return fail(res, 405, 'Method not allowed');

  const services = await getServices();
  if (!services) return unavailable(res);
  const { db } = services;

  const access = await authenticateAdmin(req, services, { permission: 'canManageSettings' });
  if (!access.ok) return fail(res, access.status, access.error);

  try {
    const startedAt = Date.now();

    const [pendingAdmissions, failedReminders, failedSync, reminders, reconciliations, backups, openTills] = await Promise.all([
      countWhere(db, 'enrollments', 'status', 'pending'),
      countWhere(db, 'reminders', 'deliveryStatus', 'failed'),
      countWhere(db, 'enrollments', 'syncStatus', 'failed'),
      db.collection('reminders').get(),
      db.collection('collection_reconciliations').get(),
      db.collection('audit_logs').where('action', '==', 'BACKUP_CREATED').get(),
      countWhere(db, 'till_sessions', 'status', 'open'),
    ]);

    const latencyMs = Date.now() - startedAt;
    const reminderRows = reminders.empty ? [] : reminders.docs.map((d) => d.data());
    const reconciliationRows = reconciliations.empty ? [] : reconciliations.docs.map((d) => d.data());
    const backupRows = backups.empty ? [] : backups.docs.map((d) => d.data());

    const failedReminderRows = reminderRows.filter((r) =>
      ['failed', 'undelivered', 'bounced'].includes(String(r.deliveryStatus || r.status || '').toLowerCase())
    );
    const pendingReminderRows = reminderRows.filter((r) =>
      ['queued', 'pending'].includes(String(r.deliveryStatus || r.status || '').toLowerCase())
    );

    const latestReconciliationDate = newest(reconciliationRows, 'date');
    const latestReconciliation = reconciliationRows
      .filter((r) => r.date === latestReconciliationDate)
      .sort((a, b) => String(b.reconciledAt || '').localeCompare(String(a.reconciledAt || '')))[0] || null;

    const lastBackupAt = newest(backupRows, 'timestamp');
    const backupAgeMs = lastBackupAt ? Date.now() - new Date(lastBackupAt).getTime() : null;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const hasYesterday = reconciliationRows.some((r) => r.date === yesterday);

    return res.status(200).json({
      success: true,
      checkedAt: new Date().toISOString(),
      firestore: { ok: true, latencyMs },
      api: { ok: true },
      queues: {
        pendingAdmissions,
        failedSynchronization: failedSync,
      },
      notifications: {
        failed: Math.max(failedReminders, failedReminderRows.length),
        pending: pendingReminderRows.length,
      },
      collections: {
        latestReconciliationDate,
        latestReconciliationStatus: latestReconciliation?.status || null,
        yesterdayReconciled: hasYesterday,
        openTillSessions: openTills,
      },
      backups: {
        lastBackupAt,
        ageHours: backupAgeMs === null ? null : Math.round(backupAgeMs / 3600000),
        stale: backupAgeMs === null || backupAgeMs > 7 * 86400000,
      },
      date: today,
    });
  } catch (err) {
    return crashed(res, 'ops-health', err);
  }
}
