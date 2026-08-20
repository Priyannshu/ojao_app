"use client";

import { SceneGate } from "./SceneGate";
import { PulsePoster } from "./Posters";

/**
 * Footer scene: one continuous ECG line with a light travelling along it at a
 * calm ~50 BPM. The site's last breath out.
 */
export function PulseScene() {
  return (
    <SceneGate
      className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-70"
      poster={<PulsePoster />}
      load={() => import("./PulseCanvas")}
      minWidth={640}
    />
  );
}
