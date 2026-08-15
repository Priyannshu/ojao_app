"use client";

import { useEffect, useMemo, useRef } from "react";
import { SceneCanvas } from "./SceneCanvas";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  Matrix4,
  QuadraticBezierCurve3,
  Vector2,
  Vector3,
  type InstancedMesh,
  type Mesh,
  type ShaderMaterial,
} from "three";
import {
  ARC_FRAG,
  ARC_VERT,
  GRID_FRAG,
  GRID_VERT,
  NODE_FRAG,
  NODE_VERT,
  RING_FRAG,
  RING_VERT,
} from "./shaders/map.glsl";

/**
 * Hero scene: "The Living Map".
 *
 * An abstract city at night, seen at a low oblique angle. Hospital nodes
 * breathe, the user marker emits expanding search-radius rings, and arcs
 * connect the marker to its nearest nodes — which is, literally, what the
 * app's nearby search does.
 *
 * Everything repeated is instanced and animated in the vertex shader, so the
 * whole scene is a handful of draw calls and no per-frame JS allocation.
 */

const NODE_COUNT_HIGH = 180;
const NODE_COUNT_LOW = 70;
const ARC_COUNT = 6;

/* Hoisted scratch objects — nothing is allocated inside useFrame. */
const scratchMatrix = new Matrix4();
const scratchPos = new Vector3();
const pointerTarget = new Vector2();

/** Deterministic PRNG so the layout is identical on every render and reload. */
function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

type NodeLayout = {
  positions: Float32Array;
  phases: Float32Array;
  tints: Float32Array;
  nearest: Vector3[];
};

function buildLayout(count: number): NodeLayout {
  const random = makeRandom(20260815);
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const tints = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Cluster toward the centre so it reads as a city rather than noise:
    // sqrt() biases samples inward, and a little jitter breaks up the ring.
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 11 + random() * 0.6;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = random() * 0.5; // slight height variation
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    phases[i] = random();
    tints[i] = random();
  }

  // The arcs connect to a handful of the closest nodes, excluding any that sit
  // almost on top of the marker (an arc with no length reads as a smudge).
  const candidates: Array<{ v: Vector3; d: number }> = [];
  for (let i = 0; i < count; i++) {
    const v = new Vector3(
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2],
    );
    const d = v.length();
    if (d > 1.8) candidates.push({ v, d });
  }
  candidates.sort((a, b) => a.d - b.d);
  const nearest = candidates.slice(0, ARC_COUNT).map((c) => c.v);

  return { positions, phases, tints, nearest };
}

function Nodes({ layout, count }: { layout: NodeLayout; count: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(999, 999) },
    }),
    [],
  );

  // Write instance transforms once. After this the GPU owns the animation.
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;

    for (let i = 0; i < count; i++) {
      scratchPos.set(
        layout.positions[i * 3],
        layout.positions[i * 3 + 1],
        layout.positions[i * 3 + 2],
      );
      scratchMatrix.makeTranslation(scratchPos.x, scratchPos.y, scratchPos.z);
      m.setMatrixAt(i, scratchMatrix);
    }
    m.instanceMatrix.needsUpdate = true;

    m.geometry.setAttribute(
      "aPhase",
      new InstancedBufferAttribute(layout.phases.slice(0, count), 1),
    );
    m.geometry.setAttribute(
      "aTint",
      new InstancedBufferAttribute(layout.tints.slice(0, count), 1),
    );
  }, [layout, count]);

  // Pointer → world XZ, damped. Tracked on the window rather than via R3F
  // raycasting so it costs nothing per frame.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / size.width) * 2 - 1;
      const ny = -(e.clientY / size.height) * 2 + 1;
      // Rough unprojection onto the ground plane; precision isn't important
      // for a proximity glow.
      pointerTarget.set(nx * 12, ny * -9);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value += delta;

    // Lerp toward the pointer so the glow trails it rather than snapping.
    const current = material.current.uniforms.uMouse.value as Vector2;
    current.x += (pointerTarget.x - current.x) * Math.min(delta * 4, 1);
    current.y += (pointerTarget.y - current.y) * Math.min(delta * 4, 1);
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <planeGeometry args={[0.2, 0.2]} />
      <shaderMaterial
        ref={material}
        vertexShader={NODE_VERT}
        fragmentShader={NODE_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </instancedMesh>
  );
}

function Grid() {
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color("#2563EB") },
      uFade: { value: 0.42 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
      <planeGeometry args={[46, 46]} />
      <shaderMaterial
        ref={material}
        vertexShader={GRID_VERT}
        fragmentShader={GRID_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function RadiusRing({ offset }: { offset: number }) {
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOffset: { value: offset },
      uColor: { value: new Color("#0EA5E9") },
    }),
    [offset],
  );

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
      <planeGeometry args={[24, 24]} />
      <shaderMaterial
        ref={material}
        vertexShader={RING_VERT}
        fragmentShader={RING_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

function Arc({ to, offset }: { to: Vector3; offset: number }) {
  const material = useRef<ShaderMaterial>(null);

  const curve = useMemo(() => {
    const from = new Vector3(0, 0.05, 0);
    // Lift the control point so the arc bows upward, higher for longer spans.
    const mid = from
      .clone()
      .add(to)
      .multiplyScalar(0.5)
      .setY(0.6 + to.length() * 0.16);
    return new QuadraticBezierCurve3(from, mid, to.clone());
  }, [to]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOffset: { value: offset },
      uColorA: { value: new Color("#0EA5E9") },
      uColorB: { value: new Color("#2563EB") },
    }),
    [offset],
  );

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh>
      <tubeGeometry args={[curve, 36, 0.016, 5, false]} />
      <shaderMaterial
        ref={material}
        vertexShader={ARC_VERT}
        fragmentShader={ARC_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

/** "You are here" — the one warm-white element in an otherwise cool scene. */
function UserMarker() {
  const mesh = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 2.1) * 0.12;
    mesh.current.scale.setScalar(s);
  });

  return (
    <group position={[0, 0.05, 0]}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <pointLight color="#e0f2fe" intensity={3.2} distance={5} />
    </group>
  );
}

/** Slow autonomous drift plus damped pointer parallax. Never snaps. */
function CameraRig() {
  const { camera } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Mutating the camera inside useFrame is how react-three-fiber is designed to
  // be driven — the render loop reads the live three.js object graph, and
  // routing a 60fps camera position through React state would re-render the
  // tree every frame. react-hooks/immutability cannot distinguish this from
  // mutating React-owned state, so it is disabled for this block only.
  /* eslint-disable react-hooks/immutability */
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const driftX = Math.sin(t * 0.075) * 1.5;
    const driftZ = Math.cos(t * 0.055) * 0.9;

    const wantX = driftX + target.current.x * 1.5;
    const wantY = 8.4 - target.current.y * 0.7;
    const wantZ = 13.2 + driftZ;

    const k = Math.min(delta * 1.4, 1);
    camera.position.x += (wantX - camera.position.x) * k;
    camera.position.y += (wantY - camera.position.y) * k;
    camera.position.z += (wantZ - camera.position.z) * k;
    camera.lookAt(0, 0, 0);
  });
  /* eslint-enable react-hooks/immutability */

  return null;
}

function MapContents({ tier }: { tier: "low" | "high" }) {
  const count = tier === "high" ? NODE_COUNT_HIGH : NODE_COUNT_LOW;
  const layout = useMemo(() => buildLayout(NODE_COUNT_HIGH), []);
  const arcs = tier === "high" ? layout.nearest : layout.nearest.slice(0, 3);

  return (
    <>
      <CameraRig />
      <Grid />
      <Nodes layout={layout} count={count} />
      <RadiusRing offset={0} />
      <RadiusRing offset={0.5} />
      <UserMarker />
      {arcs.map((to, i) => (
        <Arc key={i} to={to} offset={i / arcs.length} />
      ))}
      <fog attach="fog" args={["#0b1120", 12, 30]} />
    </>
  );
}

const CAMERA = {
  position: [0, 8.4, 13.2] as [number, number, number],
  fov: 42,
};

/**
 * Default export so SceneGate can lazily `import()` this module. Everything
 * three.js-shaped lives behind this boundary and is never in the initial
 * bundle.
 */
export default function MapCanvas() {
  return (
    <SceneCanvas camera={CAMERA}>
      {(tier) => <MapContents tier={tier} />}
    </SceneCanvas>
  );
}
