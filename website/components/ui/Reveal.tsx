import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Section reveal — a 20px rise plus opacity as the element scrolls in.
 *
 * This is a *server* component with no JavaScript at all. The animation is
 * done with CSS scroll-driven animations (`animation-timeline: view()`),
 * gated behind `@supports`. That matters for two reasons:
 *
 *  - It was previously a client component instantiated ~40 times per page,
 *    each with its own IntersectionObserver. That hydration cost was one of
 *    the largest contributors to Total Blocking Time, for a fade-in.
 *  - Browsers without support (currently Safari and Firefox) simply render the
 *    content visible. A reveal must never be the reason someone cannot read
 *    the page, and with no JS involved there is no failure mode where content
 *    stays stuck at `opacity: 0`.
 *
 * `delay` staggers siblings by shifting the animation range slightly.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  return (
    <Tag
      className={cn("reveal", className)}
      style={
        delay
          ? ({ "--reveal-delay": `${delay}s` } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </Tag>
  );
}
