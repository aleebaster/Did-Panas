import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, LogOut } from "lucide-react";

import { AdminNav } from "@/components/admin/admin-nav";
import { BrandMark } from "@/components/brand/logo";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function AdminShell({
  children,
  newOrders,
}: {
  children: ReactNode;
  newOrders: number;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-ink text-cream">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <BrandMark className="size-8 text-cream" />
            <div>
              <p className="font-display text-sm font-semibold tracking-[0.18em] uppercase">
                DID PANAS
              </p>
              <p className="text-[11px] text-cream/60">Панель керування</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 text-cream hover:bg-cream/10 hover:text-cream"
            >
              <Link href="/">
                <ExternalLink className="size-4" />
                Відкрити сайт
              </Link>
            </Button>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="gap-2 text-cream hover:bg-cream/10 hover:text-cream"
              >
                <LogOut className="size-4" />
                Вийти
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[13rem_1fr]">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="px-3 pb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Розділи
            </p>
            <AdminNav orderBadge={newOrders} />
          </div>
        </aside>

        <main className="min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
