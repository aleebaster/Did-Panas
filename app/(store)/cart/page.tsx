import type { Metadata } from "next";
import Link from "next/link";

import { CartView } from "@/components/cart/cart-view";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Кошик",
  description: "Ваш кошик у магазині Did Panas.",
};

export default async function CartPage() {
  const { settings } = await getCatalog();

  return (
    <div className="container-page py-10 lg:py-14">
      <nav aria-label="Хлібні крихти" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground hover:underline">
          Головна
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Кошик</span>
      </nav>

      <header className="mt-4 border-b border-border pb-6">
        <p className="eyebrow">Крок 1 з 2</p>
        <h1 className="heading-lg mt-2">Кошик</h1>
      </header>

      <CartView settings={settings} />
    </div>
  );
}
