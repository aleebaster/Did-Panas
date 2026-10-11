"use client";

import { useRouter } from "next/navigation";
import { useAdminAction, type AdminActionResult } from "@/components/admin/use-admin-action";
import { useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { FormError } from "@/components/admin/controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoreSettings } from "@/types";

type ActionResult = AdminActionResult;

export function SettingsForm({
  settings,
  action,
}: {
  settings: StoreSettings;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useAdminAction(action);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      toast.success("Налаштування збережено");
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-paper space-y-4 p-5">
          <p className="eyebrow">Магазин</p>

          <div className="space-y-2">
            <Label htmlFor="storeName">Назва магазину</Label>
            <Input
              id="storeName"
              name="storeName"
              required
              defaultValue={settings.storeName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Слоган (смуга під хедером)</Label>
            <Input id="tagline" name="tagline" defaultValue={settings.tagline} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Телефон</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                defaultValue={settings.contactPhone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адреса</Label>
            <Input id="address" name="address" defaultValue={settings.address} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workingHours">Графік роботи</Label>
            <Input
              id="workingHours"
              name="workingHours"
              defaultValue={settings.workingHours}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-paper space-y-4 p-5">
            <p className="eyebrow">Доставка</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">
                  Безкоштовно від, ₴
                </Label>
                <Input
                  id="freeShippingThreshold"
                  name="freeShippingThreshold"
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={settings.freeShippingThreshold}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingCost">Вартість доставки, ₴</Label>
                <Input
                  id="shippingCost"
                  name="shippingCost"
                  type="number"
                  min={0}
                  step="1"
                  defaultValue={settings.shippingCost}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Для самовивозу доставка завжди безкоштовна — це обробляється
              окремо під час оформлення.
            </p>
          </div>

          <div className="card-paper space-y-4 p-5">
            <p className="eyebrow">Соціальні мережі</p>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                name="instagram"
                defaultValue={settings.instagram}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                name="facebook"
                defaultValue={settings.facebook}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                name="telegram"
                defaultValue={settings.telegram}
                placeholder="https://t.me/..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card-paper space-y-4 p-5">
        <p className="eyebrow">Правовий напис</p>
        <div className="space-y-2">
          <Label htmlFor="legalNote">Текст дисклеймера</Label>
          <Textarea
            id="legalNote"
            name="legalNote"
            rows={3}
            defaultValue={settings.legalNote}
          />
          <p className="text-xs text-muted-foreground">
            Показується в футері та на сторінках контактів і умов.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="btn-vintage h-10 gap-2">
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Зберегти налаштування
        </Button>
      </div>
    </form>
  );
}
