import Link from "next/link";
import { FOOTER } from "@/content/copy";
import { LINKS, SITE } from "@/lib/site";
import { Wordmark } from "./Wordmark";
import { PlayStoreBadge } from "./PlayStoreBadge";
import { PulseScene } from "@/components/three/PulseScene";

const SOCIALS = [
  { label: "LinkedIn", href: LINKS.linkedin },
  { label: "Instagram", href: LINKS.instagram },
  { label: "X (Twitter)", href: LINKS.twitter },
];

export function SiteFooter() {
  return (
    <footer className="on-dark relative overflow-hidden">
      {/* Decorative ECG pulse. aria-hidden — it carries no information. */}
      <PulseScene />

      <div className="shell relative z-10 pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark onDark />
            <p className="mt-1 font-mono text-[0.6875rem] tracking-[0.22em] text-slate-light uppercase">
              Patient Flow
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-light">
              {FOOTER.blurb}
            </p>
            <p className="mt-6 font-display text-sm text-white/90">
              {SITE.tagline}
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {SOCIALS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-light underline-offset-4 transition-colors hover:text-cyan hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {FOOTER.columns.map((col) => (
            <nav key={col.title} aria-labelledby={`f-${col.title}`}>
              <h2
                id={`f-${col.title}`}
                className="font-display text-sm font-semibold text-white"
              >
                {col.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-slate-light underline-offset-4 transition-colors hover:text-cyan hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 border-t border-white/10 pt-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-md">
              <h2 className="font-display text-sm font-semibold text-white">
                Download the ojao app
              </h2>
              <p className="mt-2 text-sm text-slate-light">{FOOTER.appBlurb}</p>
            </div>
            <PlayStoreBadge className="shrink-0" />
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-light">
          © 2026 {SITE.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
