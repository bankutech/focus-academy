import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
import { ChartCard, DonutChart, BarChart } from '../../components/admin/Charts';
import { feeStatusBreakdown, batchOccupancy, monthlyCollections, rupees } from '../../components/admin/chartData';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [batches, setBatches] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [dataErrors, setDataErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDataErrors([]);
    const errors = [];
    const safeGet = async (label, fn) => {
      try { return await fn(); }
      catch (err) { errors.push(`${label}: ${err.message || 'unavailable'}`); return null; }
    };
    const [m, b, o, p, enr] = await Promise.all([
      safeGet('Metrics', () => AdminDataService.getDashboardMetrics()),
      safeGet('Batches', () => AdminDataService.getBatches()),
      safeGet('Fee Obligations', () => AdminDataService.getFeeObligations()),
      safeGet('Payments', () => AdminDataService.getPayments()),
      safeGet('Enrollments', () => AdminDataService.getEnrollments()),
    ]);
    if (m) setMetrics(m);
    if (b) setBatches(b.filter(item => !item.isArchived));
    if (o) setObligations(o);
    if (p) setPayments(p);
    if (enr) setEnrollments(enr);
    setDataErrors(errors);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Campus Records...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Students',
      value: metrics?.totalActiveStudents ?? 0,
      sub: 'Enrolled in 2025-2026 batches',
      icon: Users,
      badge: 'Academic Roster',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      link: '/admin-portal/students'
    },
    {
      title: 'Active Batches',
      value: metrics?.totalActiveBatches ?? 0,
      sub: 'Capped at 12 students / classroom',
      icon: Layers,
      badge: '1:12 Ratio Guard',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
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
    <div className="space-y-6">
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Campus Operations Dashboard
            </h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
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
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin-portal/ledger"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-brand hover:bg-brand-strong text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Link>
          <Link
            to="/admin-portal/students"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </Link>
          <Link
            to="/admin-portal/reminders"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Due Notices</span>
          </Link>
        </div>
      </div>

      {dataErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Some data sources are temporarily unavailable. Showing cached or partial data.</p>
              {dataErrors.map((e, i) => (
                <p key={i} className="text-amber-800 text-[11px]">• {e}</p>
              ))}
              <button
                type="button"
                onClick={loadData}
                className="mt-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[11px] cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 group-hover:bg-[#0F172A] group-hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {card.title}
                  </span>
                </div>
                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${card.badgeClass}`}>
                  {card.badge}
                </span>
              </div>

              <div className="my-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-mono">
                  {card.value}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-slate-700 transition-colors">
                <span className="truncate">{card.sub}</span>
                <div className="flex items-center space-x-1 text-brand font-semibold text-[11px] flex-shrink-0 ml-2">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Fee Position" subtitle="Where every rupee billed this session stands">
          <DonutChart data={feeStatusBreakdown(obligations)} centerLabel="Billed" label="Fee position by status" />
        </ChartCard>
        <ChartCard title="Collections, Last 6 Months" subtitle="Verified receipts, reversals excluded">
          <BarChart data={monthlyCollections(payments)} format={rupees} label="Monthly fee collections" />
        </ChartCard>
        <ChartCard title="Batch Seat Fill" subtitle="Enrolled against the 12-seat classroom cap">
          <BarChart data={batchOccupancy(batches)} label="Batch occupancy" showAxisMax={false} />
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-[#0F172A]">
                Recent Batch Admissions & Registrations
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                {enrollments.length} Total
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live student registrations received through the Focus Academy admission portal
            </p>
          </div>
          <Link
            to="/admin-portal/leads?source=enrollment"
            className="text-xs font-bold text-brand hover:underline flex items-center space-x-1"
          >
            <span>View All Admissions</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {enrollments && enrollments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 pr-3 font-bold">Slip No</th>
                  <th className="py-2.5 pr-3 font-bold">Student Name</th>
                  <th className="py-2.5 pr-3 font-bold">Grade & Board</th>
                  <th className="py-2.5 pr-3 font-bold">Selected Batch</th>
                  <th className="py-2.5 pr-3 font-bold">Contact Mobile</th>
                  <th className="py-2.5 pr-3 font-bold">Date</th>
                  <th className="py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.slice(0, 10).map((enrItem) => (
                  <tr key={enrItem.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pr-3 font-mono font-bold text-brand text-[11px]">
                      {enrItem.id}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-bold text-[#0F172A]">{enrItem.studentName}</div>
                      {enrItem.parentName && (
                        <div className="text-[11px] text-slate-400 font-normal">Guardian: {enrItem.parentName}</div>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-700">
                      <span className="font-medium block">{enrItem.grade}</span>
                      <span className="text-[11px] text-slate-500">{enrItem.board}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="font-semibold text-slate-800 block truncate max-w-[200px]">
                        {enrItem.batchName || enrItem.selectedBatchName || 'Focus Evening Batch'}
                      </span>
                      {enrItem.timing && (
                        <span className="text-[11px] text-slate-500 font-mono">{enrItem.timing}</span>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[11px] text-slate-700">
                      +91 {enrItem.phone}
                    </td>
                    <td className="py-3 pr-3 text-slate-500 font-mono text-[11px]">
                      {enrItem.enrolledAt ? String(enrItem.enrolledAt).split('T')[0] : 'Today'}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
          <div className="py-10 text-center">
            <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">No online admissions recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Once a student submits the enrollment form, their details will appear here immediately.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A]">
                Recent Verified Transactions
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Official student fee receipts generated and attributed to campus administrators
              </p>
            </div>
            <Link
              to="/admin-portal/ledger"
              className="text-xs font-bold text-brand hover:underline flex items-center space-x-1"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {metrics?.recentPayments && metrics.recentPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 font-bold">Receipt #</th>
                    <th className="py-2.5 font-bold">Student</th>
                    <th className="py-2.5 font-bold">Amount</th>
                    <th className="py-2.5 font-bold">Method</th>
                    <th className="py-2.5 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.recentPayments.slice(0, 5).map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono font-bold text-brand">
                        {pay.receiptNumber}
                      </td>
                      <td className="py-3 font-semibold text-[#0F172A]">
                        {pay.studentName}
                      </td>
                      <td className="py-3 font-extrabold text-[#0F172A] font-mono">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {String(pay.paymentMethod || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F172A]">
                  12-Seat Capacity Guard
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Classroom density enforcement
                </p>
              </div>
              <Link to="/admin-portal/batches" className="text-xs text-brand font-bold hover:underline">
                Manage Batches →
              </Link>
            </div>

            <div className="space-y-4">
              {batches.slice(0, 5).map((b) => {
                const pct = Math.round((b.enrolledCount / 12) * 100);
                const isFull = b.enrolledCount >= 12;
                return (
                  <div key={b.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">
                        {b.name}
                      </span>
                      <span className={`font-mono text-[11px] font-bold ${isFull ? 'text-red-600' : 'text-slate-600'}`}>
                        {b.enrolledCount} / 12 Seats
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull 
                            ? 'bg-red-500' 
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

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 rounded-b-xl flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold text-[11px]">Strict 1:12 Faculty Ratio</span>
            </div>
            <Link
              to="/admin-portal/reports"
              className="text-xs font-bold text-brand hover:underline"
            >
              Export Reports →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
