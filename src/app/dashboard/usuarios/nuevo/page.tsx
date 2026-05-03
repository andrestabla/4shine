'use client';

import Link from 'next/link';
import React from 'react';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { createUser } from '@/features/usuarios/client';
import {
  resolveUserTypeSelection,
  USER_TYPE_OPTIONS,
  userTypeLabel,
  type UserTypeOption,
} from '@/features/usuarios/user-types';
import { YEARS_EXPERIENCE_OPTIONS, keyToStoredValue } from '@/lib/demographics';
import { USER_COUNTRY_OPTIONS, USER_GENDER_OPTIONS, USER_JOB_ROLE_OPTIONS, type UserJobRoleOption } from '@/lib/user-demographics';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: UserTypeOption;
  country: string;
  jobRole: UserJobRoleOption | '';
  gender: string;
  yearsExperience: string;
}

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const { can, refreshBootstrap } = useUser();
  const { alert } = useAppDialog();

  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'leader_without_subscription',
    country: '',
    jobRole: '',
    gender: '',
    yearsExperience: '',
  });

  const canCreate = can('usuarios', 'create');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate || submitting) return;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    if (!firstName || !lastName || !form.email.trim() || !form.password.trim()) {
      await alert({
        title: 'Campos requeridos',
        message: 'Nombres, apellidos, correo y contraseña son obligatorios.',
        tone: 'warning',
      });
      return;
    }
    const yearsExperience = keyToStoredValue(form.yearsExperience);
    if (!form.country.trim() || !form.jobRole || !form.gender.trim() || yearsExperience === null) {
      await alert({
        title: 'Campos requeridos',
        message: 'País, cargo, género y años de experiencia son obligatorios.',
        tone: 'warning',
      });
      return;
    }

    setSubmitting(true);
    try {
      const userTypeSelection = resolveUserTypeSelection(form.userType);
      const created = await createUser({
        email: form.email.trim(),
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        primaryRole: userTypeSelection.primaryRole,
        password: form.password,
        planType: userTypeSelection.planType,
        country: form.country.trim(),
        jobRole: form.jobRole,
        gender: form.gender,
        yearsExperience,
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
      <div className="app-panel px-6 py-6 text-sm text-[var(--app-muted)]">
        No tienes permisos para crear usuarios.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Link href="/dashboard/usuarios" className="inline-flex items-center gap-2 text-sm text-[var(--app-muted)] transition hover:text-[var(--app-ink)]">
        <ArrowLeft size={16} />
        Volver a la Lista
      </Link>

      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-[var(--app-ink)]">
          <UserPlus size={28} />
          Crear Nuevo Usuario
        </h1>
        <p className="text-[var(--app-muted)]">Registra un nuevo usuario manualmente y define su rol inicial.</p>
      </header>

      <form onSubmit={onSubmit} className="app-panel-strong p-6 md:p-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label>
            <span className="app-field-label">Nombres *</span>
            <input
              className="app-input"
              placeholder="Ej: Juan"
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              required
            />
          </label>

          <label>
            <span className="app-field-label">Apellidos *</span>
            <input
              className="app-input"
              placeholder="Ej: Pérez"
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              required
            />
          </label>

          <label className="md:col-span-2">
            <span className="app-field-label">Correo Electrónico *</span>
            <input
              type="email"
              className="app-input"
              placeholder="usuario@empresa.com"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>

          <label>
            <span className="app-field-label">Contraseña Inicial *</span>
            <input
              type="password"
              className="app-input"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>

          <label>
            <span className="app-field-label">País</span>
            <select
              className="app-select"
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
              required
            >
              <option value="">Seleccionar país</option>
              {USER_COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="app-field-label">Cargo</span>
            <select
              className="app-select"
              value={form.jobRole}
              onChange={(event) => setForm((prev) => ({ ...prev, jobRole: event.target.value as FormState['jobRole'] }))}
              required
            >
              <option value="">Sin definir</option>
              {USER_JOB_ROLE_OPTIONS.map((jobRole) => (
                <option key={jobRole} value={jobRole}>
                  {jobRole}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="app-field-label">Género</span>
            <select
              className="app-select"
              value={form.gender}
              onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
              required
            >
              <option value="">Género</option>
              {USER_GENDER_OPTIONS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="app-field-label">Años de Experiencia</span>
            <select
              className="app-select"
              value={form.yearsExperience}
              onChange={(event) => setForm((prev) => ({ ...prev, yearsExperience: event.target.value }))}
              required
            >
              <option value="">Seleccionar rango</option>
              {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="app-field-label">Tipo de usuario *</span>
            <select
              className="app-select"
              value={form.userType}
              onChange={(event) => setForm((prev) => ({ ...prev, userType: event.target.value as UserTypeOption }))}
            >
              {USER_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {userTypeLabel(option)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-[var(--app-muted)]">
              Para líderes podrás distinguir si entra con acceso free o con suscripción activa al programa 4Shine.
            </p>
          </label>
        </div>

        <div className="mt-6 border-t border-[rgba(91,52,117,0.08)] pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="app-button-primary min-w-56 text-base disabled:opacity-60"
          >
            <Save size={16} />
            {submitting ? 'Registrando...' : 'Registrar Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}
