const DAY_MS = 24 * 60 * 60 * 1000;

const dateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return null;
  }
};

const balanceOf = (obligation) => {
  if (obligation?.balance !== undefined && obligation?.balance !== null) {
    return Math.max(0, Number(obligation.balance) || 0);
  }
  return Math.max(
    0,
    Number(obligation?.amountDue || 0) -
      Number(obligation?.amountPaid || 0) -
      Number(obligation?.waivedAmount || 0)
  );
};

const isOpen = (obligation) =>
  balanceOf(obligation) > 0 &&
  obligation?.status !== 'cancelled' &&
  obligation?.status !== 'archived' &&
  obligation?.status !== 'waived';

/**
 * Builds dashboard action items from records already loaded for the dashboard.
 * Nothing is inferred from chart totals or cached labels: every item carries the
 * count and amount derived from the same authoritative rows.
 */
export const buildActionItems = ({
  batches = [],
  obligations = [],
  enrollments = [],
  reminders = [],
  reconciliations = [],
  auditLogs = null,
  dataErrors = [],
  reservations = [],
  now = new Date(),
} = {}) => {
  const today = dateKey(now);
  const items = [];

  const pendingAdmissions = enrollments.filter((row) => row.status === 'pending');
  if (pendingAdmissions.length > 0) {
    items.push({
      id: 'pending-admissions',
      severity: 'warning',
      title: `${pendingAdmissions.length} admission${pendingAdmissions.length === 1 ? '' : 's'} awaiting review`,
      detail: 'Online applications are saved but not yet approved for a student record.',
      count: pendingAdmissions.length,
      to: '/admin-portal/leads?source=enrollment&status=pending',
      linkLabel: 'Review admissions',
    });
  }

  const overdue = obligations.filter((row) => isOpen(row) && row.dueDate && row.dueDate < today);
  if (overdue.length > 0) {
    items.push({
      id: 'overdue-fees',
      severity: 'critical',
      title: `${overdue.length} overdue fee payment${overdue.length === 1 ? '' : 's'}`,
      detail: `₹${overdue.reduce((sum, row) => sum + balanceOf(row), 0).toLocaleString('en-IN')} is past its scheduled payment date.`,
      count: overdue.length,
      amount: overdue.reduce((sum, row) => sum + balanceOf(row), 0),
      to: '/admin-portal/reminders?tab=overdue',
      linkLabel: 'Follow up',
    });
  }

  const upcomingLimit = new Date(now.getTime() + 7 * DAY_MS).toISOString().slice(0, 10);
  const upcoming = obligations.filter(
    (row) => isOpen(row) && row.dueDate && row.dueDate >= today && row.dueDate <= upcomingLimit
  );
  if (upcoming.length > 0) {
    items.push({
      id: 'upcoming-dues',
      severity: 'info',
      title: `${upcoming.length} payment${upcoming.length === 1 ? '' : 's'} due in the next 7 days`,
      detail: `₹${upcoming.reduce((sum, row) => sum + balanceOf(row), 0).toLocaleString('en-IN')} falls due by ${upcomingLimit}.`,
      count: upcoming.length,
      amount: upcoming.reduce((sum, row) => sum + balanceOf(row), 0),
      to: '/admin-portal/reminders?tab=today',
      linkLabel: 'View schedule',
    });
  }

  if (dataErrors.length > 0) {
    items.push({
      id: 'sync-failures',
      severity: 'critical',
      title: `${dataErrors.length} data source${dataErrors.length === 1 ? '' : 's'} failed to load`,
      detail: dataErrors.join(' • '),
      count: dataErrors.length,
      to: '/admin-portal/settings',
      linkLabel: 'Open sync centre',
    });
  }

  const activationCutoff = new Date(now.getTime() - 3 * DAY_MS).toISOString();
  const activationPending = enrollments.filter(
    (row) =>
      row.status === 'confirmed' &&
      !row.studentUid &&
      row.enrolledAt &&
      String(row.enrolledAt) < activationCutoff
  );
  if (activationPending.length > 0) {
    items.push({
      id: 'activation-pending',
      severity: 'info',
      title: `${activationPending.length} admitted student${activationPending.length === 1 ? '' : 's'} not yet activated`,
      detail: 'Confirmed more than 3 days ago with no linked student sign-in. Verify the guardian mobile matches the enrollment.',
      count: activationPending.length,
      to: '/admin-portal/students?status=active',
      linkLabel: 'Verify records',
    });
  }

  const heldByBatch = reservations.reduce((acc, row) => {
    if (row.status === 'held' && row.expiresAt && new Date(row.expiresAt).getTime() > now.getTime()) {
      acc[row.batchId] = (acc[row.batchId] || 0) + 1;
    }
    return acc;
  }, {});
  const capacityRisk = batches.filter((batch) => {
    if (batch.isArchived) return false;
    const capacity = Number(batch.capacity) || 12;
    const effective = Number(batch.enrolledCount || 0) + Number(heldByBatch[batch.id] || 0);
    return effective >= Math.max(1, capacity - 1);
  });
  if (capacityRisk.length > 0) {
    items.push({
      id: 'batch-capacity',
      severity: 'warning',
      title: `${capacityRisk.length} batch${capacityRisk.length === 1 ? ' is' : 'es are'} nearly full`,
      detail: capacityRisk.map((b) => b.name).slice(0, 3).join(' • '),
      count: capacityRisk.length,
      to: '/admin-portal/batches',
      linkLabel: 'Manage capacity',
    });
  }

  const yesterday = new Date(now.getTime() - DAY_MS).toISOString().slice(0, 10);
  const yesterdaysReconciliation = reconciliations.find((row) => row.date === yesterday);
  if (!yesterdaysReconciliation) {
    items.push({
      id: 'reconciliation-missing',
      severity: 'warning',
      title: 'Yesterday’s collections are not reconciled',
      detail: `No independent cash/UPI verification recorded for ${yesterday}.`,
      count: 1,
      to: '/admin-portal/reports#daily-collection-reconciliation',
      linkLabel: 'Reconcile now',
    });
  } else if (yesterdaysReconciliation.status === 'discrepancy') {
    items.push({
      id: 'reconciliation-discrepancy',
      severity: 'critical',
      title: 'Collection discrepancy flagged',
      detail: `${yesterday} verified total differs from recorded receipts by ₹${Number(yesterdaysReconciliation.difference || 0).toLocaleString('en-IN')}.`,
      count: 1,
      amount: Number(yesterdaysReconciliation.difference || 0),
      to: '/admin-portal/reports#daily-collection-reconciliation',
      linkLabel: 'Inspect discrepancy',
    });
  }

  const failedNotifications = reminders.filter((row) =>
    ['failed', 'undelivered', 'bounced'].includes(String(row.deliveryStatus || row.status || '').toLowerCase())
  );
  if (failedNotifications.length > 0) {
    items.push({
      id: 'notification-failures',
      severity: 'warning',
      title: `${failedNotifications.length} notification${failedNotifications.length === 1 ? '' : 's'} failed delivery`,
      detail: 'Retry failed WhatsApp reminders or contact the guardian directly.',
      count: failedNotifications.length,
      to: '/admin-portal/reminders',
      linkLabel: 'Retry notifications',
    });
  }

  if (Array.isArray(auditLogs)) {
    const backups = auditLogs
      .filter((row) => row.action === 'BACKUP_CREATED')
      .map((row) => new Date(row.timestamp || 0).getTime())
      .filter((value) => Number.isFinite(value));
    const latestBackup = backups.length ? Math.max(...backups) : 0;
    if (!latestBackup || now.getTime() - latestBackup > 7 * DAY_MS) {
      items.push({
        id: 'backup-overdue',
        severity: 'warning',
        title: latestBackup ? 'Data backup is more than 7 days old' : 'No data backup saved recently',
        detail: latestBackup
          ? `Last backup saved on ${new Date(latestBackup).toISOString().slice(0, 10)}.`
          : 'Download a student & fee records backup file for academy safe-keeping.',
        count: 1,
        to: '/admin-portal/settings',
        linkLabel: 'Download backup',
      });
    }
  }

  const severityRank = { critical: 0, warning: 1, info: 2 };
  return items.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9));
};

export const unmetActionCount = (items = []) =>
  items.filter((item) => item.severity === 'critical' || item.severity === 'warning').length;

export const actionItemTimestamp = () => new Date().toISOString();
