/**
 * The four /industries/* pages are parallel templates: same section
 * structure, different content. Ported verbatim from the live site.
 * One template renders all four from these objects.
 */

import type { Faq } from "./faq";

export type Industry = {
  slug: string;
  name: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  problems: string[];
  helps: string[];
  faqs: Faq[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "hospitals",
    name: "Hospitals & Medical Centers",
    metaTitle:
      "Hospitals & Medical Centers Queue & Patient Flow Software | ojao",
    metaDescription:
      "Scale OPD triage with virtual lobby dispatch. Balance walk-in patients with scheduled check-ups across large hospital wings.",
    h1: "Hospitals & Medical Centers",
    intro:
      "Large hospital OPDs juggle scheduled appointments, walk-ins, and emergency cases across dozens of departments at once. ojao gives administrators one live view of every queue in the building instead of a wing-by-wing paper-token system.",
    problems: [
      "Patients crowd registration desks and corridors simply to find out how long they'll wait.",
      "Walk-ins and scheduled appointments compete for the same physical space with no shared visibility.",
      "Front-desk staff spend a large share of their day answering “how much longer?” instead of processing patients.",
      "Department heads have no real-time picture of where bottlenecks are forming until the lobby is already overflowing.",
    ],
    helps: [
      "Patients join a virtual queue from the registration desk, a kiosk, or their phone, and can wait outside the physical lobby.",
      "Each department's queue is visible on a single admin dashboard, so hospital administrators can see where congestion is building before it becomes a crowd.",
      "Automated SMS/app notifications tell patients when to head to the consultation room, reducing the need to camp out near the door.",
      "Walk-ins and scheduled patients are merged into one ordered queue per doctor, instead of running two separate, competing systems.",
    ],
    faqs: [
      {
        q: "Can ojao handle multiple departments and doctors at once?",
        a: "Yes. Each department and doctor gets its own queue, and hospital administrators get a unified dashboard across all of them, rather than needing to check department-by-department.",
      },
      {
        q: "Does this require new hardware at every desk?",
        a: "ojao is designed to run on the devices a front desk already has — no proprietary kiosk hardware is required to get started.",
      },
      {
        q: "How do patients know when it's their turn?",
        a: "Patients get real-time updates through SMS or the ojao app as their position in the queue changes, so they don't need to keep checking a physical display board.",
      },
    ],
  },
  {
    slug: "clinics",
    name: "Multi-Specialty Clinics",
    metaTitle:
      "Multi-Specialty Clinics Queue & Patient Flow Software | ojao",
    metaDescription:
      "Consolidate multiple doctors onto a single connected panel. Keep patients updated as consultation times shift through the day.",
    h1: "Multi-Specialty Clinics",
    intro:
      "In a multi-specialty clinic, consultation times drift constantly — a longer-than-expected case with one doctor can throw off every patient waiting behind them. ojao keeps every patient's expected time updated live instead of leaving them guessing in a waiting room.",
    problems: [
      "A single delayed consultation cascades into a crowded waiting room for every doctor sharing that space.",
      "Receptionists juggle phone calls, walk-ins, and in-person queue management simultaneously.",
      "Patients who arrive early have no choice but to sit in the clinic rather than run an errand nearby.",
    ],
    helps: [
      "Each doctor's queue updates independently and in real time, so a delay with one physician doesn't require manually recalculating everyone else's wait.",
      "Patients can join the queue remotely and get a live estimated call time, so they can arrive closer to when they'll actually be seen.",
      "Reception staff manage all doctors' queues from a single connected panel instead of separate physical token systems per room.",
    ],
    faqs: [
      {
        q: "Can patients join the queue before arriving at the clinic?",
        a: "Yes — patients can be added to a doctor's queue remotely and receive live updates on their position before they need to be physically present.",
      },
      {
        q: "What happens if a doctor runs late?",
        a: "The queue for that doctor updates automatically, and patients waiting behind that consultation see their revised expected time rather than a static, outdated number.",
      },
    ],
  },
  {
    slug: "diagnostic-labs",
    name: "Pathology & Diagnostic Labs",
    metaTitle:
      "Pathology & Diagnostic Labs Queue & Patient Flow Software | ojao",
    metaDescription:
      "Fast-track peak morning fasting blood draws. Route tokens by test requirement to the right desk station.",
    h1: "Pathology & Diagnostic Labs",
    intro:
      "Diagnostic labs face a sharp morning rush — fasting blood draws, sample collection, and report pickup all converge in the same one to two hour window. ojao routes each patient to the right station based on what they actually need, instead of one long undifferentiated line.",
    problems: [
      "Fasting blood draws create a concentrated morning crowd that overwhelms a single reception line.",
      "Different test types (blood draw, sample drop-off, report collection) all queue at the same desk even though they need different staff and time.",
      "Manual clipboards and paper tokens make it hard to know which patient has been waiting longest.",
    ],
    helps: [
      "Patients are routed by test/collection type to the appropriate desk station, rather than one shared line for every kind of visit.",
      "Live queue status lets lab staff see collection-category backlogs as they build, instead of discovering them once the waiting area is full.",
      "Patients get notified as their turn approaches, reducing the number of people physically standing in the collection area at any given moment.",
    ],
    faqs: [
      {
        q: "Can ojao separate patients by test type or collection category?",
        a: "Yes — tokens can be routed to different desk stations based on what the patient is there for, rather than treating every visit the same.",
      },
      {
        q: "Does this help with the morning fasting-draw rush specifically?",
        a: "The system is built to handle concentrated peak-hour volume by distributing patients across appropriate stations and giving staff live visibility into where the backlog is forming.",
      },
    ],
  },
  {
    slug: "radiology",
    name: "Radiology & Imaging Centers",
    metaTitle:
      "Radiology & Imaging Centers Queue & Patient Flow Software | ojao",
    metaDescription:
      "Align high-duration MRI, CT, and ultrasound scans. Manage emergency slots dynamically without manual lobby chaos.",
    h1: "Radiology & Imaging Centers",
    intro:
      "Radiology scheduling is uniquely hard: scan durations vary widely, emergency cases need to cut the line without derailing the whole day, and patients often wait in gowns in cold holding areas with no information. ojao gives radiology centres a live, adjustable schedule instead of a fixed paper slot sheet.",
    problems: [
      "Emergency scans displace scheduled patients, and the rest of the day's schedule has to be manually re-worked.",
      "Patients wait indefinitely in holding areas with no visibility into delays.",
      "Different scan types (MRI, CT, ultrasound) have very different durations, making a single fixed time-slot system inaccurate.",
    ],
    helps: [
      "Scan schedules can be adjusted dynamically when an emergency case is inserted, with downstream patients notified automatically rather than left waiting.",
      "Real-time delay updates are pushed to patients so holding areas stay calmer and less crowded.",
      "Slot durations can reflect the actual scan type instead of a one-size-fits-all time block.",
    ],
    faqs: [
      {
        q: "How does ojao handle emergency scans that need to jump the queue?",
        a: "Emergency cases can be inserted into the schedule, and the system recalculates and communicates updated wait times to the patients affected, instead of requiring manual re-coordination.",
      },
      {
        q: "Can different scan types have different time slots?",
        a: "Yes — MRI, CT, and ultrasound appointments can be scheduled with durations that reflect the actual procedure rather than a fixed generic slot.",
      },
    ],
  },
];

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
