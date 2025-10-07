import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
const COOKIE_NAME = "staff_session";

function sign(sessionId: string) {
  const secret = process.env.STAFF_SESSION_HMAC_SECRET || "";
  return crypto.createHmac("sha256", secret).update(sessionId).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    if (!pin || pin !== process.env.STAFF_PIN) {
      return NextResponse.json({ ok: false, error: "PIN incorrecto" }, { status: 401 });
    }

    const sessionId = crypto.randomBytes(16).toString("hex");
    const cookieVal = `${sessionId}.${sign(sessionId)}`;

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, cookieVal, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8, // 8h
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
