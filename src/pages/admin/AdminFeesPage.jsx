import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';
import { requireAdminEmail } from '../../services/adminIdentity';

export default function AdminFeesPage() {
  const [searchParams] = useSearchParams();
  const [obligations, setObligations] = useState([]);
  const [students, setStudents] = useState([]);

  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [waiveModalObligation, setWaiveModalObligation] = useState(null);
  const [waiveAmount, setWaiveAmount] = useState('');
  const [waiveReason, setWaiveReason] = useState('');

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      const [o, s] = await Promise.all([
        AdminDataService.getFeeObligations(),
        AdminDataService.getStudents()
      ]);
      setObligations(o);
      setStudents(s);
    } catch (err) {
      console.error('Failed to load fee obligations:', err);
      setFormError(err.message || 'Fee schedules could not be loaded from the database.');
    }
  };

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
    loadData();
  }, [searchParams]);

  const handleOpenWaive = (obl) => {
    setWaiveModalObligation(obl);
    setWaiveAmount(obl.balance);
    setWaiveReason('');
    setFormError('');
  };

  const handleExecuteWaive = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!waiveReason || waiveReason.trim().length < 5) {
      setFormError('A valid reason of at least 5 characters is mandatory for audit compliance.');
      return;
    }

    try {
      const currentAdmin = requireAdminEmail();

      await AdminDataService.waiveFeeObligation(
        waiveModalObligation.id,
        waiveAmount,
        waiveReason,
        currentAdmin
      );
      setFormSuccess(`Waived ₹${waiveAmount} for ${waiveModalObligation.studentName}.`);
      setWaiveModalObligation(null);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Waiver failed.');
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Recurring Fee Schedules & Obligations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track student billing cycles, monthly dues, fee waivers, and due date schedules
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateNextCycle}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand hover:bg-brand-strong text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>Generate Next Billing Cycle</span>
        </button>
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md text-emerald-800 text-xs flex items-center justify-between">
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
        <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{formError}</span>
          </div>
          <button onClick={() => setFormError('')} className="text-red-600 hover:text-red-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[220px] max-w-md">
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

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
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
                        {obl.balance > 0 && obl.status !== 'waived' && (
                          <button
                            type="button"
                            onClick={() => handleOpenWaive(obl)}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md font-bold text-[11px] cursor-pointer"
                            title="Waive Fee"
                          >
                            Waive
                          </button>
                        )}
                        {obl.balance > 0 && obl.status !== 'paid' && obl.status !== 'waived' ? (
                          <Link
                            to={`/admin-portal/ledger?studentId=${obl.studentId}&obligationId=${obl.id}`}
                            className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-brand rounded-md font-bold text-[11px] cursor-pointer"
                          >
                            Pay
                          </Link>
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

      {waiveModalObligation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  Waive Fee Obligation
                </h2>
              </div>
              <button onClick={() => setWaiveModalObligation(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteWaive} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-purple-700">Student:</span>
                  <span className="font-bold text-purple-900">{waiveModalObligation.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Cycle:</span>
                  <span className="font-bold text-purple-900">{waiveModalObligation.billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Current Balance:</span>
                  <span className="font-extrabold text-purple-900">₹{waiveModalObligation.balance}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount to Waive (₹) *
                </label>
                <input
                  type="number"
                  max={waiveModalObligation.balance}
                  value={waiveAmount}
                  onChange={(e) => setWaiveAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Waiver (Audit Logged) *
                </label>
                <textarea
                  rows="3"
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                  placeholder="e.g. Merit scholarship approval by campus director, sibling concession"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setWaiveModalObligation(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Confirm Waiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
