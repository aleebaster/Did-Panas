import type { Metadata } from "next";
import Link from "next/link";

import {
  ContentSection,
  InfoCard,
  StaticHeader,
} from "@/components/static/static-page";
import { Button } from "@/components/ui/button";
import { getCatalog } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Доставка і оплата",
  description:
    "Умови доставки та оплати замовлень Did Panas: Нова пошта по Україні, самовивіз, терміни відправлення.",
};

export default async function DeliveryPage() {
  const { settings } = await getCatalog();

  return (
    <div className="container-page py-10 lg:py-14">
      <StaticHeader
        eyebrow="Логістика"
        title="Доставка і оплата"
        lead="Відправляємо замовлення Новою поштою по всій Україні та приймаємо самовивіз із майстерні у Калуші. Замовлення, підтверджені до 15:00, відправляємо того ж робочого дня."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <ContentSection title="Способи доставки">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                title="Нова пошта — відділення"
                items={[
                  { label: "Термін", value: "1–3 робочі дні" },
                  { label: "Тариф", value: "за тарифами перевізника" },
                  { label: "Оплата", value: "при отриманні або онлайн" },
                ]}
              />
              <InfoCard
                title="Нова пошта — поштомат"
                items={[
                  { label: "Термін", value: "1–3 робочі дні" },
                  { label: "Тариф", value: "за тарифами перевізника" },
                  { label: "Зручно", value: "без черг у відділенні" },
                ]}
              />
              <InfoCard
                title="Курʼєр Нової пошти"
                items={[
                  { label: "Термін", value: "1–2 робочі дні" },
                  { label: "Адреса", value: "двері до дверей" },
                  { label: "Оплата", value: "курʼєру при отриманні" },
                ]}
              />
              <InfoCard
                title="Самовивіз"
                items={[
                  { label: "Адреса", value: settings.address },
                  { label: "Графік", value: settings.workingHours },
                  { label: "Вартість", value: "безкоштовно" },
                ]}
              />
            </div>
          </ContentSection>

          <ContentSection title="Терміни відправлення">
            <p>
              Замовлення збираємо та пакуємо вручну. Якщо товар у наявності,
              відправлення — протягом 1–2 робочих днів після підтвердження.
              Замовлення, оформлені у вихідні, обробляюмо в понеділок.
            </p>
            <p>
              Після відправлення надсилаємо номер накладної SMS-повідомленням або
              у Telegram — за бажанням.
            </p>
          </ContentSection>

          <ContentSection title="Оплата">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium">Післяплата</strong> — оплата при
                отриманні у відділенні (комісію перевізника сплачує отримувач).
              </li>
              <li>
                <strong className="font-medium">Карткою онлайн</strong> —
                Visa та Mastercard, підтвердження отримуємо одразу.
              </li>
              <li>
                <strong className="font-medium">Безготівковий розрахунок</strong>{" "}
                — для компаній та оптових замовлень, рахунок надсилаємо на email.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="Безкоштовна доставка">
            <p>
              Замовлення від{" "}
              <strong className="font-medium text-foreground">
                {formatPrice(settings.freeShippingThreshold)}
              </strong>{" "}
              доставляємо безкоштовно (крім післяплати). Для менших замовлень
              вартість доставки —{" "}
              <strong className="font-medium text-foreground">
                {formatPrice(settings.shippingCost)}
              </strong>{" "}
              або за тарифом перевізника, якщо він вищий.
            </p>
          </ContentSection>

          <ContentSection title="Обмін і повернення">
            <p>
              Відповідно до законодавства України, харчові продукти належної
              якості не підлягають поверненню. Якщо товар приїхав пошкодженим,
              має іншу вагу або ви помилку в замовленні — напишіть нам протягом
              48 годин із фото, ми вирішимо питання: надішлемо добір або
              повернемо кошти.
            </p>
          </ContentSection>
        </div>

        <aside className="h-fit space-y-6">
          <div className="border-2 border-ink bg-gold p-6 text-ink">
            <p className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
              Потрібна допомога?
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              Зателефонуйте — підкажемо щодо наявності, термінів та способу
              оплати.
            </p>
            <p className="mt-4 font-display text-xl font-semibold">
              <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}>
                {settings.contactPhone}
              </a>
            </p>
            <p className="mt-1 text-sm">{settings.workingHours}</p>
          </div>

          <div className="border border-border bg-paper p-6">
            <p className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
              Швидкі посилання
            </p>
            <ul className="mt-4 grid gap-2.5 text-sm">
              <li>
                <Link href="/catalog" className="hover:text-brick hover:underline">
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="hover:text-brick hover:underline">
                  Контакти
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brick hover:underline">
                  Умови використання
                </Link>
              </li>
            </ul>
            <Button asChild className="btn-vintage mt-5 h-10 w-full">
              <Link href="/catalog">До каталогу</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
