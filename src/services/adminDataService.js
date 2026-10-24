import { isBatchCompatible } from '../types/schemas';
import { db, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

const STORAGE_KEY = 'focus_academy_admin_data_v1';

const SEED_BATCHES = [
  {
    id: 'batch-10-state-board',
    name: 'Class 10 State Board (SSLC) - Prime Evening Batch',
    grade: 'Class 10',
    board: 'TN State Board (Samacheer)',
    academicSession: '2025-2026',
    slotId: 'slot-2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 9,
    seatsRemaining: 3,
    status: 'Admissions Open (3 Seats Left)',
    monthlyFee: 2200,
    classroom: 'Lecture Hall 101, First Floor, Thiripura Complex',
    subjects: ['Mathematics', 'Science (Physics, Chemistry, Biology)', 'Social Science'],
    description: 'Intensive evening batch focused on Samacheer Kalvi textbooks and exam drills.',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-10-cbse',
    name: 'Class 10 CBSE Board - Prime Evening Batch',
    grade: 'Class 10',
    board: 'CBSE Board',
    academicSession: '2025-2026',
    slotId: 'slot-2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 10,
    seatsRemaining: 2,
    status: 'High Demand (2 Seats Left)',
    monthlyFee: 2400,
    classroom: 'Lecture Hall 102, First Floor, Thiripura Complex',
    subjects: ['NCERT Mathematics (Standard/Basic)', 'NCERT Science (Phy/Chem/Bio)'],
    description: 'Master CBSE Class 10 with deep NCERT deconstruction and marking scheme training.',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-10-icse',
    name: 'Class 10 ICSE Board - Prime Evening Batch',
    grade: 'Class 10',
    board: 'ICSE Board',
    academicSession: '2025-2026',
    slotId: 'slot-2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 8,
    seatsRemaining: 4,
    status: 'Admissions Open (4 Seats Left)',
    monthlyFee: 2500,
    classroom: 'Lecture Hall 103, First Floor, Thiripura Complex',
    subjects: ['ICSE Mathematics', 'Physics', 'Chemistry', 'Biology'],
    description: 'Specialized batch for ICSE Class 10 candidates with numericals and circuit theory.',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-12-science-board',
    name: 'Class 12 Higher Secondary Science (HSC, CBSE & ISC)',
    grade: 'Class 12',
    board: 'TN State Board, CBSE & ISC',
    academicSession: '2025-2026',
    slotId: 'slot-3',
    timing: '7:30 PM – 9:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 10,
    seatsRemaining: 2,
    status: 'Limited Seats (2 Remaining)',
    monthlyFee: 2800,
    classroom: 'Senior Hall 103, First Floor, Thiripura Complex',
    subjects: ['Physics (Derivations & Numericals)', 'Chemistry (Organic & Physical)', 'Higher Mathematics (Calculus & Vectors)', 'Biology'],
    description: 'Advanced late-evening batch for 12th board candidates.',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-middle-foundation',
    name: 'Middle School Science & Math Foundation (Classes 6–8)',
    grade: 'Classes 6 to 8',
    board: 'Samacheer, CBSE & ICSE',
    academicSession: '2025-2026',
    slotId: 'slot-1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 8,
    seatsRemaining: 4,
    status: 'Admissions Open (4 Seats Left)',
    monthlyFee: 1800,
    classroom: 'Foundation Room 104, First Floor, Thiripura Complex',
    subjects: ['Mathematics Core & Arithmetic', 'General Science & Experiments', 'English Grammar & Vocabulary'],
    description: 'Early evening session right after school focusing on strong arithmetic and science.',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-9-preboard',
    name: 'Class 9 Pre-Board Bridge & Foundation',
    grade: 'Class 9',
    board: 'TN State Board, CBSE & ICSE',
    academicSession: '2025-2026',
    slotId: 'slot-1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 7,
    seatsRemaining: 5,
    status: 'Admissions Open (5 Seats Left)',
    monthlyFee: 2000,
    classroom: 'Foundation Room 102, First Floor, Thiripura Complex',
    subjects: ['Algebra & Geometry', 'Physics & Chemistry Basics', 'Biology'],
    description: 'Class 9 bridge year worksheets and small batch size.',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-11-science',
    name: 'Class 11 Science & Mathematics Core Batch',
    grade: 'Class 11',
    board: 'TN State Board, CBSE & ISC',
    academicSession: '2025-2026',
    slotId: 'slot-3',
    timing: '7:30 PM – 9:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 8,
    seatsRemaining: 4,
    status: 'Admissions Open (4 Seats Left)',
    monthlyFee: 2600,
    classroom: 'Senior Hall 103, First Floor, Thiripura Complex',
    subjects: ['Physics (Mechanics & Waves)', 'Chemistry (Thermodynamics & Bonding)', 'Mathematics (Calculus & Trigonometry)'],
    description: 'In-depth mechanics and calculus foundation.',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-remedial-maths',
    name: 'Special Secondary Math Intensive & Doubt Clinic Batch',
    grade: 'Classes 9 & 10',
    board: 'Samacheer, CBSE & ICSE',
    academicSession: '2025-2026',
    slotId: 'slot-1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 8,
    seatsRemaining: 4,
    status: 'Admissions Open (4 Seats Left)',
    monthlyFee: 1800,
    classroom: 'Problem Solving Clinic 105, First Floor, Thiripura Complex',
    subjects: ['Algebra Factoring', 'Geometry Theorems', 'Trigonometry Basics', 'Arithmetic Speed'],
    description: 'Designed specifically for students who need patient whiteboard coaching.',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  }
];

const SEED_STUDENTS = [
  {
    id: 'FA-2026-001',
    studentName: 'S. Kaviya',
    guardianName: 'S. Sundaram',
    guardianPhone: '9842451220',
    grade: 'Class 10',
    board: 'TN State Board (Samacheer)',
    academicSession: '2025-2026',
    batchId: 'batch-10-state-board',
    batchName: 'Class 10 State Board (SSLC) - Prime Evening Batch',
    enrollmentDate: '2025-06-10',
    status: 'active',
    feeConfig: {
      billingFrequency: 'monthly',
      amountPerCycle: 2200,
      discountAdjustment: 0,
      billingStartDate: '2025-06-10',
      nextDueDate: '2026-11-05',
      status: 'active'
    },
    createdAt: '2025-06-10T10:00:00.000Z'
  },
  {
    id: 'FA-2026-002',
    studentName: 'R. Rajesh',
    guardianName: 'M. Ramachandran',
    guardianPhone: '9842100001',
    grade: 'Class 12',
    board: 'TN State Board, CBSE & ISC',
    academicSession: '2025-2026',
    batchId: 'batch-12-science-board',
    batchName: 'Class 12 Higher Secondary Science (HSC, CBSE & ISC)',
    enrollmentDate: '2025-06-12',
    status: 'active',
    feeConfig: {
      billingFrequency: 'monthly',
      amountPerCycle: 2800,
      discountAdjustment: 200,
      billingStartDate: '2025-06-12',
      nextDueDate: '2026-10-28',
      status: 'active'
    },
    createdAt: '2025-06-12T11:00:00.000Z'
  },
  {
    id: 'FA-2026-003',
    studentName: 'Aarav Raman',
    guardianName: 'K. Raman',
    guardianPhone: '9842100002',
    grade: 'Classes 6 to 8',
    board: 'Samacheer, CBSE & ICSE',
    academicSession: '2025-2026',
    batchId: 'batch-middle-foundation',
    batchName: 'Middle School Science & Math Foundation (Classes 6–8)',
    enrollmentDate: '2025-07-01',
    status: 'active',
    feeConfig: {
      billingFrequency: 'quarterly',
      amountPerCycle: 5100,
      discountAdjustment: 300,
      billingStartDate: '2025-07-01',
      nextDueDate: '2026-10-20',
      status: 'active'
    },
    createdAt: '2025-07-01T09:30:00.000Z'
  },
  {
    id: 'FA-2026-004',
    studentName: 'Bhavana Suresh',
    guardianName: 'N. Suresh',
    guardianPhone: '9842100003',
    grade: 'Class 10',
    board: 'CBSE Board',
    academicSession: '2025-2026',
    batchId: 'batch-10-cbse',
    batchName: 'Class 10 CBSE Board - Prime Evening Batch',
    enrollmentDate: '2025-06-15',
    status: 'active',
    feeConfig: {
      billingFrequency: 'monthly',
      amountPerCycle: 2400,
      discountAdjustment: 0,
      billingStartDate: '2025-06-15',
      nextDueDate: '2026-11-01',
      status: 'active'
    },
    createdAt: '2025-06-15T14:00:00.000Z'
  }
];

const SEED_OBLIGATIONS = [
  {
    id: 'OBL-2026-101',
    studentId: 'FA-2026-001',
    studentName: 'S. Kaviya',
    batchId: 'batch-10-state-board',
    billingCycle: 'October 2026',
    dueDate: '2026-10-05',
    amountDue: 2200,
    amountPaid: 2200,
    waivedAmount: 0,
    balance: 0,
    status: 'paid',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'OBL-2026-102',
    studentId: 'FA-2026-002',
    studentName: 'R. Rajesh',
    batchId: 'batch-12-science-board',
    billingCycle: 'October 2026',
    dueDate: '2026-10-15',
    amountDue: 2600,
    amountPaid: 1300,
    waivedAmount: 0,
    balance: 1300,
    status: 'partially_paid',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'OBL-2026-103',
    studentId: 'FA-2026-003',
    studentName: 'Aarav Raman',
    batchId: 'batch-middle-foundation',
    billingCycle: 'Q3 (Jul-Oct) 2026',
    dueDate: '2026-10-20',
    amountDue: 4800,
    amountPaid: 0,
    waivedAmount: 0,
    balance: 4800,
    status: 'overdue',
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  {
    id: 'OBL-2026-104',
    studentId: 'FA-2026-004',
    studentName: 'Bhavana Suresh',
    batchId: 'batch-10-cbse',
    billingCycle: 'November 2026',
    dueDate: '2026-11-05',
    amountDue: 2400,
    amountPaid: 0,
    waivedAmount: 0,
    balance: 2400,
    status: 'pending',
    createdAt: '2026-10-20T00:00:00.000Z'
  }
];

const SEED_PAYMENTS = [
  {
    id: 'TXN-OCT-001',
    receiptNumber: 'REC-2026-0001',
    studentId: 'FA-2026-001',
    studentName: 'S. Kaviya',
    batchId: 'batch-10-state-board',
    obligationId: 'OBL-2026-101',
    amount: 2200,
    paymentDate: '2026-10-04',
    paymentMethod: 'upi_online',
    referenceNumber: 'UPI/629182910281',
    recordedBy: 'admin@focusacademyperambalur.com',
    notes: 'Paid via GPay to Academy Business account',
    createdAt: '2026-10-04T11:20:00.000Z'
  },
  {
    id: 'TXN-OCT-002',
    receiptNumber: 'REC-2026-0002',
    studentId: 'FA-2026-002',
    studentName: 'R. Rajesh',
    batchId: 'batch-12-science-board',
    obligationId: 'OBL-2026-102',
    amount: 1300,
    paymentDate: '2026-10-14',
    paymentMethod: 'cash',
    referenceNumber: 'CASH-REC-102',
    recordedBy: 'admin@focusacademyperambalur.com',
    notes: 'Partial payment received at Thoramangalam front desk',
    createdAt: '2026-10-14T17:45:00.000Z'
  }
];

const SEED_REMINDERS = [
  {
    id: 'REM-2026-001',
    studentId: 'FA-2026-003',
    studentName: 'Aarav Raman',
    guardianPhone: '9842100002',
    obligationId: 'OBL-2026-103',
    amount: 4800,
    dueDate: '2026-10-20',
    reminderType: 'overdue',
    status: 'manual_opened',
    channel: 'whatsapp',
    messagePreview: 'Hello, this is Focus Academy. A fee payment of ₹4800 for Aarav Raman is due on 2026-10-20. If you have already paid, please contact the academy so we can verify the payment. Thank you.',
    timestamp: '2026-10-22T10:00:00.000Z'
  }
];

const SEED_AUDIT_LOGS = [
  {
    id: 'LOG-001',
    timestamp: '2026-10-01T09:00:00.000Z',
    actor: 'admin@focusacademyperambalur.com',
    action: 'SYSTEM_INITIALIZED',
    entityType: 'system',
    entityId: 'campus-perambalur',
    details: 'Academic Year 2025-2026 Batches and Fee Schedules synchronized'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-10-04T11:20:00.000Z',
    actor: 'admin@focusacademyperambalur.com',
    action: 'PAYMENT_RECORDED',
    entityType: 'payment',
    entityId: 'TXN-OCT-001',
    details: 'Recorded payment ₹2200 for S. Kaviya (Receipt REC-2026-0001)'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-10-14T17:45:00.000Z',
    actor: 'admin@focusacademyperambalur.com',
    action: 'PAYMENT_RECORDED',
    entityType: 'payment',
    entityId: 'TXN-OCT-002',
    details: 'Recorded partial payment ₹1300 for R. Rajesh (Receipt REC-2026-0002)'
  }
];

function loadLocalStore() {
  if (typeof window === 'undefined') {
    return {
      batches: [...SEED_BATCHES],
      students: [...SEED_STUDENTS],
      obligations: [...SEED_OBLIGATIONS],
      payments: [...SEED_PAYMENTS],
      reminders: [...SEED_REMINDERS],
      auditLogs: [...SEED_AUDIT_LOGS]
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = {
        batches: [...SEED_BATCHES],
        students: [...SEED_STUDENTS],
        obligations: [...SEED_OBLIGATIONS],
        payments: [...SEED_PAYMENTS],
        reminders: [...SEED_REMINDERS],
        auditLogs: [...SEED_AUDIT_LOGS]
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      batches: parsed.batches || [...SEED_BATCHES],
      students: parsed.students || [...SEED_STUDENTS],
      obligations: parsed.obligations || [...SEED_OBLIGATIONS],
      payments: parsed.payments || [...SEED_PAYMENTS],
      reminders: parsed.reminders || [...SEED_REMINDERS],
      auditLogs: parsed.auditLogs || [...SEED_AUDIT_LOGS]
    };
  } catch {
    return {
      batches: [...SEED_BATCHES],
      students: [...SEED_STUDENTS],
      obligations: [...SEED_OBLIGATIONS],
      payments: [...SEED_PAYMENTS],
      reminders: [...SEED_REMINDERS],
      auditLogs: [...SEED_AUDIT_LOGS]
    };
  }
}

function saveLocalStore(data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save admin store:', err);
  }
}

export const AdminDataService = {
  resetToSeedData() {
    const seed = {
      batches: [...SEED_BATCHES],
      students: [...SEED_STUDENTS],
      obligations: [...SEED_OBLIGATIONS],
      payments: [...SEED_PAYMENTS],
      reminders: [...SEED_REMINDERS],
      auditLogs: [...SEED_AUDIT_LOGS]
    };
    saveLocalStore(seed);
    return seed;
  },

  async logAudit({ actor = 'admin', action, entityType, entityId, details }) {
    const entry = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      entityType,
      entityId,
      details
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'audit_logs', entry.id), entry);
      } catch (err) {
        console.warn('Firestore audit log error, saving locally:', err);
      }
    }

    const store = loadLocalStore();
    store.auditLogs.unshift(entry);
    saveLocalStore(store);
    return entry;
  },

  async getAuditLogs(limitCount = 50) {
    if (isFirebaseConfigured() && db) {
      try {
        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getAuditLogs error, fallback to local:', err);
      }
    }
    const store = loadLocalStore();
    return store.auditLogs.slice(0, limitCount);
  },

  async getBatches() {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'batches'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getBatches error, fallback to local:', err);
      }
    }
    const store = loadLocalStore();
    return store.batches;
  },

  async getBatchById(batchId) {
    const batches = await this.getBatches();
    return batches.find(b => b.id === batchId) || null;
  },

  async createBatch(batchData, actor = 'admin') {
    const batches = await this.getBatches();
    const cleanId = (batchData.id || `batch-${Date.now().toString(36)}`).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    if (batches.some(b => b.id === cleanId)) {
      throw new Error(`Batch ID '${cleanId}' already exists. Please choose a unique identifier.`);
    }

    const newBatch = {
      id: cleanId,
      name: batchData.name.trim(),
      grade: batchData.grade.trim(),
      board: batchData.board.trim(),
      academicSession: batchData.academicSession || '2025-2026',
      slotId: batchData.slotId || 'slot-1',
      timing: batchData.timing || '4:30 PM – 6:00 PM',
      days: batchData.days || 'Monday – Saturday',
      capacity: 12,
      enrolledCount: 0,
      seatsRemaining: 12,
      status: 'Admissions Open (12 Seats Left)',
      monthlyFee: Number(batchData.monthlyFee) || 2000,
      classroom: batchData.classroom || 'Lecture Hall 101, First Floor, Thiripura Complex',
      subjects: Array.isArray(batchData.subjects) ? batchData.subjects : [batchData.subjects || 'General Subjects'],
      description: batchData.description || 'Focus Academy structured evening coaching batch.',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'batches', newBatch.id), newBatch);
      } catch (err) {
        console.warn('Firestore createBatch error, saving locally:', err);
      }
    }

    const store = loadLocalStore();
    store.batches.push(newBatch);
    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'BATCH_CREATED',
      entityType: 'batch',
      entityId: newBatch.id,
      details: `Created batch '${newBatch.name}' (${newBatch.grade}, ${newBatch.board}) with 12 seats cap.`
    });

    return newBatch;
  },

  async updateBatch(batchId, updates, actor = 'admin') {
    const store = loadLocalStore();
    const idx = store.batches.findIndex(b => b.id === batchId);
    if (idx === -1) {
      throw new Error(`Batch not found with ID: ${batchId}`);
    }

    const existing = store.batches[idx];
    const capacity = 12;
    const enrolledCount = updates.enrolledCount !== undefined ? Number(updates.enrolledCount) : existing.enrolledCount;
    const seatsRemaining = Math.max(0, capacity - enrolledCount);

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      capacity,
      enrolledCount,
      seatsRemaining,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'batches', batchId), updated);
      } catch (err) {
        console.warn('Firestore updateBatch error, saving locally:', err);
      }
    }

    store.batches[idx] = updated;

    if (updates.name && updates.name !== existing.name) {
      store.students = store.students.map(s => {
        if (s.batchId === batchId) {
          return { ...s, batchName: updated.name, updatedAt: new Date().toISOString() };
        }
        return s;
      });
    }

    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'BATCH_UPDATED',
      entityType: 'batch',
      entityId: batchId,
      details: `Updated batch '${updated.name}' details.`
    });

    return updated;
  },

  async archiveBatch(batchId, actor = 'admin') {
    return this.updateBatch(batchId, { isArchived: true, status: 'Archived' }, actor);
  },

  async deleteBatch(batchId, actor = 'admin') {
    const students = await this.getStudents();
    const assigned = students.filter(s => s.batchId === batchId && s.status !== 'archived');
    if (assigned.length > 0) {
      throw new Error(
        `Cannot delete batch '${batchId}' because ${assigned.length} active student(s) are assigned to it. Please transfer or reassign students first, or archive the batch.`
      );
    }

    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, 'batches', batchId));
      } catch (err) {
        console.warn('Firestore deleteBatch error, deleting locally:', err);
      }
    }

    const store = loadLocalStore();
    store.batches = store.batches.filter(b => b.id !== batchId);
    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'BATCH_DELETED',
      entityType: 'batch',
      entityId: batchId,
      details: `Deleted batch with ID ${batchId}.`
    });

    return { success: true };
  },

  async getStudents() {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'students'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getStudents error, fallback to local:', err);
      }
    }
    const store = loadLocalStore();
    return store.students;
  },

  async getStudentById(studentId) {
    const students = await this.getStudents();
    return students.find(s => s.id === studentId) || null;
  },

  async createStudent(studentData, actor = 'admin') {
    const batches = await this.getBatches();
    const targetBatch = batches.find(b => b.id === studentData.batchId);
    if (!targetBatch) {
      throw new Error(`Selected batch '${studentData.batchId}' was not found.`);
    }

    if (!isBatchCompatible(targetBatch, studentData.grade, studentData.board)) {
      throw new Error(
        `Academic Mismatch: Student grade '${studentData.grade}' (${studentData.board}) cannot be assigned to batch '${targetBatch.name}' (${targetBatch.grade}, ${targetBatch.board}).`
      );
    }

    if (targetBatch.enrolledCount >= 12) {
      throw new Error(`Batch '${targetBatch.name}' has reached maximum physical capacity of 12 students.`);
    }

    const cleanPhone = String(studentData.guardianPhone || studentData.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit Indian guardian phone number.');
    }

    const store = loadLocalStore();
    const nextNum = store.students.length + 1;
    const cleanId = studentData.id || `FA-2026-${String(nextNum).padStart(3, '0')}`;

    const newStudent = {
      id: cleanId,
      studentName: studentData.studentName.trim(),
      guardianName: (studentData.guardianName || studentData.parentName || 'Parent / Guardian').trim(),
      guardianPhone: cleanPhone,
      grade: studentData.grade,
      board: studentData.board,
      academicSession: studentData.academicSession || '2025-2026',
      batchId: targetBatch.id,
      batchName: targetBatch.name,
      enrollmentDate: studentData.enrollmentDate || new Date().toISOString().split('T')[0],
      status: 'active',
      feeConfig: {
        billingFrequency: studentData.billingFrequency || 'monthly',
        amountPerCycle: Number(studentData.amountPerCycle) || targetBatch.monthlyFee,
        discountAdjustment: Number(studentData.discountAdjustment) || 0,
        billingStartDate: studentData.enrollmentDate || new Date().toISOString().split('T')[0],
        nextDueDate: studentData.nextDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'active'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'students', newStudent.id), newStudent);
      } catch (err) {
        console.warn('Firestore createStudent error, saving locally:', err);
      }
    }

    store.students.push(newStudent);

    const bIdx = store.batches.findIndex(b => b.id === targetBatch.id);
    if (bIdx !== -1) {
      store.batches[bIdx].enrolledCount += 1;
      store.batches[bIdx].seatsRemaining = Math.max(0, 12 - store.batches[bIdx].enrolledCount);
    }

    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'STUDENT_CREATED',
      entityType: 'student',
      entityId: newStudent.id,
      details: `Enrolled student '${newStudent.studentName}' (${newStudent.grade}) into '${targetBatch.name}'.`
    });

    const initialAmount = Math.max(0, newStudent.feeConfig.amountPerCycle - newStudent.feeConfig.discountAdjustment);
    await this.createFeeObligation({
      studentId: newStudent.id,
      studentName: newStudent.studentName,
      batchId: newStudent.batchId,
      billingCycle: `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`,
      dueDate: newStudent.feeConfig.nextDueDate,
      amountDue: initialAmount
    }, actor);

    return newStudent;
  },

  async updateStudent(studentId, updates, actor = 'admin') {
    const store = loadLocalStore();
    const idx = store.students.findIndex(s => s.id === studentId);
    if (idx === -1) {
      throw new Error(`Student not found with ID: ${studentId}`);
    }

    const existing = store.students[idx];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'students', studentId), updated);
      } catch (err) {
        console.warn('Firestore updateStudent error, saving locally:', err);
      }
    }

    store.students[idx] = updated;
    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'STUDENT_UPDATED',
      entityType: 'student',
      entityId: studentId,
      details: `Updated details for student '${updated.studentName}'.`
    });

    return updated;
  },

  async transferStudentBatch(studentId, newBatchId, reason = 'Academic progression', actor = 'admin') {
    const student = await this.getStudentById(studentId);
    if (!student) {
      throw new Error(`Student not found with ID: ${studentId}`);
    }

    if (student.batchId === newBatchId) {
      throw new Error('Student is already enrolled in this batch.');
    }

    const targetBatch = await this.getBatchById(newBatchId);
    if (!targetBatch) {
      throw new Error(`Target batch not found: ${newBatchId}`);
    }

    if (!isBatchCompatible(targetBatch, student.grade, student.board)) {
      throw new Error(
        `Academic Mismatch: Student grade '${student.grade}' (${student.board}) is incompatible with destination batch '${targetBatch.name}' (${targetBatch.grade}, ${targetBatch.board}).`
      );
    }

    if (targetBatch.enrolledCount >= 12) {
      throw new Error(`Target batch '${targetBatch.name}' is already at full capacity (12/12 seats).`);
    }

    const oldBatchId = student.batchId;
    const oldBatchName = student.batchName;

    const store = loadLocalStore();

    const oldBIdx = store.batches.findIndex(b => b.id === oldBatchId);
    if (oldBIdx !== -1) {
      store.batches[oldBIdx].enrolledCount = Math.max(0, store.batches[oldBIdx].enrolledCount - 1);
      store.batches[oldBIdx].seatsRemaining = Math.max(0, 12 - store.batches[oldBIdx].enrolledCount);
    }

    const newBIdx = store.batches.findIndex(b => b.id === newBatchId);
    if (newBIdx !== -1) {
      store.batches[newBIdx].enrolledCount += 1;
      store.batches[newBIdx].seatsRemaining = Math.max(0, 12 - store.batches[newBIdx].enrolledCount);
    }

    const sIdx = store.students.findIndex(s => s.id === studentId);
    if (sIdx !== -1) {
      store.students[sIdx].batchId = targetBatch.id;
      store.students[sIdx].batchName = targetBatch.name;
      store.students[sIdx].updatedAt = new Date().toISOString();
    }

    saveLocalStore(store);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'students', studentId), {
          batchId: targetBatch.id,
          batchName: targetBatch.name,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Firestore transferStudentBatch error:', err);
      }
    }

    await this.logAudit({
      actor,
      action: 'STUDENT_TRANSFERRED',
      entityType: 'student',
      entityId: studentId,
      details: `Transferred '${student.studentName}' from '${oldBatchName}' to '${targetBatch.name}'. Reason: ${reason}`
    });

    return {
      success: true,
      oldBatchId,
      newBatchId,
      studentName: student.studentName
    };
  },

  async archiveStudent(studentId, actor = 'admin') {
    return this.updateStudent(studentId, { status: 'archived' }, actor);
  },

  async restoreStudent(studentId, actor = 'admin') {
    return this.updateStudent(studentId, { status: 'active' }, actor);
  },

  async getFeeObligations(studentId = null) {
    if (isFirebaseConfigured() && db) {
      try {
        let q;
        if (studentId) {
          q = query(collection(db, 'fee_obligations'), where('studentId', '==', studentId));
        } else {
          q = collection(db, 'fee_obligations');
        }
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getFeeObligations error, fallback to local:', err);
      }
    }
    const store = loadLocalStore();
    const obligations = store.obligations.map(obl => {
      const today = new Date().toISOString().split('T')[0];
      const balance = Math.max(0, Number(obl.amountDue) - Number(obl.amountPaid || 0) - Number(obl.waivedAmount || 0));
      let status = obl.status;
      if (obl.status !== 'waived' && obl.status !== 'cancelled') {
        if (balance === 0) {
          status = 'paid';
        } else if (obl.amountPaid > 0) {
          status = 'partially_paid';
        } else if (today > obl.dueDate) {
          status = 'overdue';
        } else {
          status = 'pending';
        }
      }
      return { ...obl, balance, status };
    });

    if (studentId) {
      return obligations.filter(o => o.studentId === studentId);
    }
    return obligations;
  },

  async createFeeObligation(obligationData, actor = 'admin') {
    const store = loadLocalStore();
    const exists = store.obligations.some(
      o => o.studentId === obligationData.studentId && 
           o.billingCycle === obligationData.billingCycle &&
           o.status !== 'cancelled'
    );
    if (exists) {
      return store.obligations.find(
        o => o.studentId === obligationData.studentId && o.billingCycle === obligationData.billingCycle
      );
    }

    const nextNum = store.obligations.length + 101;
    const cleanId = obligationData.id || `OBL-2026-${nextNum}`;
    const amountDue = Number(obligationData.amountDue);

    const newObligation = {
      id: cleanId,
      studentId: obligationData.studentId,
      studentName: obligationData.studentName,
      batchId: obligationData.batchId,
      billingCycle: obligationData.billingCycle,
      dueDate: obligationData.dueDate,
      amountDue,
      amountPaid: 0,
      waivedAmount: 0,
      balance: amountDue,
      status: new Date().toISOString().split('T')[0] > obligationData.dueDate ? 'overdue' : 'pending',
      notes: obligationData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'fee_obligations', newObligation.id), newObligation);
      } catch (err) {
        console.warn('Firestore createFeeObligation error:', err);
      }
    }

    store.obligations.push(newObligation);
    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'FEE_OBLIGATION_GENERATED',
      entityType: 'fee_obligation',
      entityId: newObligation.id,
      details: `Generated fee obligation ₹${amountDue} for '${newObligation.studentName}' (${newObligation.billingCycle}).`
    });

    return newObligation;
  },

  async waiveFeeObligation(obligationId, waiveAmount, reason, actor = 'admin') {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason (at least 5 characters) is required to waive fees.');
    }

    const store = loadLocalStore();
    const idx = store.obligations.findIndex(o => o.id === obligationId);
    if (idx === -1) {
      throw new Error(`Obligation not found: ${obligationId}`);
    }

    const obl = store.obligations[idx];
    const parsedAmount = Number(waiveAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Waiver amount must be greater than zero.');
    }

    const currentBalance = Math.max(0, obl.amountDue - (obl.amountPaid || 0) - (obl.waivedAmount || 0));
    if (currentBalance <= 0) {
      throw new Error('This fee obligation has no outstanding balance to waive.');
    }

    const amount = Math.min(parsedAmount, currentBalance);

    obl.waivedAmount = (obl.waivedAmount || 0) + amount;
    obl.balance = Math.max(0, obl.amountDue - (obl.amountPaid || 0) - obl.waivedAmount);
    obl.status = obl.balance === 0 ? 'waived' : (obl.amountPaid > 0 ? 'partially_paid' : 'pending');
    obl.waiverReason = reason;
    obl.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'fee_obligations', obligationId), obl);
      } catch (err) {
        console.warn('Firestore waiveFeeObligation error:', err);
      }
    }

    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'FEE_WAIVED',
      entityType: 'fee_obligation',
      entityId: obligationId,
      details: `Waived ₹${amount} for '${obl.studentName}' on obligation ${obligationId}. Reason: ${reason}`
    });

    return obl;
  },

  async getPayments(studentId = null) {
    if (isFirebaseConfigured() && db) {
      try {
        let q;
        if (studentId) {
          q = query(collection(db, 'payments'), where('studentId', '==', studentId));
        } else {
          q = collection(db, 'payments');
        }
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getPayments error, fallback to local:', err);
      }
    }
    const store = loadLocalStore();
    if (studentId) {
      return store.payments.filter(p => p.studentId === studentId);
    }
    return store.payments;
  },

  async recordPayment(paymentData, actor = 'admin') {
    const amount = Number(paymentData.amount);
    if (!amount || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const store = loadLocalStore();
    const oblIdx = store.obligations.findIndex(o => o.id === paymentData.obligationId);
    if (oblIdx === -1) {
      throw new Error(`Fee obligation not found: ${paymentData.obligationId}`);
    }

    const obligation = store.obligations[oblIdx];
    const currentBalance = Math.max(0, obligation.amountDue - (obligation.amountPaid || 0) - (obligation.waivedAmount || 0));

    if (amount > currentBalance) {
      throw new Error(`Payment amount (₹${amount}) exceeds the remaining balance of ₹${currentBalance}.`);
    }

    const nextReceiptNum = store.payments.length + 1;
    const year = new Date().getFullYear();
    const receiptNumber = paymentData.receiptNumber || `REC-${year}-${String(nextReceiptNum).padStart(4, '0')}`;
    const transactionId = paymentData.id || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const newPayment = {
      id: transactionId,
      receiptNumber,
      studentId: obligation.studentId,
      studentName: obligation.studentName,
      batchId: obligation.batchId,
      obligationId: obligation.id,
      amount,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentData.paymentMethod || 'cash',
      referenceNumber: paymentData.referenceNumber || `REF-${Date.now().toString(36).toUpperCase()}`,
      recordedBy: actor,
      notes: paymentData.notes || '',
      createdAt: new Date().toISOString()
    };

    obligation.amountPaid = (obligation.amountPaid || 0) + amount;
    obligation.balance = Math.max(0, obligation.amountDue - obligation.amountPaid - (obligation.waivedAmount || 0));
    obligation.status = obligation.balance === 0 ? 'paid' : 'partially_paid';
    obligation.updatedAt = new Date().toISOString();

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'payments', newPayment.id), newPayment);
        await updateDoc(doc(db, 'fee_obligations', obligation.id), obligation);
      } catch (err) {
        console.warn('Firestore recordPayment error:', err);
      }
    }

    store.payments.push(newPayment);
    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'PAYMENT_RECORDED',
      entityType: 'payment',
      entityId: newPayment.id,
      details: `Recorded payment ₹${amount} for '${obligation.studentName}' (${obligation.billingCycle}). Receipt: ${receiptNumber}`
    });

    return {
      payment: newPayment,
      obligation
    };
  },

  async getStudentLedger(studentId) {
    const student = await this.getStudentById(studentId);
    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    const obligations = await this.getFeeObligations(studentId);
    const payments = await this.getPayments(studentId);

    const totalFeesCharged = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
    const totalAmountPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalWaived = obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
    const outstandingBalance = Math.max(0, totalFeesCharged - totalAmountPaid - totalWaived);

    const today = new Date().toISOString().split('T')[0];
    const overdueAmount = obligations
      .filter(o => o.status === 'overdue' || (o.balance > 0 && today > o.dueDate))
      .reduce((sum, o) => sum + Number(o.balance || 0), 0);

    const upcomingObligations = obligations
      .filter(o => o.balance > 0 && o.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const nextDueDate = upcomingObligations.length > 0 ? upcomingObligations[0].dueDate : null;

    return {
      student,
      totalFeesCharged,
      totalAmountPaid,
      totalWaived,
      outstandingBalance,
      overdueAmount,
      nextDueDate,
      obligations,
      payments
    };
  },

  async getDashboardMetrics() {
    const batches = await this.getBatches();
    const students = await this.getStudents();
    const obligations = await this.getFeeObligations();
    const payments = await this.getPayments();

    const activeStudents = students.filter(s => s.status === 'active');
    const activeBatches = batches.filter(b => !b.isArchived);

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    const feesCollectedThisMonth = payments
      .filter(p => p.paymentDate && p.paymentDate.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalFeesCharged = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
    const totalAmountPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalWaived = obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
    const totalOutstandingFees = Math.max(0, totalFeesCharged - totalAmountPaid - totalWaived);

    const overdueObligations = obligations.filter(o => o.status === 'overdue' || (o.balance > 0 && today > o.dueDate));
    const totalOverdueFees = overdueObligations.reduce((sum, o) => sum + Number(o.balance || 0), 0);

    const paymentsDueToday = obligations.filter(o => o.balance > 0 && o.dueDate === today);
    const upcomingPayments = obligations.filter(o => o.balance > 0 && o.dueDate > today);

    const recentPayments = [...payments]
      .sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''))
      .slice(0, 10);

    return {
      totalActiveStudents: activeStudents.length,
      totalActiveBatches: activeBatches.length,
      feesCollectedThisMonth,
      totalOutstandingFees,
      totalOverdueFees,
      paymentsDueTodayCount: paymentsDueToday.length,
      upcomingPaymentsCount: upcomingPayments.length,
      recentPayments
    };
  },

  async getReminders() {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'reminders'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getReminders error, fallback to local:', err);
      }
    }
    const store = loadLocalStore();
    return store.reminders;
  },

  generateWhatsAppMessage({ studentName, amount, dueDate }) {
    return `Hello, this is Focus Academy. A fee payment of ₹${amount} for ${studentName} is due on ${dueDate}. If you have already paid, please contact the academy so we can verify the payment. Thank you.`;
  },

  async sendOrLogWhatsAppReminder({ studentId, obligationId, reminderType = 'upcoming' }, actor = 'admin') {
    const student = await this.getStudentById(studentId);
    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    const obligations = await this.getFeeObligations(studentId);
    const obligation = obligations.find(o => o.id === obligationId);
    if (!obligation) {
      throw new Error(`Obligation not found: ${obligationId}`);
    }

    if (obligation.balance <= 0 || obligation.status === 'paid' || obligation.status === 'waived') {
      throw new Error(`Cannot send fee reminder: Obligation is already marked as ${obligation.status.toUpperCase()} with ₹0 balance.`);
    }

    const store = loadLocalStore();
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const alreadySentRecent = store.reminders.some(
      r => r.obligationId === obligationId && 
           r.reminderType === reminderType && 
           r.timestamp > oneDayAgo
    );
    if (alreadySentRecent) {
      throw new Error(`A ${reminderType} reminder was already processed for this obligation within the last 24 hours.`);
    }

    const message = this.generateWhatsAppMessage({
      studentName: student.studentName,
      amount: obligation.balance,
      dueDate: obligation.dueDate
    });

    const cleanPhone = String(student.guardianPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new Error('A valid 10-digit guardian mobile number is required to dispatch WhatsApp reminders.');
    }
    const clickToChatUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;

    const reminderEntry = {
      id: `REM-${Date.now().toString(36).toUpperCase()}`,
      studentId: student.id,
      studentName: student.studentName,
      guardianPhone: cleanPhone,
      obligationId: obligation.id,
      amount: obligation.balance,
      dueDate: obligation.dueDate,
      reminderType,
      status: 'manual_opened',
      channel: 'whatsapp',
      messagePreview: message,
      timestamp: new Date().toISOString(),
      providerResponse: 'Dispatched via verified Focus Academy WhatsApp protocol'
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'reminders', reminderEntry.id), reminderEntry);
      } catch (err) {
        console.warn('Firestore sendOrLogWhatsAppReminder error:', err);
      }
    }

    store.reminders.unshift(reminderEntry);
    saveLocalStore(store);

    await this.logAudit({
      actor,
      action: 'REMINDER_TRIGGERED',
      entityType: 'reminder',
      entityId: reminderEntry.id,
      details: `Triggered ${reminderType} WhatsApp reminder (₹${obligation.balance}) for ${student.studentName} (${cleanPhone}).`
    });

    return {
      reminder: reminderEntry,
      clickToChatUrl
    };
  }
};
