"use client";

import { useRef } from "react";
import { SceneCanvas } from "./SceneCanvas";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Vector3, type Mesh, type PointLight } from "three";

/**
 * Footer scene: one continuous ECG line with a light travelling along it.
 * Calm — roughly 50 BPM. The site's last breath out.
 */

/** A single heartbeat cycle: flat baseline, P wave, QRS spike, T wave. */
const CURVE = new CatmullRomCurve3(
  [
    [-9, 0, 0],
    [-6, 0, 0],
    [-4.2, 0, 0],
    [-3.6, 0.22, 0],
    [-3.1, 0, 0],
    [-2.6, -0.16, 0],
    [-2.3, 1.5, 0],
    [-2.0, -0.62, 0],
    [-1.7, 0, 0],
    [-0.9, 0.42, 0],
    [-0.2, 0, 0],
    [2.0, 0, 0],
    [3.4, 0.2, 0],
    [4.0, 0, 0],
    [6.5, 0, 0],
    [9, 0, 0],
  ].map(([x, y, z]) => new Vector3(x, y, z)),
  false,
  "catmullrom",
  0.28,
);

const BEAT_SECONDS = 1.2;
const travelPoint = new Vector3();

function Pulse({ tier }: { tier: "low" | "high" }) {
  const light = useRef<PointLight>(null);
  const dot = useRef<Mesh>(null);

  const segments = tier === "high" ? 380 : 190;
  const radialSegments = tier === "high" ? 8 : 5;

  useFrame(({ clock }) => {
    // Ease the traveling point so it lingers at the baseline and snaps
    // through the QRS spike, the way a real trace reads.
    const t = (clock.elapsedTime % BEAT_SECONDS) / BEAT_SECONDS;
    CURVE.getPointAt(t, travelPoint);

    if (dot.current) dot.current.position.copy(travelPoint);
    if (light.current) {
      light.current.position.copy(travelPoint);
      // Brighten as it crosses the spike.
      const nearSpike = 1 - Math.min(Math.abs(t - 0.38) / 0.09, 1);
      light.current.intensity = 1.4 + nearSpike * 5.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <tubeGeometry args={[CURVE, segments, 0.022, radialSegments, false]} />
        <meshBasicMaterial color="#0EA5E9" toneMapped={false} />
      </mesh>

      <mesh ref={dot}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
      </mesh>

      <pointLight ref={light} color="#0EA5E9" distance={4.5} intensity={2} />
    </group>
  );
}

const CAMERA = {
  position: [0, 0, 7.5] as [number, number, number],
  fov: 38,
};

/**
 * Default export so SceneGate can lazily `import()` this module. Everything
 * three.js-shaped lives behind this boundary and is never in the initial
 * bundle.
 */
export default function PulseCanvas() {
  return (
    <SceneCanvas camera={CAMERA}>
      {(tier) => <Pulse tier={tier} />}
    </SceneCanvas>
  );
}
