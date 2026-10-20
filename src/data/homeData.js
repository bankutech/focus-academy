import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export const HOME_PROGRAMS = [
  {
    id: 'high-school',
    title: 'High School Tuition (Classes 9–12)',
    grade: 'Classes 9, 10, 11, 12',
    board: 'State Board (Samacheer) & CBSE',
    timing: '6:00 PM – 9:00 PM',
    icon: GraduationCap,
    description: 'Comprehensive coverage for Board exams in Mathematics, Physics, Chemistry, and Biology. Regular weekly tests, step-marked derivations, and individual 1-on-1 doubt clearing.',
    subjects: ['Board Mathematics', 'Physics', 'Chemistry', 'Biology'],
    batchSize: 'Max 12 Students',
  },
  {
    id: 'middle-school',
    title: 'Middle School Foundation (Classes 6–8)',
    grade: 'Classes 6, 7, 8',
    board: 'Samacheer & CBSE',
    timing: '4:30 PM – 6:00 PM',
    icon: BookOpen,
    description: 'Core conceptual clarity in Mathematics and Science. Eliminates rote memorization through hands-on experiments, arithmetic mastery, and daily homework guidance.',
    subjects: ['Maths Core', 'General Science', 'Mental Arithmetic', 'English Grammar'],
    batchSize: 'Max 12 Students',
  },
  {
    id: 'skill-prep',
    title: 'Skill Development & Test Prep',
    grade: 'Classes 9 to 12',
    board: 'Board & Competitive Foundation',
    timing: 'Mon – Sat Evening Sessions',
    icon: Award,
    description: 'Problem-solving skills, periodic assessments, chapter-wise question paper drills, and exam-oriented revision designed to produce 95%+ board scores.',
    subjects: ['Saturday Board Mocks', 'Past 10-Yr Papers', 'Formula Drills', 'Doubt Clinics'],
    batchSize: 'Small Batches',
  },
];

export const HOME_BATCH_SLOTS = [
  {
    id: 'slot-1',
    slotNum: 'Batch 1 • Early Evening',
    time: '4:30 PM – 6:00 PM',
    grades: 'Classes 6 to 8 (Middle School Foundation)',
    focus: 'Mathematics Core, General Science, Homework & Concept Clarity',
    status: 'Open for Enrollment',
    seats: 'Strictly Max 12 Students',
  },
  {
    id: 'slot-2',
    slotNum: 'Batch 2 • Prime Board Slot',
    time: '6:00 PM – 7:30 PM',
    grades: 'Classes 9 & 10 (Secondary Board Preparation)',
    focus: 'Board Maths, Physics, Chemistry, Biology, Chapter-wise Mock Tests',
    status: 'High Demand • Few Seats',
    seats: 'Strictly Max 12 Students',
  },
  {
    id: 'slot-3',
    slotNum: 'Batch 3 • Late Evening Senior Slot',
    time: '7:30 PM – 9:00 PM',
    grades: 'Classes 11 & 12 (Higher Secondary STEM & Foundation)',
    focus: 'Derivations, Numerical Problem Solving, Previous Year Board Question Drills',
    status: 'Open for Enrollment',
    seats: 'Strictly Max 12 Students',
  },
];

export const HOME_ADMISSION_STEPS = [
  {
    num: '1',
    title: 'Login & Student Details',
    desc: 'Select education board (State Board, CBSE, ICSE) and class (Classes 6 to 12).',
    linkText: 'Step 1: Details',
    link: '/student-details',
  },
  {
    num: '2',
    title: 'Exam Preparation Goal',
    desc: 'Target school exams, board exam 95%+, or competitive NEET/JEE foundation.',
    linkText: 'Step 2: Goals',
    link: '/exam-prep',
  },
  {
    num: '3',
    title: 'Batch Information',
    desc: 'Explore available small batches with timings, subjects, and fees.',
    linkText: 'Step 3: Batches',
    link: '/batches',
  },
  {
    num: '4',
    title: 'Batch Selection',
    desc: 'Review selected batch breakdown, syllabus, and seat availability.',
    linkText: 'Step 4: Selection',
    link: '/batches',
  },
  {
    num: '5',
    title: 'Confirm Enrollment',
    desc: 'Reserve your student seat online with instant WhatsApp confirmation docket.',
    linkText: 'Step 5: Enroll',
    link: '/enroll',
  },
];

export const HOME_FEATURES = [
  {
    title: 'Board-Aligned Structured Curriculum',
    desc: 'Complete syllabus coverage for Tamil Nadu State Board (Samacheer) and CBSE with step-by-step problem banks.',
    icon: BookOpen,
  },
  {
    title: 'Small Batch Sizes (Strictly Max 12)',
    desc: 'Strictly limited to 12 students per batch ensuring individual attention and rapid doubt clearance.',
    icon: CheckCircle2,
  },
  {
    title: 'Regular Assessments & Parent Feedback',
    desc: 'Weekly Saturday mock tests with evaluated answer sheets shared directly with parents.',
    icon: Award,
  },
  {
    title: 'Evening Batches Suited for School Hours',
    desc: 'Convenient 4:00 PM – 9:00 PM evening timings synchronized with school & town buses via Four Roads and Trichy Main Road.',
    icon: Clock,
  },
];

export function calculateFee(hourlyRate, hoursPerWeek) {
  return Math.round(Number(hourlyRate || 0) * Number(hoursPerWeek || 0) * 4);
}
