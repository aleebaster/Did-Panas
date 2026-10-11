import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/controls";
import { BannerForm } from "@/components/admin/banner-form";
import { createBannerAction } from "@/lib/actions/catalog";

export const metadata: Metadata = { title: "Новий банер" };

export default function NewBannerPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Новий банер"
        description="Заголовок обовʼязковий. Без зображення банер намалюється кольором акценту."
      />
      <BannerForm banner={null} action={createBannerAction} />
    </div>
  );
}
