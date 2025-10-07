'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type ApiOk = { ok: true; sessionId: string };
type ApiErr = { ok: false; message?: string };
type ApiResponse = ApiOk | ApiErr;

export default function StaffLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(async () => {
    if (loading) return;
    setError(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setError('Ingresa tu código de staff.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/staff-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error('server');
      }

      const data: ApiResponse = (await res.json()) as ApiResponse;

      if ('ok' in data && data.ok) {
        router.push('/check');
        return;
      }

      const msg =
        'message' in data && data.message ? data.message : 'Código incorrecto.';
      setError(msg);
    } catch {
      setError('Error del servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [code, loading, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const salir = () => router.push('/');

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-neutral-900/70 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.55)] p-6 md:p-8 backdrop-blur">
          <h1 className="text-center text-2xl md:text-3xl font-semibold">
            Acceso Staff
          </h1>
          <p className="mt-2 text-center text-sm text-neutral-300">
            Ingresa tu código de staff para continuar.
          </p>

          {/* INPUT GRANDE, CENTRADO — ESTILO “CHECK” */}
          <div className="mt-6">
            <label htmlFor="staff-code" className="sr-only">
              Código de staff
            </label>
            <input
              id="staff-code"
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="———"
              inputMode="numeric"
              pattern="\d*"
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck={false}
              className="w-full h-16 rounded-2xl bg-neutral-800/70 border border-white/10 px-4 text-center
                         text-2xl md:text-3xl font-mono tracking-[0.6em] caret-white placeholder:text-neutral-500
                         focus:outline-none focus:ring-2 focus:ring-white/25 focus:border-white transition"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-400 text-center" role="alert">
              {error}
            </div>
          )}

          {/* BOTÓN PRIMARIO COMO EN “CHECK” */}
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="mt-6 w-full h-12 rounded-xl bg-white text-black font-medium
                       shadow hover:bg-neutral-200 active:bg-neutral-300 disabled:opacity-60 transition"
          >
            {loading ? 'Validando…' : 'Entrar'}
          </button>

          {/* FILA DE DOS BOTONES — MISMO LAYOUT QUE “CHECK”
              Izquierda: botón fantasma (ocupa espacio para alinear)
              Derecha: Salir (borde rojo) */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled
              className="h-11 rounded-xl border border-neutral-700 text-neutral-300 opacity-0 pointer-events-none"
            >
              Placeholder
            </button>

            <button
              type="button"
              onClick={salir}
              className="h-11 rounded-xl border border-red-500 text-red-400 font-medium
                         hover:bg-red-500/10 active:bg-red-500/20 transition"
            >
              Salir
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-neutral-400">
            Solo personal autorizado.
          </p>
        </div>
      </div>
    </div>
  );
}
