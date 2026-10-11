import { expect, test, type Locator, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  checkStorageConnection,
  classifyImageUrl,
  deleteImage,
  getStorageStatus,
  maxUploadSize,
  saveImage,
} from "../lib/storage";
import {
  cloudinaryPublicIdFromUrl,
  cloudinarySignature,
  readCloudinaryConfig,
  type CloudinaryLike,
} from "../lib/storage-cloudinary";
import { readR2Config } from "../lib/storage-r2";

const SECRET_VALUE = "do-not-leak-this-r2-secret-value";
const CLOUDINARY_SECRET_VALUE = "do-not-leak-this-cloudinary-secret";

const R2_ENV = {
  R2_ACCOUNT_ID: "account-id-test",
  R2_ACCESS_KEY_ID: "access-key-id-test",
  R2_SECRET_ACCESS_KEY: SECRET_VALUE,
  R2_BUCKET_NAME: "did-panas-images",
  R2_PUBLIC_BASE_URL: "https://images.did-panas.test",
};

const CLOUDINARY_ENV = {
  CLOUDINARY_CLOUD_NAME: "Root",
  CLOUDINARY_API_KEY: "test-api-key",
  CLOUDINARY_API_SECRET: CLOUDINARY_SECRET_VALUE,
};

const adminLogin = process.env.ADMIN_LOGIN ?? "admin";
const adminPassword = process.env.ADMIN_PASSWORD ?? "";

function bytes(size: number, fill = 0x41): Uint8Array<ArrayBuffer> {
  return new Uint8Array(size).fill(fill);
}

function imageFile(options: {
  kind: "jpeg" | "png" | "webp";
  size?: number;
  mime?: string;
  name?: string;
}): File {
  const size = options.size ?? 512;
  let buffer: Uint8Array<ArrayBuffer>;

  if (options.kind === "jpeg") {
    buffer = bytes(size, 0x20);
    buffer[0] = 0xff;
    buffer[1] = 0xd8;
    buffer[2] = 0xff;
    buffer[3] = 0xe0;
  } else if (options.kind === "png") {
    buffer = bytes(size, 0x20);
    buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  } else {
    buffer = bytes(size, 0x20);
    buffer.set(new TextEncoder().encode("RIFF"), 0);
    new DataView(buffer.buffer).setUint32(4, size - 8, true);
    buffer.set(new TextEncoder().encode("WEBP"), 8);
  }

  const mime =
    options.mime ??
    (options.kind === "jpeg"
      ? "image/jpeg"
      : options.kind === "png"
        ? "image/png"
        : "image/webp");

  return new File([buffer], options.name ?? `file.${options.kind}`, {
    type: mime,
  });
}

interface RecordedCommand {
  name: string;
  input: Record<string, unknown>;
}

function createMockClient(failWith?: string) {
  const commands: RecordedCommand[] = [];
  return {
    commands,
    async send(command: unknown): Promise<unknown> {
      const name = (command as { constructor: { name: string } }).constructor
        .name;
      const input = (command as { input?: Record<string, unknown> }).input ?? {};
      commands.push({ name, input });
      if (failWith) {
        const error = new Error("mock failure");
        error.name = failWith;
        throw error;
      }
      return {};
    },
  };
}

interface RecordedCloudinaryCall {
  method: "upload" | "destroy" | "ping";
  input: Record<string, unknown>;
}

function createMockCloudinary(failWith?: string) {
  const calls: RecordedCloudinaryCall[] = [];
  const client: CloudinaryLike = {
    async upload(input) {
      calls.push({ method: "upload", input: { ...input } });
      if (failWith) {
        throw new Error(failWith);
      }
      return {
        secureUrl: `https://res.cloudinary.com/Root/image/upload/${input.publicId}.jpg`,
        publicId: input.publicId,
      };
    },
    async destroy(publicId) {
      calls.push({ method: "destroy", input: { publicId } });
      if (failWith) {
        throw new Error(failWith);
      }
    },
    async ping() {
      calls.push({ method: "ping", input: {} });
      if (failWith) {
        throw new Error(failWith);
      }
    },
  };
  return { calls, client };
}

test.describe("Сховище зображень: сервіс R2 (mock S3-клієнт)", () => {
  test("успішне завантаження та коректний постійний URL", async () => {
    const client = createMockClient();
    const url = await saveImage(imageFile({ kind: "jpeg" }), "products", {
      env: R2_ENV,
      client,
    });

    expect(url.startsWith(`${R2_ENV.R2_PUBLIC_BASE_URL}/`)).toBe(true);
    expect(url).toContain("/products/");

    const put = client.commands.find((item) => item.name === "PutObjectCommand");
    expect(put, "має бути PutObjectCommand").toBeTruthy();
    expect(put?.input.Bucket).toBe(R2_ENV.R2_BUCKET_NAME);
    expect(String(put?.input.Key)).toMatch(/^products\/.+\.jpg$/);
    expect(put?.input.ContentType).toBe("image/jpeg");
    expect(put?.input.Body).toBeTruthy();
    expect(String(put?.input.CacheControl)).toContain("max-age");
  });

  test("URL зберігається у вигляді, придатному для запису в дані товару", async () => {
    const client = createMockClient();
    const url = await saveImage(imageFile({ kind: "png", name: "hero.png" }), "banners", {
      env: R2_ENV,
      client,
    });

    expect(url).toBe(
      `${R2_ENV.R2_PUBLIC_BASE_URL}/${String(
        client.commands.find((item) => item.name === "PutObjectCommand")?.input
          .Key,
      )}`,
    );
    expect(readR2Config(R2_ENV)?.publicBaseUrl).toBe(
      "https://images.did-panas.test",
    );
  });

  test("заміна: друге завантаження створює новий обʼєкт, старий не видаляється", async () => {
    const client = createMockClient();
    const first = await saveImage(imageFile({ kind: "jpeg" }), "products", {
      env: R2_ENV,
      client,
    });
    const second = await saveImage(imageFile({ kind: "jpeg" }), "products", {
      env: R2_ENV,
      client,
    });

    expect(second).not.toBe(first);
    const puts = client.commands.filter(
      (item) => item.name === "PutObjectCommand",
    );
    expect(puts).toHaveLength(2);
    expect(puts[0].input.Key).not.toBe(puts[1].input.Key);
    expect(
      client.commands.some((item) => item.name === "DeleteObjectCommand"),
    ).toBe(false);
  });

  test("видалення з R2 виконує DeleteObject за ключем із URL", async () => {
    const client = createMockClient();
    const url = await saveImage(imageFile({ kind: "webp" }), "carousel", {
      env: R2_ENV,
      client,
    });

    const result = await deleteImage(url, { env: R2_ENV, client });
    expect(result.ok).toBe(true);

    const remove = client.commands.find(
      (item) => item.name === "DeleteObjectCommand",
    );
    expect(remove).toBeTruthy();
    expect(remove?.input.Bucket).toBe(R2_ENV.R2_BUCKET_NAME);
    expect(remove?.input.Key).toBe(
      url.slice(`${R2_ENV.R2_PUBLIC_BASE_URL}/`.length),
    );
  });

  test("помилка мережі R2 перетворюється на зрозуміле повідомлення", async () => {
    const client = createMockClient("NetworkingError");
    await expect(
      saveImage(imageFile({ kind: "jpeg" }), "products", {
        env: R2_ENV,
        client,
      }),
    ).rejects.toThrow(/Cloudflare R2/);
    expect(
      client.commands.some((item) => item.name === "PutObjectCommand"),
    ).toBe(true);
  });
});

test.describe("Сховище зображень: сервіс Cloudinary (mock клієнт)", () => {
  test("успішне завантаження: public_id в папці та постійний secure_url", async () => {
    const { calls, client } = createMockCloudinary();
    const url = await saveImage(imageFile({ kind: "jpeg" }), "products", {
      env: CLOUDINARY_ENV,
      cloudinaryClient: client,
    });

    expect(url.startsWith("https://res.cloudinary.com/Root/image/upload/")).toBe(
      true,
    );
    expect(url).toContain("/products/");
    expect(url).toMatch(/\.jpg$/);

    const upload = calls.find((item) => item.method === "upload");
    expect(upload, "має бути upload").toBeTruthy();
    expect(String(upload?.input.publicId)).toMatch(/^products\/.+$/);
    expect(String(upload?.input.publicId)).not.toMatch(/\.(jpg|png|webp)$/);
    expect(upload?.input.contentType).toBe("image/jpeg");
    expect((upload?.input.body as Uint8Array).length).toBeGreaterThan(0);
  });

  test("Cloudinary має пріоритет над R2, якщо налаштовані обидва", async () => {
    const { calls, client } = createMockCloudinary();
    const s3 = createMockClient();
    const url = await saveImage(imageFile({ kind: "png" }), "banners", {
      env: { ...CLOUDINARY_ENV, ...R2_ENV },
      cloudinaryClient: client,
      client: s3,
    });

    expect(url).toContain("res.cloudinary.com");
    expect(calls.some((item) => item.method === "upload")).toBe(true);
    expect(s3.commands).toHaveLength(0);

    const status = getStorageStatus({ env: { ...CLOUDINARY_ENV, ...R2_ENV } });
    expect(status.mode).toBe("cloudinary");
  });

  test("видалення: destroy з public_id, витягнутого з URL", async () => {
    const { calls, client } = createMockCloudinary();
    const url = await saveImage(imageFile({ kind: "jpeg" }), "carousel", {
      env: CLOUDINARY_ENV,
      cloudinaryClient: client,
    });

    const result = await deleteImage(url, {
      env: CLOUDINARY_ENV,
      cloudinaryClient: client,
    });
    expect(result.ok).toBe(true);

    const destroy = calls.find((item) => item.method === "destroy");
    expect(destroy, "має бути destroy").toBeTruthy();
    expect(String(destroy?.input.publicId)).toMatch(/^carousel\/.+$/);
    expect(String(destroy?.input.publicId)).not.toMatch(/\.(jpg|png|webp)$/);
  });

  test("public_id з URL: версія vNNN і розширення прибираються", () => {
    const config = readCloudinaryConfig(CLOUDINARY_ENV);
    expect(config).not.toBeNull();
    const base = "https://res.cloudinary.com/Root/image/upload";

    expect(
      cloudinaryPublicIdFromUrl(config!, `${base}/products/abc-123.jpg`),
    ).toBe("products/abc-123");
    expect(
      cloudinaryPublicIdFromUrl(config!, `${base}/v1712345678/products/abc-123.webp`),
    ).toBe("products/abc-123");
    expect(
      cloudinaryPublicIdFromUrl(config!, "https://res.cloudinary.com/Other/image/upload/products/x.jpg"),
    ).toBeNull();
    expect(cloudinaryPublicIdFromUrl(config!, "https://cdn.example.org/x.jpg")).toBeNull();
  });

  test("підпис: детермінований SHA-1 відсортованих параметрів", () => {
    // приклад із документації Cloudinary (folder=sample, timestamp=1315060510)
    const signature = cloudinarySignature(
      { timestamp: 1315060510, folder: "sample" },
      "abcd",
    );
    const expected = createHash("sha1")
      .update("folder=sample&timestamp=1315060510abcd")
      .digest("hex");
    expect(signature).toBe(expected);
  });

  test("помилка завантаження перетворюється на зрозуміле повідомлення", async () => {
    const { client } = createMockCloudinary("Invalid signature");
    await expect(
      saveImage(imageFile({ kind: "jpeg" }), "products", {
        env: CLOUDINARY_ENV,
        cloudinaryClient: client,
      }),
    ).rejects.toThrow(/Cloudinary/);
  });

  test("частково заповнені змінні CLOUDINARY не маскуються локальним режимом", async () => {
    await expect(
      saveImage(imageFile({ kind: "jpeg" }), "products", {
        env: { CLOUDINARY_CLOUD_NAME: "Root" },
        cloudinaryClient: createMockCloudinary().client,
      }),
    ).rejects.toThrow(/частково/);
  });

  test("на Vercel без Cloudinary і R2 — чесна помилка", async () => {
    await expect(
      saveImage(imageFile({ kind: "jpeg" }), "products", {
        env: { VERCEL: "1", NODE_ENV: "production" },
        cloudinaryClient: createMockCloudinary().client,
      }),
    ).rejects.toThrow(/Vercel/);
  });

  test("статус без секретів; ключі лише у назвах змінних", () => {
    const status = getStorageStatus({ env: CLOUDINARY_ENV });
    const serialized = JSON.stringify(status);

    expect(status.mode).toBe("cloudinary");
    expect(status.canPersist).toBe(true);
    expect(status.cloudinary.configured).toBe(true);
    expect(status.cloudinary.cloudName).toBe("Root");
    expect(status.cloudinary.missing).toEqual([]);
    expect(Object.keys(status.cloudinary)).toEqual([
      "configured",
      "missing",
      "cloudName",
    ]);
    expect(serialized).not.toContain(CLOUDINARY_SECRET_VALUE);
    expect(serialized).not.toContain(CLOUDINARY_ENV.CLOUDINARY_API_KEY);
  });

  test("перевірка зʼєднання: ping без розкриття секретів", async () => {
    const ok = await checkStorageConnection({
      env: CLOUDINARY_ENV,
      cloudinaryClient: createMockCloudinary().client,
    });
    expect(ok.ok).toBe(true);
    expect(ok.message).toContain("Root");
    expect(ok.message).not.toContain(CLOUDINARY_SECRET_VALUE);

    const failed = await checkStorageConnection({
      env: CLOUDINARY_ENV,
      cloudinaryClient: createMockCloudinary("boom").client,
    });
    expect(failed.ok).toBe(false);
    expect(failed.message).not.toContain(CLOUDINARY_SECRET_VALUE);
  });

  test("класифікація URL: cloudinary керований, чужі — ні", async () => {
    const { client } = createMockCloudinary();
    const url = await saveImage(imageFile({ kind: "jpeg" }), "products", {
      env: CLOUDINARY_ENV,
      cloudinaryClient: client,
    });

    expect(classifyImageUrl(url, { env: CLOUDINARY_ENV })).toBe("cloudinary");
    const removed = await deleteImage("https://res.cloudinary.com/Other/x.jpg", {
      env: CLOUDINARY_ENV,
      cloudinaryClient: client,
    });
    expect(removed.ok).toBe(false);

    // без налаштованого Cloudinary URL цього ж акаунта не керований
    expect(classifyImageUrl(url, { env: R2_ENV })).toBe("external");
    const foreign = await deleteImage(url, {
      env: R2_ENV,
      cloudinaryClient: client,
    });
    expect(foreign.ok).toBe(false);
  });

  test("статичні та локальні зображення не чіпаються", async () => {
    const { calls, client } = createMockCloudinary();
    const staticRemoved = await deleteImage(
      "/images/products/cordyceps-veyskovyi-pack.jpg",
      { env: CLOUDINARY_ENV, cloudinaryClient: client },
    );
    expect(staticRemoved.ok).toBe(false);

    const local = await saveImage(imageFile({ kind: "jpeg" }), "products", {
      env: { NODE_ENV: "test" },
      cloudinaryClient: client,
    });
    expect(local.startsWith("/uploads/products/")).toBe(true);
    expect(calls.some((item) => item.method === "upload")).toBe(false);
  });
});

test.describe("Сховище зображень: валідація", () => {
  test("файл понад 10 МБ відхиляється для каруселі", async () => {
    const client = createMockClient();
    const oversized = imageFile({
      kind: "jpeg",
      size: 11 * 1024 * 1024,
      name: "huge.jpg",
    });

    expect(maxUploadSize("carousel")).toBe(10 * 1024 * 1024);
    await expect(
      saveImage(oversized, "carousel", { env: R2_ENV, client }),
    ).rejects.toThrow(/10 МБ/);
    expect(client.commands).toHaveLength(0);
  });

  test("файл понад ліміт папки товарів відхиляється", async () => {
    const client = createMockClient();
    const oversized = imageFile({
      kind: "jpeg",
      size: 9 * 1024 * 1024,
      name: "big.jpg",
    });

    await expect(
      saveImage(oversized, "products", { env: R2_ENV, client }),
    ).rejects.toThrow(/8 МБ/);
    expect(client.commands).toHaveLength(0);
  });

  test("недопустимий формат відхиляється", async () => {
    const client = createMockClient();

    await expect(
      saveImage(
        imageFile({ kind: "jpeg", mime: "application/pdf", name: "doc.pdf" }),
        "products",
        { env: R2_ENV, client },
      ),
    ).rejects.toThrow(/JPG, PNG та WEBP/);

    await expect(
      saveImage(
        imageFile({ kind: "jpeg", mime: "text/plain", name: "note.txt" }),
        "products",
        { env: R2_ENV, client },
      ),
    ).rejects.toThrow(/JPG, PNG та WEBP/);

    expect(client.commands).toHaveLength(0);
  });

  test("вміст файлу перевіряється, а не лише розширення", async () => {
    const client = createMockClient();
    const fakeJpeg = new File(
      [new TextEncoder().encode("this is not an image at all")],
      "photo.jpg",
      { type: "image/jpeg" },
    );

    await expect(
      saveImage(fakeJpeg, "products", { env: R2_ENV, client }),
    ).rejects.toThrow(/не є зображенням/);

    const wrongKind = imageFile({ kind: "jpeg", mime: "image/png", name: "x.png" });
    await expect(
      saveImage(wrongKind, "products", { env: R2_ENV, client }),
    ).rejects.toThrow(/не збігається/);

    expect(client.commands).toHaveLength(0);
  });

  test("WEBP, PNG та JPEG приймаються", async () => {
    const client = createMockClient();
    for (const kind of ["jpeg", "png", "webp"] as const) {
      const url = await saveImage(imageFile({ kind }), "products", {
        env: R2_ENV,
        client,
      });
      expect(url).toMatch(/\.(jpg|png|webp)$/);
    }
    expect(
      client.commands.filter((item) => item.name === "PutObjectCommand"),
    ).toHaveLength(3);
  });
});

test.describe("Сховище зображень: середовище та безпека", () => {
  test("відсутні environment variables обробляються без падіння", () => {
    const status = getStorageStatus({ env: { NODE_ENV: "test" } });

    expect(status.mode).toBe("local");
    expect(status.r2.configured).toBe(false);
    expect(status.r2.missing).toEqual([
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_BASE_URL",
    ]);
    expect(status.canPersist).toBe(true);
    expect(status.r2.bucket).toBeNull();
  });

  test("секретні значення не потрапляють у статус і повідомлення", async () => {
    const status = getStorageStatus({ env: R2_ENV });
    const serialized = JSON.stringify(status);

    expect(serialized).not.toContain(SECRET_VALUE);
    expect(serialized).not.toContain(R2_ENV.R2_ACCESS_KEY_ID);
    expect(Object.keys(status.r2)).toEqual([
      "configured",
      "missing",
      "bucket",
      "publicBaseUrl",
    ]);

    const failed = await checkStorageConnection({
      env: R2_ENV,
      client: createMockClient("AccessDenied"),
    });
    expect(failed.ok).toBe(false);
    expect(failed.message).not.toContain(SECRET_VALUE);
    expect(failed.message).not.toContain(R2_ENV.R2_ACCESS_KEY_ID);
  });

  test("перевірка конфігурації без ключів пояснює, чого бракує", async () => {
    const result = await checkStorageConnection({ env: {} });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("CLOUDINARY_CLOUD_NAME");
  });

  test("на Vercel без R2 завантаження завершується помилкою, а не тихим записом у тимчасову ФС", async () => {
    const client = createMockClient();
    await expect(
      saveImage(imageFile({ kind: "jpeg" }), "products", {
        env: { VERCEL: "1", NODE_ENV: "production" },
        client,
      }),
    ).rejects.toThrow(/Vercel/);
    expect(client.commands).toHaveLength(0);
  });

  test("частково заповнені змінні R2 не маскуються локальним режимом", async () => {
    await expect(
      saveImage(imageFile({ kind: "jpeg" }), "products", {
        env: {
          R2_ACCOUNT_ID: "only-account",
          R2_BUCKET_NAME: "bucket",
        },
        client: createMockClient(),
      }),
    ).rejects.toThrow(/частково/);
  });

  test("статичні зображення проєкту не видаляються", async () => {
    const staticUrl = "/images/products/cordyceps-veyskovyi-pack.jpg";
    const filePath = path.join(process.cwd(), "public", staticUrl);

    expect(classifyImageUrl(staticUrl, { env: R2_ENV })).toBe("static");
    const result = await deleteImage(staticUrl, { env: R2_ENV });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/статичне зображення/);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test("старі URL з /uploads/ лишаються валідними (локальний режим розробки)", async () => {
    const client = createMockClient();
    const url = await saveImage(imageFile({ kind: "jpeg" }), "products", {
      env: { NODE_ENV: "test" },
      client,
    });

    expect(url.startsWith("/uploads/products/")).toBe(true);
    expect(classifyImageUrl(url, { env: {} })).toBe("local");
    expect(client.commands).toHaveLength(0);

    const removed = await deleteImage(url, { env: {} });
    expect(removed.ok).toBe(true);
    expect(
      fs.existsSync(path.join(process.cwd(), "public", url)),
    ).toBe(false);
  });

  test("завантаження та видалення не змінюють data/db.json", async () => {
    const dbFile = path.join(process.cwd(), "data", "db.json");
    const before = fs.existsSync(dbFile)
      ? fs.readFileSync(dbFile, "utf8")
      : null;

    const url = await saveImage(imageFile({ kind: "png" }), "banners", {
      env: { NODE_ENV: "test" },
      client: createMockClient(),
    });
    await deleteImage(url, { env: {} });

    const after = fs.existsSync(dbFile)
      ? fs.readFileSync(dbFile, "utf8")
      : null;
    expect(after).toBe(before);
  });

  test("посилання, що не належать сховищу, не видаляються", async () => {
    const client = createMockClient();
    const foreign = await deleteImage("https://cdn.example.org/pic.jpg", {
      env: R2_ENV,
      client,
    });
    expect(foreign.ok).toBe(false);
    expect(client.commands).toHaveLength(0);
  });
});

test.describe("Сховище зображень: API адмін-панелі", () => {
  test("без авторизації завантаження, видалення та статус заборонені", async ({
    request,
  }) => {
    const upload = await request.post("/api/admin/storage", {
      multipart: {
        folder: "products",
        file: {
          name: "a.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        },
      },
    });
    expect(upload.status()).toBe(401);

    const status = await request.get("/api/admin/storage");
    expect(status.status()).toBe(401);

    const remove = await request.delete("/api/admin/storage", {
      data: { url: "/uploads/products/x.jpg" },
    });
    expect(remove.status()).toBe(401);
  });

  test("з сесією: статус без секретів, завантаження та видалення", async ({
    page,
  }) => {
    await login(page);
    await expect(page).toHaveURL(/\/admin$/);

    const statusResponse = await page.request.get("/api/admin/storage");
    expect(statusResponse.status()).toBe(200);
    const payload = await statusResponse.json();
    expect(payload.ok).toBe(true);
    expect(payload.status.mode).toBeTruthy();
    expect(JSON.stringify(payload)).not.toContain(SECRET_VALUE);
    expect(payload.status.r2).not.toHaveProperty("secretAccessKey");
    expect(payload.status.r2).not.toHaveProperty("accessKeyId");

    const uploaded = await page.request.post("/api/admin/storage", {
      multipart: {
        folder: "products",
        file: {
          name: "e2e-photo.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
        },
      },
    });

    const uploadPayload = await uploaded.json();
    expect(uploadPayload.ok).toBe(true);
    const uploadedUrl = String(uploadPayload.url);
    expect(uploadedUrl).toMatch(/^(\/uploads\/products\/|https?:\/\/)/);

    const removed = await page.request.delete("/api/admin/storage", {
      data: { url: uploadedUrl },
    });
    expect(removed.status()).toBe(200);
    if (uploadedUrl.startsWith("/uploads/")) {
      expect(
        fs.existsSync(path.join(process.cwd(), "public", uploadedUrl)),
      ).toBe(false);
    }
  });
});

test.describe("Сховище зображень: завантаження та видалення в адмін-секціях", () => {
  function validJpeg(): Buffer {
    const data = new Uint8Array(512).fill(0x20);
    data.set([0xff, 0xd8, 0xff, 0xe0]);
    return Buffer.from(data);
  }

  function filePayload(name: string): {
    name: string;
    mimeType: string;
    buffer: Buffer;
  } {
    return { name, mimeType: "image/jpeg", buffer: validJpeg() };
  }

  function acceptDialogs(page: Page): string[] {
    const messages: string[] = [];
    page.on("dialog", (dialog) => {
      messages.push(dialog.message());
      void dialog.accept();
    });
    return messages;
  }

  function localFileOf(url: string): string {
    return path.join(process.cwd(), "public", url);
  }

  async function openAdminPage(page: Page, url: string) {
    await page.goto(url);
    await expect(page).not.toHaveURL(/\/admin\/login/);
  }

  /**
   * Після клієнтської навігації Next залишає у DOM приховану копію
   * попереднього SSR-дерева (display:none), тому копіювані елементи
   * шукаємо лише серед видимих.
   */
  function visibleField(scope: Page | Locator, testId: string): Locator {
    return scope.locator(`[data-testid="${testId}"]:visible`);
  }

  /** Відкриває сторінку редагування повним завантаженням за href посилання. */
  async function openEditPage(page: Page, link: Locator, pathPart: string) {
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    expect(String(href)).toContain(pathPart);
    await openAdminPage(page, String(href));
  }

  async function expectUploadValue(
    locator: Locator,
    folder: string,
  ): Promise<string> {
    await expect(locator).toHaveValue(
      new RegExp(`^(\\/uploads\\/${folder}\\/|https?:\\/\\/)`),
    );
    return (await locator.inputValue()).trim();
  }

  function productImagesFromDb(productId: string): string[] {
    const dbFile = path.join(process.cwd(), "data", "db.json");
    if (!fs.existsSync(dbFile)) {
      return [];
    }
    const db = JSON.parse(fs.readFileSync(dbFile, "utf8")) as {
      products?: Array<{ id: string; images?: string[] }>;
    };
    return db.products?.find((item) => item.id === productId)?.images ?? [];
  }

  test("банери: завантаження, збереження, повторне відкриття та видалення файлу", async ({
    page,
  }) => {
    const dialogs = acceptDialogs(page);
    const suffix = Date.now().toString(36);
    const title = `E2E-банер-фото ${suffix}`;

    await login(page);
    await openAdminPage(page, "/admin/banners/new");

    // 1) Завантаження валідного зображення через новий API
    await page
      .getByTestId("upload-desktopImage")
      .setInputFiles(filePayload(`e2e-${suffix}-desktop.jpg`));
    const desktopUrl = await expectUploadValue(
      page.getByTestId("url-desktopImage"),
      "banners",
    );
    await expect(page.getByTestId("preview-desktopImage")).toBeVisible();
    await expect(page.getByTestId("delete-desktopImage")).toBeVisible();
    if (desktopUrl.startsWith("/uploads/")) {
      expect(fs.existsSync(localFileOf(desktopUrl))).toBe(true);
    }

    // 2) Друге поле: завантаження не пошкоджує перше посилання
    await page
      .getByTestId("upload-tabletImage")
      .setInputFiles(filePayload(`e2e-${suffix}-tablet.jpg`));
    const tabletUrl = await expectUploadValue(
      page.getByTestId("url-tabletImage"),
      "banners",
    );
    expect(tabletUrl).not.toBe(desktopUrl);
    await expect(page.getByTestId("url-desktopImage")).toHaveValue(desktopUrl);

    // 3) Посилання зберігаються разом із банером
    await page.locator("#title").fill(title);
    await page
      .locator("#subtitle")
      .fill("Банер зі своїми фото, створений e2e-тестом сховища.");
    await page.locator("#ctaLabel").fill("До каталогу");
    await page.locator("#ctaHref").fill("/catalog");
    await page
      .locator("label")
      .filter({ hasText: "Активний (видно на сайті)" })
      .getByRole("checkbox")
      .click();
    await page.getByRole("button", { name: "Зберегти" }).click();
    await page.waitForURL("**/admin/banners");

    // 4) Повторне відкриття: дані не зникли
    const card = page.locator("div.p-5", { hasText: title }).first();
    // Відкриваємо повним завантаженням за href: після клієнтської навігації
    // Next залишає у DOM приховану копію форми, і локатори бачать 2 елементи.
    await openEditPage(
      page,
      card.getByRole("link", { name: /Редагувати/ }),
      "/admin/banners/",
    );
    await expect(
      page.getByRole("heading", { name: "Редагування банера" }),
    ).toBeVisible();
    await expect(page.getByTestId("url-desktopImage")).toHaveCount(1);
    await expect(visibleField(page, "url-desktopImage")).toHaveValue(
      desktopUrl,
    );
    await expect(visibleField(page, "url-tabletImage")).toHaveValue(tabletUrl);
    await expect(visibleField(page, "preview-desktopImage")).toBeVisible();

    // 5) Видалення файлу з форми: файл зникає зі сховища
    await page.getByTestId("delete-desktopImage").click();
    await expect.poll(() => dialogs.length).toBeGreaterThan(0);
    await expect(page.getByTestId("url-desktopImage")).toHaveValue("");
    if (desktopUrl.startsWith("/uploads/")) {
      expect(fs.existsSync(localFileOf(desktopUrl))).toBe(false);
    }

    // 6) Прибирання: банер видаляється, другий файл прибирається зі сховища
    await page.getByRole("button", { name: "Видалити", exact: true }).click();
    await page.waitForURL("**/admin/banners");
    await expect(page.getByText(title)).toHaveCount(0);

    const removed = await page.request.delete("/api/admin/storage", {
      data: { url: tabletUrl },
    });
    expect(removed.status()).toBe(200);
    if (tabletUrl.startsWith("/uploads/")) {
      expect(fs.existsSync(localFileOf(tabletUrl))).toBe(false);
    }
  });

  test("товари: завантаження фото, збереження, повторне відкриття та видалення", async ({
    page,
  }) => {
    const dialogs = acceptDialogs(page);
    const suffix = Date.now().toString(36);
    const name = `E2E-товар-фото ${suffix}`;

    await login(page);
    await openAdminPage(page, "/admin/products/new");

    await page.locator("#name").fill(name);
    await page.locator("#sku").fill(`E2E-${suffix}`);
    await page.locator("#price").fill("320");
    await page.locator("#stock").fill("4");
    await page
      .locator("#description")
      .fill("Опис товару для перевірки завантаження фотографій.");

    // 1) Перше фото
    await page
      .getByTestId("upload-images")
      .setInputFiles(filePayload(`e2e-${suffix}-1.jpg`));
    await expect(page.getByTestId("images-url")).toHaveValue(
      /^(\/uploads\/products\/|https?:\/\/)/,
    );
    const initialLines = (await page.getByTestId("images-url").inputValue())
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    expect(initialLines).toHaveLength(1);
    const firstUrl = initialLines[0];
    await expect(
      page.locator(`[data-testid="image-thumb"][data-url="${firstUrl}"]`),
    ).toBeVisible();
    if (firstUrl.startsWith("/uploads/")) {
      expect(fs.existsSync(localFileOf(firstUrl))).toBe(true);
    }

    // 2) Друге фото не пошкоджує перше
    await page
      .getByTestId("upload-images")
      .setInputFiles(filePayload(`e2e-${suffix}-2.jpg`));
    await expect(page.getByTestId("images-url")).not.toHaveValue(firstUrl);
    const lines = (await page.getByTestId("images-url").inputValue())
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    expect(lines).toHaveLength(2);
    const [, secondUrl] = lines;
    expect(secondUrl).not.toBe(firstUrl);

    // 3) Збереження товару з фото
    await page.getByRole("button", { name: "Зберегти" }).first().click();
    await page.waitForURL("**/admin/products");

    // 4) Повторне відкриття: обидва фото на місці
    const row = page.locator("tbody tr", { hasText: name });
    // Повне завантаження за href (без клієнтської навігації — вона залишає
    // приховану копію форми у DOM, і testid-локатори стають неунікальними).
    await openEditPage(
      page,
      row.getByRole("link", { name: /Редагувати/ }),
      "/admin/products/",
    );
    await expect(page.getByTestId("images-url")).toHaveCount(1);
    await expect(visibleField(page, "images-url")).toHaveValue(
      `${firstUrl}\n${secondUrl}`,
    );

    // 5) Видалення першого файлу: другий залишається
    await page
      .locator(
        `[data-testid="delete-image-thumb"][data-url="${firstUrl}"]:visible`,
      )
      .click();
    await expect.poll(() => dialogs.length).toBeGreaterThan(0);
    await expect(visibleField(page, "images-url")).toHaveValue(secondUrl);
    if (firstUrl.startsWith("/uploads/")) {
      expect(fs.existsSync(localFileOf(firstUrl))).toBe(false);
    }

    // 6) Прибирання: прибираємо друге фото, зберігаємо, видаляємо товар
    await page
      .locator(
        `[data-testid="delete-image-thumb"][data-url="${secondUrl}"]:visible`,
      )
      .click();
    await expect.poll(() => dialogs.length).toBeGreaterThan(1);
    await expect(visibleField(page, "images-url")).toHaveValue("");
    await page.getByRole("button", { name: "Зберегти" }).first().click();
    await page.waitForURL("**/admin/products");

    await page
      .locator("tbody tr", { hasText: name })
      .getByRole("button", { name: /Видалити/ })
      .click();
    await page.waitForURL("**/admin/products");
    await expect(page.locator("tbody tr", { hasText: name })).toHaveCount(0);

    const removed = await page.request.delete("/api/admin/storage", {
      data: { url: secondUrl },
    });
    expect(removed.status()).toBe(200);
    if (secondUrl.startsWith("/uploads/")) {
      expect(fs.existsSync(localFileOf(secondUrl))).toBe(false);
    }
  });

  test("карусель: власне фото картки, збереження та безпечне видалення", async ({
    page,
  }) => {
    const dialogs = acceptDialogs(page);
    const suffix = Date.now().toString(36);

    await login(page);
    await openAdminPage(page, "/admin/home-carousel");

    const cards = page.getByTestId("carousel-item-card");
    const card = cards.first();
    await expect(card).toBeVisible();

    // Статичне або порожнє фото: кнопки видалення немає
    const originalValue = (
      await card.getByTestId("carousel-image-value").inputValue()
    ).trim();
    await expect(card.getByTestId("delete-carousel-image")).toHaveCount(0);

    if ((await cards.count()) > 1) {
      const secondCard = cards.nth(1);
      const secondValue = (
        await secondCard.getByTestId("carousel-image-value").inputValue()
      ).trim();
      if (secondValue === "" || secondValue.startsWith("/images/")) {
        await expect(
          secondCard.getByTestId("delete-carousel-image"),
        ).toHaveCount(0);
      }
    }

    const productId = await card.locator('select[name="productId"]').inputValue();
    const productImagesBefore = productImagesFromDb(productId);

    // 1) Завантаження власного фото картки
    await card
      .getByTestId("upload-carousel-image")
      .setInputFiles(filePayload(`e2e-${suffix}-carousel.jpg`));
    const uploadedUrl = await expectUploadValue(
      card.getByTestId("carousel-image-value"),
      "carousel",
    );
    await expect(card.getByTestId("carousel-image-preview")).toBeVisible();
    await expect(card.getByTestId("delete-carousel-image")).toBeVisible();
    if (uploadedUrl.startsWith("/uploads/")) {
      expect(fs.existsSync(localFileOf(uploadedUrl))).toBe(true);
    }

    // 2) Збереження картки
    await card.getByRole("button", { name: "Зберегти картку" }).click();
    await expect(page.getByText("Картку каруселі збережено")).toBeVisible({
      timeout: 20_000,
    });

    // 3) Повторне відкриття: фото каруселі збереглося
    await page.reload();
    await expect(
      page.getByTestId("carousel-image-value").first(),
    ).toHaveValue(uploadedUrl);

    // 4) Фотографії товару не перезаписані
    const productImagesAfter = productImagesFromDb(productId);
    expect(productImagesAfter).toEqual(productImagesBefore);
    expect(productImagesAfter).not.toContain(uploadedUrl);

    // 5) Головна сторінка показує це фото в каруселі
    await page.goto("/");
    const carouselSources = await page
      .locator('[data-testid="products-carousel"] img')
      .evaluateAll((images) =>
        images.map((image) => image.getAttribute("src") ?? ""),
      );
    expect(
      carouselSources.some((src) => /(%2F|\/)uploads(%2F|\/)carousel/.test(src)),
    ).toBe(true);

    // 6) Видалення файлу повертає картку до фото товару
    await openAdminPage(page, "/admin/home-carousel");
    const restoredCard = page.getByTestId("carousel-item-card").first();
    await restoredCard.getByTestId("delete-carousel-image").click();
    await expect.poll(() => dialogs.length).toBeGreaterThan(0);
    await expect(
      restoredCard.getByTestId("carousel-image-value"),
    ).toHaveValue("");
    await restoredCard
      .getByRole("button", { name: "Зберегти картку" })
      .click();
    await expect(page.getByText("Картку каруселі збережено")).toBeVisible({
      timeout: 20_000,
    });

    await page.reload();
    await expect(
      page.getByTestId("carousel-image-value").first(),
    ).toHaveValue(originalValue);

    if (uploadedUrl.startsWith("/uploads/")) {
      expect(fs.existsSync(localFileOf(uploadedUrl))).toBe(false);
    }
    expect(productImagesFromDb(productId)).toEqual(productImagesBefore);
  });
});

test.describe("Сховище зображень: сумісність із наявними даними", () => {
  test("товари, банери та карусель на головній показують локальні зображення", async ({
    request,
  }) => {
    const home = await request.get("/");
    expect(home.status()).toBe(200);
    const html = await home.text();

    // next/image кодує шлях у /_next/image?url=%2Fimages%2F…
    expect(html).toMatch(/(\/|%2F)images(%2F|\/)products/);
    expect(html).toMatch(/(\/|%2F)images(%2F|\/)banners/);
    expect(html).toContain("products-carousel");

    const sample = await request.get(
      "/images/products/cordyceps-veyskovyi-pack.jpg",
    );
    expect(sample.status()).toBe(200);
  });

  test("секрети відсутні у клієнтському коді", async ({ request }) => {
    const home = await request.get("/");
    const html = await home.text();

    expect(html).not.toContain("R2_SECRET_ACCESS_KEY");
    expect(html).not.toContain("R2_ACCESS_KEY_ID");

    const scripts = [...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)]
      .map((match) => match[1])
      .slice(0, 20);

    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      const response = await request.get(script);
      if (!response.ok()) continue;
      const body = await response.text();
      expect(body).not.toContain("R2_SECRET_ACCESS_KEY");
      expect(body).not.toContain(SECRET_VALUE);
    }
  });

  test("старі посилання у даних не переписуються автоматично", async () => {
    const seed = fs.readFileSync(
      path.join(process.cwd(), "data", "seed.ts"),
      "utf8",
    );
    expect(seed).toContain("/images/products/");
    expect(seed).not.toContain("https://images.");

    const dbFile = path.join(process.cwd(), "data", "db.json");
    if (fs.existsSync(dbFile)) {
      const db = fs.readFileSync(dbFile, "utf8");
      const r2Links = db.match(/https:\/\/images\.did-panas\.test/g) ?? [];
      // міграцію ніхто не запускав — посилання не змінюються самі собою
      expect(r2Links.length).toBe(0);
    }
  });
});

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator("#login").fill(adminLogin);
  await page.locator("#password").fill(adminPassword);
  await page.getByRole("button", { name: "Увійти" }).click();
  // Чекаємо встановлення сесії: поки дія входу завершиться і сесійна кука
  // потрапить у браузер. Без цього наступний goto перериває запит і
  // адмін-сторінки відправлять назад на /admin/login.
  await page.waitForURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Огляд" })).toBeVisible();
}
