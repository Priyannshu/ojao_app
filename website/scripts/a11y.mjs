// Runs axe-core against every route and reports violations.
// Usage: node scripts/a11y.mjs [baseUrl]
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");
const axeSource = readFileSync(axePath, "utf8");

const ROUTES = [
  "/", "/about", "/features", "/pricing", "/security", "/blog",
  "/blog/reducing-opd-wait-times",
  "/industries/hospitals",
  "/solutions/hospital-queue-management-software-india",
  "/privacy", "/terms",
];

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome" });
let totalViolations = 0;

for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1200);

  // Reveal everything and kill transitions, so axe measures final colours
  // rather than a mid-fade blend (which produces phantom contrast failures).
  await page.addStyleTag({
    content: `*,*::before,*::after{transition:none!important;animation:none!important}`,
  });
  await page.waitForTimeout(500);

  await page.addScriptTag({ content: axeSource });
  const results = await page.evaluate(async () => {
    // @ts-expect-error injected global
    return await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
  });

  const v = results.violations;
  totalViolations += v.length;
  if (v.length === 0) {
    console.log(`✓ ${route} — no violations`);
  } else {
    console.log(`✗ ${route} — ${v.length} violation type(s)`);
    for (const item of v) {
      console.log(`    [${item.impact}] ${item.id}: ${item.help}`);
      item.nodes.slice(0, 3).forEach((n) => {
        console.log(`        ${n.target.join(" ")}`);
        if (n.any?.[0]?.message) console.log(`        → ${n.any[0].message}`);
      });
    }
  }
  await ctx.close();
}

console.log(`\n${totalViolations === 0 ? "PASS" : "FAIL"} — ${totalViolations} violation type(s) across ${ROUTES.length} routes`);
await browser.close();
process.exit(totalViolations === 0 ? 0 : 1);
