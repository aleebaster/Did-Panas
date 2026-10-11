"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { ProductArt } from "@/components/product/product-media";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/format";
import type { StoreSettings } from "@/types";

export function CartView({ settings }: { settings: StoreSettings }) {
  const { lines, subtotal, setQuantity, remove, clear } = useCart();
  const shipping =
    subtotal >= settings.freeShippingThreshold || subtotal === 0
      ? 0
      : settings.shippingCost;
  const remaining = Math.max(settings.freeShippingThreshold - subtotal, 0);

  if (lines.length === 0) {
    return (
      <div className="mt-10 border border-dashed border-border bg-paper px-6 py-20 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-muted">
          <ShoppingBag className="size-7 text-muted-foreground" />
        </div>
        <h2 className="heading-md mt-5">Кошик порожній</h2>
        <p className="mt-2 text-muted-foreground">
          Додайте товари з каталогу — і вони зʼявляться тут.
        </p>
        <Button asChild size="lg" className="btn-vintage mt-6 h-11 px-6">
          <Link href="/catalog">Перейти до каталогу</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <ul className="divide-y divide-border border-y border-border">
          {lines.map((line) => (
            <li key={line.productId} className="flex gap-4 py-5">
              <Link
                href={`/product/${line.slug}`}
                className="relative size-24 shrink-0 overflow-hidden border border-border bg-muted sm:size-28"
              >
                {line.image ? (
                  <Image
                    src={line.image}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : (
                  <ProductArt art={line.art} name={line.name} />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/product/${line.slug}`}
                      className="font-medium hover:underline"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {line.weight} · {formatPrice(line.price)} за шт.
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Прибрати ${line.name}`}
                    onClick={() => remove(line.productId)}
                    className="text-muted-foreground transition hover:text-brick"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-center justify-between gap-4 pt-3">
                  <div className="flex h-9 items-center rounded-md border border-border">
                    <button
                      type="button"
                      aria-label="Зменшити кількість"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-7 text-center text-sm font-medium tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Збільшити кількість"
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-display text-lg font-semibold">
                    {formatPrice(line.price * line.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-brick hover:underline"
          >
            Очистити кошик
          </button>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-medium text-brick"
          >
            Продовжити покупки
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <aside className="h-fit border border-border bg-cream p-5">
        <h2 className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
          Ваше замовлення
        </h2>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Товари</dt>
            <dd className="font-medium">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Доставка</dt>
            <dd className="font-medium">
              {shipping === 0 ? "безкоштовно" : formatPrice(shipping)}
            </dd>
          </div>
        </dl>

        {remaining > 0 && (
          <p className="mt-3 bg-paper px-3 py-2 text-xs text-muted-foreground">
            Додайте товарів на {formatPrice(remaining)} — і доставка буде
            безкоштовною.
          </p>
        )}

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold uppercase">Разом</span>
          <span className="font-display text-2xl font-semibold">
            {formatPrice(subtotal + shipping)}
          </span>
        </div>

        <Button asChild size="lg" className="btn-vintage mt-5 h-11 w-full">
          <Link href="/checkout">Оформити замовлення</Link>
        </Button>
      </aside>
    </div>
  );
}
