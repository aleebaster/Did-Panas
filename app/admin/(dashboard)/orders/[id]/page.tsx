import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import {
  AdminPageHeader,
  DeleteRedirect,
} from "@/components/admin/controls";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteOrderAction } from "@/lib/actions/orders";
import { listOrders } from "@/lib/db/repository";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/types";

export const metadata: Metadata = { title: "Замовлення" };

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Замовлення"
        description="Склад, клієнт, оплата та керування статусом."
      >
        <Link
          href="/admin/orders"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm transition hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          До списку
        </Link>
      </AdminPageHeader>

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <OrderBody params={params} />
      </Suspense>
    </div>
  );
}

async function OrderBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = listOrders().find((item) => item.id === id);

  if (!order) {
    notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="card-paper space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="font-display text-xl font-semibold">
              Замовлення №{order.number}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <Badge variant="outline">{ORDER_STATUS_LABELS[order.status]}</Badge>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-2 font-medium">Товар</th>
                <th className="px-3 py-2 text-right font-medium">Ціна</th>
                <th className="px-3 py-2 text-right font-medium">К-сть</th>
                <th className="px-3 py-2 text-right font-medium">Сума</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {order.items.map((item) => (
                <tr key={`${order.id}-${item.productId}-${item.slug}`}>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-medium hover:text-brick hover:underline"
                      target="_blank"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {formatPrice(item.price)}
                  </td>
                  <td className="px-3 py-2.5 text-right">{item.quantity}</td>
                  <td className="px-3 py-2.5 text-right font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Товари</dt>
            <dd className="font-medium">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Доставка</dt>
            <dd className="font-medium">
              {order.shipping === 0 ? "Безкоштовно" : formatPrice(order.shipping)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2 text-base">
            <dt className="font-medium">Разом</dt>
            <dd className="font-semibold">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-5">
        <div className="card-paper space-y-4 p-5">
          <p className="eyebrow">Керування</p>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Статус замовлення</p>
            <OrderStatusSelect
              orderId={order.id}
              status={order.status}
              className="w-full"
            />
          </div>
          <DeleteRedirect
            action={deleteOrderAction.bind(null, order.id)}
            href="/admin/orders"
            confirmText={`Видалити замовлення №${order.number}?`}
            label="Видалити замовлення"
          />
        </div>

        <div className="card-paper space-y-3 p-5">
          <p className="eyebrow">Клієнт</p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Імʼя</dt>
              <dd className="font-medium">{order.customer.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Телефон</dt>
              <dd className="font-medium">
                <a
                  href={`tel:${order.customer.phone.replace(/\s/g, "")}`}
                  className="hover:text-brick hover:underline"
                >
                  {order.customer.phone}
                </a>
              </dd>
            </div>
            {order.customer.email ? (
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">
                  <a
                    href={`mailto:${order.customer.email}`}
                    className="hover:text-brick hover:underline"
                  >
                    {order.customer.email}
                  </a>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Місто</dt>
              <dd className="font-medium">{order.customer.city || "—"}</dd>
            </div>
            {order.customer.warehouse ? (
              <div>
                <dt className="text-muted-foreground">Відділення / поштомат</dt>
                <dd className="font-medium">{order.customer.warehouse}</dd>
              </div>
            ) : null}
            {order.customer.address ? (
              <div>
                <dt className="text-muted-foreground">Адреса доставки</dt>
                <dd className="font-medium">{order.customer.address}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Доставка</dt>
              <dd className="font-medium">{order.customer.delivery}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Оплата</dt>
              <dd className="font-medium">{order.customer.payment}</dd>
            </div>
          </dl>

          {order.customer.comment ? (
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Коментар</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {order.customer.comment}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
