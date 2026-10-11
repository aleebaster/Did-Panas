import type { StorageStatus, UploadFolder } from "@/lib/storage";

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

export interface MessageResult {
  ok: boolean;
  message?: string;
  error?: string;
}

const NETWORK_ERROR = "Не вдалося звʼязатися зі сервером. Спробуйте ще раз.";

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await response.json();
    return data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function messageOf(data: Record<string, unknown>, fallback: string): string {
  const value = data.error ?? data.message;
  return typeof value === "string" && value ? value : fallback;
}

/** Завантажує зображення. Спочатку пробує прямий upload у Cloudinary (обхід ліміту 4.5MB на Vercel), інакше — через серверний route handler. */
export async function uploadImageFile(
  folder: UploadFolder,
  file: File,
): Promise<UploadResult> {
  if (!file) {
    return { ok: false, error: "Оберіть файл зображення." };
  }

  // 1) Спроба прямого завантаження в Cloudinary (потрібен підпис від сервера)
  try {
    const signResponse = await fetch("/api/admin/storage/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder, contentType: file.type }),
    });
    if (signResponse.ok) {
      const sign = await readJson(signResponse);
      if (
        sign.ok === true &&
        typeof sign.apiKey === "string" &&
        typeof sign.cloudName === "string" &&
        typeof sign.publicId === "string" &&
        typeof sign.timestamp === "number" &&
        typeof sign.signature === "string" &&
        typeof sign.uploadUrl === "string"
      ) {
        const body = new FormData();
        body.set("file", file);
        body.set("api_key", sign.apiKey);
        body.set("timestamp", String(sign.timestamp));
        body.set("signature", sign.signature);
        body.set("public_id", sign.publicId);
        body.set("unique_filename", "false");
        body.set("overwrite", "false");
        if (typeof sign.maxFileSize === "number") {
          body.set("max_file_size", String(sign.maxFileSize));
        }

        const uploadResponse = await fetch(sign.uploadUrl, {
          method: "POST",
          body,
        });
        const uploadData = await readJson(uploadResponse);
        if (
          uploadResponse.ok &&
          typeof uploadData.secure_url === "string" &&
          uploadData.secure_url
        ) {
          return { ok: true, url: uploadData.secure_url };
        }
        const errObj = uploadData.error as { message?: unknown } | undefined;
        return {
          ok: false,
          error:
            typeof errObj?.message === "string"
              ? errObj.message
              : "Помилка завантаження в Cloudinary.",
        };
      }
    }
    // signResponse не ok або неповний payload — переходимо до серверного upload
  } catch {
    // мережева помилка під час sign — пробуємо серверний шлях
  }

  // 2) Серверний шлях (R2 або локальне сховище; для Cloudinary fallback через saveImage)
  const body = new FormData();
  body.set("folder", folder);
  body.set("file", file);

  try {
    const response = await fetch("/api/admin/storage", {
      method: "POST",
      body,
    });
    const data = await readJson(response);
    if (response.ok && data.ok === true && typeof data.url === "string") {
      return { ok: true, url: data.url };
    }
    return { ok: false, error: messageOf(data, NETWORK_ERROR) };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

/** Видаляє файл зі сховища. Посилання з поля прибирає викликувач. */
export async function deleteImageFile(url: string): Promise<UploadResult> {
  try {
    const response = await fetch("/api/admin/storage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await readJson(response);
    if (response.ok && data.ok === true) {
      return { ok: true };
    }
    return { ok: false, error: messageOf(data, NETWORK_ERROR) };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

/** Отримує стан сховища (без секретних значень). */
export async function fetchStorageStatus(): Promise<
  { ok: true; status: StorageStatus } | { ok: false; error: string }
> {
  try {
    const response = await fetch("/api/admin/storage", { cache: "no-store" });
    const data = await readJson(response);
    if (response.ok && data.ok === true && data.status) {
      return { ok: true, status: data.status as StorageStatus };
    }
    return {
      ok: false,
      error: messageOf(data, "Не вдалося отримати стан сховища."),
    };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

/** Запитує перевірку зʼєднання з Cloudflare R2 (HeadBucket). */
export async function requestStorageCheck(): Promise<MessageResult> {
  try {
    const response = await fetch("/api/admin/storage?check=1", {
      cache: "no-store",
    });
    const data = await readJson(response);
    return {
      ok: response.ok && data.ok === true,
      message: messageOf(data, "Перевірку не виконано."),
    };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}
