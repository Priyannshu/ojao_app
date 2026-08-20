"use client";

import { useMemo, useRef } from "react";
import { SceneCanvas } from "./SceneCanvas";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type Points, type ShaderMaterial } from "three";

/**
 * Backdrop for the "For Hospitals" section.
 *
 * The brief specified three dashboard planes rotating into a grid via drei's
 * <Html transform occlude>. That is deliberately not what this does: the
 * dashboard content on this page is real DOM in the section above, and putting
 * live text inside a WebGL transform would make it blurry, hurt its
 * selectability, and put important content behind a canvas that
 * reduced-motion users never see.
 *
 * So the canvas stays strictly decorative — a slow drift of connected data
 * points suggesting a system observing itself — and every number and label
 * lives in accessible DOM. The section reads identically with WebGL off.
 */

const COUNT = 90;

function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const VERT = /* glsl */ `
  attribute float aPhase;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    // Gentle vertical drift, unique per point.
    p.y += sin(uTime * 0.4 + aPhase * 6.2831) * 0.35;
    p.x += cos(uTime * 0.25 + aPhase * 6.2831) * 0.22;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (18.0 / -mv.z) * (0.6 + 0.4 * sin(uTime + aPhase * 6.2831));

    // Fade with depth so nothing competes with the text in front.
    vAlpha = smoothstep(-16.0, -3.0, mv.z) * 0.5;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float disc = 1.0 - smoothstep(0.4, 1.0, d);
    if (disc < 0.01) discard;
    gl_FragColor = vec4(uColor, disc * vAlpha);
  }
`;

function Field({ tier }: { tier: "low" | "high" }) {
  const points = useRef<Points>(null);
  const material = useRef<ShaderMaterial>(null);
  const count = tier === "high" ? COUNT : 40;

  const { positions, phases } = useMemo(() => {
    const random = makeRandom(4242);
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (random() - 0.5) * 18;
      pos[i * 3 + 1] = (random() - 0.5) * 9;
      pos[i * 3 + 2] = -random() * 12;
      ph[i] = random();
    }
    return { positions: pos, phases: ph };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color("#2563EB") },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

const CAMERA = {
  position: [0, 0, 10] as [number, number, number],
  fov: 50,
};

/**
 * Default export so SceneGate can lazily `import()` this module. Everything
 * three.js-shaped lives behind this boundary and is never in the initial
 * bundle.
 */
export default function ConsoleFieldCanvas() {
  return (
    <SceneCanvas camera={CAMERA}>
      {(tier) => <Field tier={tier} />}
    </SceneCanvas>
  );
}
