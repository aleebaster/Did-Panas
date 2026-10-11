import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Leaf, PackageCheck, ShieldCheck } from "lucide-react";

import { BuyPanel } from "@/components/product/buy-panel";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCatalog } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const AVAILABILITY_LABEL: Record<string, string> = {
  "in-stock": "Є у наявності",
  "low-stock": "Залишилось мало",
  preorder: "Передзамовлення",
  "out-of-stock": "Немає у наявності",
};

type ProductPageProps = PageProps<"/product/[slug]">;

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getCatalog();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return { title: "Товар не знайдено" };
  }

  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images.length
        ? [{ url: product.images[0] }]
        : undefined,
      type: "website",
    },
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="container-page py-10 lg:py-14">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { products, categories, settings } = await getCatalog();

  const product = products.find((item) => item.slug === slug);
  if (!product) {
    notFound();
  }

  const category = categories.find((item) => item.id === product.categoryId);
  const related = products
    .filter((item) => item.id !== product.id)
    .sort((a, b) => {
      const aMatch = a.categoryId === product.categoryId ? 0 : 1;
      const bMatch = b.categoryId === product.categoryId ? 0 : 1;
      return aMatch - bMatch || Number(b.featured) - Number(a.featured);
    })
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    brand: { "@type": "Brand", name: settings.storeName },
    ...(product.images[0]
      ? { image: product.images.map((image) => `https://did-panas.shop${image}`) }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "UAH",
      price: product.price,
      availability:
        product.availability === "out-of-stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: `https://did-panas.shop/product/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Хлібні крихти" className="text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground hover:underline">
          Головна
        </Link>
        <span className="mx-2">/</span>
        <Link href="/catalog" className="hover:text-foreground hover:underline">
          Каталог
        </Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/catalog?category=${category.slug}`}
              className="hover:text-foreground hover:underline"
            >
              {category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery
          images={product.images}
          art={product.art ?? null}
          name={product.name}
        />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.badge && (
              <span
                className={cn(
                  "sticker",
                  product.badge === "sale" || product.badge === "hit"
                    ? "bg-brick text-cream"
                    : product.badge === "new"
                      ? "bg-gold text-ink"
                      : "bg-ink text-cream",
                )}
              >
                {product.badge}
              </span>
            )}
            <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              {AVAILABILITY_LABEL[product.availability]}
            </span>
          </div>

          <h1 className="heading-md mt-3">{product.name}</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>

          <div className="mt-6">
            <BuyPanel
              product={product}
              freeShippingThreshold={settings.freeShippingThreshold}
            />
          </div>

          <section className="mt-8">
            <h2 className="eyebrow">Опис</h2>
            <p className="mt-3 leading-relaxed text-foreground/80">
              {product.description}
            </p>
          </section>

          {(product.ingredients || product.origin) && (
            <dl className="mt-6 divide-y divide-border border-y border-border text-sm">
              {product.ingredients && (
                <div className="flex gap-6 py-3">
                  <dt className="w-32 shrink-0 text-muted-foreground">Склад</dt>
                  <dd>{product.ingredients}</dd>
                </div>
              )}
              {product.origin && (
                <div className="flex gap-6 py-3">
                  <dt className="w-32 shrink-0 text-muted-foreground">Походження</dt>
                  <dd>{product.origin}</dd>
                </div>
              )}
              <div className="flex gap-6 py-3">
                <dt className="w-32 shrink-0 text-muted-foreground">Формат</dt>
                <dd>{product.weight}</dd>
              </div>
            </dl>
          )}

          <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="flex items-start gap-2">
              <Leaf className="mt-0.5 size-4 shrink-0 text-brick" />
              Натуральний склад
            </li>
            <li className="flex items-start gap-2">
              <PackageCheck className="mt-0.5 size-4 shrink-0 text-brick" />
              Ручне пакування
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brick" />
              Контроль кожної партії
            </li>
          </ul>

          <p className="mt-5 border-l-2 border-gold pl-4 text-xs leading-relaxed text-muted-foreground">
            {settings.legalNote}
          </p>
        </div>
      </div>

      <section className="mt-16 border-t border-border pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Може сподобатись</p>
            <h2 className="heading-md mt-2">Схожі товари</h2>
          </div>
          <Link
            href="/catalog"
            className="text-sm font-medium text-brick hover:underline"
          >
            Увесь каталог
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <Skeleton className="aspect-square w-full" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
