import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Users,
  RefreshCw,
  Scale,
  Wallet,
  Lock,
  X
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';

export default function AdminReportsPage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [adminCollections, setAdminCollections] = useState([]);
  const [dailyCollections, setDailyCollections] = useState([]);
  const [batchSummaries, setBatchSummaries] = useState([]);
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [loading, setLoading] = useState(true);

  const [tillSessions, setTillSessions] = useState([]);
  const [activeTillSession, setActiveTillSession] = useState(null);
  const [tillSummary, setTillSummary] = useState(null);
  const [openTillModal, setOpenTillModal] = useState(false);
  const [closeTillModal, setCloseTillModal] = useState(false);
  const [tillVoucherModal, setTillVoucherModal] = useState(null);
  const [openingFloatInput, setOpeningFloatInput] = useState('1500');
  const [openingNotesInput, setOpeningNotesInput] = useState('');
  const [closingCashInput, setClosingCashInput] = useState('');
  const [handedOverInput, setHandedOverInput] = useState('S. Ramanathan (Managing Director)');
  const [closingNotesInput, setClosingNotesInput] = useState('');
  const [tillError, setTillError] = useState('');
  const [maskGuardianContacts, setMaskGuardianContacts] = useState(true);

  async function loadReportData() {
    try {
      setLoading(true);
      const [b, s, o, p, m, ac, dc, bs, ts, ats] = await Promise.all([
        AdminDataService.getBatches(),
        AdminDataService.getStudents(),
        AdminDataService.getFeeObligations(),
        AdminDataService.getPayments(),
        AdminDataService.getDashboardMetrics(),
        AdminDataService.getAdminCollectionReport(),
        AdminDataService.getDailyCollectionReport(),
        AdminDataService.getBatchCollectionSummary(),
        AdminDataService.getTillSessions(),
        AdminDataService.getActiveTillSession()
      ]);
      setBatches(b);
      setStudents(s);
      setObligations(o);
      setPayments(p);
      setMetrics(m);
      setAdminCollections(ac);
      setDailyCollections(dc);
      setBatchSummaries(bs);
      setTillSessions(ts);
      setActiveTillSession(ats);
      if (ats) {
        const sum = await AdminDataService.getTillSessionSummary(ats.id);
        setTillSummary(sum);
        setClosingCashInput(String(sum.expectedCashInDrawer || ''));
      }
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportData();
  }, []);

  const handleRunReconciliation = async () => {
    setReconciling(true);
    try {
      const result = await AdminDataService.reconcileLedger();
      setReconciliationResult(result);
    } catch (err) {
      console.error('Reconciliation failed:', err);
    } finally {
      setReconciling(false);
    }
  };

  const activeBatches = batches.filter(b => !b.isArchived);
  const activeStudents = students.filter(s => s.status === 'active' || s.status === 'new_enrollment');

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

  const handleOpenTill = async (e) => {
    e.preventDefault();
    setTillError('');
    try {
      await AdminDataService.openTillSession({
        openingFloat: Number(openingFloatInput),
        notes: openingNotesInput
      });
      setOpenTillModal(false);
      await loadReportData();
    } catch (err) {
      setTillError(err.message || 'Failed to open till session');
    }
  };

  const handleCloseTill = async (e) => {
    e.preventDefault();
    setTillError('');
    try {
      if (!activeTillSession) return;
      const closed = await AdminDataService.closeTillSession(activeTillSession.id, {
        closingCashActual: Number(closingCashInput),
        handedOverTo: handedOverInput,
        closingNotes: closingNotesInput
      });
      setCloseTillModal(false);
      setTillVoucherModal(closed);
      await loadReportData();
    } catch (err) {
      setTillError(err.message || 'Failed to close till session');
    }
  };

  const exportStudentsCSV = () => {
    const headers = ['ID', 'Student Name', 'Grade', 'Board', 'Batch', 'Guardian Phone', 'Status', 'Enrollment Date', 'Course End Date'];
    const rows = students.map(s => {
      let phone = s.guardianPhone || '';
      if (maskGuardianContacts && phone.length >= 7) {
        phone = phone.slice(0, 3) + '•••••' + phone.slice(-2);
      }
      return [
        s.id,
        `"${(s.studentName || '').replace(/"/g, '""')}"`,
        `"${(s.grade || '').replace(/"/g, '""')}"`,
        `"${(s.board || '').replace(/"/g, '""')}"`,
        `"${(s.batchName || s.batchId || '').replace(/"/g, '""')}"`,
        `"${phone}"`,
        s.status,
        s.enrollmentDate,
        s.courseEndDate || ''
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvContent, `Focus_Academy_Students_${new Date().toISOString().split('T')[0]}.csv`);
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
    downloadCSV(csvContent, `Focus_Academy_Collections_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportDailyCollectionsCSV = () => {
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

  const exportAdminCollectionsCSV = () => {
    const headers = ['Administrator', 'Total Amount Collected (INR)', 'Receipts Issued', 'Cash (INR)', 'UPI (INR)', 'Bank (INR)', 'Last Collected Date'];
    const rows = adminCollections.map(a => [
      `"${(a.adminEmail || '').replace(/"/g, '""')}"`,
      a.totalCollected,
      a.transactionCount,
      a.cashTotal,
      a.upiTotal,
      a.bankTotal,
      a.lastCollectedDate || ''
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csvContent, `Focus_Academy_Admin_Accountability_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportBatchSummariesCSV = () => {
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
            Real-time enrollment quotas, administrator collection accountability, date-wise reports, and ledger reconciliation.
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

          <label className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={maskGuardianContacts}
              onChange={(e) => setMaskGuardianContacts(e.target.checked)}
              className="rounded text-[#EA580C] focus:ring-[#EA580C]"
            />
            <span>Mask Minor Phone Numbers</span>
          </label>

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

      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Data Protection Notice:</strong> Exported reports contain sensitive student and guardian contact information. Treat exported CSV files confidentially.
          </span>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-[#EA580C]" />
              <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                Financial Ledger Reconciliation
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cross-audit total collected receipts against fee obligation records to detect discrepancies or balance corruptions.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunReconciliation}
            disabled={reconciling}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? 'animate-spin' : ''}`} />
            <span>{reconciling ? 'Auditing Ledger...' : 'Run Ledger Reconciliation Audit'}</span>
          </button>
        </div>

        {reconciliationResult ? (
          <div className={`p-4 rounded-xl border-l-4 text-xs ${
            reconciliationResult.reconciled 
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
              : 'bg-red-50 border-red-500 text-red-900'
          }`}>
            <div className="flex items-center space-x-2 font-bold mb-2">
              {reconciliationResult.reconciled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>
                {reconciliationResult.reconciled 
                  ? 'All Ledger Transactions Fully Reconciled (0 Discrepancies)' 
                  : `Discrepancies Detected (${reconciliationResult.totalDiscrepancies})`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mt-2 pt-2 border-t border-emerald-200/60">
              <div>Total Charged: <strong>₹{reconciliationResult.ledgerTotals.totalCharged.toLocaleString('en-IN')}</strong></div>
              <div>Total Receipts: <strong>₹{reconciliationResult.ledgerTotals.totalCollected.toLocaleString('en-IN')}</strong></div>
              <div>Total Waived: <strong>₹{reconciliationResult.ledgerTotals.totalWaived.toLocaleString('en-IN')}</strong></div>
              <div>Net Outstanding: <strong>₹{reconciliationResult.ledgerTotals.netOutstanding.toLocaleString('en-IN')}</strong></div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Click &quot;Run Ledger Reconciliation Audit&quot; to verify ledger totals against transaction receipts.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                Fee Collection Accountability by Administrator
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Audited breakdown of total collections received and recorded by each authorized staff member.
            </p>
          </div>

          <button
            type="button"
            onClick={exportAdminCollectionsCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Admin Collections CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-bold">Administrator</th>
                <th className="py-2.5 px-4 font-bold">Total Collected</th>
                <th className="py-2.5 px-4 font-bold">Receipts Count</th>
                <th className="py-2.5 px-4 font-bold">Cash Mode</th>
                <th className="py-2.5 px-4 font-bold">Online / UPI</th>
                <th className="py-2.5 px-4 font-bold">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {adminCollections.map(a => (
                <tr key={a.adminEmail} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.adminEmail}</td>
                  <td className="py-3 px-4 text-emerald-600 font-extrabold text-sm">₹{a.totalCollected.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-700">{a.transactionCount} receipts</td>
                  <td className="py-3 px-4 text-slate-600">₹{a.cashTotal.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-600">₹{a.upiTotal.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{a.lastCollectedDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
              Day-by-day verified collections ledger with payment method segregation.
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

      {/* Front-Desk Cash Drawer (Till) Session Tracker & Desk Reconciliation */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-black text-[#0F172A] uppercase tracking-wide">
                Front-Desk Cash Drawer (Till) &amp; Daily Desk Reconciliation
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Daily float management, physical cash receipts tallying, and evening supervisor hand-off verification for Thiripura Complex reception.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {activeTillSession ? (
              <button
                type="button"
                onClick={() => {
                  setTillError('');
                  setCloseTillModal(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Close Till &amp; Evening Reconciliation</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTillError('');
                  setOpenTillModal(true);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Open Daily Desk Till</span>
              </button>
            )}
          </div>
        </div>

        {activeTillSession ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-extrabold text-emerald-900 uppercase">Active Till Session: {activeTillSession.id}</span>
              </div>
              <span className="text-[11px] text-emerald-800">
                Opened by <strong className="font-mono">{activeTillSession.openedBy}</strong> on {activeTillSession.date}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-xs">
              <div className="bg-white p-3 rounded border border-emerald-100">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Opening Cash Float</span>
                <span className="text-base font-extrabold text-slate-800">₹{activeTillSession.openingFloat.toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-3 rounded border border-emerald-100">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Cash Collected</span>
                <span className="text-base font-extrabold text-emerald-600">₹{(tillSummary?.cashCollected || 0).toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 block">{tillSummary?.cashTransactionCount || 0} cash receipts</span>
              </div>
              <div className="bg-white p-3 rounded border border-emerald-100">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Expected Cash In Drawer</span>
                <span className="text-base font-extrabold text-[#0F172A]">₹{(tillSummary?.expectedCashInDrawer || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="bg-white p-3 rounded border border-emerald-100">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Digital UPI / Bank</span>
                <span className="text-base font-extrabold text-blue-600">₹{(tillSummary?.upiCollected || 0).toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400 block">Settled to bank</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 text-center">
            <p className="text-xs text-slate-600 font-medium">
              No cash till session is currently open. Click <strong>"Open Daily Desk Till"</strong> to declare your opening float and start recording physical front-desk cash receipts.
            </p>
          </div>
        )}

        <div className="overflow-x-auto text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Till Hand-off Audit History</div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-bold">Session ID</th>
                <th className="py-2.5 px-4 font-bold">Date</th>
                <th className="py-2.5 px-4 font-bold">Cashier</th>
                <th className="py-2.5 px-4 font-bold">Opening Float</th>
                <th className="py-2.5 px-4 font-bold">Expected Drawer</th>
                <th className="py-2.5 px-4 font-bold">Actual Count</th>
                <th className="py-2.5 px-4 font-bold">Discrepancy</th>
                <th className="py-2.5 px-4 font-bold">Handed Over To</th>
                <th className="py-2.5 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tillSessions.map(t => {
                const isExact = (t.difference || 0) === 0;
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{t.id}</td>
                    <td className="py-2.5 px-4 text-slate-700">{t.date}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px] truncate max-w-[120px]">{t.openedBy}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">₹{t.openingFloat?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-slate-800 font-semibold">{t.expectedDrawerCash != null ? `₹${t.expectedDrawerCash.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold">{t.closingCashActual != null ? `₹${t.closingCashActual.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="py-2.5 px-4">
                      {t.status === 'closed' ? (
                        <span className={`font-mono font-bold text-[11px] ${isExact ? 'text-emerald-600' : t.difference < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                          {isExact ? '₹0 (Exact)' : t.difference < 0 ? `-₹${Math.abs(t.difference)}` : `+₹${t.difference}`}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Open</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{t.handedOverTo || '—'}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'open' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {tillSessions.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-4 text-center text-slate-400">No till sessions recorded yet.</td>
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
          <p className="text-[10px] text-slate-400">Tamper-evident administrative reporting ledger</p>
        </div>
      </div>
      {/* Open Till Modal */}
      {openTillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2 text-emerald-700">
                <Wallet className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase">Open Daily Desk Till</h3>
              </div>
              <button onClick={() => setOpenTillModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {tillError && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs mb-3">
                {tillError}
              </div>
            )}

            <form onSubmit={handleOpenTill} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Cash Float (₹) *</label>
                <input
                  type="number"
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(e.target.value)}
                  required
                  min="0"
                  step="50"
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">Starting cash float in the desk cash drawer for parent change.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Denomination Breakdown (Optional)</label>
                <textarea
                  value={openingNotesInput}
                  onChange={(e) => setOpeningNotesInput(e.target.value)}
                  placeholder="e.g. 2x500, 4x100, 2x50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                  rows={2}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setOpenTillModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Open Cash Drawer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Till Modal */}
      {closeTillModal && activeTillSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2 text-red-600">
                <Lock className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase">Close Till &amp; Evening Reconciliation</h3>
              </div>
              <button onClick={() => setCloseTillModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {tillError && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs mb-3">
                {tillError}
              </div>
            )}

            <form onSubmit={handleCloseTill} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opening Float:</span>
                  <span className="font-bold text-slate-800">₹{activeTillSession.openingFloat.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Collected Today:</span>
                  <span className="font-bold text-emerald-600">₹{(tillSummary?.cashCollected || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1">
                  <span className="font-bold text-slate-700">Expected in Drawer:</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{(tillSummary?.expectedCashInDrawer || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Actual Physical Cash Counted (₹) *</label>
                <input
                  type="number"
                  value={closingCashInput}
                  onChange={(e) => setClosingCashInput(e.target.value)}
                  required
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
                {closingCashInput !== '' && (
                  <div className="mt-1.5 font-bold">
                    {Number(closingCashInput) === (tillSummary?.expectedCashInDrawer || 0) ? (
                      <span className="text-emerald-600">✓ Exact Match (₹0 discrepancy)</span>
                    ) : Number(closingCashInput) < (tillSummary?.expectedCashInDrawer || 0) ? (
                      <span className="text-red-600">⚠ Cash Shortage of ₹{((tillSummary?.expectedCashInDrawer || 0) - Number(closingCashInput)).toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-blue-600">ℹ Cash Surplus of ₹{(Number(closingCashInput) - (tillSummary?.expectedCashInDrawer || 0)).toLocaleString('en-IN')}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Handed Over To *</label>
                <input
                  type="text"
                  value={handedOverInput}
                  onChange={(e) => setHandedOverInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Closing Audit Notes</label>
                <textarea
                  value={closingNotesInput}
                  onChange={(e) => setClosingNotesInput(e.target.value)}
                  placeholder="Notes on physical cash handover or safe drop"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                  rows={2}
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCloseTillModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer shadow-xs"
                >
                  Confirm Close &amp; Hand-off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Till Closure Voucher Modal */}
      {tillVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 print:hidden">
              <span className="text-xs uppercase font-extrabold text-slate-500">Till Hand-off Voucher</span>
              <button onClick={() => setTillVoucherModal(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-voucher" className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-xs font-mono space-y-2">
              <div className="text-center border-b border-slate-300 pb-2">
                <h4 className="font-extrabold text-sm uppercase">FOCUS ACADEMY</h4>
                <p className="text-[10px]">Thiripura Complex, Thoramangalam, Perambalur</p>
                <p className="text-[9px] font-bold text-slate-700 mt-1 uppercase">DAILY TILL HAND-OFF VOUCHER</p>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between"><span>SESSION ID:</span><span className="font-bold">{tillVoucherModal.id}</span></div>
                <div className="flex justify-between"><span>DATE:</span><span>{tillVoucherModal.date}</span></div>
                <div className="flex justify-between"><span>CLOSED AT:</span><span>{new Date(tillVoucherModal.closedAt).toLocaleTimeString()}</span></div>
                <div className="flex justify-between"><span>CASHIER:</span><span>{tillVoucherModal.closedBy}</span></div>
                <div className="flex justify-between"><span>HANDED TO:</span><span>{tillVoucherModal.handedOverTo}</span></div>
              </div>

              <div className="border-t border-b border-slate-300 py-2 space-y-1 text-[11px]">
                <div className="flex justify-between"><span>OPENING FLOAT:</span><span>₹{tillVoucherModal.openingFloat?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span>CASH RECEIPTS:</span><span>₹{tillVoucherModal.cashCollected?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold"><span>EXPECTED CASH:</span><span>₹{tillVoucherModal.expectedDrawerCash?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-extrabold text-slate-900"><span>PHYSICAL COUNT:</span><span>₹{tillVoucherModal.closingCashActual?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold">
                  <span>DISCREPANCY:</span>
                  <span>{tillVoucherModal.difference === 0 ? '₹0 (Exact)' : `₹${tillVoucherModal.difference}`}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-end text-[10px] text-slate-600">
                <div className="text-center">
                  <div className="w-20 border-b border-slate-400 mb-1"></div>
                  <span>Cashier Sign</span>
                </div>
                <div className="text-center">
                  <div className="w-20 border-b border-slate-400 mb-1"></div>
                  <span>Supervisor Sign</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end space-x-2 print:hidden">
              <button
                type="button"
                onClick={() => setTillVoucherModal(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
