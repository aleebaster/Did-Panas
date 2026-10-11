import { Leaf, PackageCheck, ShieldCheck, Sprout } from "lucide-react";

const items = [
  {
    icon: Sprout,
    title: "Добірна сировина",
    text: "Карпати чи вирощування в Україні — походження вказано в картці кожного товару.",
  },
  {
    icon: Leaf,
    title: "Без добавок",
    text: "Ні наповнювачів, ні ароматизаторів — склад на етикетці збігається з вмістом.",
  },
  {
    icon: PackageCheck,
    title: "Ручне пакування",
    text: "Кожна партія перебирається та запаковується вручну.",
  },
  {
    icon: ShieldCheck,
    title: "Чесні терміни",
    text: "Підтверджені до 15:00 — відправляємо того ж дня, далі — за 1–2 робочі дні.",
  },
];

export function UspStrip() {
  return (
    <section className="border-b border-border bg-cream">
      <div className="container-page grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-4 bg-cream px-5 py-7">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-ink/15 bg-paper text-brick">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold tracking-wide uppercase">
                {title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
