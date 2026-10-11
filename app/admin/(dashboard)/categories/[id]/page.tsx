import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/controls";
import { CategoryForm } from "@/components/admin/category-form";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteCategoryAction, updateCategoryAction } from "@/lib/actions/catalog";
import { listCategories } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Редагування категорії" };

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Редагування категорії"
        description="Назва та порядок оновлюються в меню одразу після збереження."
      />
      <Suspense fallback={<Skeleton className="h-72 w-full max-w-2xl" />}>
        <CategoryEditBody params={params} />
      </Suspense>
    </div>
  );
}

async function CategoryEditBody({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = listCategories().find((item) => item.id === id);

  if (!category) {
    notFound();
  }

  return (
    <CategoryForm
      category={category}
      action={updateCategoryAction.bind(null, category.id)}
      onDelete={deleteCategoryAction.bind(null, category.id)}
    />
  );
}
