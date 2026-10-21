const BATCHES = [
  {
    id: 'batch-10-state-board',
    name: 'Class 10 State Board (SSLC) Mastery Batch',
    grade: 'Class 10',
    board: 'TN State Board (Samacheer)',
    slotId: 'slot-2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 9,
    seatsRemaining: 3,
    status: 'High Demand • 3 Seats Left',
    monthlyFee: 2200,
    classroom: 'Room 101 • Air-Circulated Classrooms (First Floor)',
    subjects: ['Mathematics', 'Science (Physics, Chemistry, Biology)'],
    description: 'Thorough coverage of Tamil Nadu Samacheer Kalvi textbooks with step-by-step solutions to past 10 years public examination question papers. Includes Saturday timed mock examinations and daily 15-minute doubt-clearing sessions.'
  },
  {
    id: 'batch-10-cbse',
    name: 'Class 10 CBSE Board Target 95+ Batch',
    grade: 'Class 10',
    board: 'CBSE Board',
    slotId: 'slot-2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 10,
    seatsRemaining: 2,
    status: 'High Demand • 2 Seats Left',
    monthlyFee: 2500,
    classroom: 'Room 102 • Smart Projection Lab',
    subjects: ['Mathematics (Standard / Basic)', 'Science', 'Social Science Blueprint Guidance'],
    description: 'NCERT line-by-line concept breakdown with emphasis on competency-based questions, case-study numericals, and assertion-reason drills aligned with latest CBSE curriculum.'
  },
  {
    id: 'batch-12-science-board',
    name: 'Class 12 Higher Secondary Science & Maths Centum Batch',
    grade: 'Class 12',
    board: 'State Board & CBSE',
    slotId: 'slot-3',
    timing: '7:30 PM – 9:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 10,
    seatsRemaining: 2,
    status: 'Limited Seats • 2 Left',
    monthlyFee: 2800,
    classroom: 'Room 201 • Senior Derivation Studio (Second Floor)',
    subjects: ['Higher Mathematics (Calculus)', 'Physics (Derivations & Numericals)', 'Chemistry (Organic Mechanisms)'],
    description: 'Rigorous derivation drills, calculus mastery, organic reaction mechanism roadmaps, and previous years board blueprint question practice tailored for high scoring in Tamil Nadu HSC & CBSE 12th.'
  },
  {
    id: 'batch-11-core-stem',
    name: 'Class 11 Science & Mathematics Core Foundation Batch',
    grade: 'Class 11',
    board: 'State Board & CBSE',
    slotId: 'slot-3',
    timing: '7:30 PM – 9:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 8,
    seatsRemaining: 4,
    status: 'Open for Enrollment',
    monthlyFee: 2600,
    classroom: 'Room 202 • Mathematics Lab',
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    description: 'Bridges the gap from Class 10 to Higher Secondary STEM concepts with structured problem-solving, textbook exemplars, and weekly test evaluations.'
  },
  {
    id: 'batch-9-preboard',
    name: 'Class 9 Foundation & High School Prep Batch',
    grade: 'Class 9',
    board: 'State Board & CBSE',
    slotId: 'slot-2',
    timing: '6:00 PM – 7:30 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 7,
    seatsRemaining: 5,
    status: 'Open for Enrollment',
    monthlyFee: 1900,
    classroom: 'Room 103 • Interactive Classroom',
    subjects: ['Mathematics', 'Science (Physical & Biological Sciences)'],
    description: 'Focuses on fundamental algebraic proofs, coordinate geometry, physics mechanics, and chemical equations to build a rock-solid foundation for Class 10 board year.'
  },
  {
    id: 'batch-middle-foundation',
    name: 'Middle School (Classes 6 – 8) Homework & Foundation Batch',
    grade: 'Classes 6, 7 & 8',
    board: 'Samacheer Kalvi & CBSE',
    slotId: 'slot-1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 8,
    seatsRemaining: 4,
    status: 'Open for Enrollment',
    monthlyFee: 1500,
    classroom: 'Room 104 • Junior Activity Hall',
    subjects: ['School Mathematics', 'General Science', 'Daily Homework Supervision & Corrections'],
    description: 'Gentle, disciplined evening study habit formation. Eliminates math anxiety, instills arithmetic clarity, and ensures all school daily homework is understood and finished before returning home.'
  },
  {
    id: 'batch-remedial-maths',
    name: 'Special Secondary Math Intensive & Doubt Clinic Batch',
    grade: 'Classes 9 & 10',
    board: 'Samacheer & CBSE',
    slotId: 'slot-1',
    timing: '4:30 PM – 6:00 PM',
    days: 'Monday – Saturday',
    capacity: 12,
    enrolledCount: 8,
    seatsRemaining: 4,
    status: 'Open for Enrollment',
    monthlyFee: 1800,
    classroom: 'Room 105 • Problem Solving Clinic',
    subjects: ['Algebra Factoring', 'Geometry Theorems', 'Trigonometry Basics', 'Arithmetic Speed'],
    description: 'Designed specifically for students who feel hesitant or left behind in school math classes. Patient whiteboard problem-solving with 1-on-1 teacher guidance and zero embarrassment.'
  }
];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      batches: BATCHES
    });
  }

  if (req.method === 'POST') {
    const { batchId } = req.body || {};
    const matched = BATCHES.find((b) => b.id === batchId);
    if (!matched) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    return res.status(200).json({
      success: true,
      batchId,
      reserved: true,
      seatsRemaining: Math.max(0, matched.seatsRemaining - 1)
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
