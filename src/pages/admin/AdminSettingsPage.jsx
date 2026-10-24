import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Users, 
  CreditCard, 
  MessageSquare
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('academy'); // 'academy' | 'billing' | 'reminders' | 'roles' | 'backup'
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreFileContent, setRestoreFileContent] = useState(null);
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccess, setRestoreSuccess] = useState('');

  const currentAdminEmail = (() => {
    try {
      const raw = sessionStorage.getItem('focus_academy_admin_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.email) return parsed.email;
      }
    } catch {
      // fallback
    }
    return 'admin@focusacademyperambalur.com';
  })();

  const currentRole = AdminDataService.getUserRole(currentAdminEmail);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await AdminDataService.getSettings();
      setSettings(data);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      await AdminDataService.updateSettings(settings, currentAdminEmail);
      setFeedback({ type: 'success', message: 'Institutional academy settings saved successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (targetEmail, newRole) => {
    setFeedback({ type: '', message: '' });
    try {
      await AdminDataService.updateAdminRole(targetEmail, newRole, currentAdminEmail);
      setFeedback({ type: 'success', message: `Updated permission role for ${targetEmail} to '${newRole}'.` });
      await loadSettings();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update admin role.' });
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const snapshot = await AdminDataService.createFullBackupSnapshot(currentAdminEmail);
      const jsonStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Focus_Academy_Institutional_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'Full institutional database snapshot downloaded successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to generate backup snapshot.' });
    }
  };

  const handleFileSelectForRestore = (e) => {
    const file = e.target.files?.[0];
    setRestoreError('');
    setRestoreSuccess('');
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        if (!parsed.data || !parsed.data.batches || !parsed.data.students) {
          throw new Error('Snapshot file format invalid: missing required entities.');
        }
        setRestoreFileContent(parsed);
      } catch (err) {
        setRestoreError(err.message || 'Failed to parse JSON backup file.');
        setRestoreFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!restoreFileContent) return;
    setRestoreError('');
    setRestoreSuccess('');

    try {
      const result = await AdminDataService.restoreFromBackupSnapshot(restoreFileContent, currentAdminEmail);
      setRestoreSuccess(`Restored successfully: ${result.counts.students} students, ${result.counts.batches} batches, ${result.counts.payments} payments.`);
      await loadSettings();
    } catch (err) {
      setRestoreError(err.message || 'Restoration failed.');
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Academy Configuration &amp; Policies...</p>
      </div>
    );
  }

  const previewWhatsAppMessage = settings.whatsappTemplate
    .replace(/\{academyName\}/g, settings.academyName || 'Focus Academy')
    .replace(/\{currencySymbol\}/g, settings.currencySymbol || '₹')
    .replace(/\{studentName\}/g, 'S. Kaviya')
    .replace(/\{amount\}/g, '2200')
    .replace(/\{dueDate\}/g, '2026-11-05');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-[#EA580C]" />
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
              Academy Settings &amp; Governance
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure campus identity, billing cycles, reminder policies, role permissions, and disaster recovery.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={loadSettings}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh Settings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
            Role: {currentRole.toUpperCase()}
          </span>
        </div>
      </div>

      {feedback.message && (
        <div className={`p-4 rounded-xl border-l-4 text-xs font-semibold flex items-start space-x-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
            : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('academy')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'academy' 
              ? 'bg-[#0F172A] text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Campus &amp; Receipts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'billing' 
              ? 'bg-[#0F172A] text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing &amp; Currencies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'reminders' 
              ? 'bg-[#0F172A] text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp &amp; Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'roles' 
              ? 'bg-[#0F172A] text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Roles &amp; Access</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-2 ${
            activeTab === 'backup' 
              ? 'bg-[#0F172A] text-white' 
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup &amp; Recovery</span>
        </button>
      </div>

      {activeTab === 'academy' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">Campus Profile &amp; Official Receipts</h2>
            <p className="text-xs text-slate-500 mt-1">
              Details configured here appear dynamically on printed fee receipts, WhatsApp notifications, and student ledgers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Academy Name *</label>
              <input
                type="text"
                value={settings.academyName || ''}
                onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Receipt Prefix *</label>
              <input
                type="text"
                value={settings.receiptPrefix || 'REC'}
                onChange={(e) => setSettings({ ...settings, receiptPrefix: e.target.value.toUpperCase() })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Campus Physical Address *</label>
              <input
                type="text"
                value={settings.campusAddress || ''}
                onChange={(e) => setSettings({ ...settings, campusAddress: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Contact Phone *</label>
              <input
                type="text"
                value={settings.primaryPhone || ''}
                onChange={(e) => setSettings({ ...settings, primaryPhone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Inquiries Email *</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={settings.website || ''}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Academy Logo Path</label>
              <input
                type="text"
                value={settings.logoUrl || '/logo.png'}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Academy Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {activeTab === 'billing' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">Financial &amp; Billing Cycles</h2>
            <p className="text-xs text-slate-500 mt-1">
              Configure currency defaults, timezone anchors, recurring cycles, and payment methods.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Currency Code *</label>
              <input
                type="text"
                value={settings.defaultCurrency || 'INR'}
                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Currency Symbol *</label>
              <input
                type="text"
                value={settings.currencySymbol || '₹'}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Campus Timezone *</label>
              <input
                type="text"
                value={settings.defaultTimezone || 'Asia/Kolkata'}
                onChange={(e) => setSettings({ ...settings, defaultTimezone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reminder Schedule (Days Before Due Date)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.reminderTimingDaysBeforeDue ?? 3}
                onChange={(e) => setSettings({ ...settings, reminderTimingDaysBeforeDue: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Billing Policies'}</span>
            </button>
          </div>
        </form>
      )}

      {activeTab === 'reminders' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">WhatsApp &amp; Notification Policy</h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage automated and manual WhatsApp reminder text templates with variable interpolation.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Message Template *</label>
              <textarea
                rows={4}
                value={settings.whatsappTemplate || ''}
                onChange={(e) => setSettings({ ...settings, whatsappTemplate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Supported placeholders: <code className="text-orange-600 font-bold">&#123;academyName&#125;</code>, <code className="text-orange-600 font-bold">&#123;studentName&#125;</code>, <code className="text-orange-600 font-bold">&#123;amount&#125;</code>, <code className="text-orange-600 font-bold">&#123;dueDate&#125;</code>, <code className="text-orange-600 font-bold">&#123;currencySymbol&#125;</code>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                Live Dynamic Preview for Guardian:
              </span>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-slate-800 font-sans text-xs whitespace-pre-wrap">
                {previewWhatsAppMessage}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save WhatsApp Template'}</span>
            </button>
          </div>
        </form>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">Administrator Roles &amp; Permissions</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enforce role-based access control (RBAC). Only owners can manage administrators and institute settings.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Administrator Email</th>
                  <th className="py-2.5 px-4 font-bold">Designation</th>
                  <th className="py-2.5 px-4 font-bold">Assigned Role</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(settings.authorizedAdmins || []).map((adm) => (
                  <tr key={adm.email} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{adm.email}</td>
                    <td className="py-3 px-4 text-slate-600">{adm.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        adm.role === 'administrator' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {adm.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {currentRole === 'owner' ? (
                        <select
                          value={adm.role}
                          onChange={(e) => handleRoleChange(adm.email, e.target.value)}
                          className="px-2 py-1 border border-slate-300 rounded text-xs bg-white cursor-pointer"
                        >
                          <option value="owner">Owner</option>
                          <option value="administrator">Administrator</option>
                          <option value="fee_manager">Fee Manager</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-slate-400">Owner Access Required</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Permission Entitlements Matrix</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-purple-700 block mb-1">Owner</span>
                <p className="text-[11px] text-slate-500">
                  Full control: Academy settings, administrator role assignment, full backup and restoration, fee waivers, sensitive data export.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-blue-700 block mb-1">Administrator</span>
                <p className="text-[11px] text-slate-500">
                  Operational authority: Batch and student lifecycle management, payment recording, reminder dispatch, fee adjustments, and standard exports.
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-amber-700 block mb-1">Fee Manager</span>
                <p className="text-[11px] text-slate-500">
                  Finance desk: Fee schedules, payment collection recording, receipt issuance, WhatsApp reminder dispatch, and collection exports.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#0F172A]">Institutional Backup &amp; Disaster Recovery</h2>
            <p className="text-xs text-slate-500 mt-1">
              Maintain institutional continuity. Export encrypted snapshots of student ledgers, batches, and transactions.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 space-y-1">
            <p className="font-bold">Recovery Time Objective (RTO) &amp; Recovery Point Objective (RPO) Policy</p>
            <p className="text-[11px]">
              • <strong>RTO (&lt; 1 hour)</strong>: Campus operations and student records must be restorable within 60 minutes in the event of hardware or system failure.
            </p>
            <p className="text-[11px]">
              • <strong>RPO (&lt; 24 hours)</strong>: Daily collection logs and transaction receipts must be backed up at the close of every business day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 border border-slate-200 rounded-xl space-y-3 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-[#EA580C]" />
                <h3 className="font-bold text-sm text-[#0F172A]">Export Complete System Snapshot</h3>
              </div>
              <p className="text-xs text-slate-500">
                Generates a verified, portable JSON snapshot encompassing all active and archived students, batches, fee obligations, receipts, audit logs, and settings.
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Database Snapshot</span>
              </button>
            </div>

            <div className="p-5 border border-slate-200 rounded-xl space-y-3 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-[#0F172A]">Restore From Verified Snapshot</h3>
              </div>
              <p className="text-xs text-slate-500">
                Restores an authenticated backup snapshot into the institutional ledger with schema validation and pre-flight checks.
              </p>
              <button
                type="button"
                onClick={() => setRestoreModalOpen(true)}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Open Restoration Center</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-extrabold text-[#0F172A] flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>Database Snapshot Restoration</span>
              </h2>
              <button onClick={() => setRestoreModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            {restoreError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-800 text-xs mb-4">
                {restoreError}
              </div>
            )}

            {restoreSuccess && (
              <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md text-emerald-800 text-xs mb-4">
                {restoreSuccess}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select JSON Snapshot File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelectForRestore}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50"
                />
              </div>

              {restoreFileContent && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Campus:</span>
                    <span className="font-bold">{restoreFileContent.campus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exported At:</span>
                    <span className="font-mono">{restoreFileContent.exportedAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Students:</span>
                    <span className="font-bold text-emerald-600">{restoreFileContent.counts?.students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Batches:</span>
                    <span className="font-bold text-blue-600">{restoreFileContent.counts?.batches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payments:</span>
                    <span className="font-bold text-purple-600">{restoreFileContent.counts?.payments}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRestoreModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={!restoreFileContent}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Execute Verified Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
