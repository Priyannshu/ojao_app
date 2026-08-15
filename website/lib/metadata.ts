import type { Metadata } from "next";
import { CANONICAL_HOST, SITE } from "./site";

/**
 * Builds per-route metadata from a single path.
 *
 * This exists because `canonical` and `og:url` have to agree, and Next does not
 * derive one from the other. Setting only `alternates.canonical` leaves og:url
 * absent; setting `openGraph.url` once in the root layout pins every page's
 * og:url to the homepage — which tells crawlers that 19 distinct pages are all
 * the same URL. Both mistakes were live in this repo before this helper.
 *
 * `path` must include the trailing slash, matching `trailingSlash: true`.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  openGraphType = "website",
  publishedTime,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  openGraphType?: "website" | "article";
  publishedTime?: string;
}): Metadata {
  const url = `${CANONICAL_HOST}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: openGraphType,
      siteName: SITE.name,
      locale: "en_IN",
      url,
      title,
      description,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      site: "@ojao_care",
      title,
      description,
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
