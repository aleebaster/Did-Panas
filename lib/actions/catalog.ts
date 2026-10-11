"use server";

import { revalidatePath, updateTag } from "next/cache";

import {
  createBanner,
  createCategory,
  createProduct,
  deleteBanner,
  deleteCategory,
  deleteProduct,
  updateBanner,
  updateCategory,
  updateProduct,
  updateSettings,
} from "@/lib/db/repository";
import { requireAdmin } from "@/lib/auth";
import type { Banner, Product, StoreSettings } from "@/types";

function revalidateCatalog(): void {
  updateTag("catalog");
  revalidatePath("/", "layout");
}

function number(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || String(value).trim() === "") {
    return null;
  }
  return number(value);
}

function strings(value: FormDataEntryValue | null): string[] {
  if (value === null) {
    return [];
  }
  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function productFromForm(
  formData: FormData,
  existing?: Product,
): Omit<Product, "id" | "slug" | "createdAt"> & { slug?: string } {
  const stock = number(formData.get("stock"));
  const availabilityValue = String(formData.get("availability") ?? "in-stock");
  const availability = ["in-stock", "low-stock", "preorder", "out-of-stock"].includes(
    availabilityValue,
  )
    ? (availabilityValue as Product["availability"])
    : "in-stock";

  const badgeValue = String(formData.get("badge") ?? "");
  const badge = ["new", "hit", "sale", "few", "out", "bestseller"].includes(badgeValue)
    ? (badgeValue as Product["badge"])
    : "";

  const existingArt = existing?.art ?? null;

  return {
    name: String(formData.get("name") ?? "").trim(),
    shortDescription: String(formData.get("shortDescription") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: number(formData.get("price")),
    oldPrice: optionalNumber(formData.get("oldPrice")),
    categoryId: String(formData.get("categoryId") ?? ""),
    images: strings(formData.get("images")),
    art: existingArt,
    weight: String(formData.get("weight") ?? "").trim(),
    stock,
    availability: stock === 0 && availability !== "preorder" ? "out-of-stock" : availability,
    badge,
    featured: formData.get("featured") === "on",
    ingredients: String(formData.get("ingredients") ?? "").trim(),
    origin: String(formData.get("origin") ?? "").trim(),
    sku: String(formData.get("sku") ?? "").trim(),
  };
}

function validateProduct(draft: ReturnType<typeof productFromForm>): string | null {
  if (!draft.name) return "Вкажіть назву товару.";
  if (!draft.categoryId) return "Оберіть категорію.";
  if (draft.price <= 0) return "Ціна має бути більшою за нулем.";
  if (!draft.description) return "Додайте опис товару.";
  if (draft.oldPrice && draft.oldPrice <= draft.price) {
    return "Стара ціна має бути більшою за поточну.";
  }
  return null;
}

export async function createProductAction(formData: FormData): Promise<{
  ok: boolean;
  error: string | null;
  productId?: string;
}> {
  await requireAdmin();

  const draft = productFromForm(formData);
  const validationError = validateProduct(draft);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  const product = createProduct(draft);
  revalidateCatalog();
  return { ok: true, error: null, productId: product.id };
}

export async function updateProductAction(
  productId: string,
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const draft = productFromForm(formData);
  const validationError = validateProduct(draft);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  updateProduct(productId, draft);
  revalidateCatalog();
  return { ok: true, error: null };
}

export async function deleteProductAction(productId: string): Promise<void> {
  await requireAdmin();
  deleteProduct(productId);
  revalidateCatalog();
}

export async function createCategoryAction(
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Вкажіть назву категорії." };
  }

  createCategory({
    slug: String(formData.get("slug") ?? "").trim() || name.toLowerCase(),
    name,
    description: String(formData.get("description") ?? "").trim(),
    image: null,
    art: null,
    order: number(formData.get("order")),
  });
  revalidateCatalog();
  return { ok: true, error: null };
}

export async function updateCategoryAction(
  categoryId: string,
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Вкажіть назву категорії." };
  }

  updateCategory(categoryId, {
    name,
    slug: String(formData.get("slug") ?? "").trim() || name.toLowerCase(),
    description: String(formData.get("description") ?? "").trim(),
    order: number(formData.get("order")),
  });
  revalidateCatalog();
  return { ok: true, error: null };
}

export async function deleteCategoryAction(categoryId: string): Promise<void> {
  await requireAdmin();
  deleteCategory(categoryId);
  revalidateCatalog();
}

export async function createBannerAction(
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { ok: false, error: "Вкажіть заголовок банера." };
  }

  createBanner({
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim(),
    ctaHref: String(formData.get("ctaHref") ?? "").trim(),
    position: String(formData.get("position") ?? "promo") as Banner["position"],
    images: readBannerImages(formData, {
      desktop: null,
      tablet: null,
      mobile: null,
    }),
    accent: String(formData.get("accent") ?? "#b4342a"),
    active: formData.get("active") === "on",
    order: number(formData.get("order")),
  });
  revalidateCatalog();
  return { ok: true, error: null };
}

export async function updateBannerAction(
  bannerId: string,
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { ok: false, error: "Вкажіть заголовок банера." };
  }

  const current = await getCurrentBanner(bannerId);
  if (!current) {
    return { ok: false, error: "Банер не знайдено." };
  }

  updateBanner(bannerId, {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim(),
    ctaHref: String(formData.get("ctaHref") ?? "").trim(),
    position: String(formData.get("position") ?? "promo") as Banner["position"],
    images: readBannerImages(formData, current.images),
    accent: String(formData.get("accent") ?? "#b4342a"),
    active: formData.get("active") === "on",
    order: number(formData.get("order")),
  });
  revalidateCatalog();
  return { ok: true, error: null };
}

function readBannerImages(
  formData: FormData,
  current: Banner["images"],
): Banner["images"] {
  const clear = formData.get("clearImages") === "on";
  if (clear) {
    return { desktop: null, tablet: null, mobile: null };
  }
  return {
    desktop: String(formData.get("desktopImage") ?? (current.desktop || "")),
    tablet: String(formData.get("tabletImage") ?? (current.tablet || "")),
    mobile: String(formData.get("mobileImage") ?? (current.mobile || "")),
  };
}

async function getCurrentBanner(bannerId: string): Promise<Banner | null> {
  const { listBanners } = await import("@/lib/db/repository");
  return listBanners().find((banner) => banner.id === bannerId) ?? null;
}

export async function deleteBannerAction(bannerId: string): Promise<void> {
  await requireAdmin();
  deleteBanner(bannerId);
  revalidateCatalog();
}

export async function updateSettingsAction(
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const patch: Partial<StoreSettings> = {
    storeName: String(formData.get("storeName") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    contactEmail: String(formData.get("contactEmail") ?? "").trim(),
    contactPhone: String(formData.get("contactPhone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    workingHours: String(formData.get("workingHours") ?? "").trim(),
    instagram: String(formData.get("instagram") ?? "").trim(),
    facebook: String(formData.get("facebook") ?? "").trim(),
    telegram: String(formData.get("telegram") ?? "").trim(),
    freeShippingThreshold: number(formData.get("freeShippingThreshold")),
    shippingCost: number(formData.get("shippingCost")),
    legalNote: String(formData.get("legalNote") ?? "").trim(),
  };

  if (!patch.storeName) {
    return { ok: false, error: "Назва магазину обов'язкова." };
  }

  updateSettings(patch);
  revalidateCatalog();
  return { ok: true, error: null };
}
