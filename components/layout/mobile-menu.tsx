"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { headerLinks } from "@/config/site";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="grid size-9 place-items-center rounded-md text-foreground transition hover:bg-muted lg:hidden"
        aria-label="Відкрити меню"
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex w-80 flex-col gap-0 bg-paper p-0"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-lg tracking-[0.12em] uppercase">
            Меню
          </SheetTitle>
          <SheetTrigger
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Закрити меню"
          >
            <X className="size-4" />
          </SheetTrigger>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="eyebrow mb-3">Каталог</p>
          <div className="mb-6 grid gap-1">
            <Button
              asChild
              variant="ghost"
              className="justify-start px-2 font-medium"
            >
              <Link href="/catalog" onClick={() => setOpen(false)}>
                Усі товари
              </Link>
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                asChild
                variant="ghost"
                className="justify-start px-2 font-medium"
              >
                <Link
                  href={`/catalog?category=${category.slug}`}
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              </Button>
            ))}
          </div>

          <p className="eyebrow mb-3">Інформація</p>
          <div className="grid gap-1">
            {headerLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="ghost"
                className="justify-start px-2 font-medium"
              >
                <Link href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
