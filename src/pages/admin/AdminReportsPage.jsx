import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Building2 
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';

export default function AdminReportsPage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReportData() {
      try {
        setLoading(true);
        const [b, s, o, p, m] = await Promise.all([
          AdminDataService.getBatches(),
          AdminDataService.getStudents(),
          AdminDataService.getFeeObligations(),
          AdminDataService.getPayments(),
          AdminDataService.getDashboardMetrics()
        ]);
        setBatches(b);
        setStudents(s);
        setObligations(o);
        setPayments(p);
        setMetrics(m);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, []);

  const activeBatches = batches.filter(b => !b.isArchived);
  const activeStudents = students.filter(s => s.status === 'active');

  const totalCapacity = activeBatches.length * 12;
  const totalEnrolled = activeBatches.reduce((sum, b) => sum + (b.enrolledCount || 0), 0);
  const overallOccupancyPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const totalFeesCharged = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
  const totalAmountPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalWaived = obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
  const netCollectible = Math.max(0, totalFeesCharged - totalWaived);
  const collectionRate = netCollectible > 0 ? Math.round((totalAmountPaid / netCollectible) * 100) : 0;

  const boardDistribution = activeStudents.reduce((acc, s) => {
    const board = s.board || 'Other';
    acc[board] = (acc[board] || 0) + 1;
    return acc;
  }, {});

  const gradeDistribution = activeStudents.reduce((acc, s) => {
    const grade = s.grade || 'Other';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});

  const paymentMethodBreakdown = payments.reduce((acc, p) => {
    const method = p.paymentMethod || 'cash';
    acc[method] = (acc[method] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  const exportStudentsCSV = () => {
    const headers = ['ID', 'Student Name', 'Grade', 'Board', 'Batch', 'Guardian Phone', 'Status', 'Enrollment Date'];
    const rows = students.map(s => [
      s.id,
      `"${(s.studentName || '').replace(/"/g, '""')}"`,
      `"${(s.grade || '').replace(/"/g, '""')}"`,
      `"${(s.board || '').replace(/"/g, '""')}"`,
      `"${(s.batchName || s.batchId || '').replace(/"/g, '""')}"`,
      s.guardianPhone,
      s.status,
      s.enrollmentDate
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Focus_Academy_Students_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportFinancialsCSV = () => {
    const headers = ['Receipt No', 'Date', 'Student ID', 'Student Name', 'Amount (INR)', 'Payment Mode', 'Reference / UTR', 'Recorded By'];
    const rows = payments.map(p => [
      p.receiptNumber,
      p.paymentDate,
      p.studentId,
      `"${(p.studentName || '').replace(/"/g, '""')}"`,
      p.amount,
      p.paymentMethod,
      `"${(p.referenceNumber || '').replace(/"/g, '""')}"`,
      `"${(p.recordedBy || 'admin').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Focus_Academy_Collections_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Compiling Institutional Analytics &amp; Reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Institutional Reports &amp; Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time enrollment quotas, physical seat utilization, and audited financial statements for Focus Academy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={exportStudentsCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Students CSV</span>
          </button>

          <button
            type="button"
            onClick={exportFinancialsCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Financials CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Institute Capacity Utilization
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-[#0F172A]">{overallOccupancyPct}%</span>
            <span className="text-xs text-slate-500">({totalEnrolled} / {totalCapacity} seats)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-[#EA580C] h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, overallOccupancyPct)}%` }} 
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Collection Realization Rate
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{collectionRate}%</span>
            <span className="text-xs text-slate-500">of net collectible dues</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, collectionRate)}%` }} 
            />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Collections Realized
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-black text-emerald-600">
              ₹{totalAmountPaid.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            Across {payments.length} verified transactions
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Outstanding Arrears
          </span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-2xl font-black text-amber-600">
              ₹{(metrics?.totalOutstandingFees ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-red-600 font-semibold block mt-2">
            ₹{(metrics?.totalOverdueFees ?? 0).toLocaleString('en-IN')} overdue
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
              Batch-Wise Capacity Breakdown (Strict 12-Seat Cap Enforced)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Physical seating guarantees at Thiripura Complex, Thoramangalam, Perambalur.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
            {activeBatches.length} Active Batches
          </span>
        </div>

        <div className="space-y-4">
          {activeBatches.map(batch => {
            const enrolled = batch.enrolledCount || 0;
            const remaining = Math.max(0, 12 - enrolled);
            const pct = Math.round((enrolled / 12) * 100);
            const isFull = remaining === 0;
            const isCritical = remaining <= 2;

            return (
              <div key={batch.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                  <div>
                    <span className="font-bold text-xs text-[#0F172A]">{batch.name}</span>
                    <span className="text-[11px] text-slate-500 ml-2">({batch.grade} • {batch.board})</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs font-semibold">
                    <span className="text-slate-600">{batch.timing}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isFull ? 'bg-red-100 text-red-800' :
                      isCritical ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isFull ? 'Batch Full (0 Seats)' : `${remaining} Seats Available`}
                    </span>
                    <span className="font-mono font-bold text-slate-800">{enrolled}/12</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isFull ? 'bg-red-500' : isCritical ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-xs font-black text-[#0F172A] uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">
            Affiliation / Board Distribution
          </h2>
          <div className="space-y-3 text-xs">
            {Object.entries(boardDistribution).map(([board, count]) => {
              const pct = activeStudents.length > 0 ? Math.round((count / activeStudents.length) * 100) : 0;
              return (
                <div key={board}>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-700">{board}</span>
                    <span className="text-slate-900 font-bold">{count} students ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-xs font-black text-[#0F172A] uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">
            Class Level Distribution
          </h2>
          <div className="space-y-3 text-xs">
            {Object.entries(gradeDistribution).map(([grade, count]) => {
              const pct = activeStudents.length > 0 ? Math.round((count / activeStudents.length) * 100) : 0;
              return (
                <div key={grade}>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-700">{grade}</span>
                    <span className="text-slate-900 font-bold">{count} students ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <h2 className="text-xs font-black text-[#0F172A] uppercase tracking-wide mb-3 pb-2 border-b border-slate-100">
            Payment Mode Receipts
          </h2>
          <div className="space-y-3 text-xs">
            {Object.entries(paymentMethodBreakdown).map(([method, amount]) => {
              const pct = totalAmountPaid > 0 ? Math.round((amount / totalAmountPaid) * 100) : 0;
              const label = method === 'cash' ? 'Cash (Front Desk)' :
                            method === 'upi_online' ? 'UPI / Online' :
                            'Bank Transfer';
              return (
                <div key={method}>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-700">{label}</span>
                    <span className="text-slate-900 font-bold">₹{amount.toLocaleString('en-IN')} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(paymentMethodBreakdown).length === 0 && (
              <p className="text-slate-400 text-xs">No payment records available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Building2 className="w-6 h-6 text-orange-400 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-white">Focus Academy Institutional Campus Compliance</p>
            <p className="text-slate-400">First Floor, Thiripura Complex, Thoramangalam, Perambalur – 621220</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-300">
          <p className="font-mono">Academic Year 2025–2026</p>
          <p className="text-[10px] text-slate-400">Tamper-evident administrative reporting ledger</p>
        </div>
      </div>
    </div>
  );
}
