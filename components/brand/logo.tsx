import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

export function Logo({ className, withWordmark = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className="size-11 shrink-0" />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-semibold tracking-[0.14em] uppercase">
            Did Panas
          </span>
          <span className="mt-0.5 text-[9px] font-medium tracking-[0.3em] text-muted-foreground uppercase">
            made in Ukraine
          </span>
        </span>
      )}
    </span>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Did Panas"
      className={className}
      fill="none"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" />
      <circle
        cx="32"
        cy="32"
        r="26.5"
        stroke="var(--color-cream)"
        strokeWidth="1"
        opacity="0.55"
      />
      <path
        d="M14.5 31.5c0-9.4 7.8-17 17.5-17s17.5 7.6 17.5 17c0 1.7-1.3 2.7-3 2.7H17.6c-1.8 0-3.1-1.1-3.1-2.7Z"
        fill="var(--color-brick)"
      />
      <path
        d="M14.5 31.5c0-9.4 7.8-17 17.5-17s17.5 7.6 17.5 17"
        stroke="var(--color-cream)"
        strokeWidth="1.4"
        opacity="0.35"
      />
      <circle cx="24" cy="24" r="3.1" fill="var(--color-cream)" />
      <circle cx="36.5" cy="21.5" r="2.3" fill="var(--color-cream)" />
      <circle cx="42.5" cy="28" r="2.7" fill="var(--color-cream)" />
      <circle cx="29.5" cy="29.5" r="2" fill="var(--color-cream)" />
      <path
        d="M25.5 34h13v8.2c0 3.6-2.9 6.5-6.5 6.5s-6.5-2.9-6.5-6.5V34Z"
        fill="var(--color-cream)"
      />
      <path
        d="M25.5 36.5h13"
        stroke="var(--color-ink)"
        strokeWidth="1"
        opacity="0.25"
      />
      <path
        d="M18 49.5c4.4 2.7 9.2 4 14 4s9.6-1.3 14-4"
        stroke="var(--color-gold)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface BrandLinkProps {
  className?: string;
}

export function BrandLink({ className }: BrandLinkProps) {
  return (
    <Link
      href="/"
      aria-label="Did Panas — на головну"
      className={cn(
        "transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    >
      <Logo />
    </Link>
  );
}
