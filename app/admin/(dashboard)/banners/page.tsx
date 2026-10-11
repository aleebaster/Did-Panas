import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Pencil, Plus } from "lucide-react";

import { AdminPageHeader, ConfirmDelete } from "@/components/admin/controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteBannerAction } from "@/lib/actions/catalog";
import { listBanners } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Банери" };

const POSITION_LABELS: Record<string, string> = {
  hero: "Hero",
  strip: "Смуга",
  promo: "Промо",
};

export default function AdminBannersPage() {
  const banners = [...listBanners()].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Банери"
        description="Показуються на головній сторінці в порядку, заданому полем «Порядок»."
      >
        <Button asChild className="h-9 gap-2">
          <Link href="/admin/banners/new">
            <Plus className="size-4" />
            Новий банер
          </Link>
        </Button>
      </AdminPageHeader>

      {banners.length === 0 ? (
        <div className="card-paper p-6 text-sm text-muted-foreground">
          Банерів поки немає.{" "}
          <Link href="/admin/banners/new" className="text-brick underline">
            Створіть перший
          </Link>
          , щоб показати акцію на головній.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="card-paper flex flex-col gap-3 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold tracking-wide">
                    {banner.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {banner.subtitle || "Без підзаголовка"}
                  </p>
                </div>
                <div
                  className="size-8 shrink-0 rounded-md border border-border"
                  style={{ backgroundColor: banner.accent }}
                  aria-hidden
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{POSITION_LABELS[banner.position]}</Badge>
                <Badge variant={banner.active ? "default" : "secondary"}>
                  {banner.active ? "Активний" : "Прихований"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  порядок {banner.order}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {banner.ctaHref || "без посилання"}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3">
                <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
                  <Link href={banner.ctaHref || "/"} target="_blank">
                    <Eye className="size-4" />
                    Переглянути
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
                  <Link href={`/admin/banners/${banner.id}`}>
                    <Pencil className="size-4" />
                    Редагувати
                  </Link>
                </Button>
                <ConfirmDelete
                  action={deleteBannerAction.bind(null, banner.id)}
                  confirmText={`Видалити банер «${banner.title}»?`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
