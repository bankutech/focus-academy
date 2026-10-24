import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  ArrowRightLeft, 
  Receipt, 
  Edit3, 
  Archive, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';
import { validateIndianMobile, isBatchCompatible } from '../../types/schemas';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [boardFilter, setBoardFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [transferStudent, setTransferStudent] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [studentLedger, setStudentLedger] = useState(null);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState({
    studentName: '',
    guardianName: '',
    guardianPhone: '',
    grade: 'Class 10',
    board: 'TN State Board (Samacheer)',
    academicSession: '2025-2026',
    batchId: '',
    billingFrequency: 'monthly',
    amountPerCycle: 2200,
    discountAdjustment: 0,
    enrollmentDate: new Date().toISOString().split('T')[0],
    nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });

  const [transferTargetBatchId, setTransferTargetBatchId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferError, setTransferError] = useState('');

  const loadData = async () => {
    try {
      const [s, b] = await Promise.all([
        AdminDataService.getStudents(),
        AdminDataService.getBatches()
      ]);
      setStudents(s);
      setBatches(b);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditStudent(null);
    const defaultBatch = batches.find(b => !b.isArchived && isBatchCompatible(b, 'Class 10', 'TN State Board (Samacheer)'));
    setFormData({
      studentName: '',
      guardianName: '',
      guardianPhone: '',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      academicSession: '2025-2026',
      batchId: defaultBatch ? defaultBatch.id : (batches[0]?.id || ''),
      billingFrequency: 'monthly',
      amountPerCycle: defaultBatch ? defaultBatch.monthlyFee : 2200,
      discountAdjustment: 0,
      enrollmentDate: new Date().toISOString().split('T')[0],
      nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    });
    setFormError('');
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditStudent(student);
    setFormData({
      studentName: student.studentName,
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      grade: student.grade,
      board: student.board,
      academicSession: student.academicSession || '2025-2026',
      batchId: student.batchId,
      billingFrequency: student.feeConfig?.billingFrequency || 'monthly',
      amountPerCycle: student.feeConfig?.amountPerCycle || 2200,
      discountAdjustment: student.feeConfig?.discountAdjustment || 0,
      enrollmentDate: student.enrollmentDate || new Date().toISOString().split('T')[0],
      nextDueDate: student.feeConfig?.nextDueDate || ''
    });
    setFormError('');
    setCreateModalOpen(true);
  };

  const handleGradeChange = (newGrade) => {
    const compatible = batches.filter(b => !b.isArchived && isBatchCompatible(b, newGrade, formData.board));
    const nextBatch = compatible[0] || batches[0];
    setFormData({
      ...formData,
      grade: newGrade,
      batchId: nextBatch?.id || '',
      amountPerCycle: nextBatch?.monthlyFee || formData.amountPerCycle
    });
  };

  const handleBoardChange = (newBoard) => {
    const compatible = batches.filter(b => !b.isArchived && isBatchCompatible(b, formData.grade, newBoard));
    const nextBatch = compatible[0] || batches[0];
    setFormData({
      ...formData,
      board: newBoard,
      batchId: nextBatch?.id || '',
      amountPerCycle: nextBatch?.monthlyFee || formData.amountPerCycle
    });
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.studentName.trim() || formData.studentName.trim().length < 2) {
      setFormError('Student name must be at least 2 characters.');
      return;
    }

    const phoneVal = validateIndianMobile(formData.guardianPhone);
    if (!phoneVal.valid) {
      setFormError(phoneVal.error);
      return;
    }

    if (!formData.batchId) {
      setFormError('Please select a compatible batch.');
      return;
    }

    try {
      if (editStudent) {
        await AdminDataService.updateStudent(editStudent.id, {
          studentName: formData.studentName.trim(),
          guardianName: formData.guardianName.trim(),
          guardianPhone: phoneVal.sanitized,
          grade: formData.grade,
          board: formData.board,
          academicSession: formData.academicSession,
          feeConfig: {
            ...editStudent.feeConfig,
            billingFrequency: formData.billingFrequency,
            amountPerCycle: Number(formData.amountPerCycle),
            discountAdjustment: Number(formData.discountAdjustment)
          }
        });
        setFormSuccess(`Updated student '${formData.studentName}'.`);
        setEditStudent(null);
      } else {
        await AdminDataService.createStudent({
          ...formData,
          guardianPhone: phoneVal.sanitized
        });
        setFormSuccess(`Successfully enrolled '${formData.studentName}' into batch.`);
        setCreateModalOpen(false);
      }
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleOpenTransfer = (student) => {
    setTransferStudent(student);
    setTransferTargetBatchId('');
    setTransferReason('Academic scheduling requirement');
    setTransferError('');
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    setTransferError('');

    if (!transferTargetBatchId) {
      setTransferError('Please select a destination batch.');
      return;
    }

    const targetBatch = batches.find(b => b.id === transferTargetBatchId);
    if (!targetBatch) {
      setTransferError('Target batch not found.');
      return;
    }

    if (!isBatchCompatible(targetBatch, transferStudent.grade, transferStudent.board)) {
      setTransferError(
        `Academic Mismatch: Student grade '${transferStudent.grade}' (${transferStudent.board}) cannot be transferred to batch '${targetBatch.name}' (${targetBatch.grade}).`
      );
      return;
    }

    if (targetBatch.enrolledCount >= 12) {
      setTransferError(`Target batch '${targetBatch.name}' is already at full capacity (12/12 seats).`);
      return;
    }

    try {
      await AdminDataService.transferStudentBatch(
        transferStudent.id,
        transferTargetBatchId,
        transferReason || 'Batch realignment'
      );
      setFormSuccess(`Transferred '${transferStudent.studentName}' to '${targetBatch.name}'.`);
      setTransferStudent(null);
      await loadData();
    } catch (err) {
      setTransferError(err.message || 'Transfer failed.');
    }
  };

  const handleViewLedger = async (student) => {
    setProfileStudent(student);
    try {
      const ledger = await AdminDataService.getStudentLedger(student.id);
      setStudentLedger(ledger);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    }
  };

  const handleArchiveToggle = async (student) => {
    try {
      if (student.status === 'archived') {
        await AdminDataService.restoreStudent(student.id);
        setFormSuccess(`Student '${student.studentName}' restored to active status.`);
      } else {
        await AdminDataService.archiveStudent(student.id);
        setFormSuccess(`Student '${student.studentName}' moved to archive.`);
      }
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Archive toggle failed.');
    }
  };

  const filteredStudents = students.filter((s) => {
    if (statusFilter === 'active' && s.status === 'archived') return false;
    if (statusFilter === 'archived' && s.status !== 'archived') return false;

    if (gradeFilter !== 'all' && !s.grade.toLowerCase().includes(gradeFilter.toLowerCase())) {
      return false;
    }
    if (boardFilter !== 'all' && !s.board.toLowerCase().includes(boardFilter.toLowerCase())) {
      return false;
    }
    if (batchFilter !== 'all' && s.batchId !== batchFilter) {
      return false;
    }

    if (search) {
      const q = search.toLowerCase();
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.guardianPhone.includes(q) ||
        (s.guardianName && s.guardianName.toLowerCase().includes(q)) ||
        (s.batchName && s.batchName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforce academic integrity, 12-seat batch assignments, fee schedules, and audit trails
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, phone, or guardian..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EA580C]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
          >
            <option value="all">All Grades</option>
            <option value="middle">Classes 6 to 8</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>

          <select
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
          >
            <option value="all">All Boards</option>
            <option value="state">TN State Board</option>
            <option value="cbse">CBSE</option>
            <option value="icse">ICSE / ISC</option>
          </select>

          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white max-w-[160px] truncate"
          >
            <option value="all">All Batches</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
          >
            <option value="active">Active Students</option>
            <option value="archived">Archived</option>
            <option value="all">All Records</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Student</th>
                <th className="py-3 px-4 font-bold">Grade & Board</th>
                <th className="py-3 px-4 font-bold">Assigned Batch</th>
                <th className="py-3 px-4 font-bold">Guardian Contact</th>
                <th className="py-3 px-4 font-bold">Fee Frequency</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-[#0F172A] text-sm">{s.studentName}</span>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">{s.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[10px] text-slate-500">{s.academicSession}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-700">{s.grade}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{s.board}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#EA580C] border border-orange-200 truncate max-w-[200px]">
                        {s.batchName || s.batchId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 font-mono text-slate-700">
                        <Phone className="w-3 h-3 text-[#EA580C]" />
                        <span>+91 {s.guardianPhone}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{s.guardianName}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-slate-700">
                        {s.feeConfig?.billingFrequency || 'Monthly'}
                      </span>
                      <p className="text-[11px] font-bold text-[#0F172A]">
                        ₹{Number(s.feeConfig?.amountPerCycle || 0).toLocaleString('en-IN')}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewLedger(s)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-md font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                          title="View Ledger & Profile"
                        >
                          <Receipt className="w-3 h-3 text-[#EA580C]" />
                          <span>Ledger</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenTransfer(s)}
                          className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-[#EA580C] rounded-md font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                          title="Transfer Batch"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span className="hidden sm:inline">Transfer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleArchiveToggle(s)}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            s.status === 'archived'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                          title={s.status === 'archived' ? 'Restore Student' : 'Archive Student'}
                        >
                          {s.status === 'archived' ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-extrabold text-[#0F172A]">
                {editStudent ? `Edit Student: ${editStudent.studentName}` : 'Add Student to Batch'}
              </h2>
              <button onClick={() => { setCreateModalOpen(false); setEditStudent(null); }} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="e.g. S. Kaviya"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#EA580C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="e.g. S. Sundaram"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guardian Phone (10 Digits) *</label>
                  <input
                    type="tel"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    placeholder="9842451220"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Session</label>
                  <input
                    type="text"
                    value={formData.academicSession}
                    onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade / Class *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Classes 6 to 8">Classes 6 to 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Curriculum Board *</label>
                  <select
                    value={formData.board}
                    onChange={(e) => handleBoardChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="TN State Board (Samacheer)">TN State Board (Samacheer)</option>
                    <option value="CBSE Board">CBSE Board</option>
                    <option value="ICSE Board">ICSE Board</option>
                    <option value="TN State Board, CBSE & ISC">State / CBSE / ISC (Combined)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign to Batch (Filtered for Compatibility) *
                </label>
                <select
                  value={formData.batchId}
                  onChange={(e) => {
                    const b = batches.find(item => item.id === e.target.value);
                    setFormData({
                      ...formData,
                      batchId: e.target.value,
                      amountPerCycle: b?.monthlyFee || formData.amountPerCycle
                    });
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select Compatible Batch</option>
                  {batches
                    .filter(b => !b.isArchived && isBatchCompatible(b, formData.grade, formData.board))
                    .map(b => (
                      <option key={b.id} value={b.id} disabled={b.enrolledCount >= 12}>
                        {b.name} ({b.enrolledCount}/12 Seats occupied) {b.enrolledCount >= 12 ? '— FULL' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Recurring Fee Configuration
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Billing Frequency</label>
                    <select
                      value={formData.billingFrequency}
                      onChange={(e) => setFormData({ ...formData, billingFrequency: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half-yearly">Half-Yearly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Amount / Cycle (₹)</label>
                    <input
                      type="number"
                      value={formData.amountPerCycle}
                      onChange={(e) => setFormData({ ...formData, amountPerCycle: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Discount (₹)</label>
                    <input
                      type="number"
                      value={formData.discountAdjustment}
                      onChange={(e) => setFormData({ ...formData, discountAdjustment: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setCreateModalOpen(false); setEditStudent(null); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-lg cursor-pointer"
                >
                  {editStudent ? 'Save Student Updates' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-[#EA580C]" />
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  Transfer Batch: {transferStudent.studentName}
                </h2>
              </div>
              <button onClick={() => setTransferStudent(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-800 text-xs mb-4 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-mono font-bold text-slate-800">{transferStudent.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grade & Board:</span>
                  <span className="font-bold text-slate-800">{transferStudent.grade} • {transferStudent.board}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Batch:</span>
                  <span className="font-bold text-[#EA580C]">{transferStudent.batchName}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Proposed Destination Batch *
                </label>
                <select
                  value={transferTargetBatchId}
                  onChange={(e) => setTransferTargetBatchId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Select Destination Batch</option>
                  {batches
                    .filter(b => b.id !== transferStudent.batchId && !b.isArchived)
                    .map((b) => {
                      const compatible = isBatchCompatible(b, transferStudent.grade, transferStudent.board);
                      const isFull = b.enrolledCount >= 12;
                      return (
                        <option
                          key={b.id}
                          value={b.id}
                          disabled={!compatible || isFull}
                        >
                          {b.name} ({b.enrolledCount}/12 Seats) {!compatible ? '— INCOMPATIBLE' : isFull ? '— FULL' : ''}
                        </option>
                      );
                    })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Incompatible classes and batches at 12/12 capacity are disabled to preserve academic integrity.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Transfer (Audited) *
                </label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Schedule clash with school bus, academic leveling"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTransferStudent(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-lg cursor-pointer"
                >
                  Confirm Audited Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profileStudent && studentLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-extrabold text-[#0F172A]">
                    {profileStudent.studentName}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                    {profileStudent.id}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profileStudent.grade} • {profileStudent.board} • {profileStudent.batchName}
                </p>
              </div>

              <button onClick={() => { setProfileStudent(null); setStudentLedger(null); }} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-center">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Charged</span>
                <span className="text-sm font-extrabold text-[#0F172A]">
                  ₹{studentLedger.totalFeesCharged.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Paid</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  ₹{studentLedger.totalAmountPaid.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Outstanding</span>
                <span className="text-sm font-extrabold text-amber-700">
                  ₹{studentLedger.outstandingBalance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-[10px] uppercase font-bold text-red-600 block">Overdue</span>
                <span className="text-sm font-extrabold text-red-700">
                  ₹{studentLedger.overdueAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-[#0F172A] mb-2 uppercase text-[11px] tracking-wider">
                  Fee Obligations & Dues
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {studentLedger.obligations.length > 0 ? (
                    studentLedger.obligations.map((obl) => (
                      <div key={obl.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{obl.billingCycle}</p>
                          <p className="text-[10px] text-slate-400">Due Date: {obl.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">₹{obl.amountDue}</p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            obl.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            obl.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            obl.status === 'partially_paid' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {obl.status} (Bal: ₹{obl.balance})
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-3 text-slate-400 text-center">No fee obligations found.</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#0F172A] mb-2 uppercase text-[11px] tracking-wider">
                  Payment History & Receipts
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {studentLedger.payments.length > 0 ? (
                    studentLedger.payments.map((p) => (
                      <div key={p.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-mono font-bold text-[#EA580C]">{p.receiptNumber}</p>
                          <p className="text-[10px] text-slate-400">{p.paymentDate} • {p.paymentMethod.toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-emerald-600">₹{p.amount}</p>
                          <p className="text-[10px] text-slate-400">{p.referenceNumber || 'Cash'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-3 text-slate-400 text-center">No payments recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => { setProfileStudent(null); setStudentLedger(null); }}
                className="px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
