import { expect, test } from "@playwright/test";

const PROMO_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 640, height: 900 },
  { width: 768, height: 900 },
  { width: 1024, height: 800 },
  { width: 1440, height: 900 },
];

test.describe("Промоблоки головної", () => {
  test("три блоки: тексти, порядок і посилання", async ({ page }) => {
    await page.goto("/");

    const promo = page.getByTestId("promo-banners");
    await expect(promo).toBeVisible();

    const cards = promo.locator("a");
    await expect(cards).toHaveCount(3);

    const capsules = cards.nth(0);
    await expect(capsules).toContainText("Капсули");
    await expect(capsules).toContainText(
      "Зручний формат грибної продукції для щоденного використання",
    );
    await expect(capsules).toContainText("Обрати капсули");
    await expect(capsules).toHaveAttribute("href", "/catalog?category=capsules");
    await expect(capsules).not.toContainText("Набори до свят");
    await expect(capsules).not.toContainText("Подарункові");

    const flour = cards.nth(1);
    await expect(flour).toContainText("Грибне борошно");
    await expect(flour).toHaveAttribute("href", "/catalog?category=flour");

    const dried = cards.nth(2);
    await expect(dried).toContainText("Сушені гриби");
    await expect(dried).toContainText(
      "Добірні сушені гриби для ароматних домашніх страв",
    );
    await expect(dried).toContainText("Переглянути гриби");
    await expect(dried).toHaveAttribute("href", "/catalog?category=dried");

    await expect(promo.getByText("Набори до свят")).toHaveCount(0);
  });

  test("перехід за посиланням капсул до категорії", async ({ page }) => {
    await page.goto("/");

    const promo = page.getByTestId("promo-banners");
    await promo.locator("a").first().click();

    await expect(page).toHaveURL(/\/catalog\?category=capsules/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  for (const viewport of PROMO_VIEWPORTS) {
    test(`адаптивність ${viewport.width}px: без переповнення та обрізання`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const promo = page.getByTestId("promo-banners");
      await expect(promo).toBeVisible();

      const cards = promo.locator("a");
      await expect(cards).toHaveCount(3);

      const layout = await cards.evaluateAll((nodes) => {
        const scroller = document.scrollingElement || document.documentElement;
        return {
          pageOverflow: scroller.scrollWidth - scroller.clientWidth,
          clipped: nodes.filter(
            (node) =>
              node.scrollWidth > node.clientWidth + 1 ||
              node.scrollHeight > node.clientHeight + 1,
          ).length,
          heights: nodes.map((node) =>
            Math.round(node.getBoundingClientRect().height),
          ),
          boxes: nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return {
              left: Math.round(rect.left),
              top: Math.round(rect.top),
              width: Math.round(rect.width),
            };
          }),
        };
      });

      expect(layout.pageOverflow).toBeLessThanOrEqual(0);
      expect(layout.clipped).toBe(0);

      for (const box of layout.boxes) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.left).toBeGreaterThanOrEqual(0);
      }

      const rows = new Set(layout.boxes.map((box) => box.top));
      if (viewport.width >= 1024) {
        expect(rows.size).toBe(1);
        expect(new Set(layout.heights).size).toBe(1);
      }
    });
  }
});
