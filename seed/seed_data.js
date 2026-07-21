// Seed dataset for ojao, generated programmatically to stay compact.
//
// Everything is written under `clinics/main/<collection>/<docId>` to match
// FirestorePaths in lib/data/services/firestore_service.dart. Dates are
// ISO-8601 strings so they parse via each model's fromJson().
//
// Edit the arrays below to taste, then run `node seed_firestore.js`.

const NOW = new Date('2026-07-18T09:00:00.000Z');
const iso = (minutesAgo) =>
  new Date(NOW.getTime() - minutesAgo * 60000).toISOString();

// --- Departments -----------------------------------------------------------
const departments = [
  { id: 'cardiology', name: 'Cardiology', description: 'Heart & vascular care', icon: 'cardiology', avgWaitMinutes: 18, activeDoctors: 3, currentServing: 'CA-104', isActive: true },
  { id: 'radiology', name: 'Radiology', description: 'X-ray, CT & MRI imaging', icon: 'radiology', avgWaitMinutes: 25, activeDoctors: 2, currentServing: 'RA-058', isActive: true },
  { id: 'general-medicine', name: 'General Medicine', description: 'Everyday illness & checkups', icon: 'stethoscope', avgWaitMinutes: 12, activeDoctors: 5, currentServing: 'GM-231', isActive: true },
  { id: 'orthopedics', name: 'Orthopedics', description: 'Bones, joints & sports injuries', icon: 'bone', avgWaitMinutes: 30, activeDoctors: 2, currentServing: 'OR-042', isActive: true },
  { id: 'pediatrics', name: 'Pediatrics', description: 'Child & infant health', icon: 'child', avgWaitMinutes: 15, activeDoctors: 3, currentServing: 'PE-117', isActive: true },
  { id: 'dermatology', name: 'Dermatology', description: 'Skin, hair & nail care', icon: 'skin', avgWaitMinutes: 22, activeDoctors: 2, currentServing: 'DE-076', isActive: true },
  { id: 'ent', name: 'ENT', description: 'Ear, nose & throat', icon: 'ear', avgWaitMinutes: 20, activeDoctors: 1, currentServing: 'EN-019', isActive: false },
];

// Map a department id to the token code prefix used in its queue.
const deptMeta = {
  cardiology: { label: 'Cardiology', prefix: 'CA', doctors: ['doc-cardio-01', 'doc-cardio-02'] },
  radiology: { label: 'Radiology', prefix: 'RA', doctors: ['doc-radio-01'] },
  'general-medicine': { label: 'General Medicine', prefix: 'GM', doctors: ['doc-genmed-01', 'doc-genmed-03'] },
  orthopedics: { label: 'Orthopedics', prefix: 'OR', doctors: ['doc-ortho-01'] },
  pediatrics: { label: 'Pediatrics', prefix: 'PE', doctors: ['doc-peds-01'] },
  dermatology: { label: 'Dermatology', prefix: 'DE', doctors: ['doc-derm-01'] },
};

const NAMES = [
  'Aarav Sharma', 'Diya Patel', 'Rohan Mehta', 'Isha Nair', 'Kabir Singh',
  'Ananya Rao', 'Vivaan Gupta', 'Myra Joshi', 'Arjun Reddy', 'Sara Khan',
  'Aditya Verma', 'Kiara Menon', 'Ishaan Bose', 'Riya Desai', 'Vihaan Iyer',
  'Anaya Kulkarni', 'Reyansh Jain', 'Aisha Kapoor', 'Dhruv Malhotra', 'Zara Sheikh',
];

// --- Analytics (single doc) ------------------------------------------------
const analytics = {
  current: {
    id: 'current',
    activePatients: 27,
    avgWaitReduction: 41.5,
    patientSatisfaction: 4.6,
    imagingTurnaround: 23,
    patientsServed: 184,
    updatedAt: iso(30),
  },
};

// --- Tokens (the live queue) ----------------------------------------------
// A few per active department, mixing statuses so screens have variety.
const statusPlan = ['serving', 'called', 'waiting', 'waiting', 'completed'];
const tokens = {};
let nameIdx = 0;
let patientCounter = 1;
Object.entries(deptMeta).forEach(([, meta]) => {
  let seq = Math.floor(Math.random() * 40) + 40;
  statusPlan.forEach((status, i) => {
    seq += 1;
    const num = `${meta.prefix}-${seq}`;
    const id = `tok-${num.toLowerCase().replace('-', '-')}`;
    const patientId = `seed-patient-${String(patientCounter++).padStart(2, '0')}`;
    const createdMinAgo = 70 - i * 8;
    const doc = {
      id,
      tokenNumber: num,
      patientName: NAMES[nameIdx++ % NAMES.length],
      department: meta.label,
      status,
      queuePosition: status === 'waiting' ? i : 0,
      etaMinutes: status === 'waiting' ? i * 8 + 5 : 0,
      patientId,
      doctorId: meta.doctors[i % meta.doctors.length],
      createdAt: iso(createdMinAgo),
    };
    if (status !== 'waiting') doc.calledAt = iso(createdMinAgo - 20);
    if (status === 'serving' || status === 'completed') doc.servedAt = iso(createdMinAgo - 30);
    if (status === 'completed') doc.completedAt = iso(createdMinAgo - 45);
    tokens[id] = doc;
  });
});

// --- Appointments ----------------------------------------------------------
const appointments = {};
const activeDeptIds = Object.keys(deptMeta);
for (let i = 1; i <= 12; i++) {
  const deptId = activeDeptIds[i % activeDeptIds.length];
  const meta = deptMeta[deptId];
  const id = `appt-${String(i).padStart(3, '0')}`;
  const status = ['pending', 'confirmed', 'confirmed', 'completed', 'cancelled'][i % 5];
  const scheduledInMin = (i - 4) * 90; // some past, some future
  appointments[id] = {
    id,
    patientId: `seed-patient-${String((i % 15) + 1).padStart(2, '0')}`,
    patientName: NAMES[i % NAMES.length],
    doctorId: meta.doctors[i % meta.doctors.length],
    doctorName: `Dr. ${NAMES[(i + 5) % NAMES.length].split(' ')[1]}`,
    department: meta.label,
    scheduledAt: iso(-scheduledInMin),
    status,
    notes: i % 3 === 0 ? 'Follow-up visit' : null,
    createdAt: iso(i * 120),
  };
}

module.exports = { departments, analytics, tokens, appointments };
