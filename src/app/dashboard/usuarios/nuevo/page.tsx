'use client';

import Link from 'next/link';
import React from 'react';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { createUser, type AppRole } from '@/features/usuarios/client';

type LeaderSubscriptionMode = 'without_subscription' | 'with_subscription';

interface FormState {
  fullName: string;
  email: string;
  password: string;
  primaryRole: AppRole;
  leaderSubscription: LeaderSubscriptionMode;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const clean = fullName.trim().replace(/\s+/g, ' ');
  const pieces = clean.split(' ').filter(Boolean);
  if (pieces.length <= 1) {
    return {
      firstName: pieces[0] ?? '',
      lastName: pieces[0] ?? '',
    };
  }

  return {
    firstName: pieces.slice(0, -1).join(' '),
    lastName: pieces.slice(-1).join(' '),
  };
}

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const { can, refreshBootstrap } = useUser();
  const { alert } = useAppDialog();

  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    primaryRole: 'lider',
    leaderSubscription: 'without_subscription',
  });

  const canCreate = can('usuarios', 'create');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate || submitting) return;

    const { firstName, lastName } = splitName(form.fullName);
    if (!firstName || !lastName || !form.email.trim() || !form.password.trim()) {
      await alert({
        title: 'Campos requeridos',
        message: 'Nombre completo, correo y contraseña son obligatorios.',
        tone: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await createUser({
        email: form.email.trim(),
        firstName,
        lastName,
        displayName: form.fullName.trim(),
        primaryRole: form.primaryRole,
        password: form.password,
        planType:
          form.primaryRole === 'lider'
            ? form.leaderSubscription === 'with_subscription'
              ? 'premium'
              : 'standard'
            : null,
      });

      await refreshBootstrap();
      await alert({
        title: 'Usuario creado',
        message: `Se registró correctamente ${created.displayName}.`,
        tone: 'success',
      });
      router.push(`/dashboard/usuarios/${created.userId}`);
    } catch (error) {
      await alert({
        title: 'Error al crear usuario',
        message: error instanceof Error ? error.message : 'No fue posible registrar el usuario.',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        No tienes permisos para crear usuarios.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Link href="/dashboard/usuarios" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} />
        Volver a la Lista
      </Link>

      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-800">
          <UserPlus size={28} />
          Crear Nuevo Usuario
        </h1>
        <p className="text-slate-500">Registra un nuevo usuario manualmente y define su rol inicial.</p>
      </header>

      <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Nombre Completo *</span>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-slate-500"
              placeholder="Ej: Juan Pérez"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              required
            />
          </label>

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Correo Electrónico *</span>
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-slate-500"
              placeholder="usuario@empresa.com"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Contraseña Inicial *</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-slate-500"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Rol *</span>
            <select
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-slate-500"
              value={form.primaryRole}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryRole: event.target.value as AppRole }))}
            >
              <option value="lider">Líder</option>
              <option value="mentor">Mentor</option>
              <option value="gestor">Gestor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>

          {form.primaryRole === 'lider' && (
            <label className="md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-slate-700">
                Estado de suscripción del líder *
              </span>
              <select
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-800 outline-none focus:border-slate-500"
                value={form.leaderSubscription}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    leaderSubscription: event.target.value as LeaderSubscriptionMode,
                  }))
                }
              >
                <option value="without_subscription">Líder sin suscripción</option>
                <option value="with_subscription">Líder con suscripción</option>
              </select>
              <p className="mt-2 text-sm text-slate-500">
                El líder sin suscripción entra con acceso free. El líder con suscripción
                queda habilitado para el programa 4Shine.
              </p>
            </label>
          )}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-w-56 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <Save size={16} />
            {submitting ? 'Registrando...' : 'Registrar Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}
