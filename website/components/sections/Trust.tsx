import { TRUST } from "@/content/copy";
import { HOME_FAQS } from "@/content/faq";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";

export function Trust() {
  return (
    <section id="trust" className="bg-mist">
      <div className="shell section-y">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="t-eyebrow text-brand">{TRUST.eyebrow}</p>
            <h2 className="t-h2 mt-4 text-charcoal">{TRUST.h2}</h2>
            <p className="t-lead mt-5 text-slate">{TRUST.lead}</p>
            <div className="mt-8">
              <Button href={TRUST.cta.href} variant="ghost" size="lg">
                {TRUST.cta.label}
              </Button>
            </div>
          </Reveal>

          <ul className="grid gap-px self-start border-t border-line">
            {TRUST.points.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 0.06}>
                <div className="border-b border-line py-6">
                  <h3 className="font-display text-base font-semibold text-charcoal">
                    {p.title}
                  </h3>
                  <p className="t-body mt-2 text-sm text-slate">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="bg-offwhite">
      <div className="shell section-y">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <p className="t-eyebrow text-brand">Frequently asked questions</p>
            <h2 className="t-h2 mt-4 text-charcoal">
              Common questions about ojao
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <Accordion items={HOME_FAQS} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
