import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/controls";
import { ProductForm } from "@/components/admin/product-form";
import { createProductAction } from "@/lib/actions/catalog";
import { listCategories } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Новий товар" };

export default function NewProductPage() {
  const categories = listCategories();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Новий товар"
        description="Заповніть картку товару: назва, ціна, категорія та опис обовʼязкові."
      />
      <ProductForm product={null} categories={categories} action={createProductAction} />
    </div>
  );
}
