import Link from "next/link";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ProductMedia } from "@/components/product/product-media";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product, ProductBadge } from "@/types";

const BADGE_LABELS: Record<Exclude<ProductBadge, "">, string> = {
  new: "Новинка",
  hit: "Хіт",
  sale: "-знижка",
  few: "Залишилось мало",
  out: "Sold out",
  bestseller: "Бестселер",
};

const BADGE_STYLES: Record<Exclude<ProductBadge, "">, string> = {
  new: "bg-gold text-ink",
  hit: "bg-brick text-cream",
  sale: "bg-brick text-cream",
  few: "bg-ink text-cream",
  out: "bg-ink/80 text-cream",
  bestseller: "bg-[#4a6b3f] text-cream",
};

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

export function ProductCard({
  product,
  priority,
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: ProductCardProps) {
  const discount =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col border border-border bg-paper transition hover:border-ink/40 hover:shadow-[0_12px_30px_-18px_rgba(20,18,15,0.55)]",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
        aria-label={product.name}
      >
        <ProductMedia
          product={product}
          priority={priority}
          className="size-full"
          sizes={sizes}
        />
        <span className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {product.badge && (
            <span
              className={cn(
                "sticker",
                BADGE_STYLES[product.badge as Exclude<ProductBadge, "">],
              )}
            >
              {BADGE_LABELS[product.badge as Exclude<ProductBadge, "">]}
            </span>
          )}
          {discount && (
            <span className="sticker bg-ink text-gold">-{discount}%</span>
          )}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {product.weight}
        </p>
        <h3 className="line-clamp-2 text-sm leading-snug font-medium">
          <Link href={`/product/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {product.shortDescription}
        </p>

        <div className="mt-auto flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div className="flex flex-col">
            {product.oldPrice ? (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            ) : null}
            <span className="font-display text-lg leading-none font-semibold">
              {formatPrice(product.price)}
            </span>
          </div>
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </article>
  );
}
