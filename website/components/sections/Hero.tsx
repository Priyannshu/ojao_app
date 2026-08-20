import { HERO, HERO_TOKEN_MOCK } from "@/content/copy";
import { Button } from "@/components/ui/Button";
import { PlayStoreBadge } from "@/components/ui/PlayStoreBadge";
import { LivingMapScene } from "@/components/three/LivingMapScene";

/**
 * Hero. The H1 is DOM text and paints before any WebGL, so LCP never waits
 * on the canvas. A radial scrim sits between the canvas and the text to
 * guarantee contrast regardless of what the scene is doing.
 */
export function Hero() {
  return (
    <section className="on-dark relative isolate overflow-hidden">
      <LivingMapScene />

      {/* Contrast guarantee for everything above it. */}
      <div className="hero-scrim absolute inset-0 -z-1" aria-hidden="true" />

      <div className="shell relative grid gap-14 pt-32 pb-24 md:pt-40 md:pb-32 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
        <div>
          <p className="t-eyebrow text-cyan">{HERO.eyebrow}</p>

          <h1 className="t-display mt-5 text-white">
            {HERO.h1}
            <span className="mt-2 block text-slate-light">
              {HERO.h1Second}
            </span>
          </h1>

          <p className="t-lead mt-7 max-w-xl text-slate-light">{HERO.sub}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button href={HERO.primaryCta.href} variant="primary" size="lg">
              {HERO.primaryCta.label}
            </Button>
            <Button href={HERO.secondaryCta.href} variant="ghostDark" size="lg">
              {HERO.secondaryCta.label}
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <PlayStoreBadge />
            <p className="text-xs text-slate-light">
              Android app available.
              <br className="hidden sm:block" /> Patients can also track from a
              mobile browser.
            </p>
          </div>
        </div>

        <TokenCard />
      </div>
    </section>
  );
}

/** The device mock. Labelled as sample data — it is not a live feed. */
function TokenCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:mx-0">
      <div className="rounded-3xl border border-white/12 bg-white/[0.07] p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-medium text-white/90">
            ojao Care
          </span>
          <span className="t-token text-xs text-slate-light">
            {HERO_TOKEN_MOCK.time}
          </span>
        </div>

        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.6875rem] tracking-widest text-slate-light uppercase">
              Department
            </p>
            <p className="mt-1 font-display text-lg text-white">
              {HERO_TOKEN_MOCK.department}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-serving/40 bg-serving/12 px-2.5 py-1 text-[0.625rem] font-semibold tracking-widest text-serving uppercase">
            <span className="size-1.5 rounded-full bg-serving" />
            {HERO_TOKEN_MOCK.status}
          </span>
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-navy-deep/50 p-5">
          <p className="text-[0.6875rem] tracking-widest text-slate-light uppercase">
            Your active token
          </p>
          <p className="t-token mt-1 text-4xl font-medium text-white">
            {HERO_TOKEN_MOCK.activeToken}
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 px-4 py-3">
            <dt className="text-[0.625rem] tracking-widest text-slate-light uppercase">
              Current turn
            </dt>
            <dd className="t-token mt-1 text-base text-white">
              {HERO_TOKEN_MOCK.currentTurn}
            </dd>
          </div>
          <div className="rounded-xl border border-white/10 px-4 py-3">
            <dt className="text-[0.625rem] tracking-widest text-slate-light uppercase">
              Ahead of you
            </dt>
            <dd className="t-token mt-1 text-base text-white">
              {HERO_TOKEN_MOCK.ahead}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-3 text-center text-[0.6875rem] text-slate-light lg:text-left">
        Sample interface. Not live facility data.
      </p>
    </div>
  );
}
