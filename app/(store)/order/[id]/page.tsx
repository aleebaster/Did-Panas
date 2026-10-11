import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, PackageCheck, Truck } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";
import { readDbSync } from "@/lib/db/store";
import { ORDER_STATUS_LABELS, type Order } from "@/types";

export const metadata: Metadata = {
  title: "Замовлення прийнято",
  robots: { index: false },
};

export default function OrderPage({
  params,
}: PageProps<"/order/[id]">) {
  return (
    <div className="container-page py-12">
      <Suspense fallback={<OrderSkeleton />}>
        <OrderDetails params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = readDbSync().orders.find((item) => item.id === id);

  if (!order) {
    notFound();
  }

  return <OrderSummary order={order} />;
}

function OrderSummary({ order }: { order: Order }) {
  return (
    <>
      <div className="mx-auto max-w-3xl border border-border bg-paper p-8 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e3e6da] text-[#3d6b3f]">
          <CheckCircle2 className="size-8" />
        </span>
        <p className="eyebrow mt-5">Замовлення {order.number}</p>
        <h1 className="heading-lg mt-2">Дякуємо! Ми вже отримали заявку</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Менеджер зателефонує протягом робочого дня, щоб підтвердити наявність
          та спосіб доставки. Статус замовлення:{" "}
          <span className="font-medium text-foreground">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          .
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Оформлено {formatDate(order.createdAt)} · {order.customer.name} ·{" "}
          {order.customer.phone}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-3xl grid gap-6 md:grid-cols-2">
        <section className="border border-border bg-paper p-6">
          <h2 className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
            Позиції
          </h2>
          <ul className="mt-4 divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <span className="block text-xs text-muted-foreground">
                    ×{item.quantity}
                  </span>
                </span>
                <span className="font-medium">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Товари</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка</span>
              <span>
                {order.shipping === 0 ? "безкоштовно" : formatPrice(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-semibold">
              <span>Разом</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        <section className="border border-border bg-cream p-6">
          <h2 className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
            Доставка і контакти
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Отримувач</dt>
              <dd className="font-medium">{order.customer.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Телефон</dt>
              <dd className="font-medium">{order.customer.phone}</dd>
            </div>
            {order.customer.email && (
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{order.customer.email}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Місто</dt>
              <dd className="font-medium">{order.customer.city}</dd>
            </div>
            {order.customer.warehouse && (
              <div>
                <dt className="text-muted-foreground">Відділення / поштомат</dt>
                <dd className="font-medium">{order.customer.warehouse}</dd>
              </div>
            )}
            {order.customer.address && (
              <div>
                <dt className="text-muted-foreground">Адреса доставки</dt>
                <dd className="font-medium">{order.customer.address}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Спосіб доставки</dt>
              <dd className="font-medium">{order.customer.delivery}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Оплата</dt>
              <dd className="font-medium">{order.customer.payment}</dd>
            </div>
            {order.customer.comment && (
              <div>
                <dt className="text-muted-foreground">Коментар</dt>
                <dd>{order.customer.comment}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 space-y-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <PackageCheck className="mt-0.5 size-4 shrink-0 text-brick" />
              Пакуємо вручну, відправляємо за 1–2 робочі дні.
            </p>
            <p className="flex items-start gap-2">
              <Truck className="mt-0.5 size-4 shrink-0 text-brick" />
              Слідкувати за посилкою можна в додатку Нової пошти.
            </p>
          </div>
        </section>
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3">
        <Link
          href="/catalog"
          className="btn-vintage inline-flex h-11 items-center px-6 font-medium"
        >
          Продовжити покупки
        </Link>
        <Link
          href="/contacts"
          className="inline-flex h-11 items-center border-2 border-ink px-6 font-medium transition hover:bg-ink hover:text-cream"
        >
          Звʼязатися з нами
        </Link>
      </div>
    </>
  );
}

function OrderSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="h-64 w-full" />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
