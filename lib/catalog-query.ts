import type { SortKey } from "@/types";

export type { SortKey };

export interface CatalogQuery {
  q: string | null;
  category: string | null;
  sort: SortKey;
  page: number;
  maxPrice: number | null;
  inStock: boolean;
}

const SORT_KEYS: SortKey[] = ["popular", "price-asc", "price-desc", "new"];

type RawSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | null {
  const single = Array.isArray(value) ? value[0] : value;
  const trimmed = single?.trim();
  return trimmed ? trimmed : null;
}

export interface CatalogHrefInput {
  q?: string | null;
  category?: string | null;
  sort?: SortKey;
  page?: number | null;
  maxPrice?: number | null;
  inStock?: boolean | null;
}

export const catalogQuery = {
  async parse(searchParams: RawSearchParams): Promise<CatalogQuery> {
    const params = await searchParams;
    const sortValue = first(params.sort);
    const pageValue = Number(first(params.page) ?? 1);
    const priceValue = Number(first(params.max) ?? 0);

    return {
      q: first(params.q),
      category: first(params.category),
      sort: SORT_KEYS.includes(sortValue as SortKey)
        ? (sortValue as SortKey)
        : "popular",
      page: Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : 1,
      maxPrice:
        Number.isFinite(priceValue) && priceValue > 0 ? priceValue : null,
      inStock: first(params.stock) === "1",
    };
  },

  toHref(query: CatalogHrefInput): string {
    const params = new URLSearchParams();

    if (query.q) params.set("q", query.q);
    if (query.category) params.set("category", query.category);
    if (query.sort && query.sort !== "popular") params.set("sort", query.sort);
    if (query.maxPrice) params.set("max", String(query.maxPrice));
    if (query.inStock) params.set("stock", "1");
    if (query.page && query.page > 1) params.set("page", String(query.page));

    const search = params.toString();
    return search ? `/catalog?${search}` : "/catalog";
  },
};
