/**
 * Single source of truth for host-level facts about the site.
 *
 * CANONICAL_HOST is deliberately one constant: the live site currently
 * canonicalizes every page to `ojao.care`, which does not resolve
 * (NXDOMAIN), while `ojao.in` is the domain that actually serves traffic.
 * The owner confirmed `ojao.in` is the only domain they own, so everything
 * — canonical tags, og:url, sitemap — derives from here.
 */
export const CANONICAL_HOST = "https://ojao.in";

export const SITE = {
  name: "ojao",
  legalName: "ojao Systems",
  tagline: "Move Smarter, Live Better",
  /** Kept from the live site: it is well written and already ranking. */
  description:
    "ojao replaces paper tokens and crowded waiting rooms with a live, trackable patient queue. Digital patient flow for hospitals, clinics, diagnostic labs, and radiology centres in India.",
  locale: "en-IN",
} as const;

export const LINKS = {
  playStore:
    "https://play.google.com/store/apps/details?id=care.no2q.patient",
  linkedin: "https://www.linkedin.com/company/ojao",
  instagram: "https://www.instagram.com/ojao.care",
  twitter: "https://twitter.com/ojao_care",
  founders: {
    subham: "https://www.linkedin.com/in/subham-ojha",
    priyanshu: "https://www.linkedin.com/in/priyanshu-ojha",
  },
} as const;

/**
 * There is no iOS app. Do not render an App Store badge until this
 * holds a real URL.
 */
export const APP_STORE_URL: string | null = null;
