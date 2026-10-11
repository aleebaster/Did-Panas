import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";

import { BrandMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Наша історія",
  description:
    "Історія DID PANAS — грибної майстерні з українським характером: карпатські ліси, ручний збір, ретельний відбір і чесне ставлення до покупця.",
};

const story = [
  "Наша історія починається там, де для багатьох усе найкраще й починається, — серед карпатських лісів.",
  "Ми власноруч збираємо гриби в Карпатах, знаємо ціну тихого ранку в лісі, уважного пошуку та справжніх лісових дарів. Для нас гриби — це не просто продукт. Це частина української культури, традицій і особливого звʼязку людини з природою.",
  "Ми створили DID PANAS, щоб ділитися цією любовʼю до грибів з іншими. Кожна партія потребує уваги: гриби потрібно зібрати, ретельно перебрати, належно підготувати, висушити та запакувати, зберігаючи їхні природні властивості й характерний аромат.",
  "Ми віддаємо перевагу продуманому підходу та чесному ставленню до покупця. Нам важливо, щоб людина розуміла, який продукт купує, що входить до його складу та яким способом його підготували.",
  "DID PANAS — це про Карпати, ручну працю, повагу до природи та українську справу, зроблену з душею.",
];

const steps = [
  {
    number: "01",
    title: "Карпати — наше натхнення",
    text: "Ми власноруч збираємо гриби в карпатських лісах, дотримуючись відповідального ставлення до природи та правил збору.",
  },
  {
    number: "02",
    title: "Ретельний відбір",
    text: "Ми уважно перебираємо сировину та не допускаємо до продукції гриби, які не відповідають нашим вимогам до якості.",
  },
  {
    number: "03",
    title: "Увага до підготовки",
    text: "Сушіння, зберігання й пакування мають важливе значення. Ми приділяємо увагу кожному етапу, щоб продукт зберігав належну якість.",
  },
];

const principles = [
  {
    title: "Чесність перед покупцем",
    text: "Нам важливо правильно вказувати склад, вагу та характеристики кожного продукту. Ми не використовуємо гучних обіцянок замість конкретної інформації.",
  },
  {
    title: "Український характер",
    text: "DID PANAS — український бренд, натхненний Карпатами, грибними традиціями та любовʼю до своєї справи.",
  },
  {
    title: "Повага до природи",
    text: "Ми збираємо так, щоб не завдавати лісу шкоди, і бережемо сировину — від першого кошика до останнього пакування.",
  },
  {
    title: "Ручна праця",
    text: "Кожен етап — від збору й перебирання до підготовки та пакування — проходить через наші руки.",
  },
];

const storyAlt =
  "Лісова атмосфера Карпат і продукція грибної майстерні DID PANAS";

function StoryPicture() {
  const desktop = getImageProps({
    alt: storyAlt,
    src: "/images/banners/hero-desktop.png",
    width: 1983,
    height: 793,
    sizes: "(max-width: 1023px) 100vw, 1200px",
    quality: 82,
  }).props;

  const tablet = getImageProps({
    alt: storyAlt,
    src: "/images/banners/hero-tablet.png",
    width: 1622,
    height: 969,
    sizes: "100vw",
    quality: 82,
  }).props;

  const mobile = getImageProps({
    alt: storyAlt,
    src: "/images/banners/hero-mobile.png",
    width: 1092,
    height: 1440,
    sizes: "100vw",
    quality: 82,
  }).props;

  const sources = [
    { media: "(max-width: 639px)", srcSet: mobile.srcSet },
    {
      media: "(min-width: 640px) and (max-width: 1023px)",
      srcSet: tablet.srcSet,
    },
  ].filter((source): source is { media: string; srcSet: string } =>
    Boolean(source.srcSet),
  );

  return (
    <figure className="mt-8">
      <div className="relative aspect-[1092/1440] w-full overflow-hidden border-2 border-ink bg-ink sm:aspect-[1622/969] lg:aspect-[1983/793]">
        <picture>
          {sources.map((source) => (
            <source
              key={source.media}
              media={source.media}
              srcSet={source.srcSet}
              sizes="100vw"
            />
          ))}
          <img
            {...desktop}
            alt={storyAlt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      </div>
      <figcaption className="mt-3 text-xs text-muted-foreground">
        Карпатський ліс — звідси починається кожна наша партія.
      </figcaption>
    </figure>
  );
}

export default async function AboutPage() {
  const { settings } = await getCatalog();

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="border-b border-border pb-8">
        <nav
          aria-label="Хлібні крихти"
          className="text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-foreground hover:underline">
            Головна
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Наша історія</span>
        </nav>
        <p className="eyebrow mt-4">Про бренд</p>
        <h1 className="heading-xl mt-2">Наша історія</h1>
        <p className="mt-4 max-w-2xl text-balance leading-relaxed text-muted-foreground">
          DID PANAS — грибна майстерня з українським характером. Ми власноруч
          збираємо гриби в Карпатах, уважно відбираємо сировину й дбаємо, щоб
          кожна партія була належно підготовлена, висушена та запакована.
        </p>
      </header>

      <StoryPicture />

      <section className="mt-10 grid gap-8 border-b border-border pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          <h2 className="heading-md">Історія бренду</h2>
          <div className="mt-5 space-y-4 leading-relaxed text-foreground/80">
            {story.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <blockquote className="mt-7 border-l-4 border-brick bg-paper py-4 pr-4 pl-5 font-display text-lg leading-snug font-semibold tracking-wide text-ink sm:text-xl">
            Збираємо з повагою до лісу. Готуємо з увагою до деталей. Ділимося
            смаком Карпат.
          </blockquote>
        </div>

        <aside className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden border-2 border-ink">
            <Image
              src="/images/products/cordyceps-veyskovyi-label.jpg"
              alt="Продукція DID PANAS: пакування та висушені гриби"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Малі партії, ручне пакування й етикетка зі складом — щоб було видно,
            саме що ви купуєте.
          </p>
        </aside>
      </section>

      <section className="mt-10 grid gap-8 border-b border-border pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="order-2 lg:order-1">
          <div className="relative aspect-[4/3] overflow-hidden border-2 border-ink">
            <Image
              src="/images/products/yzhovyk-grebinchastyi-pack.jpg"
              alt="Капсули DID PANAS та свіжий їжовик гребінчастий"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="heading-md">Як ми працюємо</h2>
          <ol className="mt-5 space-y-6">
            {steps.map((step) => (
              <li key={step.number} className="flex gap-4 sm:gap-5">
                <span className="font-display text-2xl font-semibold text-brick">
                  {step.number}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base font-semibold tracking-wide uppercase">
                    {step.title}
                  </span>
                  <span className="mt-1.5 block leading-relaxed text-foreground/75">
                    {step.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-10 border-b border-border pb-10">
        <h2 className="heading-md">Наші принципи</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {principles.map((principle) => (
            <div
              key={principle.title}
              className="border border-border bg-paper p-5"
            >
              <p className="font-display text-sm font-semibold tracking-wide uppercase">
                {principle.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {principle.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 border-2 border-ink bg-graphite px-6 py-12 text-center text-cream sm:px-10">
        <BrandMark className="mx-auto size-14 text-cream" />
        <p className="eyebrow mt-6 text-gold">DID PANAS</p>
        <h2 className="heading-lg mt-3 text-cream">{settings.tagline}</h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-cream/75">
          Карпати — наша історія. Гриби — наша справа.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="btn-vintage h-11 border-gold bg-gold px-6 text-ink hover:bg-cream hover:text-ink"
          >
            <Link href="/catalog">Перейти до каталогу</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 border-cream/35 bg-transparent px-6 text-cream hover:bg-cream/10 hover:text-cream"
          >
            <Link href="/contacts">Наші контакти</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
