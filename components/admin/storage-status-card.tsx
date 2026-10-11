"use client";

import { useEffect, useState } from "react";
import { Database, Loader2, Plug } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { fetchStorageStatus, requestStorageCheck } from "@/lib/upload-client";
import type { StorageStatus } from "@/lib/storage";

export function StorageStatusCard() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchStorageStatus().then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.ok) {
        setStatus(result.status);
      } else {
        setError(result.error);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCheck() {
    setChecking(true);
    const result = await requestStorageCheck();
    setChecking(false);
    if (result.ok) {
      toast.success(result.message ?? "Перевірку виконано");
    } else {
      toast.error(result.error ?? result.message ?? "Перевірку не виконано");
    }
  }

  const remoteReady = status?.mode === "cloudinary" || status?.mode === "r2";

  return (
    <section className="card-paper space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Сховище фотографій</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Куди потрапляють файли, завантажені в адмін-панелі.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || checking || !remoteReady}
          onClick={() => void handleCheck()}
          className="h-9 gap-2"
        >
          {checking ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plug className="size-4" />
          )}
          Перевірити зʼєднання
        </Button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Перевіряємо конфігурацію…
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-brick/40 bg-brick/10 px-3 py-2 text-sm text-brick">
          {error}
        </p>
      ) : null}

      {status ? (
        <div className="space-y-3">
          <p
            className={
              status.canPersist
                ? "flex items-start gap-2 rounded-md border border-emerald-700/40 bg-emerald-700/10 px-3 py-2 text-sm text-emerald-800"
                : "flex items-start gap-2 rounded-md border border-brick/40 bg-brick/10 px-3 py-2 text-sm text-brick"
            }
          >
            <Database className="mt-0.5 size-4 shrink-0" />
            <span>{status.message}</span>
          </p>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-border bg-cream/50 px-3 py-2">
              <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                Режим
              </dt>
              <dd className="font-medium">
                {status.mode === "cloudinary"
                  ? "Cloudinary (постійне)"
                  : status.mode === "r2"
                    ? "Cloudflare R2 (постійне)"
                    : "Локальне сховище"}
              </dd>
            </div>
            {status.mode === "cloudinary" ? (
              <div className="rounded-md border border-border bg-cream/50 px-3 py-2">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  Акаунт Cloudinary
                </dt>
                <dd className="font-medium">
                  {status.cloudinary.cloudName ?? "не вказано"}
                </dd>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-cream/50 px-3 py-2">
                <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                  Бакет
                </dt>
                <dd className="font-medium">
                  {status.r2.bucket ?? "не вказано"}
                </dd>
              </div>
            )}
            <div className="rounded-md border border-border bg-cream/50 px-3 py-2 sm:col-span-2">
              <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                Публічний URL
              </dt>
              <dd className="font-medium break-all">
                {status.mode === "cloudinary" && status.cloudinary.cloudName
                  ? `https://res.cloudinary.com/${status.cloudinary.cloudName}`
                  : (status.r2.publicBaseUrl ?? "не вказано")}
              </dd>
            </div>
          </dl>

          {(() => {
            const missing =
              status.mode === "cloudinary"
                ? status.cloudinary.missing
                : status.r2.missing;
            if (missing.length === 0) return null;
            return (
              <div className="text-sm">
                <p className="font-medium">Незаповнені змінні середовища:</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {missing.map((name) => (
                    <li
                      key={name}
                      className="rounded border border-border bg-cream px-2 py-1 font-mono text-xs"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      ) : null}
    </section>
  );
}
