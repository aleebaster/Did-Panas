"use client";

import { ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";

export function CartTrigger() {
  const { count, open } = useCart();

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Відкрити кошик, товарів: ${count}`}
      className="relative grid size-9 place-items-center rounded-md text-foreground transition hover:bg-muted"
    >
      <ShoppingBag className="size-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-brick px-1 text-[10px] leading-4 font-semibold text-cream">
          {count}
        </span>
      )}
    </button>
  );
}
