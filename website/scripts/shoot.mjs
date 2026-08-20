// Screenshots the built site so the design can be reviewed visually.
// Usage: node scripts/shoot.mjs [baseUrl]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const outDir = "shots";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--enable-gpu", "--use-gl=angle", "--ignore-gpu-blocklist"],
});

const shots = [
  { name: "home-desktop", url: "/", w: 1440, h: 1000, full: true },
  { name: "home-mobile", url: "/", w: 390, h: 844, full: true },
  { name: "security", url: "/security", w: 1440, h: 1000, full: false },
  { name: "industries", url: "/industries/radiology", w: 1440, h: 1000, full: false },
  { name: "blogpost", url: "/blog/reducing-opd-wait-times", w: 1440, h: 1000, full: false },
  { name: "pricing", url: "/pricing", w: 1440, h: 1000, full: false },
];

for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(base + s.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForTimeout(1500);

  // Scroll through the page so IntersectionObserver-driven reveals fire.
  // A fullPage screenshot alone does not scroll, so reveals would stay hidden.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(1200);

  await page.screenshot({
    path: `${outDir}/${s.name}.png`,
    fullPage: s.full,
  });

  console.log(
    `${s.name}: shot${errors.length ? ` — ${errors.length} console error(s): ${errors.slice(0, 3).join(" | ").slice(0, 300)}` : " — clean"}`,
  );
  await ctx.close();
}

// Reduced-motion variant: the site must be beautiful with all motion off.
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await ctx.newPage();
await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${outDir}/home-reduced-motion.png`, fullPage: false });
console.log("home-reduced-motion: shot");

// Confirm no canvas is present under reduced motion.
const canvasCount = await page.locator("canvas").count();
console.log(`reduced-motion canvas count: ${canvasCount} (expect 0)`);
await ctx.close();


// Close-up crops for design review.
const crops = [
  { name: "crop-hero", url: "/", w: 1440, h: 900, clip: { x: 0, y: 0, width: 1440, height: 900 } },
  { name: "crop-tokens", url: "/", w: 1440, h: 900, scrollTo: 3400 },
  { name: "crop-simulator", url: "/", w: 1440, h: 900, scrollTo: 4300 },
];
for (const c of crops) {
  const cx = await browser.newContext({ viewport: { width: c.w, height: c.h } });
  const p = await cx.newPage();
  await p.goto(base + c.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForTimeout(1500);
  if (c.scrollTo) {
    await p.evaluate((y) => window.scrollTo(0, y), c.scrollTo);
    await p.waitForTimeout(2500);
  } else {
    await p.waitForTimeout(2500);
  }
  await p.screenshot({ path: `${outDir}/${c.name}.png` });
  console.log(`${c.name}: shot`);
  await cx.close();
}
await browser.close();
