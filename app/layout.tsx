import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

const headingFont = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://did-panas.shop";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Did Panas · Український грибний бренд",
    template: "%s · Did Panas",
  },
  description:
    "Did Panas — грибна продукція з України: сухі гриби, кордицепс та їжовик, грибне борошно та натуральні продукти.",
  keywords: [
    "грибна продукція",
    "кордицепс український",
    "їжовик гребінчастий",
    "сушені гриби",
    "грибне борошно",
    "Did Panas",
  ],
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "Did Panas",
    title: "Did Panas · Український грибний бренд",
    description:
      "Грибна продукція з України: сухі гриби, кордицепс та їжовик, грибне борошно та натуральні продукти.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Did Panas · Український грибний бренд",
    description:
      "Грибна продукція з України: сухі гриби, кордицепс та їжовик, грибне борошно та натуральні продукти.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uk"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
