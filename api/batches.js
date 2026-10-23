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

const reservations = new Map();
const ipHits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_RESERVATIONS_PER_WINDOW = 15;

function checkRateLimit(ip, limit = MAX_RESERVATIONS_PER_WINDOW) {
  const now = Date.now();
  const history = ipHits.get(ip) || [];
  const valid = history.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= limit) {
    ipHits.set(ip, valid);
    return false;
  }
  valid.push(now);
  ipHits.set(ip, valid);
  return true;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    const enrichedBatches = BATCHES.map((b) => {
      const reservedCount = reservations.get(b.id) || 0;
      const actualRemaining = Math.max(0, b.seatsRemaining - reservedCount);
      const actualEnrolled = b.enrolledCount + reservedCount;
      let status = b.status;
      if (actualRemaining === 0) {
        status = 'Batch Full • Waitlist Open';
      } else if (actualRemaining <= 2) {
        status = `Limited Seats • ${actualRemaining} Left`;
      }
      return {
        ...b,
        enrolledCount: actualEnrolled,
        seatsRemaining: actualRemaining,
        status
      };
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      batches: enrichedBatches
    });
  }

  if (req.method === 'POST') {
    const clientIp = req.headers['x-forwarded-for'] 
      ? String(req.headers['x-forwarded-for']).split(',')[0].trim() 
      : (req.socket?.remoteAddress || '127.0.0.1');

    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ 
        success: false, 
        error: 'Too many reservation requests from this connection. Please try again in a moment.' 
      });
    }

    const { batchId } = req.body || {};
    const sanitizedBatchId = String(batchId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    if (!sanitizedBatchId) {
      return res.status(400).json({ success: false, error: 'batchId is required' });
    }
    const matched = BATCHES.find((b) => b.id === sanitizedBatchId);
    if (!matched) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const currentReserved = reservations.get(sanitizedBatchId) || 0;
    const actualRemaining = matched.seatsRemaining - currentReserved;

    if (actualRemaining <= 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Batch capacity reached. All 12 seats in this classroom have been allocated.' 
      });
    }

    const nextReserved = currentReserved + 1;
    reservations.set(sanitizedBatchId, nextReserved);
    const newRemaining = Math.max(0, matched.seatsRemaining - nextReserved);

    return res.status(200).json({
      success: true,
      batchId: sanitizedBatchId,
      reserved: true,
      reservationId: `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      seatsRemaining: newRemaining,
      enrolledCount: matched.enrolledCount + nextReserved,
      message: 'Physical seat reserved at Thiripura Complex campus.'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
