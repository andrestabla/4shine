'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import type { SessionUser } from '@/context/UserContext';

type VerifyState = 'loading' | 'success' | 'error';

function VerificarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applySession } = useUser();
  const [state, setState] = React.useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = React.useState('');
  const didRun = React.useRef(false);

  React.useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setErrorMessage('El enlace de verificación es inválido.');
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
          credentials: 'include',
        });
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          user?: SessionUser;
        };

        if (!res.ok || !data.ok) {
          setState('error');
          setErrorMessage(data.error ?? 'No fue posible verificar tu cuenta.');
          return;
        }

        setState('success');

        if (data.user) {
          await applySession(data.user as SessionUser);
        }

        setTimeout(() => router.push('/dashboard'), 1800);
      } catch {
        setState('error');
        setErrorMessage('Error de conexión. Intenta de nuevo.');
      }
    })();
  }, [searchParams, applySession, router]);

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
      {state === 'loading' && (
        <>
          <Loader2 size={44} className="mx-auto animate-spin text-indigo-500 mb-4" />
          <p className="text-lg font-semibold text-slate-800">Verificando tu cuenta...</p>
          <p className="text-sm text-slate-500 mt-2">Un momento, por favor.</p>
        </>
      )}

      {state === 'success' && (
        <>
          <CheckCircle size={44} className="mx-auto text-emerald-500 mb-4" />
          <p className="text-lg font-semibold text-slate-800">¡Cuenta verificada!</p>
          <p className="text-sm text-slate-500 mt-2">Ingresando a la plataforma...</p>
        </>
      )}

      {state === 'error' && (
        <>
          <XCircle size={44} className="mx-auto text-rose-500 mb-4" />
          <p className="text-lg font-semibold text-slate-800">No se pudo verificar</p>
          <p className="text-sm text-slate-500 mt-2">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.push('/acceso')}
            className="mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Ir al inicio de sesión
          </button>
        </>
      )}
    </div>
  );
}

export default function VerificarPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <React.Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <Loader2 size={44} className="mx-auto animate-spin text-indigo-500 mb-4" />
            <p className="text-sm text-slate-500">Cargando...</p>
          </div>
        }
      >
        <VerificarContent />
      </React.Suspense>
    </div>
  );
}
