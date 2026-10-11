import { expect, test, type Locator, type Page } from "@playwright/test";

const CITY_REF = "11111111-1111-1111-1111-111111111111";
const DEPARTMENT_REF = "22222222-2222-2222-2222-222222222222";
const POSTAMAT_REF = "33333333-3333-3333-3333-333333333333";
const STREET_REF = "44444444-4444-4444-4444-444444444444";

const CITY_LABEL = "Львів";
const DEPARTMENT_LABEL = "Відділення №34/2 (вул. Хрещатик, 1)";
const POSTAMAT_LABEL = "Поштомат №НП-1026 (ТЦ Форум, вул. Під Дубом, 25Б)";
const STREET_LABEL = "вул. Хрещатик";

const adminLogin = process.env.ADMIN_LOGIN ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "";

async function mockNovaPoshta(page: Page): Promise<void> {
  await page.route("**/api/nova-poshta/settlements**", (route) =>
    route.fulfill({
      json: { items: [{ ref: CITY_REF, label: CITY_LABEL, hint: "Львівська область" }] },
    }),
  );

  await page.route("**/api/nova-poshta/warehouses**", (route) => {
    const kind = new URL(route.request().url()).searchParams.get("kind");
    const items =
      kind === "postamat"
        ? [{ ref: POSTAMAT_REF, label: POSTAMAT_LABEL }]
        : [{ ref: DEPARTMENT_REF, label: DEPARTMENT_LABEL }];
    return route.fulfill({ json: { items } });
  });

  await page.route("**/api/nova-poshta/streets**", (route) =>
    route.fulfill({ json: { items: [{ ref: STREET_REF, label: STREET_LABEL }] } }),
  );
}

async function openCheckout(page: Page): Promise<void> {
  await page.goto("/catalog");
  await page.locator('a[href^="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  await page.getByRole("button", { name: "До кошика" }).first().click();
  await page.goto("/checkout");
  await expect(page.locator("#name")).toBeVisible();
}

async function fillContacts(page: Page, name: string): Promise<void> {
  await page.locator("#name").fill(name);
  await page.locator("#phone").fill("+380501112233");
  await page.locator("#email").fill("test@example.com");
  await page.locator("#comment").fill("Замовлення, створене автотестом.");
}

async function chooseSuggestion(
  page: Page,
  fieldId: string,
  query: string,
  label: string,
): Promise<void> {
  const input = page.locator(fieldId);
  await input.fill(query);

  const option = page.getByRole("option", { name: label, exact: false });
  await expect(option.first()).toBeVisible({ timeout: 20_000 });
  await option.first().click();

  await expect(input).toHaveValue(label);
}

function toMoney(text: string): number {
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function totalsRow(scope: Page | Locator, label: string) {
  return scope.locator("div.flex.justify-between").filter({ hasText: label }).first();
}

function checkoutAside(page: Page) {
  return page.locator("aside").first();
}

function orderDetails(page: Page) {
  return page
    .locator("section")
    .filter({
      has: page.getByRole("heading", { name: "Доставка і контакти", exact: true }),
    })
    .first();
}

function orderTotals(page: Page) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Позиції", exact: true }) })
    .first();
}

async function expectTotals(scope: Page | Locator, free: boolean) {
  const goods = toMoney(await totalsRow(scope, "Товари").innerText());
  const shipping = toMoney(await totalsRow(scope, "Доставка").innerText());
  const total = toMoney(await totalsRow(scope, "Разом").innerText());

  expect(goods).toBeGreaterThan(0);
  expect(shipping).toBe(free ? 0 : 80);
  expect(total).toBe(goods + shipping);
}

async function loginAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.locator("#login").fill(adminLogin);
  await page.locator("#password").fill(adminPassword);
  await page.getByRole("button", { name: "Увійти" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 20_000 });
}

interface Scenario {
  title: string;
  radio: string;
  deliveryLabel: string;
  customerName: string;
  fillAddress: (page: Page) => Promise<void>;
  expectAddress: (page: Page) => Promise<void>;
  freeShipping: boolean;
}

const scenarios: Scenario[] = [
  {
    title: "Нова пошта — відділення",
    radio: "#d-nova-poshta",
    deliveryLabel: "Нова пошта — відділення",
    customerName: "Клієнт Відділення",
    fillAddress: async (page) => {
      await chooseSuggestion(page, "#city", "Льв", CITY_LABEL);
      await chooseSuggestion(page, "#warehouse", "34", DEPARTMENT_LABEL);
    },
    expectAddress: async (page) => {
      const details = orderDetails(page);
      await expect(details.getByText(CITY_LABEL, { exact: true })).toBeVisible();
      await expect(details.getByText(DEPARTMENT_LABEL, { exact: true })).toBeVisible();
      await expect(details.getByText("Адреса доставки")).toHaveCount(0);
    },
    freeShipping: false,
  },
  {
    title: "Нова пошта — поштомат",
    radio: "#d-nova-poshta-postamat",
    deliveryLabel: "Нова пошта — поштомат",
    customerName: "Клієнт Поштомат",
    fillAddress: async (page) => {
      await chooseSuggestion(page, "#city", "Льв", CITY_LABEL);
      await chooseSuggestion(page, "#warehouse", "НП-1026", POSTAMAT_LABEL);
    },
    expectAddress: async (page) => {
      const details = orderDetails(page);
      await expect(details.getByText(CITY_LABEL, { exact: true })).toBeVisible();
      await expect(details.getByText(POSTAMAT_LABEL, { exact: true })).toBeVisible();
    },
    freeShipping: false,
  },
  {
    title: "Курʼєр Нової пошти",
    radio: "#d-courier",
    deliveryLabel: "Курʼєр Нової пошти",
    customerName: "Клієнт Курʼєр",
    fillAddress: async (page) => {
      await chooseSuggestion(page, "#city", "Льв", CITY_LABEL);
      await chooseSuggestion(page, "#street", "Хрещ", STREET_LABEL);
      await page.locator("#building").fill("12");
      await page.locator("#flat").fill("5");
    },
    expectAddress: async (page) => {
      const details = orderDetails(page);
      await expect(details.getByText(CITY_LABEL, { exact: true })).toBeVisible();
      await expect(
        details.getByText("вул. Хрещатик, буд. 12, кв. 5", { exact: true }),
      ).toBeVisible();
    },
    freeShipping: false,
  },
  {
    title: "Самовивіз із майстерні",
    radio: "#d-pickup",
    deliveryLabel: "Самовивіз з майстерні",
    customerName: "Клієнт Самовивіз",
    fillAddress: async (page) => {
      await expect(page.locator("#city")).toHaveCount(0);
      await expect(page.locator("#warehouse")).toHaveCount(0);
      await expect(page.locator("#street")).toHaveCount(0);
      await expect(page.getByText("Очікуємо вас за вказаною адресою")).toBeVisible();
    },
    expectAddress: async (page) => {
      const details = orderDetails(page);
      await expect(details.getByText(CITY_LABEL, { exact: true })).toHaveCount(0);
    },
    freeShipping: true,
  },
];

test.describe("Оформлення замовлення", () => {
  for (const scenario of scenarios) {
    test(`спосіб доставки: ${scenario.title}`, async ({ page }) => {
      await mockNovaPoshta(page);
      await openCheckout(page);
      await fillContacts(page, scenario.customerName);

      await page.locator(scenario.radio).click();
      await expect(page.locator(scenario.radio)).toHaveAttribute(
        "aria-checked",
        "true",
      );

      await scenario.fillAddress(page);
      await expectTotals(checkoutAside(page), scenario.freeShipping);

      await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
      await page.waitForURL(/\/order\//, { timeout: 30_000 });

      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Дякуємо",
      );
      await expect(
        orderDetails(page).getByText(scenario.deliveryLabel, { exact: true }),
      ).toBeVisible();
      await expect(
        orderDetails(page).getByText(scenario.customerName, { exact: true }),
      ).toBeVisible();
      await scenario.expectAddress(page);
      await expectTotals(orderTotals(page), scenario.freeShipping);

      await page.goto("/cart");
      await expect(
        page.getByRole("heading", { name: "Кошик", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Кошик порожній", exact: true }),
      ).toBeVisible();
    });
  }

  test("самовивіз фіксує безкоштовну доставку, відділення — платну", async ({ page }) => {
    await mockNovaPoshta(page);
    await openCheckout(page);
    await fillContacts(page, "Клієнт Порівняння");

    await page.locator("#d-nova-poshta").click();
    await chooseSuggestion(page, "#city", "Льв", CITY_LABEL);
    await chooseSuggestion(page, "#warehouse", "34", DEPARTMENT_LABEL);
    await expectTotals(checkoutAside(page), false);

    await page.locator("#d-pickup").click();
    await expect(page.locator("#city")).toHaveCount(0);
    await expectTotals(checkoutAside(page), true);

    await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
    await page.waitForURL(/\/order\//, { timeout: 30_000 });
    await expectTotals(orderTotals(page), true);
  });

  test("замовлення Нової пошти видно в адмін-панелі", async ({ page }) => {
    await mockNovaPoshta(page);
    await openCheckout(page);
    await fillContacts(page, "Клієнт Адмінка");

    await page.locator("#d-nova-poshta").click();
    await chooseSuggestion(page, "#city", "Льв", CITY_LABEL);
    await chooseSuggestion(page, "#warehouse", "34", DEPARTMENT_LABEL);

    await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
    await page.waitForURL(/\/order\//, { timeout: 30_000 });

    await loginAdmin(page);
    await page.goto("/admin/orders");

    const row = page.locator("tbody tr", { hasText: "Клієнт Адмінка" });
    await expect(row).toBeVisible();
    await expect(row).toContainText(CITY_LABEL);
    await expect(row).toContainText(DEPARTMENT_LABEL);
    await expect(row).toContainText("Нова пошта — відділення");
  });

  test("серверна валідація блокує некоректні дані", async ({ page }) => {
    await openCheckout(page);

    await page
      .getByRole("button", { name: /Підтвердити замовлення/ })
      .evaluate((button) => {
        const form = button.closest("form");
        form?.setAttribute("novalidate", "novalidate");
      });

    await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();

    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByText("Вкажіть ім'я та прізвище.")).toBeVisible();
    await expect(
      page.getByText("Вкажіть коректний номер телефону у форматі", {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Вкажіть місто або населений пункт.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Перевірте дані замовлення: деякі поля заповнені некоректно.",
        { exact: true },
      ),
    ).toBeVisible();
  });

  test("без ключа Нової пошти: ручний ввід працює", async ({ page }) => {
    await openCheckout(page);
    await fillContacts(page, "Клієнт Ручний");

    await page.locator("#d-nova-poshta").click();
    await page.locator("#city").fill("Одеса");
    await expect(
      page.getByText("Довідник Нової пошти не налаштовано.", { exact: true }),
    ).toBeVisible({ timeout: 20_000 });

    await page.locator("#warehouse").fill("Відділення №12 (вул. Дерибасівська, 4)");
    await expectTotals(checkoutAside(page), false);

    await page.getByRole("button", { name: /Підтвердити замовлення/ }).click();
    await page.waitForURL(/\/order\//, { timeout: 30_000 });

    const details = orderDetails(page);
    await expect(details.getByText("Одеса", { exact: true })).toBeVisible();
    await expect(
      details.getByText("Відділення №12 (вул. Дерибасівська, 4)", { exact: true }),
    ).toBeVisible();
    await expectTotals(orderTotals(page), false);
  });
});
