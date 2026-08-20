/**
 * Homepage and shared marketing copy.
 *
 * Ported from the live ojao.in on 2026-08-15. Where a line is quoted from
 * the live site it is kept verbatim, because it carries brand equity and
 * search rankings.
 *
 * REMOVED and deliberately not reproduced (see CLAIMS.md):
 *   - "300+ Clinics Live", "98% Satisfaction", "42m Avg. Time Saved",
 *     "-45% Crowding", "8,680+", "4.95/5", "5,740 feedbacks", "78.1%",
 *     "45% lobby capacity relief", "+15 Daily appointments / GP",
 *     "88% On-time draws", "-22m patient dress delay",
 *     "18% Appointment Cancellation Rate", "94% Patient Recommendation Score",
 *     "124 minutes average turnaround"
 *       → the owner confirmed on 2026-08-15 that these figures are not real.
 *   - "Fully HIPAA & GDPR Compliant" → HIPAA is a US statute and does not
 *     apply; nothing supports a GDPR claim either.
 *   - "99.9% Integration SLA" → no SLA is contracted.
 *   - "All regional care centers active" → a hardcoded green status light
 *     with no monitoring behind it.
 *
 * NOT MARKETED (features that do not exist in the app — ARCHITECTURE.md §9):
 *   hospital verification, Google Maps directions, video consultation,
 *   online payments, emergency-availability flag.
 */

export const HERO = {
  eyebrow: "Move Smarter, Live Better",
  /** Live H1, kept — it is short, sharp, and already ranking. */
  h1: "Waiting is not healthcare.",
  h1Second: "Your health doesn't wait in line.",
  sub: "ojao replaces crowded waiting lounges with high-precision digital patient flow. Empower your diagnostic centre, multi-specialty clinic, or hospital network with automated real-time token tracking.",
  primaryCta: { label: "Request Enterprise Demo", href: "#demo" },
  secondaryCta: { label: "Try Patient Simulator", href: "#simulator" },
} as const;

/** The device mock in the hero. Sample data, and labelled as such in the UI. */
export const HERO_TOKEN_MOCK = {
  time: "10:42 AM",
  department: "Radiology / MRI",
  status: "LIVE",
  activeToken: "TKN-408",
  currentTurn: "TKN-405",
  ahead: "3 patients",
} as const;

export const PROBLEM = {
  eyebrow: "Clinical Flow Redesign",
  h2: "The Patient Care Flow Paradox",
  lead: "Conventional waiting rooms are a primary driver of patient dissatisfaction. Compare the traditional layout with a calm, optimised healthcare paradigm.",
  columns: [
    {
      title: "Patients crowd the desk just to ask",
      body: "Registration desks and corridors fill with people whose only question is how much longer they have to wait.",
    },
    {
      title: "Walk-ins and appointments collide",
      body: "Two groups compete for the same physical space, with no shared visibility into who is actually next.",
    },
    {
      title: "Nobody sees the bottleneck forming",
      body: "Department heads find out a queue has backed up when the lobby is already overflowing.",
    },
  ],
  closing: "ojao fixes all three.",
} as const;

export const JOURNEY = {
  eyebrow: "Journey Flowchart",
  h2: "The Decoupled Patient Journey",
  lead: "An elegant, five-stage process connecting patients to doctors without physical waiting rooms.",
  stages: [
    {
      n: "01",
      title: "Virtual Check-In",
      body: "Search your medical care provider, choose your diagnostic or consulting department, and join the queue virtually.",
      state: "Patient home check-in complete",
    },
    {
      n: "02",
      title: "Live Queue Position",
      body: "Your position updates in real time as the department calls each patient ahead of you.",
      state: "Position tracking active",
    },
    {
      n: "03",
      title: "Approach Notification",
      body: "An SMS or app notification tells you when to head in, so you can spend the wait somewhere useful.",
      state: "Patient notified to depart",
    },
    {
      n: "04",
      title: "Arrival & Confirmation",
      body: "You arrive close to your actual call time and confirm at the desk without rejoining a line.",
      state: "Arrival confirmed at desk",
    },
    {
      n: "05",
      title: "Consultation",
      body: "The department marks the token complete, and the queue advances for everyone behind you.",
      state: "Token completed",
    },
  ],
} as const;

export const SIMULATOR = {
  eyebrow: "Interactive Simulator",
  h2: "Issue Your Virtual Token",
  lead: "Experience the ojao platform from the perspective of a patient. Enter a name, select a clinical department, and watch the queue update in real time.",
  note: "Sample data for demonstration. No information is sent anywhere and nothing is stored.",
  departments: [
    { id: "mri", label: "Radiology (MRI)", rateMinutes: 12, prefix: "MRI" },
    { id: "cardio", label: "Cardiology Consult", rateMinutes: 10, prefix: "CRD" },
    { id: "lab", label: "Diagnostic Lab (Blood Draw)", rateMinutes: 4, prefix: "LAB" },
  ],
  emptyTitle: "No Token Active",
  emptyBody: "Fill in the form and submit to view a live sample ticket.",
} as const;

export const CONSOLE = {
  eyebrow: "Enterprise Console",
  h2: "One live view across every department",
  lead: "Granular control over patient flow, station bottlenecks, and active check-ins from a single clinical admin cockpit.",
  note: "Illustrative interface with sample data — not aggregated customer metrics.",
} as const;

export const SEGMENTS = {
  eyebrow: "Enterprise Solutions",
  h2: "Custom Modules for Every Healthcare Segment",
  lead: "Each branch of medicine requires specific queue configurations. ojao is engineered to match the demands of hospitals, clinics, imaging centres, and diagnostic networks.",
  cards: [
    {
      title: "Hospitals & Medical Centers",
      body: "Scale your OPD triage with virtual lobby dispatch. Balance walk-in patients with scheduled check-ups seamlessly across large hospital wings.",
      href: "/industries/hospitals",
    },
    {
      title: "Multi-Specialty Clinics",
      body: "Consolidate multiple doctors onto a single connected panel. Keep patients updated as consultation times fluctuate throughout the day.",
      href: "/industries/clinics",
    },
    {
      title: "Pathology & Diagnostic Labs",
      body: "Fast-track peak morning fasting blood draws. Intelligently route tokens by test requirement to the right desk station.",
      href: "/industries/diagnostic-labs",
    },
    {
      title: "Radiology & Imaging Labs",
      body: "Align high-duration MRI, CT, and ultrasound scans. Manage emergency slots dynamically without manual lobby chaos.",
      href: "/industries/radiology",
    },
  ],
} as const;

export const HOSPITAL_PITCH = {
  eyebrow: "For hospitals & clinics",
  h2: "Run your front desk like a system, not a shouting match.",
  lead: "ojao gives your staff a live console to call, serve, and complete tokens across every department — plus the wait-time and throughput data to actually fix your bottlenecks.",
  cards: [
    {
      title: "Real-time queue console",
      body: "Call, serve, skip, and complete tokens as the queue moves, from any device the front desk already has.",
    },
    {
      title: "Department management",
      body: "Every department and doctor gets its own queue, with one unified dashboard across all of them.",
    },
    {
      title: "Wait-time & throughput analytics",
      body: "See where backlogs form and at what time of day, instead of discarding that signal with the paper token.",
    },
    {
      title: "Walk-ins and appointments in one queue",
      body: "Merged into a single ordered queue per doctor, so staff aren't reconciling two competing systems.",
    },
    {
      title: "No proprietary hardware",
      body: "Runs on the tablets, desktops, and phones already at your registration desk. No kiosks to buy.",
    },
    {
      title: "Works alongside your EMR/HIS",
      body: "ojao is a patient flow layer, not a records system. Clinical records stay where they are.",
    },
  ],
  pilot: {
    title: "Start with one department",
    body: "We recommend piloting in a single department first so your team can evaluate the fit before a facility-wide rollout.",
    cta: { label: "See pricing & FAQ", href: "/pricing" },
  },
} as const;

export const TRUST = {
  eyebrow: "Security & Trust",
  h2: "Queue data deserves the same care as any patient data.",
  lead: "ojao is a patient flow and queue management layer, not a clinical records system — so we deliberately keep what we collect to the minimum needed to manage a queue and notify a patient.",
  points: [
    {
      title: "Data minimisation by design",
      body: "We collect only what a queue needs: name, contact detail, department, and token status. No diagnoses, prescriptions, or medical history.",
    },
    {
      title: "Role-based access control",
      body: "Every dashboard action is tied to a specific staff account, not a shared login. Staff see only what their role requires.",
    },
    {
      title: "Built with India's DPDP Act 2023 in mind",
      body: "Designed around the Act's principles of data minimisation, purpose limitation, and a data principal's right to access, correct, and erase.",
    },
    {
      title: "No data resale, ever",
      body: "Queue data belongs to the hospital that generated it. We don't sell or share it with third parties for advertising or any other purpose.",
    },
  ],
  cta: { label: "Read the full security page", href: "/security" },
} as const;

export const FINAL_CTA = {
  eyebrow: "Decongest Your Practice Today",
  h2: "Because waiting",
  h2Second: "is not healthcare.",
  lead: "Ditch the physical waiting lounge and manual paper tokens. ojao synchronises patients, doctors, and diagnostic rooms dynamically so appointments execute with precision.",
  points: [
    {
      title: "Wait time spent elsewhere",
      body: "Patients spend the wait productively outside the clinic walls instead of in a corridor.",
    },
    {
      title: "Less lobby overcrowding",
      body: "Fewer people in the same room at once means lower transmission risk and a calmer clinical atmosphere.",
    },
  ],
} as const;

export const DEMO_FORM = {
  h3: "Schedule clinical demo",
  sub: "See ojao dynamic patient flow live in action",
  facilityTypes: [
    "Multi-Specialty Clinic",
    "Corporate Hospital / Network",
    "Diagnostic Laboratory / Desk",
    "Radiology / MRI Facility",
  ],
  submit: "Book Free Live Consultation",
} as const;

export const NAV_LINKS = [
  { label: "The Problem", href: "/#problem" },
  { label: "Patient Journey", href: "/#journey" },
  { label: "Live Simulator", href: "/#simulator" },
  { label: "Industries", href: "/industries/hospitals" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
] as const;

export const FOOTER = {
  blurb:
    "A premium, minimal patient experience and queue alignment system for hospitals, diagnostic imaging centres, and specialty clinics.",
  columns: [
    {
      title: "Solutions",
      links: [
        {
          label: "Hospital Queue Software (India)",
          href: "/solutions/hospital-queue-management-software-india",
        },
        { label: "Hospitals & Medical Centers", href: "/industries/hospitals" },
        { label: "Pathology & Diagnostic Labs", href: "/industries/diagnostic-labs" },
        { label: "Radiology & Imaging", href: "/industries/radiology" },
        { label: "Multi-Specialty Clinics", href: "/industries/clinics" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog & Guides", href: "/blog" },
        { label: "Platform Features", href: "/features" },
        { label: "Pricing & FAQ", href: "/pricing" },
        { label: "About & Team", href: "/about" },
        { label: "Security & Trust", href: "/security" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ],
  appBlurb:
    "Track real-time token ETA updates, diagnostic schedules, and receive instant alerts.",
} as const;
