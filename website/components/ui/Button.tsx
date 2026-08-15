import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "ghostDark";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,border-color,color,transform] duration-300 will-change-transform hover:-translate-y-px active:translate-y-0";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-[#1d4fd8] shadow-[0_1px_2px_rgba(15,23,42,0.12)]",
  ghost:
    "border border-line bg-white/70 text-charcoal hover:border-brand hover:text-brand",
  ghostDark:
    "border border-white/25 bg-white/5 text-white hover:border-cyan hover:bg-white/10",
};

const SIZES: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-[0.9375rem]",
};

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
};

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  external,
}: Props) {
  const cls = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
