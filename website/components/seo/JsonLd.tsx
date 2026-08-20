import { CANONICAL_HOST, LINKS, SITE } from "@/lib/site";
import type { Faq } from "@/content/faq";

function Ld({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Server-rendered from typed constants; no user input reaches this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationSchema() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE.legalName,
        alternateName: SITE.name,
        url: CANONICAL_HOST,
        slogan: SITE.tagline,
        description: SITE.description,
        areaServed: { "@type": "Country", name: "India" },
        sameAs: [LINKS.linkedin, LINKS.instagram, LINKS.twitter],
        founder: [
          {
            "@type": "Person",
            name: "Subham Ojha",
            jobTitle: "Co-Founder & CEO",
            sameAs: LINKS.founders.subham,
          },
          {
            "@type": "Person",
            name: "Priyanshu Ojha",
            jobTitle: "Co-Founder & CTO",
            sameAs: LINKS.founders.priyanshu,
          },
        ],
      }}
    />
  );
}

/**
 * SoftwareApplication + Offer, kept at parity with the live site.
 * `price: "0"` is deliberately NOT used — pricing is a custom enterprise
 * quote, so the offer states that instead of implying the product is free.
 */
export function SoftwareApplicationSchema() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE.name,
        applicationCategory: "HealthApplication",
        operatingSystem: "Android, Web",
        description: SITE.description,
        url: CANONICAL_HOST,
        downloadUrl: LINKS.playStore,
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: "0",
          priceSpecification: {
            "@type": "PriceSpecification",
            description:
              "Custom enterprise pricing, scoped by number of departments, doctors, and locations.",
          },
          availability: "https://schema.org/InStock",
        },
      }}
    />
  );
}

export function FaqSchema({ items }: { items: Faq[] }) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }}
    />
  );
}

export function ArticleSchema({
  headline,
  description,
  isoDate,
  authorName,
  slug,
}: {
  headline: string;
  description: string;
  isoDate: string;
  authorName: string;
  slug: string;
}) {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        datePublished: isoDate,
        author: { "@type": "Person", name: authorName },
        publisher: {
          "@type": "Organization",
          name: SITE.legalName,
          url: CANONICAL_HOST,
        },
        mainEntityOfPage: `${CANONICAL_HOST}/blog/${slug}`,
      }}
    />
  );
}
