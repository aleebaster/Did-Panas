import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "dp_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "did-panas-dev-session-secret";
}

export function adminCredentials(): { login: string; password: string } | null {
  const login = process.env.ADMIN_LOGIN;
  const password = process.env.ADMIN_PASSWORD;
  if (!login || !password) {
    return null;
  }
  return { login, password };
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export function createSessionToken(): string {
  const payload = `${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }
  const [expiry, signature] = token.split(".");
  if (!expiry || !signature) {
    return false;
  }
  if (!safeEqual(sign(expiry), signature)) {
    return false;
  }
  return Number(expiry) > Date.now();
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function signIn(login: string, password: string): Promise<boolean> {
  const credentials = adminCredentials();
  if (!credentials) {
    return false;
  }
  if (!safeEqual(login, credentials.login) || !safeEqual(password, credentials.password)) {
    return false;
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return true;
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
