const ROLE_RANK = { fee_manager: 1, administrator: 2, owner: 3 };

export const authenticateAdmin = async (req, services, minimumRole) => {
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

  let role = null;
  const settings = await services.db.collection('academy_settings').doc('main_config').get();
  const admins = settings.exists ? settings.data().authorizedAdmins || [] : [];
  const record = admins.find((a) => a.active !== false && String(a.email || '').toLowerCase() === email);
  if (record && ROLE_RANK[record.role]) role = record.role;
  if (!role && decoded.role === 'owner') role = 'owner';
  if (!role && (decoded.admin === true || decoded.role === 'admin' || decoded.role === 'administrator')) role = 'administrator';
  if (!role && decoded.role === 'fee_manager') role = 'fee_manager';

  if (!role || ROLE_RANK[role] < (ROLE_RANK[minimumRole] || 1)) {
    return { ok: false, status: 403, error: 'You are not authorized to perform this action.' };
  }
  return { ok: true, email, role, uid: decoded.uid };
};
