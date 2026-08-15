import type { MetadataRoute } from "next";
import { CANONICAL_HOST } from "@/lib/site";

// Required by output: "export" — tells Next this route is fully static and has
// no revalidation, so it can be emitted as a file at build time.
export const dynamic = "force-static";


export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Draft legal outlines — noindex until the copy is written.
        disallow: ["/privacy", "/terms"],
      },
    ],
    sitemap: `${CANONICAL_HOST}/sitemap.xml`,
    host: CANONICAL_HOST,
  };
}
