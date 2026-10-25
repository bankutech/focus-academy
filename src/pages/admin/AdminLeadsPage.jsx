import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Phone, 
  MessageSquare, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Archive, 
  GraduationCap, 
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';
import { requireAdminEmail } from '../../services/adminIdentity';
import { CAMPUS_CONFIG } from '../../config/campusConfig';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [convertModalLead, setConvertModalLead] = useState(null);
  const [convertBatchId, setConvertBatchId] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  const [convertDiscount, setConvertDiscount] = useState('0');
  const [convertSession, setConvertSession] = useState('2025-2026');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leadsList, batchesList] = await Promise.all([
        AdminDataService.getLeads(),
        AdminDataService.getBatches()
      ]);
      setLeads(leadsList);
      setBatches(batchesList);
    } catch (err) {
      console.error('Failed to load admission leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const currentAdmin = requireAdminEmail();
      await AdminDataService.updateLeadStatus(leadId, newStatus, currentAdmin);
      setFormSuccess(`Updated lead status to '${newStatus}'.`);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to update lead status.');
    }
  };

  const handleOpenConvert = (lead) => {
    setConvertModalLead(lead);
    const matchedBatch = batches.find(b => b.id === lead.batchId) ||
      batches.find(b => b.grade === lead.grade) ||
      batches[0];
    setConvertBatchId(matchedBatch?.id || '');
    setConvertAmount(matchedBatch?.monthlyFee || 2200);
    setConvertDiscount('0');
    setConvertSession('2025-2026');
    setFormError('');
  };

  const handleExecuteConvert = async (e) => {
    e.preventDefault();
    if (!convertBatchId) {
      setFormError('Please select a target batch.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const currentAdmin = requireAdminEmail();
      await AdminDataService.convertLeadToStudent(
        convertModalLead,
        {
          batchId: convertBatchId,
          amountPerCycle: Number(convertAmount) || 2200,
          discountAdjustment: Number(convertDiscount) || 0,
          academicSession: convertSession
        },
        currentAdmin
      );
      setFormSuccess(`Successfully converted ${convertModalLead.studentName} into registered student roster!`);
      setConvertModalLead(null);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Conversion failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const metrics = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter(l => !l.status || l.status === 'new').length;
    const contacted = leads.filter(l => l.status === 'contacted').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, newCount, contacted, converted, conversionRate };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const status = lead.status || 'new';
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      const source = lead.source || (lead.reservationId ? 'enrollment' : 'inquiry');
      if (sourceFilter !== 'all' && source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = lead.studentName?.toLowerCase().includes(q);
        const matchesParent = lead.parentName?.toLowerCase().includes(q);
        const matchesPhone = lead.phone?.includes(q);
        const matchesGrade = lead.grade?.toLowerCase().includes(q);
        const matchesNotes = lead.notes?.toLowerCase().includes(q);
        return matchesName || matchesParent || matchesPhone || matchesGrade || matchesNotes;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, search]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status = 'new') => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
            <span>New Admission</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Phone className="w-3 h-3 text-blue-500" />
            <span>Contacted</span>
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Enrolled Student</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="w-3 h-3 text-slate-400" />
            <span>Archived</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Admission Inquiries & Leads</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time prospective admissions from the 5-step enrollment funnel & website inquiries.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-xs hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Leads</span>
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{formSuccess}</span>
          <button type="button" onClick={() => setFormSuccess('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 flex items-center justify-between">
          <span>{formError}</span>
          <button type="button" onClick={() => setFormError('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Inquiries</span>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{metrics.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-orange-600">New / Uncontacted</span>
          <div className="text-2xl font-black text-[#EA580C] mt-1">{metrics.newCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-blue-600">Counselor Contacted</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{metrics.contacted}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600">Enrolled ({metrics.conversionRate}%)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.converted}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search by student, parent, mobile, batch..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EA580C]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Inquiries</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Enrolled Student</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="all">All Channels</option>
            <option value="enrollment">Online Admission Funnel</option>
            <option value="inquiry">Campus Inquiries</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-[#EA580C]" />
            Loading admissions inquiries...
          </div>
        ) : paginatedLeads.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No admission inquiries found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student & Guardian</th>
                  <th className="py-3.5 px-4">Academic Level</th>
                  <th className="py-3.5 px-4">Selected Batch</th>
                  <th className="py-3.5 px-4">Status & Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedLeads.map((lead) => {
                  const rawPhone = lead.phone || '';
                  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
                  const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${lead.parentName || 'Parent'}, this is Focus Academy regarding admission for ${lead.studentName}. How can we assist you today?`
                  )}`;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A] text-sm">{lead.studentName}</div>
                        <div className="text-slate-500 mt-0.5">
                          Parent: <span className="font-semibold text-slate-700">{lead.parentName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <a
                            href={`tel:+91${cleanPhone}`}
                            className="inline-flex items-center space-x-1 text-[#EA580C] hover:underline font-semibold"
                          >
                            <Phone className="w-3 h-3" />
                            <span>+91 {cleanPhone}</span>
                          </a>
                          <span className="text-slate-300">•</span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-600 hover:underline font-semibold"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-500" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">
                          {lead.grade}
                        </span>
                        <div className="text-slate-500 text-[11px] mt-1">{lead.board || 'State Board'}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {lead.subjects || lead.batchId || 'Evening Foundation'}
                        </div>
                        {lead.timing && (
                          <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{lead.timing}</span>
                          </div>
                        )}
                        {lead.reservationId && (
                          <div className="text-[10px] text-orange-600 font-mono mt-0.5 font-bold">
                            Seat Hold: {lead.reservationId}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div>{getStatusBadge(lead.status)}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {lead.timestamp ? new Date(lead.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'Recent'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {lead.status !== 'converted' && (
                            <button
                              type="button"
                              onClick={() => handleOpenConvert(lead)}
                              className="px-2.5 py-1.5 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded text-xs shadow-2xs inline-flex items-center space-x-1 cursor-pointer"
                              title="Enroll student and issue fee obligation"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Enroll</span>
                            </button>
                          )}

                          {lead.status === 'new' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(lead.id, 'contacted')}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer"
                              title="Mark as contacted"
                            >
                              Mark Contacted
                            </button>
                          )}

                          {lead.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(lead.id, 'archived')}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                              title="Archive lead"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex space-x-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {convertModalLead && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Convert Lead to Enrolled Student</h2>
                <p className="text-xs text-slate-500">Student: {convertModalLead.studentName} ({convertModalLead.grade})</p>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalLead(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteConvert} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Evening Batch</label>
                <select
                  value={convertBatchId}
                  onChange={(e) => {
                    setConvertBatchId(e.target.value);
                    const b = batches.find(item => item.id === e.target.value);
                    if (b) setConvertAmount(b.monthlyFee);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
                  required
                >
                  <option value="">Select Classroom Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.timing}) — {b.seatsRemaining ?? 12} Seats Left
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Tuition Fee (₹)</label>
                  <input
                    type="number"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount / Concession (₹)</label>
                  <input
                    type="number"
                    value={convertDiscount}
                    onChange={(e) => setConvertDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Session</label>
                <select
                  value={convertSession}
                  onChange={(e) => setConvertSession(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600">
                <span className="font-bold text-slate-800">Enrollment Actions Triggered:</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                  <li>Creates official student record in <span className="font-mono">students</span> collection.</li>
                  <li>Generates initial monthly fee obligation atomically.</li>
                  <li>Marks prospective lead as <span className="font-mono text-emerald-700">converted</span>.</li>
                  <li>Releases seat hold to <span className="font-mono text-blue-700">enrolled</span> to prevent capacity double-counting.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertModalLead(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
