import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/controls";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Badge } from "@/components/ui/badge";
import { listOrders } from "@/lib/db/repository";
import { formatDateTime, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Замовлення" };

export default function AdminOrdersPage() {
  const orders = [...listOrders()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const newCount = orders.filter((order) => order.status === "new").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Замовлення"
        description={
          orders.length === 0
            ? "Замовлень поки немає."
            : `${orders.length} замовлень, з них ${newCount} нових.`
        }
      />

      {orders.length === 0 ? (
        <div className="card-paper p-6 text-sm text-muted-foreground">
          Тут зʼявляться замовлення, оформлені на сайті. Статус змінюється
          випадаючим списком, а деталі — за кліком на номер.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[56rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Замовлення</th>
                <th className="px-4 py-3 font-medium">Клієнт</th>
                <th className="px-4 py-3 font-medium">Доставка</th>
                <th className="px-4 py-3 font-medium">Сума</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 text-right font-medium">Деталі</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="align-middle">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium hover:text-brick hover:underline"
                    >
                      №{order.number}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer.phone}
                      {order.customer.email ? ` · ${order.customer.email}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p className="text-foreground">{order.customer.city || "—"}</p>
                    <p className="text-xs">{order.customer.delivery}</p>
                    {order.customer.warehouse && (
                      <p className="text-xs">{order.customer.warehouse}</p>
                    )}
                    {order.customer.address && (
                      <p className="text-xs">{order.customer.address}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(order.total)}
                    <p className="text-xs font-normal text-muted-foreground">
                      {order.items.length} позицій
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm font-medium text-brick hover:underline"
                    >
                      Відкрити
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(["new", "confirmed", "shipped", "completed", "cancelled"] as const).map(
          (status) => {
            const count = orders.filter((order) => order.status === status).length;
            return (
              <Badge key={status} variant={count > 0 ? "default" : "outline"}>
                {status}: {count}
              </Badge>
            );
          },
        )}
      </div>
    </div>
  );
}
