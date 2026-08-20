"use client";

import { SceneGate } from "./SceneGate";
import { TokenStreamPoster } from "./Posters";

/**
 * "Skip the Wait" backdrop: translucent token-card silhouettes drifting along
 * an S-curve, supplying depth behind the real (DOM) queue in front of it.
 *
 * Canvas work lives in ./TokenStreamCanvas, loaded on idle.
 */
export function TokenStreamScene() {
  return (
    <SceneGate
      poster={<TokenStreamPoster />}
      load={() => import("./TokenStreamCanvas")}
      minWidth={520}
    />
  );
}
