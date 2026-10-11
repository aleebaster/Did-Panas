"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";

import { ProductArt } from "@/components/product/product-media";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/components/cart/cart-provider";

interface CartDrawerProps {
  freeShippingThreshold: number;
  shippingCost: number;
}

export function CartDrawer({
  freeShippingThreshold,
  shippingCost,
}: CartDrawerProps) {
  const { lines, count, subtotal, isOpen, close, setQuantity, remove } = useCart();
  const remaining = Math.max(freeShippingThreshold - subtotal, 0);
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-l border-border bg-paper p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="font-display text-lg tracking-[0.12em] uppercase">
              Кошик · {count}
            </SheetTitle>
            <SheetClose
              aria-label="Закрити кошик"
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </SheetClose>
          </div>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-muted">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-base font-semibold uppercase">
                Кошик поки порожній
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Додайте товари з каталогу — вони зʼявляться тут.
              </p>
            </div>
            <Button asChild variant="outline" onClick={close}>
              <Link href="/catalog">До каталогу</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {lines.map((line) => (
                <div key={line.productId} className="flex gap-3 py-4">
                  <Link
                    href={`/product/${line.slug}`}
                    onClick={close}
                    className="relative size-20 shrink-0 overflow-hidden border border-border bg-muted"
                  >
                    {line.image ? (
                      <Image
                        src={line.image}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <ProductArt art={line.art} name={line.name} />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${line.slug}`}
                        onClick={close}
                        className="line-clamp-2 text-sm font-medium hover:underline"
                      >
                        {line.name}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Прибрати ${line.name}`}
                        onClick={() => remove(line.productId)}
                        className="text-muted-foreground transition hover:text-brick"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {line.weight}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          aria-label="Зменшити кількість"
                          onClick={() => setQuantity(line.productId, line.quantity - 1)}
                          className="grid size-7 place-items-center text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-medium">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Збільшити кількість"
                          onClick={() => setQuantity(line.productId, line.quantity + 1)}
                          className="grid size-7 place-items-center text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-sm font-semibold">
                        {formatPrice(line.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border bg-cream px-5 py-4">
              <div className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Truck className="mt-0.5 size-4 shrink-0" />
                <span>
                  {remaining > 0
                    ? `До безкоштовної доставки залишилось ${formatPrice(remaining)}`
                    : "Доставка безкоштовна для цього замовлення"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span>{shipping === 0 ? "безкоштовно" : formatPrice(shipping)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold tracking-wide uppercase">
                  Разом
                </span>
                <span className="font-display text-lg font-semibold">
                  {formatPrice(subtotal + shipping)}
                </span>
              </div>

              <div className="mt-4 grid gap-2">
                <Button asChild size="lg" className="btn-vintage h-11 w-full">
                  <Link href="/checkout" onClick={close}>
                    Оформити замовлення
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/cart" onClick={close}>
                    Перейти до кошика
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
