import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

import {
  FacebookIcon,
  InstagramIcon,
  TelegramIcon,
} from "@/components/brand/social-icons";
import {
  ContentSection,
  InfoCard,
  StaticHeader,
} from "@/components/static/static-page";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Контакти Did Panas: телефон, email, адреса майстерні у Львові, графік роботи та соціальні мережі.",
};

const faq = [
  {
    q: "Звідки відомо походження продукції?",
    a: "Для кожної позиції ми вказуємо походження сировини, склад, вагу та дату партії. Якщо потрібні додаткові відомості щодо конкретної партії — напишіть на email, відповімо.",
  },
  {
    q: "Чи можливе оптове замовлення?",
    a: "Так, ми працюємо з кавʼярнями, магазинами та лавками крафтових продуктів. Напишіть на email — надішлемо прайс і умови відправки.",
  },
  {
    q: "Як зберігати грибний порошок?",
    a: "У щільно закритій ємності, в сухому місці подалі від сонця. Крафт-пакет із застібкою розрахований саме на таке використання.",
  },
  {
    q: "Коли ви відправляєте замовлення?",
    a: "Замовлення, підтверджені до 15:00 у робочий день, відправляємо того ж дня. Після відправлення надсилаємо номер накладної.",
  },
];

export default async function ContactsPage() {
  const { settings } = await getCatalog();
  const socials = [
    { label: "Instagram", href: settings.instagram, Icon: InstagramIcon },
    { label: "Facebook", href: settings.facebook, Icon: FacebookIcon },
    { label: "Telegram", href: settings.telegram, Icon: TelegramIcon },
  ].filter((item) => Boolean(item.href));

  return (
    <div className="container-page py-10 lg:py-14">
      <StaticHeader
        eyebrow="Звʼязок"
        title="Контакти"
        lead="Пишіть або телефонуйте — відповідаємо в робочі години. Також можна завітати до майстерні: показуємо продукцію, відважуємо на місці."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="h-fit space-y-6">
          <InfoCard
            title="Контакти"
            items={[
              { label: "Телефон", value: settings.contactPhone },
              { label: "Email", value: settings.contactEmail },
              { label: "Адреса", value: settings.address },
              { label: "Графік", value: settings.workingHours },
            ]}
          />

          <div className="border border-border bg-paper p-5">
            <p className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
              Швидкі звʼязки
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-brick" aria-hidden />
                <a
                  href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
                  className="font-medium hover:text-brick hover:underline"
                >
                  {settings.contactPhone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-brick" aria-hidden />
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="font-medium hover:text-brick hover:underline"
                >
                  {settings.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="size-4 shrink-0 text-brick" aria-hidden />
                <span className="font-medium">{settings.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="size-4 shrink-0 text-brick" aria-hidden />
                <span className="font-medium">{settings.workingHours}</span>
              </li>
            </ul>

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Ми в мережах</p>
              <div className="mt-3 flex gap-3">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-10 items-center justify-center border border-border bg-cream text-ink transition hover:border-brick hover:text-brick"
                  >
                    <Icon className="size-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <ContentSection title="Часті запитання">
            <div className="space-y-4">
              {faq.map((item) => (
                <div key={item.q} className="border border-border bg-paper p-5">
                  <p className="font-medium text-foreground">{item.q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </ContentSection>

          <ContentSection title="Опт і співпраця">
            <p>
              Для оптових замовлень, роздрібних партнерств та гастрономічних
              проєктів пишіть на{" "}
              <a
                href={`mailto:${settings.contactEmail}?subject=${encodeURIComponent("Оптове замовлення")}`}
                className="font-medium text-brick hover:underline"
              >
                {settings.contactEmail}
              </a>{" "}
              — у темі листа зазначте «Оптове замовлення», ми відповімо
              протягом робочого дня.
            </p>
          </ContentSection>

          <ContentSection title="Важливо">
            <p className="text-sm">{settings.legalNote}</p>
            <p className="text-sm">
              Питання щодо замовлень зручніше ставити{" "}
              <Link
                href="/delivery"
                className="font-medium text-brick hover:underline"
              >
                на сторінці доставки
              </Link>
              , там зібрані всі терміни й тарифи.
            </p>
          </ContentSection>
        </div>
      </div>
    </div>
  );
}
