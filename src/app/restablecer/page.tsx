'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldAlert } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useBranding } from '@/context/BrandingContext';

type Status = 'form' | 'submitting' | 'done';

export default function RestablecerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </div>
      }
    >
      <RestablecerForm />
    </Suspense>
  );
}

function RestablecerForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { branding, tokens } = useBranding();
  const { alert } = useAppDialog();

  const token = params?.get('token')?.trim() ?? '';
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [status, setStatus] = React.useState<Status>('form');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const logoUrl = branding.logoDarkUrl?.trim() || branding.logoUrl?.trim() || '';

  React.useEffect(() => {
    if (!token) {
      setErrorMessage('Falta el token de restablecimiento. Vuelve a solicitar el enlace desde la pantalla de acceso.');
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!data.ok) {
        setErrorMessage(data.error ?? 'No se pudo restablecer la contraseña.');
        setStatus('form');
        return;
      }

      setStatus('done');
      await alert({
        title: 'Contraseña actualizada',
        message: 'Tu contraseña fue restablecida. Ya puedes iniciar sesión con la nueva.',
        tone: 'success',
      });
      router.replace('/acceso');
    } catch {
      setErrorMessage('Error de conexión. Intenta de nuevo.');
      setStatus('form');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <section
        className="w-full max-w-md bg-white p-7 md:p-10"
        style={{ borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.6rem)` }}
      >
        <div className="flex justify-center mb-5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={branding.platformName} className="h-14 w-auto object-contain" />
          ) : (
            <ShieldAlert size={42} style={{ color: tokens.colors.accent }} />
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 text-center">Restablecer contraseña</h1>
        <p className="text-sm text-slate-600 text-center mt-2 mb-6">
          Define una nueva contraseña para tu cuenta de {branding.platformName}.
        </p>

        {status === 'done' ? (
          <div className="flex items-center justify-center gap-2 text-emerald-700">
            <CheckCircle2 size={18} />
            <span className="text-sm font-semibold">Contraseña actualizada. Redirigiendo...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold tracking-wide text-slate-600">Nueva contraseña</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-slate-500">
                <Lock size={16} className="text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="bg-transparent outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
                  disabled={status === 'submitting' || !token}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold tracking-wide text-slate-600">Confirmar contraseña</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-slate-500">
                <Lock size={16} className="text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="bg-transparent outline-none w-full text-sm text-slate-900 placeholder:text-slate-400"
                  disabled={status === 'submitting' || !token}
                />
              </div>
            </label>

            {errorMessage && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting' || !token}
              className="w-full mt-1 text-white font-bold py-2.5 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              style={{
                backgroundColor: tokens.colors.accent,
                borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.3rem)`,
              }}
            >
              {status === 'submitting' && <Loader2 size={16} className="animate-spin" />}
              Guardar nueva contraseña
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          <button
            type="button"
            onClick={() => router.push('/acceso')}
            className="hover:text-slate-600"
          >
            ← Volver al inicio de sesión
          </button>
        </p>
      </section>
    </div>
  );
}
