import fs from "node:fs";
import path from "node:path";

import { seedDatabase } from "@/data/seed";
import type { DatabaseShape } from "@/types";

const DB_FILE = path.join(process.cwd(), "data", "db.json");

function parse(raw: string): DatabaseShape {
  const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
  return {
    products: parsed.products ?? [],
    categories: parsed.categories ?? [],
    banners: parsed.banners ?? [],
    orders: parsed.orders ?? [],
    settings: parsed.settings ?? seedDatabase.settings,
    homeCarousel: parsed.homeCarousel
      ? {
          settings: {
            ...seedDatabase.homeCarousel.settings,
            ...parsed.homeCarousel.settings,
          },
          items: parsed.homeCarousel.items ?? [],
        }
      : structuredClone(seedDatabase.homeCarousel),
  };
}

export function readDbSync(): DatabaseShape {
  try {
    return parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(seedDatabase);
    }
    throw error;
  }
}

export function writeDbSync(db: DatabaseShape): void {
  const dir = path.dirname(DB_FILE);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
}
