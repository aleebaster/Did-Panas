import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/controls";
import { ProductForm } from "@/components/admin/product-form";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteProductAction, updateProductAction } from "@/lib/actions/catalog";
import { getProduct, listCategories } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Редагування товару" };

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Редагування товару"
        description="Оновіть дані та збережіть — зміни застосуються одразу."
      />
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        }
      >
        <ProductEditBody params={params} />
      </Suspense>
    </div>
  );
}

async function ProductEditBody({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <ProductForm
      product={product}
      categories={listCategories()}
      action={updateProductAction.bind(null, product.id)}
      onDelete={deleteProductAction.bind(null, product.id)}
    />
  );
}
