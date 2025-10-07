import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const COOKIE = "staff_session";
const PUBLIC_ALLOW = [
  "/staff-login",
  "/api/staff-session",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

async function hmacHex(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return Array.from(new Uint8Array(sig))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function verifyCookie(val?: string): Promise<string | null> {
  if (!val) return null;
  const [id, sig] = val.split(".");
  if (!id || !sig) return null;
  const secret = process.env.STAFF_SESSION_HMAC_SECRET || "";
  const expected = await hmacHex(secret, id);
  return timingSafeEqualHex(sig, expected) ? id : null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ALLOW.some((p) => pathname === p || pathname.startsWith(p))) {
    const res = NextResponse.next();
    return applyCSP(res);
  }

  const raw = req.cookies.get(COOKIE)?.value;
  const sessionId = await verifyCookie(raw);

  if (!sessionId) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/staff-login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("x-staff-session-id", sessionId);
  return applyCSP(res);
}

function applyCSP(res: NextResponse) {
  const nonce = crypto.randomUUID();
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' blob: https:`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "font-src 'self' data: https:",
    "frame-src https:",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  return res;
}

export const config = { matcher: "/:path*" };
