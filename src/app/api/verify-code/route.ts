import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashCode } from "@/lib/code";


export const runtime = "nodejs";

// 1 letra + 3 dígitos en cualquier posición, longitud 4
const CODE_REGEX = /^(?:[A-Z]\d{3}|\d[A-Z]\d{2}|\d{2}[A-Z]\d|\d{3}[A-Z])$/;

// Parametrización de rate limit
const WINDOW_SECONDS = 60;   // ventana de 60s
const LIMIT_PER_IP = 30;     // máx 30 intentos/min por IP
const LIMIT_PER_SESSION = 60;// máx 60 intentos/min por sesión
const LOCK_SECONDS = 120;    // bloquear 2 min al exceder

function windowKey(now: Date, seconds: number) {
  const ts = Math.floor(now.getTime() / 1000);
  const base = ts - (ts % seconds);
  return new Date(base * 1000).toISOString();
}

async function checkAndBump(key: string, limit: number) {
  const { data, error } = await supabaseAdmin.rpc("bump_rate_limit", {
    p_key: key,
    p_window_seconds: WINDOW_SECONDS,
    p_limit: limit,
    p_lock_seconds: LOCK_SECONDS,
  });
  if (error) return { locked: false }; // en caso de error, no bloqueamos
  const row = Array.isArray(data) ? data[0] : data;
  return { count: row?.count ?? 0, locked: !!row?.locked, lock_until: row?.lock_until };
}

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const normalized = String(code || "").trim().toUpperCase();
    if (!CODE_REGEX.test(normalized)) {
      return NextResponse.json({ valid: false, error: "Formato inválido" }, { status: 400 });
    }

    const sessionId = req.headers.get("x-staff-session-id") || "unknown";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const now = new Date();
    const win = windowKey(now, WINDOW_SECONDS);

    // Rate limit por IP y por sesión
    const ipKey = `ip:${ip}:${win}`;
    const sesKey = `session:${sessionId}:${win}`;

    const [ipRL, sesRL] = await Promise.all([
      checkAndBump(ipKey, LIMIT_PER_IP),
      checkAndBump(sesKey, LIMIT_PER_SESSION),
    ]);

    if (ipRL.locked || sesRL.locked) {
      return NextResponse.json({ valid: false, error: "Rate limit excedido. Intenta más tarde." }, { status: 429 });
    }

    const codeHash = hashCode(normalized);
    const { data, error } = await supabaseAdmin.rpc("consume_code", { p_code_hash: codeHash });
    const success = Boolean(data) && !error;
    await supabaseAdmin
      .from("staff_checks")
      .insert({ staff_session_id: sessionId, ip, code_hash: codeHash, success });
    if (error) {
      return NextResponse.json({ valid: false, error: "Error interno" }, { status: 500 });
    }

return NextResponse.json({ valid: success });


    if (error) {
      return NextResponse.json({ valid: false, error: "Error interno" }, { status: 500 });
    }
    return NextResponse.json({ valid: success });
  } catch {
    return NextResponse.json({ valid: false, error: "Bad request" }, { status: 400 });
  }
}
