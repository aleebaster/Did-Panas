import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const baseClass =
  "flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50";

export function NativeSelect({
  name,
  id,
  defaultValue,
  value,
  onChange,
  children,
  className,
  ariaLabel,
}: {
  name?: string;
  id?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      name={name}
      id={id}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      aria-label={ariaLabel}
      className={cn(baseClass, className)}
    >
      {children}
    </select>
  );
}
