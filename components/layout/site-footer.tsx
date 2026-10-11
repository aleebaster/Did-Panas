import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

import { BrandMark } from "@/components/brand/logo";
import {
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
} from "@/components/brand/social-icons";
import { footerLinks } from "@/config/site";
import type { Category, StoreSettings } from "@/types";

interface SiteFooterProps {
  categories: Category[];
  settings: StoreSettings;
}

const year = new Date().getFullYear();

export function SiteFooter({ categories, settings }: SiteFooterProps) {
  return (
    <footer className="mt-16 border-t-2 border-ink bg-ink text-cream">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark className="size-12 text-cream" />
            <div>
              <p className="font-display text-lg font-semibold tracking-[0.14em] uppercase">
                {settings.storeName}
              </p>
              <p className="text-[10px] tracking-[0.3em] text-cream/60 uppercase">
                made in Ukraine
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
            {settings.tagline}. Маленькі партії, ручне пакування, чесний склад
            на кожній етикетці.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href={settings.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid size-9 place-items-center rounded-full border border-cream/25 transition hover:border-gold hover:text-gold"
            >
              <InstagramIcon className="size-4" />
            </a>
            <a
              href={settings.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="grid size-9 place-items-center rounded-full border border-cream/25 transition hover:border-gold hover:text-gold"
            >
              <FacebookIcon className="size-4" />
            </a>
            <a
              href={settings.telegram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="grid size-9 place-items-center rounded-full border border-cream/25 transition hover:border-gold hover:text-gold"
            >
              <TelegramIcon className="size-4" />
            </a>
          </div>
        </div>

        <nav aria-label="Каталог">
          <p className="eyebrow text-gold">Каталог</p>
          <ul className="mt-4 grid gap-2.5 text-sm text-cream/75">
            <li>
              <Link href="/catalog" className="transition hover:text-gold">
                Усі товари
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/catalog?category=${category.slug}`}
                  className="transition hover:text-gold"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Інформація">
          <p className="eyebrow text-gold">Інформація</p>
          <ul className="mt-4 grid gap-2.5 text-sm text-cream/75">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/admin" className="transition hover:text-gold">
                Кабінет адміністратора
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="eyebrow text-gold">Контакти</p>
          <ul className="mt-4 grid gap-3 text-sm text-cream/75">
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-gold" />
              <a
                href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                className="transition hover:text-gold"
              >
                {settings.contactPhone}
              </a>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-gold" />
              <a
                href={`mailto:${settings.contactEmail}`}
                className="break-all transition hover:text-gold"
              >
                {settings.contactEmail}
              </a>
            </li>
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>{settings.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>{settings.workingHours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/15">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-cream/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.storeName}. Усі права захищені.
          </p>
          <p className="max-w-xl">{settings.legalNote}</p>
        </div>
      </div>
    </footer>
  );
}
