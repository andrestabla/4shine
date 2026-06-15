"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useUser } from "@/context/UserContext";

export default function CambiarClavePage() {
  const router = useRouter();
  const { isHydrating, isAuthenticated, mustChangePassword } = useUser();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isHydrating) return;
    if (!isAuthenticated) router.replace("/acceso");
    // Si ya no se requiere el cambio, no tiene sentido quedarse aquí.
    else if (!mustChangePassword) router.replace("/dashboard");
  }, [isHydrating, isAuthenticated, mustChangePassword, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });
      const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !payload.ok) {
        throw new Error(payload.error ?? "No se pudo cambiar la contraseña.");
      }
      // Recarga completa para re-hidratar la sesión sin el flag y entrar al dashboard.
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
      setSaving(false);
    }
  };

  if (isHydrating) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--app-bg)]">
        <Loader2 size={32} className="animate-spin text-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-[min(94vw,440px)] rounded-[20px] border border-[var(--app-border)] bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
          <Lock size={22} />
        </div>
        <h1 className="text-xl font-black text-[var(--app-ink)]">Define una nueva contraseña</h1>
        <p className="mt-1 text-sm text-[var(--app-muted)]">
          Por seguridad, debes establecer una nueva contraseña antes de continuar.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="app-field-label">Nueva contraseña</span>
            <input
              type="password"
              className="app-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="app-field-label">Confirmar contraseña</span>
            <input
              type="password"
              className="app-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
          </label>

          {error && (
            <p className="rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="app-button-primary inline-flex w-full items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {saving ? "Guardando…" : "Guardar y continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
