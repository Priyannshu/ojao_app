# PLACEHOLDERS.md

Everything in the rebuilt site that still needs a real value, a decision, or a
lawyer. Ordered by what blocks launch.

---

## 🔴 Blocks launch

### 1. The canonical domain (fixed in code — still needs a DNS decision)

The live site canonicalizes **every** page to `https://ojao.care/`, and its
`sitemap.xml` lists all 15 URLs on that host. `ojao.care` does **not resolve**:

```
nslookup ojao.care   →  Non-existent domain
curl https://ojao.care →  connection failed
ojao.in              →  Cloudflare, HTTP 200
```

Every page was telling Google to drop the domain that actually works. The owner
confirmed `ojao.in` is the only domain they own, so the rebuild points
canonical, `og:url`, and `sitemap.xml` at `ojao.in` — controlled by a single
constant, `CANONICAL_HOST` in `lib/site.ts`.

**Still to do:** after deploying, submit the new sitemap in Google Search
Console so the `ojao.care` URLs are re-crawled and dropped. If `ojao.care` is
ever registered, change that one constant and 301 host-wide.

### 2. Legal pages are outlines, not legal copy

`/privacy` and `/terms` are structural drafts. Both are `noindex` and
`Disallow`ed in `robots.txt`, and both render a visible "Draft outline" banner
so nobody mistakes them for reviewed documents.

- `{{TODO_LEGAL}}` — name a Data Protection Officer / grievance contact and a
  response window. **The DPDP Act requires a reachable grievance channel.**
- `{{TODO_LEGAL}}` — a real contact email and postal address.
- `{{TODO_LEGAL}}` — governing law, jurisdiction, registered entity name and
  address, liability limits, termination clause.

These are not optional: the site collects personal data through the demo form
and the Play Store listing requires a privacy policy.

### 3. ✅ Demo form — RESOLVED

`CONTACT_EMAIL` is set to `priyanshu@ojao.in`. Submitting the form opens a
prefilled `mailto:` with facility name, facility type, and the contact's email;
the address is also linked in the footer and in the form's confirmation panel.

Context worth knowing: **the previous site's form posted nowhere at all.** There
is no contact/demo/lead endpoint in `ojao-api`, and no third-party form service
in the old JS bundle — so every "Book Free Live Consultation" submission since
launch was silently discarded. Nobody has ever received a demo request through
the website.

Fix: set `CONTACT_EMAIL` to a real address. The form then opens a prefilled
`mailto:` with facility name, facility type, and the contact's email. Works with
zero infrastructure and cannot fail silently.

Longer term, a POST endpoint on the existing `ojao-api` (which already runs and
has Postgres) would be better than mailto.

### 4. Postal address still missing

`priyanshu@ojao.in` is now in the footer, so the site is reachable. A registered
postal address is still absent and is expected on Indian commercial sites (and
required by the legal pages in §2).

- `{{TODO}}` — add the registered entity name and address.

---

## 🟠 Should resolve before launch

### 5. Statistics were removed, not replaced

Every headline number is gone (see `CLAIMS.md`). The design has room for a
credibility strip in the hero and does not currently use it.

- `{{TODO_STAT: facilities onboarded}}` — real count, with a date.
- `{{TODO_STAT: patients processed}}` — if instrumented.
- `{{TODO_STAT: median wait reduction}}` — needs a before/after measurement at
  a real facility. This is the single most valuable number to obtain: a
  measured result from one pilot beats every removed figure combined.

Until they exist, the site converts on the product demo and the pilot offer.
Do not re-add unsourced numbers.

### 6. Founder LinkedIn URLs are inferred

`lib/site.ts` guesses `linkedin.com/in/subham-ojha` and
`linkedin.com/in/priyanshu-ojha` from the names. The live site links real
profiles behind a JS click handler that could not be read from the HTML.

- `{{TODO}}` — confirm both URLs; a broken founder link on an About page is a
  bad look on a page whose whole job is credibility.

### 7. No iOS app

There is no App Store listing. No App Store badge is rendered anywhere, and
`APP_STORE_URL` in `lib/site.ts` is explicitly `null`.

- `{{TODO}}` — set it when iOS ships; the badge component reads that constant.

### 8. ✅ Real logo in use — RESOLVED

The site now uses the actual brand mark from `ojao_logo.png` (the four
concentric-line letterforms), not a substitute.

`scripts/extract-logo.mjs` crops the source to its ink bounds (it was 1254x1254
with the mark occupying only 1082x317) and moves coverage into the alpha
channel, producing `public/ojao-logo-mask.png` at 31KB. That asset is rendered
as a **CSS mask over `currentColor`**, so one file works on both the white nav
and the navy hero and inherits its context's text colour — no second asset, no
invert filter, no hardcoded hex.

It also drives `app/icon.png` (favicon) and the OG card.

⚠️ The mark is detail-heavy: four concentric strokes per letter. Below about
26px tall the lines mud together. Current sizes are 30px in the nav and 38px in
the footer. **Do not shrink it further.** A simplified single-stroke variant for
small sizes would be the proper fix if a smaller lockup is ever needed.

- `{{TODO}}` — optional: supply a true SVG so it is resolution-independent, and
  a simplified mark for small sizes.

---

## 🟡 Nice to have

### 9. Features gated behind launch

Copy is written and ready for these, but omitted per the owner's confirmation
that none are launched. Restore when each ships (see `CLAIMS.md`):

- Video consultation
- Online payments (Razorpay)
- Emergency-availability flag
- Hospital verification — this one also unlocks the cut "Verified Only" section
  and its Three.js Trust Object scene, whose spec is retained in
  `CLAIMS.md` and the original brief.
- Google Maps directions

### 10. Blog post dates

All four posts are dated `13 July 2026`, ported from the live site. If that is
a placeholder rather than a real publication date, fix `isoDate` in
`content/blog.ts` — it feeds `Article` structured data.

### 11. OG image is generated, not designed

`app/opengraph-image.tsx` renders a card at build time using the hero's visual
idea. It is good, not art-directed.

- `{{TODO}}` — optional: replace with a designed 1200×630 asset.

### 12. Analytics

Cloudflare Web Analytics is active (injected at the proxy layer, not in our
HTML). Nothing else is installed — no Google Analytics, no Plausible.

⚠️ The CSP had to name `static.cloudflareinsights.com` explicitly, because a
proxy-injected script is still governed by our CSP. The first deploy blocked the
beacon until this was fixed. **Any analytics or third-party script added later
needs allowlisting in both `next.config.ts` and `deploy/nginx-ojao.conf`, or it
will fail silently.**

---

## Verification

The deployed site can be checked directly:

```bash
# Every removed claim stays removed, every route resolves
node scripts/check-claims.mjs https://ojao.in

# Zero WCAG AA violations across 11 routes
node scripts/a11y.mjs

# Confirm each canvas actually draws
node scripts/diag.mjs
```
