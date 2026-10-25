import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  X,
  Upload,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Download
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';
import { requireAdminEmail } from '../../services/adminIdentity';
import { validateIndianMobile, isBatchCompatible } from '../../types/schemas';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDueDateStr() {
  return new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [transferStudent, setTransferStudent] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [studentLedger, setStudentLedger] = useState(null);

  const [discountModalStudent, setDiscountModalStudent] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    discountType: 'merit_scholarship',
    amount: '',
    reason: '',
    approvingAdmin: ''
  });

  const [lifecycleModalStudent, setLifecycleModalStudent] = useState(null);
  const [lifecycleForm, setLifecycleForm] = useState({
    status: 'active',
    courseEndDate: '',
    reason: ''
  });

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvImportResult, setCsvImportResult] = useState(null);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState(() => ({
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
    enrollmentDate: getTodayStr(),
    courseEndDate: '',
    status: 'active',
    communicationConsent: true,
    preferredChannel: 'whatsapp',
    remindersDisabled: false,
    reminderDisabledReason: '',
    nextDueDate: getDueDateStr()
  }));

  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [transferTargetBatchId, setTransferTargetBatchId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferError, setTransferError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([
        AdminDataService.getStudents({ includeArchived: true }),
        AdminDataService.getBatches()
      ]);
      setStudents(s);
      setBatches(b);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkDuplicatesRealtime = (name, phone, studentIdToExclude) => {
    if ((name && name.trim().length >= 3) || (phone && phone.replace(/\D/g, '').length >= 6)) {
      const result = AdminDataService.checkDuplicateStudent({
        studentName: name,
        guardianPhone: phone,
        excludeStudentId: studentIdToExclude
      });
      setDuplicateWarning(result.hasDuplicate ? result.warning : null);
    } else {
      setDuplicateWarning(null);
    }
  };

  const exportStudentsCSV = () => {
    const headers = ['ID', 'Student Name', 'Grade', 'Board', 'Batch', 'Guardian Phone', 'Status', 'Enrollment Date', 'Course End Date'];
    const rows = students.map(s => {
      let phone = s.guardianPhone || '';
      if (phone.length >= 7) {
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
      enrollmentDate: getTodayStr(),
      courseEndDate: '',
      status: 'active',
      communicationConsent: true,
      preferredChannel: 'whatsapp',
      remindersDisabled: false,
      reminderDisabledReason: '',
      nextDueDate: getDueDateStr()
    });
    setDuplicateWarning(null);
    setFormError('');
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditStudent(student);
    const prefs = student.notificationPreferences || {};
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
      enrollmentDate: student.enrollmentDate || getTodayStr(),
      courseEndDate: student.courseEndDate || '',
      status: student.status || 'active',
      communicationConsent: prefs.communicationConsent !== undefined ? prefs.communicationConsent : true,
      preferredChannel: prefs.preferredChannel || 'whatsapp',
      remindersDisabled: Boolean(prefs.remindersDisabled),
      reminderDisabledReason: prefs.reminderDisabledReason || '',
      nextDueDate: student.feeConfig?.nextDueDate || ''
    });
    setDuplicateWarning(null);
    setFormError('');
    setCreateModalOpen(true);
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
      const currentAdmin = requireAdminEmail();

      if (editStudent) {
        await AdminDataService.updateStudent(editStudent.id, {
          studentName: formData.studentName.trim(),
          guardianName: formData.guardianName.trim(),
          guardianPhone: phoneVal.sanitized,
          grade: formData.grade,
          board: formData.board,
          academicSession: formData.academicSession,
          enrollmentDate: formData.enrollmentDate,
          courseEndDate: formData.courseEndDate || null,
          status: formData.status,
          notificationPreferences: {
            communicationConsent: formData.communicationConsent,
            preferredChannel: formData.preferredChannel,
            remindersDisabled: formData.remindersDisabled,
            reminderDisabledReason: formData.reminderDisabledReason
          },
          feeConfig: {
            ...editStudent.feeConfig,
            billingFrequency: formData.billingFrequency,
            amountPerCycle: Number(formData.amountPerCycle),
            discountAdjustment: Number(formData.discountAdjustment)
          }
        }, currentAdmin);
        setFormSuccess(`Updated student '${formData.studentName}'.`);
        setEditStudent(null);
      } else {
        await AdminDataService.createStudent({
          ...formData,
          guardianPhone: phoneVal.sanitized
        }, currentAdmin);
        setFormSuccess(`Successfully enrolled '${formData.studentName}' into batch.`);
      }
      setCreateModalOpen(false);
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
      const currentAdmin = requireAdminEmail();

      await AdminDataService.transferStudentBatch(
        transferStudent.id,
        transferTargetBatchId,
        transferReason || 'Batch realignment',
        currentAdmin
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

  const handleOpenDiscount = (student) => {
    setDiscountModalStudent(student);
    setDiscountForm({
      discountType: 'merit_scholarship',
      amount: '',
      reason: '',
      approvingAdmin: 'director@focusacademyperambalur.com'
    });
    setFormError('');
  };

  const handleExecuteDiscount = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const currentAdmin = requireAdminEmail();

      await AdminDataService.applyFeeDiscount({
        studentId: discountModalStudent.id,
        discountType: discountForm.discountType,
        amount: Number(discountForm.amount),
        reason: discountForm.reason,
        approvingAdmin: discountForm.approvingAdmin || currentAdmin
      }, null, currentAdmin);
      setFormSuccess(`Applied discount of ₹${discountForm.amount} for ${discountModalStudent.studentName}.`);
      setDiscountModalStudent(null);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to apply discount.');
    }
  };

  const handleOpenLifecycle = (student) => {
    setLifecycleModalStudent(student);
    setLifecycleForm({
      status: student.status,
      courseEndDate: student.courseEndDate || '',
      reason: ''
    });
    setFormError('');
  };

  const handleExecuteLifecycle = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const currentAdmin = requireAdminEmail();

      await AdminDataService.updateStudentLifecycleStatus(
        lifecycleModalStudent.id,
        {
          status: lifecycleForm.status,
          courseEndDate: lifecycleForm.courseEndDate || null,
          reason: lifecycleForm.reason
        },
        currentAdmin
      );
      setFormSuccess(`Updated lifecycle status for ${lifecycleModalStudent.studentName} to '${lifecycleForm.status}'.`);
      setLifecycleModalStudent(null);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to update lifecycle.');
    }
  };

  const handleArchiveToggle = async (student) => {
    try {
      const currentAdmin = requireAdminEmail();

      if (student.status === 'archived') {
        await AdminDataService.restoreStudent(student.id, currentAdmin);
        setFormSuccess(`Student '${student.studentName}' restored to active status.`);
      } else {
        await AdminDataService.archiveStudent(student.id, currentAdmin);
        setFormSuccess(`Student '${student.studentName}' moved to archive.`);
      }
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Archive toggle failed.');
    }
  };

  const handleParseCsv = () => {
    const preview = AdminDataService.validateAndParseStudentCSV(csvContent);
    setCsvPreview(preview);
    setCsvImportResult(null);
  };

  const handleExecuteCsvImport = async () => {
    if (!csvPreview || csvPreview.validRows.length === 0) return;
    try {
      const currentAdmin = requireAdminEmail();

      const res = await AdminDataService.importStudentsFromCSV(csvPreview.validRows, currentAdmin);
      setCsvImportResult(res);
      setFormSuccess(`Imported ${res.successCount} student(s) from CSV.`);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'CSV Import failed.');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }
      if (gradeFilter !== 'all' && !s.grade.toLowerCase().includes(gradeFilter.toLowerCase())) {
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
  }, [students, statusFilter, gradeFilter, batchFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new_enrollment':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">New Enrollment</span>;
      case 'active':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'paused':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Paused</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Completed</span>;
      case 'archived':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">Archived</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            <span>Student Management</span> <span className="text-slate-400 font-normal">& Lifecycle</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforce academic integrity, 12-seat capacity quotas, duplicate prevention, and lifecycle auditing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportStudentsCSV}
            title="Export Student Roster to CSV with Minor Contact Masking"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => { setCsvModalOpen(true); setCsvPreview(null); setCsvImportResult(null); setCsvContent(''); }}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {formError && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{formError}</span>
          </div>
          <button onClick={() => setFormError('')} className="text-red-600 hover:text-red-900 font-bold">✕</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by student name, ID, phone, or batch..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EA580C]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              <option value="active">Status: Active</option>
              <option value="new_enrollment">Status: New Enrollment</option>
              <option value="paused">Status: Paused</option>
              <option value="completed">Status: Completed</option>
              <option value="archived">Status: Archived</option>
              <option value="all">Status: All Records</option>
            </select>

            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer"
            >
              <option value="all">All Grades</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 12">Class 12</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 11">Class 11</option>
              <option value="Classes 6 to 8">Classes 6 to 8</option>
            </select>

            <select
              value={batchFilter}
              onChange={(e) => { setBatchFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-700 cursor-pointer max-w-[200px]"
            >
              <option value="all">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">Student</th>
                <th className="py-3 px-4 font-bold">Lifecycle Status</th>
                <th className="py-3 px-4 font-bold">Grade &amp; Board</th>
                <th className="py-3 px-4 font-bold">Assigned Batch</th>
                <th className="py-3 px-4 font-bold">Guardian Contact</th>
                <th className="py-3 px-4 font-bold">Fee Frequency</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((s) => (
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
                      {getStatusBadge(s.status)}
                      {s.courseEndDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">End: {s.courseEndDate}</p>
                      )}
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
                      {s.feeConfig?.discountAdjustment > 0 && (
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          -₹{s.feeConfig.discountAdjustment} discount
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleViewLedger(s)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-md font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                          title="View Ledger &amp; Profile"
                        >
                          <Receipt className="w-3 h-3 text-[#EA580C]" />
                          <span>Ledger</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDiscount(s)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                          title="Apply Discount / Scholarship"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenLifecycle(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title="Update Lifecycle Status"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
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
                  <td colSpan="7" className="py-8 text-center text-slate-400 text-xs">
                    No students match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} students
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

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-extrabold text-[#0F172A]">
                {editStudent ? `Edit Student: ${editStudent.studentName}` : 'Enroll New Student into Batch'}
              </h2>
              <button onClick={() => { setCreateModalOpen(false); setEditStudent(null); }} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateWarning && (
              <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-md text-amber-900 text-xs mb-4 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">Duplicate Warning Detected:</p>
                  <p className="text-[11px] mt-0.5">{duplicateWarning}</p>
                  <p className="text-[10px] text-amber-700 mt-1">Records are not automatically merged. Verify before confirming.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => {
                      setFormData({ ...formData, studentName: e.target.value });
                      checkDuplicatesRealtime(e.target.value, formData.guardianPhone, editStudent?.id);
                    }}
                    required
                    placeholder="e.g. S. Kaviya"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guardian Name *</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    required
                    placeholder="e.g. S. Sundaram"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guardian Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.guardianPhone}
                    onChange={(e) => {
                      setFormData({ ...formData, guardianPhone: e.target.value });
                      checkDuplicatesRealtime(formData.studentName, e.target.value, editStudent?.id);
                    }}
                    required
                    placeholder="10-digit mobile (e.g. 9842451220)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Enrollment Date</label>
                  <input
                    type="date"
                    value={formData.enrollmentDate}
                    onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Class / Grade *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => {
                      const newGrade = e.target.value;
                      const compatible = batches.filter(b => !b.isArchived && isBatchCompatible(b, newGrade, formData.board));
                      const nextBatch = compatible[0] || batches[0];
                      setFormData({
                        ...formData,
                        grade: newGrade,
                        batchId: nextBatch?.id || '',
                        amountPerCycle: nextBatch?.monthlyFee || formData.amountPerCycle
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Classes 6 to 8">Classes 6 to 8</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Educational Board *</label>
                  <select
                    value={formData.board}
                    onChange={(e) => {
                      const newBoard = e.target.value;
                      const compatible = batches.filter(b => !b.isArchived && isBatchCompatible(b, formData.grade, newBoard));
                      const nextBatch = compatible[0] || batches[0];
                      setFormData({
                        ...formData,
                        board: newBoard,
                        batchId: nextBatch?.id || '',
                        amountPerCycle: nextBatch?.monthlyFee || formData.amountPerCycle
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="TN State Board (Samacheer)">TN State Board (Samacheer)</option>
                    <option value="CBSE Board">CBSE Board</option>
                    <option value="ICSE Board">ICSE Board</option>
                    <option value="TN State Board, CBSE & ISC">TN State Board, CBSE &amp; ISC</option>
                    <option value="Samacheer, CBSE & ICSE">Samacheer, CBSE &amp; ICSE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign to Batch (Strict 12-Seat Capacity Guard) *
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                >
                  <option value="">Select Compatible Batch</option>
                  {batches
                    .filter(b => !b.isArchived && isBatchCompatible(b, formData.grade, formData.board))
                    .map(b => (
                      <option key={b.id} value={b.id} disabled={b.enrolledCount >= 12 && b.id !== editStudent?.batchId}>
                        {b.name} ({b.enrolledCount}/12 Seats occupied) {b.enrolledCount >= 12 && b.id !== editStudent?.batchId ? '— FULL' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Recurring Fee &amp; Concession Configuration
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Frequency</label>
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

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                  Guardian Communication &amp; Reminder Preferences
                </span>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={formData.communicationConsent}
                    onChange={(e) => setFormData({ ...formData, communicationConsent: e.target.checked })}
                    className="rounded text-[#EA580C] focus:ring-[#EA580C]"
                  />
                  <label htmlFor="consentCheck" className="text-slate-700 font-semibold text-xs">
                    Guardian consented to automated fee reminders and WhatsApp notifications
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="disableRemindersCheck"
                    checked={formData.remindersDisabled}
                    onChange={(e) => setFormData({ ...formData, remindersDisabled: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="disableRemindersCheck" className="text-red-700 font-semibold text-xs">
                    Disable reminders for this individual student
                  </label>
                </div>

                {formData.remindersDisabled && (
                  <div>
                    <input
                      type="text"
                      value={formData.reminderDisabledReason}
                      onChange={(e) => setFormData({ ...formData, reminderDisabledReason: e.target.value })}
                      placeholder="Reason for disabling reminders (e.g. Guardian opted out, sponsored student)"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                )}
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
              <button onClick={() => setTransferStudent(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
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
                  <span className="text-slate-500">Grade &amp; Board:</span>
                  <span className="font-bold text-slate-800">{transferStudent.grade} • {transferStudent.board}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Batch:</span>
                  <span className="font-bold text-[#EA580C]">{transferStudent.batchName}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proposed Destination Batch *</label>
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
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Transfer (Audited) *</label>
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

      {discountModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  Apply Fee Discount: {discountModalStudent.studentName}
                </h2>
              </div>
              <button onClick={() => setDiscountModalStudent(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteDiscount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Discount / Concession Type *</label>
                <select
                  value={discountForm.discountType}
                  onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="merit_scholarship">Merit Scholarship</option>
                  <option value="sibling_concession">Sibling Concession</option>
                  <option value="financial_aid">Financial Aid / Need-Based</option>
                  <option value="special_waiver">Special Director Waiver</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={discountForm.amount}
                  onChange={(e) => setDiscountForm({ ...discountForm, amount: e.target.value })}
                  required
                  placeholder="e.g. 300"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Approving Administrator *</label>
                <input
                  type="text"
                  value={discountForm.approvingAdmin}
                  onChange={(e) => setDiscountForm({ ...discountForm, approvingAdmin: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Reason (Audit Compliant, min 5 chars) *</label>
                <textarea
                  rows={2}
                  value={discountForm.reason}
                  onChange={(e) => setDiscountForm({ ...discountForm, reason: e.target.value })}
                  required
                  placeholder="e.g. Top rank in entrance evaluation, validated by Director"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setDiscountModalStudent(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Confirm Audited Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lifecycleModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-extrabold text-[#0F172A]">
                Update Lifecycle Status: {lifecycleModalStudent.studentName}
              </h2>
              <button onClick={() => setLifecycleModalStudent(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteLifecycle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Status *</label>
                <select
                  value={lifecycleForm.status}
                  onChange={(e) => setLifecycleForm({ ...lifecycleForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="active">Active (Attending)</option>
                  <option value="new_enrollment">New Enrollment</option>
                  <option value="paused">Temporarily Paused</option>
                  <option value="completed">Course Completed / Graduated</option>
                  <option value="archived">Archived / Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course End Date (Optional)</label>
                <input
                  type="date"
                  value={lifecycleForm.courseEndDate}
                  onChange={(e) => setLifecycleForm({ ...lifecycleForm, courseEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Status Change</label>
                <input
                  type="text"
                  value={lifecycleForm.reason}
                  onChange={(e) => setLifecycleForm({ ...lifecycleForm, reason: e.target.value })}
                  placeholder="e.g. Medical leave, completed Class 10 board prep"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setLifecycleModalStudent(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Update Lifecycle Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-[#EA580C]" />
                <h2 className="text-base font-extrabold text-[#0F172A]">
                  Import Students from CSV
                </h2>
              </div>
              <button onClick={() => setCsvModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Paste CSV Content or Upload File</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvContent('studentName,guardianName,guardianPhone,grade,board,batchId,billingFrequency,amountPerCycle\n"M. Priya","K. Murugan","9842419999","Class 10","TN State Board (Samacheer)","batch-10-state-board","monthly",2200');
                    }}
                    className="text-[11px] text-[#EA580C] hover:underline font-bold"
                  >
                    Insert Sample Row
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="studentName,guardianName,guardianPhone,grade,board,batchId,billingFrequency,amountPerCycle&#10;&quot;S. Kaviya&quot;,&quot;S. Sundaram&quot;,&quot;9842451220&quot;,&quot;Class 10&quot;,&quot;TN State Board (Samacheer)&quot;,&quot;batch-10-state-board&quot;,&quot;monthly&quot;,2200"
                  className="w-full p-3 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 cursor-pointer"
                >
                  Validate &amp; Preview CSV
                </button>
              </div>

              {csvPreview && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center space-x-4 text-xs font-bold">
                    <span className="text-emerald-700">Valid Rows: {csvPreview.validRows.length}</span>
                    <span className="text-amber-700">Duplicate Warnings: {csvPreview.duplicateRows.length}</span>
                    <span className="text-red-700">Invalid Rows: {csvPreview.invalidRows.length}</span>
                  </div>

                  {csvPreview.invalidRows.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
                      <span className="font-bold text-red-800 block text-[11px]">Errors Detected:</span>
                      {csvPreview.invalidRows.map((inv, idx) => (
                        <p key={idx} className="text-red-700 text-[11px]">
                          Line {inv.line}: {inv.reason}
                        </p>
                      ))}
                    </div>
                  )}

                  {csvPreview.duplicateRows.length > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                      <span className="font-bold text-amber-800 block text-[11px]">Duplicate Warnings:</span>
                      {csvPreview.duplicateRows.map((dup, idx) => (
                        <p key={idx} className="text-amber-700 text-[11px]">
                          Line {dup.line} ({dup.studentName}): {dup.warning}
                        </p>
                      ))}
                    </div>
                  )}

                  {csvPreview.validRows.length > 0 && (
                    <div className="border border-slate-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-2">Name</th>
                            <th className="p-2">Phone</th>
                            <th className="p-2">Grade</th>
                            <th className="p-2">Board</th>
                            <th className="p-2">Batch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {csvPreview.validRows.map((v, i) => (
                            <tr key={i}>
                              <td className="p-2 font-bold">{v.studentName}</td>
                              <td className="p-2 font-mono">+91 {v.guardianPhone}</td>
                              <td className="p-2">{v.grade}</td>
                              <td className="p-2">{v.board}</td>
                              <td className="p-2">{v.batchName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCsvModalOpen(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteCsvImport}
                      disabled={csvPreview.validRows.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer disabled:opacity-50"
                    >
                      Execute Import ({csvPreview.validRows.length} Students)
                    </button>
                  </div>
                </div>
              )}

              {csvImportResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs font-semibold">
                  Import completed: {csvImportResult.successCount} created successfully. {csvImportResult.failedCount} failures.
                </div>
              )}
            </div>
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
                  {getStatusBadge(profileStudent.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profileStudent.grade} • {profileStudent.board} • {profileStudent.batchName}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Enrolled: {profileStudent.enrollmentDate} {profileStudent.courseEndDate ? `• Course End: ${profileStudent.courseEndDate}` : ''}
                </p>
              </div>

              <button onClick={() => { setProfileStudent(null); setStudentLedger(null); }} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
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
              {profileStudent.feeConfig?.adjustmentHistory?.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#0F172A] mb-2 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    <span>Approved Concessions &amp; Adjustment History</span>
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                    {profileStudent.feeConfig.adjustmentHistory.map(adj => (
                      <div key={adj.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800 capitalize">{adj.discountType.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-slate-500">{adj.reason}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Approved: {adj.approvingAdmin} • {adj.timestamp.split('T')[0]}</p>
                        </div>
                        <span className="font-extrabold text-purple-700 text-sm">-₹{adj.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-[#0F172A] mb-2 uppercase text-[11px] tracking-wider">
                  Fee Obligations &amp; Dues
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
                  Payment History &amp; Receipts
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                  {studentLedger.payments.length > 0 ? (
                    studentLedger.payments.map((p) => (
                      <div key={p.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-mono font-bold text-[#EA580C]">{p.receiptNumber}</p>
                          <p className="text-[10px] text-slate-400">{p.paymentDate} • {p.paymentMethod.toUpperCase()} (Recorded by: {p.recordedBy || 'admin'})</p>
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
