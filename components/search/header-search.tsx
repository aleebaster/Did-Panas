"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { ProductArt } from "@/components/product/product-media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import type { ProductArt as ProductArtType } from "@/types";

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  art: ProductArtType | null;
  weight: string;
}

interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
}

export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({
    query: "",
    results: [],
    loading: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const activeQuery = query.trim();
  const results = search.query === activeQuery ? search.results : [];
  const loading =
    activeQuery !== "" && (search.query !== activeQuery || search.loading);

  useEffect(() => {
    if (!open) {
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!activeQuery) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearch((previous) => ({ ...previous, loading: true }));
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(activeQuery)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { results: SearchResult[] };
        setSearch({ query: activeQuery, results: data.results, loading: false });
      } catch {
        if (!controller.signal.aborted) {
          setSearch({ query: activeQuery, results: [], loading: false });
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeQuery]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      return;
    }
    setOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(value)}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Пошук по каталогу"
        className="grid size-9 place-items-center rounded-md text-foreground transition hover:bg-muted"
      >
        <Search className="size-5" />
      </DialogTrigger>

      <DialogContent className="top-10 max-w-xl gap-0 border-border bg-paper p-0">
        <form onSubmit={submitSearch} className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <DialogTitle className="sr-only">Пошук по каталогу</DialogTitle>
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук: білий гриб, чай, набір…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </form>

        <div className="max-h-80 overflow-y-auto p-2">
          {!query.trim() && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Введіть назву товару, категорії або артикул.
            </p>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Нічого не знайдено за запитом «{query}».
            </p>
          )}

          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/product/${result.slug}`);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition hover:bg-muted"
            >
              <span className="relative size-12 shrink-0 overflow-hidden border border-border bg-muted">
                {result.image ? (
                  <Image
                    src={result.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <ProductArt art={result.art} name={result.name} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {result.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {result.weight}
                </span>
              </span>
              <span className="font-display text-sm font-semibold">
                {formatPrice(result.price)}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-border px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const value = query.trim();
              setOpen(false);
              router.push(value ? `/catalog?q=${encodeURIComponent(value)}` : "/catalog");
            }}
          >
            Переглянути всі результати
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
