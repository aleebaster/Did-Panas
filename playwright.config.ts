import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3100",
    locale: "uk-UA",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /responsive\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
    // Тести ізольовані від зовнішніх сервісів: сервер завжди стартує без
    // ключа Нової пошти та без Cloudinary/R2 — завантаження йдуть у локальне
    // public/uploads, автопідказки мокаються у тестах.
    env: {
      ...process.env,
      NOVA_POSHTA_API_KEY: "",
      CLOUDINARY_CLOUD_NAME: "",
      CLOUDINARY_API_KEY: "",
      CLOUDINARY_API_SECRET: "",
    },
  },
});
