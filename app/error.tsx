"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center py-24 text-center lg:py-32">
      <p className="eyebrow">Помилка</p>
      <h1 className="heading-lg mt-3">Щось пішло не так</h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
        Не вдалося завантажити сторінку. Спробуйте ще раз — або поверніться на
        головну.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          onClick={reset}
          size="lg"
          className="btn-vintage h-11 px-6"
        >
          Спробувати знову
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-11 border-2 border-ink px-6"
        >
          <Link href="/">На головну</Link>
        </Button>
      </div>
    </div>
  );
}
