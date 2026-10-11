import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import {
  AdminPageHeader,
  ConfirmDelete,
} from "@/components/admin/controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "@/lib/actions/catalog";
import { listCategories, listProducts } from "@/lib/db/repository";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Товари" };

const BADGE_LABELS: Record<string, string> = {
  new: "Новинка",
  hit: "Хіт",
  sale: "Акція",
  few: "Мало",
  out: "Немає",
  bestseller: "Бестселер",
};

export default function AdminProductsPage() {
  const products = listProducts();
  const categories = listCategories();
  const categoryName = (id: string) =>
    categories.find((category) => category.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Товари"
        description={`${products.length} позицій у каталозі. Зміни одразу зʼявляються на сайті.`}
      >
        <Button asChild className="h-9 gap-2">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Новий товар
          </Link>
        </Button>
      </AdminPageHeader>

      {products.length === 0 ? (
        <div className="card-paper p-6 text-sm text-muted-foreground">
          Каталог порожній.{" "}
          <Link href="/admin/products/new" className="text-brick underline">
            Створіть перший товар
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Товар</th>
                <th className="px-4 py-3 font-medium">Категорія</th>
                <th className="px-4 py-3 font-medium">Ціна</th>
                <th className="px-4 py-3 font-medium">Залишок</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 text-right font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          width={44}
                          height={44}
                          className="size-11 shrink-0 border border-border bg-cream object-cover"
                        />
                      ) : (
                        <div className="grid size-11 shrink-0 place-items-center border border-border bg-cream font-display text-xs">
                          DP
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sku} · {product.weight || "без ваги"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {categoryName(product.categoryId)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(product.price)}
                    {product.oldPrice ? (
                      <span className="ml-2 text-xs text-muted-foreground line-through">
                        {formatPrice(product.oldPrice)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        product.stock === 0
                          ? "destructive"
                          : product.stock <= 3
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {product.stock} шт
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {product.badge ? (
                        <Badge>{BADGE_LABELS[product.badge] ?? product.badge}</Badge>
                      ) : null}
                      {product.featured ? (
                        <Badge variant="outline">В добірці</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2"
                      >
                        <Link href={`/admin/products/${product.id}`}>
                          <Pencil className="size-4" />
                          Редагувати
                        </Link>
                      </Button>
                      <ConfirmDelete
                        action={deleteProductAction.bind(null, product.id)}
                        confirmText={`Видалити товар «${product.name}»?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
