import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, POSTS } from "@/content/blog";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Accordion } from "@/components/ui/Accordion";
import { ArticleSchema, FaqSchema } from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.metaTitle,
      description: post.metaDescription,
      publishedTime: post.isoDate,
    },
  };
}

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = post.related
    .map((s) => getPost(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      <PageHeader eyebrow="Guide" title={post.title}>
        <p className="text-sm text-slate-light">
          {post.author.name} · {post.author.role} ·{" "}
          <time dateTime={post.isoDate}>{post.date}</time>
        </p>
      </PageHeader>

      <article className="bg-mist">
        <div className="shell section-y">
          <div className="grid gap-14 lg:grid-cols-[0.32fr_0.68fr] lg:gap-16">
            {/* Table of contents. Sticky on desktop, inline on mobile. */}
            <nav
              aria-labelledby="toc-heading"
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <h2
                id="toc-heading"
                className="t-eyebrow text-brand"
              >
                In this guide
              </h2>
              <ol className="mt-4 space-y-2.5">
                {post.sections.map((s, i) => (
                  <li key={s.heading}>
                    <a
                      href={`#s-${i}`}
                      className="text-sm text-slate underline-offset-4 transition-colors hover:text-brand hover:underline"
                    >
                      {i + 1}. {s.heading}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#post-faq"
                    className="text-sm text-slate underline-offset-4 transition-colors hover:text-brand hover:underline"
                  >
                    {post.sections.length + 1}. Frequently asked questions
                  </a>
                </li>
              </ol>
            </nav>

            <div className="max-w-3xl">
              <Reveal>
                <blockquote className="border-l-2 border-brand pl-6">
                  <p className="t-lead text-charcoal italic">
                    {post.pullQuote.text}
                  </p>
                  <footer className="mt-3 text-sm text-slate">
                    — {post.pullQuote.cite}
                  </footer>
                </blockquote>
              </Reveal>

              {post.sections.map((section, i) => (
                <Reveal key={section.heading} delay={0.04}>
                  <section id={`s-${i}`} className="mt-14 scroll-mt-28">
                    <h2 className="t-h3 text-charcoal">{section.heading}</h2>
                    {section.blocks.map((block, j) =>
                      block.kind === "p" ? (
                        <p key={j} className="t-body mt-4 text-slate">
                          {block.text}
                        </p>
                      ) : (
                        <ul key={j} className="mt-5 space-y-3">
                          {block.items.map((item) => (
                            <li
                              key={item}
                              className="t-body flex gap-3 text-slate"
                            >
                              <span
                                aria-hidden="true"
                                className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ),
                    )}
                  </section>
                </Reveal>
              ))}

              <section id="post-faq" className="mt-16 scroll-mt-28">
                <h2 className="t-h3 text-charcoal">
                  Frequently asked questions
                </h2>
                <div className="mt-4">
                  <Accordion items={post.faqs} />
                </div>
              </section>

              <section className="mt-16">
                <h2 className="t-eyebrow text-brand">References</h2>
                <ol className="mt-4 space-y-2">
                  {post.references.map((ref, i) => (
                    <li key={ref} className="text-sm leading-relaxed text-slate">
                      {i + 1}. {ref}
                    </li>
                  ))}
                </ol>
              </section>

              {related.length > 0 && (
                <section className="mt-16 border-t border-line pt-10">
                  <h2 className="t-eyebrow text-brand">Related guides</h2>
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                    {related.map((r) => (
                      <li key={r.slug}>
                        <Link
                          href={`/blog/${r.slug}`}
                          className="group block rounded-2xl border border-line bg-white p-6 transition-colors hover:border-brand/40"
                        >
                          <h3 className="font-display text-base font-semibold text-charcoal">
                            {r.title}
                          </h3>
                          <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                            Read guide
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
                </section>
              )}
            </div>
          </div>
        </div>
      </article>

      <ArticleSchema
        headline={post.title}
        description={post.metaDescription}
        isoDate={post.isoDate}
        authorName={post.author.name}
        slug={post.slug}
      />
      <FaqSchema items={post.faqs} />
    </>
  );
}
