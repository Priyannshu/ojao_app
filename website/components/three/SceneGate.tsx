"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { usePerfTier } from "@/lib/usePerfTier";

/**
 * Gate in front of every WebGL scene.
 *
 * Three.js is a large parse cost. Loading it eagerly costs roughly 25
 * Lighthouse performance points on mobile through Total Blocking Time — for
 * decoration the user has not asked for. So:
 *
 *  1. The poster renders immediately, server-side, in the initial HTML.
 *  2. We decide whether this device should run 3D at all (reduced motion,
 *     WebGL support, viewport width).
 *  3. Only then, and only once the browser is idle, is the scene chunk
 *     fetched. None of the 3D is in the critical path.
 *
 * Identical visuals on capable devices, no main-thread cost on slow ones, and
 * the poster is a genuine fallback rather than a placeholder.
 */

type Props = {
  /** Loader for the canvas chunk. Must be a literal `() => import(...)`. */
  load: () => Promise<{ default: React.ComponentType }>;
  poster: ReactNode;
  className?: string;
  /** Skip 3D entirely below this viewport width. */
  minWidth?: number;
};

export function SceneGate({ load, poster, className, minWidth = 0 }: Props) {
  const reduced = useReducedMotion();
  const tier = usePerfTier();
  const host = useRef<HTMLDivElement>(null);
  const [idle, setIdle] = useState(false);
  const [near, setNear] = useState(false);
  const [wideEnough, setWideEnough] = useState(true);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (minWidth <= 0) return;
    const check = () => setWideEnough(window.innerWidth >= minWidth);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, [minWidth]);

  // Wait for idle so the scene chunk never competes with hydration.
  useEffect(() => {
    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      const handle = ric(() => setIdle(true), { timeout: 2500 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const t = setTimeout(() => setIdle(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // Only mount a scene the user is actually approaching. Without this, the
  // footer's canvas compiles shaders and takes a WebGL context while it is
  // still ten thousand pixels below the fold.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shouldLoad =
    idle && near && !reduced && tier !== "none" && wideEnough;

  return (
    <div ref={host} className={className ?? "absolute inset-0"}>
      {/* Fades out once the canvas has painted — leaving it visible would
          double-expose the scene, since the canvas is transparent wherever
          nothing is drawn. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-700 ${
          painted ? "opacity-0" : "opacity-100"
        }`}
      >
        {poster}
      </div>
      {shouldLoad && <LazyScene load={load} onPainted={() => setPainted(true)} />}
    </div>
  );
}

function LazyScene({
  load,
  onPainted,
}: {
  load: Props["load"];
  onPainted: () => void;
}) {
  const [Comp, setComp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let alive = true;
    load()
      .then((m) => {
        if (alive) setComp(() => m.default);
      })
      .catch(() => {
        // Chunk failed to load. The poster is already on screen, so there is
        // nothing to recover and nothing worth telling the user.
      });
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    if (Comp) requestAnimationFrame(() => requestAnimationFrame(onPainted));
  }, [Comp, onPainted]);

  return Comp ? <Comp /> : null;
}
