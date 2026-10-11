import { isSignedIn } from "@/lib/auth";
import {
  cloudinaryPublicId,
  cloudinarySignature,
  missingCloudinaryEnv,
  readCloudinaryConfig,
} from "@/lib/storage-cloudinary";

const FOLDERS = [
  "products",
  "banners",
  "categories",
  "branding",
  "carousel",
] as const;

type UploadFolderName = (typeof FOLDERS)[number];

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Ліміти, дзеркальні maxUploadSize() з lib/storage.ts (класифікація тут не потрібна — прямий upload минає saveImage). */
const MAX_BYTES: Record<UploadFolderName, number> = {
  products: 8 * 1024 * 1024,
  banners: 8 * 1024 * 1024,
  categories: 8 * 1024 * 1024,
  branding: 8 * 1024 * 1024,
  carousel: 10 * 1024 * 1024,
};

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status });
}

function unauthorized(): Response {
  return json(
    { ok: false, error: "Необхідна авторизація адміністратора." },
    401,
  );
}

/**
 * POST /api/admin/storage/sign — підпис для прямого завантаження у Cloudinary
 * з браузера. Обходить ліміт тіла 4.5 MB у serverless-функціях Vercel:
 * файл іде одразу на api.cloudinary.com, сервер лише видає підпис.
 * API secret ніколи не залишає сервер.
 */
export async function POST(request: Request) {
  if (!(await isSignedIn())) {
    return unauthorized();
  }

  let body: { folder?: unknown; contentType?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Некоректний запит." }, 400);
  }

  const folder = String(body.folder ?? "") as UploadFolderName;
  if (!FOLDERS.includes(folder)) {
    return json({ ok: false, error: "Некоректна папка завантаження." }, 400);
  }

  const contentType = String(body.contentType ?? "");
  const extension = EXTENSIONS[contentType];
  if (!extension) {
    return json(
      { ok: false, error: "Підтримуються лише JPG, PNG та WEBP." },
      400,
    );
  }

  const env = process.env;
  if (missingCloudinaryEnv(env).length > 0) {
    return json(
      {
        ok: false,
        error:
          "Cloudinary не налаштовано — прямі завантаження недоступні. Заповніть змінні CLOUDINARY_*.",
      },
      503,
    );
  }

  const config = readCloudinaryConfig(env);
  if (!config) {
    return json(
      { ok: false, error: "Cloudinary не налаштовано." },
      503,
    );
  }

  // public_id без розширення: Cloudinary визначає формат із файлу
  const publicId = cloudinaryPublicId(folder);
  const maxFileSize = MAX_BYTES[folder];
  const timestamp = Math.floor(Date.now() / 1000);
  // max_file_size у підписі: Cloudinary відхилить завеликий файл на своєму боці
  const signature = cloudinarySignature(
    { public_id: publicId, timestamp, max_file_size: maxFileSize },
    config.apiSecret,
  );

  return json(
    {
      ok: true,
      apiKey: config.apiKey,
      cloudName: config.cloudName,
      publicId,
      timestamp,
      signature,
      maxFileSize,
      uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    },
    200,
  );
}
