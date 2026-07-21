// Seed dataset for ojao, generated programmatically to stay compact.
//
// The app is MULTI-FACILITY. Every document is written beneath the facility
// that owns it, matching FirestorePaths in the Flutter app:
//
//   facilities/{facilityId}                          (facility doc)
//   facilities/{facilityId}/departments/{deptId}
//   facilities/{facilityId}/analytics/current
//   facilities/{facilityId}/tokens/{tokenId}
//   facilities/{facilityId}/appointments/{apptId}
//
// Tokens and appointments also carry `facilityId` / `facilityName` so the
// app's patient-side collection-group queries can resolve the owning facility.
//
// Edit the arrays below to taste, then run `node seed_firestore.js`.

const NOW = new Date('2026-07-18T09:00:00.000Z');
const iso = (minutesAgo) =>
  new Date(NOW.getTime() - minutesAgo * 60000).toISOString();

// --- Facilities ------------------------------------------------------------
// Coordinates are clustered around central Bengaluru so the app's
// distance-sort has something meaningful to order. `departmentSet` picks which
// department template each facility exposes (hospitals broad, diagnostic
// centers imaging-only, etc.).
const facilities = [
  { id: 'apollo-hospital', name: 'Apollo Hospital', type: 'hospital', address: '154 Bannerghatta Rd, Bengaluru', latitude: 12.9141, longitude: 77.5960, rating: 4.6, departmentSet: 'hospital' },
  { id: 'fortis-hospital', name: 'Fortis Hospital', type: 'hospital', address: '14 Cunningham Rd, Bengaluru', latitude: 12.9899, longitude: 77.5925, rating: 4.4, departmentSet: 'hospital' },
  { id: 'manipal-hospital', name: 'Manipal Hospital', type: 'hospital', address: '98 HAL Airport Rd, Bengaluru', latitude: 12.9591, longitude: 77.6494, rating: 4.5, departmentSet: 'hospital' },
  { id: 'sunrise-clinic', name: 'Sunrise Family Clinic', type: 'clinic', address: '22 Indiranagar 100ft Rd, Bengaluru', latitude: 12.9719, longitude: 77.6412, rating: 4.3, departmentSet: 'clinic' },
  { id: 'wellness-clinic', name: 'Wellness Point Clinic', type: 'clinic', address: '5 Koramangala 5th Block, Bengaluru', latitude: 12.9352, longitude: 77.6245, rating: 4.2, departmentSet: 'clinic' },
  { id: 'citycare-clinic', name: 'CityCare Polyclinic', type: 'clinic', address: '71 Jayanagar 4th Block, Bengaluru', latitude: 12.9250, longitude: 77.5938, rating: 4.1, departmentSet: 'clinic' },
  { id: 'medscan-diagnostics', name: 'MedScan Diagnostics', type: 'diagnostic', address: '40 MG Rd, Bengaluru', latitude: 12.9750, longitude: 77.6060, rating: 4.7, departmentSet: 'diagnostic' },
  { id: 'precise-labs', name: 'Precise Diagnostic Labs', type: 'diagnostic', address: '9 Whitefield Main Rd, Bengaluru', latitude: 12.9698, longitude: 77.7499, rating: 4.5, departmentSet: 'diagnostic' },
];

// --- Department templates --------------------------------------------------
// Each entry: id, name, description, icon, avgWaitMinutes, prefix, doctors[].
const DEPT_TEMPLATES = {
  cardiology: { name: 'Cardiology', description: 'Heart & vascular care', icon: 'cardiology', avgWaitMinutes: 18, prefix: 'CA', doctors: ['doc-cardio-01', 'doc-cardio-02'] },
  radiology: { name: 'Radiology', description: 'X-ray, CT & MRI imaging', icon: 'radiology', avgWaitMinutes: 25, prefix: 'RA', doctors: ['doc-radio-01'] },
  'general-medicine': { name: 'General Medicine', description: 'Everyday illness & checkups', icon: 'general', avgWaitMinutes: 12, prefix: 'GM', doctors: ['doc-genmed-01', 'doc-genmed-03'] },
  orthopedics: { name: 'Orthopedics', description: 'Bones, joints & sports injuries', icon: 'ortho', avgWaitMinutes: 30, prefix: 'OR', doctors: ['doc-ortho-01'] },
  pediatrics: { name: 'Pediatrics', description: 'Child & infant health', icon: 'child', avgWaitMinutes: 15, prefix: 'PE', doctors: ['doc-peds-01'] },
  dermatology: { name: 'Dermatology', description: 'Skin, hair & nail care', icon: 'general', avgWaitMinutes: 22, prefix: 'DE', doctors: ['doc-derm-01'] },
  pathology: { name: 'Pathology Lab', description: 'Blood tests & sample collection', icon: 'lab', avgWaitMinutes: 10, prefix: 'PA', doctors: ['doc-path-01'] },
  imaging: { name: 'Imaging (CT/MRI)', description: 'CT, MRI & ultrasound scans', icon: 'imaging', avgWaitMinutes: 35, prefix: 'IM', doctors: ['doc-img-01'] },
};

// Which departments each facility type offers.
const DEPARTMENT_SETS = {
  hospital: ['cardiology', 'radiology', 'general-medicine', 'orthopedics', 'pediatrics', 'dermatology'],
  clinic: ['general-medicine', 'pediatrics', 'dermatology'],
  diagnostic: ['pathology', 'imaging', 'radiology'],
};

const NAMES = [
  'Aarav Sharma', 'Diya Patel', 'Rohan Mehta', 'Isha Nair', 'Kabir Singh',
  'Ananya Rao', 'Vivaan Gupta', 'Myra Joshi', 'Arjun Reddy', 'Sara Khan',
  'Aditya Verma', 'Kiara Menon', 'Ishaan Bose', 'Riya Desai', 'Vihaan Iyer',
  'Anaya Kulkarni', 'Reyansh Jain', 'Aisha Kapoor', 'Dhruv Malhotra', 'Zara Sheikh',
];

// Deterministic pseudo-random so re-seeding is stable (no Math.random()).
let _seed = 1234567;
function rand() {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}

// --- Build per-facility documents ------------------------------------------
// facilityDocs[facilityId] = { facility, departments, analytics, tokens, appointments }
const facilityDocs = {};
let nameIdx = 0;
let patientCounter = 1;
const statusPlan = ['serving', 'called', 'waiting', 'waiting', 'completed'];

for (const fac of facilities) {
  const deptIds = DEPARTMENT_SETS[fac.departmentSet];

  // Departments for this facility.
  const departments = {};
  deptIds.forEach((deptId) => {
    const t = DEPT_TEMPLATES[deptId];
    const serving = `${t.prefix}-${Math.floor(rand() * 90) + 10}`;
    departments[deptId] = {
      id: deptId,
      name: t.name,
      description: t.description,
      icon: t.icon,
      avgWaitMinutes: t.avgWaitMinutes,
      activeDoctors: t.doctors.length,
      currentServing: serving,
      isActive: true,
    };
  });

  // Live queue tokens: a few per department, mixed statuses.
  const tokens = {};
  deptIds.forEach((deptId) => {
    const t = DEPT_TEMPLATES[deptId];
    let seq = Math.floor(rand() * 40) + 40;
    statusPlan.forEach((status, i) => {
      seq += 1;
      const num = `${t.prefix}-${seq}`;
      const id = `tok-${fac.id}-${num.toLowerCase()}`;
      const patientId = `seed-patient-${String(patientCounter++).padStart(3, '0')}`;
      const createdMinAgo = 70 - i * 8;
      const doc = {
        id,
        tokenNumber: num,
        patientName: NAMES[nameIdx++ % NAMES.length],
        department: t.name,
        status,
        queuePosition: status === 'waiting' ? i : 0,
        etaMinutes: status === 'waiting' ? i * 8 + 5 : 0,
        patientId,
        doctorId: t.doctors[i % t.doctors.length],
        facilityId: fac.id,
        facilityName: fac.name,
        createdAt: iso(createdMinAgo),
      };
      if (status !== 'waiting') doc.calledAt = iso(createdMinAgo - 20);
      if (status === 'serving' || status === 'completed') doc.servedAt = iso(createdMinAgo - 30);
      if (status === 'completed') doc.completedAt = iso(createdMinAgo - 45);
      tokens[id] = doc;
    });
  });

  // Appointments: a handful per facility.
  const appointments = {};
  for (let i = 1; i <= 4; i++) {
    const deptId = deptIds[i % deptIds.length];
    const t = DEPT_TEMPLATES[deptId];
    const id = `appt-${fac.id}-${String(i).padStart(2, '0')}`;
    const status = ['pending', 'confirmed', 'confirmed', 'completed', 'cancelled'][i % 5];
    const scheduledInMin = (i - 2) * 120; // some past, some future
    appointments[id] = {
      id,
      facilityId: fac.id,
      facilityName: fac.name,
      patientId: `seed-patient-${String((i % 15) + 1).padStart(3, '0')}`,
      patientName: NAMES[i % NAMES.length],
      doctorId: t.doctors[i % t.doctors.length],
      doctorName: `Dr. ${NAMES[(i + 5) % NAMES.length].split(' ')[1]}`,
      department: t.name,
      scheduledAt: iso(-scheduledInMin),
      status,
      notes: i % 3 === 0 ? 'Follow-up visit' : null,
      createdAt: iso(i * 120),
    };
  }

  // Analytics snapshot for this facility.
  const analytics = {
    current: {
      id: 'current',
      activePatients: Object.values(tokens).filter((t) => t.status !== 'completed').length,
      avgWaitReduction: 30 + Math.floor(rand() * 20),
      patientSatisfaction: fac.rating,
      imagingTurnaround: 18 + Math.floor(rand() * 12),
      patientsServed: 120 + Math.floor(rand() * 120),
      updatedAt: iso(30),
    },
  };

  // The facility document itself (with a live department count).
  const facilityDoc = {
    id: fac.id,
    name: fac.name,
    type: fac.type,
    address: fac.address,
    latitude: fac.latitude,
    longitude: fac.longitude,
    rating: fac.rating,
    departmentCount: deptIds.length,
    isActive: true,
  };

  facilityDocs[fac.id] = {
    facility: facilityDoc,
    departments,
    analytics,
    tokens,
    appointments,
  };
}

module.exports = { facilityDocs };
