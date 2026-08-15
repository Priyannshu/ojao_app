import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { PRICING_FAQS } from "@/content/faq";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { FaqSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = pageMetadata({
  title: "Pricing & FAQ | ojao Patient Flow",
  description:
    "ojao is priced on a custom enterprise basis. See frequently asked questions about pricing, pilots, and onboarding.",
  path: "/pricing/",
});

export default function PricingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pricing"
        title="Enterprise pricing, scoped to your facility"
        lead="Pricing depends on the number of departments, doctors, and locations. Request a demo and we'll walk you through a quote."
      >
        <Button href="/#demo" variant="primary" size="lg">
          Request Enterprise Demo
        </Button>
      </PageHeader>

      <section className="bg-mist">
        <div className="shell section-y">
          <Reveal>
            <div className="rounded-3xl border border-brand/20 bg-white p-8 md:p-10">
              <h2 className="t-h3 text-charcoal">
                Start with a single-department pilot
              </h2>
              <p className="t-body mt-3 max-w-2xl text-slate">
                We recommend piloting in one department first so your team can
                evaluate the fit before a facility-wide rollout. It is the
                lowest-risk way to find out whether the tool matches how your
                front desk actually works.
              </p>
            </div>
          </Reveal>

          <div className="mt-16 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <h2 className="t-h2 text-charcoal">
                Frequently asked questions
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <Accordion items={PRICING_FAQS} />
            </Reveal>
          </div>
        </div>
      </section>

      <FaqSchema items={PRICING_FAQS} />
    </>
  );
}
