import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/catalog/pagination";
import { catalogQuery, type CatalogHrefInput, type SortKey } from "@/lib/catalog-query";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types";

export const CATALOG_PAGE_SIZE = 8;

const sortLinks: { key: SortKey; label: string }[] = [
  { key: "popular", label: "За популярністю" },
  { key: "price-asc", label: "Спочатку дешевші" },
  { key: "price-desc", label: "Спочатку дорожчі" },
  { key: "new", label: "Новинки" },
];

interface CatalogResultsProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  products: Product[];
  categories: Category[];
}

export async function CatalogResults({
  searchParams,
  products,
  categories,
}: CatalogResultsProps) {
  const query = await catalogQuery.parse(searchParams);
  const activeCategory = categories.find(
    (category) => category.slug === query.category,
  );

  const filtered = products
    .filter((product) =>
      activeCategory ? product.categoryId === activeCategory.id : true,
    )
    .filter((product) =>
      query.maxPrice ? product.price <= query.maxPrice : true,
    )
    .filter((product) => (query.inStock ? product.stock > 0 : true))
    .filter((product) =>
      query.q
        ? `${product.name} ${product.shortDescription} ${product.sku}`
            .toLowerCase()
            .includes(query.q.toLowerCase())
        : true,
    );

  const sorted = [...filtered].sort((a, b) => {
    switch (query.sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "new":
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name, "uk");
    }
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / CATALOG_PAGE_SIZE));
  const page = Math.min(Math.max(query.page, 1), totalPages);
  const visible = sorted.slice(
    (page - 1) * CATALOG_PAGE_SIZE,
    page * CATALOG_PAGE_SIZE,
  );

  const buildHref = (overrides: CatalogHrefInput) =>
    catalogQuery.toHref({ ...query, ...overrides });

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-36 space-y-8">
          <div>
            <p className="eyebrow mb-3">Категорії</p>
            <nav className="grid gap-1">
              <Link
                href={buildHref({ category: null, page: null })}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition hover:bg-muted",
                  !activeCategory && "bg-ink font-medium text-cream",
                )}
              >
                Усі товари
                <span className="float-right text-xs opacity-70">
                  {products.length}
                </span>
              </Link>
              {categories.map((category) => {
                const count = products.filter(
                  (product) => product.categoryId === category.id,
                ).length;
                const isActive = activeCategory?.id === category.id;
                return (
                  <Link
                    key={category.id}
                    href={buildHref({
                      category: isActive ? null : category.slug,
                      page: null,
                    })}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm transition hover:bg-muted",
                      isActive && "bg-ink font-medium text-cream",
                    )}
                  >
                    {category.name}
                    <span className="float-right text-xs opacity-70">
                      {count}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="eyebrow mb-3">Наявність</p>
            <Link
              href={buildHref({ inStock: query.inStock ? null : true, page: null })}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition hover:bg-muted",
                query.inStock && "bg-ink font-medium text-cream",
              )}
            >
              <span
                className={cn(
                  "size-3.5 border border-current",
                  query.inStock && "bg-gold",
                )}
              />
              Тільки у наявності
            </Link>
          </div>

          <div>
            <p className="eyebrow mb-3">Ціна до</p>
            <div className="grid gap-2">
              {[500, 1000, 1500].map((price) => (
                <Link
                  key={price}
                  href={buildHref({
                    maxPrice: query.maxPrice === price ? null : price,
                    page: null,
                  })}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition hover:bg-muted",
                    query.maxPrice === price && "bg-ink font-medium text-cream",
                  )}
                >
                  {price} ₴
                </Link>
              ))}
              {query.maxPrice && (
                <Link
                  href={buildHref({ maxPrice: null, page: null })}
                  className="px-3 py-1 text-xs text-brick hover:underline"
                >
                  Скинути фільтр ціни
                </Link>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="size-4" />
              Знайдено {sorted.length}{" "}
              {sorted.length === 1 ? "товар" : sorted.length < 5 ? "товари" : "товарів"}
              {activeCategory && (
                <>
                  {" · "}
                  <span className="font-medium text-foreground">
                    {activeCategory.name}
                  </span>
                </>
              )}
              {query.q && (
                <>
                  {" · "}
                  <span className="font-medium text-foreground">
                    «{query.q}»
                  </span>
                </>
              )}
            </p>
            {activeCategory && (
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                {activeCategory.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {sortLinks.map((sort) => (
              <Link
                key={sort.key}
                href={buildHref({ sort: sort.key, page: null })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition",
                  query.sort === sort.key
                    ? "bg-ink text-cream"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {sort.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))}
        </div>

        {visible.length === 0 && (
          <div className="mt-10 border border-dashed border-border bg-paper px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold uppercase">
              За цими умовами нічого немає
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Спробуйте змінити фільтри або перегляньте весь каталог.
            </p>
            <Link
              href="/catalog"
              className="mt-5 inline-block border-b border-brick text-sm font-medium text-brick"
            >
              Скинути всі фільтри
            </Link>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(target) => buildHref({ page: target === 1 ? null : target })}
        />
      </div>
    </div>
  );
}
