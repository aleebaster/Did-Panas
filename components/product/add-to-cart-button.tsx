"use client";

import { useState } from "react";
import { Check, Loader2, ShoppingBag } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

interface AddToCartButtonProps {
  product: Pick<
    Product,
    "id" | "slug" | "name" | "price" | "images" | "art" | "weight" | "stock" | "availability"
  >;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function AddToCartButton({
  product,
  size = "default",
  className,
}: AddToCartButtonProps) {
  const { add } = useCart();
  const [state, setState] = useState<"idle" | "pending" | "added">("idle");

  const soldOut = product.availability === "out-of-stock" || product.stock === 0;

  if (soldOut) {
    return (
      <Button
        variant="outline"
        size={size}
        className={className}
        disabled
        aria-label="Немає у наявності"
      >
        Немає у наявності
      </Button>
    );
  }

  function handleClick() {
    setState("pending");
    add(product as Product, 1);
    window.setTimeout(() => setState("added"), 400);
    window.setTimeout(() => setState("idle"), 1800);
  }

  return (
    <Button
      size={size}
      className={className}
      onClick={handleClick}
      disabled={state === "pending"}
      aria-label={`Додати ${product.name} до кошика`}
    >
      {state === "pending" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : state === "added" ? (
        <Check className="size-4" />
      ) : (
        <ShoppingBag className="size-4" />
      )}
      {state === "added" ? "Додано" : "До кошика"}
    </Button>
  );
}
