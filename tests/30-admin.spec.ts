import { expect, test, type Page } from "@playwright/test";

const adminLogin = process.env.ADMIN_LOGIN ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "";

const uniqueSuffix = Date.now().toString(36);

async function login(page: Page, loginValue?: string, passwordValue?: string) {
  await page.goto("/admin/login");
  await page.locator("#login").fill(loginValue ?? adminLogin);
  await page.locator("#password").fill(passwordValue ?? adminPassword);
  await page.getByRole("button", { name: "Увійти" }).click();
}

test.describe("Адмінінкування", () => {
  test.describe("без сесії", () => {
    test("адмін-панель перенаправляє на вхід", async ({ page }) => {
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.getByText("Вхід до панелі")).toBeVisible();
    });

    test("хибний пароль показує помилку", async ({ page }) => {
      await login(page, adminLogin, "wrong-password");
      await expect(
        page.getByText("Невірний логін або пароль.").first(),
      ).toBeVisible({
        timeout: 20_000,
      });
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  });

  test.describe("з сесією", () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole("heading", { name: "Огляд" })).toBeVisible();
    });

    test("огляд показує статистику", async ({ page }) => {
      await expect(page.getByText("Товарів")).toBeVisible();
      await expect(page.getByText("Нових замовлень")).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Керувати товарами/ }),
      ).toBeVisible();
    });

    test("товар: створення, редагування, видалення", async ({ page }) => {
      const name = `Автотест-товар ${uniqueSuffix}`;

      await page.goto("/admin/products/new");
      await page.locator("#name").fill(name);
      await page.locator("#sku").fill(`AT-${uniqueSuffix}`);
      await page.locator("#price").fill("450");
      await page.locator("#stock").fill("5");
      await page
        .locator("#description")
        .fill("Опис товару, створеного автотестом адмін-панелі.");
      await page
        .getByRole("button", { name: "Зберегти" })
        .first()
        .click();

      await page.waitForURL("**/admin/products");
      const row = page.locator("tbody tr", { hasText: name });
      await expect(row).toBeVisible();

      await row.getByRole("link", { name: /Редагувати/ }).click();
      await expect(page).toHaveURL(/\/admin\/products\/.+/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(
        page.getByRole("heading", { level: 1, name: "Редагування товару" }),
      ).toBeVisible();
      await page.locator("#price:visible").fill("520");
      await page.getByRole("button", { name: "Зберегти" }).first().click();
      await page.waitForURL("**/admin/products");
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(
        page.locator("tbody tr", { hasText: name }),
      ).toContainText("520");

      page.once("dialog", (dialog) => void dialog.accept());
      await page
        .locator("tbody tr", { hasText: name })
        .getByRole("button", { name: /Видалити/ })
        .click();
      await page.waitForURL("**/admin/products");
      await expect(
        page.locator("tbody tr", { hasText: name }),
      ).toHaveCount(0);
    });

    test("категорія: створення та видалення", async ({ page }) => {
      const name = `Автотест-категорія ${uniqueSuffix}`;

      await page.goto("/admin/categories/new");
      await page.locator("#name").fill(name);
      await page.locator("#slug").fill(`avtotest-${uniqueSuffix}`);
      await page.getByRole("button", { name: "Зберегти" }).click();
      await page.waitForURL("**/admin/categories");

      const row = page.locator("tbody tr", { hasText: name });
      await expect(row).toBeVisible();

      await row.getByRole("link", { name: /Редагувати/ }).click();
      await expect(page).toHaveURL(/\/admin\/categories\/.+/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(
        page.getByRole("heading", { level: 1, name: "Редагування категорії" }),
      ).toBeVisible();
      page.once("dialog", (dialog) => void dialog.accept());
      await expect(page.getByRole("button", { name: "Видалити" })).toHaveCount(1);
      await page.getByRole("button", { name: "Видалити" }).click();
      await page.waitForURL("**/admin/categories");
      await expect(page.locator("tbody tr", { hasText: name })).toHaveCount(0);
    });

    test("банер: створення та видалення", async ({ page }) => {
      const title = `Автотест-банер ${uniqueSuffix}`;

      await page.goto("/admin/banners/new");
      await page.locator("#title").fill(title);
      await page.locator("#subtitle").fill("Банер, створений автотестом.");
      await page.locator("#ctaLabel").fill("До каталогу");
      await page.locator("#ctaHref").fill("/catalog");
      await page.getByRole("button", { name: "Зберегти" }).click();
      await page.waitForURL("**/admin/banners");

      const card = page.locator("div", { hasText: title }).last();
      await expect(
        page.getByRole("heading", { name: title }).or(page.locator("text=" + title)).first(),
      ).toBeVisible();

      page.once("dialog", (dialog) => void dialog.accept());
      await page
        .locator("div.p-5", { hasText: title })
        .first()
        .getByRole("button", { name: /Видалити/ })
        .click();
      await expect(page.locator("text=" + title)).toHaveCount(0);
      expect(card).toBeTruthy();
    });

    test("налаштування зберігаються", async ({ page }) => {
      await page.goto("/admin/settings");
      await expect(page.locator("#storeName")).not.toHaveValue("");
      await page.getByRole("button", { name: "Зберегти налаштування" }).click();
      await expect(page.getByText("Налаштування збережено")).toBeVisible({
        timeout: 20_000,
      });
    });

    test("замовлення: статус оновлюється", async ({ page }) => {
      await page.goto("/admin/orders");
      await expect(page.getByRole("heading", { name: "Замовлення" })).toBeVisible();

      const rows = page.locator("tbody tr");
      if ((await rows.count()) > 0) {
        const select = rows.first().locator("select");
        await select.selectOption("confirmed");
        await expect(page.getByText("Статус оновлено")).toBeVisible({
          timeout: 20_000,
        });
        await expect(select).toHaveValue("confirmed");
      }
    });

    test("вихід з адмінки", async ({ page }) => {
      await page.getByRole("button", { name: "Вийти" }).click();
      await page.waitForURL("**/admin/login");
      await page.goto("/admin");
      await expect(page).toHaveURL(/\/admin\/login/);
    });
  });
});
