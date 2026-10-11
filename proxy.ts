import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "dp_admin_session";
const DEV_SESSION_SECRET = "did-panas-dev-session-secret";

function secret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  if (value) {
    return value;
  }
  // У production без заданого секрета сесії вважаються недійсними:
  // fallback із репозиторію був би публічним і дозволяв би підробку cookie.
  return process.env.NODE_ENV === "production" ? null : DEV_SESSION_SECRET;
}

function sign(value: string): string | null {
  const key = secret();
  if (!key) {
    return null;
  }
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

function isValidSession(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const [expiry, signature] = token.split(".");
  if (!expiry || !signature) {
    return false;
  }

  const expected = sign(expiry);
  if (!expected) {
    return false;
  }
  if (expected.length !== signature.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }

  return diff === 0 && Number(expiry) > Date.now();
}

export function proxy(request: NextRequest): NextResponse {
  const signedIn = isValidSession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (request.nextUrl.pathname === "/admin/login") {
    if (signedIn) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!signedIn) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
