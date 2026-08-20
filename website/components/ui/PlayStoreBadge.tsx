import { LINKS } from "@/lib/site";

/**
 * Official Google Play badge, inlined as SVG so it costs no request and
 * scales cleanly. There is deliberately no App Store badge: no iOS app
 * exists, and a dead store link is worse than no link.
 */
export function PlayStoreBadge({ className }: { className?: string }) {
  return (
    <a
      href={LINKS.playStore}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label="Get the ojao app on Google Play (opens in a new tab)"
    >
      <svg
        width="168"
        height="50"
        viewBox="0 0 168 50"
        role="img"
        aria-hidden="true"
        focusable="false"
      >
        <rect
          x="0.5"
          y="0.5"
          width="167"
          height="49"
          rx="8"
          fill="#000"
          stroke="rgba(255,255,255,0.28)"
        />
        <g transform="translate(14, 12.5)">
          <path d="M0.6 0.4a1.9 1.9 0 0 0-.45 1.3v21.1a1.9 1.9 0 0 0 .45 1.3l11.1-11.85z" fill="#00A0FF" />
          <path d="M15.4 16.2l-3.7-3.95L15.4 8.3l4.5 2.55c1.29.73 1.29 1.92 0 2.66z" fill="#FFE000" />
          <path d="M15.4 16.2l-3.7-3.95L.6 24.1c.42.45 1.12.5 1.9.06z" fill="#FF3A44" />
          <path d="M15.4 8.3L2.5 1.04C1.72.6 1.02.65.6.4l11.1 11.85z" fill="#00D97E" />
        </g>
        <text
          x="46"
          y="20"
          fill="#fff"
          fontFamily="system-ui, sans-serif"
          fontSize="8.5"
          letterSpacing="0.9"
        >
          GET IT ON
        </text>
        <text
          x="46"
          y="37"
          fill="#fff"
          fontFamily="system-ui, sans-serif"
          fontSize="18"
          fontWeight="500"
        >
          Google Play
        </text>
      </svg>
    </a>
  );
}
