# ojao.in — website

Marketing site for **ojao**, a digital patient flow and virtual queue platform
for Indian hospitals, clinics, diagnostic labs, and radiology centres.

A rebuild of the live `ojao.in` (previously a Vite SPA) as a Next.js App Router
site, preserving all 15 indexed URLs and their copy while raising the design,
accessibility, and factual accuracy.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve the production build
```

Requires Node 20+.

## Verification scripts

Run these against a **built and running** server (`npm run build && npm run start`):

```bash
node scripts/check-claims.mjs   # every route resolves; no removed claim reappears
node scripts/a11y.mjs           # axe-core WCAG 2.1 AA across 11 routes
node scripts/diag.mjs           # confirms each WebGL canvas actually draws
node scripts/shoot.mjs          # screenshots to shots/ for design review
```

`check-claims.mjs` is the important one. It fails if any fabricated statistic
or false compliance badge finds its way back into the site — see `CLAIMS.md`.

## Read these before changing content

| File | What it covers |
|---|---|
| **`CLAIMS.md`** | Every claim on the old site and what happened to it. **Read before adding any number to the site.** |
| **`PLACEHOLDERS.md`** | Everything still needing a real value, decision, or lawyer — ordered by what blocks launch. |
| **`REDIRECTS.md`** | URL migration map, structured-data parity, security headers. |

---

## Architecture

```
app/
  layout.tsx            Root layout, one webfont, nav + footer, Organization JSON-LD
  page.tsx              Homepage — composes components/sections/*
  about/ features/ pricing/ security/
  blog/                 Index + [slug] for the four posts
  industries/[slug]/    One template, four verticals
  solutions/hospital-queue-management-software-india/
  privacy/ terms/       Draft legal outlines (noindex until written)
  api/contact/          Stub demo-request endpoint — logs only, see PLACEHOLDERS
  opengraph-image.tsx   Build-time OG card
  sitemap.ts robots.ts

components/
  sections/             One file per homepage section
  three/                WebGL — see below
  ui/                   Button, SiteNav, SiteFooter, Accordion, Reveal,
                        PageHeader, LegalShell, Wordmark, PlayStoreBadge
  seo/JsonLd.tsx        All structured data

content/                All copy as typed constants — no CMS
  copy.ts  faq.ts  blog.ts  industries.ts

lib/
  site.ts               CANONICAL_HOST and brand facts — single source of truth
  usePerfTier.ts        Device capability tiering for 3D
  useReducedMotion.ts
  cn.ts
```

**All copy lives in `content/`.** Sections read from it; nothing is hardcoded in
JSX. To change wording, edit `content/`, not components.

**`lib/site.ts` owns the domain.** `CANONICAL_HOST` feeds canonical tags,
`og:url`, and the sitemap. Change it in one place if the domain ever changes.

---

## The 3D layer

Four scenes, each explaining something about the product rather than decorating:

| Scene | Where | What it shows |
|---|---|---|
| **Living Map** (`MapCanvas`) | Hero | ~180 instanced hospital nodes at night, a "you are here" marker emitting expanding search-radius rings, and arcs to the nearest nodes. This is literally the app's nearby search. |
| **Token Stream** (`TokenStreamCanvas`) | "Skip the Wait" | Glass token-card silhouettes drifting along an S-curve, behind the real DOM queue. |
| **Console Field** (`ConsoleFieldCanvas`) | "For Hospitals" | Drifting connected data points. Strictly decorative. |
| **Pulse** (`PulseCanvas`) | Footer | One ECG line with a light travelling it at ~50 BPM. |

A fifth scene ("Trust Object", for hospital verification) was **cut** — that
feature does not exist. See `CLAIMS.md`.

### How the loading works

```
SceneGate  (light, always rendered)
  ├─ poster            CSS-only static fallback, server-rendered
  └─ SceneCanvas       lazily imported — three.js lives only behind here
       └─ scene contents
```

`SceneGate` fetches the canvas chunk only when **all** of these hold:

1. The browser is idle (`requestIdleCallback`) — 3D never competes with hydration
2. The section is within 600px of the viewport — the footer scene doesn't load at page top
3. `prefers-reduced-motion` is not set
4. WebGL is available
5. The viewport is wide enough (per-scene `minWidth`)

Result: **1 canvas at page load, 4 after scrolling the full page.** Nothing 3D
is in the critical path, and Three.js is absent from the initial bundle.

### Posters are real, not placeholders

`components/three/Posters.tsx` holds CSS-only static renders of each scene —
pure gradients and borders, no image files. They are what reduced-motion users,
no-WebGL browsers, and small viewports see, permanently. **The site is designed
to look good with all motion off**; verify any 3D change against that state.

### Tuning the scenes

- Node count, camera, and instance counts: constants at the top of each
  `*Canvas.tsx`.
- Shaders: `components/three/shaders/map.glsl.ts`, with each uniform documented.
- Quality tiers: `lib/usePerfTier.ts` returns `none` / `low` / `high`; each
  scene reduces instance counts and drops antialiasing on `low`.
- DPR is clamped in `SceneCanvas` (1.35 low / 1.75 high) so high-density
  displays don't quadruple fragment cost.
- Off-screen canvases set `frameloop="never"` — a scene you can't see costs zero.

### Two deliberate departures from the original brief

1. **No drei `<Text>`.** It fetches a font over the network, which this site's
   CSP (`connect-src 'self'`) blocks — the component then suspends forever and
   the scene renders empty. Token numbers live in real DOM instead, which is
   also the accessible answer: canvases are `aria-hidden`, so anything inside
   them is invisible to a screen reader.
2. **No `MeshTransmissionMaterial`.** It renders the scene to an offscreen
   buffer per mesh; at eight cards that blew the frame budget on mid-range
   hardware for an effect nearly indistinguishable from a low-roughness
   physical material at this scale.

`@react-three/drei` and `@react-three/postprocessing` were removed entirely once
unused, along with `framer-motion` (reveals are CSS scroll-driven animations
now — no JS, and no failure mode where content sticks at `opacity: 0`).

---

## Design system

Tokens are in `app/globals.css` under `@theme`.

**Light base, dark feature sections.** Content, credibility, and dense reading
happen on white/`mist`; dark bands are reserved for the hero, the queue demo,
the simulator, and the final CTA. The seam between them (`.seam-to-light` /
`.seam-to-dark`) is a deliberate gradient, not a hard cut.

**Palette** — matches the Flutter app's `app_colors.dart` and the live
stylesheet, with one correction:

```
navy-deep  #0B1120   charcoal    #0F172A   navy    #123A84
brand      #2563EB   cyan        #0EA5E9
slate      #556174   slate-light #94A3B8
mist       #F1F5F9   offwhite    #FAFAFA   line    #E2E8F0
serving    #10B981   called      #F59E0B   urgent  #EF4444
```

⚠️ **`slate` is `#556174`, not the app's `#64748B`.** That original value only
reaches 4.34:1 on the `mist` background — a WCAG AA failure. `#556174` clears
5.7:1 on mist and 6.2:1 on white.

⚠️ **`slate-light` is for dark surfaces only** (7.4:1 on `navy-deep`, but only
2.3:1 on `mist`). Using it on a light background is the most likely way to
reintroduce a contrast failure. Run `node scripts/a11y.mjs` after any colour
change.

Queue-state colours are semantic — `serving`, `called`, `urgent` — and never
used decoratively. Red appears only in genuine urgency contexts.

**Type:** one family (Inter) at three weights. Display sizes use tighter
tracking rather than a second font; `--font-mono` is a system stack, used only
for token numbers and queue positions via `.t-token`.

---

## Measured results

Lighthouse, mobile, simulated throttling, median of 5 runs, compared against the
live site measured identically:

Measured against the **deployed** site at https://ojao.in, versus the previous
site measured identically before the swap:

| | Previous site | Deployed now |
|---|---|---|
| Performance | 66 | **74** |
| Accessibility | 79 | **100** |
| Best Practices | 96 | **100** |
| SEO | 100 | **100** |
| LCP | 5.0s | **3.5s** |
| CLS | 0 | **0** |
| TBT | 160ms | 540ms |

**TBT is a genuine regression** — the cost of shipping WebGL and interactive
React where the old site shipped mostly static markup. It came down from an
initial 780ms through lazy scene loading, removing three dependencies, and
converting reveals to CSS, but performance does not reach the ≥85 target the
brief asked for. Scores also varied 60–82 across runs on a loaded development
machine; measure on clean hardware or in CI before treating any number as final.

Accessibility: **0 axe-core WCAG 2.1 AA violations across 11 routes.**

---

## Deploying

The site is a **static export** served by nginx from `/var/www/ojao` on the
existing EC2 box (`98.81.124.180`) — the same model the previous site used. No
Node process runs for the site, which matters: that box has 1.9GB of RAM and
already runs `ojao-api` and `ojao-auth` under PM2.

```bash
npm run build                        # -> out/ (runs postbuild automatically)
tar -czf /tmp/ojao-out.tar.gz -C out .
scp -i <key> /tmp/ojao-out.tar.gz ubuntu@98.81.124.180:~/
```

Then on the server:

```bash
STAMP=$(date +%Y%m%d-%H%M%S)
sudo cp -a /var/www/ojao /var/www/ojao.backup-$STAMP   # always back up first
mkdir -p ~/ojao-site-new && tar -xzf ~/ojao-out.tar.gz -C ~/ojao-site-new
sudo chown -R www-data:www-data ~/ojao-site-new
sudo chmod -R 755 ~/ojao-site-new
sudo mv /var/www/ojao /var/www/ojao.old
sudo mv ~/ojao-site-new /var/www/ojao
sudo nginx -t && sudo systemctl reload nginx          # test BEFORE reloading
```

Rollback is `sudo mv /var/www/ojao.old /var/www/ojao`.

### nginx is the source of truth for headers and redirects

`output: "export"` silently ignores `headers()` and `redirects()` in
`next.config.ts`. The deployed versions live in **`deploy/nginx-ojao.conf`** and
must be kept in sync with the config by hand. Install with:

```bash
sudo cp deploy/nginx-ojao.conf /etc/nginx/sites-available/ojao
sudo nginx -t && sudo systemctl reload nginx
```

⚠️ The CSP names `static.cloudflareinsights.com` explicitly. Cloudflare injects
its Web Analytics beacon at the proxy layer, so it is not in our HTML but is
still governed by our CSP — without that allowance the beacon is blocked and
analytics silently stop. This was a real regression caught after the first
deploy. Any third-party script added later needs the same treatment.

### Post-deploy

**Submit `https://ojao.in/sitemap.xml` in Google Search Console** so the dead
`ojao.care` URLs get re-crawled and dropped. See `REDIRECTS.md`.
