import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { INDUSTRIES } from "@/content/industries";
import { HOME_FAQS } from "@/content/faq";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { FaqSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = pageMetadata({
  title: "Hospital Queue Management Software in India | ojao",
  description:
    "Digital queue management and patient flow software for Indian hospitals, clinics, diagnostic labs, and radiology centres. Replace paper tokens with a live, trackable queue.",
  path: "/solutions/hospital-queue-management-software-india/",
});

const CAPABILITIES = [
  "One live dashboard across every department, instead of checking each waiting area",
  "Walk-ins and scheduled appointments merged into a single ordered queue per doctor",
  "Real-time SMS or app notification as a patient's turn approaches",
  "Runs on the tablets, desktops, and phones your front desk already has",
  "Works alongside your existing EMR/HIS — ojao is a flow layer, not a records system",
  "Wait-time and throughput data you can look back on to find bottlenecks",
];

export default function SolutionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Solutions"
        title="Hospital queue management software, built for Indian OPDs"
        lead="Indian outpatient departments move a very large number of patients through a very small physical space. ojao replaces the paper token and the corridor queue with a live, trackable digital queue — so patients can wait somewhere other than your lobby."
      >
        <div className="flex flex-wrap gap-3">
          <Button href="/#demo" variant="primary" size="lg">
            Request Enterprise Demo
          </Button>
          <Button href="/#simulator" variant="ghostDark" size="lg">
            Try the simulator
          </Button>
        </div>
      </PageHeader>

      <section className="bg-mist">
        <div className="shell section-y">
          <Reveal>
            <h2 className="t-h2 max-w-3xl text-charcoal">
              What the software actually does
            </h2>
          </Reveal>

          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {CAPABILITIES.map((c, i) => (
              <Reveal as="li" key={c} delay={i * 0.04}>
                <div className="flex h-full gap-3 rounded-2xl border border-line bg-white p-6">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand"
                  />
                  <p className="t-body text-slate">{c}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1}>
            <div className="mt-20">
              <h2 className="t-h2 text-charcoal">Built for your segment</h2>
              <p className="t-lead mt-4 max-w-2xl text-slate">
                Queue configuration differs by facility type. Each of these has
                its own page with the specific workflow it addresses.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {INDUSTRIES.map((ind) => (
                  <li key={ind.slug}>
                    <Link
                      href={`/industries/${ind.slug}`}
                      className="group block rounded-2xl border border-line bg-white p-6 transition-colors hover:border-brand/40"
                    >
                      <h3 className="font-display text-base font-semibold text-charcoal">
                        {ind.name}
                      </h3>
                      <p className="mt-2 text-sm text-slate">
                        {ind.metaDescription}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                        Explore
                        <span
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <div className="mt-20 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <h2 className="t-h2 text-charcoal">
                Frequently asked questions
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <Accordion items={HOME_FAQS} />
            </Reveal>
          </div>
        </div>
      </section>

      <FaqSchema items={HOME_FAQS} />
    </>
  );
}
