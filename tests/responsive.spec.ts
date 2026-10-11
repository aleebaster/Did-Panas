import { expect, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  await page.evaluate(() => document.fonts.ready);
  const report = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => element.getBoundingClientRect().right > clientWidth + 1)
      .slice(0, 5)
      .map(
        (element) =>
          `${element.tagName.toLowerCase()}.${element.className}`.slice(0, 140),
      );
    return {
      overflow: document.documentElement.scrollWidth - clientWidth,
      url: location.pathname,
      wide,
    };
  });
  expect(
    report.overflow,
    `overflow=${report.overflow} on ${report.url}: ${report.wide.join(" | ")}`,
  ).toBeLessThanOrEqual(1);
}

async function heroImageSource(page: import("@playwright/test").Page) {
  const hero = page.getByTestId("hero-banner");
  await expect(hero).toBeVisible();
  const image = hero.locator("img").first();
  await expect
    .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  return image.evaluate((node) => (node as HTMLImageElement).currentSrc);
}

test("hero-банер: мобільне зображення", async ({ page }) => {
  await page.goto("/");
  expect(await heroImageSource(page)).toContain("hero-mobile");
  await expectNoHorizontalOverflow(page);
});

test("hero-банер: планшетне зображення", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1000 });
  await page.goto("/");
  expect(await heroImageSource(page)).toContain("hero-tablet");
  await expectNoHorizontalOverflow(page);
});

test("hero-банер: десктопне зображення", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  expect(await heroImageSource(page)).toContain("hero-desktop");
  await expectNoHorizontalOverflow(page);
});

test("hero-банер: кнопка в межах екрана на всіх брейкпоінтах", async ({
  page,
}) => {
  const viewports = [
    { width: 360, height: 640, image: "hero-mobile" },
    { width: 640, height: 900, image: "hero-tablet" },
    { width: 767, height: 800, image: "hero-tablet" },
    { width: 768, height: 900, image: "hero-tablet" },
    { width: 1024, height: 800, image: "hero-desktop" },
    { width: 1280, height: 720, image: "hero-desktop" },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/");
    expect(
      await heroImageSource(page),
      `viewport ${viewport.width}x${viewport.height}`,
    ).toContain(viewport.image);

    const cta = page.getByTestId("hero-banner").locator("a").first();
    const box = await cta.boundingBox();
    expect(box, `CTA @${viewport.width}x${viewport.height}`).not.toBeNull();
    expect(
      box!.y + box!.height,
      `CTA нижня межа @${viewport.width}x${viewport.height}`,
    ).toBeLessThanOrEqual(viewport.height);

    await expectNoHorizontalOverflow(page);
  }
});

test("мобільна версія магазину", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/catalog");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("мобільна версія товару та кошика", async ({ page }) => {
  await page.goto("/catalog");
  await page.locator('a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "До кошика" }).first().click();
  await page.goto("/cart");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("мобільна версія входу до адмінки", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator("#password")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("карусель товарів: ширини 360/390/640/768/1024/1440", async ({ page }) => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 640, height: 900 },
    { width: 768, height: 900 },
    { width: 1024, height: 800 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const carousel = page.getByTestId("products-carousel");
    await expect(carousel).toBeVisible();
    await expect(
      carousel.getByRole("heading", { name: "Наші товари" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
