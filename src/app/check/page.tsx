"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function CheckPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);

  // 🔹 Función principal para verificar el código
  const submit = useCallback(async () => {
    if (code.length !== 4) {
      setMsg("⚠️ Ingresa un código de 4 caracteres");
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.valid) {
        setMsg("✅ Código válido — acceso permitido");
        setVerified(true);
      } else {
        setMsg("❌ Inválido o ya usado");
        setVerified(false);
      }
    } catch (error) {
      console.error(error);
      setMsg("⚠️ Error al conectar con el servidor");
    } finally {
      setBusy(false);
    }
  }, [code]);

  // 🔹 Reiniciar campos para nueva verificación
  const reset = () => {
    setCode("");
    setMsg(null);
    setVerified(false);
  };

  // 🔹 Cerrar sesión de staff
  const logout = () => {
    localStorage.removeItem("staff_session");
    router.push("/staff-login");
  };

  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <h2 style={{ marginBottom: 20 }}>Verificación de código</h2>

        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4))
          }
          inputMode="numeric"
          pattern="\d*"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="____"
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "32px",
            textAlign: "center",
            borderRadius: "8px",
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "white",
            letterSpacing: "0.3em",
          }}
        />

        <button
          onClick={submit}
          disabled={busy}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: busy ? "#333" : "#ffffff",
            color: busy ? "#777" : "#000",
            fontWeight: "bold",
            cursor: busy ? "not-allowed" : "pointer",
            transition: "background 0.3s ease",
          }}
        >
          {busy ? "Verificando..." : "Validar"}
        </button>

        {msg && (
          <p
            style={{
              marginTop: "12px",
              color: verified ? "#4ade80" : "#f87171",
              fontSize: "14px",
            }}
          >
            {msg}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={reset}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#ccc",
              padding: "8px 12px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Nuevo código
          </button>

          <button
            onClick={logout}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid #f87171",
              borderRadius: "8px",
              color: "#f87171",
              padding: "8px 12px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </main>
  );
}
