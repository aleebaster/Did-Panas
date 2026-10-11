"use server";

import { revalidatePath, updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  createHomeCarouselItem,
  deleteHomeCarouselItem,
  moveHomeCarouselItem,
  updateHomeCarouselItem,
  updateHomeCarouselSettings,
} from "@/lib/db/repository";

function revalidate(): void {
  updateTag("catalog");
  revalidatePath("/", "layout");
}

function message(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function interval(value: FormDataEntryValue | null): number {
  const parsed = Number(String(value ?? ""));
  if (!Number.isFinite(parsed)) {
    return 4000;
  }
  return Math.min(20000, Math.max(1000, Math.round(parsed)));
}

export async function updateHomeCarouselSettingsAction(
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { ok: false, error: "Вкажіть заголовок каруселі." };
  }

  updateHomeCarouselSettings({
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    enabled: formData.get("enabled") === "on",
    autoplay: formData.get("autoplay") === "on",
    autoplayInterval: interval(formData.get("autoplayInterval")),
    showArrows: formData.get("showArrows") === "on",
  });
  revalidate();
  return { ok: true, error: null };
}

export async function addHomeCarouselItemAction(
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { ok: false, error: "Оберіть товар для каруселі." };
  }

  try {
    createHomeCarouselItem({
      productId,
      image: null,
      name: "",
      description: "",
      active: true,
    });
  } catch (error) {
    return { ok: false, error: message(error, "Не вдалося додати картку.") };
  }

  revalidate();
  return { ok: true, error: null };
}

export async function updateHomeCarouselItemAction(
  itemId: string,
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { ok: false, error: "Оберіть товар для каруселі." };
  }

  try {
    updateHomeCarouselItem(itemId, {
      productId,
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      image: String(formData.get("image") ?? "").trim() || null,
      active: formData.get("active") === "on",
    });
  } catch (error) {
    return { ok: false, error: message(error, "Не вдалося зберегти картку.") };
  }

  revalidate();
  return { ok: true, error: null };
}

export async function deleteHomeCarouselItemAction(itemId: string): Promise<void> {
  await requireAdmin();
  deleteHomeCarouselItem(itemId);
  revalidate();
}

export async function moveHomeCarouselItemAction(
  itemId: string,
  direction: -1 | 1,
): Promise<{ ok: boolean; error: string | null }> {
  await requireAdmin();
  moveHomeCarouselItem(itemId, direction);
  revalidate();
  return { ok: true, error: null };
}
