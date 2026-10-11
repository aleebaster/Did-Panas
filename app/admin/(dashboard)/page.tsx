import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Package,
  Plus,
  Receipt,
  Settings2,
  Tags,
} from "lucide-react";

import {
  AdminPageHeader,
} from "@/components/admin/controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listBanners,
  listCategories,
  listOrders,
  listProducts,
} from "@/lib/db/repository";
import { formatDateTime, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/types";

export const metadata: Metadata = { title: "Огляд" };

export default function AdminDashboardPage() {
  const products = listProducts();
  const categories = listCategories();
  const banners = listBanners();
  const orders = listOrders();

  const newOrders = orders.filter((order) => order.status === "new");
  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const inStock = products.filter((product) => product.stock > 0).length;
  const lowStock = products
    .filter((product) => product.stock > 0 && product.stock <= 3)
    .sort((a, b) => a.stock - b.stock);
  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const stats = [
    {
      label: "Товарів",
      value: String(products.length),
      note: `${inStock} у наявності`,
      icon: Package,
      href: "/admin/products",
    },
    {
      label: "Нових замовлень",
      value: String(newOrders.length),
      note: `усього ${orders.length}`,
      icon: Receipt,
      href: "/admin/orders",
    },
    {
      label: "Виручка",
      value: formatPrice(revenue),
      note: "без скасованих",
      icon: Settings2,
      href: "/admin/orders",
    },
    {
      label: "Категорії / банери",
      value: `${categories.length} / ${banners.filter((banner) => banner.active).length}`,
      note: `${banners.length} усього банерів`,
      icon: Tags,
      href: "/admin/categories",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Огляд"
        description="Стан магазину, замовлення та швидкі дії."
      >
        <Button asChild className="h-9 gap-2">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Новий товар
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-9 gap-2">
          <Link href="/admin/banners/new">
            <Plus className="size-4" />
            Новий банер
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition hover:ring-2 hover:ring-ring/40">
              <CardContent className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <p className="text-xs tracking-wide uppercase">{stat.label}</p>
                  <stat.icon className="size-4" aria-hidden />
                </div>
                <p className="font-display text-2xl font-semibold">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.note}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Останні замовлення</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Замовлень поки немає. Перше замовлення зʼявиться тут після
                оформлення на сайті.
              </p>
            ) : (
              <ul className="divide-y">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          №{order.number} · {order.customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt)} · {order.items.length} поз.
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-medium">
                          {formatPrice(order.total)}
                        </span>
                        <Badge variant="outline">
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-brick" />
                Мало на складі
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Усі позиції мають запас більше трьох штук.
                </p>
              ) : (
                lowStock.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 border border-border bg-cream object-cover"
                        />
                      ) : (
                        <div className="size-10 border border-border bg-cream" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.sku}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                        {product.stock} шт
                      </Badge>
                      <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                        <Link href={`/admin/products/${product.id}`}>Редагувати</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Швидкі дії</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/products">
                  <Package className="size-4" />
                  Керувати товарами
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/orders">
                  <Receipt className="size-4" />
                  Переглянути замовлення
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start gap-2">
                <Link href="/admin/settings">
                  <Settings2 className="size-4" />
                  Реквізити та доставка
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
