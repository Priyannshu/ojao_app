/**
 * Shaders for the Living Map (hero).
 *
 * Kept as plain GLSL strings with the uniforms documented, because someone
 * will have to maintain these later.
 */

/* ------------------------------------------------------------------
   Ground grid
   A large plane with grid lines drawn procedurally, faded radially so the
   plane never shows a hard edge.

   uniforms:
     uTime      seconds since scene start — drives a slow drift
     uColor     line colour
     uFade      radial falloff radius in UV space (0.5 == plane edge)
   ------------------------------------------------------------------ */
export const GRID_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GRID_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uColor;
  uniform float uFade;

  varying vec2 vUv;

  // Anti-aliased grid line coverage using screen-space derivatives, so lines
  // stay one pixel wide at every depth instead of aliasing into moire.
  float gridLine(vec2 uv, float cells) {
    vec2 g = fract(uv * cells);
    vec2 d = abs(g - 0.5) / fwidth(uv * cells);
    float line = 1.0 - min(min(d.x, d.y), 1.0);
    return line;
  }

  void main() {
    // Slow drift toward the camera to imply movement without animating geometry.
    vec2 uv = vUv + vec2(0.0, uTime * 0.004);

    float fine   = gridLine(uv, 46.0) * 0.75;
    float coarse = gridLine(uv, 11.5) * 1.0;
    float lines  = max(fine, coarse);

    // Radial falloff from the centre of the plane.
    float dist = length(vUv - 0.5);
    float fade = 1.0 - smoothstep(0.0, uFade, dist);

    float alpha = lines * fade * 0.85;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`;

/* ------------------------------------------------------------------
   Hospital nodes (instanced)
   One InstancedMesh for every node. Per-instance phase and mouse proximity
   are both resolved on the GPU, so 180 nodes cost one draw call and zero
   per-frame JS.

   uniforms:
     uTime   seconds — drives the breathing pulse
     uMouse  pointer position in world XZ, for proximity brightening
   attributes:
     aPhase  per-instance phase offset so nodes don't breathe in lockstep
     aTint   0..1 mix between deep blue and bright cyan
   ------------------------------------------------------------------ */
export const NODE_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aTint;

  uniform float uTime;
  uniform vec2  uMouse;

  varying float vGlow;
  varying float vTint;
  varying vec2  vUv;

  void main() {
    vTint = aTint;
    vUv = uv;

    // Breathing scale, unique per instance.
    float pulse = 0.5 + 0.5 * sin(uTime * 1.5 + aPhase * 6.2831);

    // instanceMatrix column 3 holds this instance's world translation.
    vec3 worldPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

    // Proximity to the pointer, in the ground plane. Cheaper than a raycast
    // and it affects every node at once.
    float near = 1.0 - smoothstep(0.0, 2.6, distance(worldPos.xz, uMouse));

    vGlow = 0.75 + pulse * 0.55 + near * 1.1;

    // Scale the billboard slightly with the pulse and with proximity.
    float s = 1.0 + pulse * 0.16 + near * 0.5;

    // Billboard: build the quad in view space so it always faces the camera,
    // rather than lying flat on the ground plane.
    vec4 center = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    center.xy += position.xy * s;
    gl_Position = projectionMatrix * center;
  }
`;

export const NODE_FRAG = /* glsl */ `
  precision highp float;

  varying float vGlow;
  varying float vTint;
  varying vec2  vUv;

  void main() {
    // Soft radial disc from the quad's own UVs — no texture needed.
    float d = length(vUv - 0.5) * 2.0;
    float disc = 1.0 - smoothstep(0.35, 1.0, d);
    if (disc < 0.004) discard;

    vec3 deep   = vec3(0.145, 0.388, 0.922); // #2563EB
    vec3 bright = vec3(0.055, 0.647, 0.914); // #0EA5E9
    vec3 color  = mix(deep, bright, vTint);

    gl_FragColor = vec4(color * vGlow, disc * vGlow);
  }
`;

/* ------------------------------------------------------------------
   Radius ring
   A flat annulus that expands and fades. This is the app's nearby-search
   radius, and it is the emotional hook of the whole scene.

   uniforms:
     uTime    seconds
     uOffset  phase offset so multiple rings stagger
     uColor   ring colour
   ------------------------------------------------------------------ */
export const RING_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const RING_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uOffset;
  uniform vec3  uColor;

  varying vec2 vUv;

  void main() {
    // 2.6s cycle, matching the app's search pulse.
    float t = fract((uTime / 2.6) + uOffset);

    float dist = length(vUv - 0.5) * 2.0; // 0 at centre, 1 at plane edge
    float radius = t;                      // ring expands outward over the cycle

    // Thin band around the current radius.
    float band = 1.0 - smoothstep(0.0, 0.055, abs(dist - radius));

    // Fade as it expands, and clip anything past the plane.
    float fade = (1.0 - t) * (1.0 - smoothstep(0.85, 1.0, dist));

    float alpha = band * fade * 1.5;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`;

/* ------------------------------------------------------------------
   Connection arc
   A tube from the user marker to a nearby node, with a light pulse
   travelling along its length.

   uniforms:
     uTime     seconds
     uOffset   per-arc phase offset
     uColorA   colour at the start of the travelling pulse
     uColorB   colour at its end
   ------------------------------------------------------------------ */
export const ARC_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ARC_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uOffset;
  uniform vec3  uColorA;
  uniform vec3  uColorB;

  varying vec2 vUv;

  void main() {
    // vUv.x runs along the tube. Travel a bright head along it.
    float head = fract(uTime * 0.28 + uOffset);
    float along = vUv.x;

    // Distance behind the head, wrapped, so the trail is continuous.
    float behind = fract(head - along);
    float trail = pow(1.0 - behind, 9.0);

    // A faint always-on line so the connection reads even between pulses.
    float base = 0.1 * (1.0 - smoothstep(0.75, 1.0, along));

    float alpha = clamp(trail * 0.9 + base, 0.0, 1.0);
    if (alpha < 0.004) discard;

    vec3 color = mix(uColorA, uColorB, along);
    gl_FragColor = vec4(color, alpha);
  }
`;
