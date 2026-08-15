"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import { usePerfTier, type PerfTier } from "@/lib/usePerfTier";

type Props = {
  children: (tier: Exclude<PerfTier, "none">) => ReactNode;
  camera?: { position: [number, number, number]; fov: number };
};

/**
 * The <Canvas> host. Lives inside the lazily-loaded scene chunk, so importing
 * this file pulls in three/fiber — which is exactly why nothing outside
 * components/three/*Canvas.tsx should import it.
 *
 * Reduced-motion, WebGL support, and viewport gating are all handled upstream
 * by SceneGate; by the time this mounts, we already know 3D should run.
 * What is left here is the per-frame cost controls:
 *
 *  - DPR clamped so high-density displays don't quietly quadruple fragments.
 *  - frameloop flips to "never" when scrolled out of view, so an off-screen
 *    scene costs nothing at all.
 */
export function SceneCanvas({
  children,
  camera = { position: [0, 0, 6], fov: 45 },
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const tier = usePerfTier();

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "150px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (tier === "none") return null;

  return (
    <div ref={host} className="absolute inset-0">
      <Canvas
        aria-hidden="true"
        className="absolute inset-0"
        dpr={[1, tier === "low" ? 1.35 : 1.75]}
        camera={camera}
        frameloop={visible ? "always" : "never"}
        gl={{
          antialias: tier === "high",
          powerPreference: "high-performance",
          alpha: true,
        }}
      >
        <Suspense fallback={null}>{children(tier)}</Suspense>
      </Canvas>
    </div>
  );
}
