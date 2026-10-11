import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/controls";
import { BannerForm } from "@/components/admin/banner-form";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteBannerAction, updateBannerAction } from "@/lib/actions/catalog";
import { listBanners } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Редагування банера" };

export default function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Редагування банера"
        description="Зміни зʼявляються на головній сторінці одразу після збереження."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <BannerEditBody params={params} />
      </Suspense>
    </div>
  );
}

async function BannerEditBody({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const banner = listBanners().find((item) => item.id === id);

  if (!banner) {
    notFound();
  }

  return (
    <BannerForm
      banner={banner}
      action={updateBannerAction.bind(null, banner.id)}
      onDelete={deleteBannerAction.bind(null, banner.id)}
    />
  );
}
