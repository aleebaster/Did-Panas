import Image from "next/image";
import { Coffee, Shirt, ShoppingBag } from "lucide-react";

import { BrandMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import type { Product, ProductArt } from "@/types";

interface ProductMediaProps {
  product: Pick<Product, "name" | "images" | "art" | "availability">;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ProductMedia({
  product,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  priority = false,
}: ProductMediaProps) {
  const firstImage = product.images[0];

  if (firstImage) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={firstImage}
          alt={product.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.availability === "out-of-stock" && (
          <div className="absolute inset-0 bg-ink/45" aria-hidden />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <ProductArt art={product.art} name={product.name} />
      {product.availability === "out-of-stock" && (
        <div className="absolute inset-0 bg-ink/45" aria-hidden />
      )}
    </div>
  );
}

interface ProductArtProps {
  art: ProductArt | null | undefined;
  name: string;
}

export function ProductArt({ art, name }: ProductArtProps) {
  const background = art?.background ?? "#24221d";
  const accent = art?.accent ?? "#c79a2e";
  const icon = art?.icon ?? "pouch";

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden p-6"
      style={{ backgroundColor: background }}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-25 blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 size-40 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: accent }}
      />

      <div className="relative flex h-full w-full max-w-[15rem] flex-col">
        <PackShape icon={icon} accent={accent} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span className="font-display text-[10px] leading-tight font-semibold tracking-[0.2em] text-cream/70 uppercase">
            did panas
          </span>
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: accent }}
          />
        </div>
        <span className="sr-only">{name}</span>
      </div>
    </div>
  );
}

function PackShape({ icon, accent }: { icon: ProductArt["icon"]; accent: string }) {
  if (icon === "shirt" || icon === "cup" || icon === "bag") {
    const Icon = icon === "shirt" ? Shirt : icon === "cup" ? Coffee : ShoppingBag;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 border border-cream/15 bg-cream/5 px-5 py-8">
        <Icon className="size-16 text-cream" strokeWidth={1.2} />
        <span
          className="sticker"
          style={{ backgroundColor: accent, color: "#14120f" }}
        >
          did panas
        </span>
      </div>
    );
  }

  if (icon === "box") {
    return (
      <div className="relative flex-1 border border-cream/20 bg-cream/5">
        <div
          className="absolute inset-x-0 top-0 h-8 border-b border-cream/20"
          style={{ backgroundColor: accent, opacity: 0.9 }}
        />
        <div className="absolute inset-x-4 top-14 bottom-6 border border-cream/25 bg-ink/25" />
        <div className="absolute inset-x-6 top-20 flex justify-center">
          <BrandMark className="size-12 text-cream" />
        </div>
      </div>
    );
  }

  if (icon === "jar") {
    return (
      <div className="flex flex-1 flex-col items-center">
        <div
          className="h-7 w-[70%] rounded-t-md"
          style={{ backgroundColor: accent }}
        />
        <div className="relative -mt-1 flex h-full w-[86%] flex-col items-center justify-center gap-3 rounded-b-2xl border border-cream/20 bg-cream/10 px-4 pb-5 pt-6">
          <BrandMark className="size-14 text-cream" />
          <span className="sticker border border-cream/30 text-cream">
            100% natural
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="h-4 rounded-t-sm bg-cream/85" />
      <div className="h-2 rounded-sm bg-cream/40" />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 rounded-b-lg border border-cream/20 bg-ink/20 px-4 pb-6 pt-8">
        <div
          className="absolute inset-x-3 top-3 h-1.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <BrandMark className="size-16 text-cream" />
        <span className="sticker border border-cream/30 text-cream">
          made in ukraine
        </span>
      </div>
    </div>
  );
}
