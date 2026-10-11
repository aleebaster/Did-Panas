import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getCatalog } from "@/lib/catalog";
import { catalogQuery } from "@/lib/catalog-query";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const { products, categories, banners } = await getCatalog();

  const staticPages: MetadataRoute.Sitemap = [
    { path: "", priority: 1, changeFrequency: "daily" },
    { path: "/catalog", priority: 0.9, changeFrequency: "daily" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contacts", priority: 0.6, changeFrequency: "monthly" },
    { path: "/delivery", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ].map((page) => ({
    url: `${base}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: page.priority,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/product/${product.slug}`,
    lastModified: new Date(product.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}${catalogQuery.toHref({ category: category.slug })}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const bannerPages: MetadataRoute.Sitemap = banners
    .filter((banner) => banner.active && banner.ctaHref.startsWith("/"))
    .map((banner) => ({
      url: `${base}${banner.ctaHref}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  return [...staticPages, ...productPages, ...categoryPages, ...bannerPages];
}
