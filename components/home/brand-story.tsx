import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";

const steps = [
  {
    step: "01",
    title: "Збір",
    text: "Збираємо гриби власноруч у карпатських лісах, з повагою до природи.",
  },
  {
    step: "02",
    title: "Сушіння",
    text: "Сушимо малими партіями, щоб зберегти аромат і текстуру.",
  },
  {
    step: "03",
    title: "Пакування",
    text: "Крафт-пакети з застібкою, етикетка зі складом і датою партії.",
  },
];

export function BrandStory() {
  return (
    <section className="border-y border-border bg-paper">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-2 lg:py-20">
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden border-2 border-ink">
            <Image
              src="/images/products/cordyceps-veyskovyi-pack.jpg"
              alt="Пакування продукції DID PANAS"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -right-3 -bottom-6 hidden max-w-56 border-2 border-ink bg-gold px-4 py-3 font-display text-xs leading-snug font-semibold tracking-[0.1em] text-ink uppercase sm:block">
            Маленькі партії · велика увага до деталей
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <p className="eyebrow">Про бренд</p>
          <h2 className="heading-lg mt-2">Грибна майстерня з українським характером</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            DID PANAS почався з невеликої майстерні, де гриби сушать, мелють і
            пакують вручну. Ми не робимо великих партій: кожну проходимо на
            світло, перебираємо та пакуємо тільки те, що пройшло контроль.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            На етикетці — повний склад, вага та дата. Ніяких «фірмових
            комплексів» і прихованих інгредієнтів.
          </p>

          <ol className="mt-8 grid gap-5">
            {steps.map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="font-display text-2xl font-semibold text-brick">
                  {item.step}
                </span>
                <span>
                  <span className="block font-display text-sm font-semibold tracking-wide uppercase">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {item.text}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8">
            <Button asChild size="lg" className="btn-vintage h-11 px-6">
              <Link href="/about">Дізнатися більше</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
