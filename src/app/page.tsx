'use client';

import React from 'react';
import { Gem, Lock, Mail, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';

export default function LoginPage() {
  const { login, isHydrating } = useUser();
  const { alert } = useAppDialog();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const result = await login(email, password);
    if (!result.ok) {
      await alert({
        title: 'Error de acceso',
        message: result.error ?? 'No fue posible iniciar sesión',
        tone: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[28rem] h-[28rem] rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl relative z-10">
        <div className="flex justify-center mb-5">
          <Gem className="w-14 h-14 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">4Shine Platform</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Inicia sesión con tu cuenta corporativa.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-slate-400 font-semibold tracking-wide">Correo</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 focus-within:border-amber-500">
              <Mail size={16} className="text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.correo@4shine.co"
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs text-slate-400 font-semibold tracking-wide">Contraseña</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 focus-within:border-amber-500">
              <Lock size={16} className="text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={isHydrating}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isHydrating && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
        </form>

        <div className="mt-8 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
          <p className="text-xs text-slate-300 font-semibold mb-2">Credenciales iniciales (seed)</p>
          <p className="text-xs text-slate-400">`admin@4shine.co` / `4Shine2026!`</p>
          <p className="text-xs text-slate-400">`sofia.martinez@4shine.co` / `4Shine2026!`</p>
          <p className="text-xs text-slate-400">`carlos.ruiz@4shine.co` / `4Shine2026!`</p>
        </div>
      </div>
    </div>
  );
}
