import Link from "next/link";
import { ArrowRight, Coffee, Gift, Package, ShoppingBag, Sprout, Wheat } from "lucide-react";

import type { Category } from "@/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  capsules: Package,
  dried: Sprout,
  flour: Wheat,
  tea: Coffee,
  gifts: Gift,
  merch: ShoppingBag,
};

const TONES = [
  "bg-[#ece2d0]",
  "bg-[#e3e6da]",
  "bg-[#efe0d4]",
  "bg-[#e2e7ec]",
  "bg-[#efe6d2]",
  "bg-[#e9e2ec]",
];

interface CategoryGridProps {
  categories: (Category & { productCount: number })[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="container-page py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Категорії</p>
          <h2 className="heading-lg mt-2">Оберіть своє</h2>
        </div>
        <Link
          href="/catalog"
          className="group inline-flex items-center gap-2 text-sm font-medium text-brick"
        >
          Увесь каталог
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => {
          const Icon = ICONS[category.slug] ?? Package;
          return (
            <Link
              key={category.id}
              href={`/catalog?category=${category.slug}`}
              className={cn(
                "group relative flex min-h-44 flex-col justify-between overflow-hidden border border-border p-6 transition hover:-translate-y-1 hover:border-ink/40 hover:shadow-[0_18px_34px_-24px_rgba(20,18,15,0.7)]",
                TONES[index % TONES.length],
              )}
            >
              <div className="flex items-start justify-between">
                <span className="grid size-12 place-items-center rounded-full border border-ink/15 bg-paper text-brick">
                  <Icon className="size-5" />
                </span>
                <ArrowRight className="size-5 text-ink/40 transition group-hover:translate-x-1 group-hover:text-ink" />
              </div>
              <div className="mt-8">
                <p className="font-display text-xl font-semibold tracking-wide uppercase">
                  {category.name}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-foreground/65">
                  {category.description}
                </p>
                <p className="mt-3 text-xs font-medium tracking-[0.14em] text-foreground/50 uppercase">
                  {category.productCount} позицій
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
