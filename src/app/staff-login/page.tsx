"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StaffLogin() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/staff-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) setMsg(j.error || "PIN incorrecto");
      else router.push("/check");
    } catch {
      setMsg("Error de red");
    } finally { setBusy(false); }
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 320 }}>
        <h1 style={{ fontWeight: 600, fontSize: 20, textAlign: "center" }}>Acceso staff</h1>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 32))}
          placeholder="PIN"
          style={{ width: "100%", textAlign: "center", fontSize: 20, padding: 12, marginTop: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}
        />
        <button
          onClick={submit}
          disabled={busy || pin.length < 4}
          style={{ width: "100%", marginTop: 12, padding: 12, borderRadius: 8, background: "#111", color: "#fff", opacity: busy || pin.length < 4 ? 0.5 : 1 }}
        >
          {busy ? "Verificando…" : "Entrar"}
        </button>
        {msg && <p style={{ textAlign: "center", marginTop: 12, color: "#e11d48" }}>{msg}</p>}
      </div>
    </main>
  );
}
