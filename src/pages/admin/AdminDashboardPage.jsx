import React, { useState, useEffect } from 'react';
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
  ClipboardCheck
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';
import { ChartCard, DonutChart, BarChart } from '../../components/admin/Charts';
import { feeStatusBreakdown, batchOccupancy, monthlyCollections, rupees } from '../../components/admin/chartData';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [batches, setBatches] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, b, o, p] = await Promise.all([
          AdminDataService.getDashboardMetrics(),
          AdminDataService.getBatches(),
          AdminDataService.getFeeObligations(),
          AdminDataService.getPayments()
        ]);
        setMetrics(m);
        setBatches(b.filter(item => !item.isArchived));
        setObligations(o);
        setPayments(p);
      } catch (err) {
        setLoadError(err.message || 'Campus records could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Campus Records...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200">
        <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-[#0F172A]">Campus records are unavailable</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{loadError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-3.5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          Try again
        </button>
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
          <Link
            to="/admin-portal/ledger"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
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
                <div className="flex items-center space-x-1 text-[#EA580C] font-semibold text-[11px] flex-shrink-0 ml-2">
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
              className="text-xs font-bold text-[#EA580C] hover:underline flex items-center space-x-1"
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
                      <td className="py-3 font-mono font-bold text-[#EA580C]">
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
                          {pay.paymentMethod.replace('_', ' ')}
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
              <Link to="/admin-portal/batches" className="text-xs text-[#EA580C] font-bold hover:underline">
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
              className="text-xs font-bold text-[#EA580C] hover:underline"
            >
              Export Reports →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
