import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { LegalShell } from "@/components/ui/LegalShell";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service | ojao",
  description:
    "The terms governing use of the ojao patient app, hospital dashboard, and website.",
  path: "/terms/",
  noindex: true,
});

const SECTIONS = [
  {
    id: "scope",
    heading: "1. Scope of the service",
    body: [
      "ojao provides digital patient flow and queue management software. It is an operational tool for managing waiting and notification. It is not a medical device, does not provide clinical advice, and does not replace an electronic medical record system.",
      "Nothing in the ojao app or dashboard constitutes medical advice, diagnosis, or treatment.",
    ],
  },
  {
    id: "accounts",
    heading: "2. Accounts and access",
    body: [
      "Facility staff accounts are individually attributable and role-based. Facilities are responsible for managing which of their staff hold which role, and for revoking access when staff leave.",
    ],
  },
  {
    id: "availability",
    heading: "3. Availability",
    body: [
      "We aim to keep the service available and to communicate planned maintenance in advance. No specific uptime figure is contracted through this website; any service-level commitment would form part of a signed enterprise agreement.",
    ],
  },
  {
    id: "pricing",
    heading: "4. Pricing and agreements",
    body: [
      "ojao is priced on a custom enterprise basis depending on the number of departments, doctors, and locations. The commercial terms for any facility are those set out in its signed agreement, not on this website.",
    ],
  },
  {
    id: "law",
    heading: "5. Governing law",
    body: [
      "{{TODO_LEGAL: state the governing law and jurisdiction, the registered entity name and address, liability limits, and a termination clause. Have a lawyer review before publishing — this outline is not a substitute for drafted terms.}}",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Legal"
      title="Terms of Service"
      lead="The terms governing use of the ojao patient app, hospital dashboard, and this website."
      sections={SECTIONS}
    />
  );
}
