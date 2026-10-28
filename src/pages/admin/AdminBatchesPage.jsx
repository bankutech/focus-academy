import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Users, 
  Clock, 
  MapPin, 
  Edit3, 
  Trash2, 
  Archive, 
  AlertCircle, 
  CheckCircle2, 
  X,
  IndianRupee
} from 'lucide-react';
import { AdminDataService } from '../../services/adminDataService';

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [boardFilter, setBoardFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [viewStudentsBatch, setViewStudentsBatch] = useState(null);
  const [deleteConfirmBatch, setDeleteConfirmBatch] = useState(null);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    grade: 'Class 10',
    board: 'TN State Board (Samacheer)',
    academicSession: '2025-2026',
    timing: '6:00 PM – 7:30 PM',
    days: 'Monday – Saturday',
    monthlyFee: 2200,
    classroom: 'Lecture Hall 101, First Floor, Thiripura Complex',
    description: ''
  });

  const loadData = async () => {
    try {
      const [b, s] = await Promise.all([
        AdminDataService.getBatches(),
        AdminDataService.getStudents()
      ]);
      setBatches(b);
      setStudents(s);
    } catch (err) {
      console.error('Error loading batches:', err);
      setFormError(err.message || 'Batch data could not be loaded from the database.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      id: '',
      name: '',
      grade: 'Class 10',
      board: 'TN State Board (Samacheer)',
      academicSession: '2025-2026',
      timing: '6:00 PM – 7:30 PM',
      days: 'Monday – Saturday',
      monthlyFee: 2200,
      capacity: 12,
      classroom: 'Lecture Hall 101, First Floor, Thiripura Complex',
      description: ''
    });
    setFormError('');
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditBatch(batch);
    setFormData({
      id: batch.id,
      name: batch.name,
      grade: batch.grade,
      board: batch.board,
      academicSession: batch.academicSession || '2025-2026',
      timing: batch.timing,
      days: batch.days,
      monthlyFee: batch.monthlyFee,
      capacity: batch.capacity || 12,
      classroom: batch.classroom,
      description: batch.description || ''
    });
    setFormError('');
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim()) {
      setFormError('Batch name is required.');
      return;
    }
    if (!formData.monthlyFee || Number(formData.monthlyFee) <= 0) {
      setFormError('Please enter a valid monthly fee amount.');
      return;
    }

    try {
      if (editBatch) {
        await AdminDataService.updateBatch(editBatch.id, formData);
        setFormSuccess(`Batch '${formData.name}' updated successfully.`);
        setEditBatch(null);
      } else {
        await AdminDataService.createBatch(formData);
        setFormSuccess(`Batch '${formData.name}' created successfully with ${formData.capacity || 12}-seat capacity.`);
        setCreateModalOpen(false);
      }
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleDeleteBatch = async (batchId) => {
    setFormError('');
    setFormSuccess('');
    try {
      await AdminDataService.deleteBatch(batchId);
      setDeleteConfirmBatch(null);
      setFormSuccess('Batch deleted safely.');
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Delete operation rejected.');
    }
  };

  const handleArchiveBatch = async (batchId) => {
    try {
      await AdminDataService.archiveBatch(batchId);
      setFormSuccess('Batch moved to archive.');
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Archive operation failed.');
    }
  };

  const filteredBatches = batches.filter((b) => {
    if (gradeFilter !== 'all' && !b.grade.toLowerCase().includes(gradeFilter.toLowerCase())) {
      return false;
    }
    if (boardFilter !== 'all' && !b.board.toLowerCase().includes(boardFilter.toLowerCase())) {
      return false;
    }
    if (statusFilter === 'archived' && !b.isArchived) return false;
    if (statusFilter === 'active' && b.isArchived) return false;
    if (statusFilter === 'full' && b.enrolledCount < (Number(b.capacity) || 12)) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.grade.toLowerCase().includes(q) ||
        b.board.toLowerCase().includes(q) ||
        b.classroom.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Batch Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure small batches strictly capped at 12 seats with classroom scheduling
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand hover:bg-brand-strong text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Batch</span>
        </button>
      </div>

      {formSuccess && (
        <div role="status" aria-live="polite" className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md text-emerald-800 text-xs flex items-center justify-between">
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
        <div role="alert" className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-800 text-xs flex items-center justify-between">
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
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batches by name, grade, or classroom..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand"
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active Batches</option>
            <option value="full">Full (12 Seats)</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredBatches.map((batch) => {
          const batchCap = Number(batch.capacity) || 12;
          const isFull = batch.enrolledCount >= batchCap;
          const assignedStudents = students.filter(s => s.batchId === batch.id && s.status !== 'archived');
          const pct = Math.round((batch.enrolledCount / batchCap) * 100);

          return (
            <div
              key={batch.id}
              className={`bg-white rounded-xl border ${
                batch.isArchived ? 'border-slate-300 opacity-70' : isFull ? 'border-red-200' : 'border-slate-200'
              } p-5 shadow-xs flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {batch.grade} • {batch.board}
                    </span>
                    <h2 className="text-base font-extrabold text-[#0F172A] mt-2 leading-snug">
                      {batch.name}
                    </h2>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ${
                      batch.isArchived
                        ? 'bg-slate-200 text-slate-700'
                        : isFull
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {batch.isArchived ? 'Archived' : isFull ? 'Batch Full' : `${batchCap - batch.enrolledCount} Seats Left`}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 my-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>{batch.timing} ({batch.days})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{batch.classroom}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-[#0F172A]">₹{Number(batch.monthlyFee).toLocaleString('en-IN')}/month</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 my-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Classroom Capacity</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {batch.enrolledCount} / {batchCap} Seats ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-red-500' : pct >= 75 ? 'bg-orange-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewStudentsBatch(batch)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Enrolled ({assignedStudents.length})</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(batch)}
                    className="p-1.5 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Edit Batch"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {!batch.isArchived && (
                    <button
                      type="button"
                      onClick={() => handleArchiveBatch(batch.id)}
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                      title="Archive Batch"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmBatch(batch)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(createModalOpen || editBatch) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-base font-extrabold text-[#0F172A]">
                {editBatch ? `Edit Batch: ${editBatch.name}` : 'Create New Batch'}
              </h2>
              <button
                onClick={() => { setCreateModalOpen(false); setEditBatch(null); }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Class 10 State Board - Prime Evening Batch"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade / Class *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
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
                  <label className="block font-bold text-slate-700 mb-1">Board *</label>
                  <select
                    value={formData.board}
                    onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="TN State Board (Samacheer)">TN State Board (Samacheer)</option>
                    <option value="CBSE Board">CBSE Board</option>
                    <option value="ICSE Board">ICSE Board</option>
                    <option value="TN State Board, CBSE & ISC">All Boards Combined</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Timings *</label>
                  <input
                    type="text"
                    value={formData.timing}
                    onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                    placeholder="6:00 PM – 7:30 PM"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Fee (₹) *</label>
                  <input
                    type="number"
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Capacity (Seats)</label>
                  <input
                    type="number"
                    min="6"
                    max="30"
                    value={formData.capacity ?? 12}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 12 })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classroom Location</label>
                  <input
                    type="text"
                    value={formData.classroom}
                    onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                    placeholder="Lecture Hall 101, First Floor, Thiripura Complex"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-orange-900 text-[11px] leading-snug">
                <span className="font-bold">Campus Policy Guard:</span> Default capacity is 12 seats to maintain personalized attention at Thiripura Complex (configurable between 6 and 30).
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => { setCreateModalOpen(false); setEditBatch(null); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-strong text-white font-bold rounded-lg cursor-pointer"
                >
                  {editBatch ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewStudentsBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#0F172A]">
                  Enrolled Students: {viewStudentsBatch.name}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {students.filter(s => s.batchId === viewStudentsBatch.id && s.status !== 'archived').length} / {viewStudentsBatch.capacity || 12} Seats Occupied
                </p>
              </div>
              <button onClick={() => setViewStudentsBatch(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
              {students.filter(s => s.batchId === viewStudentsBatch.id && s.status !== 'archived').length > 0 ? (
                students
                  .filter(s => s.batchId === viewStudentsBatch.id && s.status !== 'archived')
                  .map((s) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#0F172A]">{s.studentName}</p>
                        <p className="text-[11px] text-slate-500">ID: {s.id} • Guardian: {s.guardianPhone}</p>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                        {s.grade}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="py-6 text-center text-slate-400">
                  No students currently enrolled in this batch.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setViewStudentsBatch(null)}
                className="px-4 py-1.5 bg-[#0F172A] text-white text-xs font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-[#0F172A] text-center mb-1">
              Delete Batch Confirmation
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4">
              Are you sure you want to permanently delete batch <span className="font-bold">'{deleteConfirmBatch.name}'</span>?
            </p>

            {students.filter(s => s.batchId === deleteConfirmBatch.id && s.status !== 'archived').length > 0 ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs mb-4">
                <span className="font-bold">Deletion Blocked:</span> This batch has {students.filter(s => s.batchId === deleteConfirmBatch.id && s.status !== 'archived').length} active enrolled student(s). Reassign students before deleting, or use Archival instead.
              </div>
            ) : null}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBatch(null)}
                className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBatch(deleteConfirmBatch.id)}
                disabled={students.filter(s => s.batchId === deleteConfirmBatch.id && s.status !== 'archived').length > 0}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Delete Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
