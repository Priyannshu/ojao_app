import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/content/blog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Blog & Guides | ojao Patient Flow",
  description:
    "Practical guides on hospital queue management, OPD wait times, and patient flow software for Indian clinics and hospitals.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Blog & Guides"
        lead="Practical, vendor-neutral guidance on queue management and patient flow for hospitals, clinics, and diagnostic centres in India."
      />

      <section className="bg-mist">
        <div className="shell section-y">
          <ul className="grid gap-5 md:grid-cols-2">
            {POSTS.map((post, i) => (
              <Reveal as="li" key={post.slug} delay={i * 0.05}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40 md:p-8"
                >
                  <h2 className="t-h3 text-charcoal">{post.title}</h2>
                  <p className="t-body mt-3 flex-1 text-slate">
                    {post.excerpt}
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-4">
                    <span className="text-xs text-slate">
                      {post.author.name} · {post.date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                      Read guide
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      >
                        <path
                          d="M2 7h10M8 3l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
