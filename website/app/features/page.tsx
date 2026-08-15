import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Platform Features | ojao Patient Flow",
  description:
    "A closer look at ojao's queue simulator, admin dashboard, patient journey tracking, and real-time notification system.",
  alternates: { canonical: "/features" },
};

/**
 * Reconciled against the app's actual capabilities (ARCHITECTURE.md §9):
 * hospital verification, Maps directions, video consults, payments, and the
 * emergency flag are all omitted — they are not shipped features.
 */
const FEATURES = [
  {
    title: "Live queue simulator",
    body: "Model how a queue behaves under different patient loads and staffing levels before committing to a rollout, so administrators can see the impact of configuration changes ahead of time.",
  },
  {
    title: "Admin dashboard",
    body: "A single, real-time view across departments and doctors instead of checking each waiting area individually — built for hospital administrators who need to spot bottlenecks as they form.",
  },
  {
    title: "Patient journey tracking",
    body: "Follows a patient from check-in through consultation, so both staff and the patient have a shared, up-to-date picture of where they are in the process.",
  },
  {
    title: "Real-time notifications",
    body: "Patients are notified as their turn approaches instead of needing to stay within sight of a physical display board or keep approaching the front desk.",
  },
  {
    title: "Walk-ins and appointments in one queue",
    body: "Both merge into a single ordered queue per doctor or department, so front-desk staff aren't reconciling two competing systems by hand.",
  },
  {
    title: "Department-level queues",
    body: "Each department or doctor runs its own queue with its own pace, while administrators keep one unified view across all of them.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Platform"
        title="Everything ojao runs on"
        lead="A closer look at the core parts of the platform beyond the homepage overview."
      />

      <section className="bg-mist">
        <div className="shell section-y">
          <ul className="grid gap-5 md:grid-cols-2">
            {FEATURES.map((f, i) => (
              <Reveal as="li" key={f.title} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-line bg-white p-7">
                  <h2 className="t-h3 text-charcoal">{f.title}</h2>
                  <p className="t-body mt-3 text-slate">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1}>
            <div className="mt-14 flex flex-wrap gap-3">
              <Button href="/#simulator" variant="primary" size="lg">
                Try the simulator
              </Button>
              <Button href="/#demo" variant="ghost" size="lg">
                Request Enterprise Demo
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
