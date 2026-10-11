import Link from "next/link";

import { cn } from "@/lib/utils";

export function StaticHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <header className="border-b border-border pb-8">
      <nav aria-label="Хлібні крихти" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground hover:underline">
          Головна
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{title}</span>
      </nav>
      <p className="eyebrow mt-4">{eyebrow}</p>
      <h1 className="heading-lg mt-2">{title}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        {lead}
      </p>
    </header>
  );
}

export function ContentSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-border py-8 last:border-b-0", className)}>
      <h2 className="heading-md">{title}</h2>
      <div className="mt-4 space-y-3 leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

export function InfoCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="border border-border bg-paper p-5">
      <p className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
        {title}
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
