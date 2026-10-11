import { cacheLife, cacheTag } from "next/cache";

import { readDbSync } from "@/lib/db/store";
import type {
  Banner,
  Category,
  HomeCarousel,
  Product,
  StoreSettings,
} from "@/types";

export interface Catalog {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  settings: StoreSettings;
  homeCarousel: HomeCarousel;
}

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const db = readDbSync();
  return {
    products: db.products,
    categories: db.categories,
    banners: db.banners,
    settings: db.settings,
    homeCarousel: db.homeCarousel,
  };
}

/**
 * Збирає товари для головної каруселі за картками з адмінки:
 * ціна й посилання завжди беруться з каталогу, а назва, опис і фото —
 * з картки, якщо власник задав власні значення.
 *
 * Якщо карток немає або жодна не прив'язана до існуючого товару,
 * показуємо всі товари (стан за замовчуванням).
 */
export function resolveCarouselProducts(
  products: Product[],
  homeCarousel: HomeCarousel,
): Product[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const linked = homeCarousel.items.filter((item) =>
    productsById.has(item.productId),
  );
  if (linked.length === 0) {
    return products;
  }

  const seen = new Set<string>();
  return linked
    .slice()
    .sort((a, b) => a.order - b.order)
    .flatMap((item) => {
      const product = productsById.get(item.productId);
      if (!product || !item.active || seen.has(item.productId)) {
        return [];
      }
      seen.add(item.productId);
      return [
        {
          ...product,
          name: item.name || product.name,
          shortDescription: item.description || product.shortDescription,
          images: item.image ? [item.image] : product.images,
        },
      ];
    });
}

export async function searchCatalog(query: string): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return readDbSync().products.filter((product) => {
    const haystack = `${product.name} ${product.shortDescription} ${product.sku}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
