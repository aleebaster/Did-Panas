"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAction, type AdminActionResult } from "@/components/admin/use-admin-action";
import { useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  DeleteRedirect,
  FormError,
  ImagesList,
} from "@/components/admin/controls";
import { NativeSelect } from "@/components/admin/native-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Product } from "@/types";

type ActionResult = AdminActionResult;

const AVAILABILITY_OPTIONS = [
  { value: "in-stock", label: "Є у наявності" },
  { value: "low-stock", label: "Залишилось мало" },
  { value: "preorder", label: "Передзамовлення" },
  { value: "out-of-stock", label: "Немає у наявності" },
];

const BADGE_OPTIONS = [
  { value: "-", label: "Без бейджа" },
  { value: "new", label: "Новинка" },
  { value: "hit", label: "Хіт" },
  { value: "sale", label: "Акція" },
  { value: "few", label: "Залишилось мало" },
  { value: "out", label: "Немає у наявності" },
  { value: "bestseller", label: "Бестселер" },
];

export function ProductForm({
  product,
  categories,
  action,
  onDelete,
}: {
  product: Product | null;
  categories: Category[];
  action: (formData: FormData) => Promise<ActionResult>;
  onDelete?: () => Promise<void>;
}) {
  const [state, formAction, pending] = useAdminAction(action);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      toast.success("Збережено");
      router.push("/admin/products");
      router.refresh();
      return;
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  if (categories.length === 0) {
    return (
      <div className="card-paper p-5">
        <FormError error="Спочатку створіть хоча б одну категорію." />
        <p className="mt-3 text-sm text-muted-foreground">
          Без категорії товар створити не можна.
        </p>
        <Button asChild variant="outline" className="mt-4 h-9">
          <Link href="/admin/categories">Перейти до категорій</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <FormError error={state.error} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="card-paper space-y-4 p-5">
            <p className="eyebrow">Основне</p>

            <div className="space-y-2">
              <Label htmlFor="name">Назва товару</Label>
              <Input
                id="name"
                name="name"
                defaultValue={product?.name ?? ""}
                required
                placeholder="Кордицепс військовий, 60 капсул"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">Артикул (SKU)</Label>
                <Input
                  id="sku"
                  name="sku"
                  defaultValue={product?.sku ?? ""}
                  placeholder="DP-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Вага / обсяг</Label>
                <Input
                  id="weight"
                  name="weight"
                  defaultValue={product?.weight ?? ""}
                  placeholder="100 г"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Короткий опис</Label>
              <Textarea
                id="shortDescription"
                name="shortDescription"
                rows={2}
                defaultValue={product?.shortDescription ?? ""}
                placeholder="Одне-два речення для картки товару"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Повний опис</Label>
              <Textarea
                id="description"
                name="description"
                rows={7}
                defaultValue={product?.description ?? ""}
                required
                placeholder="Походження, смак, як використовувати"
              />
            </div>
          </div>

          <div className="card-paper space-y-4 p-5">
            <p className="eyebrow">Склад і зображення</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ingredients">Склад</Label>
                <Textarea
                  id="ingredients"
                  name="ingredients"
                  rows={3}
                  defaultValue={product?.ingredients ?? ""}
                  placeholder="Порошок кордицепсу"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin">Походження</Label>
                <Textarea
                  id="origin"
                  name="origin"
                  rows={3}
                  defaultValue={product?.origin ?? ""}
                  placeholder="Україна, Карпати"
                />
              </div>
            </div>

            <ImagesList
              label="Зображення товару"
              value={product?.images ?? []}
              folder="products"
            />
            <p className="text-xs text-muted-foreground">
              Перше зображення використовується як головне в каталозі. Для
              товарів без фото застосовується брендована ілюстрація.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-paper space-y-4 p-5">
            <p className="eyebrow">Ціна та склад</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Ціна, ₴</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  step="1"
                  required
                  defaultValue={product?.price ?? ""}
                  placeholder="420"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oldPrice">Стара ціна, ₴</Label>
                <Input
                  id="oldPrice"
                  name="oldPrice"
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={product?.oldPrice ?? ""}
                  placeholder="порожньо, якщо знижки немає"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Залишок, шт</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min={0}
                step="1"
                required
                defaultValue={product?.stock ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Категорія</Label>
              <NativeSelect
                name="categoryId"
                defaultValue={
                  product?.categoryId ?? categories[0]?.id ?? ""
                }
                ariaLabel="Категорія товару"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Наявність</Label>
              <NativeSelect
                name="availability"
                defaultValue={product?.availability ?? "in-stock"}
                ariaLabel="Наявність"
              >
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge">Бейдж</Label>
              <NativeSelect
                name="badge"
                defaultValue={product?.badge || "-"}
                ariaLabel="Бейдж"
              >
                {BADGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <label className="flex items-center gap-2.5 pt-1">
              <Checkbox
                name="featured"
                defaultChecked={product?.featured ?? false}
              />
              <span className="text-sm">Показувати в добірці на головній</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={pending}
              className="btn-vintage h-10 gap-2"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Зберегти
            </Button>

            <Button
              asChild
              type="button"
              variant="outline"
              className="h-10"
            >
              <Link href="/admin/products" className="inline-flex h-10 items-center px-4 text-sm">
                Скасувати
              </Link>
            </Button>

            {onDelete ? (
              <div className="ml-auto">
                <DeleteRedirect
                  action={onDelete}
                  href="/admin/products"
                  confirmText={`Видалити товар «${product?.name}»?`}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
