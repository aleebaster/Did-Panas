import crypto from "node:crypto";

export const CLOUDINARY_ENV_KEYS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

export type CloudinaryEnvKey = (typeof CLOUDINARY_ENV_KEYS)[number];

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export type StorageEnv = Record<string, string | undefined>;

/** Мінімальний інтерфейс клієнта Cloudinary — дозволяє підміняти мок у тестах. */
export interface CloudinaryLike {
  upload(input: {
    publicId: string;
    body: Uint8Array;
    contentType: string;
  }): Promise<{ secureUrl: string; publicId: string }>;
  destroy(publicId: string): Promise<void>;
  ping(): Promise<void>;
}

export function missingCloudinaryEnv(env: StorageEnv): CloudinaryEnvKey[] {
  return CLOUDINARY_ENV_KEYS.filter((key) => !env[key]?.trim());
}

export function readCloudinaryConfig(env: StorageEnv): CloudinaryConfig | null {
  if (missingCloudinaryEnv(env).length > 0) {
    return null;
  }

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME?.trim() ?? "",
    apiKey: env.CLOUDINARY_API_KEY?.trim() ?? "",
    apiSecret: env.CLOUDINARY_API_SECRET?.trim() ?? "",
  };
}

/**
 * Підпис Cloudinary: SHA-1 відсортованих параметрів `key=value` через `&`
 * плюс API secret у кінці (документація «Signed upload»).
 */
export function cloudinarySignature(
  params: Record<string, string | number | boolean>,
  apiSecret: string,
): string {
  const stringToSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(stringToSign + apiSecret)
    .digest("hex");
}

/** Унікальне й безпечне public_id: `<folder>/<timestamp36>-<random12hex>`. */
export function cloudinaryPublicId(folder: string): string {
  const stamp = Date.now().toString(36);
  const random = crypto.randomBytes(6).toString("hex");
  return `${folder}/${stamp}-${random}`;
}

export function cloudinaryBaseUrl(config: CloudinaryConfig): string {
  return `https://res.cloudinary.com/${config.cloudName}/image/upload`;
}

export function cloudinaryPublicUrl(
  config: CloudinaryConfig,
  publicId: string,
): string {
  return `${cloudinaryBaseUrl(config)}/${publicId}`;
}

/** Дістає public_id з URL вигляду `…/image/upload/[vNNN/]<public_id>.<ext>`. */
export function cloudinaryPublicIdFromUrl(
  config: CloudinaryConfig,
  url: string,
): string | null {
  const base = `${cloudinaryBaseUrl(config)}/`;
  if (!url.startsWith(base)) {
    return null;
  }
  let rest = decodeURIComponent(url.slice(base.length));
  rest = rest.replace(/^v\d+\//, "");
  rest = rest.replace(/\.[a-zA-Z0-9]+$/, "");
  if (
    !rest ||
    rest.startsWith("/") ||
    rest.includes("..") ||
    rest.includes("\\")
  ) {
    return null;
  }
  return rest;
}

function apiUrl(config: CloudinaryConfig, endpoint: string): string {
  return `https://api.cloudinary.com/v1_1/${config.cloudName}/${endpoint}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "error" in data) {
      const error = (data as { error?: { message?: unknown } }).error;
      if (error && typeof error.message === "string" && error.message) {
        return error.message;
      }
    }
  } catch {
    // не JSON — використовуємо статус нижче
  }
  return `HTTP ${response.status}`;
}

/**
 * Створює клієнт Cloudinary поверх публічного REST API (signed upload /
 * destroy / ping). Викликається лише на сервері: API secret ніколи не
 * потрапляє у браузер.
 */
export function createCloudinaryClient(config: CloudinaryConfig): CloudinaryLike {
  async function signedFetch(
    endpoint: string,
    params: Record<string, string | number | boolean>,
  ): Promise<Response> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = { ...params, timestamp };
    const signature = cloudinarySignature(signed, config.apiSecret);
    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(signed)) {
      body.set(key, String(value));
    }
    body.set("api_key", config.apiKey);
    body.set("signature", signature);
    return fetch(apiUrl(config, endpoint), { method: "POST", body });
  }

  return {
    async upload({ publicId, body, contentType }) {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = cloudinarySignature(
        { public_id: publicId, timestamp },
        config.apiSecret,
      );

      const form = new FormData();
      const blob = new Blob([body.slice().buffer as ArrayBuffer], {
        type: contentType,
      });
      form.set("file", blob, "image");
      form.set("api_key", config.apiKey);
      form.set("timestamp", String(timestamp));
      form.set("signature", signature);
      form.set("public_id", publicId);
      form.set("unique_filename", "false");
      form.set("overwrite", "false");

      const response = await fetch(apiUrl(config, "image/upload"), {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      const data = (await response.json()) as {
        secure_url?: string;
        public_id?: string;
      };
      if (!data.secure_url) {
        throw new Error("Cloudinary не повернув URL завантаженого файлу.");
      }
      return { secureUrl: data.secure_url, publicId: data.public_id ?? publicId };
    },

    async destroy(publicId) {
      const response = await signedFetch("image/destroy", {
        public_id: publicId,
        invalidate: true,
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
      const data = (await response.json()) as { result?: string };
      // «not found» теж вважаємо успіхом: видалення ідемпотентне
      if (data.result && data.result !== "ok" && data.result !== "not found") {
        throw new Error(`Cloudinary: ${data.result}`);
      }
    },

    async ping() {
      const response = await fetch(apiUrl(config, "ping"), {
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
        },
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }
    },
  };
}
