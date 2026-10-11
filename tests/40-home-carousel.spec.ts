import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "no-preference" });

function categorySection(page: import("@playwright/test").Page) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Оберіть своє" }) });
}

test("категорії: верхній ряд залишився, нижній прибрано", async ({ page }) => {
  await page.goto("/");

  const categories = categorySection(page);
  await expect(categories).toBeVisible();
  await expect(categories.locator('a[href*="category="]')).toHaveCount(3);

  await expect(categories.getByText("Капсули")).toBeVisible();
  await expect(categories.getByText("Сушені гриби")).toBeVisible();
  await expect(categories.getByText("Грибне борошно")).toBeVisible();

  await expect(categories.getByText("Чай і напої")).toHaveCount(0);
  await expect(categories.getByText("Подарункові набори")).toHaveCount(0);
  await expect(categories.getByText("Мерч і сувеніри")).toHaveCount(0);

  const carousel = page.getByTestId("products-carousel");
  await expect(carousel).toBeVisible();

  const categoriesBox = await categories.boundingBox();
  const carouselBox = await carousel.boundingBox();
  expect(categoriesBox).not.toBeNull();
  expect(carouselBox).not.toBeNull();
  expect(carouselBox!.y).toBeGreaterThan(categoriesBox!.y);
});

test("карусель: заголовок, товари, ціни та фото", async ({ page }) => {
  await page.goto("/");

  const carousel = page.getByTestId("products-carousel");
  await expect(carousel).toBeVisible();
  await expect(
    carousel.getByRole("heading", { name: "Наші товари" }),
  ).toBeVisible();
  await expect(
    carousel.getByText("Обирай своє з колекції DID PANAS"),
  ).toBeVisible();

  const cards = carousel.locator("article");
  expect(await cards.count()).toBeGreaterThanOrEqual(6);

  for (let index = 0; index < 3; index += 1) {
    await expect(cards.nth(index)).toContainText("грн");
  }

  await expect(
    carousel.locator('a[href^="/product/"]').first(),
  ).toBeVisible();

  await expect
    .poll(() =>
      carousel.locator("img").evaluateAll(
        (nodes) =>
          (nodes as HTMLImageElement[]).filter((node) => node.naturalWidth > 0)
            .length,
      ),
    )
    .toBeGreaterThan(0);

  await expect(carousel.getByRole("button", { name: "Далі" })).toBeVisible();
  await expect(carousel.getByRole("button", { name: "Назад" })).toBeVisible();
  await expect(carousel.getByRole("button", { name: /Позиція 1 з/ })).toBeVisible();
});

test("карусель: автоматична прокрутка", async ({ page }) => {
  await page.goto("/");

  const track = page.getByTestId("carousel-track");
  await track.scrollIntoViewIfNeeded();
  const before = await track.evaluate((node) => node.scrollLeft);

  await page.waitForTimeout(6500);

  const after = await track.evaluate((node) => node.scrollLeft);
  expect(after).toBeGreaterThan(before + 10);
});

test("карусель: пауза при наведенні курсора", async ({ page }) => {
  await page.goto("/");

  const carousel = page.getByTestId("products-carousel");
  const track = page.getByTestId("carousel-track");
  await carousel.hover();
  const before = await track.evaluate((node) => node.scrollLeft);

  await page.waitForTimeout(5500);

  const after = await track.evaluate((node) => node.scrollLeft);
  expect(after).toBe(before);
});

test("карусель: стрілки, індикатори та ручне гортання", async ({ page }) => {
  await page.goto("/");

  const carousel = page.getByTestId("products-carousel");
  const track = page.getByTestId("carousel-track");
  await track.scrollIntoViewIfNeeded();

  await carousel.getByRole("button", { name: "Далі" }).click();
  await expect
    .poll(() => track.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(20);
  const afterNext = await track.evaluate((node) => node.scrollLeft);

  await carousel.getByRole("button", { name: "Назад" }).click();
  await expect
    .poll(() => track.evaluate((node) => node.scrollLeft))
    .toBeLessThan(afterNext);

  const secondDot = carousel.getByRole("button", { name: /Позиція 2 з/ });
  await secondDot.click();
  await expect(secondDot).toHaveAttribute("aria-current", "true");
  await expect
    .poll(() => track.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(20);

  const box = await track.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + Math.min(40, box!.height / 2);
  await page.mouse.move(box!.x + box!.width - 80, y);
  await page.mouse.down();
  await page.mouse.move(box!.x + 80, y, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(() => track.evaluate((node) => node.scrollLeft))
    .toBeGreaterThan(50);
  expect(new URL(page.url()).pathname).toBe("/");
});

test("карусель: перехід на сторінку товару", async ({ page }) => {
  await page.goto("/");

  const carousel = page.getByTestId("products-carousel");
  await carousel.scrollIntoViewIfNeeded();
  await carousel.locator('a[href^="/product/"]').first().click();

  await expect(page).toHaveURL(/\/product\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
