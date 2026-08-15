"use client";

import { SceneGate } from "./SceneGate";
import { MapPoster } from "./Posters";

/**
 * Hero scene: "The Living Map".
 *
 * An abstract city at night, seen at a low oblique angle. Hospital nodes
 * breathe, the user marker emits expanding search-radius rings, and arcs
 * connect the marker to its nearest nodes — which is, literally, what the
 * app's nearby search does.
 *
 * This wrapper is intentionally tiny: the actual three.js work lives in
 * ./MapCanvas and is only fetched once the browser is idle and the device has
 * been judged capable. See SceneGate.
 */
export function LivingMapScene() {
  return (
    <SceneGate
      className="absolute inset-0 -z-2"
      poster={<MapPoster />}
      load={() => import("./MapCanvas")}
    />
  );
}
