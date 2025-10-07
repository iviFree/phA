// src/app/api/staff-session/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

type StaffSessionRequest = {
  code?: string;
};

type StaffSessionResponse =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

export async function POST(req: Request) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      raw = null;
    }

    const body = (raw ?? {}) as StaffSessionRequest;
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!code) {
      const res: StaffSessionResponse = { ok: false, error: "Falta el código." };
      return NextResponse.json(res, { status: 400 });
    }

    const expected = process.env.STAFF_PIN?.trim();
    if (expected && code !== expected) {
      const res: StaffSessionResponse = { ok: false, error: "Código inválido." };
      return NextResponse.json(res, { status: 401 });
    }

    const sessionId = crypto.randomUUID();
    const res: StaffSessionResponse = { ok: true, sessionId };
    return NextResponse.json(res);
  } catch (err: unknown) {
    console.error("staff-session POST error:", err);
    const res: StaffSessionResponse = { ok: false, error: "server" };
    return NextResponse.json(res, { status: 500 });
  }
}
