import { TokenStreamScene } from "@/components/three/TokenStreamScene";
import { cn } from "@/lib/cn";

const CHIPS = [
  "Live queue position",
  "Called-next alerts",
  "Department-level tokens",
  "Appointment booking",
  "Walk-ins and appointments in one queue",
];

/**
 * The token queue is rendered as real DOM, not inside the canvas: the numbers
 * and states are information, and the canvas is aria-hidden. The 3D behind it
 * supplies depth and motion; this markup supplies the meaning.
 */
const QUEUE = [
  { code: "A-12", state: "done" as const },
  { code: "A-13", state: "done" as const },
  { code: "A-14", state: "serving" as const },
  { code: "A-15", state: "called" as const },
  { code: "A-16", state: "waiting" as const },
  { code: "A-17", state: "waiting" as const },
];

const STATE_LABEL = {
  done: "Completed",
  serving: "Now serving",
  called: "Called",
  waiting: "Waiting",
} as const;

export function SkipTheWait() {
  return (
    <section className="on-dark relative overflow-hidden">
      <div className="shell relative pt-24 md:pt-32">
        <div className="max-w-2xl">
          <p className="t-eyebrow text-cyan">The patient experience</p>
          <h2 className="t-h2 mt-4 text-white">
            Watch the line move from your sofa.
          </h2>
          <p className="t-lead mt-5 text-slate-light">
            Your token, your position, and your live wait — updated as the
            hospital calls each patient. When you&apos;re next, your phone tells
            you.
          </p>
        </div>

        <ul className="mt-9 flex flex-wrap gap-2.5">
          {CHIPS.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs text-slate-light"
            >
              {chip}
            </li>
          ))}
        </ul>
      </div>

      {/* Canvas band, below the copy — the 3D never sits behind body text. */}
      <div className="relative mt-16 h-[20rem] md:h-[24rem]">
        <TokenStreamScene />

        {/* The readable queue, over the canvas. */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <ol
            aria-label="Example queue state"
            className="flex items-end gap-2.5 sm:gap-4"
          >
            {QUEUE.map((t, i) => (
              <li
                key={t.code}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl border bg-navy-deep/45 backdrop-blur-md transition-colors",
                  "h-24 w-14 sm:h-32 sm:w-20",
                  t.state === "serving" &&
                    "border-serving/60 shadow-[0_0_40px_-8px_rgba(16,185,129,0.55)]",
                  t.state === "called" &&
                    "border-called/55 shadow-[0_0_32px_-10px_rgba(245,158,11,0.5)]",
                  t.state === "waiting" && "border-white/15",
                  t.state === "done" && "border-white/8 opacity-40",
                )}
                style={{
                  // Slight arc so the row echoes the 3D path behind it.
                  transform: `translateY(${Math.abs(i - 2.5) * 5}px)`,
                }}
              >
                <span className="t-token text-sm text-white sm:text-lg">
                  {t.code}
                </span>
                <span
                  className={cn(
                    "mt-1.5 text-[0.5rem] font-semibold tracking-widest uppercase sm:text-[0.5625rem]",
                    t.state === "serving" && "text-serving",
                    t.state === "called" && "text-called",
                    (t.state === "waiting" || t.state === "done") &&
                      "text-slate-light",
                  )}
                >
                  {STATE_LABEL[t.state]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="shell pb-20 text-center text-xs text-slate-light">
        Illustrative queue states. Sample token numbers.
      </p>
    </section>
  );
}
