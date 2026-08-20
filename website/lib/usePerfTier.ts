"use client";

import { useSyncExternalStore } from "react";

export type PerfTier = "none" | "low" | "high";

/**
 * Decides how much 3D a device should be asked to do.
 *
 *  - "none": no WebGL context available → posters only.
 *  - "low":  small viewport, few cores, or coarse pointer → reduced instance
 *            counts and no antialiasing.
 *  - "high": full scenes.
 *
 * The server snapshot is "none", so server-rendered markup and first paint are
 * the poster fallback; the real tier resolves on the client.
 *
 * `useSyncExternalStore` rather than useEffect + setState: capability is
 * external state, and this avoids a cascading render per scene.
 */
export function usePerfTier(): PerfTier {
  return useSyncExternalStore(subscribe, resolveTier, getServerSnapshot);
}

/** Capability does not change mid-session, so there is nothing to subscribe to. */
function subscribe(): () => void {
  return () => {};
}

function getServerSnapshot(): PerfTier {
  return "none";
}

/**
 * Cached, and must stay cached: useSyncExternalStore calls the snapshot on
 * every render and requires a stable value, so recomputing here would loop.
 * Caching also avoids creating a probe canvas once per scene.
 */
let cachedTier: PerfTier | null = null;

function resolveTier(): PerfTier {
  if (cachedTier !== null) return cachedTier;

  if (!hasWebGL()) {
    cachedTier = "none";
    return cachedTier;
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const smallViewport = window.innerWidth < 768;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  cachedTier = cores <= 4 || smallViewport || coarsePointer ? "low" : "high";
  return cachedTier;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    // Release the probe context immediately — browsers cap live WebGL
    // contexts, and the real scenes need those slots.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}
