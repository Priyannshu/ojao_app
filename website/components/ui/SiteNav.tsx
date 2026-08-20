"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/content/copy";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { Wordmark } from "./Wordmark";

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // IntersectionObserver on a sentinel rather than a scroll listener, so we
  // never run work on every scroll frame.
  useEffect(() => {
    const sentinel = document.createElement("div");
    sentinel.style.cssText =
      "position:absolute;top:0;left:0;height:8px;width:1px;pointer-events:none;";
    document.body.prepend(sentinel);

    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(sentinel);

    return () => {
      io.disconnect();
      sentinel.remove();
    };
  }, []);

  // Lock the page behind the mobile sheet.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Every page opens with a dark hero/header band, so before the user scrolls
  // the nav sits on dark and must use light-on-dark treatment. Once the
  // frosted white bar kicks in, it flips back to dark-on-light.
  const onDark = !scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-line/80 bg-white/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-6 md:h-18">
        <Link
          href="/"
          className="shrink-0"
          aria-label="ojao home"
          onClick={() => setOpen(false)}
        >
          <Wordmark onDark={onDark && !open} height={30} />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm transition-colors",
                    onDark
                      ? "text-slate-light hover:text-white"
                      : "text-slate hover:text-charcoal",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            href="/#simulator"
            variant={onDark ? "ghostDark" : "ghost"}
            size="md"
          >
            Live Simulator
          </Button>
          <Button href="/#demo" variant="primary" size="md">
            Request Enterprise Demo
          </Button>
        </div>

        <button
          type="button"
          className={cn(
            "flex size-10 items-center justify-center rounded-lg border md:hidden",
            onDark && !open ? "border-white/25" : "border-line",
          )}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-4.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "absolute left-0 h-0.5 w-full transition-all duration-300",
                  onDark && !open ? "bg-white" : "bg-charcoal",
                  i === 0 && (open ? "top-1.5 rotate-45" : "top-0"),
                  i === 1 && cn("top-1.5", open && "opacity-0"),
                  i === 2 && (open ? "top-1.5 -rotate-45" : "top-3"),
                )}
              />
            ))}
          </span>
        </button>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-line bg-white md:hidden"
        >
          <nav aria-label="Mobile" className="shell py-6">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-2 py-3 text-base text-charcoal hover:bg-mist"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3">
              <Button href="/#simulator" variant="ghost" size="lg">
                Live Simulator
              </Button>
              <Button href="/#demo" variant="primary" size="lg">
                Request Enterprise Demo
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
