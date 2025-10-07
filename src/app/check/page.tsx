"use client";

import { useEffect, useRef, useState } from "react";

const CODE_REGEX = /^(?:[A-Z]\d{3}|\d[A-Z]\d{2}|\d{2}[A-Z]\d|\d{3}[A-Z])$/;

export default function CheckPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoClearTimer = useRef<number | null>(null);

  // Enfocar al cargar
  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (autoClearTimer.current) window.clearTimeout(autoClearTimer.current);
    };
  }, []);

  const normalize = (v: string) =>
    v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);

  const onChange = (v: string) => {
    const n = normalize(v);
    setCode(n);
    setMsg(null);
    setErr(null);
  };

  const reset = () => {
    if (autoClearTimer.current) window.clearTimeout(autoClearTimer.current);
    setCode("");
    setMsg(null);
    setErr(null);
    setBusy(false);
    inputRef.current?.focus();
  };

  const submit = async () => {
    const normalized = normalize(code);
    if (!CODE_REGEX.test(normalized)) {
      setErr("Formato inválido (debe ser 1 letra y 3 dígitos)");
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const j = await res.json();
      if (res.status === 429) {
        setErr(j.error || "Rate limit excedido. Intenta más tarde.");
      } else if (!res.ok) {
        setErr(j.error || "Error de verificación");
      } else {
        if (j.valid) {
          setMsg("Código válido — acceso permitido ✅");
          // Auto-limpiar para el siguiente escaneo/ingreso
          autoClearTimer.current = window.setTimeout(() => {
            reset();
          }, 1200);
        } else {
          setMsg("Código Inválido ❌");
          inputRef.current?.focus();
        }
      }
    } catch {
      setErr("Error de red");
    } finally {
      setBusy(false);
    }
  };

  // Atajos de teclado globales (Enter, Esc)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!busy) submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, code]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ width: 340 }}>
        <h1 style={{ fontWeight: 600, fontSize: 20, textAlign: "center" }}>
          Verificación de código
        </h1>

        <input
          ref={inputRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          inputMode="latin"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Código de acceso (1 letra y 3 dígitos)"
          maxLength={4}
          placeholder="A123"
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: 28,
            letterSpacing: "0.4em",
            padding: 12,
            marginTop: 12,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={submit}
            disabled={busy || code.length !== 4}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              background: "#111",
              color: "#fff",
              opacity: busy || code.length !== 4 ? 0.5 : 1,
            }}
          >
            {busy ? "Verificando…" : "Validar (Enter)"}
          </button>

          <button
            type="button"
            onClick={reset}
            disabled={busy}
            style={{
              padding: 12,
              borderRadius: 8,
              background: "#e5e7eb",
              color: "#111",
              minWidth: 120,
              opacity: busy ? 0.6 : 1,
            }}
            title="Limpia el campo y vuelve a enfocar (Esc)"
          >
            Nuevo código
          </button>
        </div>

        {msg && (
          <p style={{ textAlign: "center", marginTop: 12 }}>{msg}</p>
        )}
        {err && (
          <p style={{ textAlign: "center", marginTop: 8, color: "#e11d48" }}>
            {err}
          </p>
        )}

        <button
          onClick={async () => {
            await fetch("/api/staff-session", { method: "DELETE" });
            location.href = "/staff-login";
          }}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            background: "#f3f4f6",
            color: "#111",
          }}
        >
          Salir
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: 12,
            color: "#6b7280",
          }}
        >
        </p>
      </div>
    </main>
  );
}
