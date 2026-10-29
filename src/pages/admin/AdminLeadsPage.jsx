import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Phone, 
  MessageSquare, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  X, 
  Archive, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertTriangle,
  ClipboardList,
  Eye,
  Pencil,
  FileText,
  Trash2
} from 'lucide-react';
import { AdminDataService, ENROLLMENT_STATUSES } from '../../services/adminDataService';
import { LeadService } from '../../services/leadService';
import { requireAdminEmail } from '../../services/adminIdentity';
import { formatTime12 } from '../../types/schemas';
import { formatPhoneNumber } from '../../utils/phoneValidation';

const ENROLLMENT_STATUS_META = {
  pending: { label: 'Pending Review', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  waitlisted: { label: 'Waitlisted', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  cancelled: { label: 'Cancelled', className: 'bg-rose-50 text-rose-800 border-rose-200' },
  archived: { label: 'Archived', className: 'bg-slate-100 text-slate-600 border-slate-200' }
};

const normalizeEnrollmentStatus = (status) => {
  if (ENROLLMENT_STATUSES.includes(status)) return status;
  if (status === 'converted') return 'confirmed';
  return 'pending';
};

const enrollmentStatusBadge = (status, reservationId) => {
  const norm = normalizeEnrollmentStatus(status);
  let meta = ENROLLMENT_STATUS_META[norm] || ENROLLMENT_STATUS_META.pending;
  if (norm === 'pending' && reservationId) {
    meta = { label: 'Seat Reserved (Pending Review)', className: 'bg-blue-50 text-blue-800 border-blue-200' };
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold border ${meta.className}`}>
      {meta.label}
    </span>
  );
};

export default function AdminLeadsPage() {
  const [searchParams] = useSearchParams();
  const urlSource = searchParams.get('source') || 'all';

  const [leads, setLeads] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState(urlSource);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState('active');
  const [viewEnrollment, setViewEnrollment] = useState(null);
  const [viewEnrollmentDetail, setViewEnrollmentDetail] = useState(null);
  const [editEnrollment, setEditEnrollment] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [statusModal, setStatusModal] = useState(null);
  const [statusNext, setStatusNext] = useState('confirmed');
  const [statusReason, setStatusReason] = useState('');
  const [archiveModal, setArchiveModal] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [enrollmentBusy, setEnrollmentBusy] = useState(false);

  useEffect(() => {
    const s = searchParams.get('source');
    if (s) {
      setSourceFilter(prev => (s !== prev ? s : prev));
    }
  }, [searchParams]);

  const [convertModalLead, setConvertModalLead] = useState(null);
  const [convertBatchId, setConvertBatchId] = useState('');
  const [convertAmount, setConvertAmount] = useState('');
  const [convertDiscount, setConvertDiscount] = useState('0');
  const [convertSession, setConvertSession] = useState('2025-2026');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModalItem, setDeleteModalItem] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      await LeadService.syncOfflineQueue().catch(() => {});
      const [leadsList, batchesList, enrollmentList] = await Promise.all([
        AdminDataService.getLeads(),
        AdminDataService.getBatches(),
        AdminDataService.getEnrollments().catch(err => {
          setFormError(err.message || 'Enrollment records could not be loaded.');
          return [];
        })
      ]);
      setLeads(leadsList);
      setBatches(batchesList);
      setEnrollments(enrollmentList);
    } catch (err) {
      console.error('Failed to load admission leads:', err);
      setFormError(err.message || 'Admission data could not be loaded from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      const currentAdmin = requireAdminEmail();
      await AdminDataService.updateLeadStatus(leadId, newStatus, currentAdmin);
      setFormSuccess(`Updated inquiry status to '${newStatus}'.`);
      setFormError('');
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to update lead status.');
    }
  };

  const openEnrollmentView = async (enrollment) => {
    setFormError('');
    setViewEnrollmentDetail(null);
    setViewEnrollment(enrollment);
    try {
      const [detail, obligations, payments] = await Promise.all([
        AdminDataService.getEnrollmentById(enrollment.id),
        AdminDataService.getFeeObligations().catch(() => []),
        AdminDataService.getPayments().catch(() => [])
      ]);
      const studentId = detail.studentId || detail.id;
      setViewEnrollmentDetail({
        enrollment: detail,
        obligations: obligations.filter(o => o.studentId === studentId || o.enrollmentId === detail.id),
        payments: payments.filter(p => p.studentId === studentId || p.enrollmentId === detail.id)
      });
    } catch (err) {
      setFormError(err.message || 'Enrollment record could not be loaded.');
      setViewEnrollment(null);
    }
  };

  const openEnrollmentEdit = (enrollment) => {
    setFormError('');
    setEditForm({
      studentName: enrollment.studentName || '',
      parentName: enrollment.parentName || '',
      phone: enrollment.phone || '',
      secondaryPhone: enrollment.secondaryPhone || '',
      grade: enrollment.grade || 'Class 10',
      board: enrollment.board || 'TN State Board (Samacheer)',
      batchId: enrollment.batchId || '',
      schoolName: enrollment.schoolName || '',
      schoolShift: enrollment.schoolShift || '',
      emergencyContactName: enrollment.emergencyContactName || '',
      emergencyPhone: enrollment.emergencyPhone || '',
      medicalAlert: enrollment.medicalAlert || ''
    });
    setEditEnrollment(enrollment);
  };

  const executeEnrollmentAction = async (action) => {
    setEnrollmentBusy(true);
    setFormError('');
    setFormSuccess('');
    try {
      const currentAdmin = requireAdminEmail();
      const message = await action(currentAdmin);
      setFormSuccess(message);
      setEditEnrollment(null);
      setViewEnrollment(null);
      setViewEnrollmentDetail(null);
      setStatusModal(null);
      setArchiveModal(null);
      setStatusReason('');
      setArchiveReason('');
      await loadData();
    } catch (err) {
      setFormError(err.message || 'The operation failed. Nothing was changed.');
    } finally {
      setEnrollmentBusy(false);
    }
  };

  const submitEnrollmentEdit = async (e) => {
    e.preventDefault();
    await executeEnrollmentAction(async (currentAdmin) => {
      const result = await AdminDataService.updateEnrollment(editEnrollment.id, editForm, currentAdmin);
      return `Enrollment ${editEnrollment.id} updated and synced to student record${result.batchChangeNotice ? ` — ${result.batchChangeNotice}` : ''}.`;
    });
  };

  const submitStatusChange = async (e) => {
    e.preventDefault();
    await executeEnrollmentAction(async (currentAdmin) => {
      const result = await AdminDataService.updateEnrollmentStatus(statusModal.id, statusNext, { reason: statusReason }, currentAdmin);
      const warningSuffix = result.warnings.length > 0 ? ` Warnings: ${result.warnings.join(' ')}` : '';
      return `Enrollment ${statusModal.id} changed from '${result.from}' to '${result.to}'.${warningSuffix}`;
    });
  };

  const submitArchive = async (e) => {
    e.preventDefault();
    await executeEnrollmentAction(async (currentAdmin) => {
      const result = await AdminDataService.archiveEnrollment(archiveModal.id, archiveReason, currentAdmin);
      const warningSuffix = result.warnings.length > 0 ? ` Warnings: ${result.warnings.join(' ')}` : '';
      return `Enrollment ${archiveModal.id} archived and removed from the active list. Financial history preserved.${warningSuffix}`;
    });
  };

  const confirmDeleteRecord = async (e) => {
    e.preventDefault();
    if (!deleteModalItem) return;
    setEnrollmentBusy(true);
    setFormError('');
    setFormSuccess('');
    try {
      const currentAdmin = requireAdminEmail();
      if (deleteModalItem.type === 'enrollment') {
        await AdminDataService.deleteEnrollment(deleteModalItem.id, currentAdmin);
        setFormSuccess(`Enrollment record '${deleteModalItem.id}' permanently deleted.`);
      } else {
        await AdminDataService.deleteLead(deleteModalItem.id, currentAdmin);
        setFormSuccess(`Inquiry lead '${deleteModalItem.id}' permanently deleted.`);
      }
      setDeleteModalItem(null);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Deletion failed. Nothing was changed.');
    } finally {
      setEnrollmentBusy(false);
    }
  };

  const handleOpenConvert = (lead) => {
    setConvertModalLead(lead);
    const matchedBatch = batches.find(b => b.id === lead.batchId) ||
      batches.find(b => b.grade === lead.grade) ||
      batches[0];
    setConvertBatchId(matchedBatch?.id || '');
    setConvertAmount(matchedBatch?.monthlyFee || 2200);
    setConvertDiscount('0');
    setConvertSession('2025-2026');
    setFormError('');
  };

  const handleExecuteConvert = async (e) => {
    e.preventDefault();
    if (!convertBatchId) {
      setFormError('Please select a target batch.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const currentAdmin = requireAdminEmail();
      await AdminDataService.convertLeadToStudent(
        convertModalLead,
        {
          batchId: convertBatchId,
          amountPerCycle: Number(convertAmount) || 2200,
          discountAdjustment: Number(convertDiscount) || 0,
          academicSession: convertSession
        },
        currentAdmin
      );
      setFormSuccess(`Successfully converted ${convertModalLead.studentName} into registered student roster!`);
      setConvertModalLead(null);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Conversion failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const metrics = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter(l => !l.status || l.status === 'new').length;
    const contacted = leads.filter(l => l.status === 'contacted').length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, newCount, contacted, converted, conversionRate };
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const status = lead.status || 'new';
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      const source = lead.source || (lead.reservationId ? 'enrollment' : 'inquiry');
      if (sourceFilter !== 'all' && source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = lead.studentName?.toLowerCase().includes(q);
        const matchesParent = lead.parentName?.toLowerCase().includes(q);
        const matchesPhone = lead.phone?.includes(q);
        const matchesGrade = lead.grade?.toLowerCase().includes(q);
        const matchesNotes = lead.notes?.toLowerCase().includes(q);
        return matchesName || matchesParent || matchesPhone || matchesGrade || matchesNotes;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, search]);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment) => {
      const status = normalizeEnrollmentStatus(enrollment.status);
      if (enrollmentStatusFilter === 'active') {
        if (status !== 'pending' && status !== 'confirmed' && status !== 'waitlisted') return false;
      } else if (enrollmentStatusFilter !== 'all' && status !== enrollmentStatusFilter) {
        return false;
      }
      if (enrollmentSearch) {
        const q = enrollmentSearch.toLowerCase();
        return (
          (enrollment.id || '').toLowerCase().includes(q) ||
          (enrollment.studentName || '').toLowerCase().includes(q) ||
          (enrollment.parentName || '').toLowerCase().includes(q) ||
          (enrollment.phone || '').includes(q) ||
          (enrollment.studentId || '').toLowerCase().includes(q) ||
          (enrollment.batchName || enrollment.batchId || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrollments, enrollmentStatusFilter, enrollmentSearch]);

  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status = 'new') => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span>New Admission</span>
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Phone className="w-3 h-3 text-blue-500" />
            <span>Contacted</span>
          </span>
        );
      case 'converted':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Enrolled Student</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="w-3 h-3 text-slate-400" />
            <span>Archived</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Enrollments & Admission Inquiries</h1>
          <p className="text-sm text-slate-500 mt-1">
            Completed enrollment forms (manageable records) plus prospective admissions from the 5-step funnel & website inquiries.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-xs hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Leads</span>
          </button>
        </div>
      </div>

      {formSuccess && (
        <div role="status" aria-live="polite" className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{formSuccess}</span>
          <button type="button" onClick={() => setFormSuccess('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {formError && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800 flex items-center justify-between">
          <span>{formError}</span>
          <button type="button" onClick={() => setFormError('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Inquiries</span>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{metrics.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-orange-600">New / Uncontacted</span>
          <div className="text-2xl font-black text-brand mt-1">{metrics.newCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-blue-600">Counselor Contacted</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{metrics.contacted}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-600">Enrolled ({metrics.conversionRate}%)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{metrics.converted}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-extrabold text-[#0F172A] flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-brand" />
              <span>Enrollment Records (Admission Funnel)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                {enrollments.length} Total
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Every completed enrollment form with its admission ID, batch, fee and payment status — view, edit, re-status, archive.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={enrollmentSearch}
              onChange={(e) => setEnrollmentSearch(e.target.value)}
              placeholder="Search enrollment, student, phone..."
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand md:w-64"
            />
            <select
              value={enrollmentStatusFilter}
              onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-700"
            >
              <option value="active">Active (pending + confirmed)</option>
              <option value="all">All Statuses</option>
              {ENROLLMENT_STATUSES.map(s => (
                <option key={s} value={s}>{ENROLLMENT_STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-brand" />
            Loading enrollment records...
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="py-10 text-center">
            <ClipboardList className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-semibold">No enrollment records match the current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Enrollment ID</th>
                  <th className="py-3 px-4">Student & Guardian</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Admission ID</th>
                  <th className="py-3 px-4">Enrolled On</th>
                  <th className="py-3 px-4">Fee / Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredEnrollments.map((enrollment) => (
                  <tr 
                    key={enrollment.id} 
                    onClick={() => openEnrollmentView(enrollment)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openEnrollmentView(enrollment);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View enrollment details for ${enrollment.studentName}`}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer focus:outline-none focus:bg-orange-50/50"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-brand text-[11px]">{enrollment.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0F172A]">{enrollment.studentName}</div>
                      <div className="text-[11px] text-slate-500">
                        {enrollment.parentName || 'Parent'} • {formatPhoneNumber(enrollment.phone)}
                      </div>
                      <div className="text-[11px] text-slate-500">{enrollment.grade} • {enrollment.board}</div>
                    </td>
                    <td className="py-3 px-4 max-w-[180px]">
                      <div className="font-semibold text-slate-900 truncate">
                        {enrollment.batchName || enrollment.selectedBatchName || enrollment.batchId || 'Not assigned'}
                      </div>
                      {enrollment.timing && (
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{enrollment.timing}</span>
                        </div>
                      )}
                      {enrollment.reservationId && (
                        <div className="text-[10px] text-orange-600 font-mono font-bold">Seat: {enrollment.reservationId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700">
                      {enrollment.studentId || enrollment.id}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {enrollment.enrolledAt ? String(enrollment.enrolledAt).split('T')[0] : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] font-bold text-slate-900">
                        ₹{Number(enrollment.monthlyFee || batches.find(b => b.id === enrollment.batchId)?.monthlyFee || 2200).toLocaleString('en-IN')}/mo
                      </div>
                      <div className="text-[11px] mt-0.5 font-medium">
                        <span className="text-slate-500">Payment: </span>
                        <span className={
                          enrollment.paymentStatus === 'paid'
                            ? 'font-semibold text-emerald-700 capitalize'
                            : enrollment.paymentStatus === 'partial'
                            ? 'font-semibold text-amber-700 capitalize'
                            : 'font-semibold text-slate-700 capitalize'
                        }>
                          {enrollment.paymentStatus && enrollment.paymentStatus !== 'unknown'
                            ? String(enrollment.paymentStatus)
                            : 'Unpaid'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {enrollmentStatusBadge(enrollment.status, enrollment.reservationId)}
                      {enrollment.statusReason && (
                        <div className="text-[10px] text-slate-400 mt-0.5 max-w-[140px] truncate" title={enrollment.statusReason}>
                          {enrollment.statusReason}
                        </div>
                      )}
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-none text-[9px] font-bold border ${
                          enrollment._storageOrigin === 'cloud'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {enrollment._storageOrigin === 'cloud' ? 'Cloud Synced (Firestore)' : 'Local Storage / Queue'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEnrollmentEdit(enrollment);
                          }}
                          className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[11px] inline-flex items-center space-x-1 cursor-pointer"
                          title="Edit enrollment details"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusModal(enrollment);
                            setStatusNext(normalizeEnrollmentStatus(enrollment.status) === 'confirmed' ? 'pending' : 'confirmed');
                            setStatusReason('');
                            setFormError('');
                          }}
                          className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-[11px] inline-flex items-center space-x-1 cursor-pointer"
                          title="Change enrollment status"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Status</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setArchiveModal(enrollment);
                            setArchiveReason('');
                            setFormError('');
                          }}
                          className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[11px] inline-flex items-center space-x-1 cursor-pointer"
                          title="Archive enrollment (keeps financial history)"
                        >
                          <Archive className="w-3 h-3" />
                          <span>Archive</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModalItem({ id: enrollment.id, name: enrollment.studentName, type: 'enrollment' });
                            setFormError('');
                          }}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded text-[11px] inline-flex items-center space-x-1 cursor-pointer"
                          title="Permanently delete this enrollment record"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search by student, parent, mobile, batch..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Inquiries</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Enrolled Student</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="all">All Channels</option>
            <option value="enrollment">Online Admission Funnel</option>
            <option value="inquiry">Campus Inquiries</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-brand" />
            Loading admissions inquiries...
          </div>
        ) : paginatedLeads.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No admission inquiries found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student & Guardian</th>
                  <th className="py-3.5 px-4">Academic Level</th>
                  <th className="py-3.5 px-4">Selected Batch</th>
                  <th className="py-3.5 px-4">Status & Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedLeads.map((lead) => {
                  const rawPhone = lead.phone || '';
                  const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
                  const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${lead.parentName || 'Parent'}, this is Focus Academy regarding admission for ${lead.studentName}. How can we assist you today?`
                  )}`;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A] text-sm">{lead.studentName}</div>
                        <div className="text-slate-500 mt-0.5">
                          Parent: <span className="font-semibold text-slate-700">{lead.parentName || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <a
                            href={`tel:+91${cleanPhone}`}
                            className="inline-flex items-center space-x-1 text-brand hover:underline font-semibold"
                          >
                            <Phone className="w-3 h-3" />
                            <span>+91 {cleanPhone}</span>
                          </a>
                          <span className="text-slate-300">•</span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-emerald-600 hover:underline font-semibold"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-500" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-bold">
                          {lead.grade}
                        </span>
                        <div className="text-slate-500 text-[11px] mt-1">{lead.board || 'State Board'}</div>
                        {lead.schoolShift && (
                          <div className="text-[11px] text-slate-600 font-semibold mt-1">
                            Shift: {lead.schoolShift}
                          </div>
                        )}
                        {(lead.schoolDismissalTime || (lead.travelDurationMinutes !== null && lead.travelDurationMinutes !== undefined)) && (
                          <div className="text-[10px] text-slate-500">
                            {lead.schoolDismissalTime ? `Finishes: ${formatTime12(lead.schoolDismissalTime)}` : ''}
                            {lead.schoolDismissalTime && (lead.travelDurationMinutes !== null && lead.travelDurationMinutes !== undefined) ? ' • ' : ''}
                            {lead.travelDurationMinutes !== null && lead.travelDurationMinutes !== undefined ? `Travel: ${lead.travelDurationMinutes}m` : ''}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">
                          {lead.subjects || lead.batchId || 'Evening Foundation'}
                        </div>
                        {lead.timing && (
                          <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{lead.timing}</span>
                          </div>
                        )}
                        {lead.scheduleClashWarning && (
                          <div className="mt-1 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span title={lead.scheduleClashWarning}>Timing Risk</span>
                          </div>
                        )}
                        {lead.reservationId && (
                          <div className="text-[10px] text-orange-600 font-mono mt-0.5 font-bold">
                            Seat Hold: {lead.reservationId}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div>{getStatusBadge(lead.status)}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {lead.timestamp ? new Date(lead.timestamp).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'Recent'}
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-none text-[9px] font-bold border ${
                            lead._storageOrigin === 'cloud'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}>
                            {lead._storageOrigin === 'cloud' ? 'Cloud Synced (Firestore)' : 'Local Device Store'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {(() => {
                            const linkedEnrollment = (lead.source === 'enrollment' || lead.reservationId)
                              ? enrollments.find(e => e.id === lead.id)
                              : null;
                            const alreadyRegistered = Boolean(lead.studentId || (linkedEnrollment && linkedEnrollment.studentId)) || lead.status === 'converted';
                            return (
                              <>
                                {!alreadyRegistered && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenConvert(lead)}
                                    className="px-2.5 py-1.5 bg-brand hover:bg-brand-strong text-white font-bold rounded text-xs shadow-2xs inline-flex items-center space-x-1 cursor-pointer"
                                    title="Register student and issue fee obligation"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Register</span>
                                  </button>
                                )}
                                {linkedEnrollment && (
                                  <button
                                    type="button"
                                    onClick={() => openEnrollmentView(linkedEnrollment)}
                                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs inline-flex items-center space-x-1 cursor-pointer"
                                    title="View the completed enrollment record"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Enrollment</span>
                                  </button>
                                )}
                              </>
                            );
                          })()}

                          {lead.status === 'new' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(lead.id, 'contacted')}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer"
                              title="Mark as contacted"
                            >
                              Mark Contacted
                            </button>
                          )}

                          {lead.status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(lead.id, 'archived')}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                              title="Archive lead"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModalItem({ id: lead.id, name: lead.studentName, type: 'lead' });
                              setFormError('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Permanently delete this inquiry lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex space-x-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {convertModalLead && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Convert Lead to Enrolled Student</h2>
                <p className="text-xs text-slate-500">Student: {convertModalLead.studentName} ({convertModalLead.grade})</p>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalLead(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteConvert} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Evening Batch</label>
                <select
                  value={convertBatchId}
                  onChange={(e) => {
                    setConvertBatchId(e.target.value);
                    const b = batches.find(item => item.id === e.target.value);
                    if (b) setConvertAmount(b.monthlyFee);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800"
                  required
                >
                  <option value="">Select Classroom Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.timing}) — {b.seatsRemaining ?? 12} Seats Left
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Tuition Fee (₹)</label>
                  <input
                    type="number"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount / Concession (₹)</label>
                  <input
                    type="number"
                    value={convertDiscount}
                    onChange={(e) => setConvertDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Session</label>
                <select
                  value={convertSession}
                  onChange={(e) => setConvertSession(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600">
                <span className="font-bold text-slate-800">Enrollment Actions Triggered:</span>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                  <li>Creates official student record in <span className="font-mono">students</span> collection.</li>
                  <li>Generates initial monthly fee obligation atomically.</li>
                  <li>Marks prospective lead as <span className="font-mono text-emerald-700">converted</span>.</li>
                  <li>Releases seat hold to <span className="font-mono text-blue-700">enrolled</span> to prevent capacity double-counting.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertModalLead(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewEnrollment && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 text-left animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Enrollment Record: {viewEnrollment.id}</h2>
                <p className="text-xs text-slate-500">Complete enrollment details, fees and payments</p>
              </div>
              <button type="button" onClick={() => { setViewEnrollment(null); setViewEnrollmentDetail(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!viewEnrollmentDetail ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-brand" />
                Loading enrollment record...
              </div>
            ) : (() => {
              const detail = viewEnrollmentDetail.enrollment;
              const totalDue = viewEnrollmentDetail.obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
              const totalPaid = viewEnrollmentDetail.payments.filter(p => !p.isReversed && !p.reversed)
                .reduce((sum, p) => sum + Number(p.amount || 0), 0);
              const totalWaived = viewEnrollmentDetail.obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
              return (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Enrollment status', normalizeEnrollmentStatus(detail.status)],
                      ['Admission ID', detail.studentId || 'Not registered yet'],
                      ['Enrolled on', detail.enrolledAt ? String(detail.enrolledAt).split('T')[0] : '—'],
                      ['Seat hold', detail.reservationId || 'None']
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
                        <div className="font-bold text-slate-800 mt-0.5 break-words">{String(value)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                    <div className="px-4 py-2.5 bg-slate-50 font-bold text-slate-700">Student & contact details</div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p><span className="text-slate-500">Student:</span> <strong>{detail.studentName}</strong></p>
                      <p><span className="text-slate-500">Guardian:</span> <strong>{detail.parentName || '—'}</strong></p>
                      <p><span className="text-slate-500">Phone:</span> +91 {detail.phone}</p>
                      <p><span className="text-slate-500">Alternate:</span> {detail.secondaryPhone ? `+91 ${detail.secondaryPhone}` : '—'}</p>
                      <p><span className="text-slate-500">Grade / Board:</span> <strong>{detail.grade} • {detail.board}</strong></p>
                      <p><span className="text-slate-500">Batch:</span> <strong>{detail.batchName || detail.batchId || '—'}</strong></p>
                      <p><span className="text-slate-500">Timing:</span> {detail.timing || '—'}</p>
                      <p><span className="text-slate-500">School:</span> {detail.schoolName || '—'}</p>
                      <p><span className="text-slate-500">School shift:</span> {detail.schoolShift || '—'}</p>
                      <p><span className="text-slate-500">Emergency:</span> {detail.emergencyContactName ? `${detail.emergencyContactName} (${detail.emergencyRelationship || '—'}) ${detail.emergencyPhone ? `+91 ${detail.emergencyPhone}` : ''}` : '—'}</p>
                      <p><span className="text-slate-500">Medical alert:</span> {detail.medicalAlert || 'None'}</p>
                      <p><span className="text-slate-500">Student UID:</span> {detail.studentUid || 'Not linked'}</p>
                    </div>
                    {detail.notes && (
                      <div className="px-4 py-2.5 border-t border-slate-100 text-slate-600"><span className="font-bold">Submitted notes:</span> {detail.notes}</div>
                    )}
                    {detail.reviewReason && (
                      <div className="px-4 py-2.5 border-t border-slate-100 text-amber-800 bg-amber-50"><span className="font-bold">Review needed:</span> {detail.reviewReason}</div>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                    <div className="px-4 py-2.5 bg-slate-50 font-bold text-slate-700">Fees & payments</div>
                    <div className="p-4 space-y-2">
                      <div className="flex flex-wrap gap-4">
                        <span>Fee status: <strong className="capitalize">{String(detail.feeStatus || 'pending').replace('_', ' ')}</strong></span>
                        <span>Payment status: <strong className="capitalize">{detail.paymentStatus || 'unpaid'}</strong></span>
                        {detail.monthlyFee && <span>Tuition rate: <strong>₹{Number(detail.monthlyFee).toLocaleString('en-IN')}/mo</strong></span>}
                        <span>Billed: <strong>₹{totalDue.toLocaleString('en-IN')}</strong></span>
                        <span>Paid: <strong>₹{totalPaid.toLocaleString('en-IN')}</strong></span>
                        <span>Balance: <strong>₹{Math.max(0, totalDue - totalPaid - totalWaived).toLocaleString('en-IN')}</strong></span>
                      </div>
                      {viewEnrollmentDetail.obligations.length > 0 && (
                        <ul className="space-y-1 text-[11px]">
                          {viewEnrollmentDetail.obligations.map(o => (
                            <li key={o.id} className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="font-mono">{o.id} • {o.billingCycle} • due {o.dueDate}</span>
                              <span>₹{Number(o.amountDue || 0).toLocaleString('en-IN')} (₹{Number(o.amountPaid || 0).toLocaleString('en-IN')} paid) — {o.status}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {viewEnrollmentDetail.payments.length > 0 && (
                        <ul className="space-y-1 text-[11px]">
                          {viewEnrollmentDetail.payments.map(p => (
                            <li key={p.id} className="flex justify-between border-b border-slate-100 pb-1">
                              <span className="font-mono">{p.receiptNumber} • {p.id}</span>
                              <span>₹{Number(p.amount || 0).toLocaleString('en-IN')} • {String(p.paymentMethod || '').replace('_', ' ')} • {p.paymentDate} • {p.isReversed || p.reversed ? 'reversed' : 'verified'}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {viewEnrollmentDetail.obligations.length === 0 && viewEnrollmentDetail.payments.length === 0 && (
                        <p className="text-slate-400">No fee obligation or payment has been generated for this enrollment yet.</p>
                      )}
                      <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded p-2">
                        No payment gateway is connected to the enrollment form, so fees stay unpaid until an administrator records a verified transaction in Ledger &amp; Payments.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => { setViewEnrollment(null); setViewEnrollmentDetail(null); }} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Close</button>
                    <button type="button" onClick={() => { const e = viewEnrollment; setViewEnrollment(null); setViewEnrollmentDetail(null); openEnrollmentEdit(e); }} className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-lg font-bold cursor-pointer">Edit Enrollment</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {editEnrollment && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 text-left animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Edit Enrollment</h2>
                <p className="text-xs text-slate-500">{editEnrollment.id} — changes are saved to Firestore and synced to the student roster</p>
              </div>
              <button type="button" onClick={() => setEditEnrollment(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitEnrollmentEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Student name *</span>
                  <input type="text" required minLength={2} value={editForm.studentName} onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Guardian / parent name</span>
                  <input type="text" value={editForm.parentName} onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Mobile number *</span>
                  <input type="tel" required value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Alternate number</span>
                  <input type="tel" value={editForm.secondaryPhone} onChange={(e) => setEditForm({ ...editForm, secondaryPhone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Grade *</span>
                  <select required value={editForm.grade} onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Classes 6 to 8'].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Board *</span>
                  <select required value={editForm.board} onChange={(e) => setEditForm({ ...editForm, board: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {['TN State Board (Samacheer)', 'TN State Board, CBSE & ISC', 'CBSE', 'ICSE'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
                <label className="block col-span-2">
                  <span className="block font-semibold text-slate-700 mb-1">Batch</span>
                  <select value={editForm.batchId} onChange={(e) => setEditForm({ ...editForm, batchId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <option value="">Keep current batch</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.timing})</option>)}
                  </select>
                  <span className="text-[10px] text-slate-500">Changing the batch performs an audited batch transfer on the student record.</span>
                </label>
                <label className="block col-span-2">
                  <span className="block font-semibold text-slate-700 mb-1">School name</span>
                  <input type="text" value={editForm.schoolName} onChange={(e) => setEditForm({ ...editForm, schoolName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">School shift</span>
                  <input type="text" value={editForm.schoolShift} onChange={(e) => setEditForm({ ...editForm, schoolShift: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Emergency contact</span>
                  <input type="text" value={editForm.emergencyContactName} onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Emergency phone</span>
                  <input type="tel" value={editForm.emergencyPhone} onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
                <label className="block">
                  <span className="block font-semibold text-slate-700 mb-1">Medical alert</span>
                  <input type="text" value={editForm.medicalAlert} onChange={(e) => setEditForm({ ...editForm, medicalAlert: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setEditEnrollment(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={enrollmentBusy} className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-lg font-bold cursor-pointer disabled:opacity-50">
                  {enrollmentBusy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusModal && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Change Enrollment Status</h2>
                <p className="text-xs text-slate-500">{statusModal.id} — {statusModal.studentName}</p>
              </div>
              <button type="button" onClick={() => setStatusModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitStatusChange} className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600">
                Current status: <strong>{ENROLLMENT_STATUS_META[normalizeEnrollmentStatus(statusModal.status)].label}</strong>
                {statusModal.studentId ? <span> • registered as <strong>{statusModal.studentId}</strong></span> : <span> • not yet registered as a student</span>}
              </div>
              <label className="block">
                <span className="block font-semibold text-slate-700 mb-1">New status</span>
                <select value={statusNext} onChange={(e) => setStatusNext(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold">
                  {ENROLLMENT_STATUSES.map(s => (
                    <option key={s} value={s} disabled={s === normalizeEnrollmentStatus(statusModal.status)}>
                      {ENROLLMENT_STATUS_META[s].label}{s === normalizeEnrollmentStatus(statusModal.status) ? ' (current)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              {statusNext === 'confirmed' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-lg text-[11px] space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Confirming this enrollment will:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    <li>Officially register student in the active <strong>Students Roster</strong>.</li>
                    <li>Generate initial monthly fee obligation (<strong>₹{statusModal.monthlyFee ? Number(statusModal.monthlyFee).toLocaleString('en-IN') : '1,800'}</strong>) in Ledger &amp; Invoices.</li>
                    <li>Update classroom batch seat occupancy.</li>
                  </ul>
                </div>
              )}
              <label className="block">
                <span className="block font-semibold text-slate-700 mb-1">Reason (required for cancel / archive)</span>
                <textarea value={statusReason} onChange={(e) => setStatusReason(e.target.value)} rows={3} placeholder="e.g. Duplicate application, guardian requested cancellation" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </label>
              <p className="text-[11px] text-slate-500">
                Valid transitions only: pending → confirmed/waitlisted/cancelled/archived; waitlisted → confirmed/cancelled/archived; confirmed → cancelled/archived.
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setStatusModal(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={enrollmentBusy} className="px-4 py-2 bg-brand hover:bg-brand-strong text-white rounded-lg font-bold cursor-pointer disabled:opacity-50">
                  {enrollmentBusy ? 'Applying...' : 'Apply Status Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {archiveModal && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Archive Enrollment</h2>
                <p className="text-xs text-slate-500">{archiveModal.id} — {archiveModal.studentName}</p>
              </div>
              <button type="button" onClick={() => setArchiveModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitArchive} className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                Archiving removes this enrollment from the active list only. The student record, fee obligations and payment receipts are preserved for audit — nothing is deleted.
                {archiveModal.paymentStatus && archiveModal.paymentStatus !== 'unpaid' ? ` Current payment status: ${archiveModal.paymentStatus}.` : ''}
              </div>
              <label className="block">
                <span className="block font-semibold text-slate-700 mb-1">Archive reason * (min 5 characters)</span>
                <textarea required minLength={5} value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} rows={3} placeholder="e.g. Duplicate application created by a second form submission" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg" />
              </label>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setArchiveModal(null)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={enrollmentBusy} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer disabled:opacity-50">
                  {enrollmentBusy ? 'Archiving...' : 'Confirm Archive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalItem && (
        <div className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-rose-700 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Permanently Delete {deleteModalItem.type === 'enrollment' ? 'Enrollment Record' : 'Inquiry Lead'}</span>
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{deleteModalItem.id}</p>
              </div>
              <button type="button" onClick={() => setDeleteModalItem(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={confirmDeleteRecord} className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 leading-relaxed">
                Are you sure you want to permanently delete <strong>{deleteModalItem.name}</strong> ({deleteModalItem.id})?
                <br /><br />
                This record will be permanently purged from Cloud Firestore database and local storage. This action cannot be undone.
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollmentBusy}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{enrollmentBusy ? 'Deleting...' : 'Permanently Delete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
