import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/controls";
import { SettingsForm } from "@/components/admin/settings-form";
import { StorageStatusCard } from "@/components/admin/storage-status-card";
import { updateSettingsAction } from "@/lib/actions/catalog";
import { getSettings } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Налаштування" };

export default function AdminSettingsPage() {
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Налаштування"
        description="Реквізити, доставка, соцмережі та юридичний напис на всьому сайті."
      />
      <SettingsForm settings={settings} action={updateSettingsAction} />
      <StorageStatusCard />
    </div>
  );
}
