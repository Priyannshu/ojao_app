# Build Prompt — ojao.in Website Redesign

> Paste everything below the line into Claude Code, Cursor, Codex, v0, or any coding agent.
> It is written to be self-contained: the agent does not need access to the mobile app repo.

---

## 0. AUDIT OF THE LIVE SITE — verified 2026-08-15

The live `ojao.in` was inspected before this brief was finalized. It is **not** a "plain and generic"
placeholder — it is a fairly built-out B2B site with 16 indexed URLs, an interactive simulator, and a
mock analytics console. Read this section before you write a line of code; several items below are
blockers that matter more than the redesign.

### 🔴 Blocker 1 — every page canonicalizes to a domain that does not exist

`ojao.in` serves `<link rel="canonical" href="https://ojao.care/" />` and
`<meta property="og:url" content="https://ojao.care/" />`. `sitemap.xml` lists **16 URLs, all on
`ojao.care`**. But `ojao.care` is **NXDOMAIN** — it does not resolve at all:

```
nslookup ojao.care  →  *** can't find ojao.care: Non-existent domain
curl https://ojao.care  →  status 000 (connection failed)
ojao.in  →  104.21.2.151, 172.67.129.85 (Cloudflare, HTTP 200)
```

Every page is instructing Google to drop `ojao.in` in favour of a dead host. **Decide the canonical
domain before shipping**, then make canonical + `og:url` + sitemap agree with it. Either register and
serve `ojao.care` (and 301 `.in` → `.care`), or — the cheaper fix — change all canonicals and the
sitemap to `ojao.in`. Do not ship a redesign on top of this bug; it will bury the new site too.
Related signal: the Play package is `care.no2q.patient` and Instagram is `ojao.care`, so a
`no2q → ojao` / `.in → .care` migration was clearly started and left half-done. Ask the owner which
domain is the intended home rather than guessing.

### 🔴 Blocker 2 — "Fully HIPAA & GDPR Compliant" is on the live site

That badge appears on the homepage, `/about`, and `/security`, alongside a "99.9% Integration SLA".
HIPAA is a US statute that does not apply to an Indian OPD queue tool, and nothing on the site
supports a GDPR or SLA claim. §1's integrity rules forbid inventing this — so this is not a claim to
carry over, it is a claim to **remove**. Note that `/security` already gets this right
("Built with India's DPDP Act 2023 in mind", framed as designed-around-principles, not certified) —
that page's framing is the model; the badge contradicts it. Flag both to the owner; do not silently
reproduce either the badge or the SLA number.

### 🟠 Blocker 3 — the live site sells to hospitals; this brief sells to patients

The live hero is `Waiting is not healthcare.` with CTAs *Try Patient Simulator* and *Browse Admin
Dashboard*; the primary conversion everywhere is **Request Enterprise Demo**, and `/pricing` is
custom enterprise quotes only ("Pricing depends on the number of departments, doctors, and
locations"). §5 of this brief instead makes patients the primary audience and *Get the app* the
primary CTA. **These are different businesses with different funnels.** Resolve this with the owner
before building — do not average them into a site that converts neither. If revenue comes from
hospitals, the hero must speak to hospital administrators and §5's copy deck needs reordering, with
the patient story as proof that the system works rather than as the lead.

### 🟠 Blocker 4 — the numbers already on the site are unsourced

Live copy asserts `300+ Clinics Live`, `98% Satisfaction`, `42m Avg. Time Saved`, `-45% Crowding`,
`8,680+` patients served in 7 days, `4.95/5` from `5,740 feedbacks`, `78.1%` hold reduction,
`45% lobby capacity relief`, `88% On-time draws`. Some sit inside a mock "Enterprise Console" where
illustrative data is defensible **if labelled**; the hero stats are presented as fact and are not.
For a two-person team with no disclosed customers, `300+ Clinics Live` is the kind of claim that
costs a healthcare deal when a procurement team asks for references.

Per §1: do not carry any of these forward unverified. For each one, ask the owner for the source. If
it is real, keep it and cite it. If it is illustrative, either delete it or label it inside the
simulator UI ("sample data"). Everything unresolved becomes a `{{TODO_STAT}}` in `PLACEHOLDERS.md`.

### 🟡 Blocker 5 — a rebuild "from scratch" would drop 16 indexed URLs

The live site is not one page. It is:

| Route | Notes |
|---|---|
| `/` | Long-scroll homepage, 11 sections |
| `/about` | Real founder bios, origin story |
| `/features` | Feature list, patient + admin |
| `/pricing` | Enterprise-quote model + 3 FAQs |
| `/security` | Best page on the site; DPDP framing, encryption, RBAC, retention, no-resale |
| `/blog` + 4 posts | `hospital-queue-management-system-india-guide`, `how-to-choose-patient-flow-software`, `reducing-opd-wait-times`, `digital-token-vs-paper-queue` |
| `/industries/…` | `hospitals`, `clinics`, `diagnostic-labs`, `radiology` — parallel vertical templates |
| `/solutions/hospital-queue-management-software-india` | SEO landing page |

§5 of this brief plans only `/`, `/hospitals`, `/privacy`, `/terms`. Shipping that deletes the blog,
all four industry pages, the SEO landing page, `/security`, `/features`, and `/pricing`. **Every
existing URL must either survive or 301 to its closest replacement** — see §6. Port the real copy
across; `/security` in particular is better written than anything in this brief's copy deck.

### 🟢 Confirmed real — safe to build on

- **Brand:** `ojao` / `ojao Systems` (footer: `© 2026 ojao Systems`). Tagline **"Move Smarter, Live
  Better"** — this brief never mentioned it; keep it. Site also asserts "Registered Trademark."
- **Team (real people, real bios — do not placeholder these):** Subham Ojha, Co-Founder & CEO
  (product/business, works directly with hospital administrators and clinic owners); Priyanshu Ojha,
  Co-Founder & CTO (real-time queueing engine, admin dashboards, patient notification systems). Both
  have LinkedIn links. Section heading is *"Built by founders who've sat in the waiting room too"* —
  a genuinely good line; keep it.
- **Socials:** `linkedin.com/company/ojao`, `instagram.com/ojao.care`, `twitter.com/ojao_care`.
- **App:** Android only — Google Play, package `care.no2q.patient`. **There is no iOS app**, so §5's
  "App Store + Play Store badges" is wrong; ship the Play badge alone until an App Store URL exists.
- **Contact:** no email, phone, or address is published anywhere. The only channel is the demo form
  (facility name, facility type, contact email → *Book Free Live Consultation*). Consider adding a
  real email — enterprise healthcare buyers distrust a vendor with no reachable address.
- **Colours in the live CSS:** `#2563EB` and `#0EA5E9` confirm this brief's `--ojao-blue` and
  `--ojao-cyan`. Also present: `#123A84` (a deeper navy than this brief's `--ojao-navy #1E3A8A`) and
  slate neutrals `#f1f5f9`, `#e2e8f0`, `#cbd5e1`, `#ffffff`. **The live site is light-themed.** §3's
  "deep clinical night" is therefore a deliberate rebrand, not a refresh — confirm the owner wants
  it, because it changes every screenshot, deck, and app-store asset downstream.
- **Worth keeping — the interactive simulator.** `/#simulator` issues a real virtual token (patient
  name + department, e.g. Radiology MRI ~12m, Cardiology ~10m, Lab ~4m) and there is a browsable mock
  admin console. A prospect *using* the product converts better than a Three.js scene they watch.
  This brief omits it entirely; it should survive the redesign as a first-class section.

### Live sections, for reference when reordering §5

Hero → "The Patient Care Flow Paradox" (traditional lobby vs. ojao flow, tabbed by vertical) →
"The Decoupled Patient Journey" (5 phases) → "Issue Your Virtual Token" (simulator) → "ojao
Enterprise Console" (24h/7d/30d analytics) → "Custom Modules for Every Healthcare Segment" (4
verticals) → founders → FAQ → "Decongest Your Practice Today" → demo form → footer.

---

## ROLE

You are a senior creative front-end engineer and art director. You build award-winning
marketing sites — the kind that get featured on Awwwards and Godly. You are equally strong at
WebGL/Three.js and at restrained, credible healthcare design. You care about performance and
accessibility as much as beauty, and you never ship a site that janks on a mid-range Android.

## THE TASK

Redesign and rebuild the marketing website for **ojao** (live at `ojao.in` — but read §0 Blocker 1,
the canonical domain is currently broken). The replacement must feel premium, modern, and alive —
with **all hero and section imagery generated procedurally in Three.js rather than sourced from
stock photography**. No stock photos of smiling doctors. Zero.

⚠️ **This is a redesign of a real, working, indexed site — not a greenfield build.** An earlier draft
of this brief said "the current site is plain and generic" and "from scratch." Both were wrong. The
live site is a Vite SPA with 16 indexed URLs, four blog posts, four industry landing pages, an
interactive token simulator, a mock analytics console, real founder bios, valid JSON-LD, and sensible
security headers. Some of its copy — `/security` especially — is better than what this brief
proposes. **§0 is the audit. Read it first.** Your job is to raise the design ceiling without
lowering the content, SEO, or credibility floor.

Build the whole site, not a demo: every section, real copy, responsive down to 360px, dark/light
handling, SEO metadata, and a working build.

---

## 1. PRODUCT TRUTH (do not invent features beyond this)

**ojao** is an Indian healthcare access platform. Two audiences, one product. Tagline:
*Move Smarter, Live Better.*

> **Verified against the app repo and `ARCHITECTURE.md` on 2026-08-15.** The three tiers below are
> not stylistic — marketing a tier-3 feature is a false claim about a healthcare product. Respect them.

### Tier 1 — shipped, and safe to market

**For patients:**
- Find hospitals and clinics near you, sorted by distance from your location
- Join a hospital's queue remotely and get a token number — wait at home, not on a plastic chair
- See your live position in the queue and get a push notification when you're being called
- Book appointments with specific departments
- Phone OTP login — no password to remember

**For hospitals and clinics:**
- A staff console to call, serve, skip, and complete tokens in real time
- Department-level queue management
- Analytics on wait times, throughput, and no-shows
- Merge walk-ins and scheduled patients into one ordered queue per doctor
- Check-in from the registration desk, a kiosk, or the patient's phone — **no proprietary hardware
  required** (a real objection-killer the live site makes and this brief had dropped)
- Coexists with an existing EMR/HIS; ojao is a flow layer, not a records system

### Tier 2 — built in the app, but absent from the live site

These exist in the repo (`lib/data/services/payment_service.dart`,
`lib/features/patient/presentation/screens/video_consult_screen.dart`, `functions/index.js`). Ask the
owner whether they are launched and supported before promoting them — code existing is not the same
as a feature being operationally live:

- Video consultation for remote care
- Online payments (Razorpay)
- Emergency-services availability flag on nearby results

### Tier 3 — 🔴 NOT IMPLEMENTED. Do not market. Do not build a section around.

`ARCHITECTURE.md` §9 lists these as current gaps against the target architecture:

- **Hospital verification.** There is *no* verification workflow, no admin review dashboard, and no
  hospital-application or document model in the source tree. The claim "only approved, active
  facilities are ever shown to patients" is **not currently true.**
  → This brief's **§5 Section 5 "Verified Only"** and its entire **Three.js Scene 3 (Trust Object)**
  are built on this non-existent feature. Cut them, or rewrite them as a forward-looking roadmap
  statement clearly marked as such. A verification badge you cannot back is the single most
  dangerous thing on a healthcare site.
- **Google Maps directions.** Not implemented. Drop "Tap once for directions" from the copy deck
  (§5 Section 3 step 3 and §5 Section 6) until it ships.
- **Server-side nearby search.** Distance is currently computed and sorted client-side from
  Firestore, not by PostGIS. Fine to say "sorted by distance"; do not claim verified coordinates.

**Positioning:** ojao removes the two worst parts of Indian healthcare access — not knowing where
to go, and the wait once you get there. (Live-site framing, which is stronger for the B2B audience:
most OPD friction *isn't clinical* — "It's a patient flow problem, and it's solvable with software.")

**Integrity rules — non-negotiable:**
- Do **not** fabricate user counts, hospital counts, funding, ratings, press logos, testimonials,
  or awards. Where a number would strengthen the design, insert a clearly marked placeholder
  (`{{TODO_STAT: hospitals onboarded}}`) and list every one in a `PLACEHOLDERS.md` at the repo root.
- **This applies to numbers already on the live site.** See §0 Blocker 4 — `300+ Clinics Live`,
  `98% Satisfaction`, `4.95/5`, and the rest are unsourced. Inheriting a claim does not verify it.
  Get a source or make it a placeholder.
- The founders and their bios (§0) are real. Use them. This rule bans *invented* social proof, not
  the genuine kind.
- Do not imply clinical outcomes, diagnosis, or medical advice.
- No fake HIPAA claims — and **remove the existing "Fully HIPAA & GDPR Compliant" badge and the
  "99.9% Integration SLA"** (§0 Blocker 2). India-relevant framing only: "built for India's DPDP
  Act 2023", never as certified. The live `/security` page already models this correctly; reuse its
  wording rather than writing new compliance copy.

---

## 2. TECH STACK (use exactly this)

> **What is live today (verified 2026-08-15):** a **Vite** SPA, *not* Next.js — single
> `/assets/index-[hash].js` + `/assets/index-[hash].css` bundle mounting into `<div id="root">`,
> served behind **Cloudflare**. Content *is* prerendered (hero copy and stats appear in the raw HTML,
> so crawlers see it) and security headers are already sane (`HSTS max-age=31536000`,
> `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
> `Referrer-Policy: strict-origin-when-cross-origin`). Existing JSON-LD: `FAQPage` (6 Q&As),
> `SoftwareApplication`, `Offer`. `<meta name="robots" content="index, follow">`, and a good meta
> description. `robots.txt` uses Cloudflare content-signal directives.
>
> **So this is a Vite → Next.js migration, not a greenfield build.** That is a defensible choice for
> the routing, metadata, and OG-image generation, but it is a bigger job than "the current site is
> plain" implies — budget for porting 16 routes and 4 blog posts, and keep the existing headers,
> JSON-LD, and prerendering behaviour at parity or better. If the owner does not want a framework
> migration, this brief's art direction and 3D work port to the existing Vite app fine; only §7's
> `app/` file tree assumes Next.js.

- **Next.js 15** (App Router) + **TypeScript**, strict mode
- **Tailwind CSS v4** for layout, spacing, type
- **three** + **@react-three/fiber** + **@react-three/drei** for all 3D
- **@react-three/postprocessing** for bloom/vignette (used sparingly)
- **framer-motion** for DOM animation and section reveals
- **lenis** for smooth scroll (respecting `prefers-reduced-motion`)
- **next/font** for self-hosted fonts — no render-blocking Google Fonts `<link>`
- Deploy target: **Vercel**. Everything must work on a static/edge build.
  ⚠️ DNS currently points at Cloudflare — coordinate the cutover, and see §0 Blocker 1 first.

Do not add a CMS, a component library (no MUI/Chakra/shadcn dump), Redux, or a backend.
This is a marketing site: content lives in typed constants in `/content`.

One exception to "no backend": the live site's **token simulator** and **mock analytics console**
(§0) are client-side state and must stay that way — they are the best conversion asset on the site.
Port them; do not let them regress into a static image.

---

## 3. ART DIRECTION

**The feeling:** *deep clinical night.* Calm, precise, and quietly technical — a healthcare
product that clearly has real engineering behind it. Think Linear or Stripe's depth and restraint,
rendered in medical blues, with light that behaves like a diagnostic instrument rather than a
nightclub. Trustworthy first, beautiful second — but genuinely beautiful.

> ⚠️ **The live site is light-themed** — white and slate (`#ffffff`, `#f1f5f9`, `#e2e8f0`, `#cbd5e1`)
> with blue accents, positioned as "a premium, minimal patient experience." Going dark-first is a
> **rebrand, not a refresh**: it invalidates existing screenshots, the sales deck, `presentations/`,
> and app-store assets, and dark UI is the less conventional choice for enterprise healthcare
> procurement. Confirm the owner wants this before building. A defensible middle path is to keep the
> light theme as the site's base and use dark only for the WebGL feature sections — §3's "Rhythm"
> paragraph already describes exactly that alternation, just inverted.

**Palette — these are ojao's real brand tokens. Use them, do not substitute.**

`--ojao-blue` and `--ojao-cyan` were confirmed present in the live stylesheet. The live CSS also
contains **`#123A84`**, a deeper navy than `--ojao-navy` below — reconcile the two rather than
shipping both.

```
--ojao-navy-deep   #0B1120   /* page background, darkest */
--ojao-charcoal    #0F172A   /* surface / card base */
--ojao-navy        #1E3A8A   /* calm navy, depth — live CSS uses #123A84; pick one */
--ojao-blue        #2563EB   /* PRIMARY brand blue, CTAs — ✅ confirmed live */
--ojao-cyan        #0EA5E9   /* soft cyan, glow + accent — ✅ confirmed live */
--ojao-slate       #64748B   /* secondary text */
--ojao-mist        #EEF3F8   /* light section background — live uses #f1f5f9 */
--ojao-offwhite    #FAFAFA   /* light section background, lightest */
--ojao-success     #10B981   /* "serving now" state */
--ojao-warning     #F59E0B   /* "called" state */
--ojao-danger      #EF4444   /* emergency */
```

Gradients are always `cyan → blue → navy`, never rainbow. Glow is always cyan-biased.
Emergency red appears **only** in the emergency context — never decoratively.

**Rhythm:** the page alternates. Dark WebGL sections carry emotion and product magic; light
sections (`--ojao-mist` / `--ojao-offwhite`) carry dense, readable content — how-it-works, the
hospital pitch, FAQ. The transition between them is a deliberate design moment, not an abrupt cut:
fade the dark section's glow into the light section's top edge.

**Typography:** one geometric-but-warm sans for display (Satoshi, General Sans, or Inter Tight)
and one highly legible sans for body (Inter). Display sizes are large and confident — `clamp()`
from ~40px to ~104px on the H1 — with tight tracking (`-0.03em`) and `text-wrap: balance`.
Use a mono (JetBrains Mono) *only* for token numbers, coordinates, and queue positions — it makes
the product feel instrumented.

**Layout:** 12-column grid, `max-w-[1280px]`, generous whitespace. Sections breathe:
`py-32` desktop, `py-20` mobile. Never center-align long paragraphs.

**Motion doctrine:** everything eases with a custom cubic-bezier (`[0.16, 1, 0.3, 1]`), 400–700ms.
Reveals are subtle — 16–24px rise plus opacity, staggered 60ms. Nothing bounces. Nothing spins for
decoration. Every motion should read as *a system responding*, which is exactly what ojao is.

---

## 4. THE 3D WORK — this is the centerpiece

Build **five** distinct Three.js scenes. Each one is a piece of *product-explaining art*, not a
generic blob. Each lives in `components/three/`, is mounted via a shared `<Scene>` wrapper, and is
`dynamic()`-imported with `ssr: false`.

### Scene 1 — Hero: "The Living Map"
The signature image of the site. An abstract, stylized dark map viewed at a low oblique angle
(~35° camera tilt), reading as a city at night without being a literal map.

- A subtle grid plane in navy, fading to black at the edges via a custom shader (radial falloff on
  `vUv` distance) so it never shows a hard boundary.
- **~180 hospital nodes** rendered as a single `InstancedMesh` of small emissive cyan discs at
  varied heights. Each node breathes on its own phase offset — drive this in a vertex shader from
  `uTime + instanceOffset`, not with 180 React state updates.
- One warm-white **"you are here"** marker at the visual center, with **two expanding radius rings**
  that ripple outward and fade — this is literally the app's nearby-search radius, and it is the
  emotional hook. Ring pulse every ~2.6s, offset from each other.
- **Arc connections**: 5–7 `QuadraticBezierCurve3` tubes from the user marker to the nearest nodes,
  with a gradient that travels along the arc (animate a `uProgress` uniform through the tube's UV).
- Very slow autonomous camera drift + **damped mouse parallax** (lerp toward target, never snap).
- Post: `Bloom` at low intensity (0.35–0.5, luminanceThreshold ~0.75) and a `Vignette`. That's it.
- Nodes near the pointer brighten slightly on hover — cheap raycast against the instanced mesh, or
  just distance-in-shader from a `uMouse` uniform (preferred: no raycast cost).

The H1 and CTA sit in DOM *over* this canvas, with a soft radial scrim behind the text so contrast
is guaranteed regardless of what the scene does. Verify 4.5:1 on the subhead.

### Scene 2 — "Skip the Wait": The Token Stream
A horizontal procession of translucent glass token cards floating along a gentle S-curve path,
each stamped with a mono number (`A-14`, `A-15`…). One card at the front glows
`--ojao-success` and reads **NOW SERVING**; the one behind it pulses `--ojao-warning` for
**CALLED**. Cards advance one position on a loop, and the whole line eases forward — the queue
visibly moving is the entire product promise.

Use `MeshTransmissionMaterial` from drei for the glass (cap `samples` at 4, `resolution` at 256 —
it is expensive). Numbers via `<Text>` from drei with an SDF font, not `Html`.

### Scene 3 — ⚠️ "Verified Only": The Trust Object — GATED, see §1 Tier 3
**Do not build this scene until hospital verification actually exists.** There is no verification
workflow, no review dashboard, and no application/document model in the repo
(`ARCHITECTURE.md` §9). An animation dramatising document review that reviews nothing is a
fabricated capability on a healthcare site — exactly what §1 and §9 forbid.

**Substitute (recommended):** rebuild this slot as **"The Simulator"** — the live site's token
issuance demo, which is real, works, and converts. Give it the design attention this scene was going
to get: a genuinely beautiful interactive token card, mono numerals, live ETA, state transitions
through `--ojao-warning` → `--ojao-success`. Real interaction beats rendered metaphor.

*Spec retained for when verification ships:* a slowly rotating faceted crystalline shield/badge — an
`IcosahedronGeometry` with a custom material: dark navy body, cyan Fresnel rim
(`pow(1.0 - dot(viewDir, normal), 3.0)`), and a faint internal light. Fragments of
documents/checkmarks orbit it and dissolve inward, one at a time, each dissolve landing with a
checkmark flash. Restrained and slow — it should feel like a seal, not a loading spinner.

### Scene 4 — "For Hospitals": The Console Field
Scroll-driven. Three floating dashboard planes (queue, departments, analytics) arranged in
depth, rendered as real DOM via drei's `<Html transform occlude>` so the numbers are crisp,
selectable, and accessible. As the user scrolls the section, the planes rotate from a stacked
oblique arrangement into a flat, readable front-facing grid — tie rotation to
`useScroll().offset` from drei with damping. Live-looking numbers tick upward on entry.

### Scene 5 — Footer: The Pulse
A single continuous ECG/heartbeat line as a `TubeGeometry` along a `CatmullRomCurve3`, with a
bright cyan point of light traveling its length, trailing a fading glow. Slow, calm BPM (~50).
Sits behind the final CTA. It is the site's last breath out — quiet, not showy.

### 3D engineering requirements (the agent must honor all of these)

- **Perf budget:** ≥55fps on an M1 Air and ≥30fps on a mid-range Android (Moto G-class). Total
  draw calls per scene ≤ 60. Never more than one `Canvas` rendering at a time.
- **Instancing over iteration.** Any repeated element (nodes, tokens, particles) is one
  `InstancedMesh` animated in the vertex shader. No per-object `useFrame` loops over 100+ objects.
- **`useFrame` discipline:** no allocations inside the loop. Hoist `Vector3`/`Color`/`Matrix4`
  instances to module scope or refs. No `setState` in a frame loop, ever.
- **DPR clamp:** `dpr={[1, 1.75]}` and wrap in drei's `<PerformanceMonitor>` to step quality down
  (drop postprocessing, halve instance counts) when fps sags.
- **Viewport gating:** every canvas pauses when scrolled out of view (`frameloop="demand"` or an
  IntersectionObserver toggling `frameloop`). Off-screen scenes must cost zero.
- **Mobile tier:** detect low-power/small viewport and serve a reduced variant — fewer instances,
  no transmission material, no postprocessing. Under 480px, Scenes 3 and 4 may fall back to a
  high-quality static render.
- **`prefers-reduced-motion: reduce`:** replace every canvas with a beautiful *static* first-frame
  render (pre-render each scene to a WebP/AVIF poster and commit it). The site must be stunning with
  all motion off — this is a design requirement, not a checkbox.
- **No-WebGL fallback:** same posters, no error, no layout shift.
- **Loading:** `<Suspense>` per scene with a branded skeleton (a soft cyan glow bloom-in, not a
  spinner). Hero must reach LCP without waiting on WebGL — the H1 is DOM text and paints first.
- Write shaders as raw GLSL strings with named uniforms and a short comment block explaining each.
  Keep them readable; someone will maintain these.

---

## 5. PAGE STRUCTURE & COPY DECK

Single long-scroll homepage plus three thin routes. Use this copy — it is written for the product.
Improve the rhythm if you can, but do not drift from the meaning and do not add claims.

> ⚠️ **Read §0 Blockers 3 and 5 before using this deck.**
> **(a) Audience order is unresolved.** This deck leads with patients and *Get the app*. The live
> site leads with hospitals and *Request Enterprise Demo*, which is where the revenue is. If the
> owner confirms B2B-first, invert it: hospitals in the hero (Section 7's pitch moves up), the
> patient experience reframed as the mechanism, and *Request Enterprise Demo* as the primary CTA
> sitewide with *Get the app* secondary.
> **(b) This deck covers 4 routes; the live site has 16.** The additional routes in "Additional
> routes" below are **not optional** — they exist, they are indexed, and their copy is already
> written. Port it.

**Nav** (sticky, transparent → frosted `backdrop-blur` on scroll): logo · How it works · For
Hospitals · Safety · [Get the app]

> Live nav for comparison: *The Problem · Patient Journey · Live Simulator · Business Analytics ·
> FAQ · Industries · Blog · About* + **[OJAO APP]** and **[Request Enterprise Demo]**. The live
> version is more complete — it exposes the simulator, the industry pages, and the blog, all of which
> the proposed nav hides. Keep `Industries` (a dropdown over the 4 vertical pages), `Blog`, and
> `About`, and keep the two-button pattern. Do not ship a nav that strands 12 indexed pages.

### Section 1 — Hero (Scene 1)
- Eyebrow: `Healthcare access, without the queue`
- **H1: `Your place in line, before you leave home.`**
- Sub: `ojao finds hospitals and clinics near you, holds your spot in the queue, and tells you when to leave. Spend the wait at home — not on a plastic chair.`
- Primary CTA: `Get the app` · Secondary (ghost): `For hospitals →`
- Below fold hint: an animated scroll cue plus three inline micro-stats
  (`{{TODO_STAT}}` placeholders, clearly marked — see §0 Blocker 4; do **not** reuse
  `300+ Clinics Live` / `98% Satisfaction` / `42m Avg. Time Saved` without a source).

> The live H1 is **`Waiting is not healthcare.`** — shorter, sharper, and it already carries brand
> equity and rankings. Consider keeping it as the H1 and demoting the line above to the subhead.
> If B2B-first wins (§0 Blocker 3), the whole hero changes: lead with the hospital outcome, and make
> *Request Enterprise Demo* primary and *Get the app* secondary.
> "verified" removed from the subhead per §1 Tier 3.

### Section 2 — The Problem (light, `--ojao-mist`)
Three-column tension setup, restrained type-only design with fine hairline rules:
- `You don't know which hospital is open, near, or right for you.`
- `You go anyway. Then you wait — for hours, standing, with no idea how long is left.`
- `Nobody tells you when it's your turn.`
Closing line, large: **`ojao fixes all three.`**

### Section 3 — How It Works (light, scroll-pinned 3-step)
1. **`Find`** — `Tap once. See hospitals and clinics near you, ordered by how far they actually are.`
2. **`Join`** — `Pick a department and take a token from where you are. No calls, no counter, no line.`
3. **`Walk in`** — `Watch your position update live. Get a notification the moment you're called.`

> Edited against §1: removed "verified" (no verification exists — Tier 3), "emergency availability up
> front" (Tier 2, unconfirmed), and "directions in one tap" (not implemented). Restore each word the
> moment its feature ships.

### Section 4 — Skip the Wait (dark, Scene 2)
- H2: `Watch the line move from your sofa.`
- Body: `Your token, your position, and your live wait — updated as the hospital calls each patient. When you're next, your phone tells you.`
- Feature chips: `Live queue position` · `Called-next alerts` · `Department-level tokens` · `Appointment booking`
  - `Video consults` — **only if §1 Tier 2 is confirmed launched.**

### Section 5 — ⚠️ Verified Only — CUT, or rewrite as roadmap
Gated by §1 Tier 3: hospital verification does not exist. Do not ship
`Every hospital on ojao is verified before you ever see it.` — it is not true today.

**Replace with "See it work" (dark), built around the live token simulator** (§0, and Scene 3's
substitute):
- H2: `Take a token right now, without a hospital.`
- Body: `Pick a department, issue yourself a virtual token, and watch the queue move exactly as a patient would see it.`
- The simulator itself is the section. Departments and indicative waits from the live site:
  `Radiology MRI ~12m` · `Cardiology Consult ~10m` · `Diagnostic Lab / Blood Draw ~4m`.
  Label sample data as sample data.

### Section 6 — Emergency (dark, tight, red used *only* here) — **conditional**
Ship only if the emergency-availability flag is confirmed live (§1 Tier 2). The directions claim is
cut regardless.
- H2: `When it can't wait.`
- Body: `Emergency availability is shown on every nearby result, so you're not calling around to find out who can take you. Call the hospital directly from the app.`

### Section 7 — For Hospitals (light, Scene 4) — the B2B pitch
**If B2B-first is confirmed (§0 Blocker 3), this section's content becomes the hero.**
- Eyebrow: `For hospitals & clinics`
- H2: `Run your front desk like a system, not a shouting match.`
- Body: `ojao gives your staff a live console to call, serve, and complete tokens across every department — plus the wait-time and throughput data to actually fix your bottlenecks.`
- Value cards: `Real-time queue console` · `Department management` · `Wait-time & throughput
  analytics` · `Walk-ins and appointments in one queue` · `No proprietary hardware` ·
  `Works alongside your EMR/HIS`
  - `Online payments` — only if §1 Tier 2 is confirmed launched.
- CTA: `Request an enterprise demo` → the demo form. Pricing is custom enterprise quotes
  (`Pricing depends on the number of departments, doctors, and locations`) — link `/pricing`, and
  keep its real answer that a **single-department pilot** is the recommended entry point. That pilot
  offer lowers buying risk and is the most persuasive thing on the live site; give it room.

### Section 8 — Trust & Privacy (light)
- H2: `We ask for your location once, and only when you tap.`
- Three points: location is requested only on an explicit "find near me" action and used for that
  search; exact coordinates aren't kept in ordinary logs; phone OTP sign-in with no password to leak.
- One line: `Built for India's DPDP Act 2023.` (Framing only — claim no certification.)
- **Pull the rest of this section's copy from the live `/security` page** — it is the best-written
  page on the site and already covers encryption in transit and at rest, role-based access with
  individually attributable staff accounts, retention with a deletion path, and "No data resale,
  ever." Link to `/security` for the full detail.
- 🔴 **Do not carry over "Fully HIPAA & GDPR Compliant" or "99.9% Integration SLA"** (§0 Blocker 2).

### Section 9 — FAQ (light, accordion)
Real accessible `<details>`-based or fully-keyboard accordion. The live site already has **6 Q&As
with valid `FAQPage` JSON-LD** — port those questions and keep the structured data. They cover: what
ojao is, whether patients must download an app, walk-in vs. scheduled patients, hardware
requirements, multi-department support, and data handling. Add from `/pricing` as needed: cost, the
single-department pilot, and how hospitals onboard.

### Section 10 — Final CTA + Footer (dark, Scene 5)
- H2: `Stop waiting. Start walking in.` (B2B alternative, already live and stronger for that
  audience: `Decongest Your Practice Today` / `Because waiting is not healthcare.`)
- **Google Play badge only** (inline SVG → `care.no2q.patient`). **There is no iOS app** — do not
  ship an App Store badge or a dead link. `{{TODO: App Store URL — only when iOS ships}}`.
- Footer: product / hospitals / company / legal columns; the live Solutions + Resources columns
  already map to these — preserve every link. Socials: `linkedin.com/company/ojao`,
  `instagram.com/ojao.care`, `twitter.com/ojao_care`. `© 2026 ojao Systems`. Privacy + Terms links.
- Keep the tagline **`Move Smarter, Live Better`**.
- Drop the live footer's `All regional care centers active` status line unless it reflects real
  monitoring — a hardcoded green status indicator is a trust liability, not a trust signal.

### Additional routes — **these already exist and are indexed. Port, do not replace.**
Real copy exists for all of them on the live site; reuse it rather than rewriting from scratch.
- `/about` — origin story + the two real founder bios (§0). Keep *"Built by founders who've sat in
  the waiting room too."*
- `/features` — patient + admin feature list. Reconcile against §1's three tiers before publishing.
- `/pricing` — enterprise-quote model, 3 FAQs, the single-department pilot offer.
- `/security` — port close to verbatim, minus the HIPAA/GDPR badge.
- `/blog` + the 4 existing posts — `hospital-queue-management-system-india-guide`,
  `how-to-choose-patient-flow-software`, `reducing-opd-wait-times`, `digital-token-vs-paper-queue`.
  These are the organic-search assets; losing them costs real traffic. No CMS needed — MDX or typed
  constants in `/content`.
- `/industries/hospitals`, `/industries/clinics`, `/industries/diagnostic-labs`,
  `/industries/radiology` — parallel vertical templates. Build one template, four content objects.
- `/solutions/hospital-queue-management-software-india` — SEO landing page.
- `/hospitals` — B2B onboarding form (client-side validated, posts to a stubbed `/api/contact` route
  handler that logs and returns 200). If this duplicates `/industries/hospitals`, pick one canonical
  URL and 301 the other; do not ship two pages competing for the same query.
- `/privacy` and `/terms` — clean, typographically excellent legal shells with a
  `{{TODO: legal copy}}` marker and a working table of contents. Note these do **not** exist on the
  live site today, yet it collects personal data through the demo form and runs an app — genuinely
  needed, and required by both Play Store policy and the DPDP Act.

---

## 6. ACCESSIBILITY & SEO (hard requirements, not nice-to-haves)

### 🔴 SEO migration requirements — these outrank every aesthetic goal in this brief

A redesign that loses the existing search footprint is a net negative no matter how it looks.

1. **Fix the canonical domain first** (§0 Blocker 1). Pick `ojao.in` or `ojao.care`. Whichever wins,
   `<link rel="canonical">`, `og:url`, and `sitemap.xml` must all point at it, and the loser must 301
   to it host-wide. Today all three point at an NXDOMAIN.
2. **Preserve all 16 live URLs.** Every route in §0's table either exists at the same path after the
   rebuild or 301s to its closest equivalent. Zero 404s. Diff your final route list against
   `sitemap.xml` and state the result in your §8 report.
3. **Keep the existing JSON-LD at parity or better.** Live already ships `FAQPage` (6 Q&As),
   `SoftwareApplication`, and `Offer`. Do not regress these while adding `Organization` and
   `MobileApplication`.
4. **Preserve prerendering.** Hero copy and stats are in the live raw HTML. A client-only SPA render
   would be a regression — verify with `curl` that key copy appears without JS.
5. **Keep the existing security headers** (`HSTS`, `X-Frame-Options: SAMEORIGIN`,
   `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) and the
   `robots.txt` content-signal directives.
6. Retarget internal links: several live pages link to `/#cta-section` — keep those anchors working
   or update every reference.

### Standard requirements

- Full keyboard operability; visible focus rings that survive the dark theme (cyan, 2px, offset).
- Every canvas is `aria-hidden` with the meaning carried in adjacent DOM text — decorative WebGL
  must never be the only source of information.
- Semantic landmarks, one `<h1>`, correct heading order, real `<button>`/`<a>` elements.
- All text ≥4.5:1 against its *actual rendered* backdrop, including over the hero canvas.
- `prefers-reduced-motion` fully honored (see §4).
- `next/metadata` per route: title, description, canonical, OpenGraph + Twitter cards.
  Generate a real OG image via `next/og` using Scene 1's poster and the H1. Keep the live meta
  description — it is well written and already ranking.
- JSON-LD: `Organization` + `MobileApplication` + `FAQPage` (plus the existing `SoftwareApplication`
  and `Offer`).
- `sitemap.ts`, `robots.ts`, correct `lang="en-IN"`.
- The simulator and mock console must be keyboard-operable and screen-reader-navigable. Announce
  token state changes via `aria-live="polite"` — an interactive demo that only works with a mouse
  excludes exactly the users a queue product should serve best.
- Lighthouse targets on mobile: **Performance ≥ 85, Accessibility 100, Best Practices ≥ 95,
  SEO 100.** Report the actual scores you achieve; if you miss one, say which and why.
  Baseline the *current* site first so you can prove the redesign improved things.

---

## 7. DELIVERABLES

```
app/
  layout.tsx  page.tsx  globals.css
  about/page.tsx        features/page.tsx     pricing/page.tsx
  security/page.tsx     hospitals/page.tsx
  privacy/page.tsx      terms/page.tsx
  blog/page.tsx         blog/[slug]/page.tsx        # 4 existing posts must survive
  industries/[slug]/page.tsx                        # hospitals, clinics, diagnostic-labs, radiology
  solutions/hospital-queue-management-software-india/page.tsx
  api/contact/route.ts
  opengraph-image.tsx   sitemap.ts   robots.ts
components/
  sections/       # one file per homepage section
  simulator/      # token simulator + mock enterprise console (ported, still interactive)
  three/          # Scene1Map, Scene2Tokens, Scene4Console, Scene5Pulse, Scene.tsx
                  # Scene3Shield only if verification ships — see §1 Tier 3
  three/shaders/  # *.glsl.ts with commented uniforms
  ui/             # Button, Nav, Footer, Accordion, Reveal, Marquee
lib/
  useReducedMotion.ts  usePerfTier.ts  cn.ts
content/
  copy.ts  faq.ts  features.ts  blog/  industries.ts   # typed constants, all copy lives here
public/posters/    # pre-rendered static fallback for each scene
PLACEHOLDERS.md    # every {{TODO}} in one list
CLAIMS.md          # every factual/statistical claim + its source, or "UNVERIFIED"
REDIRECTS.md       # old URL → new URL for all 16 live routes, with status codes
README.md          # run, build, deploy, and how to swap the 3D params
```

## 8. HOW TO WORK

1. **Resolve §0's five blockers with the owner before writing code.** The canonical domain, the
   HIPAA badge, the audience question, the unsourced stats, and the route inventory are all decisions
   you cannot make alone — and four of them are correctness issues, not preferences. Ask, then build.
2. Baseline the current site: Lighthouse scores, the full URL list from `sitemap.xml`, and a copy of
   every page's real text. You cannot prove an improvement you did not measure, and you cannot port
   copy you did not save.
3. Scaffold, install, and get `npm run build` green **before** writing any 3D.
4. Build the full page in DOM with poster images in the canvas slots — the reduced-motion version
   *is* the baseline. Confirm it's already beautiful and passes Lighthouse.
5. Port every existing route and its copy. Verify zero 404s against the baseline URL list.
6. Then implement scenes one at a time, in order 1 → 5, verifying fps and build after each.
7. Run `npx tsc --noEmit` and `npm run build` at the end. Fix everything. No `@ts-ignore`,
   no `any`, no unused files, no commented-out code.
8. Finish with a short report: what you built, actual Lighthouse numbers (before **and** after),
   measured fps per scene, the redirect map, the full placeholder list, every claim you removed or
   flagged, and anything you'd do differently with more time.

## 9. DO NOT

- Ship stock photography, generic gradient blobs, or a spinning torus knot.
- Use purple/violet, glassmorphism-everywhere, or neon that undermines medical credibility.
- Animate on scroll with `scroll` event listeners (use IntersectionObserver / drei `useScroll`).
- Put 3D behind body text where it hurts legibility.
- Let a canvas render off-screen.
- Invent numbers, testimonials, logos, or claims. Placeholders, always.
- **Inherit an unverified claim just because it is already live** — including `300+ Clinics Live`,
  `Fully HIPAA & GDPR Compliant`, and `99.9% Integration SLA`.
- **Market hospital verification, Google Maps directions, or any §1 Tier 3 feature.** They do not
  exist.
- **Delete or orphan any of the 16 live URLs.** Redirect or keep — never drop.
- Ship an App Store badge. There is no iOS app.
- Leave the canonical tag pointing at `ojao.care` while that domain does not resolve.
- Leave the site broken with JS disabled or WebGL unavailable.
