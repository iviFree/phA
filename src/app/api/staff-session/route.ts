// src/app/api/staff-session/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { code } = await req.json().catch(() => ({} as any));

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { ok: false, error: "Falta el código." },
        { status: 400 }
      );
    }

    // Valida contra una env opcional para evitar 500 mientras pruebas
    const expected = process.env.STAFF_PIN?.trim();
    if (expected && code.trim() !== expected) {
      return NextResponse.json(
        { ok: false, error: "Código inválido." },
        { status: 401 }
      );
    }

    // Si no hay STAFF_PIN, aceptamos cualquier código (modo demo)
    const sessionId = crypto.randomUUID();
    return NextResponse.json({ ok: true, sessionId });
  } catch (err: any) {
    console.error("staff-session POST error:", err);
    return NextResponse.json(
      { ok: false, error: "server" },
      { status: 500 }
    );
  }
}
