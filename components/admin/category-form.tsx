"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAction, type AdminActionResult } from "@/components/admin/use-admin-action";
import { useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { DeleteRedirect, FormError } from "@/components/admin/controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/types";

type ActionResult = AdminActionResult;

export function CategoryForm({
  category,
  action,
  onDelete,
}: {
  category: Category | null;
  action: (formData: FormData) => Promise<ActionResult>;
  onDelete?: () => Promise<void>;
}) {
  const [state, formAction, pending] = useAdminAction(action);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      toast.success("Збережено");
      router.push("/admin/categories");
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

      <div className="card-paper max-w-2xl space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="name">Назва категорії</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={category?.name ?? ""}
            placeholder="Сушені гриби"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="slug">URL-слово</Label>
            <Input
              id="slug"
              name="slug"
              defaultValue={category?.slug ?? ""}
              placeholder="susheni-hryby"
            />
            <p className="text-xs text-muted-foreground">
              За порожнього значення береться транслітерація назви.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Порядок у меню</Label>
            <Input
              id="order"
              name="order"
              type="number"
              step="1"
              defaultValue={category?.order ?? 0}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Опис</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={category?.description ?? ""}
            placeholder="Короткий опис для сторінки категорії"
          />
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
          <Link href="/admin/categories">Скасувати</Link>
        </Button>
        {onDelete ? (
          <div className="ml-auto">
            <DeleteRedirect
              action={onDelete}
              href="/admin/categories"
              confirmText={`Видалити категорію «${category?.name}»?`}
            />
          </div>
        ) : null}
      </div>
    </form>
  );
}
