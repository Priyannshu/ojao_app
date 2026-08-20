import { PROBLEM } from "@/content/copy";
import { Reveal } from "@/components/ui/Reveal";

/**
 * The Problem. Type-only, hairline rules, no illustration — the restraint
 * is the point after the hero's motion.
 */
export function Problem() {
  return (
    <>
      <div className="seam-to-light h-24" aria-hidden="true" />
      <section id="problem" className="bg-mist">
        <div className="shell section-y">
          <Reveal>
            <p className="t-eyebrow text-brand">{PROBLEM.eyebrow}</p>
            <h2 className="t-h2 mt-4 max-w-3xl text-charcoal">
              {PROBLEM.h2}
            </h2>
            <p className="t-lead mt-5 max-w-2xl text-slate">{PROBLEM.lead}</p>
          </Reveal>

          <ul className="mt-16 grid gap-px border-t border-line md:grid-cols-3">
            {PROBLEM.columns.map((col, i) => (
              <Reveal as="li" key={col.title} delay={i * 0.08}>
                <div className="h-full border-b border-line pt-8 pb-10 md:border-b-0 md:border-r md:pr-8 md:last:border-r-0">
                  <span className="t-token text-xs text-slate">
                    0{i + 1}
                  </span>
                  <h3 className="t-h3 mt-4 text-charcoal">{col.title}</h3>
                  <p className="t-body mt-3 text-slate">{col.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1}>
            <p className="t-h2 mt-16 max-w-2xl text-charcoal">
              {PROBLEM.closing}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
