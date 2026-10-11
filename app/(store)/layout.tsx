import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCatalog } from "@/lib/catalog";

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const catalog = await getCatalog();

  return (
    <CartProvider>
      <SiteHeader categories={catalog.categories} settings={catalog.settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter categories={catalog.categories} settings={catalog.settings} />
    </CartProvider>
  );
}
