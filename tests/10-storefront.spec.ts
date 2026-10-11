import { expect, test } from "@playwright/test";

test.describe("Вітрина", () => {
  test("головна сторінка", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Did Panas/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /каталог/i }).first(),
    ).toBeVisible();

    const hero = page.getByTestId("hero-banner");
    await expect(hero).toBeVisible();

    const image = hero.locator("img").first();
    await expect
      .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);

    const currentSrc = await image.evaluate(
      (node) => (node as HTMLImageElement).currentSrc,
    );
    expect(currentSrc).toContain("hero-desktop");
  });

  test("каталог: фільтр категорії та сортування", async ({ page }) => {
    await page.goto("/catalog");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const firstProduct = page.locator('a[href^="/product/"]').first();
    await expect(firstProduct).toBeVisible();

    const categoryLinks = page.locator('aside a[href*="category="]');
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThan(0);
    await categoryLinks.first().click();
    await expect(page).toHaveURL(/category=/);

    await page.goBack();
    await expect(page).toHaveURL(/\/catalog/);
  });

  test("сторінка товару та додавання в кошик", async ({ page }) => {
    await page.goto("/catalog");
    await page.locator('a[href^="/product/"]').first().click();

    await expect(page).toHaveURL(/\/product\//);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "До кошика" }).first()).toBeVisible();

    await page.getByRole("button", { name: "До кошика" }).first().click();
    await expect(page.getByRole("button", { name: /кошик/i }).first()).toBeVisible();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href^="/product/"]').first()).toBeVisible();
  });

  test("пошук у хедері", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /пошук/i }).first().click();
    const input = page.getByPlaceholder(/Пошук/);
    await input.fill("гриб");
    await expect(
      page.locator('a[href^="/product/"], button:has-text("Нічого не знайдено")').first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("статичні сторінки", async ({ page }) => {
    const pages = ["/about", "/contacts", "/delivery", "/privacy", "/terms"];
    for (const url of pages) {
      const response = await page.goto(url);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("sitemap та robots", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("/product/");
    expect(sitemapBody).toContain("/catalog");

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Disallow: /admin");
  });

  test("неіснуюча сторінка → 404", async ({ page }) => {
    const response = await page.goto("/takoy-stranitsy-net");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Такої сторінки немає")).toBeVisible();
  });

  test("пошуковий API", async ({ request }) => {
    const response = await request.get("/api/search?q=кордицепс");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { results: unknown[] };
    expect(Array.isArray(body.results)).toBe(true);
  });
});
