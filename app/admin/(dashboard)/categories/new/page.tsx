import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/controls";
import { CategoryForm } from "@/components/admin/category-form";
import { createCategoryAction } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "Нова категорія" };

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Нова категорія"
        description="Назва обовʼязкова, URL-слово підставляється автоматично."
      />
      <CategoryForm category={null} action={createCategoryAction} />
    </div>
  );
}
