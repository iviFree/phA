"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const submit = useCallback(async () => {
    if (!code.trim()) {
      setMsg("⚠️ Ingresa tu código de staff.");
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      // 👇 asegúrate que coincida con tu carpeta real: /api/staff-session
      const res = await fetch("/api/staff-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      // Leemos texto primero, para detectar HTML (errores o 404)
      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        console.error("⚠️ La API no devolvió JSON:", raw);
        throw new Error(`Respuesta no-JSON (${res.status})`);
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }

      if (data.sessionId) {
        localStorage.setItem("staff_session", data.sessionId);
      }

      setMsg("✅ Redirigiendo...");
      setTimeout(() => router.push("/check"), 800);
    } catch (err) {
      console.error(err);
      setMsg("❌ Código de acceso inválido o error de red.");
    } finally {
      setBusy(false);
    }
  }, [code, router]);

  // Manejar Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ width: 320, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>
          Acceso staff
        </h1>

        <input
          type="password"
          placeholder="PIN"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          maxLength={12}
          autoComplete="one-time-code"
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: 18,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #666",
            background: "#222",
            color: "#fff",
            letterSpacing: "0.2em",
          }}
        />

        <button
          onClick={submit}
          disabled={busy}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "10px",
            borderRadius: 8,
            border: "1px solid #888",
            background: busy ? "#333" : "#fff",
            color: busy ? "#999" : "#000",
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Validando..." : "Entrar"}
        </button>

        {msg && (
          <p style={{ marginTop: 12, fontSize: 14, color: "#f66" }}>{msg}</p>
        )}
      </div>
    </main>
  );
}
