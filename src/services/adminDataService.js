import { isBatchCompatible } from '../types/schemas';
import { db, isFirebaseConfigured } from './firebase';
import { getVerifiedAdminEmail, subscribeVerifiedAdmin } from './adminIdentity';import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  writeBatch, 
  runTransaction, 
  limit 
} from 'firebase/firestore';

export const ENROLLMENT_STATUSES = ['pending', 'confirmed', 'waitlisted', 'cancelled', 'archived'];

const ENROLLMENT_TRANSITIONS = {
  pending: ['confirmed', 'waitlisted', 'cancelled', 'archived'],
  confirmed: ['cancelled', 'archived'],
  waitlisted: ['confirmed', 'cancelled', 'archived'],
  cancelled: ['pending', 'confirmed'],
  archived: ['pending', 'confirmed']
};

const LEAD_STATUS_FOR_ENROLLMENT = {
  confirmed: 'converted',
  pending: 'new',
  waitlisted: 'new',
  cancelled: 'archived',
  archived: 'archived'
};

const ENROLLMENT_EDITABLE_FIELDS = [
  'studentName', 'parentName', 'phone', 'whatsappNumber', 'secondaryPhone',
  'grade', 'board', 'batchId', 'timing', 'subjects', 'schoolName',
  'educationBoard', 'targetYear', 'schoolShift', 'schoolDismissalTime',
  'emergencyContactName', 'emergencyRelationship', 'emergencyPhone',
  'medicalAlert', 'notes'
];

const cleanPhone10 = (value) => String(value || '').replace(/\D/g, '').slice(-10);
const normalizeName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function patchLocalEnrollmentRecords(enrollmentId, patch) {
  if (typeof window === 'undefined') return false;
  let found = false;
  ['focus_academy_submitted_leads_v1', 'focus_academy_pending_leads_v1'].forEach((key) => {
    try {
      const raw = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) || localStorage.getItem(key);
      if (!raw) return;
      const rows = JSON.parse(raw);
      if (!Array.isArray(rows)) return;
      let changed = false;
      const next = rows.map((row) => {
        if (row && row.id === enrollmentId) {
          changed = true;
          return { ...row, ...patch };
        }
        return row;
      });
      if (changed) {
        const serialized = JSON.stringify(next);
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, serialized);
        localStorage.setItem(key, serialized);
        found = true;
      }
    } catch {
    }
  });
  try {
    const raw = localStorage.getItem('focus_academy_students');
    if (raw) {
      const rows = JSON.parse(raw);
      if (Array.isArray(rows)) {
        const next = rows.map((row) => (row && row.id === enrollmentId ? { ...row, ...patch } : row));
        if (JSON.stringify(next) !== raw) {
          localStorage.setItem('focus_academy_students', JSON.stringify(next));
          found = true;
        }
      }
    }
  } catch {
  }
  return found;
}

const STORAGE_KEY = 'focus_academy_admin_data_v1';

export const ROLE_PERMISSIONS = {
  owner: [
    'canManageSettings',
    'canManageAdmins',
    'canWaiveFees',
    'canApplyDiscounts',
    'canExportData',
    'canImportData',
    'canManageBatches',
    'canManageStudents',
    'canRecordPayments',
    'canTriggerReminders',
    'canRestoreBackup'
  ],
  administrator: [
    'canManageSettings',
    'canWaiveFees',
    'canApplyDiscounts',
    'canExportData',
    'canImportData',
    'canManageBatches',
    'canManageStudents',
    'canRecordPayments',
    'canTriggerReminders'
  ],
  fee_manager: [
    'canWaiveFees',
    'canRecordPayments',
    'canTriggerReminders',
    'canExportData'
  ]
};

export const SEED_SETTINGS = {
  academyName: 'Focus Academy',
  campusAddress: 'First Floor, Thiripura Complex, Thoramangalam, Perambalur – 621220',
  primaryPhone: '+91 98424 51220',
  email: 'contact@focusacademyperambalur.com',
  website: 'https://focusacademyperambalur.com',
  logoUrl: '/logo.png',
  receiptPrefix: 'REC',
  defaultCurrency: 'INR',
  currencySymbol: '₹',
  defaultTimezone: 'Asia/Kolkata',
  defaultFeeCycles: ['monthly', 'quarterly', 'half-yearly', 'yearly'],
  paymentMethods: ['cash', 'upi_online', 'bank_transfer', 'card'],
  reminderTimingDaysBeforeDue: 3,
  whatsappTemplate: 'Hello, this is {academyName}. A fee payment of {currencySymbol}{amount} for {studentName} is due on {dueDate}. If you have already paid, please contact the academy so we can verify the payment. Thank you.',
  academicSessions: ['2025-2026', '2026-2027'],
  supportedBoards: [
    'TN State Board (Samacheer)',
    'CBSE Board',
    'ICSE Board',
    'TN State Board, CBSE & ISC',
    'Samacheer, CBSE & ICSE'
  ],
  authorizedAdmins: [
    { email: 'admin@focusacademyperambalur.com', name: 'Principal Administrator', role: 'owner', active: true },
    { email: 'director@focusacademyperambalur.com', name: 'Managing Director', role: 'owner', active: true },
    { email: 'principal@focusacademyperambalur.com', name: 'Academic Principal', role: 'administrator', active: true },
    { email: 'focusacademy.perambalur@gmail.com', name: 'Campus Operations', role: 'administrator', active: true },
    { email: 'coordinator@focusacademyperambalur.com', name: 'Fee & Billing Desk', role: 'fee_manager', active: true },
    { email: 'sagnikmitra1302@gmail.com', name: 'Sagnik Mitra', role: 'owner', active: true }
  ]
};

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
    classroom: 'Senior Hall 101, First Floor, Thiripura Complex',
    subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    description: 'Comprehensive core subject training for Class 11 higher secondary students.',
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
    description: 'Designed specifically for students who feel hesitant or left behind in school math classes. Patient whiteboard problem-solving with 1-on-1 teacher guidance and zero embarrassment.',
    prepTrackId: 'concept-mastery',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-10-foundation-olympiad',
    name: 'Class 10 Early Foundation & Olympiad Numerical Accelerator',
    grade: 'Class 10',
    board: 'TN State Board, CBSE & ICSE',
    academicSession: '2025-2026',
    slotId: 'slot-1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 7,
    seatsRemaining: 5,
    status: 'Admissions Open (5 Seats Left)',
    monthlyFee: 2500,
    classroom: 'Advanced Numerical Lab 104, First Floor, Thiripura Complex',
    subjects: ['Advanced Mathematics (HOTS)', 'Olympiad Physics & Chemistry', 'Logical & Numerical Reasoning'],
    description: 'High-order thinking questions (HOTS) and Olympiad problem sets for ambitious Class 10 students.',
    prepTrackId: 'foundation-olympiad',
    isArchived: false,
    createdAt: '2025-06-01T00:00:00.000Z'
  },
  {
    id: 'batch-12-neet-jee',
    name: 'Class 12 NEET & JEE Main Integrated Numerical Accelerator',
    grade: 'Class 12',
    board: 'TN State Board, CBSE & ISC',
    academicSession: '2025-2026',
    slotId: 'slot-3',
    timing: '7:30 PM – 9:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 8,
    seatsRemaining: 4,
    status: 'Admissions Open (4 Seats Left)',
    monthlyFee: 2900,
    classroom: 'Problem Solving Lab 103, First Floor, Thiripura Complex',
    subjects: ['Physics Numericals & Dimensional Analysis', 'Organic & Physical Chemistry Problem Sets', 'Higher Mathematics / NEET Bio Drills'],
    description: 'Dedicated competitive numerical accelerator for Class 12 aspirants.',
    prepTrackId: 'neet-jee-foundations',
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
    courseEndDate: null,
    status: 'active',
    notificationPreferences: {
      communicationConsent: true,
      preferredChannel: 'whatsapp',
      remindersDisabled: false,
      reminderDisabledReason: ''
    },
    feeConfig: {
      billingFrequency: 'monthly',
      amountPerCycle: 2200,
      discountAdjustment: 0,
      adjustmentHistory: [],
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
    courseEndDate: null,
    status: 'active',
    notificationPreferences: {
      communicationConsent: true,
      preferredChannel: 'whatsapp',
      remindersDisabled: false,
      reminderDisabledReason: ''
    },
    feeConfig: {
      billingFrequency: 'monthly',
      amountPerCycle: 2800,
      discountAdjustment: 200,
      adjustmentHistory: [
        {
          id: 'ADJ-INIT-001',
          timestamp: '2025-06-12T11:00:00.000Z',
          discountType: 'sibling_concession',
          amount: 200,
          reason: 'Sibling concession for elder sibling enrolled',
          approvingAdmin: 'director@focusacademyperambalur.com',
          recordedBy: 'admin@focusacademyperambalur.com'
        }
      ],
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
    courseEndDate: null,
    status: 'active',
    notificationPreferences: {
      communicationConsent: true,
      preferredChannel: 'whatsapp',
      remindersDisabled: false,
      reminderDisabledReason: ''
    },
    feeConfig: {
      billingFrequency: 'quarterly',
      amountPerCycle: 5100,
      discountAdjustment: 300,
      adjustmentHistory: [],
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
    courseEndDate: null,
    status: 'active',
    notificationPreferences: {
      communicationConsent: true,
      preferredChannel: 'whatsapp',
      remindersDisabled: false,
      reminderDisabledReason: ''
    },
    feeConfig: {
      billingFrequency: 'monthly',
      amountPerCycle: 2400,
      discountAdjustment: 0,
      adjustmentHistory: [],
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

function normalizeActorEmail(actor) {
  const candidate = actor && typeof actor === 'object' ? actor.email : actor;
  const text = String(candidate || '').toLowerCase().trim();
  if ((!isFirebaseConfigured() || (typeof window !== 'undefined' && window.__E2E_SEED__)) && text.includes('@')) return text;
  const verified = getVerifiedAdminEmail();
  if (verified) return verified;
  throw new Error('Authentication required: sign in with an authorized administrator account.');
}

const seedStore = () => ({
  batches: JSON.parse(JSON.stringify(SEED_BATCHES)),
  students: JSON.parse(JSON.stringify(SEED_STUDENTS)),
  obligations: JSON.parse(JSON.stringify(SEED_OBLIGATIONS)),
  payments: JSON.parse(JSON.stringify(SEED_PAYMENTS)),
  reminders: JSON.parse(JSON.stringify(SEED_REMINDERS)),
  auditLogs: JSON.parse(JSON.stringify(SEED_AUDIT_LOGS)),
  settings: JSON.parse(JSON.stringify(SEED_SETTINGS)),
  tillSessions: []
});

const emptyStore = () => ({
  batches: [],
  students: [],
  obligations: [],
  payments: [],
  reminders: [],
  auditLogs: [],
  settings: JSON.parse(JSON.stringify(SEED_SETTINGS)),
  tillSessions: []
});

const uid = (prefix) => {
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
  return `${prefix}-${random}`;
};

const buildAudit = ({ actor, action, entityType, entityId, details }) => ({
  id: uid('LOG'),
  timestamp: new Date().toISOString(),
  actor,
  action,
  entityType,
  entityId,
  details
});

const isLive = () => isFirebaseConfigured() && Boolean(db) && !(typeof window !== 'undefined' && window.__E2E_SEED__);

let sessionCache = null;

subscribeVerifiedAdmin((admin) => {
  if (!admin) sessionCache = null;
});

export const dataUnavailable = (err) => {
  console.error('Firestore request failed:', err);
  const error = new Error('The database could not be reached. Nothing was changed. Please check your connection and try again.');
  error.code = 'data-unavailable';
  return error;
};

function loadLocalStore() {
  if (isLive() && sessionCache && (sessionCache.batches?.length > 0 || sessionCache.students?.length > 0)) {
    return sessionCache;
  }
  if (typeof window === 'undefined') return seedStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = seedStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      if (isLive()) sessionCache = initial;
      return initial;
    }
    const parsed = JSON.parse(raw);
    const seed = seedStore();
    const loaded = {
      batches: parsed.batches && parsed.batches.length > 0 ? parsed.batches : seed.batches,
      students: parsed.students && parsed.students.length > 0 ? parsed.students : seed.students,
      obligations: parsed.obligations && parsed.obligations.length > 0 ? parsed.obligations : seed.obligations,
      payments: parsed.payments && parsed.payments.length > 0 ? parsed.payments : seed.payments,
      reminders: parsed.reminders && parsed.reminders.length > 0 ? parsed.reminders : seed.reminders,
      auditLogs: parsed.auditLogs || seed.auditLogs,
      settings: parsed.settings || seed.settings,
      tillSessions: parsed.tillSessions || []
    };
    if (isLive()) sessionCache = loaded;
    return loaded;
  } catch {
    const seed = seedStore();
    if (isLive()) sessionCache = seed;
    return seed;
  }
}

function saveLocalStore(data) {
  if (isLive()) {
    sessionCache = data;
    return;
  }
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save admin store:', err);
  }
}

const HYDRATED_COLLECTIONS = {
  batches: 'batches',
  students: 'students',
  obligations: 'fee_obligations',
  payments: 'payments',
  reminders: 'reminders',
  tillSessions: 'till_sessions'
};

async function hydrateStore() {
  if (!isLive()) return loadLocalStore();
  try {
    const entries = await Promise.all(
      Object.entries(HYDRATED_COLLECTIONS).map(async ([key, name]) => {
        const snap = await Promise.race([
          getDocs(collection(db, name)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 10000))
        ]);
        return [key, snap.docs.map((d) => d.data())];
      })
    );
    const store = loadLocalStore();
    entries.forEach(([key, rows]) => {
      if (rows && rows.length > 0) {
        store[key] = rows;
      }
    });
    saveLocalStore(store);
    return store;
  } catch (err) {
    console.warn('Firestore hydrate unavailable, using verified local store:', err);
    return loadLocalStore();
  }
}

export const AdminDataService = {
  resetToSeedData() {
    if (isLive()) {
      throw new Error('Sample data can only be loaded in a development environment.');
    }
    const seed = seedStore();
    saveLocalStore(seed);
    return seed;
  },

  getUserRole(actor) {
    const email = normalizeActorEmail(actor);
    const settings = this.getSettingsSync();
    const admins = settings.authorizedAdmins || SEED_SETTINGS.authorizedAdmins;
    const match = admins.find((a) => a.active !== false && a.email.toLowerCase() === email);
    return match ? match.role : 'viewer';
  },

  hasPermission(actor, permission) {
    const role = this.getUserRole(actor);
    const permissions = ROLE_PERMISSIONS[role] || [];
    if (permissions.includes(permission)) return true;

    const aliases = {
      'MANAGE_SETTINGS': 'canManageSettings',
      'MANAGE_ROLES': 'canManageAdmins',
      'MANAGE_ADMINS': 'canManageAdmins',
      'BACKUP_RESTORE': 'canRestoreBackup',
      'RESTORE_BACKUP': 'canRestoreBackup',
      'EXPORT_DATA': 'canExportData',
      'IMPORT_DATA': 'canImportData',
      'MANAGE_BATCHES': 'canManageBatches',
      'DELETE_BATCH': 'canManageBatches',
      'MANAGE_STUDENTS': 'canManageStudents',
      'MANAGE_FEES': 'canWaiveFees',
      'WAIVE_FEES': 'canWaiveFees',
      'APPLY_DISCOUNTS': 'canApplyDiscounts',
      'RECORD_PAYMENTS': 'canRecordPayments',
      'TRIGGER_REMINDERS': 'canTriggerReminders'
    };
    if (aliases[permission] && permissions.includes(aliases[permission])) {
      return true;
    }
    return false;
  },

  verifyPermission(actor, permission, actionName = 'This operation') {
    if (!this.hasPermission(actor, permission)) {
      const role = this.getUserRole(actor);
      const email = normalizeActorEmail(actor);
      throw new Error(`Unauthorized: User '${email}' with role '${role}' is not granted '${permission}' for ${actionName}.`);
    }
  },

  async withFirestoreTimeout(promise, ms = 8000) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Firestore timeout')), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer);
    }
  },

  getSettingsSync() {
    const store = loadLocalStore();
    return store.settings || SEED_SETTINGS;
  },

  async getSettings() {
    if (isLive()) {
      try {
        const snap = await this.withFirestoreTimeout(getDocs(collection(db, 'academy_settings')), 8000);
        if (snap && !snap.empty) {
          const docData = snap.docs[0].data();
          return { ...SEED_SETTINGS, ...docData };
        }
        return { ...SEED_SETTINGS };
      } catch (err) {
        console.warn('Firestore getSettings unavailable, using verified local store:', err);
      }
    }
    const store = await hydrateStore();
    return store.settings || { ...SEED_SETTINGS };
  },

  async updateSettings(updates, actor = 'admin') {
    this.verifyPermission(actor, 'canManageSettings', 'updating academy institutional settings');

    const store = await hydrateStore();
    const current = store.settings || { ...SEED_SETTINGS };
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: normalizeActorEmail(actor)
    };

    store.settings = updated;
    saveLocalStore(store);

    if (isLive()) {
      try {
        await setDoc(doc(db, 'academy_settings', 'main_config'), updated);
      } catch (err) {
        console.warn('Firestore updateSettings error (local settings preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'SETTINGS_UPDATED',
      entityType: 'academy_settings',
      entityId: 'main_config',
      details: 'Updated institutional academy settings and policies.'
    });

    return updated;
  },

  async getAuthorizedAdmins() {
    const settings = await this.getSettings();
    return settings.authorizedAdmins || SEED_SETTINGS.authorizedAdmins;
  },

  async updateAdminRole(email, newRole, actor = 'admin') {
    this.verifyPermission(actor, 'canManageAdmins', 'updating administrator roles');
    const validRoles = ['owner', 'administrator', 'fee_manager'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role '${newRole}'. Allowed roles: ${validRoles.join(', ')}.`);
    }

    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail.includes('@')) {
      throw new Error('A valid administrator email address is required.');
    }

    const actorEmail = String(normalizeActorEmail(actor) || '').toLowerCase().trim();
    const actorRole = this.getUserRole(actor);
    const ROLE_RANK = { viewer: 0, fee_manager: 1, administrator: 2, owner: 3 };

    if (cleanEmail === actorEmail) {
      throw new Error('You cannot change your own permission role. Ask another owner to do this.');
    }
    if ((ROLE_RANK[newRole] || 0) > (ROLE_RANK[actorRole] || 0)) {
      throw new Error(`Unauthorized: your role '${actorRole}' cannot grant the higher role '${newRole}'.`);
    }

    const applyRoleChange = (settings) => {
      const admins = settings.authorizedAdmins ? [...settings.authorizedAdmins] : [...SEED_SETTINGS.authorizedAdmins];
      const targetIdx = admins.findIndex((a) => String(a.email).toLowerCase() === cleanEmail);
      const oldRole = targetIdx !== -1 ? admins[targetIdx].role : 'none';

      if (targetIdx !== -1) {
        admins[targetIdx].role = newRole;
        admins[targetIdx].updatedAt = new Date().toISOString();
        admins[targetIdx].updatedBy = actorEmail;
      } else {
        admins.push({
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role: newRole,
          active: true,
          addedAt: new Date().toISOString(),
          addedBy: actorEmail
        });
      }
      settings.authorizedAdmins = admins;
      return { admins, oldRole };
    };

    const auditEntry = {
      id: uid('LOG'),
      timestamp: new Date().toISOString(),
      actor: actorEmail,
      action: 'ADMIN_ROLE_UPDATED',
      entityType: 'admin_user',
      entityId: cleanEmail,
      details: ''
    };

    if (isLive()) {
      const settingsRef = doc(db, 'academy_settings', 'main_config');
      let persistedAdmins;
      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(settingsRef);
          const current = snap.exists
            ? snap.data()
            : { ...SEED_SETTINGS, authorizedAdmins: [...SEED_SETTINGS.authorizedAdmins] };
          const { admins, oldRole } = applyRoleChange(current);
          auditEntry.details = `Changed permission role for '${cleanEmail}' from '${oldRole}' to '${newRole}'.`;
          tx.set(settingsRef, { ...current, updatedAt: auditEntry.timestamp, updatedBy: actorEmail }, { merge: true });
          tx.set(doc(db, 'audit_logs', auditEntry.id), auditEntry);
          persistedAdmins = admins;
        });
      } catch (err) {
        console.error('Firestore updateAdminRole error code:', err?.code || 'unknown');
        throw new Error('Failed to save the role change to the database. Nothing was changed. Please try again.');
      }

      const verify = await this.withFirestoreTimeout(getDocs(collection(db, 'academy_settings')), 8000);
      const confirmed = verify && !verify.empty ? verify.docs[0].data().authorizedAdmins : null;
      const confirmedMatch = confirmed && confirmed.find((a) => String(a.email).toLowerCase() === cleanEmail && a.role === newRole);
      if (!confirmedMatch) {
        throw new Error('The role change could not be confirmed in the database. Please reload and try again.');
      }
      return persistedAdmins || confirmed;
    }

    const store = await hydrateStore();
    const settings = store.settings || { ...SEED_SETTINGS };
    const { admins } = applyRoleChange(settings);
    store.settings = settings;
    saveLocalStore(store);

    auditEntry.details = `Changed permission role for '${cleanEmail}' from 'n/a' to '${newRole}'.`;
    await this.logAudit({
      actor: actorEmail,
      action: 'ADMIN_ROLE_UPDATED',
      entityType: 'admin_user',
      entityId: cleanEmail,
      details: auditEntry.details
    });

    return admins;
  },

  async logAudit({ actor = 'admin', action, entityType, entityId, details }) {
    const entry = {
      id: uid('LOG'),
      timestamp: new Date().toISOString(),
      actor: normalizeActorEmail(actor),
      action,
      entityType,
      entityId,
      details
    };

    const store = loadLocalStore();
    store.auditLogs.unshift(entry);
    saveLocalStore(store);

    if (isLive()) {
      try {
        await setDoc(doc(db, 'audit_logs', entry.id), entry);
      } catch (err) {
        console.warn('Firestore audit log error (local log preserved):', err);
      }
    }

    return entry;
  },

  async getAuditLogs(limitCount = 50) {
    if (isLive()) {
      try {
        const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
        const snap = await this.withFirestoreTimeout(getDocs(q), 8000);
        if (snap && !snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getAuditLogs unavailable, using verified local store:', err);
      }
    }
    const store = await hydrateStore();
    return (store.auditLogs || []).slice(0, limitCount);
  },

  async getBatches() {
    if (isLive()) {
      try {
        const snap = await this.withFirestoreTimeout(getDocs(collection(db, 'batches')), 8000);
        if (snap && !snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getBatches unavailable, using verified local store:', err);
      }
    }
    const store = await hydrateStore();
    return store.batches || [];
  },

  async getBatchById(batchId) {
    const batches = await this.getBatches();
    return batches.find(b => b.id === batchId) || null;
  },

  async createBatch(batchData, actor = 'admin') {
    this.verifyPermission(actor, 'canManageBatches', 'creating batch');
    const batches = await this.getBatches();
    const cleanId = (batchData.id || `batch-${Date.now().toString(36)}`).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    if (batches.some(b => b.id === cleanId)) {
      throw new Error(`Batch ID '${cleanId}' already exists. Please choose a unique identifier.`);
    }

    const capacity = Math.max(1, Number(batchData.capacity) || 12);
    const newBatch = {
      id: cleanId,
      name: batchData.name.trim(),
      grade: batchData.grade.trim(),
      board: batchData.board.trim(),
      academicSession: batchData.academicSession || '2025-2026',
      slotId: batchData.slotId || 'slot-1',
      timing: batchData.timing || '4:30 PM – 6:00 PM',
      days: batchData.days || 'Monday – Saturday',
      capacity,
      enrolledCount: 0,
      seatsRemaining: capacity,
      status: `Admissions Open (${capacity} Seats Left)`,
      monthlyFee: Number(batchData.monthlyFee) || 2000,
      classroom: batchData.classroom || 'Lecture Hall 101, First Floor, Thiripura Complex',
      subjects: Array.isArray(batchData.subjects) ? batchData.subjects : [batchData.subjects || 'General Subjects'],
      description: batchData.description || 'Focus Academy structured evening coaching batch.',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const store = await hydrateStore();
    store.batches.push(newBatch);
    saveLocalStore(store);

    if (isLive()) {
      try {
        await setDoc(doc(db, 'batches', newBatch.id), newBatch);
      } catch (err) {
        console.warn('Firestore createBatch error (local batch preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'BATCH_CREATED',
      entityType: 'batch',
      entityId: newBatch.id,
      details: `Created batch '${newBatch.name}' (${newBatch.grade}, ${newBatch.board}) with ${newBatch.capacity} seats cap.`
    });

    return newBatch;
  },

  async updateBatch(batchId, updates, actor = 'admin') {
    this.verifyPermission(actor, 'canManageBatches', 'updating batch');
    const store = await hydrateStore();
    const idx = store.batches.findIndex(b => b.id === batchId);
    if (idx === -1) {
      throw new Error(`Batch not found with ID: ${batchId}`);
    }

    const existing = store.batches[idx];
    const capacity = Math.max(1, Number(updates.capacity !== undefined ? updates.capacity : existing.capacity) || 12);
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

    if (isLive()) {
      try {
        await updateDoc(doc(db, 'batches', batchId), updated);
      } catch (err) {
        console.warn('Firestore updateBatch error (local update preserved):', err);
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
      actor: normalizeActorEmail(actor),
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
    this.verifyPermission(actor, 'canManageBatches', 'deleting batch');
    const students = await this.getStudents();
    const assigned = students.filter(s => s.batchId === batchId && s.status !== 'archived');
    if (assigned.length > 0) {
      throw new Error(
        `Cannot delete batch '${batchId}' because ${assigned.length} active student(s) are assigned to it. Please transfer or reassign students first, or archive the batch.`
      );
    }

    const store = await hydrateStore();
    store.batches = store.batches.filter(b => b.id !== batchId);
    saveLocalStore(store);

    if (isLive()) {
      try {
        await deleteDoc(doc(db, 'batches', batchId));
      } catch (err) {
        console.warn('Firestore deleteBatch error (local deletion preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'BATCH_DELETED',
      entityType: 'batch',
      entityId: batchId,
      details: `Deleted batch with ID ${batchId}.`
    });

    return { success: true };
  },

  async getStudents(options = {}) {
    let list;
    if (isLive()) {
      try {
        const snap = await this.withFirestoreTimeout(getDocs(collection(db, 'students')), 8000);
        if (snap && !snap.empty) {
          list = snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getStudents unavailable, using verified local store:', err);
      }
    }
    if (!list) {
      const store = await hydrateStore();
      list = [...(store.students || [])];
    }

    if (!isLive()) {
      try {
        const registered = JSON.parse(localStorage.getItem('focus_academy_students') || '[]');
        const existingIds = new Set(list.map(s => s.id));
        const existingPhones = new Set(list.map(s => s.guardianPhone || s.phone));
        registered.forEach(r => {
          if (!existingIds.has(r.id) && !existingPhones.has(r.phone)) {
            existingIds.add(r.id);
            list.push({
              id: r.id,
              studentName: r.studentName,
              guardianName: r.parentName || 'Parent / Guardian',
              guardianPhone: r.phone,
              secondaryPhone: r.secondaryPhone || null,
              grade: r.grade,
              board: r.board,
              academicSession: '2025-2026',
              batchId: r.selectedBatchId,
              batchName: r.selectedBatchName || 'Focus Evening Batch',
              enrollmentDate: (r.createdAt || new Date().toISOString()).split('T')[0],
              courseEndDate: null,
              status: 'active',
              notificationPreferences: {
                communicationConsent: true,
                preferredChannel: 'whatsapp',
                remindersDisabled: false,
                reminderDisabledReason: ''
              },
              feeConfig: {
                billingFrequency: 'monthly',
                amountPerCycle: r.monthlyFee || 2800,
                discountAdjustment: 0,
                adjustmentHistory: [],
                billingStartDate: (r.createdAt || new Date().toISOString()).split('T')[0],
                nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                status: 'active'
              },
              createdAt: r.createdAt || new Date().toISOString()
            });
          }
        });
      } catch {
      }
    }

    if (!options.includeArchived) {
      list = list.filter(s => s.status !== 'archived');
    }
    if (options.status && options.status !== 'all') {
      list = list.filter(s => s.status === options.status);
    }
    return list;
  },

  async getLeads() {
    if (isLive()) {
      try {
        const q = query(collection(db, 'leads'), orderBy('timestamp', 'desc'));
        const snap = await this.withFirestoreTimeout(getDocs(q), 8000);
        if (snap && !snap.empty) {
          return snap.docs.map(d => ({ ...d.data(), id: d.id }));
        }
      } catch (err) {
        console.warn('Firestore getLeads query unavailable, using local leads:', err);
      }
    }

    const local = [];
    try {
      const logs = JSON.parse(
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('focus_academy_submitted_leads_v1')) ||
        localStorage.getItem('focus_academy_submitted_leads_v1') || '[]'
      );
      const queue = JSON.parse(localStorage.getItem('focus_academy_pending_leads_v1') || '[]');
      const seen = new Set();
      [...queue, ...logs].forEach(item => {
        const id = item.id || `lead-${item.phone}-${item.studentName}`;
        if (!seen.has(id)) {
          seen.add(id);
          local.push({
            ...item,
            id,
            timestamp: item.submittedAt || item.queuedAt || new Date().toISOString(),
            studentName: item.studentName,
            parentName: item.parentName || 'Parent',
            phone: item.phone,
            grade: item.grade || 'Class 10',
            board: item.board || 'State Board',
            batchId: item.batchId || null,
            batchName: item.batchName || item.selectedBatchName || null,
            status: item.status || 'new',
            source: item.source || (item.reservationId ? 'enrollment' : 'inquiry'),
            subjects: item.subjects || '',
            notes: item.notes || '',
            schoolShift: item.schoolShift || null,
            schoolDismissalTime: item.schoolDismissalTime || null,
            travelDurationMinutes: item.travelDurationMinutes !== undefined && item.travelDurationMinutes !== null ? item.travelDurationMinutes : null,
            scheduleClashWarning: item.scheduleClashWarning || null,
            timing: item.timing || null
          });
        }
      });
    } catch {
    }
    return local;
  },

  async getEnrollments() {
    const list = [];
    const seen = new Set();
    if (isLive()) {
      try {
        const q = query(collection(db, 'enrollments'), orderBy('enrolledAt', 'desc'));
        const snap = await this.withFirestoreTimeout(getDocs(q), 8000);
        (snap ? snap.docs : []).forEach(d => {
          seen.add(d.id);
          list.push({ ...d.data(), id: d.id });
        });
      } catch (err) {
        console.warn('Firestore getEnrollments query unavailable, using local enrollments:', err);
      }
    }

    try {
      const allLeads = await this.getLeads();
      allLeads.filter(l => l.source === 'enrollment' || l.reservationId).forEach(l => {
        if (!seen.has(l.id)) {
          seen.add(l.id);
          const mappedStatus = ['pending', 'confirmed', 'waitlisted', 'cancelled', 'archived'].includes(l.status)
            ? l.status
            : (l.status === 'converted' ? 'confirmed' : 'pending');
          list.push({
            ...l,
            status: mappedStatus,
            enrolledAt: l.timestamp || l.submittedAt || new Date().toISOString(),
            batchName: l.batchName || l.selectedBatchName || l.subjects || 'Focus Evening Batch'
          });
        }
      });
    } catch (err) {
      console.warn('Local leads read error:', err);
    }

    try {
      const registered = JSON.parse(localStorage.getItem('focus_academy_students') || '[]');
      registered.forEach(s => {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          list.push({
            id: s.id,
            studentName: s.studentName,
            parentName: s.parentName || 'Parent',
            phone: s.phone,
            grade: s.grade,
            board: s.board,
            batchId: s.selectedBatchId,
            batchName: s.selectedBatchName || 'Focus Evening Batch',
            timing: s.timing || 'Evening Session',
            reservationId: s.reservationId,
            status: s.isWaitlisted ? 'waitlisted' : 'confirmed',
            source: 'enrollment',
            enrolledAt: s.createdAt || new Date().toISOString(),
            schoolName: s.schoolName
          });
        }
      });
    } catch {
    }

    return list;
  },

  async getEnrollmentById(enrollmentId) {
    const cleanId = String(enrollmentId || '').trim();
    if (!cleanId) {
      throw new Error('An enrollment ID is required.');
    }
    if (isLive()) {
      try {
        const snap = await this.withFirestoreTimeout(getDoc(doc(db, 'enrollments', cleanId)), 8000);
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
      } catch (err) {
        console.warn('Firestore getEnrollmentById unavailable, using local store:', err);
      }
    }
    const list = await this.getEnrollments();
    const found = list.find(e => e.id === cleanId);
    if (!found) {
      throw new Error(`Enrollment record not found: ${cleanId}`);
    }
    return found;
  },

  async _resolveLinkedStudent(enrollment) {
    if (enrollment.studentId) {
      const direct = await this.getStudentById(enrollment.studentId);
      if (direct) return direct;
    }
    const students = await this.getStudents({ includeArchived: true });
    const byId = students.find(s => s.id === enrollment.id);
    if (byId) return byId;
    const phone = cleanPhone10(enrollment.phone);
    const nameKey = normalizeName(enrollment.studentName);
    if (!phone && !nameKey) return null;
    return students.find(s =>
      (phone && cleanPhone10(s.guardianPhone) === phone) ||
      (nameKey && normalizeName(s.studentName) === nameKey && cleanPhone10(s.guardianPhone) === phone)
    ) || null;
  },

  async _writeEnrollment(enrollmentId, patch, actorEmail) {
    const now = new Date().toISOString();
    const payload = { ...patch, updatedAt: now, updatedBy: actorEmail };

    if (isLive()) {
      try {
        await updateDoc(doc(db, 'enrollments', enrollmentId), payload);
      } catch (err) {
        console.error('Firestore enrollment update failed:', err);
        throw dataUnavailable(err);
      }
      try {
        const check = await this.withFirestoreTimeout(getDoc(doc(db, 'enrollments', enrollmentId)), 8000);
        if (!check.exists()) throw new Error('missing_record');
        const stored = check.data();
        const mismatch = Object.entries(payload).find(([key, value]) => JSON.stringify(stored[key]) !== JSON.stringify(value));
        if (mismatch) throw new Error(`mismatch_${mismatch[0]}`);
      } catch (err) {
        console.error('Firestore enrollment read-back verification failed:', err);
        throw new Error('The enrollment change could not be confirmed in the database. Nothing was changed — please reload and try again.');
      }

      try {
        const leadSnap = await this.withFirestoreTimeout(getDoc(doc(db, 'leads', enrollmentId)), 8000);
        if (leadSnap.exists()) {
          await updateDoc(doc(db, 'leads', enrollmentId), { ...payload, source: leadSnap.data().source || 'enrollment' });
        }
      } catch (err) {
        console.error('Firestore lead sync failed during enrollment update:', err);
        throw dataUnavailable(err);
      }
      return;
    }

    const patched = patchLocalEnrollmentRecords(enrollmentId, patch);
    if (!patched) {
      throw new Error(`Enrollment record not found: ${enrollmentId}. Nothing was changed — please refresh and try again.`);
    }
  },

  async updateEnrollment(enrollmentId, updates = {}, actor = 'admin') {
    this.verifyPermission(actor, 'canManageStudents', 'editing enrollment record');
    const actorEmail = normalizeActorEmail(actor);
    const enrollment = await this.getEnrollmentById(enrollmentId);

    const rejected = Object.keys(updates).filter(key => !ENROLLMENT_EDITABLE_FIELDS.includes(key));
    if (rejected.length > 0) {
      throw new Error(`These fields cannot be edited on an enrollment record: ${rejected.join(', ')}.`);
    }
    if (Object.keys(updates).length === 0) {
      throw new Error('No changes were provided to save.');
    }

    const patch = {};
    if (updates.studentName !== undefined) {
      const name = String(updates.studentName || '').trim();
      if (name.length < 2) throw new Error('Student name must be at least 2 characters.');
      patch.studentName = name;
    }
    if (updates.parentName !== undefined) {
      patch.parentName = String(updates.parentName || '').trim() || 'Parent / Guardian';
    }
    if (updates.phone !== undefined) {
      const phone = cleanPhone10(updates.phone);
      if (!/^[6-9]\d{9}$/.test(phone)) {
        throw new Error('A valid 10-digit Indian mobile number is required.');
      }
      patch.phone = phone;
      if (!enrollment.whatsappNumber || cleanPhone10(enrollment.whatsappNumber) === cleanPhone10(enrollment.phone)) {
        patch.whatsappNumber = phone;
      }
    }
    if (updates.secondaryPhone !== undefined) {
      const secondary = cleanPhone10(updates.secondaryPhone);
      patch.secondaryPhone = secondary ? secondary : null;
      if (patch.secondaryPhone && !/^[6-9]\d{9}$/.test(patch.secondaryPhone)) {
        throw new Error('The secondary contact number must be a valid 10-digit Indian mobile number.');
      }
    }
    ['grade', 'board', 'schoolName', 'educationBoard', 'targetYear', 'schoolShift', 'subjects', 'notes',
      'emergencyContactName', 'emergencyRelationship', 'medicalAlert'].forEach((field) => {
      if (updates[field] !== undefined) {
        patch[field] = String(updates[field] || '').trim() || null;
      }
    });
    if (updates.emergencyPhone !== undefined) {
      const emergency = cleanPhone10(updates.emergencyPhone);
      if (emergency && !/^[6-9]\d{9}$/.test(emergency)) {
        throw new Error('The emergency contact number must be a valid 10-digit Indian mobile number.');
      }
      patch.emergencyPhone = emergency || null;
    }
    if (updates.schoolDismissalTime !== undefined) {
      patch.schoolDismissalTime = String(updates.schoolDismissalTime || '').trim() || null;
    }
    if (updates.batchId !== undefined) {
      patch.batchId = String(updates.batchId || '').trim();
    }

    if (patch.grade || patch.board || patch.batchId) {
      const grade = patch.grade || enrollment.grade;
      const board = patch.board || enrollment.board;
      const batchId = patch.batchId || enrollment.batchId;
      if (batchId) {
        const batch = await this.getBatchById(batchId);
        if (!batch) {
          throw new Error(`Batch '${batchId}' was not found.`);
        }
        if (!isBatchCompatible(batch, grade, board)) {
          throw new Error(`Academic Mismatch: '${grade}' (${board || 'All'}) cannot be assigned to batch '${batch.name}' (${batch.grade}, ${batch.board}).`);
        }
        patch.batchName = batch.name;
        if (patch.timing === undefined && patch.batchId && patch.batchId !== enrollment.batchId) {
          patch.timing = batch.timing;
        }
      } else if (patch.batchId) {
        throw new Error('A batch is required. Select an evening batch for this enrollment.');
      }
    }

    await this._writeEnrollment(enrollmentId, patch, actorEmail);

    const student = await this._resolveLinkedStudent(enrollment);
    let updatedStudent = null;
    let batchChangeNotice = null;
    if (student) {
      const batchChanged = patch.batchId && patch.batchId !== student.batchId;
      if (batchChanged) {
        await this.transferStudentBatch(student.id, patch.batchId,
          `Enrollment record ${enrollmentId} edited by administrator`, actor);
        batchChangeNotice = `Batch changed from '${student.batchName}' to '${patch.batchName}'.`;
      }
      const studentPatch = {};
      if (patch.studentName !== undefined) studentPatch.studentName = patch.studentName;
      if (patch.parentName !== undefined) studentPatch.guardianName = patch.parentName;
      if (patch.phone !== undefined) studentPatch.guardianPhone = patch.phone;
      if (patch.secondaryPhone !== undefined) studentPatch.secondaryPhone = patch.secondaryPhone;
      if (patch.grade !== undefined) studentPatch.grade = patch.grade;
      if (patch.board !== undefined) studentPatch.board = patch.board;
      if (patch.schoolShift !== undefined) studentPatch.schoolShift = patch.schoolShift;
      if (patch.schoolDismissalTime !== undefined) studentPatch.schoolDismissalTime = patch.schoolDismissalTime;
      if (patch.emergencyContactName !== undefined) studentPatch.emergencyContactName = patch.emergencyContactName;
      if (patch.medicalAlert !== undefined) studentPatch.medicalAlert = patch.medicalAlert;
      if (Object.keys(studentPatch).length > 0) {
        updatedStudent = await this.updateStudent(student.id, studentPatch, actor);
      } else {
        updatedStudent = await this.getStudentById(student.id);
      }
    }

    await this.logAudit({
      actor: actorEmail,
      action: 'ENROLLMENT_UPDATED',
      entityType: 'enrollment',
      entityId: enrollmentId,
      details: `Edited enrollment record for '${patch.studentName || enrollment.studentName}' (${Object.keys(patch).join(', ')}).${batchChangeNotice ? ` ${batchChangeNotice}` : ''}`
    });

    return {
      success: true,
      enrollment: { ...enrollment, ...patch, updatedAt: new Date().toISOString() },
      student: updatedStudent,
      batchChangeNotice
    };
  },

  async updateEnrollmentStatus(enrollmentId, nextStatus, options = {}, actor = 'admin') {
    this.verifyPermission(actor, 'canManageStudents', 'changing enrollment status');
    const actorEmail = normalizeActorEmail(actor);
    const reason = String(options.reason || '').trim();

    if (!ENROLLMENT_STATUSES.includes(nextStatus)) {
      throw new Error(`Invalid enrollment status '${nextStatus}'. Allowed statuses: ${ENROLLMENT_STATUSES.join(', ')}.`);
    }

    const enrollment = await this.getEnrollmentById(enrollmentId);
    const currentStatus = ENROLLMENT_STATUSES.includes(enrollment.status)
      ? enrollment.status
      : (enrollment.status === 'converted' ? 'confirmed' : 'pending');

    if (currentStatus === nextStatus) {
      throw new Error(`This enrollment is already '${nextStatus}'. No change was made.`);
    }
    const allowedTransitions = ENROLLMENT_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(nextStatus)) {
      throw new Error(`Invalid enrollment status change '${currentStatus}' → '${nextStatus}'. Allowed from '${currentStatus}': ${allowedTransitions.join(', ') || 'none'}.`);
    }
    if (nextStatus === 'cancelled' && reason.length < 5) {
      throw new Error('A cancellation reason of at least 5 characters is required.');
    }
    if (nextStatus === 'archived' && reason.length < 5) {
      throw new Error('An archive reason of at least 5 characters is required.');
    }

    const student = await this._resolveLinkedStudent(enrollment);
    const payments = student ? await this.getPayments(student.id) : await this.getPayments();
    const linkedPayments = student
      ? payments
      : payments.filter(p => p.enrollmentId === enrollmentId || (enrollment.studentId && p.studentId === enrollment.studentId));
    const activePayments = linkedPayments.filter(p => !p.isReversed && !p.reversed);
    const activeTotal = activePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    if (nextStatus === 'cancelled' && activeTotal > 0 && options.allowWithPayments !== true) {
      throw new Error(
        `This enrollment has ₹${activeTotal.toLocaleString('en-IN')} in verified payments` +
        ` (${activePayments.map(p => p.receiptNumber).join(', ')}). Reverse those receipts in Ledger & Payments first,` +
        ' or archive the record instead — financial history is never erased.'
      );
    }

    const warnings = [];
    let registeredStudent = student;

    if (nextStatus === 'confirmed' && !student) {
      const batchId = enrollment.batchId;
      if (!batchId) {
        throw new Error('This enrollment has no batch assigned. Edit the enrollment and select a batch before confirming it.');
      }
      registeredStudent = await this.createStudent({
        studentName: enrollment.studentName,
        guardianName: enrollment.parentName || 'Parent / Guardian',
        guardianPhone: enrollment.phone,
        secondaryPhone: enrollment.secondaryPhone,
        grade: enrollment.grade,
        board: enrollment.board,
        batchId,
        academicSession: '2025-2026',
        enrollmentDate: String(enrollment.enrolledAt || new Date().toISOString()).split('T')[0],
        status: 'active',
        schoolShift: enrollment.schoolShift || null,
        schoolDismissalTime: enrollment.schoolDismissalTime || null,
        travelDurationMinutes: enrollment.travelDurationMinutes || null,
        scheduleClashWarning: enrollment.scheduleClashWarning || null,
        emergencyContactName: enrollment.emergencyContactName || null,
        medicalAlert: enrollment.medicalAlert || null,
        enrollmentId,
        leadId: enrollment.leadId || enrollmentId,
        studentUid: enrollment.studentUid || null,
        reservationId: enrollment.reservationId || null,
        source: 'online_enrollment'
      }, actor);
    }

    if (registeredStudent) {
      if (nextStatus === 'cancelled' || nextStatus === 'archived') {
        if (registeredStudent.status !== 'archived') {
          try {
            await this.updateStudentLifecycleStatus(registeredStudent.id, {
              status: 'archived',
              reason: `${nextStatus === 'cancelled' ? 'Enrollment cancelled' : 'Enrollment archived'}: ${reason}`
            }, actor);
          } catch (err) {
            warnings.push(`Student roster record could not be archived: ${err.message}`);
          }
        }
      } else if (nextStatus === 'confirmed' && registeredStudent.status === 'archived') {
        try {
          await this.restoreStudent(registeredStudent.id, actor);
        } catch (err) {
          warnings.push(`Student roster record could not be restored: ${err.message}`);
        }
      }
    }

    const now = new Date().toISOString();
    const statusHistory = [
      ...(enrollment.statusHistory || []),
      { from: currentStatus, to: nextStatus, reason: reason || '', updatedAt: now, updatedBy: actorEmail }
    ];
    const patch = {
      status: nextStatus,
      statusReason: reason || enrollment.statusReason || '',
      statusHistory
    };
    if (nextStatus === 'confirmed') {
      patch.studentId = (registeredStudent && registeredStudent.id) || enrollment.studentId || null;
      patch.confirmedAt = enrollment.confirmedAt || now;
      patch.feeStatus = enrollment.feeStatus && enrollment.feeStatus !== 'not_applicable' ? enrollment.feeStatus : 'pending';
      patch.paymentStatus = activeTotal > 0 ? 'partial' : 'unpaid';

      if (registeredStudent) {
        try {
          const obligations = (await this.getFeeObligations(registeredStudent.id)).filter(o => o.status !== 'cancelled');
          const totalDue = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
          const totalPaid = obligations.reduce((sum, o) => sum + Number(o.amountPaid || 0), 0);
          const totalWaived = obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
          if (obligations.length === 0) {
            patch.feeStatus = 'not_generated';
            patch.paymentStatus = 'unpaid';
          } else if (totalDue > 0 && totalPaid + totalWaived >= totalDue) {
            patch.feeStatus = 'settled';
            patch.paymentStatus = 'paid';
          } else if (totalPaid > 0) {
            patch.feeStatus = 'pending';
            patch.paymentStatus = 'partial';
          } else {
            patch.feeStatus = 'pending';
            patch.paymentStatus = 'unpaid';
          }
        } catch (err) {
          warnings.push(`Fee status could not be recalculated: ${err.message}`);
        }
      }
    }
    if (nextStatus === 'cancelled' || nextStatus === 'archived') {
      patch.removedFromActiveList = true;
      patch.archivedAt = now;
    }
    if (nextStatus === 'pending' || nextStatus === 'waitlisted') {
      patch.removedFromActiveList = false;
    }

    await this._writeEnrollment(enrollmentId, patch, actorEmail);

    const leadStatus = LEAD_STATUS_FOR_ENROLLMENT[nextStatus];
    if (leadStatus) {
      try {
        await this.updateLeadStatus(enrollmentId, leadStatus, actor);
      } catch (err) {
        if (/not found/i.test(err.message || '')) {
          warnings.push('No inquiry lead exists for this enrollment, so its lead status was left unchanged.');
        } else {
          throw err;
        }
      }
    }

    await this.logAudit({
      actor: actorEmail,
      action: 'ENROLLMENT_STATUS_CHANGED',
      entityType: 'enrollment',
      entityId: enrollmentId,
      details: `Enrollment for '${enrollment.studentName}' changed from '${currentStatus}' to '${nextStatus}'.${reason ? ` Reason: ${reason}` : ''}`
    });

    const fresh = await this.getEnrollmentById(enrollmentId).catch(() => ({ ...enrollment, ...patch }));
    return {
      success: true,
      enrollment: fresh,
      student: registeredStudent,
      from: currentStatus,
      to: nextStatus,
      warnings
    };
  },

  async archiveEnrollment(enrollmentId, reason, actor = 'admin') {
    const cleanReason = String(reason || '').trim();
    if (cleanReason.length < 5) {
      throw new Error('An archive reason of at least 5 characters is required.');
    }
    return this.updateEnrollmentStatus(enrollmentId, 'archived', { reason: cleanReason }, actor);
  },

  async updateLeadStatus(leadId, status, actor = 'admin') {
    this.verifyPermission(actor, 'canManageStudents', 'updating lead status');
    const actorEmail = normalizeActorEmail(actor);
    const now = new Date().toISOString();

    const validStatuses = ['new', 'contacted', 'converted', 'cancelled', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid lead status '${status}'. Allowed statuses: ${validStatuses.join(', ')}.`);
    }
    if (!leadId) {
      throw new Error('A lead ID is required to update its status.');
    }

    if (isLive()) {
      try {
        await updateDoc(doc(db, 'leads', leadId), {
          status,
          updatedAt: now,
          updatedBy: actorEmail
        });
      } catch (err) {
        console.error('Firestore updateLeadStatus error:', err);
        throw dataUnavailable(err);
      }

      try {
        const check = await this.withFirestoreTimeout(getDoc(doc(db, 'leads', leadId)), 8000);
        if (!check.exists() || check.data().status !== status) {
          throw new Error('readback_mismatch');
        }
      } catch (err) {
        console.error('Firestore updateLeadStatus verification failed:', err);
        throw new Error('The lead status change could not be confirmed in the database. Nothing was changed — please reload and try again.');
      }
    } else {
      let found = false;
      ['focus_academy_submitted_leads_v1', 'focus_academy_pending_leads_v1'].forEach((key) => {
        try {
          const raw = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) || localStorage.getItem(key);
          if (!raw) return;
          const rows = JSON.parse(raw);
          if (!Array.isArray(rows)) return;
          let changed = false;
          const next = rows.map((row) => {
            if (row && row.id === leadId) {
              changed = true;
              return { ...row, status, updatedAt: now, updatedBy: actorEmail };
            }
            return row;
          });
          if (changed) {
            const serialized = JSON.stringify(next);
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, serialized);
            localStorage.setItem(key, serialized);
            found = true;
          }
        } catch {
        }
      });
      if (!found) {
        throw new Error(`Lead not found: ${leadId}. Nothing was changed — please refresh the list and try again.`);
      }
    }

    await this.logAudit({
      actor: actorEmail,
      action: 'LEAD_STATUS_UPDATED',
      entityType: 'lead',
      entityId: leadId,
      details: `Updated lead ${leadId} status to '${status}'.`
    });

    return { success: true, leadId, status };
  },

  async convertLeadToStudent(lead, overrideData = {}, actor = 'admin') {
    this.verifyPermission(actor, 'canManageStudents', 'converting lead to student');
    const actorEmail = normalizeActorEmail(actor);

    const studentPayload = {
      studentName: lead.studentName,
      guardianName: lead.parentName || lead.guardianName || 'Parent / Guardian',
      guardianPhone: lead.phone,
      grade: overrideData.grade || lead.grade,
      board: overrideData.board || lead.board,
      batchId: overrideData.batchId || lead.batchId,
      academicSession: overrideData.academicSession || '2025-2026',
      enrollmentDate: overrideData.enrollmentDate || new Date().toISOString().split('T')[0],
      amountPerCycle: overrideData.amountPerCycle,
      discountAdjustment: overrideData.discountAdjustment || 0,
      billingFrequency: overrideData.billingFrequency || 'monthly',
      status: 'active',
      reservationId: lead.reservationId,
      schoolShift: lead.schoolShift || null,
      schoolDismissalTime: lead.schoolDismissalTime || null,
      travelDurationMinutes: lead.travelDurationMinutes ? Number(lead.travelDurationMinutes) : null,
      scheduleClashWarning: lead.scheduleClashWarning || null
    };

    const newStudent = await this.createStudent(studentPayload, actor);
    await this.updateLeadStatus(lead.id, 'converted', actor);

    await this.logAudit({
      actor: actorEmail,
      action: 'LEAD_CONVERTED_TO_STUDENT',
      entityType: 'lead',
      entityId: lead.id,
      details: `Converted lead '${lead.studentName}' into registered student ${newStudent.id} (${newStudent.grade}).`
    });

    return newStudent;
  },

  async getStudentById(studentId) {
    const students = await this.getStudents();
    return students.find(s => s.id === studentId) || null;
  },

  checkDuplicateStudent({ studentName, guardianPhone, excludeStudentId = null }) {
    const store = loadLocalStore();
    const cleanPhone = String(guardianPhone || '').replace(/\D/g, '').slice(-10);
    const cleanName = (studentName || '').trim().toLowerCase();
    const nameTokens = cleanName
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
    const sortedTokensStr = [...nameTokens].sort().join(' ');

    const duplicates = [];

    for (const s of store.students) {
      if (excludeStudentId && s.id === excludeStudentId) continue;

      const sPhone = String(s.guardianPhone || '').replace(/\D/g, '').slice(-10);
      const sName = (s.studentName || '').trim().toLowerCase();
      const sTokens = sName
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 0);
      const sSortedTokensStr = [...sTokens].sort().join(' ');

      const isExactPhone = cleanPhone && sPhone && (cleanPhone === sPhone || (cleanPhone.length >= 7 && sPhone.includes(cleanPhone)));
      const isExactName = cleanName && sName && cleanName === sName;

      let isFuzzyName = false;
      if (cleanName && sName) {
        if (sortedTokensStr && sSortedTokensStr && sortedTokensStr === sSortedTokensStr) {
          isFuzzyName = true;
        } else if (cleanName.length >= 3 && sName.length >= 3 && (cleanName.includes(sName) || sName.includes(cleanName))) {
          isFuzzyName = true;
        } else {
          const sharedSignificants = nameTokens.filter(t => t.length >= 3 && sTokens.includes(t));
          if (sharedSignificants.length > 0) {
            isFuzzyName = true;
          }
        }
      }

      if (isExactPhone || isExactName || isFuzzyName) {
        duplicates.push({
          student: s,
          matchType: isExactPhone && isExactName ? 'exact_phone_and_name' :
                     isExactPhone ? 'matching_guardian_phone' :
                     isExactName ? 'exact_student_name' : 'similar_student_name',
          warning: isExactPhone && isExactName
            ? `Exact phone and name match with student ${s.studentName} (${s.id}) in ${s.batchName}.`
            : isExactPhone
            ? `Guardian phone +91 ${cleanPhone} is already registered to ${s.studentName} (${s.id}) in ${s.batchName}.`
            : `Similar student name matches existing student ${s.studentName} (${s.id}) in ${s.batchName}.`
        });
      }
    }

    const reasons = duplicates.map(d => d.warning);
    const existingStudents = duplicates.map(d => d.student);

    return {
      hasDuplicate: duplicates.length > 0,
      duplicates,
      reasons,
      existingStudents,
      warning: duplicates.length > 0 ? duplicates.map(d => d.warning).join(' ') : null
    };
  },

  async createStudent(studentData, actor = 'admin') {
    this.verifyPermission(actor, 'canManageStudents', 'enrolling student');
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

    const batchCapacity = Math.max(1, Number(targetBatch.capacity) || 12);
    if (targetBatch.enrolledCount >= batchCapacity) {
      throw new Error(`Batch '${targetBatch.name}' has reached maximum physical capacity of ${batchCapacity} students.`);
    }

    const cleanPhone = String(studentData.guardianPhone || studentData.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new Error('Please enter a valid 10-digit Indian guardian phone number.');
    }

    const cleanSecondaryPhone = studentData.secondaryPhone ? String(studentData.secondaryPhone).replace(/\D/g, '').slice(-10) : null;

    const store = await hydrateStore();
    const year = new Date().getFullYear();
    let seq = store.students.length + 1;
    let cleanId = studentData.id || `FA-${year}-${String(seq).padStart(3, '0')}`;

    if (!studentData.id) {
      const idTaken = async (candidate) => {
        if (store.students.some(s => s.id === candidate)) return true;
        if (!isLive()) return false;
        try {
          const snap = await this.withFirestoreTimeout(getDoc(doc(db, 'students', candidate)), 8000);
          return snap.exists();
        } catch (err) {
          console.error('Firestore student ID availability check failed:', err);
          throw dataUnavailable(err);
        }
      };
      while (await idTaken(cleanId)) {
        seq += 1;
        cleanId = `FA-${year}-${String(seq).padStart(3, '0')}`;
      }
    }

    const newStudent = {
      id: cleanId,
      studentName: studentData.studentName.trim(),
      guardianName: (studentData.guardianName || studentData.parentName || 'Parent / Guardian').trim(),
      guardianPhone: cleanPhone,
      secondaryPhone: cleanSecondaryPhone && cleanSecondaryPhone.length === 10 ? cleanSecondaryPhone : null,
      emergencyContactName: studentData.emergencyContactName ? studentData.emergencyContactName.trim() : null,
      medicalAlert: studentData.medicalAlert ? studentData.medicalAlert.trim() : null,
      schoolShift: studentData.schoolShift || null,
      schoolDismissalTime: studentData.schoolDismissalTime || null,
      travelDurationMinutes: studentData.travelDurationMinutes ? Number(studentData.travelDurationMinutes) : null,
      scheduleClashWarning: studentData.scheduleClashWarning || null,
      grade: studentData.grade,
      board: studentData.board,
      academicSession: studentData.academicSession || '2025-2026',
      batchId: targetBatch.id,
      batchName: targetBatch.name,
      enrollmentDate: studentData.enrollmentDate || new Date().toISOString().split('T')[0],
      courseEndDate: studentData.courseEndDate || null,
      status: studentData.status || 'active',
      notificationPreferences: {
        communicationConsent: studentData.communicationConsent !== undefined ? Boolean(studentData.communicationConsent) : true,
        preferredChannel: studentData.preferredChannel || 'whatsapp',
        remindersDisabled: Boolean(studentData.remindersDisabled),
        reminderDisabledReason: studentData.reminderDisabledReason || ''
      },
      feeConfig: {
        billingFrequency: studentData.billingFrequency || 'monthly',
        amountPerCycle: Number(studentData.amountPerCycle) || targetBatch.monthlyFee,
        discountAdjustment: Number(studentData.discountAdjustment) || 0,
        discountReason: studentData.discountReason || (Number(studentData.discountAdjustment) > 0 ? 'Authorized fee concession' : ''),
        discountAuthorizedBy: Number(studentData.discountAdjustment) > 0 ? normalizeActorEmail(actor) : null,
        adjustmentHistory: studentData.adjustmentHistory || [],
        billingStartDate: studentData.enrollmentDate || new Date().toISOString().split('T')[0],
        nextDueDate: studentData.nextDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'active'
      },
      enrollmentId: studentData.enrollmentId || null,
      leadId: studentData.leadId || null,
      studentUid: studentData.studentUid || null,
      reservationId: studentData.reservationId || null,
      source: studentData.source || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.students.push(newStudent);

    const bIdx = store.batches.findIndex(b => b.id === targetBatch.id);
    if (bIdx !== -1) {
      store.batches[bIdx].enrolledCount += 1;
      const bCap = Math.max(1, Number(store.batches[bIdx].capacity) || 12);
      store.batches[bIdx].seatsRemaining = Math.max(0, bCap - store.batches[bIdx].enrolledCount);
    }

    saveLocalStore(store);

    if (isLive()) {
      try {
        await setDoc(doc(db, 'students', newStudent.id), newStudent);
        if (bIdx !== -1) {
          await updateDoc(doc(db, 'batches', targetBatch.id), store.batches[bIdx]);
        }
        try {
          const resQuery = query(
            collection(db, 'reservations'),
            where('batchId', '==', targetBatch.id),
            where('phone', '==', cleanPhone)
          );
          const resSnap = await getDocs(resQuery);
          for (const rDoc of resSnap.docs) {
            const rData = rDoc.data();
            if (rData.status === 'held' || rData.status === 'confirmed') {
              await updateDoc(rDoc.ref, { status: 'enrolled', enrolledAt: new Date().toISOString() });
            }
          }
        } catch (resErr) {
          console.warn('Could not update matching reservation status:', resErr);
        }
      } catch (err) {
        console.warn('Firestore createStudent error (local student preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
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
    this.verifyPermission(actor, 'canManageStudents', 'updating student record');
    const store = await hydrateStore();
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

    store.students[idx] = updated;
    saveLocalStore(store);

    if (isLive()) {
      try {
        await updateDoc(doc(db, 'students', studentId), updated);
      } catch (err) {
        console.warn('Firestore updateStudent error (local update preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'STUDENT_UPDATED',
      entityType: 'student',
      entityId: studentId,
      details: `Updated details for student '${updated.studentName}'.`
    });

    return updated;
  },

  async updateStudentLifecycleStatus(studentId, statusOrPayload, reasonOrActor = 'admin', optionalActor = 'admin') {
    let status;
    let courseEndDate;
    let reason;
    let actor;

    if (typeof statusOrPayload === 'object' && statusOrPayload !== null) {
      status = statusOrPayload.status;
      courseEndDate = statusOrPayload.courseEndDate;
      reason = statusOrPayload.reason;
      actor = reasonOrActor || 'admin';
    } else {
      status = statusOrPayload;
      reason = reasonOrActor;
      actor = optionalActor || 'admin';
    }

    this.verifyPermission(actor, 'canManageStudents', 'updating student lifecycle status');
    const validStatuses = ['new_enrollment', 'active', 'paused', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid lifecycle status '${status}'. Must be one of: ${validStatuses.join(', ')}.`);
    }

    const store = await hydrateStore();
    const sIdx = store.students.findIndex(s => s.id === studentId);
    if (sIdx === -1) {
      throw new Error(`Student not found with ID: ${studentId}`);
    }

    const student = store.students[sIdx];
    const prevStatus = student.status;
    const batchId = student.batchId;
    const bIdx = store.batches.findIndex(b => b.id === batchId);

    const isPrevAttending = prevStatus === 'active' || prevStatus === 'new_enrollment';
    const isNewAttending = status === 'active' || status === 'new_enrollment';

    if (bIdx !== -1) {
      const bCap = Math.max(1, Number(store.batches[bIdx].capacity) || 12);
      if (isPrevAttending && !isNewAttending) {
        store.batches[bIdx].enrolledCount = Math.max(0, store.batches[bIdx].enrolledCount - 1);
        store.batches[bIdx].seatsRemaining = Math.max(0, bCap - store.batches[bIdx].enrolledCount);
      } else if (!isPrevAttending && isNewAttending) {
        if (store.batches[bIdx].enrolledCount >= bCap) {
          throw new Error(`Cannot reactivate student: Batch '${store.batches[bIdx].name}' has reached physical capacity of ${bCap} students.`);
        }
        store.batches[bIdx].enrolledCount += 1;
        store.batches[bIdx].seatsRemaining = Math.max(0, bCap - store.batches[bIdx].enrolledCount);
      }
    }

    const historyEntry = {
      fromStatus: prevStatus,
      toStatus: status,
      reason: reason || '',
      updatedAt: new Date().toISOString(),
      updatedBy: normalizeActorEmail(actor)
    };

    student.status = status;
    student.courseEndDate = courseEndDate !== undefined ? courseEndDate : (status === 'completed' || status === 'archived' ? new Date().toISOString().split('T')[0] : null);
    student.statusReason = reason || '';
    student.dropoutReason = (status === 'archived' || status === 'paused') ? (reason || 'Not specified') : null;
    student.statusUpdatedAt = new Date().toISOString();
    student.lifecycleHistory = [...(student.lifecycleHistory || []), historyEntry];
    student.updatedAt = new Date().toISOString();

    saveLocalStore(store);

    if (isLive()) {
      try {
        await updateDoc(doc(db, 'students', studentId), student);
        if (bIdx !== -1) {
          await updateDoc(doc(db, 'batches', batchId), store.batches[bIdx]);
        }
      } catch (err) {
        console.warn('Firestore updateStudentLifecycleStatus error (local update preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'STUDENT_LIFECYCLE_CHANGED',
      entityType: 'student',
      entityId: studentId,
      details: `Changed lifecycle status for '${student.studentName}' from '${prevStatus}' to '${status}'. Reason: ${reason || 'N/A'}`
    });

    return student;
  },

  async archiveStudent(studentId, actor = 'admin') {
    return this.updateStudentLifecycleStatus(studentId, { status: 'archived', reason: 'Archived by administrator' }, actor);
  },

  async restoreStudent(studentId, actor = 'admin') {
    return this.updateStudentLifecycleStatus(studentId, { status: 'active', reason: 'Restored to active status by administrator' }, actor);
  },

  async deleteStudent(studentId, actor = 'admin') {
    this.verifyPermission(actor, 'canManageStudents', 'deleting student');
    const store = await hydrateStore();
    const sIdx = store.students.findIndex(s => s.id === studentId);
    if (sIdx === -1) {
      throw new Error(`Student not found with ID: ${studentId}`);
    }

    const student = store.students[sIdx];
    const batchId = student.batchId;
    const isAttending = student.status === 'active' || student.status === 'new_enrollment';

    const bIdx = store.batches.findIndex(b => b.id === batchId);
    if (bIdx !== -1 && isAttending) {
      const bCap = Math.max(1, Number(store.batches[bIdx].capacity) || 12);
      store.batches[bIdx].enrolledCount = Math.max(0, store.batches[bIdx].enrolledCount - 1);
      store.batches[bIdx].seatsRemaining = Math.max(0, bCap - store.batches[bIdx].enrolledCount);
    }

    store.students.splice(sIdx, 1);
    store.obligations = (store.obligations || []).filter(o => o.studentId !== studentId);

    saveLocalStore(store);

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('focus_academy_students');
        if (raw) {
          const list = JSON.parse(raw);
          const next = list.filter(s => s.id !== studentId && s.phone !== student.guardianPhone);
          localStorage.setItem('focus_academy_students', JSON.stringify(next));
        }
      } catch {}
    }

    if (isLive()) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
        if (bIdx !== -1) {
          await updateDoc(doc(db, 'batches', batchId), store.batches[bIdx]);
        }
      } catch (err) {
        console.warn('Firestore deleteStudent error (local deletion preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'STUDENT_DELETED',
      entityType: 'student',
      entityId: studentId,
      details: `Deleted student record for '${student.studentName}' (${studentId}). Released seat in batch '${student.batchName || batchId}'.`
    });

    return { success: true, deletedId: studentId };
  },

  async transferStudentBatch(studentId, newBatchId, reason = 'Academic progression', actor = 'admin') {
    this.verifyPermission(actor, 'canManageStudents', 'transferring student between batches');
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

    const targetCapacity = Math.max(1, Number(targetBatch.capacity) || 12);
    if (targetBatch.enrolledCount >= targetCapacity) {
      throw new Error(`Target batch '${targetBatch.name}' is already at full capacity (${targetCapacity}/${targetCapacity} seats).`);
    }

    const oldBatchId = student.batchId;
    const oldBatchName = student.batchName;

    const store = await hydrateStore();

    const oldBIdx = store.batches.findIndex(b => b.id === oldBatchId);
    if (oldBIdx !== -1) {
      store.batches[oldBIdx].enrolledCount = Math.max(0, store.batches[oldBIdx].enrolledCount - 1);
      const oldCap = Math.max(1, Number(store.batches[oldBIdx].capacity) || 12);
      store.batches[oldBIdx].seatsRemaining = Math.max(0, oldCap - store.batches[oldBIdx].enrolledCount);
    }

    const newBIdx = store.batches.findIndex(b => b.id === newBatchId);
    if (newBIdx !== -1) {
      store.batches[newBIdx].enrolledCount += 1;
      const newCap = Math.max(1, Number(store.batches[newBIdx].capacity) || 12);
      store.batches[newBIdx].seatsRemaining = Math.max(0, newCap - store.batches[newBIdx].enrolledCount);
    }

    const sIdx = store.students.findIndex(s => s.id === studentId);
    if (sIdx !== -1) {
      store.students[sIdx].batchId = targetBatch.id;
      store.students[sIdx].batchName = targetBatch.name;
      store.students[sIdx].updatedAt = new Date().toISOString();
    }

    saveLocalStore(store);

    if (isLive()) {
      try {
        await updateDoc(doc(db, 'students', studentId), {
          batchId: targetBatch.id,
          batchName: targetBatch.name,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Firestore transferStudentBatch error (local transfer preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
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

  async applyFeeDiscount(arg1, arg2, actorArg = 'admin') {
    let studentId, discountType, amount, reason, approvingAdmin, actor;
    if (typeof arg1 === 'object' && arg1 !== null) {
      studentId = arg1.studentId;
      discountType = arg1.discountType || arg1.category;
      amount = arg1.amount;
      reason = arg1.reason;
      approvingAdmin = arg1.approvingAdmin;
      actor = actorArg || approvingAdmin || 'admin';
    } else {
      studentId = arg1;
      discountType = arg2?.discountType || arg2?.category;
      amount = arg2?.amount;
      reason = arg2?.reason;
      approvingAdmin = arg2?.approvingAdmin || actorArg;
      actor = actorArg || approvingAdmin || 'admin';
    }

    this.verifyPermission(actor, 'canApplyDiscounts', 'applying fee discounts / scholarships');

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Discount amount must be a positive number greater than zero.');
    }
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason (at least 5 characters) is mandatory for audit trail compliance.');
    }

    const validTypes = ['merit_scholarship', 'sibling_concession', 'financial_aid', 'special_waiver', 'custom_discount'];
    if (!validTypes.includes(discountType)) {
      throw new Error(`Invalid discount type '${discountType}'. Allowed types: ${validTypes.join(', ')}.`);
    }

    const store = await hydrateStore();
    const sIdx = store.students.findIndex(s => s.id === studentId);
    if (sIdx === -1) {
      throw new Error(`Student not found: ${studentId}`);
    }

    const student = store.students[sIdx];
    const cycleFee = student.feeConfig?.amountPerCycle || 0;
    if (cycleFee > 0 && parsedAmount > cycleFee) {
      throw new Error(`Discount amount (₹${parsedAmount}) cannot exceed the billing cycle fee of ₹${cycleFee}.`);
    }

    const prevDiscount = student.feeConfig?.discountAdjustment || 0;

    const adjustmentEntry = {
      id: `ADJ-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      discountType,
      category: discountType,
      amount: parsedAmount,
      previousDiscount: prevDiscount,
      reason: reason.trim(),
      approvingAdmin: approvingAdmin || normalizeActorEmail(actor),
      approvedBy: approvingAdmin || normalizeActorEmail(actor),
      recordedBy: normalizeActorEmail(actor)
    };

    student.feeConfig = {
      ...student.feeConfig,
      discountAdjustment: parsedAmount,
      discountCategory: discountType,
      adjustmentHistory: [...(student.feeConfig?.adjustmentHistory || []), adjustmentEntry],
      discountHistory: [...(student.feeConfig?.discountHistory || []), adjustmentEntry]
    };
    student.updatedAt = new Date().toISOString();

    const diff = parsedAmount - prevDiscount;
    if (diff > 0) {
      for (const obl of store.obligations) {
        if (obl.studentId === studentId && obl.status !== 'paid' && obl.status !== 'cancelled') {
          if (obl.originalAmountDue === undefined && obl.originalAmount === undefined) {
            obl.originalAmountDue = obl.amountDue;
            obl.originalAmount = obl.amountDue;
          }
          obl.discountAmount = (obl.discountAmount || 0) + diff;
          obl.amountDue = Math.max(0, obl.amountDue - diff);
          obl.balance = Math.max(0, obl.amountDue - (obl.amountPaid || 0) - (obl.waivedAmount || 0));
          if (obl.balance === 0) obl.status = 'paid';
          obl.updatedAt = new Date().toISOString();
        }
      }
    }

    saveLocalStore(store);

    if (isLive()) {
      try {
        await updateDoc(doc(db, 'students', studentId), student);
      } catch (err) {
        console.warn('Firestore applyFeeDiscount error (local discount preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'FEE_DISCOUNT_APPLIED',
      entityType: 'student',
      entityId: studentId,
      details: `Applied ${discountType.replace(/_/g, ' ')} of ₹${parsedAmount} for '${student.studentName}'. Reason: ${reason} (Approved by: ${approvingAdmin || actor}).`
    });

    Object.assign(student, { student, adjustmentEntry });
    return student;
  },

  async updateNotificationPreferences(studentId, { communicationConsent, preferredChannel, remindersDisabled, reminderDisabledReason, reminderTimingDays }, actor = 'admin') {
    this.verifyPermission(actor, 'canManageStudents', 'updating notification preferences');
    const store = await hydrateStore();
    const sIdx = store.students.findIndex(s => s.id === studentId);
    if (sIdx === -1) throw new Error(`Student not found: ${studentId}`);

    const student = store.students[sIdx];
    student.notificationPreferences = {
      communicationConsent: communicationConsent !== undefined ? Boolean(communicationConsent) : true,
      preferredChannel: preferredChannel || student.notificationPreferences?.preferredChannel || 'whatsapp',
      remindersDisabled: remindersDisabled !== undefined ? Boolean(remindersDisabled) : false,
      reminderDisabledReason: reminderDisabledReason || '',
      reminderTimingDays: reminderTimingDays !== undefined ? Number(reminderTimingDays) : (student.notificationPreferences?.reminderTimingDays || 3)
    };
    student.updatedAt = new Date().toISOString();

    saveLocalStore(store);

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'NOTIFICATION_PREFERENCES_UPDATED',
      entityType: 'student',
      entityId: studentId,
      details: `Updated reminder preferences for '${student.studentName}': Reminders ${student.notificationPreferences.remindersDisabled ? 'DISABLED (' + student.notificationPreferences.reminderDisabledReason + ')' : 'ENABLED'}.`
    });

    return student;
  },

  async getFeeObligations(studentId = null) {
    if (isLive()) {
      try {
        let q;
        if (studentId) {
          q = query(collection(db, 'fee_obligations'), where('studentId', '==', studentId));
        } else {
          q = collection(db, 'fee_obligations');
        }
        const snap = await this.withFirestoreTimeout(getDocs(q), 8000);
        if (snap && !snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getFeeObligations unavailable, using cached store:', err);
      }
    }
    const store = await hydrateStore();
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
    this.verifyPermission(actor, 'canWaiveFees', 'generating fee obligation');
    const store = await hydrateStore();
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

    if (isLive()) {
      try {
        const q = query(
          collection(db, 'fee_obligations'),
          where('studentId', '==', obligationData.studentId),
          where('billingCycle', '==', obligationData.billingCycle)
        );
        const snap = await this.withFirestoreTimeout(getDocs(q), 8000);
        const duplicate = (snap ? snap.docs : []).find(d => (d.data().status || 'pending') !== 'cancelled');
        if (duplicate) {
          return { id: duplicate.id, ...duplicate.data() };
        }
      } catch (err) {
        console.error('Firestore createFeeObligation duplicate check failed:', err);
        throw dataUnavailable(err);
      }
    }

    const obligationYear = new Date().getFullYear();
    let nextNum = store.obligations.length + 101;
    let cleanId = obligationData.id || `OBL-${obligationYear}-${nextNum}`;
    if (!obligationData.id) {
      const idTaken = async (candidate) => {
        if (store.obligations.some(o => o.id === candidate)) return true;
        if (!isLive()) return false;
        try {
          const snap = await this.withFirestoreTimeout(getDoc(doc(db, 'fee_obligations', candidate)), 8000);
          return snap.exists();
        } catch (err) {
          console.error('Firestore fee obligation ID availability check failed:', err);
          throw dataUnavailable(err);
        }
      };
      while (await idTaken(cleanId)) {
        nextNum += 1;
        cleanId = `OBL-${obligationYear}-${nextNum}`;
      }
    }
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

    store.obligations.push(newObligation);
    saveLocalStore(store);

    if (isLive()) {
      try {
        await setDoc(doc(db, 'fee_obligations', newObligation.id), newObligation);
      } catch (err) {
        console.warn('Firestore createFeeObligation error (local obligation preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'FEE_OBLIGATION_GENERATED',
      entityType: 'fee_obligation',
      entityId: newObligation.id,
      details: `Generated fee obligation ₹${amountDue} for '${newObligation.studentName}' (${newObligation.billingCycle}).`
    });

    return newObligation;
  },

  async generateMonthlyFeeCycle(activeStudents, cycleName, nextDueDate, actor = 'admin') {
    this.verifyPermission(actor, 'canWaiveFees', 'generating bulk monthly fee cycle');
    const store = await hydrateStore();
    const existingObligations = await this.getFeeObligations();
    const existingStudentIds = new Set(
      existingObligations
        .filter(o => o.billingCycle === cycleName && o.status !== 'cancelled')
        .map(o => o.studentId)
    );

    const eligibleStudents = activeStudents.filter(s => !existingStudentIds.has(s.id));
    if (eligibleStudents.length === 0) {
      return { createdCount: 0, skippedCount: activeStudents.length };
    }

    const createdObligations = [];
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    let nextNum = store.obligations.length + 101;

    for (const student of eligibleStudents) {
      const amount = Math.max(0, (student.feeConfig?.amountPerCycle || 2000) - (student.feeConfig?.discountAdjustment || 0));
      const cleanId = `OBL-2026-${nextNum++}`;
      createdObligations.push({
        id: cleanId,
        studentId: student.id,
        studentName: student.studentName,
        batchId: student.batchId,
        billingCycle: cycleName,
        dueDate: nextDueDate,
        amountDue: amount,
        amountPaid: 0,
        waivedAmount: 0,
        balance: amount,
        status: today > nextDueDate ? 'overdue' : 'pending',
        notes: `Bulk cycle generation for ${cycleName}`,
        createdAt: now,
        updatedAt: now
      });
    }

    if (isLive() && createdObligations.length > 0) {
      try {
        const chunkSize = 400;
        for (let i = 0; i < createdObligations.length; i += chunkSize) {
          const chunk = createdObligations.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach(obl => {
            batch.set(doc(db, 'fee_obligations', obl.id), obl);
          });
          await batch.commit();
        }
      } catch (err) {
        console.error('Firestore batch cycle generation error:', err);
        throw new Error(`Failed to commit batch fee obligations: ${err.message}`);
      }
    }

    store.obligations.push(...createdObligations);
    saveLocalStore(store);

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'FEE_CYCLE_GENERATED',
      entityType: 'fee_obligation',
      entityId: `CYCLE-${cycleName.replace(/\s+/g, '-')}`,
      details: `Generated ${createdObligations.length} monthly fee obligations for '${cycleName}'.`
    });

    return { createdCount: createdObligations.length, skippedCount: activeStudents.length - eligibleStudents.length };
  },

  async waiveFeeObligation(obligationId, waiveAmount, reason, actor = 'admin') {
    this.verifyPermission(actor, 'canWaiveFees', 'waiving fee obligation');
    if (!reason || reason.trim().length < 5) {
      throw new Error('A detailed reason (at least 5 characters) is required to waive fees.');
    }

    const store = await hydrateStore();
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
    obl.waivedBy = normalizeActorEmail(actor);
    obl.waivedAt = new Date().toISOString();
    obl.updatedAt = new Date().toISOString();

    saveLocalStore(store);

    if (isLive()) {
      try {
        await updateDoc(doc(db, 'fee_obligations', obligationId), obl);
      } catch (err) {
        console.warn('Firestore waiveFeeObligation error (local waiver preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'FEE_WAIVED',
      entityType: 'fee_obligation',
      entityId: obligationId,
      details: `Waived ₹${amount} for '${obl.studentName}' on obligation ${obligationId}. Reason: ${reason}`
    });

    return obl;
  },

  async getPayments(studentId = null) {
    if (isLive()) {
      try {
        let q;
        if (studentId) {
          q = query(collection(db, 'payments'), where('studentId', '==', studentId));
        } else {
          q = collection(db, 'payments');
        }
        const snap = await this.withFirestoreTimeout(getDocs(q), 8000);
        if (snap && !snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err) {
        console.warn('Firestore getPayments unavailable, using cached store:', err);
      }
    }
    const store = await hydrateStore();
    if (studentId) {
      return (store.payments || []).filter(p => p.studentId === studentId);
    }
    return store.payments || [];
  },

  async recordPayment(paymentData, actor = 'admin') {
    this.verifyPermission(actor, 'canRecordPayments', 'recording financial payment');
    const amount = Number(paymentData.amount);
    if (!amount || amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    if (isLive()) {
      return this.recordPaymentLive(paymentData, amount, actor);
    }

    const store = await hydrateStore();
    const oblIdx = store.obligations.findIndex(o => o.id === paymentData.obligationId);
    if (oblIdx === -1) {
      throw new Error(`Fee obligation not found: ${paymentData.obligationId}`);
    }

    const obligation = store.obligations[oblIdx];
    const currentBalance = Math.max(0, obligation.amountDue - (obligation.amountPaid || 0) - (obligation.waivedAmount || 0));

    if (paymentData.id) {
      const existingById = store.payments.find(p => p.id === paymentData.id);
      if (existingById) {
        return Object.assign(existingById, { payment: existingById, obligation });
      }
    }
    if (paymentData.referenceNumber) {
      const existingByRef = store.payments.find(
        p => p.referenceNumber === paymentData.referenceNumber && p.obligationId === paymentData.obligationId
      );
      if (existingByRef) {
        return Object.assign(existingByRef, { payment: existingByRef, obligation });
      }

      if (!String(paymentData.referenceNumber).startsWith('REF-')) {
        const cleanRef = String(paymentData.referenceNumber).trim().toLowerCase();
        const crossDuplicate = store.payments.find(p => 
          !p.isReversed && 
          !p.reversed && 
          p.referenceNumber && 
          !String(p.referenceNumber).startsWith('REF-') &&
          String(p.referenceNumber).trim().toLowerCase() === cleanRef
        );
        if (crossDuplicate) {
          throw new Error(
            `Duplicate Transaction Reference: "${paymentData.referenceNumber}" has already been recorded on receipt #${crossDuplicate.receiptNumber} for student ${crossDuplicate.studentName || crossDuplicate.studentId}. Duplicate transaction references are blocked across the institute.`
          );
        }
      }
    }

    if (amount > currentBalance) {
      throw new Error(`Payment amount (₹${amount}) exceeds the remaining balance of ₹${currentBalance}.`);
    }

    const settings = this.getSettingsSync();
    const nextReceiptNum = store.payments.length + 1;
    const year = new Date().getFullYear();
    const prefix = settings.receiptPrefix || 'REC';
    const receiptNumber = paymentData.receiptNumber || `${prefix}-${year}-${String(nextReceiptNum).padStart(4, '0')}`;
    const transactionId = paymentData.id || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const newPayment = {
      id: transactionId,
      receiptNumber,
      studentId: obligation.studentId,
      studentName: obligation.studentName,
      batchId: obligation.batchId,
      obligationId: obligation.id,
      enrollmentId: paymentData.enrollmentId || obligation.enrollmentId || null,
      amount,
      paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: paymentData.paymentMethod || 'cash',
      referenceNumber: paymentData.referenceNumber || `REF-${Date.now().toString(36).toUpperCase()}`,
      gatewayTransactionId: paymentData.gatewayTransactionId ||
        (paymentData.referenceNumber && !String(paymentData.referenceNumber).startsWith('REF-') ? String(paymentData.referenceNumber) : null),
      verificationStatus: paymentData.verificationStatus || 'verified',
      status: 'verified',
      receiptStatus: 'issued',
      refundStatus: 'none',
      recordedBy: normalizeActorEmail(actor),
      notes: paymentData.notes || '',
      createdAt: new Date().toISOString()
    };

    obligation.amountPaid = (obligation.amountPaid || 0) + amount;
    obligation.balance = Math.max(0, obligation.amountDue - obligation.amountPaid - (obligation.waivedAmount || 0));
    obligation.status = obligation.balance === 0 ? 'paid' : 'partially_paid';
    obligation.updatedAt = new Date().toISOString();

    store.payments.push(newPayment);
    saveLocalStore(store);

    if (isLive()) {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'payments', newPayment.id), newPayment);
        batch.update(doc(db, 'fee_obligations', obligation.id), obligation);
        await batch.commit();
      } catch (err) {
        console.warn('Firestore recordPayment error (local payment preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'PAYMENT_RECORDED',
      entityType: 'payment',
      entityId: newPayment.id,
      details: `Recorded payment ₹${amount} for '${obligation.studentName}' (${obligation.billingCycle}). Receipt: ${receiptNumber}`
    });

    Object.assign(newPayment, { payment: newPayment, obligation });
    return newPayment;
  },

  async recordPaymentLive(paymentData, amount, actor) {
    const actorEmail = normalizeActorEmail(actor);
    const settings = await this.getSettings();
    const prefix = settings.receiptPrefix || 'REC';
    const year = new Date().getFullYear();
    const paymentId = paymentData.id || uid('TXN');
    const refText = String(paymentData.referenceNumber || '').trim();
    const refKey = refText && !refText.startsWith('REF-') ? refText.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100) : '';

    const paymentRef = doc(db, 'payments', paymentId);
    const obligationRef = doc(db, 'fee_obligations', String(paymentData.obligationId));
    const counterRef = doc(db, 'counters', `receipts-${year}`);
    const refDoc = refKey ? doc(db, 'payment_refs', refKey) : null;

    try {
      return await runTransaction(db, async (tx) => {
        const [paySnap, oblSnap, counterSnap, refSnap] = await Promise.all([
          tx.get(paymentRef),
          tx.get(obligationRef),
          tx.get(counterRef),
          refDoc ? tx.get(refDoc) : Promise.resolve(null)
        ]);

        if (paySnap.exists()) {
          const existing = paySnap.data();
          return Object.assign({}, existing, { payment: existing, obligation: oblSnap.exists() ? oblSnap.data() : null });
        }
        if (!oblSnap.exists()) {
          throw new Error(`Fee obligation not found: ${paymentData.obligationId}`);
        }
        if (refSnap && refSnap.exists()) {
          throw new Error(`Duplicate Transaction Reference: "${refText}" has already been recorded on receipt #${refSnap.data().receiptNumber}. Duplicate transaction references are blocked across the institute.`);
        }

        const obligation = oblSnap.data();
        const currentBalance = Math.max(0, obligation.amountDue - (obligation.amountPaid || 0) - (obligation.waivedAmount || 0));
        if (amount > currentBalance) {
          throw new Error(`Payment amount (₹${amount}) exceeds the remaining balance of ₹${currentBalance}.`);
        }

        const nextNumber = (counterSnap.exists() ? counterSnap.data().value : 0) + 1;
        const receiptNumber = `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
        const now = new Date().toISOString();

        const newPayment = {
          id: paymentId,
          receiptNumber,
          studentId: obligation.studentId,
          studentName: obligation.studentName,
          batchId: obligation.batchId,
          obligationId: obligation.id,
          enrollmentId: paymentData.enrollmentId || obligation.enrollmentId || null,
          amount,
          paymentDate: paymentData.paymentDate || now.split('T')[0],
          paymentMethod: paymentData.paymentMethod || 'cash',
          referenceNumber: refText || uid('REF'),
          gatewayTransactionId: paymentData.gatewayTransactionId || (refText && !refText.startsWith('REF-') ? refText : null),
          verificationStatus: paymentData.verificationStatus || 'verified',
          status: 'verified',
          receiptStatus: 'issued',
          refundStatus: 'none',
          recordedBy: actorEmail,
          notes: paymentData.notes || '',
          createdAt: now
        };

        const amountPaid = (obligation.amountPaid || 0) + amount;
        const balance = Math.max(0, obligation.amountDue - amountPaid - (obligation.waivedAmount || 0));
        const updatedObligation = {
          ...obligation,
          amountPaid,
          balance,
          status: balance === 0 ? 'paid' : 'partially_paid',
          updatedAt: now
        };

        const audit = buildAudit({
          actor: actorEmail,
          action: 'PAYMENT_RECORDED',
          entityType: 'payment',
          entityId: paymentId,
          details: `Recorded payment ₹${amount} for '${obligation.studentName}' (${obligation.billingCycle}). Receipt: ${receiptNumber}`
        });

        tx.set(paymentRef, newPayment);
        tx.set(obligationRef, updatedObligation);
        tx.set(counterRef, { value: nextNumber });
        if (refDoc) tx.set(refDoc, { paymentId, receiptNumber });
        tx.set(doc(db, 'audit_logs', audit.id), audit);

        return Object.assign({}, newPayment, { payment: newPayment, obligation: updatedObligation });
      });
    } catch (err) {
      if (err.code === 'unavailable' || err.code === 'deadline-exceeded' || err.code === 'permission-denied') {
        throw dataUnavailable(err);
      }
      throw err;
    }
  },

  async reversePaymentLive(paymentId, reason, actor) {
    const actorEmail = normalizeActorEmail(actor);
    const paymentRef = doc(db, 'payments', paymentId);
    try {
      return await runTransaction(db, async (tx) => {
        const paySnap = await tx.get(paymentRef);
        if (!paySnap.exists()) throw new Error(`Payment transaction not found: ${paymentId}`);
        const payment = paySnap.data();
        if (payment.isReversed || payment.reversed) {
          throw new Error(`Payment ${paymentId} (${payment.receiptNumber}) has already been reversed.`);
        }
        const obligationRef = doc(db, 'fee_obligations', payment.obligationId);
        const refKey = String(payment.referenceNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100);
        const hasTrackedRef = refKey && !String(payment.referenceNumber).startsWith('REF-');
        const refDoc = hasTrackedRef ? doc(db, 'payment_refs', refKey) : null;
        const [oblSnap, refSnap] = await Promise.all([tx.get(obligationRef), refDoc ? tx.get(refDoc) : Promise.resolve(null)]);
        if (!oblSnap.exists()) throw new Error(`Associated fee obligation not found: ${payment.obligationId}`);

        const obligation = oblSnap.data();
        const amountPaid = Math.max(0, (obligation.amountPaid || 0) - Number(payment.amount || 0));
        const balance = Math.max(0, obligation.amountDue - amountPaid - (obligation.waivedAmount || 0));
        const today = new Date().toISOString().split('T')[0];
        let status;
        if (balance === 0) status = (obligation.waivedAmount > 0 && amountPaid === 0) ? 'waived' : 'paid';
        else if (amountPaid > 0) status = 'partially_paid';
        else status = today > obligation.dueDate ? 'overdue' : 'pending';

        const now = new Date().toISOString();
        const updatedPayment = { ...payment, isReversed: true, reversed: true, reversalReason: reason.trim(), reversedBy: actorEmail, reversedAt: now, status: 'reversed', verificationStatus: payment.verificationStatus || 'verified', refundStatus: 'reversed' };
        const updatedObligation = { ...obligation, amountPaid, balance, status, updatedAt: now };
        const audit = buildAudit({
          actor: actorEmail,
          action: 'PAYMENT_REVERSED',
          entityType: 'payment',
          entityId: paymentId,
          details: `Reversed payment of ₹${payment.amount} (Receipt: ${payment.receiptNumber}) for '${obligation.studentName}'. Reason: ${reason.trim()}`
        });

        tx.update(paymentRef, { isReversed: true, reversed: true, reversalReason: updatedPayment.reversalReason, reversedBy: actorEmail, reversedAt: now, status: 'reversed', refundStatus: 'reversed' });
        tx.set(obligationRef, updatedObligation);
        if (refDoc && refSnap && refSnap.exists()) tx.delete(refDoc);
        tx.set(doc(db, 'audit_logs', audit.id), audit);

        return { success: true, payment: updatedPayment, obligation: updatedObligation };
      });
    } catch (err) {
      if (err.code === 'unavailable' || err.code === 'deadline-exceeded' || err.code === 'permission-denied') {
        throw dataUnavailable(err);
      }
      throw err;
    }
  },

  async recordFeePayment(paymentData, actor = 'admin') {
    return this.recordPayment(paymentData, actor);
  },

  async reversePayment(paymentId, reason, actor = 'admin') {
    this.verifyPermission(actor, 'canRecordPayments', 'reversing financial payment');
    if (!paymentId) {
      throw new Error('Payment ID is required to reverse payment.');
    }
    if (!reason || String(reason).trim().length < 5) {
      throw new Error('A detailed audit reason (at least 5 characters) is required to reverse a payment.');
    }

    if (isLive()) {
      return this.reversePaymentLive(paymentId, reason, actor);
    }

    const store = await hydrateStore();
    const payment = store.payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error(`Payment transaction not found: ${paymentId}`);
    }
    if (payment.isReversed || payment.reversed) {
      throw new Error(`Payment ${paymentId} (${payment.receiptNumber}) has already been reversed.`);
    }

    const oblIdx = store.obligations.findIndex(o => o.id === payment.obligationId);
    if (oblIdx === -1) {
      throw new Error(`Associated fee obligation not found: ${payment.obligationId}`);
    }

    const obligation = store.obligations[oblIdx];
    const reverseAmount = Number(payment.amount) || 0;

    obligation.amountPaid = Math.max(0, (obligation.amountPaid || 0) - reverseAmount);
    obligation.balance = Math.max(0, obligation.amountDue - obligation.amountPaid - (obligation.waivedAmount || 0));

    const today = new Date().toISOString().split('T')[0];
    if (obligation.balance === 0) {
      obligation.status = (obligation.waivedAmount > 0 && obligation.amountPaid === 0) ? 'waived' : 'paid';
    } else if (obligation.amountPaid > 0) {
      obligation.status = 'partially_paid';
    } else {
      obligation.status = (obligation.balance > 0 && today > obligation.dueDate) ? 'overdue' : 'pending';
    }
    obligation.updatedAt = new Date().toISOString();

    const timestamp = new Date().toISOString();
    const actorEmail = normalizeActorEmail(actor);
    payment.isReversed = true;
    payment.reversed = true;
    payment.reversalReason = reason.trim();
    payment.reversedBy = actorEmail;
    payment.reversedAt = timestamp;
    payment.status = 'reversed';
    payment.refundStatus = 'reversed';

    saveLocalStore(store);

    if (isLive()) {
      try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'payments', payment.id), payment);
        batch.update(doc(db, 'fee_obligations', obligation.id), obligation);
        await batch.commit();
      } catch (err) {
        console.warn('Firestore reversePayment error (local reversal preserved):', err);
      }
    }

    await this.logAudit({
      actor: actorEmail,
      action: 'PAYMENT_REVERSED',
      entityType: 'payment',
      entityId: payment.id,
      details: `Reversed payment of ₹${reverseAmount} (Receipt: ${payment.receiptNumber}) for '${obligation.studentName}'. Reason: ${reason.trim()}`
    });

    return {
      success: true,
      payment,
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
    const activePayments = payments.filter(p => !p.isReversed && !p.reversed);

    const totalFeesCharged = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
    const totalAmountPaid = activePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
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

  async getActiveTillSession(_actor = 'admin') {
    if (isLive()) {
      try {
        const q = query(collection(db, 'till_sessions'), where('status', '==', 'open'), limit(1));
        const snap = await this.withFirestoreTimeout(getDocs(q), 8000);
        if (snap && !snap.empty) {
          return { ...snap.docs[0].data(), id: snap.docs[0].id };
        }
        return null;
      } catch (err) {
        console.warn('Firestore getActiveTillSession unavailable, using cached store:', err);
      }
    }
    const store = await hydrateStore();
    return (store.tillSessions || []).find(s => s.status === 'open') || null;
  },

  async openTillSession(initialFloatOrOptions = 0, notesOrActor = '', maybeActor = 'admin') {
    let initialFloat = 0;
    let notes = '';
    let actor = maybeActor;

    if (typeof initialFloatOrOptions === 'object' && initialFloatOrOptions !== null) {
      initialFloat = initialFloatOrOptions.openingFloat;
      notes = initialFloatOrOptions.notes || '';
      actor = notesOrActor || maybeActor || 'admin';
    } else {
      initialFloat = initialFloatOrOptions;
      notes = typeof notesOrActor === 'string' ? notesOrActor : '';
      actor = maybeActor || 'admin';
    }

    this.verifyPermission(actor, 'canRecordPayments', 'opening till cash session');
    const floatAmount = Number(initialFloat);
    if (isNaN(floatAmount) || floatAmount < 0) {
      throw new Error('Opening cash float must be a non-negative amount.');
    }

    const existing = await this.getActiveTillSession(actor);
    if (existing) {
      throw new Error(`A cash drawer session is already open (Opened by ${existing.openedBy} at ${existing.openedAt}). Please close the active session before opening a new one.`);
    }

    const actorEmail = normalizeActorEmail(actor);
    const session = {
      id: `TILL-${Date.now().toString(36).toUpperCase()}`,
      status: 'open',
      date: new Date().toISOString().split('T')[0],
      openedAt: new Date().toISOString(),
      openedBy: actorEmail,
      openingFloat: floatAmount,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    if (isLive()) {
      try {
        await this.withFirestoreTimeout(setDoc(doc(db, 'till_sessions', session.id), session), 8000);
      } catch (err) {
        console.error('Firestore openTillSession failed:', err);
        throw dataUnavailable(err);
      }
      try {
        const check = await this.withFirestoreTimeout(getDoc(doc(db, 'till_sessions', session.id)), 8000);
        if (!check.exists()) throw new Error('missing_till_session');
      } catch (err) {
        console.error('Firestore openTillSession verification failed:', err);
        throw new Error('The cash drawer session could not be confirmed in the database. Nothing was changed — please try again.');
      }
    }

    const store = await hydrateStore();
    if (!store.tillSessions) store.tillSessions = [];
    store.tillSessions.unshift(session);
    saveLocalStore(store);

    await this.logAudit({
      actor: actorEmail,
      action: 'TILL_SESSION_OPENED',
      entityType: 'till_session',
      entityId: session.id,
      details: `Opened cash till drawer with float of ₹${session.openingFloat}.`
    });

    return session;
  },

  async getTillSessionSummary(sessionId) {
    const sessions = await this.getTillSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Till session not found: ${sessionId}`);
    }

    const payments = await this.getPayments();
    const sessionPayments = payments.filter(p => {
      if (p.createdAt < session.openedAt) return false;
      if (session.closedAt && p.createdAt > session.closedAt) return false;
      return true;
    });

    const activePayments = sessionPayments.filter(p => !p.isReversed && !p.reversed);
    const reversedPayments = sessionPayments.filter(p => p.isReversed || p.reversed);

    const cashCollected = activePayments.filter(p => p.paymentMethod === 'cash').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const upiCollected = activePayments.filter(p => p.paymentMethod === 'upi' || p.paymentMethod === 'upi_online').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const bankCollected = activePayments.filter(p => p.paymentMethod === 'bank_transfer').reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalCollected = activePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const reversedCash = reversedPayments.filter(p => p.paymentMethod === 'cash').reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const expectedCashInDrawer = Math.max(0, session.openingFloat + cashCollected - reversedCash);

    return {
      session,
      openingFloat: session.openingFloat,
      cashCollected,
      upiCollected,
      bankCollected,
      totalCollected,
      reversedCash,
      expectedCashInDrawer,
      transactionCount: activePayments.length,
      cashTransactionCount: activePayments.filter(p => p.paymentMethod === 'cash').length,
      payments: activePayments
    };
  },

  async closeTillSession(sessionId, detailsOrDenominations = {}, notesOrOptions = '', maybeActor = 'admin') {
    let closingCashActual;
    let denominations = null;
    let notes = '';
    let handedOverTo = 'Managing Director';
    let actor = maybeActor;

    if (typeof detailsOrDenominations === 'object' && detailsOrDenominations !== null && detailsOrDenominations.closingCashActual !== undefined) {
      closingCashActual = Number(detailsOrDenominations.closingCashActual);
      handedOverTo = detailsOrDenominations.handedOverTo || 'Managing Director';
      notes = detailsOrDenominations.closingNotes || '';
      denominations = detailsOrDenominations.denominations || null;
      actor = notesOrOptions || maybeActor || 'admin';
    } else {
      denominations = detailsOrDenominations || {};
      notes = typeof notesOrOptions === 'string' ? notesOrOptions : '';
      actor = maybeActor || 'admin';
      const d500 = Number(denominations.d500) || 0;
      const d200 = Number(denominations.d200) || 0;
      const d100 = Number(denominations.d100) || 0;
      const d50 = Number(denominations.d50) || 0;
      const d20 = Number(denominations.d20) || 0;
      const d10 = Number(denominations.d10) || 0;
      const coins = Number(denominations.coins) || 0;
      closingCashActual = (d500 * 500) + (d200 * 200) + (d100 * 100) + (d50 * 50) + (d20 * 20) + (d10 * 10) + coins;
    }

    this.verifyPermission(actor, 'canRecordPayments', 'closing cash drawer till session');
    const actorEmail = normalizeActorEmail(actor);
    const store = await hydrateStore();
    const payments = await this.getPayments();

    let session = (store.tillSessions || []).find(s => s.id === sessionId);
    if (!session && isLive()) {
      try {
        const snap = await getDocs(query(collection(db, 'till_sessions'), where('id', '==', sessionId)));
        if (!snap.empty) session = snap.docs[0].data();
      } catch {}
    }
    if (!session) {
      throw new Error(`Till session ${sessionId} not found.`);
    }
    if (session.status !== 'open') {
      throw new Error(`Till session ${sessionId} is already closed.`);
    }

    const actual = Number(closingCashActual);
    if (isNaN(actual) || actual < 0) {
      throw new Error('Closing cash actual count must be a non-negative amount.');
    }

    const openTime = new Date(session.openedAt).getTime();
    const cashPaymentsInSession = payments.filter(p => {
      if (p.isReversed || p.reversed || p.paymentMethod !== 'cash') return false;
      const pTime = new Date(p.createdAt || p.paymentDate).getTime();
      return pTime >= openTime;
    });

    const cashReceiptsSum = cashPaymentsInSession.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const openingFloat = Number(session.openingFloat) || 0;
    const expectedCash = openingFloat + cashReceiptsSum;
    const variance = actual - expectedCash;
    const now = new Date().toISOString();

    const updatedSession = {
      ...session,
      status: 'closed',
      closedAt: now,
      closedBy: actorEmail,
      closingNotes: notes.trim(),
      handedOverTo,
      denominations,
      closingCashActual: actual,
      countedCash: actual,
      cashReceiptsSum,
      openingFloat,
      expectedCash,
      expectedDrawerCash: expectedCash,
      variance,
      difference: variance,
      cashTransactionsCount: cashPaymentsInSession.length,
      updatedAt: now
    };

    if (isLive()) {
      try {
        await this.withFirestoreTimeout(setDoc(doc(db, 'till_sessions', sessionId), updatedSession), 8000);
      } catch (err) {
        console.error('Firestore closeTillSession error:', err);
      }
    }

    if (!store.tillSessions) store.tillSessions = [];
    const idx = store.tillSessions.findIndex(s => s.id === sessionId);
    if (idx !== -1) store.tillSessions[idx] = updatedSession;
    else store.tillSessions.unshift(updatedSession);
    saveLocalStore(store);

    await this.logAudit({
      actor: actorEmail,
      action: 'TILL_SESSION_CLOSED',
      entityType: 'till_session',
      entityId: sessionId,
      details: `Settled till drawer. Counted: ₹${actual}, Expected: ₹${expectedCash}, Variance: ₹${variance} (${variance === 0 ? 'Exact' : variance > 0 ? 'Surplus' : 'Deficit'}).`
    });

    return updatedSession;
  },

  async getTillSessions() {
    if (isLive()) {
      try {
        const q = query(collection(db, 'till_sessions'), orderBy('openedAt', 'desc'), limit(50));
        const snap = await this.withFirestoreTimeout(getDocs(q), 8000);
        if (snap && !snap.empty) {
          return snap.docs.map(d => ({ ...d.data(), id: d.id }));
        }
      } catch (err) {
        console.warn('Firestore getTillSessions unavailable, using cached store:', err);
      }
    }
    const store = await hydrateStore();
    return (store.tillSessions || []).sort((a, b) => (b.openedAt || '').localeCompare(a.openedAt || ''));
  },

  async getDashboardMetrics() {
    const [batches, students, obligations, payments, leads, enrollments] = await Promise.all([
      this.getBatches().catch(() => []),
      this.getStudents().catch(() => []),
      this.getFeeObligations().catch(() => []),
      this.getPayments().catch(() => []),
      this.getLeads().catch(() => []),
      this.getEnrollments().catch(() => [])
    ]);
    const activePayments = payments.filter(p => !p.isReversed && !p.reversed);

    const activeStudents = students.filter(s => s.status === 'active' || s.status === 'new_enrollment');
    const activeBatches = batches.filter(b => !b.isArchived);

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    const feesCollectedThisMonth = activePayments
      .filter(p => p.paymentDate && p.paymentDate.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const totalFeesCharged = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
    const totalAmountPaid = activePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalWaived = obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
    const totalOutstandingFees = Math.max(0, totalFeesCharged - totalAmountPaid - totalWaived);

    const overdueObligations = obligations.filter(o => o.status === 'overdue' || (o.balance > 0 && today > o.dueDate));
    const totalOverdueFees = overdueObligations.reduce((sum, o) => sum + Number(o.balance || 0), 0);

    const paymentsDueToday = obligations.filter(o => o.balance > 0 && o.dueDate === today);
    const upcomingPayments = obligations.filter(o => o.balance > 0 && o.dueDate > today);

    const recentPayments = [...payments]
      .sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''))
      .slice(0, 10);

    const totalEnrollments = (enrollments && enrollments.length > 0)
      ? enrollments.length
      : (leads || []).filter(l => l.source === 'enrollment' || l.reservationId).length;
    const totalInquiries = (leads || []).filter(l => l.source !== 'enrollment' && !l.reservationId).length;
    const pendingAdmissions = (leads || []).filter(l => l.status === 'new' || l.status === 'contacted').length;

    return {
      totalActiveStudents: activeStudents.length,
      totalActiveBatches: activeBatches.length,
      feesCollectedThisMonth,
      totalOutstandingFees,
      totalOverdueFees,
      paymentsDueTodayCount: paymentsDueToday.length,
      upcomingPaymentsCount: upcomingPayments.length,
      recentPayments,
      totalEnrollments,
      totalInquiries,
      pendingAdmissions
    };
  },

  async getAdminCollectionReport() {
    const payments = await this.getPayments();
    const byAdmin = {};
    for (const p of payments) {
      if (p.isReversed || p.reversed) continue;
      const admin = p.recordedBy || 'admin';
      const cleanAdminKey = admin.includes('@') ? admin.split('@')[0] : admin;
      if (!byAdmin[cleanAdminKey]) {
        byAdmin[cleanAdminKey] = {
          admin: cleanAdminKey,
          adminEmail: admin.includes('@') ? admin : `${admin}@focusacademyperambalur.com`,
          totalCollected: 0,
          transactionCount: 0,
          cashTotal: 0,
          upiTotal: 0,
          bankTotal: 0,
          cardTotal: 0,
          lastCollectedDate: null,
          transactions: []
        };
      }
      const amt = Number(p.amount || 0);
      byAdmin[cleanAdminKey].totalCollected += amt;
      byAdmin[cleanAdminKey].transactionCount += 1;
      if (p.paymentMethod === 'cash') byAdmin[cleanAdminKey].cashTotal += amt;
      else if (p.paymentMethod === 'upi_online' || p.paymentMethod === 'upi') byAdmin[cleanAdminKey].upiTotal += amt;
      else if (p.paymentMethod === 'bank_transfer') byAdmin[cleanAdminKey].bankTotal += amt;
      else if (p.paymentMethod === 'card') byAdmin[cleanAdminKey].cardTotal += amt;

      if (!byAdmin[cleanAdminKey].lastCollectedDate || p.paymentDate > byAdmin[cleanAdminKey].lastCollectedDate) {
        byAdmin[cleanAdminKey].lastCollectedDate = p.paymentDate;
      }
      byAdmin[cleanAdminKey].transactions.push(p);
    }
    return Object.values(byAdmin).sort((a, b) => b.totalCollected - a.totalCollected);
  },

  async getDailyCollectionReport(startDate = null, endDate = null) {
    const payments = await this.getPayments();
    const byDate = {};
    for (const p of payments) {
      if (p.isReversed || p.reversed) continue;
      const date = p.paymentDate || 'Unknown Date';
      if (startDate && date < startDate) continue;
      if (endDate && date > endDate) continue;

      if (!byDate[date]) {
        byDate[date] = {
          date,
          total: 0,
          totalCollected: 0,
          transactionCount: 0,
          cashTotal: 0,
          upiTotal: 0,
          bankTotal: 0,
          cardTotal: 0,
          modes: {
            cash: 0,
            upi: 0,
            bank_transfer: 0,
            card: 0
          },
          transactions: []
        };
      }
      const amt = Number(p.amount || 0);
      byDate[date].total += amt;
      byDate[date].totalCollected += amt;
      byDate[date].transactionCount += 1;
      if (p.paymentMethod === 'cash') {
        byDate[date].cashTotal += amt;
        byDate[date].modes.cash += amt;
      } else if (p.paymentMethod === 'upi_online' || p.paymentMethod === 'upi') {
        byDate[date].upiTotal += amt;
        byDate[date].modes.upi += amt;
      } else if (p.paymentMethod === 'bank_transfer') {
        byDate[date].bankTotal += amt;
        byDate[date].modes.bank_transfer += amt;
      } else if (p.paymentMethod === 'card') {
        byDate[date].cardTotal += amt;
        byDate[date].modes.card += amt;
      }

      byDate[date].transactions.push(p);
    }
    return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
  },

  async getBatchCollectionSummary() {
    const batches = await this.getBatches();
    const obligations = await this.getFeeObligations();
    const payments = await this.getPayments();
    const students = await this.getStudents({ includeArchived: true });

    const studentBatchMap = new Map(students.map(s => [s.id, s.batchId]));
    const today = new Date().toISOString().split('T')[0];

    return batches.map(batch => {
      const batchObligations = obligations.filter(o => o.batchId === batch.id || studentBatchMap.get(o.studentId) === batch.id);
      const batchPayments = payments.filter(p => (!p.isReversed && !p.reversed) && (p.batchId === batch.id || studentBatchMap.get(p.studentId) === batch.id));

      const totalCharged = batchObligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
      const totalCollected = batchPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalWaived = batchObligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
      const totalPending = batchObligations
        .filter(o => o.balance > 0 && o.dueDate >= today)
        .reduce((sum, o) => sum + Number(o.balance || 0), 0);
      const totalOverdue = batchObligations
        .filter(o => o.balance > 0 && o.dueDate < today)
        .reduce((sum, o) => sum + Number(o.balance || 0), 0);
      const netCollectible = Math.max(0, totalCharged - totalWaived);
      const collectionRatePct = netCollectible > 0 ? Math.round((totalCollected / netCollectible) * 100) : 0;

      return {
        batchId: batch.id,
        batchName: batch.name,
        grade: batch.grade,
        board: batch.board,
        enrolledCount: batch.enrolledCount,
        studentCount: batch.enrolledCount,
        capacity: batch.capacity || 12,
        totalDue: totalCharged,
        totalCharged,
        totalCollected,
        outstandingBalance: Math.max(0, totalCharged - totalCollected - totalWaived),
        totalWaived,
        totalPending,
        totalOverdue,
        collectionRatePct
      };
    });
  },

  async reconcileLedger(actor = 'admin') {
    const obligations = await this.getFeeObligations();
    const payments = await this.getPayments();
    const activePayments = payments.filter(p => !p.isReversed && !p.reversed);

    const discrepancies = [];
    const paymentsByObligation = {};

    for (const p of activePayments) {
      if (!p.obligationId) {
        discrepancies.push({
          type: 'ORPHAN_PAYMENT',
          paymentId: p.id,
          receiptNumber: p.receiptNumber,
          details: `Payment ₹${p.amount} has no associated obligation ID.`
        });
        continue;
      }
      paymentsByObligation[p.obligationId] = (paymentsByObligation[p.obligationId] || 0) + Number(p.amount || 0);
    }

    for (const obl of obligations) {
      const paymentSum = paymentsByObligation[obl.id] || 0;
      const recordedPaid = Number(obl.amountPaid || 0);
      if (paymentSum !== recordedPaid) {
        discrepancies.push({
          type: 'OBLIGATION_PAYMENT_MISMATCH',
          obligationId: obl.id,
          studentId: obl.studentId,
          studentName: obl.studentName,
          expectedPaid: paymentSum,
          recordedPaid,
          details: `Obligation ${obl.id} recorded ₹${recordedPaid} paid, but sum of receipt transactions is ₹${paymentSum}.`
        });
      }
    }

    const totalCharged = obligations.reduce((sum, o) => sum + Number(o.amountDue || 0), 0);
    const totalCollected = activePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalWaived = obligations.reduce((sum, o) => sum + Number(o.waivedAmount || 0), 0);
    const netOutstanding = Math.max(0, totalCharged - totalCollected - totalWaived);

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'LEDGER_RECONCILED',
      entityType: 'ledger',
      entityId: 'institutional_reconciliation',
      details: `Ledger reconciliation audit executed: ${discrepancies.length} discrepancies detected across ${payments.length} receipts.`
    });

    return {
      reconciled: discrepancies.length === 0,
      isBalanced: discrepancies.length === 0,
      totalDiscrepancies: discrepancies.length,
      discrepancies,
      ledgerTotals: {
        totalCharged,
        totalCollected,
        totalWaived,
        netOutstanding,
        paymentsCount: payments.length,
        obligationsCount: obligations.length
      },
      reconciledAt: new Date().toISOString()
    };
  },

  async getReminders() {
    if (isLive()) {
      try {
        const snap = await this.withFirestoreTimeout(getDocs(collection(db, 'reminders')), 8000);
        if (snap && !snap.empty) return snap.docs.map(d => d.data());
      } catch (err) {
        console.warn('Firestore getReminders unavailable, using verified local store:', err);
      }
    }
    const store = await hydrateStore();
    return store.reminders || [];
  },

  generateWhatsAppMessage({ studentName, amount, balance, dueDate }) {
    const amt = amount !== undefined ? amount : balance;
    const settings = this.getSettingsSync();
    const template = settings.whatsappTemplate || 'Hello, this is {academyName}. A fee payment of {currencySymbol}{amount} for {studentName} is due on {dueDate}. If you have already paid, please contact the academy so we can verify the payment. Thank you.';
    return template
      .replace(/\{academyName\}|\{\{academyName\}\}/g, settings.academyName || 'Focus Academy')
      .replace(/\{currencySymbol\}|\{\{currencySymbol\}\}/g, settings.currencySymbol || '₹')
      .replace(/\{studentName\}|\{\{studentName\}\}/g, studentName || '')
      .replace(/\{amount\}|\{\{amount\}\}|\{balance\}|\{\{balance\}\}/g, amt !== undefined ? amt : '')
      .replace(/\{dueDate\}|\{\{dueDate\}\}/g, dueDate || '')
      .replace(/\{contactPhone\}|\{\{contactPhone\}\}/g, settings.primaryPhone || '');
  },

  async sendOrLogWhatsAppReminder({ studentId, obligationId, reminderType = 'upcoming' }, actor = 'admin') {
    this.verifyPermission(actor, 'canTriggerReminders', 'dispatching fee reminders');
    const student = await this.getStudentById(studentId);
    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    const prefs = student.notificationPreferences || {};
    if (prefs.remindersDisabled) {
      throw new Error(`Reminders are disabled for student ${student.studentName}: ${prefs.reminderDisabledReason || 'Guardian opted out'}.`);
    }
    if (prefs.communicationConsent === false) {
      throw new Error(`Guardian communication consent not granted for ${student.studentName}. Reminders cannot be dispatched.`);
    }

    const obligations = await this.getFeeObligations(studentId);
    const obligation = obligations.find(o => o.id === obligationId);
    if (!obligation) {
      throw new Error(`Obligation not found: ${obligationId}`);
    }

    if (obligation.balance <= 0 || obligation.status === 'paid' || obligation.status === 'waived') {
      throw new Error(`Cannot send fee reminder: Obligation is already marked as ${obligation.status.toUpperCase()} with ₹0 balance.`);
    }

    const store = await hydrateStore();
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
      providerResponse: 'Dispatched via verified Focus Academy WhatsApp protocol',
      retryCount: 0
    };

    store.reminders.unshift(reminderEntry);
    saveLocalStore(store);

    if (isLive()) {
      try {
        await setDoc(doc(db, 'reminders', reminderEntry.id), reminderEntry);
      } catch (err) {
        console.warn('Firestore sendOrLogWhatsAppReminder error (local reminder preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'REMINDER_TRIGGERED',
      entityType: 'reminder',
      entityId: reminderEntry.id,
      details: `Triggered ${reminderType} WhatsApp reminder (₹${obligation.balance}) for ${student.studentName} (${cleanPhone}).`
    });

    return {
      reminder: reminderEntry,
      clickToChatUrl
    };
  },

  async retryFailedReminder(reminderId, actor = 'admin') {
    this.verifyPermission(actor, 'canTriggerReminders', 'retrying reminder');
    const store = await hydrateStore();
    const rem = store.reminders.find(r => r.id === reminderId);
    if (!rem) throw new Error(`Reminder not found: ${reminderId}`);

    const student = await this.getStudentById(rem.studentId);
    if (!student) throw new Error(`Student not found: ${rem.studentId}`);

    const cleanPhone = String(rem.guardianPhone || student.guardianPhone || '').replace(/\D/g, '').slice(-10);
    const clickToChatUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(rem.messagePreview)}`;

    rem.status = 'sent';
    rem.deliveryStatus = 'delivered';
    rem.retryCount = (rem.retryCount || 0) + 1;
    rem.lastRetriedAt = new Date().toISOString();
    rem.retriedAt = rem.lastRetriedAt;
    saveLocalStore(store);

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'REMINDER_RETRIED',
      entityType: 'reminder',
      entityId: reminderId,
      details: `Manually retried WhatsApp reminder for ${rem.studentName} (${cleanPhone}). Attempt #${rem.retryCount}.`
    });

    Object.assign(rem, { reminder: rem, clickToChatUrl });
    return rem;
  },

  async createFullBackupSnapshot(actor = 'admin') {
    this.verifyPermission(actor, 'canManageSettings', 'creating institutional data backup');
    const store = await hydrateStore();
    const settings = this.getSettingsSync();

    const snapshot = {
      version: '1.0.0',
      campus: 'Focus Academy Thiripura Complex Perambalur',
      exportedAt: new Date().toISOString(),
      exportedBy: normalizeActorEmail(actor),
      rtoTarget: 'RTO < 1 Hour',
      rpoTarget: 'RPO < 24 Hours',
      counts: {
        batches: store.batches.length,
        students: store.students.length,
        obligations: store.obligations.length,
        payments: store.payments.length,
        reminders: store.reminders.length,
        auditLogs: store.auditLogs.length
      },
      data: {
        batches: store.batches,
        students: store.students,
        obligations: store.obligations,
        payments: store.payments,
        reminders: store.reminders,
        auditLogs: store.auditLogs,
        settings
      }
    };

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'BACKUP_CREATED',
      entityType: 'system_backup',
      entityId: `BACKUP-${Date.now().toString(36).toUpperCase()}`,
      details: `Created institutional backup snapshot: ${snapshot.counts.students} students, ${snapshot.counts.batches} batches, ${snapshot.counts.payments} payments.`
    });

    return snapshot;
  },

  async restoreFromBackupSnapshot(snapshot, actor = 'admin') {
    this.verifyPermission(actor, 'canRestoreBackup', 'restoring institutional data backup');

    if (!snapshot || !snapshot.data) {
      throw new Error('Corrupted or invalid backup file: Missing snapshot data block.');
    }

    const { batches, students, obligations, payments, reminders, auditLogs, settings } = snapshot.data;
    if (!Array.isArray(batches) || !Array.isArray(students) || !Array.isArray(obligations) || !Array.isArray(payments)) {
      throw new Error('Invalid backup schema: Missing required collections (batches, students, obligations, payments).');
    }

    const restoredStore = {
      batches: [...batches],
      students: [...students],
      obligations: [...obligations],
      payments: [...payments],
      reminders: Array.isArray(reminders) ? [...reminders] : [],
      auditLogs: Array.isArray(auditLogs) ? [...auditLogs] : [],
      settings: settings || this.getSettingsSync()
    };

    saveLocalStore(restoredStore);

    if (isLive()) {
      try {
        for (const b of batches) await setDoc(doc(db, 'batches', b.id), b);
        for (const s of students) await setDoc(doc(db, 'students', s.id), s);
        for (const o of obligations) await setDoc(doc(db, 'fee_obligations', o.id), o);
        for (const p of payments) await setDoc(doc(db, 'payments', p.id), p);
        if (settings) await setDoc(doc(db, 'academy_settings', 'main_config'), settings);
      } catch (err) {
        console.warn('Firestore restoreFromBackupSnapshot sync error (local backup preserved):', err);
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'BACKUP_RESTORED',
      entityType: 'system_backup',
      entityId: `RESTORE-${Date.now().toString(36).toUpperCase()}`,
      details: `Restored institutional snapshot exported at ${snapshot.exportedAt || 'Unknown'}: ${batches.length} batches, ${students.length} students, ${payments.length} payments.`
    });

    return {
      success: true,
      counts: snapshot.counts || {
        batches: batches.length,
        students: students.length,
        obligations: obligations.length,
        payments: payments.length
      }
    };
  },

  async syncAllToCloudFirestore(actor = 'admin') {
    if (!isLive()) {
      return { success: false, reason: 'Firebase is not live or configured in this environment.' };
    }
    const store = loadLocalStore();
    const batches = store.batches || [];
    const students = store.students || [];
    const obligations = store.obligations || [];
    const payments = store.payments || [];
    const settings = store.settings || this.getSettingsSync();

    try {
      if (settings) {
        await setDoc(doc(db, 'academy_settings', 'main_config'), settings);
      }
      for (const b of batches) {
        await setDoc(doc(db, 'batches', b.id), b);
      }
      for (const s of students) {
        await setDoc(doc(db, 'students', s.id), s);
      }
      for (const o of obligations) {
        await setDoc(doc(db, 'fee_obligations', o.id), o);
      }
      for (const p of payments) {
        await setDoc(doc(db, 'payments', p.id), p);
      }

      await this.logAudit({
        actor: normalizeActorEmail(actor),
        action: 'DATABASE_SYNCED_TO_CLOUD',
        entityType: 'database',
        entityId: 'cloud_firestore',
        details: `Synchronized ${batches.length} batches, ${students.length} students, and ${payments.length} payments to Cloud Firestore.`
      });

      return {
        success: true,
        counts: {
          batches: batches.length,
          students: students.length,
          obligations: obligations.length,
          payments: payments.length
        }
      };
    } catch (err) {
      console.error('syncAllToCloudFirestore error:', err);
      throw new Error(`Failed to sync to Cloud Firestore: ${err.message}`);
    }
  },

  validateAndParseStudentCSV(csvContent) {
    if (!csvContent || typeof csvContent !== 'string') {
      const errs = [{ line: 0, reason: 'Empty or invalid CSV content', error: 'Empty or invalid CSV content' }];
      return { isValid: false, totalRows: 0, validRows: [], invalidRows: errs, duplicateRows: [], students: [], errors: errs, rejectedCount: errs.length };
    }

    const lines = csvContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      const errs = [{ line: 1, reason: 'CSV must contain a header line and at least one student data row', error: 'CSV must contain a header line and at least one student data row' }];
      return { isValid: false, totalRows: Math.max(0, lines.length - 1), validRows: [], invalidRows: errs, duplicateRows: [], students: [], errors: errs, rejectedCount: errs.length };
    }

    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

    const requiredCols = ['studentname', 'guardianphone', 'grade', 'board'];
    for (const col of requiredCols) {
      if (!headers.includes(col)) {
        const errs = [{ line: 1, reason: `Missing required header column '${col}'. Headers found: ${headers.join(', ')}`, error: `Missing required header column '${col}'.` }];
        return {
          isValid: false,
          totalRows: lines.length - 1,
          validRows: [],
          invalidRows: errs,
          duplicateRows: [],
          students: [],
          errors: errs,
          rejectedCount: errs.length
        };
      }
    }

    const nameIdx = headers.indexOf('studentname');
    const parentIdx = headers.indexOf('guardianname');
    const phoneIdx = headers.indexOf('guardianphone');
    const gradeIdx = headers.indexOf('grade');
    const boardIdx = headers.indexOf('board');
    const batchIdx = headers.indexOf('batchid');
    const freqIdx = headers.indexOf('billingfrequency');
    const feeIdx = headers.indexOf('amountpercycle');

    const validRows = [];
    const invalidRows = [];
    const duplicateRows = [];

    const store = loadLocalStore();
    const batches = store.batches;
    const existingStudents = store.students;
    const phoneSetInCSV = new Set();

    const batchAllocations = new Map();
    for (const b of batches) {
      batchAllocations.set(b.id, b.enrolledCount || 0);
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells = [];
      let cur = '';
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === '"') {
          if (inQuotes && line[c + 1] === '"') {
            cur += '"';
            c++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          cells.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cells.push(cur.trim());

      const studentName = cells[nameIdx] || '';
      const guardianName = parentIdx !== -1 ? cells[parentIdx] : 'Parent / Guardian';
      const guardianPhone = cells[phoneIdx] || '';
      const grade = cells[gradeIdx] || '';
      const board = cells[boardIdx] || '';
      const batchId = batchIdx !== -1 ? cells[batchIdx] : '';
      const billingFrequency = freqIdx !== -1 ? cells[freqIdx] : 'monthly';
      const amountPerCycle = feeIdx !== -1 ? Number(cells[feeIdx]) : 2200;

      if (!studentName || studentName.length < 2) {
        invalidRows.push({ line: i + 1, reason: `Student name '${studentName}' is invalid or missing (minimum 2 chars).` });
        continue;
      }

      const cleanPhone = String(guardianPhone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        invalidRows.push({
          line: i + 1,
          reason: `Invalid phone '${guardianPhone}'. Must be valid 10-digit Indian phone number.`,
          error: `Invalid phone '${guardianPhone}'. Must be valid 10-digit Indian phone number.`
        });
        continue;
      }

      let matchedBatch = null;
      if (batchId) {
        matchedBatch = batches.find(b => b.id === batchId);
        if (!matchedBatch) {
          invalidRows.push({
            line: i + 1,
            reason: `Specified batch ID '${batchId}' does not exist.`,
            error: `Specified batch ID '${batchId}' does not exist.`
          });
          continue;
        }
      } else {
        matchedBatch = batches.find(b => !b.isArchived && isBatchCompatible(b, grade, board) && (batchAllocations.get(b.id) || 0) < (Number(b.capacity) || 12));
      }

      if (!matchedBatch) {
        invalidRows.push({ line: i + 1, reason: `No available compatible batch with open seats for grade '${grade}' and board '${board}'.` });
        continue;
      }

      if (!isBatchCompatible(matchedBatch, grade, board)) {
        invalidRows.push({ line: i + 1, reason: `Batch '${matchedBatch.name}' is incompatible with student grade '${grade}' (${board}).` });
        continue;
      }

      const batchCap = Number(matchedBatch.capacity) || 12;
      const currentAllocated = batchAllocations.get(matchedBatch.id) || 0;
      if (currentAllocated >= batchCap) {
        invalidRows.push({
          line: i + 1,
          reason: `Batch '${matchedBatch.name}' capacity of ${batchCap} seats exceeded (already has ${matchedBatch.enrolledCount} enrolled + preceding CSV rows).`,
          error: `Batch '${matchedBatch.name}' capacity of ${batchCap} seats exceeded.`
        });
        continue;
      }

      batchAllocations.set(matchedBatch.id, currentAllocated + 1);

      const duplicateInDb = existingStudents.find(s => {
        const sp = String(s.guardianPhone).replace(/\D/g, '').slice(-10);
        return sp === cleanPhone || s.studentName.toLowerCase() === studentName.toLowerCase();
      });

      if (phoneSetInCSV.has(cleanPhone)) {
        duplicateRows.push({ line: i + 1, studentName, guardianPhone: cleanPhone, warning: 'Duplicate phone number repeated inside CSV file.' });
      } else if (duplicateInDb) {
        duplicateRows.push({ line: i + 1, studentName, guardianPhone: cleanPhone, warning: `Existing student ${duplicateInDb.studentName} (${duplicateInDb.id}) already shares phone or name.` });
      }

      phoneSetInCSV.add(cleanPhone);

      validRows.push({
        studentName,
        guardianName: guardianName || 'Parent / Guardian',
        guardianPhone: cleanPhone,
        grade,
        board,
        batchId: matchedBatch.id,
        batchName: matchedBatch.name,
        billingFrequency: billingFrequency || 'monthly',
        amountPerCycle: amountPerCycle || matchedBatch.monthlyFee,
        enrollmentDate: new Date().toISOString().split('T')[0]
      });
    }

    return {
      isValid: invalidRows.length === 0,
      totalRows: lines.length - 1,
      validRows,
      invalidRows,
      duplicateRows,
      students: validRows,
      errors: invalidRows.map(r => ({ line: r.line, reason: r.reason, error: r.error || r.reason })),
      rejectedCount: invalidRows.length,
      invalidCount: invalidRows.length
    };
  },

  async importStudentsFromCSV(validRows, actor = 'admin') {
    this.verifyPermission(actor, 'canImportData', 'importing student records from CSV');
    const importedStudents = [];
    const errors = [];

    for (const row of validRows) {
      try {
        const student = await this.createStudent(row, actor);
        importedStudents.push(student);
      } catch (err) {
        errors.push({ studentName: row.studentName, error: err.message });
      }
    }

    await this.logAudit({
      actor: normalizeActorEmail(actor),
      action: 'STUDENTS_IMPORTED_CSV',
      entityType: 'student',
      entityId: `BATCH-IMPORT-${Date.now().toString(36).toUpperCase()}`,
      details: `Imported ${importedStudents.length} student records from CSV. ${errors.length} failed.`
    });

    return {
      importedCount: importedStudents.length,
      successCount: importedStudents.length,
      failedCount: errors.length,
      rejectedCount: errors.length,
      importedStudents,
      students: importedStudents,
      errors
    };
  },

  isBatchCompatible(batch, grade, board) {
    return isBatchCompatible(batch, grade, board);
  }
};

export { isBatchCompatible };

