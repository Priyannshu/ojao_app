import type { MetadataRoute } from "next";
import { CANONICAL_HOST } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Draft legal outlines and the stub form endpoint.
        disallow: ["/api/", "/privacy", "/terms"],
      },
    ],
    sitemap: `${CANONICAL_HOST}/sitemap.xml`,
    host: CANONICAL_HOST,
  };
}
