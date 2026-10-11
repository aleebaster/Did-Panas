"use client";

import { useState } from "react";
import { Check, Loader2, Minus, Plus, ShoppingBag, Truck } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface BuyPanelProps {
  product: Product;
  freeShippingThreshold: number;
}

export function BuyPanel({ product, freeShippingThreshold }: BuyPanelProps) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState<"idle" | "pending" | "added">("idle");

  const soldOut = product.availability === "out-of-stock" || product.stock === 0;
  const max = Math.max(product.stock, 1);

  function handleChange(next: number) {
    setQuantity(Math.min(Math.max(next, 1), max));
  }

  function handleAdd() {
    setState("pending");
    add(product, quantity);
    window.setTimeout(() => setState("added"), 400);
    window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <div className="border border-border bg-paper p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            {product.weight}
          </p>
          <p className="mt-1 font-display text-3xl leading-none font-semibold">
            {product.price} ₴
          </p>
        </div>
        {product.oldPrice ? (
          <div className="text-right">
            <p className="text-sm text-muted-foreground line-through">
              {product.oldPrice} ₴
            </p>
            <p className="sticker mt-1 bg-brick text-cream">
              −
              {Math.round(
                ((product.oldPrice - product.price) / product.oldPrice) * 100,
              )}
              %
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex h-11 items-center rounded-md border border-border">
          <button
            type="button"
            aria-label="Зменшити кількість"
            onClick={() => handleChange(quantity - 1)}
            disabled={soldOut}
            className="grid size-10 place-items-center text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-8 text-center text-sm font-medium tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Збільшити кількість"
            onClick={() => handleChange(quantity + 1)}
            disabled={soldOut}
            className="grid size-10 place-items-center text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <Button
          size="lg"
          className="btn-vintage h-11 flex-1 min-w-40"
          onClick={handleAdd}
          disabled={soldOut || state === "pending"}
        >
          {state === "pending" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : state === "added" ? (
            <Check className="size-4" />
          ) : (
            <ShoppingBag className="size-4" />
          )}
          {soldOut
            ? "Немає у наявності"
            : state === "added"
              ? "Додано до кошика"
              : "Додати до кошика"}
        </Button>
      </div>

      <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Наявність</dt>
          <dd className={cn("font-medium", soldOut && "text-brick")}>
            {soldOut
              ? "Немає у наявності"
              : product.availability === "low-stock"
                ? `Залишилось ${product.stock} шт.`
                : `У наявності · ${product.stock} шт.`}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Артикул</dt>
          <dd className="font-medium">{product.sku}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Доставка</dt>
          <dd className="text-right font-medium">
            1–2 дні · від {freeShippingThreshold} ₴ безкоштовно
          </dd>
        </div>
      </dl>

      <p className="mt-4 flex items-start gap-2 bg-cream px-3 py-2.5 text-xs text-muted-foreground">
        <Truck className="mt-0.5 size-4 shrink-0 text-brick" />
        Відправляємо Новою поштою по Україні. Оплата при отриманні або на
        картку.
      </p>
    </div>
  );
}
