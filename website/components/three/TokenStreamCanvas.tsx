"use client";

import { useMemo, useRef } from "react";
import { SceneCanvas } from "./SceneCanvas";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Vector3, type Group } from "three";

/**
 * "Skip the Wait" backdrop: translucent token-card silhouettes drifting along a
 * gentle S-curve, lit from the front.
 *
 * Two deliberate departures from the original brief:
 *
 * 1. No drei <Text>. It loads a font over the network, which the site's CSP
 *    (`connect-src 'self'`) blocks — the component then suspends forever and
 *    the whole scene renders empty. Rather than loosen the CSP or ship a font
 *    just for WebGL, the token numbers live in real DOM alongside this canvas.
 *    That is also the accessible answer: the canvas is aria-hidden, so any
 *    information inside it would be invisible to a screen reader.
 *
 * 2. No MeshTransmissionMaterial. It renders the scene to an offscreen buffer
 *    per mesh; at eight cards that blew the frame budget on mid-range hardware
 *    for an effect nearly indistinguishable from a low-roughness physical
 *    material at this scale.
 */

const CARD_COUNT = 8;
const ADVANCE_SECONDS = 2.2;

const PATH = new CatmullRomCurve3(
  [
    new Vector3(-7.5, -0.7, -2.4),
    new Vector3(-3.8, 0.35, -0.6),
    new Vector3(0, -0.2, 0.5),
    new Vector3(3.8, 0.4, -0.6),
    new Vector3(7.5, -0.6, -2.4),
  ],
  false,
  "catmullrom",
  0.4,
);

const scratch = new Vector3();
const tangent = new Vector3();

function Cards() {
  const group = useRef<Group>(null);
  const cards = useRef<Array<Group | null>>([]);
  const slots = useMemo(
    () => Array.from({ length: CARD_COUNT }, (_, i) => i),
    [],
  );

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;
    const advance = (elapsed / ADVANCE_SECONDS) % CARD_COUNT;

    for (let i = 0; i < CARD_COUNT; i++) {
      const card = cards.current[i];
      if (!card) continue;

      const slot = (i - advance + CARD_COUNT) % CARD_COUNT;
      const t = slot / CARD_COUNT;

      PATH.getPointAt(t, scratch);
      card.position.copy(scratch);

      PATH.getTangentAt(t, tangent);
      card.rotation.y = Math.atan2(tangent.x, tangent.z) - Math.PI / 2;

      // Fade in at the tail and out at the head so the loop seam is invisible.
      const edge = Math.min(t, 1 - t);
      const fade = Math.min(edge / 0.14, 1);
      card.scale.setScalar(0.7 + fade * 0.3);

      // Lift the front of the line.
      if (slot < 1) card.position.y += 0.3;
      else if (slot < 2) card.position.y += 0.15;
    }

    if (group.current) {
      group.current.rotation.y = Math.sin(elapsed * 0.09) * 0.045;
    }
  });

  return (
    <group ref={group}>
      {slots.map((i) => (
        <group
          key={i}
          ref={(el) => {
            cards.current[i] = el;
          }}
        >
          <mesh>
            <boxGeometry args={[0.95, 1.4, 0.05]} />
            <meshPhysicalMaterial
              color="#1e2b45"
              roughness={0.25}
              metalness={0.1}
              transparent
              opacity={0.22}
              reflectivity={0.4}
            />
          </mesh>
          {/* Faint cyan rim so the silhouettes read as depth behind the real
              queue, not as a second row of cards competing with it. */}
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[0.99, 1.44]} />
            <meshBasicMaterial
              color="#0EA5E9"
              transparent
              opacity={0.04}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 4, 5]} intensity={2} color="#dbeafe" />
      <pointLight
        position={[0, 0.5, 3]}
        intensity={3}
        color="#0EA5E9"
        distance={14}
      />
    </group>
  );
}

const CAMERA = {
  position: [0, 0.4, 5.2] as [number, number, number],
  fov: 46,
};

/**
 * Default export so SceneGate can lazily `import()` this module. Everything
 * three.js-shaped lives behind this boundary and is never in the initial
 * bundle.
 */
export default function TokenStreamCanvas() {
  return (
    <SceneCanvas camera={CAMERA}>
      {() => <Cards />}
    </SceneCanvas>
  );
}
