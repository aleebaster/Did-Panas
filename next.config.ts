import type { NextConfig } from "next";

/**
 * Публічні URL зображень потрібні next/image для оптимізації:
 * Cloudinary (res.cloudinary.com), Cloudflare R2 (домен із
 * R2_PUBLIC_BASE_URL плюс запасний шаблон *.r2.dev).
 */
function imageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    { protocol: "https", hostname: "**.r2.dev", pathname: "/**" },
    { protocol: "http", hostname: "**.r2.dev", pathname: "/**" },
  ];

  const raw = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (raw) {
    try {
      const url = new URL(raw);
      const protocol = url.protocol === "http:" ? "http" : "https";
      patterns.push({
        protocol,
        hostname: url.hostname,
        pathname: "/**",
        ...(url.port ? { port: url.port } : {}),
      });
    } catch {
      // некоректний URL — ігноруємо, залишаються шаблони вище
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: imageRemotePatterns(),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
