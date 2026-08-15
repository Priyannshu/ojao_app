import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CANONICAL_HOST, SITE } from "@/lib/site";
import { SiteNav } from "@/components/ui/SiteNav";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { OrganizationSchema } from "@/components/seo/JsonLd";
import "./globals.css";

/**
 * One webfont, not three.
 *
 * The earlier setup loaded Inter, Inter Tight, and JetBrains Mono — 133KB of
 * woff2 competing with the LCP on mobile. Inter and Inter Tight are close
 * enough that tighter tracking on the display sizes covers the difference, and
 * the mono is only used for token numbers, where a system stack with
 * tabular-nums reads just as instrumented. Net saving: ~85KB.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  // Only the weights actually used, so the variable font subsets tightly.
  weight: ["400", "500", "600"],
});

const TITLE = "ojao — Digital Patient Flow & Virtual Queue for Healthcare";

export const metadata: Metadata = {
  metadataBase: new URL(CANONICAL_HOST),
  title: { default: TITLE, template: "%s | ojao" },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_IN",
    url: CANONICAL_HOST,
    title: TITLE,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    site: "@ojao_care",
    title: TITLE,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={SITE.locale}
      className={`${inter.variable} antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
        <SiteNav />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <OrganizationSchema />
      </body>
    </html>
  );
}
