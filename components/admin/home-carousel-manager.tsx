"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete, FormError } from "@/components/admin/controls";
import { NativeSelect } from "@/components/admin/native-select";
import {
  useAdminAction,
  type AdminActionResult,
} from "@/components/admin/use-admin-action";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addHomeCarouselItemAction,
  deleteHomeCarouselItemAction,
  moveHomeCarouselItemAction,
  updateHomeCarouselItemAction,
  updateHomeCarouselSettingsAction,
} from "@/lib/actions/home-carousel";
import { deleteImageFile, uploadImageFile } from "@/lib/upload-client";
import { cn } from "@/lib/utils";
import type { HomeCarouselItem, HomeCarouselSettings, Product } from "@/types";

const ACCEPTED = "image/jpeg,image/jpg,image/png,image/webp";

function useToastEffect(state: AdminActionResult, message: string) {
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      toast.success(message);
      router.refresh();
      return;
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [message, router, state]);
}

function CarouselSettingsForm({
  settings,
}: {
  settings: HomeCarouselSettings;
}) {
  const [state, formAction, pending] = useAdminAction(
    updateHomeCarouselSettingsAction,
  );
  useToastEffect(state, "Налаштування каруселі збережено");

  return (
    <section className="card-paper space-y-4 p-5">
      <p className="eyebrow">Налаштування секції</p>
      <p className="text-sm text-muted-foreground">
        Заголовок і підзаголовок показуються над карусселлю «Наші товари» на
        головній сторінці.
      </p>

      <form action={formAction} className="space-y-4">
        <FormError error={state.error} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="carouselTitle">Заголовок</Label>
            <Input
              id="carouselTitle"
              name="title"
              required
              defaultValue={settings.title}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carouselSubtitle">Підзаголовок</Label>
            <Input
              id="carouselSubtitle"
              name="subtitle"
              defaultValue={settings.subtitle}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="carouselInterval">Інтервал автопрокрутки, мс</Label>
          <Input
            id="carouselInterval"
            name="autoplayInterval"
            type="number"
            min={1000}
            max={20000}
            step={500}
            className="max-w-40"
            defaultValue={settings.autoplayInterval}
          />
          <p className="text-xs text-muted-foreground">
            Від 1000 до 20000 мс. Автопрокрутка зупиняється, коли курсор
            наведено на карусель.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="enabled" defaultChecked={settings.enabled} />
            Увімкнути секцію на головній
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="autoplay" defaultChecked={settings.autoplay} />
            Автопрокрутка
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="showArrows" defaultChecked={settings.showArrows} />
            Показувати стрілки
          </label>
        </div>

        <Button type="submit" disabled={pending} className="btn-vintage h-10 gap-2">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Зберегти налаштування
        </Button>
      </form>
    </section>
  );
}

function AddItemForm({
  products,
  usedIds,
}: {
  products: Product[];
  usedIds: Set<string>;
}) {
  const [state, formAction, pending] = useAdminAction(addHomeCarouselItemAction);
  useToastEffect(state, "Картку додано до каруселі");

  const firstFree = products.find((product) => !usedIds.has(product.id));

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="newProductId" className="text-xs">
          Додати товар
        </Label>
        <NativeSelect
          name="productId"
          id="newProductId"
          defaultValue={firstFree?.id ?? ""}
          className="h-9 w-64"
        >
          {products.map((product) => (
            <option
              key={product.id}
              value={product.id}
              disabled={usedIds.has(product.id)}
            >
              {product.name}
              {usedIds.has(product.id) ? " — вже в каруселі" : ""}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" variant="outline" disabled={pending} className="h-9 gap-2">
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Додати до каруселі
      </Button>
    </form>
  );
}

function MoveButtons({
  itemId,
  isFirst,
  isLast,
}: {
  itemId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function move(direction: -1 | 1) {
    startTransition(async () => {
      const result = await moveHomeCarouselItemAction(itemId, direction);
      if (!result.ok) {
        toast.error(result.error ?? "Не вдалося змінити порядок");
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending || isFirst}
        onClick={() => move(-1)}
        aria-label="Вище"
        className="h-8 gap-1.5 px-2"
      >
        <ArrowUp className="size-4" />
        Вище
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending || isLast}
        onClick={() => move(1)}
        aria-label="Нижче"
        className="h-8 gap-1.5 px-2"
      >
        <ArrowDown className="size-4" />
        Нижче
      </Button>
    </div>
  );
}

function CarouselItemCard({
  item,
  product,
  products,
  isFirst,
  isLast,
}: {
  item: HomeCarouselItem;
  product: Product | undefined;
  products: Product[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [state, formAction, pending] = useAdminAction(
    updateHomeCarouselItemAction.bind(null, item.id),
  );
  useToastEffect(state, "Картку каруселі збережено");

  const [image, setImage] = useState(item.image ?? "");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    const result = await uploadImageFile("carousel", file);
    setBusy(false);
    if (result.ok && result.url) {
      setImage(result.url);
      toast.success("Зображення завантажено — не забудьте зберегти картку");
    } else {
      toast.error(result.error ?? "Не вдалося завантажити зображення");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDeleteFile() {
    if (!image) return;
    if (
      !window.confirm(
        "Видалити файл із сховища? Посилання прибереться з картки — не забудьте зберегти.",
      )
    ) {
      return;
    }
    setDeleting(true);
    const result = await deleteImageFile(image);
    setDeleting(false);
    if (result.ok) {
      setImage("");
      toast.success("Файл видалено зі сховища — не забудьте зберегти картку");
    } else {
      toast.error(result.error ?? "Не вдалося видалити файл");
    }
  }

  const preview = image || product?.images[0] || "";

  return (
    <form
      action={formAction}
      className="card-paper space-y-4 border p-5"
      data-testid="carousel-item-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold tracking-wide">
          Картка «{product?.name ?? "невідомий товар"}»
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <MoveButtons itemId={item.id} isFirst={isFirst} isLast={isLast} />
          <ConfirmDelete
            action={deleteHomeCarouselItemAction.bind(null, item.id)}
            confirmText={`Прибрати «${product?.name ?? "товар"}» з каруселі?`}
          />
        </div>
      </div>

      <FormError error={state.error} />

      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        <div className="space-y-2">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              void handleFile(event.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-2 border-dashed border-border bg-cream/40 p-2 transition",
              dragOver && "border-brick bg-brick/5",
            )}
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : preview ? (
              <Image
                src={preview}
                alt=""
                width={320}
                height={240}
                unoptimized
                data-testid="carousel-image-preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <p className="px-2 text-center text-xs text-muted-foreground">
                Фото відсутнє. Перетягніть файл сюди або натисніть
                «Завантажити фотографію».
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              data-testid="upload-carousel-image"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="h-8 gap-1.5 px-2"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Завантажити фотографію
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || !image}
              onClick={() => setImage("")}
              className="h-8 gap-1.5 px-2"
            >
              <RotateCcw className="size-4" />
              Фото товару
            </Button>
            {image && !image.startsWith("/images/") ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy || deleting}
                onClick={() => void handleDeleteFile()}
                data-testid="delete-carousel-image"
                className="h-8 gap-1.5 px-2 text-brick hover:bg-brick/10 hover:text-brick"
              >
                {deleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Видалити файл
              </Button>
            ) : null}
          </div>

          <input
            type="hidden"
            name="image"
            value={image}
            data-testid="carousel-image-value"
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG або WEBP, до 10 МБ. Якщо фото не задано, на головній
            показується фото товару.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`product-${item.id}`}>Товар</Label>
            <NativeSelect
              id={`product-${item.id}`}
              name="productId"
              defaultValue={item.productId}
            >
              {products.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`name-${item.id}`}>Назва в каруселі</Label>
            <Input
              id={`name-${item.id}`}
              name="name"
              defaultValue={item.name}
              placeholder={product?.name ?? "Назва товару"}
            />
            <p className="text-xs text-muted-foreground">
              Порожньо — використовується назва товару з каталогу.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`description-${item.id}`}>
              Короткий опис під назвою
            </Label>
            <Textarea
              id={`description-${item.id}`}
              name="description"
              rows={2}
              defaultValue={item.description}
              placeholder={product?.shortDescription ?? "Короткий опис"}
            />
            <p className="text-xs text-muted-foreground">
              Порожньо — використовується опис товару з каталогу.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="active" defaultChecked={item.active} />
            Показувати в каруселі
          </label>

          <Button
            type="submit"
            variant="outline"
            disabled={pending}
            className="h-9 gap-2"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Зберегти картку
          </Button>
        </div>
      </div>
    </form>
  );
}

export function HomeCarouselManager({
  settings,
  items,
  products,
}: {
  settings: HomeCarouselSettings;
  items: HomeCarouselItem[];
  products: Product[];
}) {
  const sorted = items.slice().sort((a, b) => a.order - b.order);
  const usedIds = new Set(sorted.map((item) => item.productId));
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <div className="space-y-6">
      <CarouselSettingsForm settings={settings} />

      <section className="card-paper space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Картки каруселі</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Фото, назва та опис можуть бути своїми — ціна й посилання на
              сторінку товару завжди беруться з каталогу.
            </p>
          </div>
          <AddItemForm products={products} usedIds={usedIds} />
        </div>

        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Карток поки немає. Додайте товар — і він з&apos;явиться в каруселі
            на головній. Якщо карток немає взагалі, показуються всі товари
            каталогу.
          </p>
        ) : (
          <ul className="space-y-4">
            {sorted.map((item, index) => (
              <li key={item.id}>
                <CarouselItemCard
                  item={item}
                  product={productsById.get(item.productId)}
                  products={products}
                  isFirst={index === 0}
                  isLast={index === sorted.length - 1}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
