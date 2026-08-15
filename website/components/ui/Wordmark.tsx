import { cn } from "@/lib/cn";

/**
 * Wordmark: lowercase "ojao" with the second "o" rendered as a queue ring —
 * a small nod to the radius/position idea the product is built on.
 */
export function Wordmark({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 font-display text-[1.375rem] font-semibold tracking-[-0.04em]",
        onDark ? "text-white" : "text-charcoal",
        className,
      )}
    >
      <span aria-hidden="true" className="inline-flex items-center gap-[0.05em]">
        oja
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          className="translate-y-[0.5px]"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="9"
            cy="9"
            r="7.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            opacity="0.9"
          />
          <circle cx="9" cy="9" r="2.75" fill="#0EA5E9" />
        </svg>
      </span>
      <span className="sr-only">ojao</span>
    </span>
  );
}
