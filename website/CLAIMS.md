# CLAIMS.md

Every factual, statistical, and compliance claim that appeared on the live
`ojao.in`, and what happened to it in this rebuild.

Verified against the live site on **2026-08-15**. The owner confirmed on the
same date that the headline statistics are **not real**.

---

## 🔴 Removed — fabricated statistics

The owner confirmed these numbers are not real. They are not reproduced
anywhere in the new site, and `scripts/check-claims.mjs` fails the build-time
check if any of them reappear.

| Claim | Where it was live |
|---|---|
| `42m` Avg. Time Saved | Homepage hero stat strip |
| `98%` Satisfaction | Homepage hero stat strip |
| `300+` Clinics Live | Homepage hero stat strip |
| `-45% Crowding` (lobby reduction) | Homepage hero |
| `124 minutes` average patient turnaround | "Patient Care Flow Paradox" |
| `18%` Appointment Cancellation Rate | Clinics tab |
| `94%` Patient Recommendation Score | Clinics tab |
| `8,680+` patients served (7 days), `+8.2% vs prev week` | Enterprise Console |
| `78.1%` average hold reduction, `-58m per visit saved` | Enterprise Console |
| `4.95/5` satisfaction from `5,740 feedbacks` | Enterprise Console |
| `Traditional Hold (Average: 68m)` vs `ojao Hold (Average: 4.2m)` | Console chart |
| `45% lobby capacity relief` | Hospitals segment card |
| `+15 Daily appointments / GP` | Clinics segment card |
| `88% On-time draws achieved` | Labs segment card |
| `-22m patient dress delay` | Radiology segment card |
| `42-Minute Wait Reduction` | Final CTA |

**Why this matters commercially, not just ethically:** `300+ Clinics Live` is
the kind of claim a hospital procurement team will ask for references against.
For a two-person team with no disclosed customers, being unable to produce them
loses the deal and the credibility behind it.

**What replaced them:** qualitative benefit statements that are true without a
dataset — e.g. "Patients spend the wait productively outside the clinic walls"
instead of "42-Minute Wait Reduction". If real figures become available, they
belong here with a source, and can then be added to the copy.

## 🔴 Removed — compliance claims

| Claim | Where | Why removed |
|---|---|---|
| **"Fully HIPAA & GDPR Compliant"** | Homepage, `/about`, `/security` | HIPAA is a US statute governing US covered entities and their business associates. It does not apply to an Indian OPD queue tool, and asserting compliance with a regime you are not subject to (and have not been audited against) is a material misrepresentation to enterprise buyers. Nothing on the site supported the GDPR half either. |
| **"99.9% Integration SLA"** | Homepage, `/about`, `/security` | No SLA is contracted. An uptime figure published on a marketing site can be read as a commitment. |
| **"Registered Trademark"** | Footer, all pages | Unverified. Removed pending proof of registration; re-add with the registration number if it exists. |
| **"All regional care centers active"** | Footer status line, all pages | A hardcoded green status indicator with no monitoring behind it. A fake status light is a trust liability, not a trust signal. |

The live `/security` page already framed this correctly — *"Built with India's
DPDP Act 2023 in mind"*, described as designed-around-principles rather than
certified. That framing is what the new site uses everywhere, and the
contradicting badge is gone.

## 🔴 Not marketed — features that do not exist

Verified against the app source and `ARCHITECTURE.md` §9.

| Feature | Status | Consequence |
|---|---|---|
| **Hospital verification** | No verification workflow, no review dashboard, no application/document model in the source tree | The claim "only approved, active facilities are ever shown to patients" is **not true today**. The planned "Verified Only" section and its Three.js "Trust Object" scene were both **cut**. A verification badge you cannot back is the most dangerous single thing to put on a healthcare site. |
| **Google Maps directions** | Not implemented | "Tap once for directions" removed from all copy. |
| **Video consultation** | Code exists (`video_consult_screen.dart`) but owner confirmed **not launched** | Omitted entirely. |
| **Online payments (Razorpay)** | Code exists (`payment_service.dart`, `functions/index.js`) but owner confirmed **not launched** | Omitted entirely. |
| **Emergency-availability flag** | Owner confirmed **not launched** | The planned "Emergency" section was cut. |
| **Server-side nearby search** | Distance is computed client-side from Firestore, not PostGIS | Copy says "sorted by distance", never "verified coordinates". |

Restore each of these the moment the corresponding feature actually ships.

---

## ✅ Kept — verified true

| Claim | Source |
|---|---|
| Cloud-based digital patient flow & queue management for hospitals, clinics, diagnostic labs, radiology centres | Product description, matches the app |
| Replaces paper tokens with a live, trackable digital queue | Core shipped feature |
| Patients can track from a mobile browser via SMS or QR link; app not required | Live FAQ, consistent with the app |
| Walk-ins and scheduled appointments merge into one ordered queue per doctor | Live FAQ + shipped feature |
| No proprietary kiosk hardware required — runs on existing devices | Live FAQ; a genuine objection-killer |
| Each department/doctor gets its own queue with one unified admin dashboard | Live FAQ + shipped staff console |
| Only minimum queue data stored; no clinical records | `/security`, consistent with the data model |
| Encryption in transit and at rest | `/security` |
| Role-based access, individually attributable staff accounts | `/security` |
| Retention limited, deletion available on request | `/security` |
| No data resale | `/security` |
| Built around DPDP Act 2023 principles (**not** certified) | `/security` |
| Custom enterprise pricing by departments / doctors / locations | `/pricing` |
| Single-department pilot recommended before full rollout | `/pricing` — the most persuasive offer on the site |
| Founders: Subham Ojha (Co-Founder & CEO), Priyanshu Ojha (Co-Founder & CTO) | Real people, real bios, real LinkedIn profiles |
| Tagline "Move Smarter, Live Better" | Live brand line |
| `© 2026 ojao Systems` | Live footer |
| Android app at `care.no2q.patient` | Verified Play Store listing |

## ✅ Kept — sourced third-party claims in blog posts

The four blog posts cite real literature. All citations preserved verbatim:

- **Maister, D.H. (1984)**, *The Psychology of Waiting Lines*, Harvard Business
  School Working Paper — used for the "uncertainty is worse than the wait"
  argument in two posts. Correctly attributed.
- **World Health Organization (2015)**, *People-Centred and Integrated Health
  Services*, WHO/HIS/SDS/2015.7.
- **NHS Institute for Innovation and Improvement (2013)**, *Improving Patient
  Flow*.
- **Ministry of Electronics and IT, Government of India (2023)**, *The Digital
  Personal Data Protection Act, 2023*.
- **Ministry of Health & Family Welfare (2022)**, *Ayushman Bharat Digital
  Mission: Operational Guidelines* — supports the ABHA adoption claim.

These are the site's only quantitative-adjacent claims that survive, and they
are attributed to named external sources rather than presented as ojao's own
performance data.

## ⚠️ Labelled — illustrative interface data

Sample data is fine when it is *labelled* as sample data. Each of these carries
visible text saying so:

| Element | Label shown |
|---|---|
| Hero device mock (`TKN-408`, Radiology / MRI, 3 patients ahead) | "Sample interface. Not live facility data." |
| Token queue strip (`A-12`…`A-17`) | "Illustrative queue states. Sample token numbers." |
| Interactive simulator | "Sample data for demonstration. No information is sent anywhere and nothing is stored." |
| Simulator department rates (MRI ~12m, Cardiology ~10m, Lab ~4m) | Shown inside the picker as indicative per-patient rates |

The live site's Enterprise Console carried a "Simulated aggregate across
Radiology & Labs" disclaimer on its chart but presented the hero stats as fact.
The new site does not present any performance figure as fact.

---

## How this is enforced

`scripts/check-claims.mjs` fetches every route and fails if any removed claim
string reappears in the rendered HTML. Run it against a built server:

```bash
npm run build && npm run start
node scripts/check-claims.mjs
```

Current result: **0 leaks across 18 routes.**
