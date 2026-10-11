import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  CLOUDINARY_ENV_KEYS,
  createCloudinaryClient,
  missingCloudinaryEnv,
  readCloudinaryConfig,
  cloudinaryPublicId,
  cloudinaryPublicIdFromUrl,
  type CloudinaryLike,
} from "./storage-cloudinary";
import {
  createR2Client,
  deleteR2Object,
  headR2Bucket,
  missingR2Env,
  putR2Object,
  r2KeyFromUrl,
  r2ObjectKey,
  r2PublicUrl,
  readR2Config,
  type R2Config,
  type S3Like,
  type StorageEnv,
} from "./storage-r2";

export type UploadFolder =
  | "products"
  | "banners"
  | "categories"
  | "branding"
  | "carousel";

export type StorageMode = "cloudinary" | "r2" | "local";

export interface StorageContext {
  /** Для тестів: підміна середовища без зміни process.env. */
  env?: StorageEnv;
  /** Для тестів: мок S3-клієнта замість мережевого виклику. */
  client?: S3Like;
  /** Для тестів: мок клієнта Cloudinary замість мережевого виклику. */
  cloudinaryClient?: CloudinaryLike;
}

export interface StorageStatus {
  mode: StorageMode;
  cloudinary: {
    configured: boolean;
    missing: string[];
    cloudName: string | null;
  };
  r2: {
    configured: boolean;
    missing: string[];
    bucket: string | null;
    publicBaseUrl: string | null;
  };
  runtime: { vercel: boolean; nodeEnv: string };
  canPersist: boolean;
  message: string;
}

export interface StorageCheckResult {
  ok: boolean;
  message: string;
}

/** Помилка зберігання з HTTP-статусом для route handlers. */
export class StorageError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "StorageError";
    this.status = status;
  }
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const DEFAULT_MAX_SIZE = 8 * 1024 * 1024;
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

const MAX_SIZES: Partial<Record<UploadFolder, number>> = {
  carousel: MAX_UPLOAD_SIZE,
};

export function maxUploadSize(folder: UploadFolder): number {
  return MAX_SIZES[folder] ?? DEFAULT_MAX_SIZE;
}

function envOf(context?: StorageContext): StorageEnv {
  return context?.env ?? process.env;
}

function isVercel(env: StorageEnv): boolean {
  return Boolean(env.VERCEL);
}

function uploadsRoot(): string {
  return path.join(process.cwd(), "public", "uploads");
}

function resolveR2(context?: StorageContext): {
  config: R2Config;
  client: S3Like;
} | null {
  const env = envOf(context);
  const config = readR2Config(env);
  if (!config) {
    return null;
  }
  const client = context?.client ?? createR2Client(config);
  return { config, client };
}

function resolveCloudinary(context?: StorageContext): {
  config: import("./storage-cloudinary").CloudinaryConfig;
  client: CloudinaryLike;
} | null {
  const env = envOf(context);
  const config = readCloudinaryConfig(env);
  if (!config) {
    return null;
  }
  const client = context?.cloudinaryClient ?? createCloudinaryClient(config);
  return { config, client };
}

type ImageKind = "jpeg" | "png" | "webp";

function detectImageKind(buffer: Buffer): ImageKind | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function kindOfMime(mime: string): ImageKind | null {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpeg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

/** Перевіряє MIME, розмір і вміст (магічні байти) без довіри до розширення. */
export function validateImageBuffer(input: {
  type: string;
  size: number;
  buffer: Buffer;
  folder: UploadFolder;
}): { ok: true; extension: string; contentType: string } | { ok: false; error: string } {
  const extension = EXTENSIONS[input.type];
  const declaredKind = kindOfMime(input.type);
  if (!extension || !declaredKind) {
    return { ok: false, error: "Підтримуються лише формати JPG, PNG та WEBP." };
  }

  const maxSize = maxUploadSize(input.folder);
  if (input.size > maxSize) {
    const megabytes = Math.round(maxSize / (1024 * 1024));
    return {
      ok: false,
      error: `Файл завеликий. Максимальний розмір — ${megabytes} МБ.`,
    };
  }

  if (input.size === 0 || input.buffer.length === 0) {
    return { ok: false, error: "Оберіть файл зображення." };
  }

  const actualKind = detectImageKind(input.buffer);
  if (!actualKind) {
    return {
      ok: false,
      error: "Файл не є зображенням: вміст не відповідає JPG, PNG або WEBP.",
    };
  }
  if (actualKind !== declaredKind) {
    return {
      ok: false,
      error: "Тип вмісту файлу не збігається із заявленим форматом.",
    };
  }

  const contentType = declaredKind === "jpeg" ? "image/jpeg" : `image/${declaredKind}`;
  return { ok: true, extension, contentType };
}

export type ImageLocation =
  | "cloudinary"
  | "r2"
  | "local"
  | "static"
  | "external"
  | "unknown";

/** Класифікує URL зображення: Cloudinary, R2, локальні uploads, статика, чужі URL. */
export function classifyImageUrl(
  url: string,
  context?: StorageContext,
): ImageLocation {
  if (!url) return "unknown";
  if (url.startsWith("/images/")) return "static";
  if (url.startsWith("/uploads/")) return "local";

  const env = envOf(context);
  const cloudinary = readCloudinaryConfig(env);
  if (
    cloudinary &&
    url.startsWith(`https://res.cloudinary.com/${cloudinary.cloudName}/`)
  ) {
    return "cloudinary";
  }

  const config = readR2Config(env);
  if (config && url.startsWith(`${config.publicBaseUrl}/`)) return "r2";
  if (/^https?:\/\//.test(url)) return "external";
  return "unknown";
}

/** Чи можна видаляти цей файл через адмін-панель. */
export function isManagedImageUrl(
  url: string,
  context?: StorageContext,
): boolean {
  const location = classifyImageUrl(url, context);
  return location === "cloudinary" || location === "r2" || location === "local";
}

/**
 * Зберігає зображення: у Cloudinary (якщо налаштовано), інакше у Cloudflare
 * R2, або локально в `public/uploads/` (режим розробки). На Vercel без
 * зовнішнього сховища помилка замість оманливого «успішного» запису в
 * тимчасову ФС.
 */
export async function saveImage(
  file: File,
  folder: UploadFolder,
  context?: StorageContext,
): Promise<string> {
  if (!file || typeof file === "string" || file.size === 0) {
    throw new StorageError("Оберіть файл зображення.", 400);
  }

  const maxSize = maxUploadSize(folder);
  if (file.size > maxSize) {
    const megabytes = Math.round(maxSize / (1024 * 1024));
    throw new StorageError(
      `Файл завеликий. Максимальний розмір — ${megabytes} МБ.`,
      400,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateImageBuffer({
    type: file.type,
    size: file.size,
    buffer,
    folder,
  });
  if (!validation.ok) {
    throw new StorageError(validation.error, 400);
  }

  const env = envOf(context);
  const cloudinary = resolveCloudinary(context);
  const r2 = cloudinary ? null : resolveR2(context);

  if (!cloudinary && !r2) {
    const missingCloudinary = missingCloudinaryEnv(env);
    if (
      missingCloudinary.length > 0 &&
      missingCloudinary.length < CLOUDINARY_ENV_KEYS.length
    ) {
      throw new StorageError(
        "Cloudinary налаштовано частково: заповніть усі змінні CLOUDINARY_* у середовищі.",
        503,
      );
    }
    const missing = missingR2Env(env);
    if (missing.length > 0 && missing.length < 5) {
      throw new StorageError(
        "Cloudflare R2 налаштовано частково: заповніть усі змінні R2_* у середовищі.",
        503,
      );
    }
    if (isVercel(env)) {
      throw new StorageError(
        "Cloudinary або Cloudflare R2 не налаштовано. На Vercel локальна папка public/uploads не зберігається між розгортаннями — додайте змінні CLOUDINARY_* (рекомендовано) або R2_* у налаштування Vercel.",
        503,
      );
    }

    const fileName = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}${validation.extension}`;
    const directory = path.join(uploadsRoot(), folder);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, fileName), buffer);
    return `/uploads/${folder}/${fileName}`;
  }

  if (cloudinary) {
    // public_id без розширення: Cloudinary визначає формат із файлу,
    // а cloudinaryPublicIdFromUrl прибирає його з URL при видаленні
    const publicId = cloudinaryPublicId(folder);
    try {
      const result = await cloudinary.client.upload({
        publicId,
        body: buffer,
        contentType: validation.contentType,
      });
      return result.secureUrl;
    } catch (error) {
      console.error(
        "[storage] Cloudinary upload failed:",
        error instanceof Error ? error.name : String(error),
      );
      throw new StorageError(
        "Не вдалося завантажити файл у Cloudinary. Перевірте змінні середовища CLOUDINARY_* та доступ ключа до акаунта.",
        502,
      );
    }
  }

  const key = r2ObjectKey(folder, validation.extension);
  try {
    await putR2Object(r2!.client, r2!.config, {
      key,
      body: buffer,
      contentType: validation.contentType,
    });
  } catch (error) {
    console.error(
      "[storage] R2 upload failed:",
      error instanceof Error ? error.name : String(error),
    );
    throw new StorageError(
      "Не вдалося завантажити файл у Cloudflare R2. Перевірте змінні середовища R2_* та доступ ключа до бакета.",
      502,
    );
  }

  return r2PublicUrl(r2!.config, key);
}

export interface DeleteResult {
  ok: boolean;
  error?: string;
}

/**
 * Видаляє файл із сховища. Статичні зображення `public/images/` та чужі URL
 * не видаляються ніколи.
 */
export async function deleteImage(
  url: string,
  context?: StorageContext,
): Promise<DeleteResult> {
  if (!url || typeof url !== "string") {
    return { ok: false, error: "Не вказано файл для видалення." };
  }

  const location = classifyImageUrl(url, context);

  if (location === "static") {
    return {
      ok: false,
      error:
        "Це статичне зображення проєкту (public/images) — його не можна видалити через адмін-панель.",
    };
  }

  if (location === "external" || location === "unknown") {
    return {
      ok: false,
      error: "Це посилання не належить сховищу магазину — файл не видалено.",
    };
  }

  if (location === "cloudinary") {
    const cloudinary = resolveCloudinary(context);
    if (!cloudinary) {
      return {
        ok: false,
        error:
          "Cloudinary не налаштовано — видалення недоступне. Заповніть змінні CLOUDINARY_*.",
      };
    }
    const publicId = cloudinaryPublicIdFromUrl(cloudinary.config, url);
    if (!publicId) {
      return { ok: false, error: "Некоректне посилання на файл у Cloudinary." };
    }
    try {
      await cloudinary.client.destroy(publicId);
      return { ok: true };
    } catch (error) {
      console.error(
        "[storage] Cloudinary delete failed:",
        error instanceof Error ? error.name : String(error),
      );
      return {
        ok: false,
        error: "Не вдалося видалити файл із Cloudinary.",
      };
    }
  }

  if (location === "r2") {
    const r2 = resolveR2(context);
    if (!r2) {
      return {
        ok: false,
        error:
          "Cloudflare R2 не налаштовано — видалення з R2 недоступне. Заповніть змінні R2_*.",
      };
    }
    const key = r2KeyFromUrl(r2.config, url);
    if (!key) {
      return { ok: false, error: "Некоректне посилання на файл у R2." };
    }
    try {
      await deleteR2Object(r2.client, r2.config, key);
      return { ok: true };
    } catch (error) {
      console.error(
        "[storage] R2 delete failed:",
        error instanceof Error ? error.name : String(error),
      );
      return {
        ok: false,
        error: "Не вдалося видалити файл із Cloudflare R2.",
      };
    }
  }

  // локальний файл у public/uploads/
  const relative = url.slice("/uploads/".length);
  if (!relative || relative.includes("..") || relative.startsWith("/")) {
    return { ok: false, error: "Некоректне посилання на локальний файл." };
  }

  const root = uploadsRoot();
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) {
    return { ok: false, error: "Некоректне посилання на локальний файл." };
  }

  try {
    if (fs.existsSync(target)) {
      fs.rmSync(target);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Не вдалося видалити локальний файл." };
  }
}

/** Стан сховища без жодних секретних значень. */
export function getStorageStatus(context?: StorageContext): StorageStatus {
  const env = envOf(context);
  const missingCloudinary = missingCloudinaryEnv(env);
  const cloudinaryConfig = readCloudinaryConfig(env);
  const missing = missingR2Env(env);
  const config = readR2Config(env);
  const vercel = isVercel(env);
  const cloudinaryReady = cloudinaryConfig !== null;
  const r2Ready = config !== null;
  const configured = cloudinaryReady || r2Ready;
  const mode: StorageMode = cloudinaryReady
    ? "cloudinary"
    : r2Ready
      ? "r2"
      : "local";

  const canPersist = configured || !vercel;
  const message = cloudinaryReady
    ? "Фотографії зберігаються у Cloudinary — постійно, незалежно від розгортань."
    : r2Ready
      ? "Фотографії зберігаються у Cloudflare R2 — постійно, незалежно від розгортань."
      : vercel
        ? "Cloudinary не налаштовано: на Vercel завантажені файли не зберігатимуться постійно. Заповніть змінні CLOUDINARY_*."
        : "Режим розробки: файли зберігаються локально в public/uploads/. Для production налаштуйте Cloudinary.";

  return {
    mode,
    cloudinary: {
      configured: cloudinaryReady,
      missing: missingCloudinary,
      cloudName: cloudinaryConfig?.cloudName ?? null,
    },
    r2: {
      configured: r2Ready,
      missing,
      bucket: config?.bucketName ?? null,
      publicBaseUrl: config?.publicBaseUrl ?? null,
    },
    runtime: { vercel, nodeEnv: env.NODE_ENV ?? "development" },
    canPersist,
    message,
  };
}

/** Перевіряє доступність Cloudinary (ping) або бакета R2 (HeadBucket), не розкриваючи ключі. */
export async function checkStorageConnection(
  context?: StorageContext,
): Promise<StorageCheckResult> {
  const status = getStorageStatus(context);

  if (status.cloudinary.configured) {
    const cloudinary = resolveCloudinary(context);
    if (!cloudinary) {
      return { ok: false, message: "Cloudinary не налаштовано." };
    }
    try {
      await cloudinary.client.ping();
      return {
        ok: true,
        message: `Акаунт Cloudinary «${cloudinary.config.cloudName}» доступний для завантаження та видалення.`,
      };
    } catch (error) {
      const name = error instanceof Error ? error.name : "Error";
      console.error("[storage] Cloudinary ping failed:", name);
      return {
        ok: false,
        message: `Не вдалося перевірити доступ до Cloudinary (${name}). Перевірте значення змінних CLOUDINARY_* та права ключа.`,
      };
    }
  }

  if (!status.r2.configured) {
    return {
      ok: false,
      message: `Cloudinary та Cloudflare R2 не налаштовано. Заповніть: ${status.cloudinary.missing.join(", ")}.`,
    };
  }

  const r2 = resolveR2(context);
  if (!r2) {
    return { ok: false, message: "Cloudflare R2 не налаштовано." };
  }

  try {
    await headR2Bucket(r2.client, r2.config);
    return {
      ok: true,
      message: `Бакет «${r2.config.bucketName}» доступний для запису та читання.`,
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    console.error(
      "[storage] R2 head bucket failed:",
      name,
    );
    return {
      ok: false,
      message: `Не вдалося перевірити доступ до бакета (${name}). Перевірте права ключа та назву бакета.`,
    };
  }
}
