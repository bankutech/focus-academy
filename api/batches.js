const BATCHES = [
  {
    id: 'batch-10-state-board',
    name: 'Class 10 State Board (SSLC) - Prime Evening Batch',
    grade: 'Class 10',
    board: 'TN State Board (Samacheer)',
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
    description: 'Intensive evening batch focused on Samacheer Kalvi textbooks, exemplar problems, theorem derivations, and past 10-year question paper drills.'
  },
  {
    id: 'batch-10-cbse',
    name: 'Class 10 CBSE Board - Prime Evening Batch',
    grade: 'Class 10',
    board: 'CBSE Board',
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
    description: 'Master CBSE Class 10 with deep NCERT deconstruction, case-based and assertion-reasoning question practices, and step-by-step marking scheme training.'
  },
  {
    id: 'batch-10-icse',
    name: 'Class 10 ICSE Board - Prime Evening Batch',
    grade: 'Class 10',
    board: 'ICSE Board',
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
    description: 'Specialized batch for ICSE Class 10 candidates. Covers in-depth numericals, circuit theory, organic nomenclature, and structured answer presentation.'
  },
  {
    id: 'batch-12-science-board',
    name: 'Class 12 Higher Secondary Science (HSC, CBSE & ISC)',
    grade: 'Class 12',
    board: 'TN State Board, CBSE & ISC',
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
    description: 'Advanced late-evening batch for 12th board candidates. Designed for students who need sharp numerical problem solving and calculus speed drills.'
  },
  {
    id: 'batch-middle-foundation',
    name: 'Middle School Science & Math Foundation (Classes 6–8)',
    grade: 'Classes 6 to 8',
    board: 'Samacheer, CBSE & ICSE',
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
    description: 'Early evening session right after school. Focuses on homework support, mental arithmetic, geometry proofs, and intuitive science experiments.'
  },
  {
    id: 'batch-9-preboard',
    name: 'Class 9 Pre-Board Bridge & Foundation',
    grade: 'Class 9',
    board: 'TN State Board, CBSE & ICSE',
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
    description: 'Class 9 bridge year. Systematic chapter worksheets, formula notebooks, and small batch size with zero peer judgment.'
  },
  {
    id: 'batch-11-science',
    name: 'Class 11 Science & Mathematics Core Batch',
    grade: 'Class 11',
    board: 'TN State Board, CBSE & ISC',
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
    description: 'In-depth mechanics and calculus foundation with special focus on difficult physics derivations and organic chemistry mechanism breakdown.'
  },
  {
    id: 'batch-remedial-maths',
    name: 'Special Secondary Math Intensive & Doubt Clinic Batch',
    grade: 'Classes 9 & 10',
    board: 'Samacheer, CBSE & ICSE',
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
    description: 'Designed specifically for students who feel hesitant or left behind in school math classes. Patient whiteboard problem-solving with 1-on-1 teacher guidance.'
  }
];

const reservations = new Map();
const batchLeases = new Map();
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

function isCompatible(batch, grade, board) {
  if (!batch || !grade) return false;
  const g = String(grade).toLowerCase();
  const bGrade = String(batch.grade || '').toLowerCase();

  let gradeMatch = false;
  if (g.includes('6') || g.includes('7') || g.includes('8') || g.includes('middle')) {
    gradeMatch = bGrade.includes('6') || bGrade.includes('7') || bGrade.includes('8') || bGrade.includes('middle');
  } else if (g.includes('9')) {
    gradeMatch = bGrade.includes('9');
  } else if (g.includes('10')) {
    gradeMatch = bGrade.includes('10');
  } else if (g.includes('11')) {
    gradeMatch = bGrade.includes('11');
  } else if (g.includes('12')) {
    gradeMatch = bGrade.includes('12');
  }

  if (!gradeMatch) return false;

  if (board && board !== 'all') {
    const b = String(board).toLowerCase();
    const bBoard = String(batch.board || '').toLowerCase();

    if (b.includes('state') || b.includes('samacheer')) {
      if (!bBoard.includes('state') && !bBoard.includes('samacheer')) return false;
    } else if (b.includes('cbse')) {
      if (!bBoard.includes('cbse')) return false;
    } else if (b.includes('icse') || b.includes('isc')) {
      if (!bBoard.includes('icse') && !bBoard.includes('isc')) return false;
    }
  }

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

    const { batchId, studentName, phone, grade, board } = req.body || {};
    const sanitizedBatchId = String(batchId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    if (!sanitizedBatchId) {
      return res.status(400).json({ success: false, error: 'batchId is required' });
    }

    const matched = BATCHES.find((b) => b.id === sanitizedBatchId);
    if (!matched) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    if (grade && !isCompatible(matched, grade, board)) {
      return res.status(422).json({
        success: false,
        error: `Academic mismatch: Batch ${matched.name} (${matched.grade}) is incompatible with student grade ${grade} (${board || 'All'}).`
      });
    }

    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    const cleanName = String(studentName || '').trim().toLowerCase().slice(0, 50);
    const leaseKey = cleanPhone && cleanName 
      ? `${cleanPhone}:${cleanName}` 
      : (cleanPhone || clientIp);

    let leasesForBatch = batchLeases.get(sanitizedBatchId);
    if (!leasesForBatch) {
      leasesForBatch = new Map();
      batchLeases.set(sanitizedBatchId, leasesForBatch);
    }

    const existingLease = leasesForBatch.get(leaseKey);
    const currentReserved = reservations.get(sanitizedBatchId) || 0;
    const actualRemaining = Math.max(0, matched.seatsRemaining - currentReserved);

    if (existingLease) {
      return res.status(200).json({
        success: true,
        batchId: sanitizedBatchId,
        reserved: true,
        reservationId: existingLease.reservationId,
        seatsRemaining: actualRemaining,
        enrolledCount: matched.enrolledCount + currentReserved,
        duplicateSuppressed: true,
        message: 'Existing physical seat reservation confirmed at Thiripura Complex campus.'
      });
    }

    if (actualRemaining <= 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Batch capacity reached. All 12 seats in this classroom have been allocated.' 
      });
    }

    const nextReserved = currentReserved + 1;
    reservations.set(sanitizedBatchId, nextReserved);
    const reservationId = `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    leasesForBatch.set(leaseKey, { reservationId, timestamp: Date.now() });

    const newRemaining = Math.max(0, matched.seatsRemaining - nextReserved);

    return res.status(200).json({
      success: true,
      batchId: sanitizedBatchId,
      reserved: true,
      reservationId,
      seatsRemaining: newRemaining,
      enrolledCount: matched.enrolledCount + nextReserved,
      message: 'Physical seat reserved at Thiripura Complex campus.'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
