import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Layers, 
  Receipt, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, b] = await Promise.all([
          AdminDataService.getDashboardMetrics(),
          AdminDataService.getBatches()
        ]);
        setMetrics(m);
        setBatches(b.filter(item => !item.isArchived));
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Calculating Campus Financial Records...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Students',
      value: metrics?.totalActiveStudents ?? 0,
      sub: 'Enrolled in 2025-2026 batches',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      link: '/admin-portal/students'
    },
    {
      title: 'Active Batches',
      value: metrics?.totalActiveBatches ?? 0,
      sub: 'Capped at 12 students / classroom',
      icon: Layers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      link: '/admin-portal/batches'
    },
    {
      title: 'Collected This Month',
      value: `₹${(metrics?.feesCollectedThisMonth ?? 0).toLocaleString('en-IN')}`,
      sub: 'Actual verified receipts',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      link: '/admin-portal/ledger'
    },
    {
      title: 'Total Outstanding',
      value: `₹${(metrics?.totalOutstandingFees ?? 0).toLocaleString('en-IN')}`,
      sub: 'Valid obligations pending',
      icon: Receipt,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      link: '/admin-portal/fees?status=pending'
    },
    {
      title: 'Overdue Fees',
      value: `₹${(metrics?.totalOverdueFees ?? 0).toLocaleString('en-IN')}`,
      sub: 'Due date lapsed',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      link: '/admin-portal/reminders?tab=overdue'
    },
    {
      title: 'Due Today',
      value: metrics?.paymentsDueTodayCount ?? 0,
      sub: 'Requires reminder check',
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      link: '/admin-portal/reminders?tab=today'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Campus Operations Dashboard
            </h1>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Session 2025-2026</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Focus Academy • Thiripura Complex, Thoramangalam, Perambalur
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin-portal/ledger"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Link>
          <Link
            to="/admin-portal/reminders"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Reminders</span>
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
              className={`p-4 bg-white rounded-xl border ${card.border} shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {card.value}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-600 transition-colors">
                <span>{card.sub}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#EA580C] transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-extrabold text-[#0F172A]">
                Recent Verified Transactions
              </h2>
              <p className="text-[11px] text-slate-400">
                Latest student fee payments with generated receipt numbers
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
                    <tr key={pay.id} className="hover:bg-slate-50/80">
                      <td className="py-3 font-mono font-bold text-[#EA580C]">
                        {pay.receiptNumber}
                      </td>
                      <td className="py-3 font-semibold text-[#0F172A]">
                        {pay.studentName}
                      </td>
                      <td className="py-3 font-extrabold text-[#0F172A]">
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {pay.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {pay.paymentDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              No transactions recorded yet.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-[#0F172A]">
                12-Seat Capacity Guard
              </h2>
              <Link to="/admin-portal/batches" className="text-xs text-[#EA580C] font-bold hover:underline">
                Manage
              </Link>
            </div>

            <div className="space-y-3.5">
              {batches.slice(0, 4).map((b) => {
                const pct = Math.round((b.enrolledCount / 12) * 100);
                const isFull = b.enrolledCount >= 12;
                return (
                  <div key={b.id} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-700 truncate max-w-[150px]">
                        {b.name}
                      </span>
                      <span className={`font-mono text-[11px] font-bold ${isFull ? 'text-red-600' : 'text-slate-600'}`}>
                        {b.enrolledCount}/12 Seats
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull 
                            ? 'bg-red-500' 
                            : pct >= 75 
                            ? 'bg-orange-500' 
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

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-xl flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-semibold">Thoramangalam Campus</span>
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
