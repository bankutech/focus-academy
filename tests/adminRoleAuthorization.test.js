import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import { resolve } from 'path';
import { AdminDataService } from '../src/services/adminDataService';
import { setVerifiedAdmin, getVerifiedAdmin } from '../src/services/adminIdentity';

const OWNER = 'director@focusacademyperambalur.com';
const PRINCIPAL = 'principal@focusacademyperambalur.com';
const TARGET = 'new.staff@focusacademyperambalur.com';

const readJson = (relativePath) => JSON.parse(fs.readFileSync(resolve(process.cwd(), relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(resolve(process.cwd(), relativePath), 'utf8');

describe('Admin role persistence and authorization', () => {
  beforeEach(() => {
    localStorage.clear();
    AdminDataService.resetToSeedData();
    setVerifiedAdmin({ email: OWNER, displayName: 'Director' });
  });

  it('persists a role change so it survives a reload of settings', async () => {
    const before = await AdminDataService.getAuthorizedAdmins();
    expect(before.find((a) => a.email === TARGET)).toBeUndefined();

    await AdminDataService.updateAdminRole(TARGET, 'fee_manager', OWNER);

    // Simulate a full reload: drop any in-memory cache, re-read from storage.
    localStorage.setItem('focus_academy_admin_data_v1', localStorage.getItem('focus_academy_admin_data_v1'));
    const after = await AdminDataService.getAuthorizedAdmins();
    const stored = after.find((a) => a.email === TARGET);

    expect(stored, 'role change must be readable after reload').toBeDefined();
    expect(stored.role).toBe('fee_manager');
    expect(stored.updatedBy || stored.addedBy).toBe(OWNER);
  });

  it('changes an existing administrator role in both directions', async () => {
    await AdminDataService.updateAdminRole(PRINCIPAL, 'fee_manager', OWNER);
    let admins = await AdminDataService.getAuthorizedAdmins();
    expect(admins.find((a) => a.email === PRINCIPAL).role).toBe('fee_manager');

    await AdminDataService.updateAdminRole(PRINCIPAL, 'administrator', OWNER);
    admins = await AdminDataService.getAuthorizedAdmins();
    expect(admins.find((a) => a.email === PRINCIPAL).role).toBe('administrator');
  });

  it('writes an audit entry that names the actor, target and both roles', async () => {
    await AdminDataService.updateAdminRole(TARGET, 'administrator', OWNER);
    const logs = await AdminDataService.getAuditLogs();
    const entry = logs.find((l) => l.action === 'ADMIN_ROLE_UPDATED' && l.entityId === TARGET);

    expect(entry).toBeDefined();
    expect(entry.actor).toBe(OWNER);
    expect(entry.details).toContain(TARGET);
    expect(entry.details).toMatch(/to 'administrator'/);
  });

  it('rejects an unknown or malformed role', async () => {
    await expect(AdminDataService.updateAdminRole(TARGET, 'superuser', OWNER)).rejects.toThrow(/Invalid role/i);
    await expect(AdminDataService.updateAdminRole(TARGET, 'OWNER ', OWNER)).rejects.toThrow(/Invalid role/i);
  });

  it('rejects a target without a valid email address', async () => {
    await expect(AdminDataService.updateAdminRole('not-an-email', 'owner', OWNER)).rejects.toThrow(/valid administrator email/i);
    await expect(AdminDataService.updateAdminRole('', 'owner', OWNER)).rejects.toThrow(/valid administrator email/i);
  });

  it('blocks self-role-change (no self-promotion or self-demotion)', async () => {
    await expect(AdminDataService.updateAdminRole(OWNER, 'owner', OWNER)).rejects.toThrow(/own permission role/i);
    await expect(AdminDataService.updateAdminRole(OWNER, 'fee_manager', OWNER)).rejects.toThrow(/own permission role/i);

    const admins = await AdminDataService.getAuthorizedAdmins();
    expect(admins.find((a) => a.email === OWNER).role).toBe('owner');
  });

  it('blocks an administrator from changing any role (permission gate)', async () => {
    setVerifiedAdmin({ email: PRINCIPAL, displayName: 'Principal' });
    // ROLE_PERMISSIONS grants canManageAdmins only to owners, so an administrator
    // must be stopped before reaching the rank guard.
    await expect(
      AdminDataService.updateAdminRole(TARGET, 'administrator', PRINCIPAL)
    ).rejects.toThrow(/Unauthorized/i);

    const admins = await AdminDataService.getAuthorizedAdmins();
    expect(admins.find((a) => a.email === TARGET)).toBeUndefined();
  });

  it('blocks a lower-ranked actor from granting a higher role (defence-in-depth rank guard)', async () => {
    setVerifiedAdmin({ email: PRINCIPAL, displayName: 'Principal' });
    // Isolate the rank guard by bypassing the permission gate on purpose.
    const spy = vi.spyOn(AdminDataService, 'hasPermission').mockReturnValue(true);
    try {
      await expect(
        AdminDataService.updateAdminRole(TARGET, 'owner', PRINCIPAL)
      ).rejects.toThrow(/cannot grant the higher role/i);
    } finally {
      spy.mockRestore();
    }

    const admins = await AdminDataService.getAuthorizedAdmins();
    expect(admins.find((a) => a.email === TARGET)).toBeUndefined();
  });

  it('blocks a fee_manager from changing roles at all', async () => {
    setVerifiedAdmin({ email: 'coordinator@focusacademyperambalur.com', displayName: 'Coordinator' });
    await expect(
      AdminDataService.updateAdminRole(TARGET, 'fee_manager', 'coordinator@focusacademyperambalur.com')
    ).rejects.toThrow(/Unauthorized/i);
  });

  it('refuses role changes when no verified administrator identity is present', async () => {
    setVerifiedAdmin(null);
    expect(getVerifiedAdmin()).toBeNull();
    await expect(
      AdminDataService.updateAdminRole(TARGET, 'owner', 'ghost@focusacademyperambalur.com')
    ).rejects.toThrow(/Authentication required|Unauthorized/i);
  });

  it('does not silently succeed when nothing was written', async () => {
    // A failed persistence must surface as a rejection, not a resolved promise.
    const spy = vi.spyOn(AdminDataService, 'logAudit').mockRejectedValueOnce(new Error('write failed'));
    await expect(
      AdminDataService.updateAdminRole(TARGET, 'administrator', OWNER)
    ).rejects.toThrow(/write failed/);
    spy.mockRestore();
  });

  it('reports the new role only after the change is readable back', async () => {
    const returned = await AdminDataService.updateAdminRole(TARGET, 'administrator', OWNER);
    const match = returned.find((a) => a.email === TARGET);
    expect(match).toBeDefined();
    expect(match.role).toBe('administrator');
  });
});

describe('Firestore rules hardening for privilege escalation', () => {
  const rules = readText('firestore.rules');

  it('keeps every required collection rule in place', () => {
    expect(rules).toContain("rules_version = '2';");
    for (const collection of ['batches', 'students', 'fee_obligations', 'payments', 'reminders', 'audit_logs', 'reservations', 'leads', 'counters', 'till_sessions']) {
      expect(rules, `missing rules for ${collection}`).toContain(`match /${collection}/{`);
    }
    expect(rules).toContain('allow update, delete: if false;');
  });

  it('denies writes to academy_settings by default (no blanket administrator write)', () => {
    const block = rules.match(/match \/academy_settings\/\{settingId\} \{[\s\S]*?\n    \}/);
    expect(block, 'academy_settings block must exist').toBeTruthy();
    const body = block[0];

    // Regression guard: the old rule was `allow read, write: if isAdministrator();`
    // which let any administrator rewrite authorizedAdmins and grant themselves owner.
    expect(body).not.toMatch(/allow\s+read,\s*write:\s*if\s+isAdministrator\(\)/);

    expect(body).toMatch(/allow read: if isAdministrator\(\)/);
    expect(body).toMatch(/allow update: if isAdministrator\(\)/);
    expect(body).toMatch(/isOwner\(\)/);
    expect(body, 'authorizedAdmins must be guarded').toContain("hasAny(['authorizedAdmins'])");
  });

  it('restricts create and delete of academy_settings to owners', () => {
    expect(rules).toMatch(/allow create, delete: if isOwner\(\);/);
  });

  it('still requires authentication for the privileged collections', () => {
    expect(rules).toMatch(/function isOwner\(\)/);
    expect(rules).toMatch(/function isAdministrator\(\)/);
    expect(rules).toMatch(/function isFeeManager\(\)/);
    expect(rules).toMatch(/match \/\{document=\*\*\} \{[\s\S]*?allow read, write: if false;/);
  });

  it('package engines still pin a runtime compatible with firebase-admin', () => {
    const pkg = readJson('package.json');
    const match = /(\d+)/.exec(pkg.engines.node);
    expect(match).toBeTruthy();
    expect(Number(match[1])).toBeGreaterThanOrEqual(22);
  });
});
