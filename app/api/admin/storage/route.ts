import { isSignedIn } from "@/lib/auth";
import {
  checkStorageConnection,
  deleteImage,
  getStorageStatus,
  saveImage,
  StorageError,
  type UploadFolder,
} from "@/lib/storage";

const FOLDERS: UploadFolder[] = [
  "products",
  "banners",
  "categories",
  "branding",
  "carousel",
];

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status });
}

function unauthorized(): Response {
  return json(
    { ok: false, error: "Необхідна авторизація адміністратора." },
    401,
  );
}

async function guard(): Promise<Response | null> {
  if (!(await isSignedIn())) {
    return unauthorized();
  }
  return null;
}

/** GET /api/admin/storage — стан сховища; `?check=1` — перевірка доступу до Cloudinary/R2. */
export async function GET(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const check = new URL(request.url).searchParams.get("check") === "1";
  if (check) {
    const result = await checkStorageConnection();
    return json({ ok: result.ok, message: result.message }, 200);
  }

  return json({ ok: true, status: getStorageStatus() }, 200);
}

/** POST /api/admin/storage — завантаження зображення (multipart: file, folder). */
export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(
      { ok: false, error: "Надішліть файл у форматі multipart/form-data." },
      400,
    );
  }

  const folder = String(form.get("folder") ?? "") as UploadFolder;
  if (!FOLDERS.includes(folder)) {
    return json({ ok: false, error: "Некоректна папка завантаження." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ ok: false, error: "Оберіть файл зображення." }, 400);
  }

  try {
    const url = await saveImage(file, folder);
    return json({ ok: true, url }, 201);
  } catch (error) {
    const status = error instanceof StorageError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Не вдалося завантажити файл.";
    return json({ ok: false, error: message }, status);
  }
}

/** DELETE /api/admin/storage — видалення файлу зі сховища (тіло: { url }). */
export async function DELETE(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Некоректний запит." }, 400);
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return json({ ok: false, error: "Не вказано файл для видалення." }, 400);
  }

  const result = await deleteImage(url);
  return json({ ...result }, result.ok ? 200 : 400);
}
