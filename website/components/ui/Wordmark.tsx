import { cn } from "@/lib/cn";

/**
 * The ojao logo — the real brand mark: "ojao" drawn as four concentric-line
 * letterforms.
 *
 * Rendered as a CSS mask over `currentColor` rather than an <img>. The source
 * asset is pure black, which would be invisible on the site's dark sections;
 * masking means one file inherits whatever text colour its context sets, so it
 * works on the white nav and the navy hero without a second asset, an invert
 * filter, or a hardcoded hex.
 *
 * The asset is generated from ojao_logo.png by scripts/extract-logo.mjs
 * (cropped to the ink bounds, coverage moved into the alpha channel).
 * Intrinsic aspect ratio is 3.4043:1.
 */

const ASPECT = 3.4043;

export function Wordmark({
  className,
  onDark = false,
  height = 26,
}: {
  className?: string;
  /** Kept for call-site clarity; colour actually comes from currentColor. */
  onDark?: boolean;
  /** Rendered height in px. Width is derived from the logo's aspect ratio. */
  height?: number;
}) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 align-middle transition-colors duration-300",
        onDark ? "text-white" : "text-charcoal",
        className,
      )}
      style={{
        height,
        width: Math.round(height * ASPECT),
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/ojao-logo-mask.png)",
        maskImage: "url(/ojao-logo-mask.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
      role="img"
      aria-label="ojao"
    />
  );
}
