"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks `prefers-reduced-motion: reduce`.
 *
 * Uses `useSyncExternalStore` rather than useEffect + setState: a media query
 * is exactly the "external store" that API exists for, and it avoids the
 * cascading re-render that setting state inside an effect causes.
 *
 * The server snapshot is `true`, so server-rendered markup and first paint are
 * always the motion-free variant. Motion is opt-in once the client confirms the
 * user has not asked for less of it.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return true;
}
