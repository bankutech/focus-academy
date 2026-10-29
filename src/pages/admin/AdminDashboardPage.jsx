import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Layers, 
  Receipt, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';
import { getVerifiedAdminEmail } from '../../services/adminIdentity';
import { ChartCard, DonutChart, BarChart } from '../../components/admin/Charts';
import { feeStatusBreakdown, batchOccupancy, monthlyCollections, rupees } from '../../components/admin/chartData';
import { buildActionItems, unmetActionCount } from '../../components/admin/actionItems';
import { formatPhoneNumber } from '../../utils/phoneValidation';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [batches, setBatches] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [dataErrors, setDataErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDataErrors([]);
    const errors = [];
    const canViewAudit = AdminDataService.hasPermission(getVerifiedAdminEmail() || '', 'canManageSettings');
    const safeGet = async (label, fn) => {
      try { 
        return await fn(); 
      } catch (err) { 
        errors.push(`${label}: ${err.message || 'unavailable'}`); 
        return null; 
      }
    };

    const [b, o, p, enr, st, ld, res, rem, rec, logs] = await Promise.all([
      safeGet('Batches', () => AdminDataService.getBatches()),
      safeGet('Fee Obligations', () => AdminDataService.getFeeObligations()),
      safeGet('Payments', () => AdminDataService.getPayments()),
      safeGet('Enrollments', () => AdminDataService.getEnrollments()),
      safeGet('Students', () => AdminDataService.getStudents()),
      safeGet('Leads', () => AdminDataService.getLeads()),
      safeGet('Reservations', () => AdminDataService.getReservations()),
      safeGet('Reminders', () => AdminDataService.getReminders()),
      safeGet('Reconciliations', () => AdminDataService.getCollectionReconciliations()),
      canViewAudit ? safeGet('Audit Logs', () => AdminDataService.getAuditLogs()) : Promise.resolve([]),
    ]);

    const m = await safeGet('Metrics', () => AdminDataService.getDashboardMetrics({
      students: st || [],
      batches: b || [],
      obligations: o || [],
      payments: p || [],
      enrollments: enr || [],
      leads: ld || []
    }));

    if (m) setMetrics(m);
    if (b) setBatches(b.filter(item => !item.isArchived));
    if (o) setObligations(o);
    if (p) setPayments(p);
    if (enr) setEnrollments(enr);
    if (res) setReservations(res);
    if (rem) setReminders(rem);
    if (rec) setReconciliations(rec);
    if (logs) setAuditLogs(logs);

    setDataErrors(errors);
    setLoading(false);
  }, []);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  const activeHoldsByBatch = useMemo(() => {
    const nowMs = Date.now();
    return (reservations || []).reduce((acc, r) => {
      if (r.batchId && r.status === 'held' && r.expiresAt && new Date(r.expiresAt).getTime() > nowMs) {
        acc[r.batchId] = (acc[r.batchId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [reservations]);

  const canViewAuditRecords = AdminDataService.hasPermission(getVerifiedAdminEmail() || '', 'canManageSettings');

  const actionItems = useMemo(
    () => buildActionItems({
      batches,
      obligations,
      enrollments,
      reminders,
      reconciliations,
      auditLogs: canViewAuditRecords ? auditLogs : null,
      dataErrors,
      reservations,
    }),
    [batches, obligations, enrollments, reminders, reconciliations, auditLogs, dataErrors, reservations, canViewAuditRecords]
  );

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-none border border-slate-200">
        <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full admin-keep-circle animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Campus Records...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Students',
      value: metrics?.totalActiveStudents ?? 0,
      sub: 'Enrolled in 2025–2026 batches',
      icon: Users,
      badge: 'Academic Roster',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      link: '/admin-portal/students'
    },
    {
      title: 'Active Batches',
      value: metrics?.totalActiveBatches ?? 0,
      sub: 'Capped at 12 students / classroom',
      icon: Layers,
      badge: 'Classroom Cap: 12',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      link: '/admin-portal/batches'
    },
    {
      title: 'Admissions & Enrollments',
      value: metrics?.totalEnrollments ?? 0,
      sub: 'Confirmed batch registrations',
      icon: ClipboardCheck,
      badge: 'Enrollment Desk',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
      link: '/admin-portal/leads?source=enrollment'
    },
    {
      title: 'Collected This Month',
      value: `₹${(metrics?.feesCollectedThisMonth ?? 0).toLocaleString('en-IN')}`,
      sub: 'Verified ledger receipts',
      icon: TrendingUp,
      badge: 'Verified Ledger',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: '/admin-portal/ledger'
    },
    {
      title: 'Total Outstanding',
      value: `₹${(metrics?.totalOutstandingFees ?? 0).toLocaleString('en-IN')}`,
      sub: 'Active pending balances',
      icon: Receipt,
      badge: 'Pending Balance',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      link: '/admin-portal/fees?status=pending'
    },
    {
      title: 'Overdue Fees',
      value: `₹${(metrics?.totalOverdueFees ?? 0).toLocaleString('en-IN')}`,
      sub: 'Payment due date lapsed',
      icon: AlertTriangle,
      badge: 'Action Required',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      link: '/admin-portal/reminders?tab=overdue'
    },
    {
      title: 'Due Today',
      value: metrics?.paymentsDueTodayCount ?? 0,
      sub: 'Requires reminder dispatch',
      icon: Clock,
      badge: 'Daily Schedule',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
      link: '/admin-portal/reminders?tab=today'
    },
    {
      title: 'Counseling Inquiries',
      value: metrics?.totalInquiries ?? 0,
      sub: 'Prospects requesting campus callback',
      icon: UserPlus,
      badge: 'CRM Pipeline',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      link: '/admin-portal/leads?source=inquiry'
    }
  ];

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <div className="bg-white p-4 sm:p-5 rounded-none border border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0 max-w-full">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Campus Operations Dashboard
            </h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-none text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Session 2025–2026</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Focus Academy • Thiripura Complex, Thoramangalam, Perambalur
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-none text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin-portal/ledger"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-none text-xs font-semibold transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Link>
          <Link
            to="/admin-portal/students"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-strong text-white rounded-none text-xs font-semibold transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </Link>
          <Link
            to="/admin-portal/reminders"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-none text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Due Notices</span>
          </Link>
        </div>
      </div>

      {actionItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-none p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">Action Required</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generated from saved admissions, ledgers, reconciliations, reminders and audit records.
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[11px] font-bold border shrink-0 ${
              unmetActionCount(actionItems) > 0
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{unmetActionCount(actionItems)} needing attention</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionItems.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className={`border rounded-none p-3 flex flex-col justify-between gap-2 hover:bg-slate-50 transition-colors ${
                  item.severity === 'critical'
                    ? 'border-rose-200 bg-rose-50/40'
                    : item.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#0F172A]">{item.title}</span>
                    {item.amount !== undefined && (
                      <span className="font-mono text-[11px] font-bold text-rose-700 shrink-0">
                        ₹{Number(item.amount).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{item.detail}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand">
                  <span>{item.linkLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {dataErrors.length > 0 && (
        <div role="status" className="bg-amber-50 border border-amber-200 rounded-none p-4 text-xs text-amber-900">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Some data sources are temporarily unavailable. Showing cached or partial data.</p>
              {dataErrors.map((e, i) => (
                <p key={i} className="text-amber-800 text-[11px]">• {e}</p>
              ))}
              <button
                type="button"
                onClick={loadData}
                className="mt-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-none text-[11px] cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 min-w-0">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="p-4 bg-white rounded-none border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer group flex flex-col justify-between min-w-0 max-w-full overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="p-1.5 rounded-none bg-slate-100 text-slate-700 group-hover:bg-[#0F172A] group-hover:text-white transition-colors shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate">
                    {card.title}
                  </span>
                </div>
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-none border shrink-0 ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>

              <div className="my-1.5 min-w-0">
                <span className="text-2xl font-bold text-[#0F172A] tracking-tight font-mono truncate block">
                  {card.value}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-700 transition-colors gap-2 min-w-0">
                <span className="truncate text-[11px] min-w-0">{card.sub}</span>
                <div className="flex items-center space-x-1 text-brand font-semibold text-[11px] flex-shrink-0 ml-2">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-w-0 max-w-full">
        <ChartCard title="Fee Position" subtitle="Where every rupee billed this session stands" className="min-w-0">
          <DonutChart data={feeStatusBreakdown(obligations)} centerLabel="Billed" label="Fee position by status" />
        </ChartCard>
        <ChartCard title="Collections, Last 6 Months" subtitle="Verified receipts, reversals excluded" className="min-w-0">
          <BarChart data={monthlyCollections(payments)} format={rupees} label="Monthly fee collections" />
        </ChartCard>
        <ChartCard title="Batch Seat Fill" subtitle="Enrolled against the 12-seat classroom cap" className="min-w-0">
          <BarChart data={batchOccupancy(batches)} label="Batch occupancy" showAxisMax={false} />
        </ChartCard>
      </div>

      <div className="bg-white rounded-none border border-slate-200 p-4 sm:p-5 min-w-0 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 pb-3 border-b border-slate-200 gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A]">
                Recent Batch Admissions & Registrations
              </h2>
              <span className="px-2 py-0.5 rounded-none text-[10px] font-semibold bg-orange-100 text-orange-800 shrink-0">
                {enrollments.length} Total
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live student registrations received through the Focus Academy admission portal
            </p>
          </div>
          <Link
            to="/admin-portal/leads?source=enrollment"
            className="text-xs font-semibold text-brand hover:underline flex items-center space-x-1 shrink-0 self-start sm:self-auto"
          >
            <span>View All Admissions</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {enrollments && enrollments.length > 0 ? (
          <div className="overflow-x-auto max-w-full -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2 px-3 font-semibold">Slip No</th>
                  <th className="py-2 px-3 font-semibold">Student Name</th>
                  <th className="py-2 px-3 font-semibold">Grade & Board</th>
                  <th className="py-2 px-3 font-semibold">Selected Batch</th>
                  <th className="py-2 px-3 font-semibold">Contact Mobile</th>
                  <th className="py-2 px-3 font-semibold">Date</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.slice(0, 10).map((enrItem) => (
                  <tr 
                    key={enrItem.id} 
                    onClick={() => navigate('/admin-portal/leads?source=enrollment')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate('/admin-portal/leads?source=enrollment');
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View enrollment details for ${enrItem.studentName}`}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer focus:outline-none focus:bg-orange-50/50"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-brand text-[11px]">
                      {enrItem.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#0F172A]">{enrItem.studentName}</div>
                      {enrItem.parentName && (
                        <div className="text-[11px] text-slate-400 font-normal">Guardian: {enrItem.parentName}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span className="font-medium block">{enrItem.grade}</span>
                      <span className="text-[11px] text-slate-500">{enrItem.board}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-800 block truncate max-w-[200px]">
                        {enrItem.batchName || enrItem.selectedBatchName || 'Focus Evening Batch'}
                      </span>
                      {enrItem.timing && (
                        <span className="text-[11px] text-slate-500 font-mono">{enrItem.timing}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                      {formatPhoneNumber(enrItem.phone)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {enrItem.enrolledAt ? String(enrItem.enrolledAt).split('T')[0] : 'Today'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-semibold ${
                        enrItem.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : enrItem.status === 'waitlisted'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {enrItem.status === 'confirmed' ? 'Confirmed' : enrItem.status === 'waitlisted' ? 'Waitlisted' : 'Pending Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">No online admissions recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Once a student submits the enrollment form, their details will appear here immediately.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-w-0 max-w-full">
        <div className="lg:col-span-2 bg-white rounded-none border border-slate-200 p-4 sm:p-5 min-w-0 max-w-full overflow-hidden">
          <div className="flex flex-wrap items-center justify-between mb-3 pb-3 border-b border-slate-200 gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">
                Recent Verified Transactions
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official student fee receipts generated and attributed to campus administrators
              </p>
            </div>
            <Link
              to="/admin-portal/ledger"
              className="text-xs font-semibold text-brand hover:underline flex items-center space-x-1 shrink-0"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {metrics?.recentPayments && metrics.recentPayments.length > 0 ? (
            <div className="overflow-x-auto max-w-full -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[500px] text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2 px-3 font-semibold">Receipt #</th>
                    <th className="py-2 px-3 font-semibold">Student</th>
                    <th className="py-2 px-3 font-semibold">Amount</th>
                    <th className="py-2 px-3 font-semibold">Method</th>
                    <th className="py-2 px-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.recentPayments.slice(0, 5).map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-brand text-[11px]">
                        {pay.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#0F172A]">
                        {pay.studentName}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#0F172A] font-mono text-[11px]">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize px-2 py-0.5 rounded-none text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {String(pay.paymentMethod || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {pay.paymentDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">
              No transactions recorded yet in current cycle.
            </p>
          )}
        </div>

        <div className="bg-white rounded-none border border-slate-200 p-4 sm:p-5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
          <div>
            <div className="flex flex-wrap items-center justify-between mb-3 pb-3 border-b border-slate-200 gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">
                  12-Seat Capacity Guard
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Classroom density & reservation enforcement
                </p>
              </div>
              <Link to="/admin-portal/batches" className="text-xs text-brand font-semibold hover:underline shrink-0">
                Manage Batches →
              </Link>
            </div>

            <div className="space-y-3.5">
              {batches.slice(0, 5).map((b) => {
                const heldCount = activeHoldsByBatch[b.id] || 0;
                const effectiveOccupancy = (b.enrolledCount || 0) + heldCount;
                const pct = Math.round((effectiveOccupancy / 12) * 100);
                const isFull = effectiveOccupancy >= 12;

                return (
                  <div key={b.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                      <span className="font-semibold text-slate-800 truncate min-w-0 text-xs">
                        {b.name}
                      </span>
                      <span className={`font-mono text-[11px] font-semibold shrink-0 ${isFull ? 'text-rose-600' : 'text-slate-600'}`}>
                        {b.enrolledCount}{heldCount > 0 ? ` (+${heldCount} held)` : ''} / 12 Seats
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-none h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-none transition-all duration-300 ${
                          isFull 
                            ? 'bg-rose-500' 
                            : pct >= 75 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 rounded-none flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-medium text-[11px]">Strict 1:12 Faculty Ratio</span>
            </div>
            <Link
              to="/admin-portal/reports"
              className="text-xs font-semibold text-brand hover:underline shrink-0"
            >
              Export Reports →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
