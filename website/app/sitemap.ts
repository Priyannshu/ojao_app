import type { MetadataRoute } from "next";
import { CANONICAL_HOST } from "@/lib/site";
import { POSTS } from "@/content/blog";
import { INDUSTRIES } from "@/content/industries";

// Required by output: "export" — tells Next this route is fully static and has
// no revalidation, so it can be emitted as a file at build time.
export const dynamic = "force-static";


/**
 * Every URL here is on ojao.in.
 *
 * The live sitemap listed 15 URLs, all on `ojao.care` — a domain that does not
 * resolve. That told Google to drop the domain that actually serves traffic.
 * /privacy and /terms are omitted deliberately: they are noindex draft
 * outlines until the legal copy is written.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-15");

  // Trailing slashes, because `trailingSlash: true` makes the canonical URLs
  // `/about/` etc. A sitemap that disagrees with the canonical tag sends
  // conflicting signals about which URL is authoritative.
  const staticRoutes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/about/", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/features/", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/pricing/", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/security/", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/blog/", priority: 0.7, changeFrequency: "weekly" as const },
    {
      path: "/solutions/hospital-queue-management-software-india/",
      priority: 0.9,
      changeFrequency: "monthly" as const,
    },
  ];

  return [
    ...staticRoutes.map((r) => ({
      url: `${CANONICAL_HOST}${r.path}`,
      lastModified,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),
    ...INDUSTRIES.map((i) => ({
      url: `${CANONICAL_HOST}/industries/${i.slug}/`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...POSTS.map((p) => ({
      url: `${CANONICAL_HOST}/blog/${p.slug}/`,
      lastModified: new Date(p.isoDate),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
