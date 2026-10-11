import { readDbSync, writeDbSync } from "@/lib/db/store";
import type {
  Banner,
  Category,
  DatabaseShape,
  HomeCarousel,
  HomeCarouselItem,
  HomeCarouselSettings,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
} from "@/types";

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function slugify(value: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
    з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
    ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia",
  };
  return value
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(db: DatabaseShape, base: string, excludeId?: string): string {
  let slug = base || "product";
  let counter = 2;
  while (
    db.products.some((product) => product.slug === slug && product.id !== excludeId)
  ) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

export function listProducts(): Product[] {
  return readDbSync().products;
}

export function getProduct(productId: string): Product | undefined {
  return readDbSync().products.find((product) => product.id === productId);
}

export function listCategories(): Category[] {
  return readDbSync().categories;
}

export function listBanners(): Banner[] {
  return readDbSync().banners;
}

export function listOrders(): Order[] {
  return readDbSync().orders;
}

export function getSettings(): StoreSettings {
  return readDbSync().settings;
}

export type ProductDraft = Omit<Product, "id" | "slug" | "createdAt"> & {
  slug?: string;
};

export function createProduct(draft: ProductDraft): Product {
  const db = readDbSync();
  const product: Product = {
    ...draft,
    id: id("p"),
    slug: uniqueSlug(db, draft.slug || slugify(draft.name)),
    createdAt: new Date().toISOString(),
  };
  db.products = [product, ...db.products];
  writeDbSync(db);
  return product;
}

export function updateProduct(
  productId: string,
  patch: Partial<ProductDraft>,
): Product {
  const db = readDbSync();
  const index = db.products.findIndex((product) => product.id === productId);
  if (index === -1) {
    throw new Error("Товар не знайдено");
  }
  const current = db.products[index];
  const next: Product = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    slug: patch.slug
      ? uniqueSlug(db, patch.slug, productId)
      : patch.name && patch.name !== current.name
        ? uniqueSlug(db, slugify(patch.name), productId)
        : current.slug,
  };
  db.products[index] = next;
  writeDbSync(db);
  return next;
}

export function deleteProduct(productId: string): void {
  const db = readDbSync();
  db.products = db.products.filter((product) => product.id !== productId);
  writeDbSync(db);
}

export function createCategory(draft: Omit<Category, "id">): Category {
  const db = readDbSync();
  const category: Category = { ...draft, id: id("cat") };
  db.categories = [...db.categories, category].sort((a, b) => a.order - b.order);
  writeDbSync(db);
  return category;
}

export function updateCategory(
  categoryId: string,
  patch: Partial<Omit<Category, "id">>,
): Category {
  const db = readDbSync();
  const index = db.categories.findIndex((category) => category.id === categoryId);
  if (index === -1) {
    throw new Error("Категорію не знайдено");
  }
  const next = { ...db.categories[index], ...patch, id: categoryId };
  db.categories[index] = next;
  writeDbSync(db);
  return next;
}

export function deleteCategory(categoryId: string): void {
  const db = readDbSync();
  db.categories = db.categories.filter((category) => category.id !== categoryId);
  writeDbSync(db);
}

export function createBanner(draft: Omit<Banner, "id">): Banner {
  const db = readDbSync();
  const banner: Banner = { ...draft, id: id("banner") };
  db.banners = [...db.banners, banner].sort((a, b) => a.order - b.order);
  writeDbSync(db);
  return banner;
}

export function updateBanner(
  bannerId: string,
  patch: Partial<Omit<Banner, "id">>,
): Banner {
  const db = readDbSync();
  const index = db.banners.findIndex((banner) => banner.id === bannerId);
  if (index === -1) {
    throw new Error("Банер не знайдено");
  }
  const next = { ...db.banners[index], ...patch, id: bannerId };
  db.banners[index] = next;
  db.banners.sort((a, b) => a.order - b.order);
  writeDbSync(db);
  return next;
}

export function deleteBanner(bannerId: string): void {
  const db = readDbSync();
  db.banners = db.banners.filter((banner) => banner.id !== bannerId);
  writeDbSync(db);
}

export function createOrder(order: Omit<Order, "id" | "number" | "createdAt">): Order {
  const db = readDbSync();
  const sequence = db.orders.length + 1;
  const created: Order = {
    ...order,
    id: id("ord"),
    number: `DP-${String(1000 + sequence)}`,
    createdAt: new Date().toISOString(),
  };
  db.orders = [created, ...db.orders];
  writeDbSync(db);
  return created;
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Order {
  const db = readDbSync();
  const index = db.orders.findIndex((order) => order.id === orderId);
  if (index === -1) {
    throw new Error("Замовлення не знайдено");
  }
  const next = { ...db.orders[index], status };
  db.orders[index] = next;
  writeDbSync(db);
  return next;
}

export function deleteOrder(orderId: string): void {
  const db = readDbSync();
  db.orders = db.orders.filter((order) => order.id !== orderId);
  writeDbSync(db);
}

export function updateSettings(patch: Partial<StoreSettings>): StoreSettings {
  const db = readDbSync();
  const next = { ...db.settings, ...patch };
  db.settings = next;
  writeDbSync(db);
  return next;
}

export function getHomeCarousel(): HomeCarousel {
  return readDbSync().homeCarousel;
}

function resequence(items: HomeCarouselItem[]): HomeCarouselItem[] {
  return items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));
}

export function updateHomeCarouselSettings(
  patch: Partial<HomeCarouselSettings>,
): HomeCarouselSettings {
  const db = readDbSync();
  const settings = { ...db.homeCarousel.settings, ...patch };
  db.homeCarousel.settings = settings;
  writeDbSync(db);
  return settings;
}

export type HomeCarouselItemDraft = Omit<HomeCarouselItem, "id" | "order">;

export function createHomeCarouselItem(
  draft: HomeCarouselItemDraft,
): HomeCarouselItem {
  const db = readDbSync();
  if (!db.products.some((product) => product.id === draft.productId)) {
    throw new Error("Товар не знайдено");
  }
  const item: HomeCarouselItem = {
    ...draft,
    id: id("hc"),
    order: db.homeCarousel.items.length + 1,
  };
  db.homeCarousel.items = resequence([...db.homeCarousel.items, item]);
  writeDbSync(db);
  return db.homeCarousel.items.find((entry) => entry.id === item.id) ?? item;
}

export function updateHomeCarouselItem(
  itemId: string,
  patch: Partial<HomeCarouselItemDraft>,
): HomeCarouselItem {
  const db = readDbSync();
  const index = db.homeCarousel.items.findIndex((item) => item.id === itemId);
  if (index === -1) {
    throw new Error("Картку каруселі не знайдено");
  }
  if (
    patch.productId &&
    !db.products.some((product) => product.id === patch.productId)
  ) {
    throw new Error("Товар не знайдено");
  }
  const next: HomeCarouselItem = {
    ...db.homeCarousel.items[index],
    ...patch,
    id: itemId,
    order: db.homeCarousel.items[index].order,
  };
  db.homeCarousel.items[index] = next;
  writeDbSync(db);
  return next;
}

export function deleteHomeCarouselItem(itemId: string): void {
  const db = readDbSync();
  db.homeCarousel.items = resequence(
    db.homeCarousel.items.filter((item) => item.id !== itemId),
  );
  writeDbSync(db);
}

export function moveHomeCarouselItem(
  itemId: string,
  direction: -1 | 1,
): void {
  const db = readDbSync();
  const items = db.homeCarousel.items
    .slice()
    .sort((a, b) => a.order - b.order);
  const index = items.findIndex((item) => item.id === itemId);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= items.length) {
    return;
  }
  const [moved] = items.splice(index, 1);
  items.splice(target, 0, moved);
  db.homeCarousel.items = items.map((item, position) => ({
    ...item,
    order: position + 1,
  }));
  writeDbSync(db);
}
