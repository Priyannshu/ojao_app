// Scans rendered HTML for claims that must never appear on the site.
// Run against a built + running server: node scripts/check-claims.mjs
const BANNED = [
  "300+", "98%", "42m", "4.95", "5,740", "8,680", "78.1%",
  "HIPAA", "GDPR", "99.9%", "45% lobby", "88% On-time", "-22m",
  "+15 Daily", "18% Appointment", "94% Patient", "124 minute",
  "regional care centers active", "Registered Trademark",
  "Avg. Time Saved", "Clinics Live", "Satisfaction Index",
  // Features that do not exist — must not be marketed.
  "verified hospital", "only approved", "Get Directions",
  "video consult", "online payment",
];

const ROUTES = [
  "/", "/about", "/features", "/pricing", "/security", "/blog",
  "/blog/hospital-queue-management-system-india-guide",
  "/blog/how-to-choose-patient-flow-software",
  "/blog/reducing-opd-wait-times",
  "/blog/digital-token-vs-paper-queue",
  "/industries/hospitals", "/industries/clinics",
  "/industries/diagnostic-labs", "/industries/radiology",
  "/solutions/hospital-queue-management-software-india",
  "/hospitals", "/privacy", "/terms",
];

const base = process.argv[2] ?? "http://localhost:3000";
let failures = 0;
let missing = 0;

for (const route of ROUTES) {
  let res, html;
  try {
    res = await fetch(base + route);
    html = await res.text();
  } catch (e) {
    console.log(`✗ ${route} — fetch failed: ${e.message}`);
    missing++;
    continue;
  }

  if (!res.ok) {
    console.log(`✗ ${route} — HTTP ${res.status}`);
    missing++;
    continue;
  }

  const lower = html.toLowerCase();
  const hits = BANNED.filter((b) => lower.includes(b.toLowerCase()));
  if (hits.length > 0) {
    console.log(`✗ ${route} — LEAKED: ${hits.join(", ")}`);
    failures += hits.length;
  } else {
    console.log(`✓ ${route} (${res.status})`);
  }
}

console.log(
  `\n${failures === 0 && missing === 0 ? "PASS" : "FAIL"} — ${failures} claim leak(s), ${missing} unreachable route(s)`,
);
process.exit(failures === 0 && missing === 0 ? 0 : 1);
