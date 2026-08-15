// Screenshots each canvas element in isolation, then measures how much of the
// capture is non-background. Element screenshots capture composited output, so
// unlike getImageData they work without preserveDrawingBuffer.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { PNG } from "pngjs";

const base = process.argv[2] ?? "http://localhost:3000";
mkdirSync("shots/diag", { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

const count = await page.locator("canvas").count();
console.log(`canvases: ${count}`);

for (let i = 0; i < count; i++) {
  const el = page.locator("canvas").nth(i);
  await el.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(2500);

  const path = `shots/diag/canvas-${i}.png`;
  try {
    await el.screenshot({ path });
  } catch (e) {
    console.log(`  [${i}] screenshot failed: ${e.message.slice(0, 80)}`);
    continue;
  }

  // Measure pixels meaningfully brighter than the page background (#0b1120,
  // channel sum 60). A threshold below that reports an empty canvas as full.
  const png = PNG.sync.read(readFileSync(path));
  let lit = 0;
  const total = png.width * png.height;
  for (let p = 0; p < png.data.length; p += 4) {
    const sum = png.data[p] + png.data[p + 1] + png.data[p + 2];
    if (sum > 110 && png.data[p + 3] > 10) lit++;
  }
  console.log(
    `  [${i}] ${png.width}x${png.height} — ${((lit / total) * 100).toFixed(2)}% lit`,
  );
}

await browser.close();
