"use server";

import { revalidatePath, updateTag } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  deliveryLabel,
  getDeliveryOption,
  getPaymentOption,
  isCourier,
  isPickup,
  isPickupPoint,
  paymentLabel,
} from "@/lib/checkout";
import {
  createOrder,
  deleteOrder,
  updateOrderStatus,
} from "@/lib/db/repository";
import { readDbSync, writeDbSync } from "@/lib/db/store";
import {
  isNpConfigured,
  isNpRef,
  searchSettlements,
  verifyWarehouse,
} from "@/lib/nova-poshta";
import type { WarehouseKind } from "@/lib/nova-poshta";
import type { CartLine, Order, OrderStatus } from "@/types";

export interface CheckoutState {
  ok: boolean;
  error: string | null;
  fields?: Record<string, string>;
  orderId?: string;
  orderNumber?: string;
}

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function joinAddress(street: string, building: string, flat: string): string {
  return [
    street,
    building ? `буд. ${building}` : "",
    flat ? `кв. ${flat}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

async function validateWarehouse(
  delivery: string,
  cityRef: string,
  warehouse: string,
  warehouseRef: string,
  fields: Record<string, string>,
): Promise<void> {
  if (!warehouse) {
    fields.warehouse = delivery === "nova-poshta-postamat"
      ? "Вкажіть поштомат."
      : "Вкажіть відділення Нової пошти.";
    return;
  }

  if (cityRef && !isNpRef(cityRef)) {
    fields.city = "Оберіть місто зі списку підказок.";
    return;
  }

  if (warehouseRef && !isNpRef(warehouseRef)) {
    fields.warehouse = "Оберіть відділення зі списку підказок.";
    return;
  }

  if (!isNpConfigured() || !warehouseRef || !cityRef) {
    return;
  }

  try {
    const kind: WarehouseKind =
      delivery === "nova-poshta-postamat" ? "postamat" : "department";
    const verified = await verifyWarehouse(cityRef, kind, warehouseRef);
    if (verified === false) {
      fields.warehouse =
        "Обране відділення не знайдено у цьому місті. Оберіть його зі списку.";
    }
  } catch {
    // Довідник тимчасово недоступний: пропускаємо звірку, що не блокує замовлення.
  }
}

export async function createOrderAction(
  _previous: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const rawCart = field(formData, "cart");
  if (!rawCart) {
    return { ok: false, error: "Кошик порожній." };
  }

  let lines: CartLine[];
  try {
    lines = JSON.parse(rawCart) as CartLine[];
  } catch {
    return { ok: false, error: "Не вдалося прочитати вміст кошика." };
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "Кошик порожній." };
  }

  const name = field(formData, "name");
  const phone = field(formData, "phone");
  const email = field(formData, "email");
  const city = field(formData, "city");
  const cityRef = field(formData, "cityRef");
  const warehouse = field(formData, "warehouse");
  const warehouseRef = field(formData, "warehouseRef");
  const street = field(formData, "street");
  const streetRef = field(formData, "streetRef");
  const building = field(formData, "building");
  const flat = field(formData, "flat");
  const delivery = field(formData, "delivery");
  const payment = field(formData, "payment");
  const comment = field(formData, "comment");

  const fields: Record<string, string> = {};

  if (name.length < 2) {
    fields.name = "Вкажіть ім'я та прізвище.";
  }

  const digits = phone.replace(/\D/g, "");
  if (!/^(?:38)?0\d{9}$/.test(digits)) {
    fields.phone = "Вкажіть коректний номер телефону у форматі +380 XX XXX XX XX.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields.email = "Вкажіть коректну електронну пошту.";
  }

  const deliveryOption = getDeliveryOption(delivery);
  if (!deliveryOption) {
    fields.delivery = "Оберіть спосіб доставки.";
  }

  if (!getPaymentOption(payment)) {
    fields.payment = "Оберіть спосіб оплати.";
  }

  if (deliveryOption && !isPickup(delivery)) {
    if (!city) {
      fields.city = "Вкажіть місто або населений пункт.";
    } else if (cityRef && !isNpRef(cityRef)) {
      fields.city = "Оберіть місто зі списку підказок.";
    } else if (cityRef && isNpConfigured()) {
      try {
        const known = await searchSettlements(city);
        if (known.length > 0 && !known.some((option) => option.ref === cityRef)) {
          fields.city = "Оберіть місто зі списку підказок.";
        }
      } catch {
        // Довідник тимчасово недоступний: пропускаємо звірку, що не блокує замовлення.
      }
    }
  }

  if (deliveryOption && isPickupPoint(delivery)) {
    await validateWarehouse(delivery, cityRef, warehouse, warehouseRef, fields);
  }

  if (deliveryOption && isCourier(delivery)) {
    if (!street) {
      fields.street = "Вкажіть вулицю.";
    } else if (streetRef && !isNpRef(streetRef)) {
      fields.street = "Оберіть вулицю зі списку підказок.";
    }
    if (!building) {
      fields.building = "Вкажіть номер будинку.";
    }
  }

  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      error: "Перевірте дані замовлення: деякі поля заповнені некоректно.",
      fields,
    };
  }

  const db = readDbSync();
  const stockById = new Map(db.products.map((product) => [product.id, product]));

  let subtotal = 0;
  let items: Order["items"];
  try {
    items = lines.map((line) => {
      const product = stockById.get(line.productId);
      if (!product) {
        throw new Error(`Товар «${line.name}» більше недоступний.`);
      }
      if (product.stock < line.quantity) {
        throw new Error(`Недостатньо товару «${product.name}» у наявності.`);
      }
      subtotal += product.price * line.quantity;
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        quantity: line.quantity,
      };
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Не вдалося оформити замовлення.",
    };
  }

  const shipping =
    isPickup(delivery) || subtotal >= db.settings.freeShippingThreshold
      ? 0
      : db.settings.shippingCost;

  const nextProducts = db.products.map((product) => {
    const ordered = items.find((item) => item.productId === product.id);
    if (!ordered) {
      return product;
    }
    return { ...product, stock: Math.max(0, product.stock - ordered.quantity) };
  });
  writeDbSync({ ...db, products: nextProducts });

  const order = createOrder({
    status: "new" as OrderStatus,
    customer: {
      name,
      phone,
      email,
      city: isPickup(delivery) ? "" : city,
      address: isCourier(delivery) ? joinAddress(street, building, flat) : "",
      warehouse: isPickupPoint(delivery) ? warehouse : "",
      delivery: deliveryLabel(delivery),
      payment: paymentLabel(payment),
      comment,
    },
    items,
    subtotal,
    shipping,
    total: subtotal + shipping,
  });

  updateTag("catalog");
  revalidatePath("/admin/orders");

  return { ok: true, error: null, orderId: order.id, orderNumber: order.number };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  await requireAdmin();
  updateOrderStatus(orderId, status);
  revalidatePath("/admin/orders");
}

export async function deleteOrderAction(orderId: string): Promise<void> {
  await requireAdmin();
  deleteOrder(orderId);
  revalidatePath("/admin/orders");
}
