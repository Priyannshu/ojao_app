/**
 * The four blog posts, ported from the live site. These are the organic-search
 * assets — losing them costs real traffic, so the copy, the pull quotes, and
 * the academic references are all preserved.
 *
 * Typed constants rather than MDX: four posts don't justify a content pipeline,
 * and this keeps everything type-checked.
 */

import type { Faq } from "./faq";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] };

export type Section = { heading: string; blocks: Block[] };

export type Post = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  author: { name: string; role: string };
  date: string;
  isoDate: string;
  pullQuote: { text: string; cite: string };
  sections: Section[];
  faqs: Faq[];
  references: string[];
  related: string[];
};

export const POSTS: Post[] = [
  {
    slug: "hospital-queue-management-system-india-guide",
    title: "Hospital Queue Management System in India: A Complete Guide",
    metaTitle:
      "Hospital Queue Management System in India: A Complete Guide | ojao Blog",
    metaDescription:
      "What a hospital queue management system actually does, why Indian OPDs need one, and what to look for before you evaluate vendors.",
    excerpt:
      "What a hospital queue management system actually does, why Indian OPDs need one, and what to look for before you evaluate vendors.",
    author: { name: "Subham Ojha", role: "Co-Founder & CEO" },
    date: "13 July 2026",
    isoDate: "2026-07-13",
    pullQuote: {
      text: "Patients consistently rate not knowing how long they'll wait as more stressful than the wait itself — which is why a live, updating estimate changes the experience even when the actual wait doesn't get shorter.",
      cite: "Maister, D.H. (1984), The Psychology of Waiting Lines, Harvard Business School",
    },
    sections: [
      {
        heading: "What is a hospital queue management system?",
        blocks: [
          {
            kind: "p",
            text: "A hospital queue management system replaces the paper token or the physical line at a registration desk with a digital record of who is waiting, for which doctor or department, and in what order. Instead of a patient standing in a corridor to find out how long they'll wait, the system tracks their position and pushes updates to them directly.",
          },
          {
            kind: "p",
            text: "In practice, this covers three things: getting a patient into the right queue (registration or self-check-in), keeping that queue visible to staff and patients in real time, and notifying the patient when it's actually their turn.",
          },
        ],
      },
      {
        heading: "Why Indian OPDs specifically need this",
        blocks: [
          {
            kind: "p",
            text: "Outpatient departments in India routinely handle a mix of walk-ins and scheduled appointments in the same physical space, often across many departments running in parallel. A single registration desk or hallway becomes the default waiting room for all of it, which is exactly the setup that produces overcrowding.",
          },
          {
            kind: "p",
            text: "This is different from a purely appointment-only clinic model common in some other healthcare systems, where a queue management system mainly smooths minor scheduling drift. In a high-walk-in OPD, the system needs to actively manage the mix of scheduled and unscheduled patients, not just display a number.",
          },
        ],
      },
      {
        heading: "What to actually look for",
        blocks: [
          {
            kind: "list",
            items: [
              "Multi-department support with one admin view — you should not need to check queue status department by department.",
              "No dependency on proprietary kiosk hardware — a system that works on whatever devices the front desk already has is faster to roll out and cheaper to maintain.",
              "Real-time patient notification via SMS or app, not just a physical display board, since patients often wait outside the immediate lobby.",
              "The ability to handle walk-ins and scheduled patients in the same ordered queue, rather than running two separate, competing systems that staff have to manually reconcile.",
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Does a queue management system replace an EMR/HIS?",
        a: "No. A queue management system handles patient flow and waiting — who's next, how long the wait is, and how that information reaches the patient. It's a different layer from electronic medical records, though the two often need to work together.",
      },
      {
        q: "Do patients need a smartphone app to use it?",
        a: "Not necessarily. Many systems, including SMS-based notification, work without requiring the patient to install anything — that matters in markets with mixed smartphone adoption.",
      },
      {
        q: "How long does it take to roll out at a hospital?",
        a: "This varies significantly by hospital size, number of departments, and whether existing hardware can be reused. It's worth asking any vendor for a department-by-department rollout plan rather than assuming a single go-live date for the entire facility.",
      },
    ],
    references: [
      "Maister, D.H. (1984). The Psychology of Waiting Lines. Harvard Business School Working Paper.",
      "World Health Organization (2015). People-Centred and Integrated Health Services: An Overview of the Evidence. WHO/HIS/SDS/2015.7.",
      "NHS Institute for Innovation and Improvement (2013). Improving Patient Flow. NHS Modernisation Agency.",
    ],
    related: ["reducing-opd-wait-times", "digital-token-vs-paper-queue"],
  },
  {
    slug: "how-to-choose-patient-flow-software",
    title:
      "How to Choose Patient Flow Software: A Buyer's Checklist for Indian Clinics",
    metaTitle:
      "How to Choose Patient Flow Software: A Buyer's Checklist for Indian Clinics | ojao Blog",
    metaDescription:
      "A practical framework for evaluating patient flow and queue management vendors before you commit to a pilot.",
    excerpt:
      "A practical framework for evaluating patient flow and queue management vendors before you commit to a pilot.",
    author: { name: "Priyanshu Ojha", role: "Co-Founder & CTO" },
    date: "13 July 2026",
    isoDate: "2026-07-13",
    pullQuote: {
      text: "Any vendor handling patient queue data in India should be evaluated against the Digital Personal Data Protection Act, 2023 — ask specifically about data minimisation, retention limits, and whether patients or hospitals can request permanent deletion.",
      cite: "Digital Personal Data Protection Act, 2023, Ministry of Electronics and Information Technology, Government of India",
    },
    sections: [
      {
        heading: "Start with where the bottleneck actually is",
        blocks: [
          {
            kind: "p",
            text: "Before comparing vendors, map where patients actually lose time: at registration, between registration and consultation, or at a shared resource like a pharmacy or lab counter. Different tools solve different parts of this chain, and a system optimised for consultation-room queuing won't necessarily fix a pharmacy backlog.",
          },
        ],
      },
      {
        heading: "Questions worth asking every vendor",
        blocks: [
          {
            kind: "list",
            items: [
              "Can the system handle both walk-ins and scheduled appointments in a single queue, or does it assume one model?",
              "What happens on a slow, unreliable internet connection — does the front desk stop functioning, or is there a fallback?",
              "Does the notification system work over SMS, or only through an app that patients must install?",
              "Can queue priority be adjusted manually for urgent cases without breaking the rest of the queue order?",
              "What does onboarding actually look like for reception staff who are used to a paper token system?",
            ],
          },
        ],
      },
      {
        heading: "Run a real pilot before a full rollout",
        blocks: [
          {
            kind: "p",
            text: "A short pilot in one department, during a normal (not unusually quiet) week, tells you far more than a vendor demo. Watch specifically for how the front desk handles the first hour of a busy morning and whether staff revert to paper as a workaround under pressure — that's the clearest signal of whether the tool fits the actual workflow.",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Should we pilot in our busiest department or a quieter one?",
        a: "A moderately busy department is usually more informative than the quietest one — you want to see how the system behaves under real pressure without risking your highest-stakes workflow on day one.",
      },
      {
        q: "What's a reasonable pilot length?",
        a: "Long enough to cover at least one full weekly cycle, including the busiest day, so you're not judging the system only on an atypical day.",
      },
    ],
    references: [
      "Ministry of Electronics and Information Technology, Government of India (2023). The Digital Personal Data Protection Act, 2023. Government of India.",
    ],
    related: [
      "hospital-queue-management-system-india-guide",
      "digital-token-vs-paper-queue",
    ],
  },
  {
    slug: "reducing-opd-wait-times",
    title: "Reducing OPD Wait Times: A Practical Framework",
    metaTitle: "Reducing OPD Wait Times: A Practical Framework | ojao Blog",
    metaDescription:
      "Where OPD wait time actually comes from, and the levers that make the biggest difference before you touch technology.",
    excerpt:
      "Where OPD wait time actually comes from, and the levers that make the biggest difference before you touch technology.",
    author: { name: "Subham Ojha", role: "Co-Founder & CEO" },
    date: "13 July 2026",
    isoDate: "2026-07-13",
    pullQuote: {
      text: "Giving patients an accurate, updating wait estimate measurably reduces frustration compared to giving them no information at all — even in cases where the actual wait time is identical.",
      cite: "Maister, D.H. (1984), The Psychology of Waiting Lines, Harvard Business School",
    },
    sections: [
      {
        heading: "Wait time has more than one source",
        blocks: [
          {
            kind: "p",
            text: "“Wait time” is usually treated as one number, but it's really the sum of several separate delays: time to registration, time from registration to being called, and time from being called to actually entering the consultation room. Each of these has a different cause and a different fix.",
          },
        ],
      },
      {
        heading: "The biggest lever is usually visibility, not speed",
        blocks: [
          {
            kind: "p",
            text: "A large share of patient frustration comes not from the wait itself but from not knowing how long it will be. Giving patients an honest, updating estimate — even if the wait doesn't get shorter — measurably changes how the wait is experienced, and it takes pressure off front-desk staff who would otherwise field constant status questions.",
          },
        ],
      },
      {
        heading: "Where digital queue tracking actually helps",
        blocks: [
          {
            kind: "list",
            items: [
              "It lets patients wait away from the physical lobby, which reduces perceived crowding even when actual wait time is unchanged.",
              "It gives administrators a live view of where a backlog is forming, so staff can be redeployed before the lobby is already full.",
              "It removes the need for a patient to keep re-asking reception for a status update, freeing staff time for actual patient processing.",
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Does digital queue tracking actually shorten consultations?",
        a: "No — it doesn't change how long a consultation takes. What it changes is how the waiting time is communicated and experienced, and how efficiently staff can respond to building backlogs.",
      },
      {
        q: "What's the fastest change a clinic can make without new software?",
        a: "Simply communicating an honest estimated wait time at check-in, even manually, tends to reduce patient frustration before any technology is introduced.",
      },
    ],
    references: [
      "Maister, D.H. (1984). The Psychology of Waiting Lines. Harvard Business School Working Paper.",
      "World Health Organization (2015). People-Centred and Integrated Health Services: An Overview of the Evidence. WHO/HIS/SDS/2015.7.",
    ],
    related: [
      "hospital-queue-management-system-india-guide",
      "digital-token-vs-paper-queue",
    ],
  },
  {
    slug: "digital-token-vs-paper-queue",
    title: "Digital Token Systems vs Traditional Paper Queues",
    metaTitle: "Digital Token Systems vs Traditional Paper Queues | ojao Blog",
    metaDescription:
      "A side-by-side look at what actually changes when a clinic moves from paper tokens to a digital queue.",
    excerpt:
      "A side-by-side look at what actually changes when a clinic moves from paper tokens to a digital queue.",
    author: { name: "Priyanshu Ojha", role: "Co-Founder & CTO" },
    date: "13 July 2026",
    isoDate: "2026-07-13",
    pullQuote: {
      text: "India's Ayushman Bharat Digital Mission has registered hundreds of millions of ABHA health IDs, reflecting a national shift toward digital-first healthcare infrastructure — a paper token system has no way to participate in that shift.",
      cite: "Ministry of Health & Family Welfare, Government of India, Ayushman Bharat Digital Mission",
    },
    sections: [
      {
        heading: "What paper tokens are good at",
        blocks: [
          {
            kind: "p",
            text: "Paper tokens are simple, require no infrastructure, and are immediately understandable to anyone. For a small, single-doctor clinic with predictable, light patient flow, a paper system may genuinely be sufficient — it's worth being honest about this rather than assuming every clinic needs to digitise.",
          },
        ],
      },
      {
        heading: "Where paper tokens break down",
        blocks: [
          {
            kind: "p",
            text: "The limitations show up as volume and complexity increase: multiple departments sharing one waiting area, walk-ins mixing with scheduled patients, or any need to notify a patient who isn't standing in the room. A paper token can't push a status update to someone who's stepped outside, and it gives administrators no aggregate, real-time view across departments.",
          },
        ],
      },
      {
        heading: "What actually changes with a digital system",
        blocks: [
          {
            kind: "list",
            items: [
              "Patients can wait away from the physical queue and be notified as their turn approaches, instead of needing to stay within earshot.",
              "Staff get a live, cross-department view instead of having to physically check each waiting area.",
              "Queue data becomes something administrators can look back on — where bottlenecks form, at what time of day — instead of being discarded with the token.",
            ],
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Is a digital system worth it for a small single-doctor clinic?",
        a: "Not always. If patient volume is low and predictable, the operational benefit may be limited. Digital queue systems tend to pay off most clearly once multiple departments or a high walk-in mix are involved.",
      },
      {
        q: "Can a clinic run both paper and digital in parallel during a transition?",
        a: "Yes, and this is a reasonable way to de-risk a rollout — keeping paper as a fallback while staff and patients get used to the digital flow, rather than switching over all at once.",
      },
    ],
    references: [
      "Ministry of Health & Family Welfare, Government of India (2022). Ayushman Bharat Digital Mission: Operational Guidelines. Government of India.",
      "Ministry of Electronics and Information Technology, Government of India (2023). The Digital Personal Data Protection Act, 2023. Government of India.",
    ],
    related: [
      "hospital-queue-management-system-india-guide",
      "reducing-opd-wait-times",
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
