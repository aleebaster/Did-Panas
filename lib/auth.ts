import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "dp_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const DEV_SESSION_SECRET = "did-panas-dev-session-secret";

/**
 * Секрет для HMAC-підпису сесійної cookie.
 * У production fallback відсутній: публічний із репозиторію секрет
 * дозволив би підробити cookie, тому без ADMIN_SESSION_SECRET
 * авторизація повністю блокується (fail-closed).
 */
function secret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  if (value) {
    return value;
  }
  return process.env.NODE_ENV === "production" ? null : DEV_SESSION_SECRET;
}

export function adminCredentials(): { login: string; password: string } | null {
  const login = process.env.ADMIN_LOGIN?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!login || !password) {
    return null;
  }
  return { login, password };
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

function sign(value: string): string | null {
  const key = secret();
  if (!key) {
    return null;
  }
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

export function createSessionToken(): string {
  const payload = `${Date.now() + SESSION_TTL_MS}`;
  const signature = sign(payload);
  if (!signature) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature) {
    return false;
  }
  const expected = sign(expiry);
  if (!expected || !safeEqual(expected, signature)) {
    return false;
  }
  return Number(expiry) > Date.now();
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export type SignInResult = "ok" | "invalid" | "unconfigured";

export async function signIn(
  login: string,
  password: string,
): Promise<SignInResult> {
  const credentials = adminCredentials();
  if (!credentials || !secret()) {
    return "unconfigured";
  }
  if (
    !safeEqual(login, credentials.login) ||
    !safeEqual(password, credentials.password)
  ) {
    return "invalid";
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return "ok";
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) {
    redirect("/admin/login");
  }
}

export { SESSION_COOKIE };
