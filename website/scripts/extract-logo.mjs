/**
 * One-off: extracts the ojao logo from the source PNG into a web asset.
 *
 * The source (`ojao_logo.png`) is 1254x1254 with the mark occupying only
 * 1081x316 of it, and it is pure black with an alpha channel. Two problems for
 * web use: most of the file is empty padding, and black-on-transparent is
 * invisible on the site's dark sections.
 *
 * So this crops to the ink bounds and writes a **greyscale-alpha** PNG. The
 * logo is then rendered as a CSS mask with `background: currentColor`, which
 * means one asset works on light and dark backgrounds and inherits text colour
 * — no second file, no invert filter, no hardcoded hex.
 *
 * Run: node scripts/extract-logo.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

const SRC = "C:/startup/ojao_app/ojao_logo.png";
const OUT = "public/ojao-logo-mask.png";

/** Target width. 3x the largest on-screen use (~160px) keeps strokes crisp. */
const TARGET_W = 480;

const src = PNG.sync.read(readFileSync(SRC));

// --- 1. Find the ink bounding box -------------------------------------------
// "Ink" is any pixel that is both opaque enough to see and dark enough to be
// part of the mark.
let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
for (let y = 0; y < src.height; y++) {
  for (let x = 0; x < src.width; x++) {
    const i = (src.width * y + x) << 2;
    const opaque = src.data[i + 3] > 16;
    const dark = src.data[i] < 200;
    if (opaque && dark) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;
const scale = TARGET_W / cropW;
const outW = TARGET_W;
const outH = Math.round(cropH * scale);

console.log(`source   ${src.width}x${src.height}`);
console.log(`ink bbox ${cropW}x${cropH} at (${minX},${minY})`);
console.log(`output   ${outW}x${outH}`);

// --- 2. Build coverage map, then box-filter down ----------------------------
// Coverage is "how much ink is here", combining darkness and alpha, so
// antialiased edges in the source survive the downscale as soft edges rather
// than hardening into jaggies.
const coverage = new Float64Array(cropW * cropH);
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const i = (src.width * (y + minY) + (x + minX)) << 2;
    const alpha = src.data[i + 3] / 255;
    const darkness = 1 - src.data[i] / 255;
    coverage[y * cropW + x] = alpha * darkness;
  }
}

const out = new PNG({ width: outW, height: outH });
const sx = cropW / outW;
const sy = cropH / outH;

for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    // Average every source pixel that maps into this destination pixel.
    const x0 = Math.floor(x * sx);
    const x1 = Math.min(cropW, Math.ceil((x + 1) * sx));
    const y0 = Math.floor(y * sy);
    const y1 = Math.min(cropH, Math.ceil((y + 1) * sy));

    let sum = 0;
    let n = 0;
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        sum += coverage[yy * cropW + xx];
        n++;
      }
    }
    const v = n > 0 ? sum / n : 0;
    const a = Math.round(Math.min(1, v) * 255);

    // White pixels, coverage in alpha: the shape lives entirely in the alpha
    // channel so it can be used as a CSS mask.
    const i = (outW * y + x) << 2;
    out.data[i] = 255;
    out.data[i + 1] = 255;
    out.data[i + 2] = 255;
    out.data[i + 3] = a;
  }
}

writeFileSync(OUT, PNG.sync.write(out, { colorType: 4 }));

const bytes = readFileSync(OUT).length;
console.log(`wrote ${OUT} (${(bytes / 1024).toFixed(1)} KB)`);
console.log(`aspect ratio ${(outW / outH).toFixed(4)} — use for CSS sizing`);
