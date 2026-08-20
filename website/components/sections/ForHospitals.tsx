import Link from "next/link";
import { HOSPITAL_PITCH, SEGMENTS } from "@/content/copy";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ConsoleField } from "@/components/three/ConsoleField";

/** The B2B pitch — the primary conversion path on the site. */
export function ForHospitals() {
  return (
    <section id="hospitals" className="relative isolate bg-mist">
      <ConsoleField />

      <div className="shell section-y relative">
        <Reveal>
          <p className="t-eyebrow text-brand">{HOSPITAL_PITCH.eyebrow}</p>
          <h2 className="t-h2 mt-4 max-w-3xl text-charcoal">
            {HOSPITAL_PITCH.h2}
          </h2>
          <p className="t-lead mt-5 max-w-2xl text-slate">
            {HOSPITAL_PITCH.lead}
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOSPITAL_PITCH.cards.map((card, i) => (
            <Reveal as="li" key={card.title} delay={i * 0.05}>
              <div className="h-full rounded-2xl border border-line bg-white p-6 transition-colors duration-300 hover:border-brand/40">
                <h3 className="font-display text-base font-semibold text-charcoal">
                  {card.title}
                </h3>
                <p className="t-body mt-2.5 text-sm text-slate">{card.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>

        {/* The single-department pilot is the most persuasive offer on the
            site — it lowers buying risk, so it gets its own block. */}
        <Reveal delay={0.1}>
          <div className="mt-12 grid gap-8 rounded-3xl border border-brand/20 bg-white p-8 md:grid-cols-[1.3fr_0.7fr] md:items-center md:p-10">
            <div>
              <h3 className="t-h3 text-charcoal">
                {HOSPITAL_PITCH.pilot.title}
              </h3>
              <p className="t-body mt-3 max-w-xl text-slate">
                {HOSPITAL_PITCH.pilot.body}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Button href="#demo" variant="primary" size="lg">
                Request Enterprise Demo
              </Button>
              <Button
                href={HOSPITAL_PITCH.pilot.cta.href}
                variant="ghost"
                size="lg"
              >
                {HOSPITAL_PITCH.pilot.cta.label}
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** The four verticals, each linking to its own page. */
export function Segments() {
  return (
    <section className="bg-offwhite">
      <div className="shell section-y">
        <Reveal>
          <p className="t-eyebrow text-brand">{SEGMENTS.eyebrow}</p>
          <h2 className="t-h2 mt-4 max-w-3xl text-charcoal">{SEGMENTS.h2}</h2>
          <p className="t-lead mt-5 max-w-2xl text-slate">{SEGMENTS.lead}</p>
        </Reveal>

        <ul className="mt-14 grid gap-4 md:grid-cols-2">
          {SEGMENTS.cards.map((card, i) => (
            <Reveal as="li" key={card.title} delay={i * 0.06}>
              <Link
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 md:p-8"
              >
                <h3 className="t-h3 text-charcoal">{card.title}</h3>
                <p className="t-body mt-3 flex-1 text-slate">{card.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand">
                  Explore
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path
                      d="M2 7h10M8 3l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
