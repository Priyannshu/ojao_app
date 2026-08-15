import type { Metadata } from "next";
import { SECURITY_FAQS } from "@/content/faq";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { FaqSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Security & Data Privacy | ojao",
  description:
    "How ojao handles hospital and patient queue data — encryption, data minimisation, role-based access, and our approach to India's DPDP Act 2023.",
  alternates: { canonical: "/security" },
};

/**
 * Ported near-verbatim from the live page — it is the best-written content on
 * the site and correctly frames DPDP as designed-around-principles rather than
 * certified. The "Fully HIPAA & GDPR Compliant" badge that appeared elsewhere
 * on the live site is deliberately not reproduced here or anywhere.
 */
const PRINCIPLES = [
  {
    title: "Encryption in transit and at rest",
    body: "Data moving between a patient's browser, the front-desk dashboard, and our servers is encrypted in transit. Stored data is encrypted at rest, so a database snapshot alone is not enough to expose queue information.",
  },
  {
    title: "Data minimisation by design",
    body: "ojao is a patient flow and queue tool, not a clinical records system. We only collect what's needed to manage a queue position and send a notification — name, contact detail, department, and token status. We don't store diagnoses, prescriptions, or medical history.",
  },
  {
    title: "Role-based access control",
    body: "Receptionists, doctors, department admins, and hospital administrators see only what their role requires. Every dashboard action is tied to a specific staff account, not a shared login.",
  },
  {
    title: "Clear data retention & deletion",
    body: "Queue and session data is retained only as long as it's operationally useful for a hospital's own analytics. Hospitals can request deletion of historical queue data for their facility at any time.",
  },
  {
    title: "Built with India's DPDP Act 2023 in mind",
    body: "The Digital Personal Data Protection Act, 2023 sets out requirements around data minimisation, purpose limitation, and a data principal's right to access, correct, and erase their personal data. We've designed ojao's data handling around those principles rather than retrofitting them later.",
  },
  {
    title: "No data resale, ever",
    body: "Queue and patient-flow data generated on ojao belongs to the hospital or clinic that generated it. We don't sell or share it with third parties for advertising or any other purpose.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Security & Trust"
        title="Queue data deserves the same care as any patient data."
        lead="ojao is a patient flow and queue management layer, not a clinical records system — so we deliberately keep what we collect to the minimum needed to manage a queue and notify a patient. Here's how we handle it."
      />

      <section className="bg-mist">
        <div className="shell section-y">
          <ul className="grid gap-5 md:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-line bg-white p-7">
                  <h2 className="t-h3 text-charcoal">{p.title}</h2>
                  <p className="t-body mt-3 text-slate">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <div className="mt-20 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <h2 className="t-h2 text-charcoal">
                Security &amp; privacy questions
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <Accordion items={SECURITY_FAQS} />
            </Reveal>
          </div>
        </div>
      </section>

      <FaqSchema items={SECURITY_FAQS} />
    </>
  );
}
