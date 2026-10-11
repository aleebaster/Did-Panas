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
  ImageInput,
} from "@/components/admin/controls";
import { NativeSelect } from "@/components/admin/native-select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Banner } from "@/types";

type ActionResult = AdminActionResult;

const POSITION_OPTIONS = [
  { value: "hero", label: "Головний екран (hero)" },
  { value: "strip", label: "Смуга під хедером" },
  { value: "promo", label: "Промо-банер" },
];

export function BannerForm({
  banner,
  action,
  onDelete,
}: {
  banner: Banner | null;
  action: (formData: FormData) => Promise<ActionResult>;
  onDelete?: () => Promise<void>;
}) {
  const [state, formAction, pending] = useAdminAction(action);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      toast.success("Збережено");
      router.push("/admin/banners");
      router.refresh();
      return;
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <FormError error={state.error} />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card-paper space-y-4 p-5">
          <p className="eyebrow">Текст банера</p>

          <div className="space-y-2">
            <Label htmlFor="title">Заголовок</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={banner?.title ?? ""}
              placeholder="Збір урожаю: сушені опеньки"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Підзаголовок</Label>
            <Textarea
              id="subtitle"
              name="subtitle"
              rows={3}
              defaultValue={banner?.subtitle ?? ""}
              placeholder="Коротке повідомлення під заголовком"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">Текст кнопки</Label>
              <Input
                id="ctaLabel"
                name="ctaLabel"
                defaultValue={banner?.ctaLabel ?? ""}
                placeholder="До каталогу"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaHref">Посилання кнопки</Label>
              <Input
                id="ctaHref"
                name="ctaHref"
                defaultValue={banner?.ctaHref ?? ""}
                placeholder="/catalog"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent">Акцент</Label>
            <div className="flex items-center gap-3">
              <input
                id="accent"
                name="accent"
                type="color"
                defaultValue={banner?.accent ?? "#b4342a"}
                className="h-9 w-16 cursor-pointer rounded-md border border-input bg-transparent p-1"
              />
              <p className="text-xs text-muted-foreground">
                Використовується, якщо для банера немає зображення.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-paper space-y-4 p-5">
            <p className="eyebrow">Розміщення</p>

            <div className="space-y-2">
              <Label htmlFor="position">Позиція</Label>
              <NativeSelect
                name="position"
                defaultValue={banner?.position ?? "promo"}
                ariaLabel="Позиція банера"
              >
                {POSITION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Порядок</Label>
              <Input
                id="order"
                name="order"
                type="number"
                step="1"
                defaultValue={banner?.order ?? 0}
              />
            </div>

            <label className="flex items-center gap-2.5">
              <Checkbox name="active" defaultChecked={banner?.active ?? true} />
              <span className="text-sm">Активний (видно на сайті)</span>
            </label>
          </div>

          <div className="card-paper space-y-4 p-5">
            <p className="eyebrow">Зображення</p>
            <ImageInput
              name="desktopImage"
              label="Десктоп"
              folder="banners"
              value={banner?.images.desktop ?? ""}
            />
            <ImageInput
              name="tabletImage"
              label="Планшет"
              folder="banners"
              value={banner?.images.tablet ?? ""}
            />
            <ImageInput
              name="mobileImage"
              label="Мобільний"
              folder="banners"
              value={banner?.images.mobile ?? ""}
            />
            <label className="flex items-center gap-2.5">
              <Checkbox name="clearImages" />
              <span className="text-sm">Очистити всі зображення</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} className="btn-vintage h-10 gap-2">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Зберегти
        </Button>
        <Button asChild variant="outline" className="h-10">
          <Link href="/admin/banners">Скасувати</Link>
        </Button>
        {onDelete ? (
          <div className="ml-auto">
            <DeleteRedirect
              action={onDelete}
              href="/admin/banners"
              confirmText={`Видалити банер «${banner?.title}»?`}
            />
          </div>
        ) : null}
      </div>
    </form>
  );
}
