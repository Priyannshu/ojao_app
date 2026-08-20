import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Required by output: "export" — emits the card as a file at build time.
export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG card. Rebuilds the hero's visual idea — dark map, cyan search radius —
 * in the flexbox subset ImageResponse supports (no grid, no CSS mask).
 *
 * The logo is inlined as a base64 data URI because ImageResponse renders in an
 * isolated context with no access to the site's origin, so a `/`-relative src
 * would silently fail. The mask asset is white-on-transparent, which is exactly
 * what this dark card needs — no recolouring required.
 */
const LOGO_DATA_URI = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public", "ojao-logo-mask.png"),
).toString("base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0B1120",
          padding: 72,
          position: "relative",
        }}
      >
        {/* Search-radius glow, echoing the hero scene. */}
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            left: 520,
            top: -180,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(14,165,233,0.30) 0%, rgba(37,99,235,0.12) 45%, rgba(11,17,32,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            left: 760,
            top: 60,
            borderRadius: 9999,
            border: "2px solid rgba(14,165,233,0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 620,
            height: 620,
            left: 660,
            top: -40,
            borderRadius: 9999,
            border: "2px solid rgba(14,165,233,0.18)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_DATA_URI}
            alt=""
            width={150}
            height={44}
            style={{ display: "block" }}
          />
          <span
            style={{
              color: "#64748B",
              fontSize: 18,
              letterSpacing: 4,
            }}
          >
            PATIENT FLOW
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 82,
              fontWeight: 600,
              letterSpacing: -3,
              lineHeight: 1.02,
              display: "flex",
            }}
          >
            Waiting is not healthcare.
          </div>
          <div
            style={{
              color: "#94A3B8",
              fontSize: 34,
              marginTop: 20,
              letterSpacing: -0.5,
              display: "flex",
            }}
          >
            Digital patient flow &amp; virtual queues for Indian healthcare.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(16,185,129,0.45)",
              background: "rgba(16,185,129,0.10)",
              borderRadius: 9999,
              padding: "10px 20px",
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: 9999,
                background: "#10B981",
                display: "flex",
              }}
            />
            <span style={{ color: "#10B981", fontSize: 20, letterSpacing: 2 }}>
              NOW SERVING
            </span>
          </div>
          <span style={{ color: "#e2e8f0", fontSize: 30, letterSpacing: -1 }}>
            TKN-405
          </span>
          <span style={{ color: "#64748B", fontSize: 22, marginLeft: "auto" }}>
            ojao.in
          </span>
        </div>
      </div>
    ),
    size,
  );
}
