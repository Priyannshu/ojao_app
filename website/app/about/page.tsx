import type { Metadata } from "next";
import { LINKS } from "@/lib/site";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About ojao — Our Story & Founding Team",
  description:
    "Meet the founding team behind ojao and learn why we're building digital patient flow and queue management software for Indian hospitals and clinics.",
  alternates: { canonical: "/about" },
};

const FOUNDERS = [
  {
    name: "Subham Ojha",
    role: "Co-Founder & CEO",
    bio: "Sets the product and business direction for ojao — working directly with hospital administrators and clinic owners to make sure the platform solves real front-desk problems, not just theoretical ones.",
    href: LINKS.founders.subham,
  },
  {
    name: "Priyanshu Ojha",
    role: "Co-Founder & CTO",
    bio: "Builds and ships the ojao platform — the real-time queueing engine, admin dashboards, and patient notification systems that keep OPDs running without a paper token in sight.",
    href: LINKS.founders.priyanshu,
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About ojao"
        title="Because waiting rooms shouldn't feel like a queue for anything."
        lead="ojao started with a simple observation: Indian OPDs move a huge number of patients through a very small physical space, and almost all of the friction in that process — the crowding, the confusion, the repeated “how much longer?” — has nothing to do with medicine. It's a patient flow problem, and it's solvable with software."
      />

      <section className="bg-mist">
        <div className="shell section-y">
          <Reveal>
            <p className="t-eyebrow text-brand">The team behind ojao</p>
            <h2 className="t-h2 mt-4 max-w-3xl text-charcoal">
              Built by founders who&apos;ve sat in the waiting room too
            </h2>
            <p className="t-lead mt-5 max-w-2xl text-slate">
              ojao is run by a two-person founding team covering
              product/business strategy and engineering — a deliberately small
              setup so every feature ships with direct accountability.
            </p>
          </Reveal>

          <ul className="mt-14 grid gap-5 md:grid-cols-2">
            {FOUNDERS.map((f, i) => (
              <Reveal as="li" key={f.name} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-line bg-white p-8">
                  <h3 className="t-h3 text-charcoal">{f.name}</h3>
                  <p className="t-token mt-1.5 text-xs tracking-widest text-brand uppercase">
                    {f.role}
                  </p>
                  <p className="t-body mt-5 text-slate">{f.bio}</p>
                  <a
                    href={f.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
                    Connect on LinkedIn
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1}>
            <div className="mt-14">
              <Button href="/#demo" variant="primary" size="lg">
                Request Enterprise Demo
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
