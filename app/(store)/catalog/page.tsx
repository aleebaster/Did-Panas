import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CatalogResults } from "@/components/catalog/catalog-results";
import { CatalogSkeleton } from "@/components/catalog/catalog-skeleton";
import { getCatalog } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Каталог грибної продукції",
  description:
    "Каталог Did Panas: капсули, сушені гриби, грибне борошно, чай, подарункові набори та мерч з українським характером.",
};

export default async function CatalogPage({
  searchParams,
}: PageProps<"/catalog">) {
  const { products, categories } = await getCatalog();

  return (
    <div className="container-page py-10 lg:py-14">
      <nav aria-label="Хлібні крихти" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground hover:underline">
          Головна
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Каталог</span>
      </nav>

      <header className="mt-4 border-b border-border pb-6">
        <p className="eyebrow">Добірка 2026</p>
        <h1 className="heading-lg mt-2">Каталог</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Усе, що ми робимо вручну: капсули, сушені гриби, борошно, чай,
          подарункові набори та мерч. Малі партії, повний склад на етикетці.
        </p>
      </header>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        <Link
          href="/catalog"
          className="shrink-0 rounded-full border border-border px-4 py-2 text-sm whitespace-nowrap"
        >
          Усі товари
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/catalog?category=${category.slug}`}
            className={cn(
              "shrink-0 rounded-full border border-border px-4 py-2 text-sm whitespace-nowrap",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogResults
            searchParams={searchParams}
            products={products}
            categories={categories}
          />
        </Suspense>
      </div>
    </div>
  );
}
