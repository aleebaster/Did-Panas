#!/usr/bin/env node
/**
 * Міграція локальних завантажень із public/uploads/ у Cloudinary.
 *
 *   node scripts/migrate-uploads-to-cloudinary.mjs              -> dry-run
 *   node scripts/migrate-uploads-to-cloudinary.mjs --apply      -> завантаження + оновлення data/db.json
 *   node scripts/migrate-uploads-to-cloudinary.mjs --apply --verify -> + перевірка публічних URL
 *
 * Оригінальні файли НІКОЛИ не видаляються. Посилання у data/db.json
 * оновлюються лише після успішного завантаження відповідного файлу.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, "public", "uploads");
const DB_FILE = path.join(ROOT, "data", "db.json");
const ENV_FILES = [".env.local", ".env"];

const CLOUDINARY_ENV_KEYS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const VERIFY = args.has("--verify");

function loadEnvFiles() {
  for (const file of ENV_FILES) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      const value = rawValue.replace(/^["']|["']$/g, "");
      if (value) process.env[key] = value;
    }
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
}

function listUploadFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listUploadFiles(full, base));
    } else if (entry.isFile()) {
      files.push({
        absolute: full,
        relative: path.relative(base, full).split(path.sep).join("/"),
      });
    }
  }
  return files;
}

function collectStrings(value, keyPath, out) {
  if (typeof value === "string") {
    out.push({ keyPath, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStrings(item, `${keyPath}[${index}]`, out),
    );
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      collectStrings(item, keyPath ? `${keyPath}.${key}` : key, out);
    }
  }
}

function walkReplace(node, replaceFn) {
  if (typeof node === "string") return replaceFn(node);
  if (Array.isArray(node)) return node.map((item) => walkReplace(item, replaceFn));
  if (node && typeof node === "object") {
    for (const [key, item] of Object.entries(node)) {
      node[key] = walkReplace(item, replaceFn);
    }
    return node;
  }
  return node;
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

async function uploadToCloudinary(config, publicId, body, contentType) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { public_id: publicId, timestamp };
  const form = new FormData();
  form.set("file", new Blob([body], { type: contentType }), path.basename(publicId));
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
    throw new Error(data?.error?.message ?? `HTTP ${response.status}`);
  }
  return data.secure_url;
}

async function main() {
  console.log("=== Міграція public/uploads → Cloudinary ===");
  console.log(`Режим: ${APPLY ? "APPLY (завантаження + оновлення даних)" : "DRY-RUN (без змін)"}`);

  loadEnvFiles();

  const missing = CLOUDINARY_ENV_KEYS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error("\n[!] Заповніть змінні середовища Cloudinary:");
    for (const key of missing) console.error(`    ${key}=`);
    console.error("Міграцію не розпочато (credentials відсутні).");
    process.exit(1);
  }

  const config = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET.trim(),
  };

  const files = listUploadFiles(UPLOADS_DIR);
  const totalBytes = files.reduce(
    (sum, file) => sum + fs.statSync(file.absolute).size,
    0,
  );

  console.log(`\nЗнайдено файлів: ${files.length}`);
  console.log(`Сумарний розмір: ${formatBytes(totalBytes)}`);
  if (files.length === 0) {
    console.log("Немає що мігрувати.");
    return;
  }

  console.log(`\nАкаунт Cloudinary: ${config.cloudName}`);

  const results = [];
  for (const file of files) {
    const extension = path.extname(file.relative).toLowerCase();
    const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";
    const oldUrl = `/uploads/${file.relative}`;
    const publicId = file.relative.replace(/\.[^.]+$/, "");
    const row = { oldUrl, newUrl: null, bytes: fs.statSync(file.absolute).size, status: "pending", error: null };

    if (!APPLY) {
      row.status = "dry-run";
      row.newUrl = `https://res.cloudinary.com/${config.cloudName}/image/upload/${publicId}`;
      results.push(row);
      continue;
    }

    try {
      const body = fs.readFileSync(file.absolute);
      const secureUrl = await uploadToCloudinary(config, publicId, body, contentType);
      row.status = "uploaded";
      row.newUrl = secureUrl;
    } catch (error) {
      row.status = "failed";
      row.error = error?.message ?? String(error);
    }
    results.push(row);
  }

  const uploaded = results.filter((row) => row.status === "uploaded");
  const failed = results.filter((row) => row.status === "failed");

  console.log("\n--- Завантаження ---");
  for (const row of results) {
    const size = formatBytes(row.bytes);
    const suffix = row.error ? ` (${row.error})` : "";
    console.log(
      `  [${row.status}] ${row.oldUrl} → ${row.newUrl ?? "?"} (${size})${suffix}`,
    );
  }
  console.log(
    `Успішно: ${uploaded.length}, помилок: ${failed.length}, усього: ${results.length}`,
  );

  if (!APPLY) {
    console.log(
      "\nDRY-RUN: нічого не завантажено і data/db.json не змінено. Повторіть з --apply.",
    );
    return;
  }

  if (!fs.existsSync(DB_FILE)) {
    console.log("\ndata/db.json відсутній — посилання оновлювати ніде.");
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  const strings = [];
  collectStrings(db, "", strings);

  const successMap = new Map(uploaded.map((row) => [row.oldUrl, row.newUrl]));
  const matched = strings.filter((entry) => successMap.has(entry.value));

  console.log(`\nПосилань у data/db.json, що відповідають мігрованим файлам: ${matched.length}`);
  for (const entry of matched) {
    console.log(`  ${entry.keyPath}: ${entry.value} → ${successMap.get(entry.value)}`);
  }

  if (failed.length > 0) {
    console.log(
      "\n[!] Є невдалі завантаження — їхні посилання у даних НЕ оновлюються.",
    );
  }

  walkReplace(db, (value) => successMap.get(value) ?? value);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  console.log("\ndata/db.json оновлено (URL замінено лише для успішних файлів).");

  if (VERIFY) {
    console.log("\nПеревірка публічних URL…");
    for (const row of uploaded) {
      try {
        const response = await fetch(row.newUrl, { method: "HEAD" });
        console.log(`  [${response.status}] ${row.newUrl}`);
      } catch (error) {
        console.log(`  [error] ${row.newUrl} (${error?.name ?? "Error"})`);
      }
    }
  }

  console.log(
    "\nГотово. Локальні файли в public/uploads/ залишено на місці —",
    "прибирайте їх лише після окремої перевірки.",
  );
}

main().catch((error) => {
  console.error("[!] Непередбачена помилка:", error?.message ?? error);
  process.exit(1);
});
