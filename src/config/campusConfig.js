export const CAMPUS_CONFIG = {
  brand: {
    name: 'Focus Academy',
    legalName: 'Focus Academy Educational Coaching Institute',
    tagline: 'Empowering Minds, Building Futures | Academic Excellence & Foundation Coaching',
    heroHeadline: 'Achieve Your Academic Goals with Focus Academy',
    heroSubheadline: 'Dedicated coaching, personalized attention, and proven study techniques to help students excel in Thoramangalam, Perambalur.',
    establishedYear: 2018,
    audience: 'School students (Classes 6–12) seeking tuition, board exam coaching, and foundation courses.',
  },
  
  location: {
    campusName: 'Thoramangalam Campus / Perambalur Center',
    doorNo: 'No. 50, First Floor',
    complex: 'Thiripura Complex',
    street: 'Main Road (via Four Roads)',
    landmark: 'Near Malar Hospital / Opp. EB Office',
    area: 'Rajanagar, Thoramangalam',
    city: 'Perambalur',
    district: 'Perambalur',
    state: 'Tamil Nadu',
    pincode: '621220',
    country: 'India',
    fullAddress: 'No. 50, First Floor, Thiripura Complex, Main Road (via Four Roads), Rajanagar, Thoramangalam, Perambalur – 621220, Tamil Nadu.',
    coordinates: {
      latitude: 11.2341,
      longitude: 78.8821,
    },
    googleMapsEmbedUrl: 'https://maps.google.com/maps?q=Thiripura+Complex,+Main+Road,+Rajanagar,+Thoramangalam,+Perambalur,+Tamil+Nadu+621220&t=&z=16&ie=UTF8&iwloc=&output=embed',
    googleMapsDirectionUrl: 'https://maps.google.com/?q=Thiripura+Complex+Rajanagar+Thoramangalam+Perambalur+Tamil+Nadu+621220',
  },

  contact: {
    primaryPhone: '+91 98424 51220',
    primaryPhoneRaw: '+919842451220',
    email: 'contact@focusacademyperambalur.com',
    supportEmail: 'focusacademy.perambalur@gmail.com',
    whatsappNumber: '919842451220',
  },

  timings: {
    workingDays: 'Monday – Saturday',
    dailyHours: '4:00 PM – 9:00 PM',
    sundayPolicy: 'Closed Sundays except mock test reviews & doubt sessions by appointment',
    slots: [
      {
        id: 'slot-1',
        name: 'Batch 1 • Early Evening',
        time: '4:30 PM – 6:00 PM',
        grades: 'Classes 6 to 8 (Middle School Foundation)',
        focus: 'Mathematics Core, General Science, Homework & Concept Clarity',
      },
      {
        id: 'slot-2',
        name: 'Batch 2 • Prime Board Slot',
        time: '6:00 PM – 7:30 PM',
        grades: 'Classes 9 & 10 (Secondary Board Preparation)',
        focus: 'Board Maths, Physics, Chemistry, Biology, Chapter-wise Mock Tests',
      },
      {
        id: 'slot-3',
        name: 'Batch 3 • Late Evening Senior Slot',
        time: '7:30 PM – 9:00 PM',
        grades: 'Classes 11 & 12 (Higher Secondary STEM & NEET/JEE Foundation)',
        focus: 'Derivations, Numerical Problem Solving, Previous Year Board Question Drills',
      },
    ],
  },

  academicStats: {
    batchSizeLimit: 'Max 12 Students',
    studentTeacherRatio: '1 : 12',
    weeklyMockExams: 'Every Saturday',
    boardPassRate: '98.4%',
  },
};
