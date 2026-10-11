"use client";

import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const MENU_SLUGS = ["capsules", "dried", "flour"] as const;

export function CatalogMenu({ categories }: { categories: Category[] }) {
  const menuCategories = MENU_SLUGS.map((slug) =>
    categories.find((category) => category.slug === slug),
  ).filter((category): category is Category => Boolean(category));

  return (
    <div className="group/catalog relative">
      <Link
        href="/catalog"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground"
      >
        Каталог
        <ChevronDown className="size-3.5 transition-transform group-hover/catalog:rotate-180" />
      </Link>

      <div className="invisible absolute top-full left-0 z-50 pt-2 opacity-0 transition-opacity duration-150 group-focus-within/catalog:visible group-focus-within/catalog:opacity-100 group-hover/catalog:visible group-hover/catalog:opacity-100">
        <div className="w-[40rem] border border-border bg-paper p-5 shadow-xl">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Link
              href="/catalog"
              className="col-span-2 mb-2 flex items-center gap-2 border-b border-border pb-3 text-xs font-semibold tracking-[0.16em] text-brick uppercase"
            >
              <LayoutGrid className="size-3.5" />
              Усі товари
            </Link>
            {menuCategories.map((category) => (
              <Link
                key={category.id}
                href={`/catalog?category=${category.slug}`}
                className={cn(
                  "group/item flex flex-col rounded-md px-3 py-2.5 transition hover:bg-muted",
                  category.slug === "flour" && "col-span-2",
                )}
              >
                <span className="text-sm font-medium group-hover/item:text-brick">
                  {category.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {category.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
