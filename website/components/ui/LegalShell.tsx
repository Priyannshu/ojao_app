import { PageHeader } from "./PageHeader";
import { Reveal } from "./Reveal";

export type LegalSection = {
  id: string;
  heading: string;
  body: string[];
};

/**
 * Shared shell for /privacy and /terms: a working table of contents plus a
 * readable prose column.
 *
 * These pages are outlines, not drafted legal copy. Every {{TODO_LEGAL}}
 * marker is rendered visibly rather than hidden in a comment, so nobody
 * mistakes the outline for a reviewed document — and both routes are
 * noindex until they are actually written.
 */
export function LegalShell({
  eyebrow,
  title,
  lead,
  sections,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} lead={lead} />

      <section className="bg-mist">
        <div className="shell section-y">
          <div
            role="note"
            className="rounded-2xl border border-called/40 bg-called/8 p-5"
          >
            <p className="text-sm leading-relaxed text-charcoal">
              <strong className="font-semibold">Draft outline.</strong> This
              page is a structural outline, not reviewed legal copy. It must be
              completed and checked by a lawyer before launch. Both legal routes
              are currently excluded from search indexing.
            </p>
          </div>

          <div className="mt-14 grid gap-14 lg:grid-cols-[0.3fr_0.7fr] lg:gap-16">
            <nav
              aria-labelledby="legal-toc"
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <h2 id="legal-toc" className="t-eyebrow text-brand">
                Contents
              </h2>
              <ol className="mt-4 space-y-2.5">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-sm text-slate underline-offset-4 transition-colors hover:text-brand hover:underline"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="max-w-3xl">
              {sections.map((s, i) => (
                <Reveal key={s.id} delay={i * 0.03}>
                  <section id={s.id} className="scroll-mt-28 not-first:mt-12">
                    <h2 className="t-h3 text-charcoal">{s.heading}</h2>
                    {s.body.map((para) => {
                      const isTodo = para.startsWith("{{TODO_LEGAL");
                      return isTodo ? (
                        <p
                          key={para}
                          className="mt-4 rounded-xl border border-dashed border-slate-light bg-white px-4 py-3 font-mono text-xs leading-relaxed text-slate"
                        >
                          {para}
                        </p>
                      ) : (
                        <p key={para} className="t-body mt-4 text-slate">
                          {para}
                        </p>
                      );
                    })}
                  </section>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
