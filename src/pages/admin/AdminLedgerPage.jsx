import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Search, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';

export default function AdminLedgerPage() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [receiptModalPayment, setReceiptModalPayment] = useState(null);
  const [reverseModalPayment, setReverseModalPayment] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseError, setReverseError] = useState('');

  const [formError, setFormError] = useState('');
  const [settings, setSettings] = useState(null);
  const [formSuccess, setFormSuccess] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    obligationId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      const [p, s, o, m, setts] = await Promise.all([
        AdminDataService.getPayments(),
        AdminDataService.getStudents(),
        AdminDataService.getFeeObligations(),
        AdminDataService.getDashboardMetrics(),
        AdminDataService.getSettings()
      ]);
      setPayments(p);
      setStudents(s);
      setObligations(o);
      setMetrics(m);
      setSettings(setts);

      const params = new URLSearchParams(window.location.search);
      const stuId = params.get('studentId');
      const oblId = params.get('obligationId');
      if (stuId) {
        const studentObls = o.filter(item => item.studentId === stuId && item.balance > 0);
        const targetObl = oblId ? o.find(item => item.id === oblId) : studentObls[0];
        setPaymentForm(prev => ({
          ...prev,
          studentId: stuId,
          obligationId: targetObl ? targetObl.id : (oblId || ''),
          amount: targetObl ? targetObl.balance : ''
        }));
        setRecordModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading ledger data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudentSelect = (studentId) => {
    const studentObligations = obligations.filter(o => o.studentId === studentId && o.balance > 0);
    const firstUnpaid = studentObligations[0];
    setPaymentForm({
      ...paymentForm,
      studentId,
      obligationId: firstUnpaid ? firstUnpaid.id : '',
      amount: firstUnpaid ? firstUnpaid.balance : ''
    });
  };

  const handleObligationSelect = (obligationId) => {
    const obl = obligations.find(o => o.id === obligationId);
    setPaymentForm({
      ...paymentForm,
      obligationId,
      amount: obl ? obl.balance : ''
    });
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!paymentForm.studentId) {
      setFormError('Please select a student.');
      return;
    }
    if (!paymentForm.obligationId) {
      setFormError('Please select an active fee obligation.');
      return;
    }
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setFormError('Payment amount must be greater than zero.');
      return;
    }

    try {
      const rawSession = sessionStorage.getItem('focus_academy_admin_session');
      let currentAdmin = 'admin@focusacademyperambalur.com';
      if (rawSession) {
        try {
          const parsed = JSON.parse(rawSession);
          if (parsed?.email) currentAdmin = parsed.email;
        } catch {}
      }

      const result = await AdminDataService.recordPayment({
        ...paymentForm,
        amount: Number(paymentForm.amount)
      }, currentAdmin);

      setFormSuccess(`Recorded payment ₹${paymentForm.amount}. Receipt: ${result.payment.receiptNumber}`);
      setRecordModalOpen(false);
      setReceiptModalPayment(result.payment);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Payment recording failed.');
    }
  };

  const handleExecuteReverse = async (e) => {
    e.preventDefault();
    setReverseError('');
    if (!reverseReason || reverseReason.trim().length < 5) {
      setReverseError('A valid reason of at least 5 characters is mandatory for audit compliance.');
      return;
    }
    try {
      const rawSession = sessionStorage.getItem('focus_academy_admin_session');
      let currentAdmin = 'admin@focusacademyperambalur.com';
      if (rawSession) {
        try {
          const parsed = JSON.parse(rawSession);
          if (parsed?.email) currentAdmin = parsed.email;
        } catch {}
      }
      await AdminDataService.reversePayment(reverseModalPayment.id, reverseReason, currentAdmin);
      setFormSuccess(`Reversed payment ₹${reverseModalPayment.amount} for ${reverseModalPayment.studentName}.`);
      setReverseModalPayment(null);
      setReverseReason('');
      await loadData();
    } catch (err) {
      setReverseError(err.message || 'Payment reversal failed.');
    }
  };

  const uniqueAdmins = Array.from(new Set(payments.map(p => p.recordedBy || 'admin@focusacademyperambalur.com'))).filter(Boolean);

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) {
      return false;
    }
    if (adminFilter !== 'all' && (p.recordedBy || 'admin@focusacademyperambalur.com') !== adminFilter) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        p.studentName.toLowerCase().includes(q) ||
        p.receiptNumber.toLowerCase().includes(q) ||
        (p.recordedBy && p.recordedBy.toLowerCase().includes(q)) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Financial Ledger & Payments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified financial transaction ledger, receipt generation, and payment balance audits
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const firstActive = students.find(s => s.status === 'active') || students[0];
            const stuId = firstActive?.id || '';
            const studentObls = obligations.filter(o => o.studentId === stuId && o.balance > 0);
            const firstUnpaid = studentObls[0];
            setPaymentForm({
              studentId: stuId,
              obligationId: firstUnpaid ? firstUnpaid.id : '',
              amount: firstUnpaid ? firstUnpaid.balance : '',
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMethod: 'cash',
              referenceNumber: '',
              notes: ''
            });
            setFormError('');
            setRecordModalOpen(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fees Collected This Month</span>
          <span className="text-2xl font-extrabold text-emerald-600">
            ₹{(metrics?.feesCollectedThisMonth ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Fees</span>
          <span className="text-2xl font-extrabold text-amber-600">
            ₹{(metrics?.totalOutstandingFees ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Fees</span>
          <span className="text-2xl font-extrabold text-red-600">
            ₹{(metrics?.totalOverdueFees ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, receipt #, or reference..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EA580C]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={adminFilter}
            onChange={(e) => { setAdminFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
          >
            <option value="all">All Administrators</option>
            {uniqueAdmins.map(adm => (
              <option key={adm} value={adm}>{adm}</option>
            ))}
          </select>

          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="upi_online">UPI / Online</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Receipt #</th>
                <th className="py-3 px-4 font-bold">Student</th>
                <th className="py-3 px-4 font-bold">Amount Paid</th>
                <th className="py-3 px-4 font-bold">Payment Method</th>
                <th className="py-3 px-4 font-bold">Recorded By</th>
                <th className="py-3 px-4 font-bold">Reference / UTR</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#EA580C]">
                      {pay.receiptNumber}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                      {pay.studentName}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-sm">
                      <span className={pay.isReversed || pay.reversed ? 'line-through text-slate-400' : 'text-emerald-600'}>
                        ₹{Number(pay.amount).toLocaleString('en-IN')}
                      </span>
                      {(pay.isReversed || pay.reversed) && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-red-100 text-red-700 rounded-sm">
                          REVERSED
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize font-bold text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {pay.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {pay.recordedBy || 'admin'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {pay.referenceNumber || '—'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {pay.paymentDate}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setReceiptModalPayment(pay)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-[#0F172A] hover:text-white text-slate-700 rounded-md font-bold text-[11px] inline-flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                      {!(pay.isReversed || pay.reversed) && (
                        <button
                          type="button"
                          onClick={() => {
                            setReverseModalPayment(pay);
                            setReverseReason('');
                            setReverseError('');
                          }}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 rounded-md font-bold text-[11px] inline-flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Reverse Payment"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                    No transactions match the filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} transactions
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

      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-[#EA580C]" />
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  Record Verified Payment
                </h2>
              </div>
              <button onClick={() => setRecordModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Student *</label>
                <select
                  value={paymentForm.studentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select Student</option>
                  {students.filter(s => s.status === 'active').map(s => (
                    <option key={s.id} value={s.id}>
                      {s.studentName} ({s.id}) • {s.grade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Related Fee Obligation *</label>
                <select
                  value={paymentForm.obligationId}
                  onChange={(e) => handleObligationSelect(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select Obligation</option>
                  {obligations
                    .filter(o => o.studentId === paymentForm.studentId && o.balance > 0)
                    .map(o => (
                      <option key={o.id} value={o.id}>
                        {o.billingCycle} • Due: {o.dueDate} • Balance: ₹{o.balance}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount to Record (₹) *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="cash">Cash (Front Desk)</option>
                    <option value="upi_online">UPI / GooglePay / PhonePe</option>
                    <option value="bank_transfer">Direct Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reference / UTR Number</label>
                  <input
                    type="text"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    placeholder="e.g. UPI/62918291..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRecordModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-lg cursor-pointer"
                >
                  Record & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiptModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 print:hidden">
              <span className="text-xs uppercase font-extrabold text-slate-400">Official Fee Receipt</span>
              <button onClick={() => setReceiptModalPayment(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-receipt" className="p-4 border border-slate-200 rounded-lg bg-slate-50 text-xs">
              <div className="text-center border-b border-slate-200 pb-3 mb-3">
                <h3 className="text-base font-extrabold text-[#0F172A] uppercase">
                  {settings?.academyName || 'FOCUS ACADEMY'}
                </h3>
                <p className="text-[11px] text-slate-600 font-medium">
                  {settings?.campusAddress || 'Thiripura Complex, Thoramangalam, Perambalur – 621220'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Phone: {settings?.primaryPhone || '+91 98424 51220'} • {settings?.email || 'contact@focusacademyperambalur.com'}
                </p>
              </div>

              <div className="flex justify-between items-center mb-3 text-[11px]">
                <div>
                  <span className="text-slate-500">Receipt No: </span>
                  <span className="font-mono font-bold text-[#EA580C]">{receiptModalPayment.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Date: </span>
                  <span className="font-mono font-bold text-slate-800">{receiptModalPayment.paymentDate}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-md border border-slate-200 space-y-1.5 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900">{receiptModalPayment.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-mono font-bold text-slate-900">{receiptModalPayment.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="capitalize font-bold text-slate-900">{receiptModalPayment.paymentMethod.replace('_', ' ')}</span>
                </div>
                {receiptModalPayment.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference / UTR:</span>
                    <span className="font-mono text-slate-700">{receiptModalPayment.referenceNumber}</span>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md flex justify-between items-center mb-3">
                <span className="font-bold text-emerald-800 text-sm">AMOUNT RECEIVED:</span>
                <span className="font-extrabold text-emerald-700 text-lg">
                  {settings?.currencySymbol || '₹'}{Number(receiptModalPayment.amount).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-4 flex justify-between items-end text-[10px] text-slate-500 border-t border-slate-200">
                <div>
                  <p>Recorded By: {receiptModalPayment.recordedBy || 'Campus Admin'}</p>
                  <p>Computer-generated verifiable receipt.</p>
                </div>
                <div className="text-center">
                  <div className="w-24 border-b border-slate-400 mb-1"></div>
                  <span>Authorized Signature</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end space-x-2 print:hidden">
              <button
                type="button"
                onClick={() => setReceiptModalPayment(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {reverseModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2 text-red-600">
                <RotateCcw className="w-5 h-5" />
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  Reverse Payment Transaction
                </h2>
              </div>
              <button onClick={() => setReverseModalPayment(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reverseError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start space-x-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{reverseError}</span>
              </div>
            )}

            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-bold text-[#EA580C]">{reverseModalPayment.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-800">{reverseModalPayment.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount to Reverse:</span>
                <span className="font-extrabold text-red-600">₹{Number(reverseModalPayment.amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteReverse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Reversal <span className="text-red-500">* (Min 5 chars for audit)</span>
                </label>
                <textarea
                  required
                  rows="3"
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  placeholder="e.g. Bounced cheque, UPI chargeback, or entry made in error"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReverseModalPayment(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
