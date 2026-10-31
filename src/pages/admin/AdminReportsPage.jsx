import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';
import { requireAdminEmail } from '../../services/adminIdentity';

export default function AdminReportsPage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [dailyCollections, setDailyCollections] = useState([]);
  const [batchSummaries, setBatchSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function loadReportData() {
    try {
      setLoading(true);
      const [b, s, o, p, dc, bs] = await Promise.all([
        AdminDataService.getBatches(),
        AdminDataService.getStudents(),
        AdminDataService.getFeeObligations(),
        AdminDataService.getPayments(),
        AdminDataService.getDailyCollectionReport(),
        AdminDataService.getBatchCollectionSummary()
      ]);
      setBatches(b);
      setStudents(s);
      setObligations(o);
      setPayments(p);
      setDailyCollections(dc);
      setBatchSummaries(bs);
      setLoadError('');
    } catch (err) {
      console.error('Failed to load reports data:', err);
      setLoadError(err.message || 'Report data could not be loaded from the database.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportData();
  }, []);

  const activeBatches = batches.filter(b => !b.isArchived);
  const activeStudents = students.filter(s => s.status === 'active' || s.status === 'new_enrollment');
  const totalCapacity = activeBatches.length * 12;
  const totalEnrolled = activeBatches.reduce((sum, b) => sum + (b.enrolledCount || 0), 0);
  const overallOccupancyPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const reportableObligations = obligations.filter(o => o.status !== 'cancelled');
  const validPayments = payments.filter(p => !(p.isReversed || p.reversed || p.status === 'reversed' || p.refundStatus === 'refunded'));
  const totalFeesCharged = reportableObligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
  const totalAmountPaid = validPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalWaived = reportableObligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
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

  const paymentMethodBreakdown = validPayments.reduce((acc, p) => {
    const method = p.paymentMethod || 'cash';
    acc[method] = (acc[method] || 0) + Number(p.amount || 0);
    return acc;
  }, {});

  const ensureExportAllowed = () => {
    try {
      AdminDataService.verifyPermission(requireAdminEmail(), 'canExportData', 'exporting institutional analytics');
      return true;
    } catch (err) {
      setLoadError(err.message || 'You are not authorized to export institutional data.');
      return false;
    }
  };

  const exportStudentsCSV = () => {
    if (!ensureExportAllowed()) return;
    const headers = ['ID', 'Student Name', 'Grade', 'Board', 'Batch', 'Guardian Phone', 'Status', 'Enrollment Date', 'Course End Date'];
    const rows = students.map(s => [
      s.id,
      `"${(s.studentName || '').replace(/"/g, '""')}"`,
      `"${(s.grade || '').replace(/"/g, '""')}"`,
      `"${(s.board || '').replace(/"/g, '""')}"`,
      `"${(s.batchName || s.batchId || '').replace(/"/g, '""')}"`,
      `"${s.guardianPhone || ''}"`,
      s.status,
      s.enrollmentDate,
      s.courseEndDate || ''
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvContent, `Focus_Academy_Students_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportFinancialsCSV = () => {
    if (!ensureExportAllowed()) return;
    const headers = ['Receipt No', 'Date', 'Student ID', 'Student Name', 'Amount (INR)', 'Payment Mode', 'Reference / UTR', 'Recorded By', 'Receipt Status'];
    const rows = payments.map(p => [
      p.receiptNumber,
      p.paymentDate,
      p.studentId,
      `"${(p.studentName || '').replace(/"/g, '""')}"`,
      p.amount,
      p.paymentMethod,
      `"${(p.referenceNumber || '').replace(/"/g, '""')}"`,
      `"${(p.recordedBy || 'admin').replace(/"/g, '""')}"`,
      (p.isReversed || p.reversed || p.status === 'reversed' || p.refundStatus === 'refunded') ? 'reversed/refunded (excluded)' : 'valid'
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvContent, `Focus_Academy_Collections_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportDailyCollectionsCSV = () => {
    if (!ensureExportAllowed()) return;
    const headers = ['Collection Date', 'Total Amount (INR)', 'Receipts Count', 'Cash (INR)', 'UPI (INR)', 'Bank (INR)', 'Card (INR)'];
    const rows = dailyCollections.map(d => [
      d.date,
      d.totalCollected,
      d.transactionCount,
      d.cashTotal,
      d.upiTotal,
      d.bankTotal,
      d.cardTotal
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvContent, `Focus_Academy_Daily_Collections_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportBatchSummariesCSV = () => {
    if (!ensureExportAllowed()) return;
    const headers = ['Batch ID', 'Batch Name', 'Grade', 'Board', 'Enrolled / Cap', 'Total Charged (INR)', 'Total Collected (INR)', 'Total Pending (INR)', 'Total Overdue (INR)', 'Collection Rate %'];
    const rows = batchSummaries.map(b => [
      b.batchId,
      `"${(b.batchName || '').replace(/"/g, '""')}"`,
      b.grade,
      `"${(b.board || '').replace(/"/g, '""')}"`,
      `${b.enrolledCount}/${b.capacity}`,
      b.totalCharged,
      b.totalCollected,
      b.totalPending,
      b.totalOverdue,
      `${b.collectionRatePct}%`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvContent, `Focus_Academy_Batch_Collections_${new Date().toISOString().split('T')[0]}.csv`);
  };

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Compiling Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={loadReportData}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 rounded-md font-bold cursor-pointer flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time enrollment quotas, date-wise collection summaries, batch metrics, and enrollment distributions.
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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Enrolled / Cap
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-[#0F172A]">{totalEnrolled}</span>
            <span className="text-xs text-slate-500">/ {totalCapacity} seats</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            {overallOccupancyPct}% occupancy across {activeBatches.length} active batches
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Realized Receipts
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">
              ₹{totalAmountPaid.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            Net collected fees across all active admissions
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Net Collectible (After Concessions)
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-[#0F172A]">
              ₹{netCollectible.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            Collection realization rate: <strong className="text-slate-800">{collectionRate}%</strong>
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Uncollected / Overdue Dues
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-rose-600">
              ₹{Math.max(0, netCollectible - totalAmountPaid).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-[11px] text-red-600 font-semibold block mt-2">
            Pending tuition collection accounts
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                Daily Collection Reports
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Day-by-day verified collections summary with payment method segregation.
            </p>
          </div>

          <button
            type="button"
            onClick={exportDailyCollectionsCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Daily Collections CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-bold">Date</th>
                <th className="py-2.5 px-4 font-bold">Total Collected</th>
                <th className="py-2.5 px-4 font-bold">Transactions</th>
                <th className="py-2.5 px-4 font-bold">Cash Mode</th>
                <th className="py-2.5 px-4 font-bold">UPI / Online Mode</th>
                <th className="py-2.5 px-4 font-bold">Bank Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyCollections.map(d => (
                <tr key={d.date} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{d.date}</td>
                  <td className="py-3 px-4 text-emerald-600 font-extrabold text-sm">₹{d.totalCollected.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">{d.transactionCount} receipts</td>
                  <td className="py-3 px-4 text-slate-600">₹{d.cashTotal.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-600">₹{d.upiTotal.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-600">₹{d.bankTotal.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {dailyCollections.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">No daily collection records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                Batch-Wise Collection &amp; Capacity Summaries
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Financial performance, collected vs pending dues, and 12-seat capacity metrics per batch.
            </p>
          </div>

          <button
            type="button"
            onClick={exportBatchSummariesCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Batch Summaries CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-bold">Batch Name</th>
                <th className="py-2.5 px-4 font-bold">Occupancy</th>
                <th className="py-2.5 px-4 font-bold">Charged</th>
                <th className="py-2.5 px-4 font-bold">Collected</th>
                <th className="py-2.5 px-4 font-bold">Pending</th>
                <th className="py-2.5 px-4 font-bold">Overdue</th>
                <th className="py-2.5 px-4 font-bold text-right">Realization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batchSummaries.map(b => (
                <tr key={b.batchId} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{b.batchName}</span>
                    <span className="text-[10px] text-slate-500">{b.grade} • {b.board}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{b.enrolledCount}/{b.capacity}</td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">₹{b.totalCharged.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">₹{b.totalCollected.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-amber-600 font-semibold">₹{b.totalPending.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-red-600 font-semibold">₹{b.totalOverdue.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{b.collectionRatePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <p className="text-[10px] text-slate-400">Tamper-evident administrative reporting log</p>
        </div>
      </div>
    </div>
  );
}
