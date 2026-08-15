import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { LegalShell } from "@/components/ui/LegalShell";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy | ojao",
  description:
    "How ojao collects, uses, and protects personal data across the ojao patient app and hospital dashboard.",
  path: "/privacy/",
  noindex: true,
});

const SECTIONS = [
  {
    id: "what-we-collect",
    heading: "1. What we collect",
    body: [
      "ojao is a patient flow and queue management service. We collect only what is needed to place a patient in a queue and notify them: name, a contact detail (phone number or email), the department or doctor being visited, and token status.",
      "We do not collect or store diagnoses, prescriptions, lab results, or any other clinical record. Those remain in your hospital's existing EMR/HIS.",
    ],
  },
  {
    id: "how-we-use-it",
    heading: "2. How we use it",
    body: [
      "Queue data is used to operate the queue, send notifications about queue position, and give the facility operational analytics about its own wait times and throughput.",
      "We do not sell, rent, or share personal data with third parties for advertising or any other purpose.",
    ],
  },
  {
    id: "retention",
    heading: "3. Retention and deletion",
    body: [
      "Queue and session data is retained only as long as it is operationally useful to the facility that generated it. A hospital or clinic may request deletion of its historical queue data at any time.",
    ],
  },
  {
    id: "your-rights",
    heading: "4. Your rights under the DPDP Act, 2023",
    body: [
      "India's Digital Personal Data Protection Act, 2023 gives a data principal the right to access, correct, and erase their personal data. ojao's data handling is designed around those principles.",
      "{{TODO_LEGAL: name a Data Protection Officer or grievance contact, and state the response window — the DPDP Act requires a reachable grievance channel.}}",
    ],
  },
  {
    id: "contact",
    heading: "5. Contact",
    body: [
      "{{TODO_LEGAL: add a real contact email and postal address. The site currently publishes no reachable address, which is a compliance gap and a credibility problem for enterprise buyers.}}",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Privacy Policy"
      lead="How ojao handles personal data across the patient app and the hospital dashboard."
      sections={SECTIONS}
    />
  );
}
