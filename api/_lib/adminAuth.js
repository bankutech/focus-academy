const ROLE_RANK = {
  viewer: 0,
  read_only: 0,
  teacher: 1,
  fee_manager: 3,
  admissions: 3,
  administrator: 4,
  owner: 5
};

// Kept in sync with ROLE_PERMISSIONS in src/services/adminDataService.js.
// Server routes must authorise on a capability, not only on a role rank.
export const ROLE_PERMISSIONS = {
  owner: [
    'canManageSettings', 'canManageAdmins', 'canWaiveFees', 'canApplyDiscounts',
    'canExportData', 'canImportData', 'canManageBatches', 'canManageStudents',
    'canRecordPayments', 'canReconcileCollections', 'canTriggerReminders', 'canRestoreBackup'
  ],
  administrator: [
    'canManageSettings', 'canWaiveFees', 'canApplyDiscounts', 'canExportData',
    'canImportData', 'canManageBatches', 'canManageStudents', 'canRecordPayments',
    'canReconcileCollections', 'canTriggerReminders'
  ],
  admissions: ['canManageStudents', 'canExportData'],
  fee_manager: [
    'canWaiveFees', 'canRecordPayments', 'canReconcileCollections',
    'canTriggerReminders', 'canExportData'
  ],
  teacher: [],
  read_only: [],
  viewer: []
};

const resolveRole = (recordRole, decoded = {}) => {
  if (recordRole && Object.prototype.hasOwnProperty.call(ROLE_RANK, recordRole)) return recordRole;
  if (decoded.role === 'owner') return 'owner';
  if (decoded.admin === true || decoded.role === 'admin' || decoded.role === 'administrator') return 'administrator';
  if (Object.prototype.hasOwnProperty.call(ROLE_RANK, decoded.role)) return decoded.role;
  return null;
};

/**
 * Authenticates an administrator and enforces an optional capability or
 * minimum role. Callers should prefer `permission` for financial actions.
 */
export const authenticateAdmin = async (req, services, requirement = 'fee_manager') => {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, error: 'Sign in required.' };

  let decoded;
  try {
    decoded = await services.auth.verifyIdToken(token, true);
  } catch {
    return { ok: false, status: 401, error: 'Your session is no longer valid. Please sign in again.' };
  }

  const email = String(decoded.email || '').toLowerCase();
  if (!email || decoded.email_verified !== true) {
    return { ok: false, status: 403, error: 'A verified administrator email is required.' };
  }

  let recordRole = null;
  const settings = await services.db.collection('academy_settings').doc('main_config').get();
  const admins = settings.exists ? settings.data().authorizedAdmins || [] : [];
  const record = admins.find((a) => a.active !== false && String(a.email || '').toLowerCase() === email);
  if (record) recordRole = String(record.role || '').toLowerCase();

  const role = resolveRole(recordRole, decoded);
  if (!role) {
    return { ok: false, status: 403, error: 'You are not authorized to perform this action.' };
  }

  const config = typeof requirement === 'string' ? { minimumRole: requirement } : (requirement || {});
  if (config.permission) {
    const granted = ROLE_PERMISSIONS[role] || [];
    if (!granted.includes(config.permission)) {
      return { ok: false, status: 403, error: 'Your role does not permit this action.' };
    }
  }
  if (config.minimumRole && ROLE_RANK[role] < (ROLE_RANK[config.minimumRole] || 1)) {
    return { ok: false, status: 403, error: 'You are not authorized to perform this action.' };
  }

  return { ok: true, email, role, uid: decoded.uid };
};
