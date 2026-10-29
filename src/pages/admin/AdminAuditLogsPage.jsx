import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCw, 
  Download, 
  X, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowRight
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';

const PAGE_SIZE = 25;

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const auditData = await AdminDataService.getAuditLogs(200);
      setLogs(auditData);
      setLoadError('');
    } catch (err) {
      console.error('Failed to load events log:', err);
      setLoadError(err.message || 'Events history could not be loaded from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // Keyboard dismiss for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedLog) {
        setSelectedLog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLog]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const actor = (log.actor || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      const id = (log.id || '').toLowerCase();
      const entityId = (log.entityId || '').toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch = actor.includes(query) || action.includes(query) || details.includes(query) || id.includes(query) || entityId.includes(query);
      if (!matchesSearch) return false;

      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;

      return true;
    });
  }, [logs, search, actionFilter, entityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  const exportLogsJSON = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `Focus_Academy_Events_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportLogsCSV = () => {
    const headers = ['Event ID', 'Date & Time', 'Actor', 'Event Type', 'Entity Type', 'Related Record', 'Summary'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      `"${(l.actor || '').replace(/"/g, '""')}"`,
      l.action,
      l.entityType,
      `"${(l.entityId || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Focus_Academy_Events_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActionBadge = (action) => {
    if (action.includes('DELETED') || action.includes('WAIVED')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (action.includes('CREATED') || action.includes('RECORDED')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('TRANSFERRED') || action.includes('UPDATED')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (action.includes('REMINDER')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const formatActionLabel = (action) => {
    return String(action || '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={loadLogs}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-md font-bold cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight flex items-center space-x-2">
            <span>Campus Events &amp; Activity Log</span>
            <Activity className="w-5 h-5 text-emerald-600" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chronological record of student admissions, batch updates, fee payments, and campus notifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={exportLogsCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={exportLogsJSON}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search events by student name, actor, record ID..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white cursor-pointer"
            >
              <option value="all">All Events</option>
              <option value="STUDENT_CREATED">Student Created</option>
              <option value="STUDENT_UPDATED">Student Updated</option>
              <option value="STUDENT_TRANSFERRED">Student Transferred</option>
              <option value="BATCH_CREATED">Batch Created</option>
              <option value="BATCH_UPDATED">Batch Updated</option>
              <option value="PAYMENT_RECORDED">Payment Recorded</option>
              <option value="FEE_WAIVED">Fee Adjusted</option>
              <option value="REMINDER_TRIGGERED">Reminder Triggered</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white cursor-pointer"
            >
              <option value="all">All Record Types</option>
              <option value="student">Student</option>
              <option value="batch">Batch</option>
              <option value="payment">Payment</option>
              <option value="fee_obligation">Fee Schedule</option>
              <option value="reminder">WhatsApp Notice</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Date &amp; Time</th>
                <th className="py-3 px-4 font-bold">Event Type</th>
                <th className="py-3 px-4 font-bold">Related Record</th>
                <th className="py-3 px-4 font-bold">Logged By</th>
                <th className="py-3 px-4 font-bold">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading campus events...</span>
                  </td>
                </tr>
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedLog(log);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${log.action} event on ${log.entityType}`}
                    className="hover:bg-orange-50/40 focus:bg-orange-50/60 focus:outline-hidden transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${getActionBadge(log.action)}`}>
                        {formatActionLabel(log.action)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold capitalize text-[#0F172A]">{log.entityType}</div>
                      <div className="font-mono text-[10px] text-slate-400">{log.entityId}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800 truncate max-w-[160px]" title={log.actor}>
                      {log.actor}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate" title={log.details}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{log.details}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-xs">
                    No events found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} events
            </span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <span className="px-3 font-semibold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center space-x-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedLog(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-dialog-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-brand" />
                <h2 id="event-dialog-title" className="text-base font-extrabold text-[#0F172A]">
                  Event Information
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedLog(null)} 
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Event Type</span>
                  <span className={`inline-block font-bold text-[10px] px-2.5 py-0.5 rounded-full border ${getActionBadge(selectedLog.action)}`}>
                    {formatActionLabel(selectedLog.action)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Recorded At</span>
                  <span className="font-mono text-slate-800">
                    {new Date(selectedLog.timestamp).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Logged By (Staff)</span>
                  <span className="font-bold text-slate-800 break-all">{selectedLog.actor}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Affected Record</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedLog.entityType}</span>
                  <span className="font-mono text-[10px] text-slate-500 block truncate">{selectedLog.entityId}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Event Summary &amp; Details</span>
                <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-sans text-xs">
                  {selectedLog.details}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">ID: {selectedLog.id}</span>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
