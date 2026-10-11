import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { ProductArt } from "@/components/product/product-media";
import type { Banner } from "@/types";

const ARROW_SUFFIX = "→";

export function PromoBanners({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <section
      className="container-page pb-14 lg:pb-20"
      data-testid="promo-banners"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => {
          const image =
            banner.images.desktop ?? banner.images.tablet ?? banner.images.mobile;
          const hasArrow = banner.ctaLabel.trim().endsWith(ARROW_SUFFIX);

          return (
            <Link
              key={banner.id}
              href={banner.ctaHref}
              className="group relative flex min-h-64 flex-col justify-end overflow-hidden border border-border p-6 text-cream sm:p-7 sm:last:col-span-2 lg:last:col-span-1"
              style={{ backgroundColor: banner.accent }}
            >
              {image ? (
                <Image
                  src={image}
                  alt={banner.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 opacity-25">
                  <ProductArt
                    art={{ background: banner.accent, accent: "#14120f", icon: "pouch" }}
                    name={banner.title}
                  />
                </div>
              )}

              <span
                className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent"
                aria-hidden
              />

              <span className="relative flex flex-col items-start gap-3">
                <span className="font-display text-3xl leading-tight font-semibold uppercase">
                  {banner.title}
                </span>
                <span className="max-w-md text-sm leading-relaxed text-cream/85">
                  {banner.subtitle}
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-gold">
                  {banner.ctaLabel}
                  {!hasArrow && (
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  )}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
