import { Reveal } from "./Reveal";

/**
 * Shared page header for every interior route. Keeps the dark-band-then-content
 * rhythm consistent so interior pages feel like the homepage, not bolt-ons.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="on-dark relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 30% 0%, rgba(18,58,132,0.55) 0%, transparent 70%)",
        }}
      />
      <div className="shell relative pt-32 pb-20 md:pt-40 md:pb-24">
        <Reveal>
          <p className="t-eyebrow text-cyan">{eyebrow}</p>
          <h1 className="t-h2 mt-4 max-w-4xl text-white">{title}</h1>
          {lead && (
            <p className="t-lead mt-6 max-w-2xl text-slate-light">{lead}</p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}

/** Long-form prose column, sized for comfortable reading. */
export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl">{children}</div>;
}
