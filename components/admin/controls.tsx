"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteImageFile, uploadImageFile } from "@/lib/upload-client";
import type { UploadFolder } from "@/lib/storage";

export function AdminPageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[0.08em] uppercase">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function FormError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <p className="rounded-md border border-brick/40 bg-brick/10 px-3 py-2 text-sm text-brick">
      {error}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-emerald-700/40 bg-emerald-700/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
      {message}
    </p>
  );
}

export function ConfirmDelete({
  action,
  label = "Видалити",
  confirmText,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmText: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          await action();
          toast.success("Видалено");
        });
      }}
      className="h-8 gap-1.5 px-2 text-brick hover:bg-brick/10 hover:text-brick"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      {label}
    </Button>
  );
}

export function DeleteRedirect({
  action,
  href,
  confirmText,
  label = "Видалити",
}: {
  action: () => Promise<void>;
  href: string;
  confirmText: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          await action();
          toast.success("Видалено");
          router.push(href);
          router.refresh();
        });
      }}
      className="h-9 gap-2 text-brick hover:border-brick/40 hover:bg-brick/10 hover:text-brick"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      {label}
    </Button>
  );
}

async function saveFile(
  folder: UploadFolder,
  file: File | undefined,
): Promise<string | null> {
  if (!file) return null;
  const result = await uploadImageFile(folder, file);
  if (result.ok && result.url) {
    toast.success("Зображення завантажено в сховище");
    return result.url;
  }
  toast.error(result.error ?? "Не вдалося завантажити зображення");
  return null;
}

/** Видаляє файл зі сховища; повертає true, якщо видалення пройшло. */
async function removeFile(url: string): Promise<boolean> {
  const result = await deleteImageFile(url);
  if (result.ok) {
    toast.success("Файл видалено зі сховища — не забудьте зберегти форму");
    return true;
  }
  toast.error(result.error ?? "Не вдалося видалити файл");
  return false;
}

function canDeleteFile(url: string): boolean {
  return Boolean(url) && !url.startsWith("/images/");
}

function DeleteFileButton({
  url,
  onRemoved,
  label = "Видалити файл",
  compact = false,
  testId,
}: {
  url: string;
  onRemoved: (url: string) => void;
  label?: string;
  compact?: boolean;
  testId?: string;
}) {
  const [busy, setBusy] = useState(false);

  if (!canDeleteFile(url)) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon-sm" : "sm"}
      aria-label={label}
      data-testid={testId}
      data-url={url}
      disabled={busy}
      onClick={() => {
        if (
          !window.confirm(
            "Видалити файл із сховища? Посилання прибереться з поля — не забудьте зберегти форму.",
          )
        ) {
          return;
        }
        setBusy(true);
        void removeFile(url).then((ok) => {
          setBusy(false);
          if (ok) onRemoved(url);
        });
      }}
      className={
        compact
          ? "size-7 border-border/60 bg-paper/90 text-brick hover:border-brick/40 hover:bg-brick/10 hover:text-brick"
          : "h-9 gap-1.5 text-brick hover:border-brick/40 hover:bg-brick/10 hover:text-brick"
      }
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      {compact ? null : label}
    </Button>
  );
}

export function ImageInput({
  name,
  label,
  value,
  folder,
  hint,
}: {
  name: string;
  label: string;
  value?: string;
  folder: UploadFolder;
  hint?: string;
}) {
  const [current, setCurrent] = useState(value ?? "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    setBusy(true);
    const url = await saveFile(folder, file);
    setBusy(false);
    if (url) setCurrent(url);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={name}
          name={name}
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          placeholder="/uploads/products/pack.jpg"
          className="min-w-0 flex-1"
          data-testid={`url-${name}`}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          data-testid={`upload-${name}`}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="h-9"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Завантажити
        </Button>
        <DeleteFileButton
          url={current}
          onRemoved={() => setCurrent("")}
          testId={`delete-${name}`}
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {current ? (
        <Image
          src={current}
          alt=""
          width={160}
          height={100}
          unoptimized
          data-testid={`preview-${name}`}
          className="h-24 w-40 border border-border bg-cream object-cover"
        />
      ) : null}
    </div>
  );
}

export function ImagesList({
  label,
  value,
  folder,
}: {
  label: string;
  value: string[];
  folder: UploadFolder;
}) {
  const [current, setCurrent] = useState(value.join("\n"));
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    setBusy(true);
    const url = await saveFile(folder, file);
    setBusy(false);
    if (url) {
      setCurrent((previous) =>
        previous.trim() ? `${previous.trim()}\n${url}` : url,
      );
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  const urls = current
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-2">
      <Label htmlFor="images">{label}</Label>
      <Textarea
        id="images"
        name="images"
        rows={4}
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
        placeholder="Один URL зображення на рядок"
        data-testid="images-url"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          data-testid="upload-images"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="h-9"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Завантажити файл
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG або WEBP, до 8 МБ</p>
      </div>
      {urls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative">
              <Image
                src={url}
                alt=""
                width={72}
                height={72}
                unoptimized
                data-testid="image-thumb"
                data-url={url}
                className="size-18 border border-border bg-cream object-cover"
              />
              <span className="absolute right-1 bottom-1">
                <DeleteFileButton
                  compact
                  url={url}
                  testId="delete-image-thumb"
                  onRemoved={(removed) =>
                    setCurrent(
                      urls.filter((entry) => entry !== removed).join("\n"),
                    )
                  }
                />
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
