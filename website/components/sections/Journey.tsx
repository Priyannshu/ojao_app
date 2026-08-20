"use client";

import { useState } from "react";
import { JOURNEY } from "@/content/copy";
import { cn } from "@/lib/cn";

/**
 * The five-phase patient journey. A tablist rather than a scroll-pinned
 * animation: it is keyboard-navigable, works with a screen reader, and does
 * not hijack the scroll.
 */
export function Journey() {
  const [active, setActive] = useState(0);
  const stage = JOURNEY.stages[active];

  return (
    <section id="journey" className="bg-offwhite">
      <div className="shell section-y">
        <p className="t-eyebrow text-brand">{JOURNEY.eyebrow}</p>
        <h2 className="t-h2 mt-4 max-w-3xl text-charcoal">{JOURNEY.h2}</h2>
        <p className="t-lead mt-5 max-w-2xl text-slate">{JOURNEY.lead}</p>

        <div
          role="tablist"
          aria-label="Patient journey phases"
          className="mt-14 flex flex-wrap gap-2"
        >
          {JOURNEY.stages.map((s, i) => (
            <button
              key={s.n}
              role="tab"
              id={`phase-tab-${i}`}
              aria-selected={active === i}
              aria-controls={`phase-panel-${i}`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  const next = (active + 1) % JOURNEY.stages.length;
                  setActive(next);
                  document.getElementById(`phase-tab-${next}`)?.focus();
                }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const prev =
                    (active - 1 + JOURNEY.stages.length) %
                    JOURNEY.stages.length;
                  setActive(prev);
                  document.getElementById(`phase-tab-${prev}`)?.focus();
                }
              }}
              className={cn(
                "t-token rounded-full border px-4 py-2 text-xs transition-colors duration-300",
                active === i
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-slate hover:border-brand hover:text-brand",
              )}
            >
              Phase {s.n}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div
            role="tabpanel"
            id={`phase-panel-${active}`}
            aria-labelledby={`phase-tab-${active}`}
            className="rounded-3xl border border-line bg-white p-8 md:p-10"
          >
            <p className="t-token text-xs tracking-widest text-slate uppercase">
              Stage {stage.n} of 05
            </p>
            <h3 className="t-h3 mt-4 text-charcoal">{stage.title}</h3>
            <p className="t-body mt-4 text-slate">{stage.body}</p>

            <p
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-serving/30 bg-serving/8 px-3.5 py-1.5 text-xs font-medium text-[#047857]"
              aria-live="polite"
            >
              <span className="size-1.5 rounded-full bg-serving" />
              {stage.state}
            </p>
          </div>

          {/* Progress rail. Decorative — the tablist already conveys state. */}
          <ol
            className="grid gap-3 sm:grid-cols-5 lg:mt-2"
            aria-hidden="true"
          >
            {JOURNEY.stages.map((s, i) => (
              <li key={s.n}>
                <div
                  className={cn(
                    "h-1 rounded-full transition-colors duration-500",
                    i <= active ? "bg-brand" : "bg-line",
                  )}
                />
                <p
                  className={cn(
                    "mt-3 text-xs leading-snug transition-colors duration-500",
                    i <= active ? "text-charcoal" : "text-slate",
                  )}
                >
                  {s.title}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
