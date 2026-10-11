"use client";

import Image from "next/image";
import { useState } from "react";

import { ProductArt } from "@/components/product/product-media";
import { cn } from "@/lib/utils";
import type { ProductArt as ProductArtType } from "@/types";

interface ProductGalleryProps {
  images: string[];
  art: ProductArtType | null;
  name: string;
}

export function ProductGallery({ images, art, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden border border-border">
        <ProductArt art={art} name={name} />
      </div>
    );
  }

  const current = images[active] ?? images[0];

  return (
    <div>
      <div className="group relative aspect-square overflow-hidden border border-border bg-muted">
        <Image
          src={current}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition-opacity duration-300"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Зображення ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "relative size-20 overflow-hidden border transition",
                index === active
                  ? "border-ink"
                  : "border-border opacity-70 hover:opacity-100",
              )}
            >
              <Image src={image} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
