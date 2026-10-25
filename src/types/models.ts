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
  includesPrintedMaterials?: boolean;
}

export interface EmergencyContact {
  emergencyContactName: string;
  emergencyRelationship: 'Father' | 'Mother' | 'Guardian' | 'Other' | string;
  emergencyPhone: string;
}

export interface ShippingAddress {
  addressStreet: string;
  addressLandmark?: string | null;
  addressCityState: string;
  addressPincode: string;
}

export interface LeadInquiry {
  studentName: string;
  parentName?: string;
  phone: string;
  whatsappNumber?: string;
  grade: string;
  board: string;
  educationBoard?: string;
  schoolName?: string;
  targetYear?: string;
  previousScore?: string | null;
  schoolShift?: string;
  mediumOfInstruction?: string;
  emergencyContactName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
  secondaryPhone?: string | null;
  medicalAlert?: string | null;
  studentIdNumber?: string;
  gstin?: string | null;
  addressStreet?: string | null;
  addressLandmark?: string | null;
  addressCityState?: string | null;
  addressPincode?: string | null;
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
  whatsappNumber: string;
  schoolName: string;
  educationBoard: 'CBSE' | 'ICSE' | 'State Board' | 'Other' | string;
  targetYear: string;
  previousScore?: string | null;
  schoolShift: 'Morning Shift' | 'Day/Afternoon Shift' | string;
  mediumOfInstruction: 'English' | 'Hindi' | 'Bilingual / Hinglish' | 'Tamil / English (Bilingual)' | string;
  emergencyContactName: string;
  emergencyRelationship: 'Father' | 'Mother' | 'Guardian' | 'Other' | string;
  emergencyPhone: string;
  secondaryPhone?: string | null;
  medicalAlert?: string | null;
  studentIdNumber: string;
  gstin?: string | null;
  addressStreet?: string | null;
  addressLandmark?: string | null;
  addressCityState?: string | null;
  addressPincode?: string | null;
  board: string;
  grade: string;
  selectedBatchId: string;
  selectedBatchName: string;
  timing: string;
  monthlyFee: number;
  startDatePreference: string;
  studentWeakness: string;
  reservationId?: string | null;
  isWaitlisted?: boolean;
  waitlistPosition?: number | null;
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
