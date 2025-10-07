import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Crea (o reutiliza) un cliente de Supabase con la service role.
 * NO lo inicializamos en el top-level para no romper el build si faltan envs.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    // Validamos aquí (runtime), no en import-time
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  cached = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { "X-Client-Info": "phA-admin" },
    },
  });

  return cached;
}
