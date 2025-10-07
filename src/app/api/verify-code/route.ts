import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerifyRequest = {
  code?: string;
  ip?: string;
};

export async function POST(req: Request) {
  try {
    const { code, ip }: VerifyRequest = await req.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Código requerido" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const codeHash = await hashCode(code);

    const { data, error } = await supabase
      .from("staff_codes")
      .select("id, active")
      .eq("code_hash", codeHash)
      .maybeSingle();

    // Log de intento SIN romper tipos: try/await/catch vacío
    try {
      await supabase.from("staff_code_attempts").insert({
        ip: ip ?? null,
        code_hash: codeHash,
        success: !error && !!data?.active,
      });
    } catch {}

    if (error) {
      return NextResponse.json(
        { valid: false, error: "Error interno" },
        { status: 500 }
      );
    }

    if (!data || !data.active) {
      return NextResponse.json(
        { valid: false, error: "Código inválido" },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Error del servidor" },
      { status: 500 }
    );
  }
}

async function hashCode(input: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
