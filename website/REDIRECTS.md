# REDIRECTS.md

URL-level migration plan. **Every URL indexed on the live site either exists at
the same path in the rebuild or 301s to its closest equivalent. Zero 404s.**

Verified with `node scripts/check-claims.mjs`, which fetches every route and
fails on any non-200.

---

## The domain problem comes first

The live `sitemap.xml` lists 15 URLs, **all on `ojao.care`** — a domain that
returns NXDOMAIN. Every page also carries
`<link rel="canonical" href="https://ojao.care/...">`.

So the live site's own sitemap and canonical tags point at a host that does not
exist, while the content is served from `ojao.in`. Google is being told to
consolidate ranking signals onto a dead domain.

**Resolution:** `ojao.in` is canonical everywhere (owner confirmed it is the only
domain owned). Controlled by `CANONICAL_HOST` in `lib/site.ts`.

**Post-deploy action:** submit `https://ojao.in/sitemap.xml` in Google Search
Console. The old `ojao.care` entries will drop out once re-crawled; there is
nothing to redirect *from*, because that host never resolved.

---

## 1:1 — same path, no redirect needed

| Live URL | Rebuild | Notes |
|---|---|---|
| `/` | `/` | Long-scroll homepage. H1 `Waiting is not healthcare.` kept — it carries brand equity and rankings. |
| `/about` | `/about` | Origin story + both real founder bios preserved. |
| `/features` | `/features` | Reconciled against shipped features; unlaunched items removed, two real ones added. |
| `/pricing` | `/pricing` | Enterprise-quote model + 3 FAQs + the single-department pilot offer. |
| `/security` | `/security` | Ported near-verbatim (best-written page on the site), minus the HIPAA/GDPR badge. |
| `/blog` | `/blog` | Index of all four posts. |
| `/blog/hospital-queue-management-system-india-guide` | same | Full text + Maister/WHO/NHS citations. |
| `/blog/how-to-choose-patient-flow-software` | same | Full text + DPDP citation. |
| `/blog/reducing-opd-wait-times` | same | Full text + Maister/WHO citations. |
| `/blog/digital-token-vs-paper-queue` | same | Full text + ABDM/DPDP citations. |
| `/industries/hospitals` | same | One template, four content objects. |
| `/industries/clinics` | same | |
| `/industries/diagnostic-labs` | same | |
| `/industries/radiology` | same | |
| `/solutions/hospital-queue-management-software-india` | same | SEO landing page, rewritten to remove fabricated stats while keeping keyword coverage. |

**15 of 15 live URLs preserved at their exact paths.**

## 301 redirects (`308` in Next.js — Google treats it as a permanent redirect)

Configured in `next.config.ts`.

| From | To | Reason |
|---|---|---|
| `/hospitals` | `/industries/hospitals` | The brief specified a `/hospitals` B2B page. It would compete with the already-indexed `/industries/hospitals` for the same query — keyword cannibalisation. One canonical URL wins; this redirects. |
| `/industries` | `/industries/hospitals` | Bare path had no page; sends to the primary vertical rather than 404ing. |
| `/solutions` | `/solutions/hospital-queue-management-software-india` | Same reasoning. |
| `/clinics` | `/industries/clinics` | Plausible inbound shorthand. |
| `/radiology` | `/industries/radiology` | Plausible inbound shorthand. |
| `/diagnostic-labs` | `/industries/diagnostic-labs` | Plausible inbound shorthand. |

## New routes (not on the live site)

| URL | Indexed? | Reason |
|---|---|---|
| `/privacy` | **No** — `noindex` + `Disallow` | Required by DPDP Act and Play Store policy, and the site collects data via the demo form. Currently a draft outline, so excluded from search until the legal copy is written. |
| `/terms` | **No** — `noindex` + `Disallow` | Same. |
| `/api/contact` | **No** — `Disallow` | Stub form endpoint. |
| `/opengraph-image` | n/a | Build-time generated OG card. |
| `/sitemap.xml` | n/a | Now lists `ojao.in` URLs. |
| `/robots.txt` | n/a | |

Neither legal page is in `sitemap.xml` — a sitemap should not advertise a
`noindex` URL.

---

## In-page anchors

Several live pages link to `/#cta-section`. The rebuild uses `#demo` for the
demo form. Internal links are all updated, but if anything external points at
the old anchor it will land on the homepage rather than scrolling — harmless,
and not worth a redirect since fragments never reach the server.

Anchors available on `/`: `#problem`, `#journey`, `#simulator`, `#hospitals`,
`#trust`, `#faq`, `#demo`.

## Structured data parity

The live site shipped `FAQPage` (6 Q&As), `SoftwareApplication`, and `Offer`.
All three are preserved, and these are added:

- `Organization` — with both founders as `Person` entities
- `Article` — on each blog post
- `FAQPage` — extended to `/pricing`, `/security`, `/solutions/...`, and every
  `/industries/*` page, each with that page's own questions

One deliberate change: the live `Offer` implied a price. The rebuild uses
`priceSpecification` describing custom enterprise pricing instead, because
pricing genuinely is quote-based and a `price: 0` offer reads as "free".

## Security headers

Kept at parity with what Cloudflare already served, so the migration is not a
regression:

`Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`

Added: `Permissions-Policy` and a `Content-Security-Policy` (the live site had
none).

⚠️ The CSP restricts `connect-src` to `'self'`. Any analytics or third-party
endpoint added later must be allowlisted there or it will be silently blocked —
this already caught one real bug during the build.
