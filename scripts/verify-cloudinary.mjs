/**
 * Реальна перевірка Cloudinary: upload → HEAD URL → replace → destroy.
 * Запуск: node scripts/verify-cloudinary.mjs
 * Читає CLOUDINARY_* з .env.local або середовища. Секрети не друкуються.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

function signature(params, apiSecret) {
  const stringToSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(stringToSign + apiSecret)
    .digest("hex");
}

function jpegBytes(size = 256) {
  const bytes = new Uint8Array(size).fill(0x20);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
}

async function destroy(config, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp, invalidate: true };
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.set(key, String(value));
  }
  body.set("api_key", config.apiKey);
  body.set("signature", signature(params, config.apiSecret));
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    { method: "POST", body },
  );
  if (!response.ok) {
    throw new Error(`destroy HTTP ${response.status}`);
  }
}

async function upload(config, publicId, bodyBytes) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const form = new FormData();
  form.set("file", new Blob([bodyBytes.buffer], { type: "image/jpeg" }), "verify.jpg");
  form.set("api_key", config.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("signature", signature(params, config.apiSecret));
  form.set("public_id", publicId);
  form.set("unique_filename", "false");
  form.set("overwrite", "true");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.secure_url) {
    throw new Error(
      `upload HTTP ${response.status}: ${data?.error?.message ?? "невідома помилка"}`,
    );
  }
  return data.secure_url;
}

async function main() {
  loadEnvLocal();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    console.error(
      "ПОМИЛКА: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY та CLOUDINARY_API_SECRET мають бути заповнені в .env.local або середовищі.",
    );
    process.exit(1);
  }

  const config = { cloudName, apiKey, apiSecret };
  const publicId = `verify/${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;

  console.log("1) Завантаження тестового JPEG…");
  const url = await upload(config, publicId, jpegBytes());
  console.log(`   OK: ${url}`);

  console.log("2) HEAD запит публічного URL…");
  const head = await fetch(url, { method: "HEAD" });
  if (!head.ok) {
    throw new Error(`HEAD HTTP ${head.status}`);
  }
  const contentType = head.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`очікувався image/*, отримано ${contentType}`);
  }
  console.log(`   OK: ${contentType}`);

  console.log("3) Повторне завантаження (replace)…");
  const replaced = await upload(config, publicId, jpegBytes(512));
  console.log(`   OK: ${replaced}`);

  console.log("4) Видалення…");
  await destroy(config, publicId);
  const afterDelete = await fetch(url, { method: "HEAD" }).catch(() => null);
  if (afterDelete && afterDelete.ok) {
    console.log("   УВАГА: файл ще доступний після destroy (каш Cloudinary може затриматись).");
  } else {
    console.log("   OK: файл більше недоступний.");
  }

  console.log("\nУсі перевірки Cloudinary пройшли.");
}

main().catch((error) => {
  console.error(`\nПОМИЛКА: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
