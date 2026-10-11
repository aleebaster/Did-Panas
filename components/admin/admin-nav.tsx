"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Огляд" },
  { href: "/admin/products", label: "Товари" },
  { href: "/admin/categories", label: "Категорії" },
  { href: "/admin/home-carousel", label: "Карусель головної" },
  { href: "/admin/banners", label: "Банери" },
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/admin/settings", label: "Налаштування" },
];

export function AdminNav({ orderBadge }: { orderBadge: number }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {links.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition",
              active
                ? "bg-gold/15 font-medium text-foreground"
                : "text-muted-foreground hover:bg-cream/10 hover:text-foreground",
            )}
          >
            {link.label}
            {link.href === "/admin/orders" && orderBadge > 0 ? (
              <span className="rounded-full bg-brick px-2 py-0.5 text-[11px] font-semibold text-cream">
                {orderBadge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
