import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/controls";
import { HomeCarouselManager } from "@/components/admin/home-carousel-manager";
import { getHomeCarousel, listProducts } from "@/lib/db/repository";

export const metadata: Metadata = { title: "Карусель головної" };

export default function AdminHomeCarouselPage() {
  const carousel = getHomeCarousel();
  const products = listProducts();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Карусель головної"
        description="Секція «Наші товари» на головній сторінці: добір товарів, власні фото та назви, порядок і видимість карток."
      >
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center rounded-md border border-border bg-paper px-3 text-sm text-ink transition hover:border-ink/40"
        >
          Переглянути головну
        </a>
      </AdminPageHeader>

      <HomeCarouselManager
        settings={carousel.settings}
        items={carousel.items}
        products={products}
      />
    </div>
  );
}
