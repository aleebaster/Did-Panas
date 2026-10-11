import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";

import { AdminPageHeader, ConfirmDelete } from "@/components/admin/controls";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "@/lib/actions/catalog";
import { listCategories, listProducts } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Категорії" };

export default function AdminCategoriesPage() {
  const categories = listCategories();
  const products = listProducts();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Категорії"
        description="Порядок і назви визначають вигляд меню та сторінок каталогу."
      >
        <Button asChild className="h-9 gap-2">
          <Link href="/admin/categories/new">
            <Plus className="size-4" />
            Нова категорія
          </Link>
        </Button>
      </AdminPageHeader>

      {categories.length === 0 ? (
        <div className="card-paper p-6 text-sm text-muted-foreground">
          Категорій поки немає.{" "}
          <Link href="/admin/categories/new" className="text-brick underline">
            Створіть першу
          </Link>
          , щоб додавати товари.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Категорія</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Товарів</th>
                <th className="px-4 py-3 font-medium">Порядок</th>
                <th className="px-4 py-3 text-right font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{category.name}</p>
                    <p className="max-w-md truncate text-xs text-muted-foreground">
                      {category.description || "Без опису"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    /catalog?category={category.slug}
                  </td>
                  <td className="px-4 py-3">
                    {
                      products.filter(
                        (product) => product.categoryId === category.id,
                      ).length
                    }
                  </td>
                  <td className="px-4 py-3">{category.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2"
                      >
                        <Link href={`/admin/categories/${category.id}`}>
                          <Pencil className="size-4" />
                          Редагувати
                        </Link>
                      </Button>
                      <ConfirmDelete
                        action={deleteCategoryAction.bind(null, category.id)}
                        confirmText={`Видалити категорію «${category.name}»? Товари залишаться, але втратять привʼязку.`}
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
