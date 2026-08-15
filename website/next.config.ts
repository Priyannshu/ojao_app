import type { NextConfig } from "next";

/**
 * Static export.
 *
 * ojao.in is served as static files from /var/www/ojao by nginx, and the box
 * runs on 1.9GB of RAM with two PM2 API processes already on it. Adding a third
 * Node process for a marketing site would be the riskiest part of the
 * deployment for no benefit, so the site exports to plain HTML.
 *
 * Consequences, all handled:
 *  - `headers()` and `redirects()` below do nothing in an export. The real
 *    versions live in deploy/nginx-ojao.conf, which is the deployed source of
 *    truth. They are kept here so `next dev` behaves like production.
 *  - There are no route handlers. The demo form uses a mailto: (see
 *    components/sections/FinalCta.tsx) rather than pretending to POST.
 */
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' covers Next's inline bootstrap and the JSON-LD blocks.
      // Cloudflare injects its Web Analytics beacon at the proxy layer, so it
      // is not in our HTML but is still governed by our CSP. Without these two
      // allowances the beacon is blocked and analytics silently stop.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://static.cloudflareinsights.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://cloudflareinsights.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "export",

  // Emit about/index.html rather than about.html, so nginx can serve clean URLs
  // with a plain `try_files $uri $uri/` and no rewrite rules. This also matches
  // the directory layout the previous Vite build produced.
  trailingSlash: true,

  // No Image Optimization server exists in an export. Nothing uses next/image
  // today; this keeps it from failing the build if something does later.
  images: { unoptimized: true },

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  async redirects() {
    return [
      // /hospitals would compete with the already-indexed
      // /industries/hospitals for the same query. One canonical URL wins.
      { source: "/hospitals", destination: "/industries/hospitals", permanent: true },
      { source: "/industries", destination: "/industries/hospitals", permanent: true },
      {
        source: "/solutions",
        destination: "/solutions/hospital-queue-management-software-india",
        permanent: true,
      },
      { source: "/clinics", destination: "/industries/clinics", permanent: true },
      { source: "/radiology", destination: "/industries/radiology", permanent: true },
      {
        source: "/diagnostic-labs",
        destination: "/industries/diagnostic-labs",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
