import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getIndustry, INDUSTRIES } from "@/content/industries";
import { pageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { FaqSchema } from "@/components/seo/JsonLd";

/** One template, four content objects — the live pages were parallel already. */
export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/industries/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) return {};

  return pageMetadata({
    title: industry.metaTitle,
    description: industry.metaDescription,
    path: `/industries/${industry.slug}/`,
  });
}

export default async function IndustryPage({
  params,
}: PageProps<"/industries/[slug]">) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const others = INDUSTRIES.filter((i) => i.slug !== industry.slug);

  return (
    <>
      <PageHeader
        eyebrow="Industries"
        title={industry.h1}
        lead={industry.intro}
      >
        <Button href="/#demo" variant="primary" size="lg">
          Request Enterprise Demo
        </Button>
      </PageHeader>

      <section className="bg-mist">
        <div className="shell section-y">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <h2 className="t-h3 text-charcoal">
                The problem with the traditional queue
              </h2>
              <ul className="mt-6 space-y-4">
                {industry.problems.map((p) => (
                  <li key={p} className="t-body flex gap-3 text-slate">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-urgent/70"
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.08}>
              <h2 className="t-h3 text-charcoal">How ojao helps</h2>
              <ul className="mt-6 space-y-4">
                {industry.helps.map((h) => (
                  <li key={h} className="t-body flex gap-3 text-slate">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-serving"
                    />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="mt-20 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <h2 className="t-h2 text-charcoal">
                Frequently asked questions
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <Accordion items={industry.faqs} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-offwhite">
        <div className="shell section-y">
          <h2 className="t-eyebrow text-brand">Other segments</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/industries/${o.slug}`}
                  className="group block rounded-2xl border border-line bg-white p-6 transition-colors hover:border-brand/40"
                >
                  <h3 className="font-display text-base font-semibold text-charcoal">
                    {o.name}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                    Explore
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqSchema items={industry.faqs} />
    </>
  );
}
