import crypto from "node:crypto";

import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
] as const;

export type R2EnvKey = (typeof R2_ENV_KEYS)[number];

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
}

export type StorageEnv = Record<string, string | undefined>;

/** Мінімальний інтерфейс S3-клієнта — дозволяє підміняти мок у тестах. */
export interface S3Like {
  send(command: unknown): Promise<unknown>;
}

export function missingR2Env(env: StorageEnv): R2EnvKey[] {
  return R2_ENV_KEYS.filter((key) => !env[key]?.trim());
}

export function readR2Config(env: StorageEnv): R2Config | null {
  if (missingR2Env(env).length > 0) {
    return null;
  }

  return {
    accountId: env.R2_ACCOUNT_ID?.trim() ?? "",
    accessKeyId: env.R2_ACCESS_KEY_ID?.trim() ?? "",
    secretAccessKey: env.R2_SECRET_ACCESS_KEY?.trim() ?? "",
    bucketName: env.R2_BUCKET_NAME?.trim() ?? "",
    publicBaseUrl: (env.R2_PUBLIC_BASE_URL?.trim() ?? "").replace(/\/+$/, ""),
  };
}

export function createR2Client(config: R2Config): S3Like {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

/** Унікальне й безпечне імʼя обʼєкта: `<folder>/<timestamp>-<random><ext>`. */
export function r2ObjectKey(folder: string, extension: string): string {
  const stamp = Date.now().toString(36);
  const random = crypto.randomBytes(6).toString("hex");
  return `${folder}/${stamp}-${random}${extension}`;
}

export function r2PublicUrl(config: R2Config, key: string): string {
  return `${config.publicBaseUrl}/${key}`;
}

export function r2KeyFromUrl(config: R2Config, url: string): string | null {
  const base = `${config.publicBaseUrl}/`;
  if (!url.startsWith(base)) {
    return null;
  }
  const key = decodeURIComponent(url.slice(base.length));
  if (!key || key.startsWith("/") || key.includes("..") || key.includes("\\")) {
    return null;
  }
  return key;
}

export async function putR2Object(
  client: S3Like,
  config: R2Config,
  input: { key: string; body: Uint8Array; contentType: string },
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteR2Object(
  client: S3Like,
  config: R2Config,
  key: string,
): Promise<void> {
  await client.send(
    new DeleteObjectCommand({ Bucket: config.bucketName, Key: key }),
  );
}

export async function headR2Bucket(
  client: S3Like,
  config: R2Config,
): Promise<void> {
  await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
}
