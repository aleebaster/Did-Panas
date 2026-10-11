import Link from "next/link";
import Image, { getImageProps } from "next/image";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/logo";
import { Leaf, PackageCheck, Truck } from "lucide-react";
import type { Banner, Product } from "@/types";

interface HeroProps {
  banner: Banner | undefined;
  showcase: Product[];
}

const highlights = [
  { icon: Leaf, label: "100% натуральний склад" },
  { icon: PackageCheck, label: "Ручне пакування" },
  { icon: Truck, label: "Відправка за 1–2 дні" },
];

const frameMobile = "aspect-[1092/1440]";
const frameTablet = "aspect-[1622/969]";
const frameTabletSm = "sm:aspect-[1622/969]";
const frameDesktop = "aspect-[1983/793]";
const frameDesktopMd = "md:aspect-[1983/793]";
const frameDesktopLg = "lg:aspect-[1983/793]";

interface BannerImageProps {
  banner: Banner;
}

function BannerArt({ banner }: BannerImageProps) {
  const { desktop, tablet, mobile } = banner.images;
  const alt = `${banner.title} — ${banner.subtitle}`;

  const primary = desktop ?? tablet ?? mobile;
  if (!primary) {
    return null;
  }

  const primaryWidth = desktop ? 1983 : tablet ? 1622 : 1092;
  const primaryHeight = desktop ? 793 : tablet ? 969 : 1440;

  const primaryProps = getImageProps({
    alt,
    src: primary,
    width: primaryWidth,
    height: primaryHeight,
    sizes: "100vw",
    quality: 82,
    loading: "eager",
    fetchPriority: "high",
  }).props;

  const sources: { media: string; srcSet: string }[] = [];

  if (mobile && mobile !== primary) {
    const { props } = getImageProps({
      alt,
      src: mobile,
      width: 1092,
      height: 1440,
      sizes: "100vw",
      quality: 82,
    });
    if (props.srcSet) {
      sources.push({ media: "(max-width: 639px)", srcSet: props.srcSet });
    }
  }

  if (tablet && tablet !== primary) {
    const { props } = getImageProps({
      alt,
      src: tablet,
      width: 1622,
      height: 969,
      sizes: "100vw",
      quality: 82,
    });
    if (props.srcSet) {
      sources.push({
        media: "(min-width: 640px) and (max-width: 1023px)",
        srcSet: props.srcSet,
      });
    }
  }

  const hasMobile = Boolean(mobile);
  const hasTablet = Boolean(tablet);
  const hasDesktop = Boolean(desktop);

  const base = hasMobile ? frameMobile : hasTablet ? frameTablet : frameDesktop;
  const medium = hasTablet
    ? frameTabletSm
    : hasMobile && hasDesktop
      ? frameDesktopMd
      : "";
  const large = hasDesktop ? frameDesktopLg : "";

  return (
    <section className="relative border-b-2 border-ink bg-ink">
      <div
        data-testid="hero-banner"
        className={`relative w-full overflow-hidden ${base} ${medium} ${large}`}
      >
        <picture>
          {sources.map((source) => (
            <source
              key={source.media}
              media={source.media}
              srcSet={source.srcSet}
              sizes="100vw"
            />
          ))}
          <img
            {...primaryProps}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>

        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-ink via-ink/55 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 px-4 sm:bottom-8 sm:items-end md:px-8 lg:bottom-4 lg:items-center lg:px-4">
          <h1 className="sr-only">{banner.title}</h1>
          <Button
            asChild
            size="lg"
            className="btn-vintage h-12 px-7 text-base shadow-2xl lg:h-11"
          >
            <Link href={banner.ctaHref}>{banner.ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function Hero({ banner, showcase }: HeroProps) {
  const title = banner?.title ?? "DID PANAS";
  const subtitle =
    banner?.subtitle ?? "Грибна майстерня з українським характером";

  if (
    banner &&
    (banner.images.desktop ?? banner.images.tablet ?? banner.images.mobile)
  ) {
    return <BannerArt banner={banner} />;
  }

  return (
    <section className="relative overflow-hidden border-b-2 border-ink bg-ink text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-cream) 1px, transparent 1px), linear-gradient(90deg, var(--color-cream) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(120% 90% at 15% 10%, black 0%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-brick/30 blur-3xl" />

      <div className="container-page relative grid gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <BrandMark className="size-12 text-cream" />
            <span className="sticker border border-gold/60 text-gold">
              made in Ukraine
            </span>
          </div>

          <p className="eyebrow mt-8 text-gold">Український грибний бренд</p>
          <h1 className="heading-xl mt-3 text-cream">
            {title.split(" ").map((word) => (
              <span key={word} className="block">
                {word}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-cream/75">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="btn-vintage h-12 px-7 text-base">
              <Link href="/catalog">Переглянути каталог</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-cream/35 bg-transparent px-7 text-base text-cream hover:bg-cream/10 hover:text-cream"
            >
              <Link href="/about">Про бренд</Link>
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {highlights.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-cream/70"
              >
                <Icon className="size-4 text-gold" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-h-[22rem] lg:min-h-[30rem]">
          {showcase.map((product, index) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className={`absolute block w-[62%] overflow-hidden border-2 border-cream/15 shadow-2xl transition hover:-translate-y-1 ${
                index === 0
                  ? "top-0 left-0 z-10 -rotate-3"
                  : "right-0 bottom-0 z-20 rotate-2"
              }`}
              aria-label={product.name}
            >
              <span className="relative block aspect-[4/5]">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  priority={index === 0}
                  className="object-cover"
                />
              </span>
              <span className="flex items-center justify-between gap-2 bg-cream px-3 py-2 text-ink">
                <span className="line-clamp-1 text-xs font-medium">
                  {product.name}
                </span>
                <span className="font-display text-xs font-semibold">
                  {product.weight}
                </span>
              </span>
            </Link>
          ))}

          <span className="absolute top-1/2 left-1/2 z-30 hidden -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] border-2 border-ink bg-gold px-4 py-2 text-center font-display text-xs font-semibold tracking-[0.14em] text-ink uppercase shadow-lg sm:block">
            Малі партії
          </span>
        </div>
      </div>
    </section>
  );
}
