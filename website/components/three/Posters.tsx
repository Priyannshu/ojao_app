/**
 * CSS-only static fallbacks for each WebGL scene.
 *
 * These are what render for reduced-motion users, on devices without WebGL,
 * on small viewports, and before hydration. They are pure CSS gradients
 * rather than committed images: no extra bytes, no decode cost, no layout
 * shift, and nothing to regenerate when the palette changes.
 *
 * The site has to look good with all motion off. These carry that.
 */

export function MapPoster() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-deep">
      {/* Oblique grid, fading out toward the edges. */}
      <div
        className="absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(37,99,235,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.55) 1px, transparent 1px)",
          backgroundSize: "58px 58px",
          transform: "perspective(760px) rotateX(58deg) scale(1.9)",
          transformOrigin: "50% 42%",
          maskImage:
            "radial-gradient(ellipse 52% 48% at 50% 46%, #000 22%, transparent 76%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 52% 48% at 50% 46%, #000 22%, transparent 76%)",
        }}
      />
      {/* Nearby-search radius glow, centred on the user marker. */}
      <div
        className="absolute left-1/2 top-[46%] size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(14,165,233,0.30) 0%, rgba(14,165,233,0.10) 42%, transparent 68%)",
        }}
      />
      <div
        className="absolute left-1/2 top-[46%] size-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/35"
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-[46%] size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/18"
        aria-hidden="true"
      />
      {/* "You are here". */}
      <div className="absolute left-1/2 top-[46%] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_20px_6px_rgba(255,255,255,0.45)]" />
      {/* Vignette. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 78% 70% at 50% 44%, transparent 38%, rgba(11,17,32,0.86) 100%)",
        }}
      />
    </div>
  );
}

export function TokenStreamPoster() {
  const cards = [
    { label: "A-12", state: "done" },
    { label: "A-13", state: "done" },
    { label: "A-14", state: "serving" },
    { label: "A-15", state: "called" },
    { label: "A-16", state: "waiting" },
    { label: "A-17", state: "waiting" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-deep">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(18,58,132,0.55) 0%, transparent 70%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-3 px-6 sm:gap-5">
        {cards.map((c, i) => {
          const ring =
            c.state === "serving"
              ? "border-serving/70 shadow-[0_0_34px_-4px_rgba(16,185,129,0.5)]"
              : c.state === "called"
                ? "border-called/60 shadow-[0_0_28px_-6px_rgba(245,158,11,0.4)]"
                : "border-white/12";
          const dim = c.state === "done" ? "opacity-35" : "opacity-100";
          return (
            <div
              key={c.label}
              className={`flex h-24 w-16 shrink-0 flex-col items-center justify-center rounded-xl border bg-white/[0.06] backdrop-blur-sm sm:h-32 sm:w-20 ${ring} ${dim}`}
              style={{
                transform: `translateY(${Math.sin(i * 0.9) * 12}px)`,
              }}
            >
              <span className="t-token text-sm text-white/90 sm:text-base">
                {c.label}
              </span>
              {c.state === "serving" && (
                <span className="mt-1.5 text-[0.5rem] font-semibold tracking-widest text-serving uppercase">
                  Serving
                </span>
              )}
              {c.state === "called" && (
                <span className="mt-1.5 text-[0.5rem] font-semibold tracking-widest text-called uppercase">
                  Called
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ConsolePoster() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(37,99,235,0.10) 0%, transparent 72%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(100,116,139,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.16) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 10%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 10%, transparent 72%)",
        }}
      />
    </div>
  );
}

export function PulsePoster() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 size-full opacity-45"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="pulse-fade" x1="0" x2="1">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0" />
            <stop offset="35%" stopColor="#0EA5E9" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#2563EB" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 100 H340 l18 -6 l14 34 l16 -74 l18 92 l14 -46 h22 l16 -14 H1200"
          fill="none"
          stroke="url(#pulse-fade)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
