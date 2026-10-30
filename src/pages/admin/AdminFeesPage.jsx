import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';
import { requireAdminEmail } from '../../services/adminIdentity';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function AdminFeesPage() {
  const [searchParams] = useSearchParams();
  const [obligations, setObligations] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingWaivers, setPendingWaivers] = useState([]);
  const [activeTab, setActiveTab] = useState('schedules');

  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Maker request modal state
  const [waiverModalObligation, setWaiverModalObligation] = useState(null);
  const [waiverAmount, setWaiverAmount] = useState('');
  const [waiverReason, setWaiverReason] = useState('');
  const [submittingWaiver, setSubmittingWaiver] = useState(false);

  const loadData = async () => {
    try {
      const [o, s, w] = await Promise.all([
        AdminDataService.getFeeObligations(),
        AdminDataService.getStudents(),
        AdminDataService.getPendingFeeWaivers().catch(() => [])
      ]);
      setObligations(o);
      setStudents(s);
      setPendingWaivers(w);
    } catch (err) {
      console.error('Failed to load fee obligations:', err);
      setFormError(err.message || 'Fee schedules could not be loaded from the database.');
    }
  };

  const handleRequestWaiver = async (e) => {
    e.preventDefault();
    if (!waiverModalObligation || submittingWaiver) return;
    setFormError('');
    setFormSuccess('');
    try {
      setSubmittingWaiver(true);
      const currentAdmin = requireAdminEmail();
      await AdminDataService.requestFeeWaiver(
        waiverModalObligation.id,
        Number(waiverAmount),
        waiverReason,
        currentAdmin
      );
      setFormSuccess(`Maker-Checker: Fee waiver request of ₹${waiverAmount} submitted for ${waiverModalObligation.studentName}. Awaiting Owner/Director review.`);
      setWaiverModalObligation(null);
      setWaiverAmount('');
      setWaiverReason('');
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to submit waiver request.');
    } finally {
      setSubmittingWaiver(false);
    }
  };

  const handleApproveWaiver = async (waiverId) => {
    setFormError('');
    setFormSuccess('');
    try {
      const currentAdmin = requireAdminEmail();
      await AdminDataService.approveFeeWaiver(waiverId, currentAdmin);
      setFormSuccess('Maker-Checker: Fee waiver verified & approved. Fee obligation ledger updated.');
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Approval failed.');
    }
  };

  const handleRejectWaiver = async (waiverId) => {
    const reason = window.prompt('Enter reason for rejecting this fee waiver request:');
    if (!reason) return;
    setFormError('');
    setFormSuccess('');
    try {
      const currentAdmin = requireAdminEmail();
      await AdminDataService.rejectFeeWaiver(waiverId, reason, currentAdmin);
      setFormSuccess('Waiver request rejected and logged in audit trail.');
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Rejection failed.');
    }
  };

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
    loadData();
  }, [searchParams]);

  const handleGenerateNextCycle = async () => {
    setFormError('');
    setFormSuccess('');
    try {
      const activeStudents = students.filter(s => s.status === 'active' || s.status === 'new_enrollment');
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const cycleName = `${nextMonth.toLocaleString('en-US', { month: 'long' })} ${nextMonth.getFullYear()}`;
      const nextDueDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-05`;

      const currentAdmin = requireAdminEmail();

      const result = await AdminDataService.generateMonthlyFeeCycle(
        activeStudents,
        cycleName,
        nextDueDate,
        currentAdmin
      );

      setFormSuccess(`Generated ${result.createdCount} obligations for ${cycleName} (${result.skippedCount} already existed/skipped). Atomic duplicate checks applied.`);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Generation failed.');
    }
  };

  const filteredObligations = obligations.filter((obl) => {
    if (statusFilter !== 'all' && obl.status !== statusFilter) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        obl.studentName.toLowerCase().includes(q) ||
        obl.id.toLowerCase().includes(q) ||
        obl.billingCycle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredObligations.length / pageSize) || 1;
  const paginatedObligations = filteredObligations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const waiverModalRef = useRef(null);
  useFocusTrap(waiverModalRef, Boolean(waiverModalObligation));

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs min-w-0 max-w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Recurring Fee Schedules &amp; Obligations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Two-Person Maker-Checker Fee Waiver Governance &bull; Track student billing cycles, monthly dues, and due date schedules
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateNextCycle}
          className="w-full sm:w-auto justify-center inline-flex items-center space-x-2 px-4 py-2.5 bg-brand hover:bg-brand-strong text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Generate Next Billing Cycle</span>
        </button>
      </div>

      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`pb-3 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'schedules'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Fee Schedules &amp; Obligations ({obligations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pending_waivers')}
          className={`pb-3 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center space-x-1.5 ${
            activeTab === 'pending_waivers'
              ? 'border-brand text-brand'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Maker-Checker Waiver Requests</span>
          {pendingWaivers.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
              {pendingWaivers.length}
            </span>
          )}
        </button>
      </div>

      {formSuccess && (
        <div role="status" aria-live="polite" className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {formError && (
        <div role="alert" className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{formError}</span>
          </div>
          <button onClick={() => setFormError('')} className="text-red-600 hover:text-red-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activeTab === 'pending_waivers' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Maker-Checker Approval Queue
              </h2>
              <p className="text-[11px] text-slate-500">
                Staff initiation requires secondary Owner or Director review. The requesting staff member cannot approve their own waiver.
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
              {pendingWaivers.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Request ID</th>
                  <th className="py-3 px-4 font-bold">Student</th>
                  <th className="py-3 px-4 font-bold">Cycle</th>
                  <th className="py-3 px-4 font-bold">Balance</th>
                  <th className="py-3 px-4 font-bold">Requested Waiver</th>
                  <th className="py-3 px-4 font-bold">Reason</th>
                  <th className="py-3 px-4 font-bold">Initiated By</th>
                  <th className="py-3 px-4 font-bold text-right">Checker Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingWaivers.length > 0 ? (
                  pendingWaivers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{w.id}</td>
                      <td className="py-3 px-4 font-bold text-[#0F172A]">{w.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">{w.billingCycle}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">₹{w.currentBalance}</td>
                      <td className="py-3 px-4 font-mono font-bold text-purple-700">₹{w.requestedAmount}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={w.reason}>{w.reason}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{w.requestedBy}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleApproveWaiver(w.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectWaiver(w.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-bold text-[11px] cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                      No pending fee waiver requests. All discounts and waivers are fully reconciled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between min-w-0 max-w-full">
            <div className="relative w-full sm:flex-1 min-w-[200px] max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by student name, obligation ID, or cycle..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
                <option value="paid">Fully Paid</option>
                <option value="waived">Waived</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-w-0 max-w-full">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-bold">Obligation ID</th>
                    <th className="py-3 px-4 font-bold">Student</th>
                    <th className="py-3 px-4 font-bold">Billing Cycle</th>
                    <th className="py-3 px-4 font-bold">Due Date</th>
                    <th className="py-3 px-4 font-bold">Amount Due</th>
                    <th className="py-3 px-4 font-bold">Amount Paid</th>
                    <th className="py-3 px-4 font-bold">Remaining Balance</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedObligations.length > 0 ? (
                    paginatedObligations.map((obl) => (
                      <tr key={obl.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {obl.id}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                          {obl.studentName}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {obl.billingCycle}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {obl.dueDate}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                          ₹{obl.amountDue}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          ₹{obl.amountPaid || 0}
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-[#0F172A]">
                          ₹{obl.balance}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`uppercase font-bold text-[10px] px-2 py-0.5 rounded-full ${
                            obl.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            obl.status === 'overdue' ? 'bg-red-100 text-red-800 border border-red-200' :
                            obl.status === 'partially_paid' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            obl.status === 'waived' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {obl.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {obl.balance > 0 && obl.status !== 'paid' && obl.status !== 'waived' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWaiverModalObligation(obl);
                                    setWaiverAmount(String(obl.balance));
                                    setWaiverReason('');
                                  }}
                                  className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-bold text-[11px] cursor-pointer"
                                  title="Propose Maker-Checker Fee Waiver"
                                >
                                  Waiver
                                </button>
                                <Link
                                  to={`/admin-portal/ledger?studentId=${obl.studentId}&obligationId=${obl.id}`}
                                  className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-brand rounded-md font-bold text-[11px] cursor-pointer"
                                >
                                  Pay
                                </Link>
                              </>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                                Settled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400 text-xs">
                        No fee obligations match the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                <span>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredObligations.length)} of {filteredObligations.length} obligations
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-bold text-slate-700">{currentPage} / {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Maker Fee Waiver Request Modal with WCAG Focus Trap */}
      {waiverModalObligation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="waiver-modal-title"
        >
          <div 
            ref={waiverModalRef}
            className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 relative animate-scale-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 id="waiver-modal-title" className="text-sm font-extrabold text-[#0F172A]">
                  Request Fee Waiver / Discount (Maker)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWaiverModalObligation(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestWaiver} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Student Name:</span>
                  <span className="font-bold text-[#0F172A]">{waiverModalObligation.studentName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Billing Cycle:</span>
                  <span className="font-mono text-slate-800">{waiverModalObligation.billingCycle}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current Outstanding Balance:</span>
                  <span className="font-bold text-[#0F172A]">₹{waiverModalObligation.balance}</span>
                </div>
              </div>

              <div>
                <label htmlFor="waiver-amount-input" className="block text-slate-700 font-bold mb-1">
                  Waiver Amount to Request (₹) *
                </label>
                <input
                  id="waiver-amount-input"
                  type="number"
                  min="1"
                  max={waiverModalObligation.balance}
                  value={waiverAmount}
                  onChange={(e) => setWaiverAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label htmlFor="waiver-reason-input" className="block text-slate-700 font-bold mb-1">
                  Justification / Reason (Sibling discount, Merit, Hardship) *
                </label>
                <textarea
                  id="waiver-reason-input"
                  rows="3"
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  placeholder="e.g. Sibling discount approved for 2nd enrolled child; verified by campus reception desk."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Minimum 5 characters. Must be reviewed and signed off by Owner / Managing Director.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWaiverModalObligation(null)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWaiver}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {submittingWaiver ? 'Submitting...' : 'Submit Request for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
