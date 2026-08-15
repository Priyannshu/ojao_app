import type { NextConfig } from "next";

/**
 * Security headers are kept at parity with what the live Cloudflare-served
 * site already sends, so the migration is not a regression. CSP is added
 * (the live site had none), with the allowances Next.js and next/font need.
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
      // 'unsafe-inline' is required for Next's inline bootstrap and the
      // JSON-LD blocks. blob: is required because drei's <Text> compiles SDF
      // glyphs in a worker that importScripts() a second blob URL — without
      // it the token numbers silently fail to render.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  async redirects() {
    return [
      // /hospitals would compete with /industries/hospitals for the same
      // query. One canonical URL, and the other redirects to it.
      {
        source: "/hospitals",
        destination: "/industries/hospitals",
        permanent: true,
      },
      // Legacy/likely inbound paths, folded into their real equivalents so no
      // existing link or bookmark 404s.
      {
        source: "/industries",
        destination: "/industries/hospitals",
        permanent: true,
      },
      {
        source: "/solutions",
        destination: "/solutions/hospital-queue-management-software-india",
        permanent: true,
      },
      {
        source: "/clinics",
        destination: "/industries/clinics",
        permanent: true,
      },
      {
        source: "/radiology",
        destination: "/industries/radiology",
        permanent: true,
      },
      {
        source: "/diagnostic-labs",
        destination: "/industries/diagnostic-labs",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
