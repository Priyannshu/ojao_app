"use client";

import { SceneGate } from "./SceneGate";
import { ConsolePoster } from "./Posters";

/**
 * Decorative backdrop for the "For Hospitals" section — a slow drift of
 * connected data points suggesting a system observing itself.
 *
 * Strictly decorative: every number and label in that section is real DOM, so
 * the section reads identically with WebGL off.
 */
export function ConsoleField() {
  return (
    <SceneGate
      className="pointer-events-none absolute inset-0 -z-1 opacity-70"
      poster={<ConsolePoster />}
      load={() => import("./ConsoleFieldCanvas")}
      minWidth={768}
    />
  );
}
