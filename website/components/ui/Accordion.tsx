import type { Faq } from "@/content/faq";
import { cn } from "@/lib/cn";

/**
 * Native <details>/<summary> accordion: keyboard-operable and
 * screen-reader-navigable for free, no JS, no ARIA to get wrong.
 */
export function Accordion({
  items,
  onDark = false,
  className,
}: {
  items: Faq[];
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("divide-y", onDark ? "divide-white/12" : "divide-line", className)}>
      {items.map((item) => (
        <details key={item.q} className="group py-5">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-start justify-between gap-6 font-display text-lg font-medium",
              onDark ? "text-white" : "text-charcoal",
            )}
          >
            <span>{item.q}</span>
            <span
              aria-hidden="true"
              className={cn(
                "mt-1 grid size-6 shrink-0 place-items-center rounded-full border transition-transform duration-300 group-open:rotate-45",
                onDark ? "border-white/25 text-white" : "border-line text-slate",
              )}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" focusable="false">
                <path
                  d="M5.5 1v9M1 5.5h9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </summary>
          <p
            className={cn(
              "t-body mt-3 max-w-3xl pr-10",
              onDark ? "text-slate-light" : "text-slate",
            )}
          >
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
