import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/db/repository";

export const instant = false;

export const metadata: Metadata = {
  title: { default: "Адмін-панель", template: "%s · Адмін · Did Panas" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await connection();
  await requireAdmin();

  const newOrders = listOrders().filter((order) => order.status === "new").length;

  return <AdminShell newOrders={newOrders}>{children}</AdminShell>;
}
