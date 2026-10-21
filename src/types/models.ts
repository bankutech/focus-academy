export interface StudentFlowState {
  studentName: string;
  phone: string;
  parentName?: string;
  board: string;
  grade: string;
  examPrepId?: string;
  examPrep: string;
  selectedBatchId: string;
  selectedBatchName?: string;
  timing?: string;
  monthlyFee?: number;
  subjects?: string;
  step: number;
  stepToken?: string;
}

export interface Batch {
  id: string;
  name: string;
  grade: string;
  board: string;
  slotId: 'slot-1' | 'slot-2' | 'slot-3' | string;
  timing: string;
  days: string;
  capacity: number;
  enrolledCount: number;
  seatsRemaining: number;
  status: string;
  monthlyFee: number;
  classroom: string;
  subjects: string[];
  description: string;
}

export interface LeadInquiry {
  studentName: string;
  parentName?: string;
  phone: string;
  grade: string;
  board: string;
  subjects?: string;
  notes?: string;
}

export interface LeadRecord extends LeadInquiry {
  id: string;
  timestamp: string;
  campus: string;
}

export interface EnrollmentRecord {
  id?: string;
  studentName: string;
  parentName: string;
  phone: string;
  schoolName: string;
  board: string;
  grade: string;
  selectedBatchId: string;
  selectedBatchName: string;
  timing: string;
  monthlyFee: number;
  startDatePreference: string;
  studentWeakness: string;
  createdAt: string;
}

export interface AdmissionStep {
  num: string;
  title: string;
  desc: string;
  linkText: string;
  link: string;
}

export interface StepTokenPayload {
  step: number;
  hash: string;
  issuedAt: number;
  expiresAt: number;
}

export interface StepValidationResult {
  valid: boolean;
  step: number;
  reason?: string;
}
