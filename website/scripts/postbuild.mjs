/**
 * Post-processes `next build` static export output.
 *
 * Next 16's static export writes React Server Component prefetch payloads as
 * nested directories:
 *
 *   out/about/__next.about/__PAGE__.txt
 *   out/industries/hospitals/__next.industries/$d$slug/__PAGE__.txt
 *
 * but the client requests them dot-separated and flat:
 *
 *   /about/__next.about.__PAGE__.txt
 *   /industries/hospitals/__next.industries.$d$slug.__PAGE__.txt
 *
 * The mismatch makes every <Link> prefetch 404. Navigation still works — it
 * falls back to a full document load — but the prefetch is wasted and the
 * console fills with errors, which buries real ones.
 *
 * Rather than encode this in nginx (where it would be invisible to anyone
 * reading the repo, and would need redoing on any other host), we write the
 * flat aliases the client actually asks for. Idempotent; safe to re-run.
 *
 * Usage: node scripts/postbuild.mjs [outDir]
 */
import { readdirSync, statSync, copyFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const outDir = process.argv[2] ?? "out";

/** Every file under dir, recursively. */
function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

const payloads = walk(outDir).filter((f) => f.endsWith("__PAGE__.txt"));

let written = 0;
for (const file of payloads) {
  const rel = relative(outDir, file).split(sep);

  // Find the `__next.*` segment; everything from there to the filename is the
  // part the client flattens with dots.
  const start = rel.findIndex((s) => s.startsWith("__next."));
  if (start === -1) continue;

  const routeDir = rel.slice(0, start);
  const flattened = rel.slice(start).join(".");
  const alias = join(outDir, ...routeDir, flattened);

  if (alias === file) continue;
  copyFileSync(file, alias);
  written++;
}

console.log(
  `postbuild: wrote ${written} flat RSC payload alias${written === 1 ? "" : "es"} ` +
    `for ${payloads.length} payload${payloads.length === 1 ? "" : "s"}`,
);
