import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCw,
  Eye
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';

export default function AdminRemindersPage() {
  const [searchParams] = useSearchParams();
  const [reminders, setReminders] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'pending';
  const initialFilter = searchParams.get('tab') === 'overdue' ? 'overdue' : (searchParams.get('tab') === 'today' ? 'today' : (searchParams.get('filter') || 'all'));

  const [activeTab, setActiveTab] = useState(initialTab); // 'pending' | 'history'
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState(initialFilter); // 'all' | 'overdue' | 'upcoming' | 'today'

  const [previewModal, setPreviewModal] = useState(null);
  const [settings, setSettings] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [sendingId, setSendingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [r, o, s, setts] = await Promise.all([
        AdminDataService.getReminders(),
        AdminDataService.getFeeObligations(),
        AdminDataService.getStudents(),
        AdminDataService.getSettings()
      ]);
      setReminders(r);
      setObligations(o);
      setStudents(s);
      setSettings(setts);
    } catch (err) {
      console.error('Failed to load reminders data:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load reminders data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentMap = new Map(students.map(s => [s.id, s]));

  const pendingObligations = obligations.filter(obl => {
    if (obl.balance <= 0 || obl.status === 'paid' || obl.status === 'waived') {
      return false;
    }
    const student = studentMap.get(obl.studentId);
    if (!student || student.status === 'archived') {
      return false;
    }
    return true;
  });

  const getRecentReminderForObligation = (obligationId) => {
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    return reminders.find(r => r.obligationId === obligationId && r.timestamp > oneDayAgo);
  };

  const handleSendReminder = async (obligation, reminderType = 'upcoming') => {
    setStatusMessage({ type: '', text: '' });
    setSendingId(obligation.id);

    try {
      const student = studentMap.get(obligation.studentId);
      if (!student) {
        throw new Error('Student record not found for this obligation.');
      }

      const rawSession = sessionStorage.getItem('focus_academy_admin_session');
      let currentAdmin = 'admin@focusacademyperambalur.com';
      if (rawSession) {
        try {
          const parsed = JSON.parse(rawSession);
          if (parsed?.email) currentAdmin = parsed.email;
        } catch {}
      }

      const result = await AdminDataService.sendOrLogWhatsAppReminder({
        studentId: obligation.studentId,
        obligationId: obligation.id,
        reminderType
      }, currentAdmin);

      setStatusMessage({
        type: 'success',
        text: `WhatsApp reminder recorded for ${obligation.studentName}. Opening chat dispatch window...`
      });

      if (result.clickToChatUrl) {
        window.open(result.clickToChatUrl, '_blank', 'noopener,noreferrer');
      }

      await loadData();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch WhatsApp reminder.'
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleRetryReminder = async (reminderId) => {
    setStatusMessage({ type: '', text: '' });
    try {
      const rawSession = sessionStorage.getItem('focus_academy_admin_session');
      let currentAdmin = 'admin@focusacademyperambalur.com';
      if (rawSession) {
        try {
          const parsed = JSON.parse(rawSession);
          if (parsed?.email) currentAdmin = parsed.email;
        } catch {}
      }

      const result = await AdminDataService.retryFailedReminder(reminderId, currentAdmin);
      setStatusMessage({
        type: 'success',
        text: `Retried reminder. Opening WhatsApp dispatch window...`
      });
      if (result.clickToChatUrl) {
        window.open(result.clickToChatUrl, '_blank', 'noopener,noreferrer');
      }
      await loadData();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Retry failed.'
      });
    }
  };

  const filteredPending = pendingObligations.filter(obl => {
    const sName = (obl.studentName || '').toLowerCase();
    const oId = (obl.id || '').toLowerCase();
    const cycle = (obl.billingCycle || '').toLowerCase();
    const student = studentMap.get(obl.studentId);
    const phone = (student?.guardianPhone || '');
    const sId = (obl.studentId || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = sName.includes(query) || oId.includes(query) || cycle.includes(query) || phone.includes(query) || sId.includes(query);
    if (!matchesSearch) return false;

    const today = new Date().toISOString().split('T')[0];
    if (filterType === 'overdue') return obl.status === 'overdue';
    if (filterType === 'today') return obl.dueDate === today;
    if (filterType === 'upcoming') {
      const timingDays = settings?.reminderTimingDaysBeforeDue || 3;
      const diffDays = Math.ceil((new Date(obl.dueDate).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
      return obl.status !== 'overdue' && diffDays >= 0 && diffDays <= timingDays;
    }
    return true;
  });

  const filteredHistory = reminders.filter(r => {
    const sName = (r.studentName || '').toLowerCase();
    const rId = (r.id || '').toLowerCase();
    const phone = (r.guardianPhone || '');
    const query = search.toLowerCase();

    const matchesSearch = sName.includes(query) || rId.includes(query) || phone.includes(query);
    if (!matchesSearch) return false;

    if (filterType === 'overdue') return r.reminderType === 'overdue';
    if (filterType === 'upcoming') return r.reminderType === 'upcoming';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            WhatsApp Fee Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official communications for pending and overdue fee collections via verified WhatsApp protocols.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs transition-colors cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pending Obligations
          </span>
          <span className="text-2xl font-extrabold text-[#0F172A]">
            {pendingObligations.length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Require follow-up or payment verification
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Overdue Balance
          </span>
          <span className="text-2xl font-extrabold text-red-600">
            ₹{pendingObligations.filter(o => o.status === 'overdue').reduce((sum, o) => sum + (o.balance || 0), 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-red-600 font-semibold block mt-0.5">
            {pendingObligations.filter(o => o.status === 'overdue').length} overdue accounts
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Dispatched Logs
          </span>
          <span className="text-2xl font-extrabold text-emerald-600">
            {reminders.length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            Recorded in institutional audit trail
          </span>
        </div>
      </div>

      {statusMessage.text && (
        <div className={`p-3.5 rounded-lg text-xs flex items-center justify-between border-l-4 ${
          statusMessage.type === 'error'
            ? 'bg-red-50 border-red-500 text-red-800'
            : 'bg-emerald-50 border-emerald-500 text-emerald-800'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage({ type: '', text: '' })} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex border-b border-slate-200 space-x-4">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center space-x-2 ${
            activeTab === 'pending'
              ? 'border-[#EA580C] text-[#EA580C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Action Required ({pendingObligations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-[#EA580C] text-[#EA580C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Dispatch History ({reminders.length})</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'pending' ? "Search student, obligation ID..." : "Search student, reminder ID, phone..."}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EA580C]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
          >
            <option value="all">All Obligations</option>
            <option value="overdue">Overdue Only</option>
            <option value="upcoming">Upcoming Due Only</option>
            <option value="today">Due Today Only</option>
          </select>
        </div>
      </div>

      {activeTab === 'pending' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Obligation</th>
                  <th className="py-3 px-4 font-bold">Student Name</th>
                  <th className="py-3 px-4 font-bold">Guardian Contact</th>
                  <th className="py-3 px-4 font-bold">Due Date</th>
                  <th className="py-3 px-4 font-bold">Balance</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Recent Reminder</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPending.length > 0 ? (
                  filteredPending.map((obl) => {
                    const student = studentMap.get(obl.studentId);
                    const prefs = student?.notificationPreferences || {};
                    const isRemindersDisabled = Boolean(prefs.remindersDisabled) || prefs.communicationConsent === false;
                    const disabledNotice = prefs.remindersDisabled
                      ? (prefs.reminderDisabledReason || 'Reminders disabled for student')
                      : (prefs.communicationConsent === false ? 'Guardian consent not granted' : '');
                    const recentReminder = getRecentReminderForObligation(obl.id);
                    const isOverdue = obl.status === 'overdue';
                    const reminderType = isOverdue ? 'overdue' : 'upcoming';

                    return (
                      <tr key={obl.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          <div>{obl.id}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{obl.billingCycle}</div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                          <div>{obl.studentName}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{student?.grade || ''}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-700 font-semibold">
                            +91 {student?.guardianPhone || 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {student?.guardianName || 'Guardian'}
                          </div>
                          {isRemindersDisabled && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                              {disabledNotice}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {obl.dueDate}
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-[#0F172A]">
                          ₹{obl.balance}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`uppercase font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            isOverdue
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {obl.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {recentReminder ? (
                            <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Sent &lt;24h ago</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Not sent recently</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setPreviewModal({
                                studentName: obl.studentName,
                                balance: obl.balance,
                                dueDate: obl.dueDate,
                                phone: student?.guardianPhone,
                                obligationId: obl.id,
                                reminderType
                              })}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-[11px] cursor-pointer"
                              title="Preview message"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendReminder(obl, reminderType)}
                              disabled={sendingId === obl.id || Boolean(recentReminder) || isRemindersDisabled}
                              title={isRemindersDisabled ? disabledNotice : undefined}
                              className={`px-3 py-1 rounded-md font-bold text-[11px] inline-flex items-center space-x-1.5 transition-colors cursor-pointer ${
                                recentReminder || isRemindersDisabled
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                            >
                              <Send className="w-3 h-3" />
                              <span>{sendingId === obl.id ? 'Sending...' : 'Send WhatsApp'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                      No pending obligations matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Reminder ID</th>
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">Student</th>
                  <th className="py-3 px-4 font-bold">Guardian Phone</th>
                  <th className="py-3 px-4 font-bold">Amount Due</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Channel</th>
                  <th className="py-3 px-4 font-bold">Message Content</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {rem.id}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(rem.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                        {rem.studentName}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        +91 {rem.guardianPhone}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                        ₹{rem.amount}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`uppercase font-bold text-[10px] px-2 py-0.5 rounded-full ${
                          rem.reminderType === 'overdue'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {rem.reminderType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-600 capitalize">
                        {rem.channel}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={rem.messagePreview}>
                        {rem.messagePreview}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRetryReminder(rem.id)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] inline-flex items-center space-x-1 cursor-pointer"
                          title="Manually retry dispatch without duplicate obligation"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 text-xs">
                      No reminder logs match the search query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  WhatsApp Message Preview
                </h2>
              </div>
              <button onClick={() => setPreviewModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient Student:</span>
                  <span className="font-bold text-[#0F172A]">{previewModal.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Guardian Phone:</span>
                  <span className="font-mono font-bold text-[#0F172A]">+91 {previewModal.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Due:</span>
                  <span className="font-extrabold text-red-600">₹{previewModal.balance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-mono font-bold text-slate-700">{previewModal.dueDate}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Standard Instituted Notification Body:
                </label>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-950 font-sans leading-relaxed">
                  {AdminDataService.generateWhatsAppMessage({
                    studentName: previewModal.studentName,
                    amount: previewModal.balance,
                    dueDate: previewModal.dueDate
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Standardized text complies with regulatory communications and automated record linkage.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const obl = obligations.find(o => o.id === previewModal.obligationId);
                    setPreviewModal(null);
                    if (obl) {
                      handleSendReminder(obl, previewModal.reminderType);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
