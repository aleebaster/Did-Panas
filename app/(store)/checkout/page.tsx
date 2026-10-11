import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Оформлення замовлення",
  description: "Оформлення замовлення в магазині Did Panas.",
};

export default async function CheckoutPage() {
  const { settings } = await getCatalog();

  return (
    <div className="container-page py-10 lg:py-14">
      <nav aria-label="Хлібні крихти" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground hover:underline">
          Головна
        </Link>
        <span className="mx-2">/</span>
        <Link href="/cart" className="hover:text-foreground hover:underline">
          Кошик
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Оформлення</span>
      </nav>

      <header className="mt-4 border-b border-border pb-6">
        <p className="eyebrow">Крок 2 з 2</p>
        <h1 className="heading-lg mt-2">Оформлення замовлення</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Заповніть контактні дані та оберіть спосіб доставки. Ми підтвердимо
          замовлення телефоном.
        </p>
      </header>

      <CheckoutForm settings={settings} />
    </div>
  );
}
