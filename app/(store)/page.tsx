import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BrandStory } from "@/components/home/brand-story";
import { CategoryGrid } from "@/components/home/category-grid";
import { Hero } from "@/components/home/hero";
import { ProductCarousel } from "@/components/home/product-carousel";
import { PromoBanners } from "@/components/home/promo-banners";
import { UspStrip } from "@/components/home/usp-strip";
import { ProductCard } from "@/components/product/product-card";
import { getCatalog, resolveCarouselProducts } from "@/lib/catalog";

const HIDDEN_HOME_CATEGORY_SLUGS = ["tea", "gifts", "merch"];

export default async function HomePage() {
  const { products, categories, banners, homeCarousel } = await getCatalog();

  const heroBanner = banners.find(
    (banner) => banner.active && banner.position === "hero",
  );
  const promoBanners = banners
    .filter((banner) => banner.active && banner.position === "promo")
    .sort((a, b) => a.order - b.order);

  const carouselProducts = resolveCarouselProducts(products, homeCarousel);
  const carouselSettings = homeCarousel.settings;

  const showcase = products.filter((product) => product.images.length > 0).slice(0, 2);
  const featured = products.filter((product) => product.featured).slice(0, 8);

  const categoriesWithCount = categories
    .filter((category) => !HIDDEN_HOME_CATEGORY_SLUGS.includes(category.slug))
    .sort((a, b) => a.order - b.order)
    .slice(0, 3)
    .map((category) => ({
      ...category,
      productCount: products.filter(
        (product) => product.categoryId === category.id,
      ).length,
    }));

  return (
    <>
      <Hero banner={heroBanner} showcase={showcase} />
      <UspStrip />
      <CategoryGrid categories={categoriesWithCount} />
      {carouselSettings.enabled ? (
        <ProductCarousel
          products={carouselProducts}
          config={{
            title: carouselSettings.title,
            subtitle: carouselSettings.subtitle,
            autoplay: carouselSettings.autoplay,
            autoplayInterval: carouselSettings.autoplayInterval,
            showArrows: carouselSettings.showArrows,
          }}
        />
      ) : null}

      <section className="container-page pb-14 lg:pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Добірка</p>
            <h2 className="heading-lg mt-2">Рекомендуємо спробувати</h2>
          </div>
          <Link
            href="/catalog"
            className="group inline-flex items-center gap-2 text-sm font-medium text-brick"
          >
            Перейти до каталогу
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <BrandStory />
      <PromoBanners banners={promoBanners} />
    </>
  );
}
