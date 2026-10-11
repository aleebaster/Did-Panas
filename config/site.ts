export const headerLinks: { href: string; label: string }[] = [
  { href: "/about", label: "Про бренд" },
  { href: "/delivery", label: "Доставка" },
  { href: "/contacts", label: "Контакти" },
];

export const footerLinks: { href: string; label: string }[] = [
  { href: "/about", label: "Про бренд" },
  { href: "/delivery", label: "Доставка і оплата" },
  { href: "/privacy", label: "Політика конфіденційності" },
  { href: "/terms", label: "Умови використання" },
  { href: "/contacts", label: "Контакти" },
];

export const siteConfig = {
  name: "Did Panas",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://did-panas.shop",
} as const;
