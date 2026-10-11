import Link from "next/link";

import { BrandMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center lg:py-32">
      <BrandMark className="size-20 text-ink" />
      <p className="eyebrow mt-8">404</p>
      <h1 className="heading-lg mt-3">Такої сторінки немає</h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
        Можливо, посилання застаріло або товар більше не продається. Завітайте
        в каталог — там точно є що обрати.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="btn-vintage h-11 px-6">
          <Link href="/">На головну</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-11 border-2 border-ink px-6"
        >
          <Link href="/catalog">Каталог</Link>
        </Button>
      </div>
    </div>
  );
}
