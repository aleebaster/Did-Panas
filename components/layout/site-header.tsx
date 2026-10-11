import type { Category, StoreSettings } from "@/types";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { headerLinks } from "@/config/site";
import { BrandLink } from "@/components/brand/logo";
import { HeaderSearch } from "@/components/search/header-search";
import { CatalogMenu } from "@/components/layout/catalog-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { CartTrigger } from "@/components/cart/cart-trigger";
import Link from "next/link";

interface SiteHeaderProps {
  categories: Category[];
  settings: StoreSettings;
}

export function SiteHeader({ categories, settings }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="bg-ink text-cream">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[11px] tracking-wide">
          <p className="hidden sm:block">
            Безкоштовна доставка від{" "}
            <span className="text-gold">{settings.freeShippingThreshold} ₴</span>
          </p>
          <p className="truncate">{settings.tagline}</p>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
              className="hidden transition hover:text-gold sm:block"
            >
              {settings.contactPhone}
            </a>
            <Link href="/contacts" className="transition hover:text-gold">
              Контакти
            </Link>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center justify-between gap-3 md:h-20">
        <div className="flex items-center gap-3">
          <MobileMenu categories={categories} />
          <BrandLink />
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          <CatalogMenu categories={categories} />
          {headerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <HeaderSearch />
          <CartTrigger />
        </div>
      </div>

      <CartDrawer
        freeShippingThreshold={settings.freeShippingThreshold}
        shippingCost={settings.shippingCost}
      />
    </header>
  );
}
