'use client';

import React from 'react';
import { Eye, EyeOff, Mail, RefreshCw, Save, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { createUser, listOrganizations, type OrganizationRecord } from '@/features/usuarios/client';
import {
  resolveUserTypeSelection,
  USER_TYPE_OPTIONS,
  userTypeLabel,
  type UserTypeOption,
} from '@/features/usuarios/user-types';
import { listPlans as listSubscriptionPlans } from '@/features/planes/client';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/client';
import { YEARS_EXPERIENCE_OPTIONS, keyToStoredValue } from '@/lib/demographics';
import {
  USER_COUNTRY_OPTIONS,
  USER_DEMOGRAPHIC_PLACEHOLDERS,
  USER_GENDER_OPTIONS,
  USER_JOB_ROLE_OPTIONS,
  type UserJobRoleOption,
} from '@/lib/user-demographics';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: UserTypeOption;
  subscriptionPlanId: string;
  country: string;
  jobRole: UserJobRoleOption | '';
  gender: string;
  yearsExperience: string;
  sendWelcomeEmail: boolean;
  organizationId: string;
}

// Genera una contraseña segura: 12 chars mezcla mayúsculas, minúsculas,
// números y símbolos. Garantiza al menos uno de cada grupo.
function generatePassword(): string {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';   // sin I, L, O para legibilidad
  const lower = 'abcdefghjkmnpqrstuvwxyz';   // sin i, l, o
  const digits = '23456789';                  // sin 0, 1
  const symbols = '!@#$%&*?';
  const all = upper + lower + digits + symbols;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: 8 }, () => pick(all));
  return [...required, ...rest]
    .sort(() => Math.random() - 0.5)
    .join('');
}

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const { can, refreshBootstrap } = useUser();
  const { alert } = useAppDialog();

  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [plans, setPlans] = React.useState<SubscriptionPlanWithFeatures[]>([]);
  const [organizations, setOrganizations] = React.useState<OrganizationRecord[]>([]);
  const [form, setForm] = React.useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: 'leader_without_subscription',
    subscriptionPlanId: '',
    country: '',
    jobRole: '',
    gender: '',
    yearsExperience: '',
    sendWelcomeEmail: true,
    organizationId: '',
  });

  const canCreate = can('usuarios', 'create');

  // Cargar organizaciones disponibles (gestión admin).
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const orgs = await listOrganizations();
        if (!cancelled) setOrganizations(orgs);
      } catch {
        if (!cancelled) setOrganizations([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cargar planes de suscripción cuando aplique
  React.useEffect(() => {
    if (form.userType !== 'leader_with_subscription') return;
    if (plans.length > 0) return;
    let cancelled = false;
    (async () => {
      const res = await listSubscriptionPlans(false);
      if (cancelled) return;
      if (res.ok && res.data) setPlans(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [form.userType, plans.length]);

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setForm((prev) => ({ ...prev, password: newPassword }));
    setShowPassword(true);
  };

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
    if (form.password.length < 8) {
      await alert({
        title: 'Contraseña débil',
        message: 'Usa al menos 8 caracteres (o haz clic en "Generar" para una segura).',
        tone: 'warning',
      });
      return;
    }
    const yearsExperience = keyToStoredValue(form.yearsExperience);
    // País, cargo, género y años de experiencia son opcionales al crear el
    // usuario manualmente. El propio usuario los completará en su primer
    // ingreso desde el flujo de onboarding (página de perfil).
    if (form.userType === 'leader_with_subscription' && !form.subscriptionPlanId) {
      await alert({
        title: 'Selecciona un plan',
        message: 'Para "Líder con suscripción" debes asignar un plan de suscripción específico.',
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
        subscriptionPlanId:
          form.userType === 'leader_with_subscription' && form.subscriptionPlanId
            ? form.subscriptionPlanId
            : undefined,
        country: form.country.trim() || null,
        jobRole: form.jobRole || null,
        gender: form.gender || null,
        yearsExperience,
        sendWelcomeEmail: form.sendWelcomeEmail,
        organizationId: form.organizationId || null,
      });

      await refreshBootstrap();
      await alert({
        title: 'Usuario creado',
        message: `Se registró ${created.displayName}.${form.sendWelcomeEmail ? ' Se envió correo de bienvenida con sus credenciales.' : ''}`,
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

  const needsSubscription = form.userType === 'leader_with_subscription';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
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

          <label className="md:col-span-2">
            <span className="app-field-label">Contraseña Inicial *</span>
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="app-input pr-10"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--app-muted)] hover:text-[var(--app-ink)]"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-bold text-[var(--app-ink)] transition hover:bg-[var(--app-chip)]"
                title="Generar contraseña segura"
              >
                <RefreshCw size={13} />
                Generar
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Mínimo 8 caracteres. Recomendado: usar el botón &quot;Generar&quot; para una
              contraseña segura.
            </p>
          </label>

          <label>
            <span className="app-field-label">
              País <span className="font-normal text-[var(--app-muted)]">· opcional</span>
            </span>
            <select
              className="app-select"
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
            >
              <option value="">{USER_DEMOGRAPHIC_PLACEHOLDERS.country}</option>
              {USER_COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="app-field-label">
              Cargo <span className="font-normal text-[var(--app-muted)]">· opcional</span>
            </span>
            <select
              className="app-select"
              value={form.jobRole}
              onChange={(event) => setForm((prev) => ({ ...prev, jobRole: event.target.value as FormState['jobRole'] }))}
            >
              <option value="">{USER_DEMOGRAPHIC_PLACEHOLDERS.jobRole}</option>
              {USER_JOB_ROLE_OPTIONS.map((jobRole) => (
                <option key={jobRole} value={jobRole}>{jobRole}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="app-field-label">
              Género <span className="font-normal text-[var(--app-muted)]">· opcional</span>
            </span>
            <select
              className="app-select"
              value={form.gender}
              onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
            >
              <option value="">{USER_DEMOGRAPHIC_PLACEHOLDERS.gender}</option>
              {USER_GENDER_OPTIONS.map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="app-field-label">
              Años de Experiencia <span className="font-normal text-[var(--app-muted)]">· opcional</span>
            </span>
            <select
              className="app-select"
              value={form.yearsExperience}
              onChange={(event) => setForm((prev) => ({ ...prev, yearsExperience: event.target.value }))}
            >
              <option value="">{USER_DEMOGRAPHIC_PLACEHOLDERS.yearsExperience}</option>
              {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </label>

          <p className="md:col-span-2 -mt-2 text-[11px] text-[var(--app-muted)]">
            País, cargo, género y años de experiencia son opcionales aquí. El usuario los
            completará en su primer ingreso desde su perfil.
          </p>

          <label className="md:col-span-2">
            <span className="app-field-label">
              Organización <span className="font-normal text-[var(--app-muted)]">· opcional</span>
            </span>
            <select
              className="app-select"
              value={form.organizationId}
              onChange={(event) => setForm((prev) => ({ ...prev, organizationId: event.target.value }))}
            >
              <option value="">Organización por defecto (la del administrador)</option>
              {organizations.map((org) => (
                <option key={org.organizationId} value={org.organizationId}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="app-field-label">Tipo de usuario *</span>
            <select
              className="app-select"
              value={form.userType}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  userType: event.target.value as UserTypeOption,
                  subscriptionPlanId:
                    event.target.value === 'leader_with_subscription' ? prev.subscriptionPlanId : '',
                }))
              }
            >
              {USER_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>{userTypeLabel(option)}</option>
              ))}
            </select>
          </label>

          {needsSubscription && (
            <label className="md:col-span-2">
              <span className="app-field-label">Plan de suscripción *</span>
              <select
                className="app-select"
                value={form.subscriptionPlanId}
                onChange={(event) => setForm((prev) => ({ ...prev, subscriptionPlanId: event.target.value }))}
                required
              >
                <option value="">{plans.length === 0 ? 'Cargando planes…' : 'Selecciona un plan'}</option>
                {plans.map((plan) => (
                  <option key={plan.planId} value={plan.planId}>
                    {plan.name} · {plan.currencyCode} {plan.priceAmount.toLocaleString('en-US')} · {plan.durationDays}d
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Define el plan activo al momento de crear la cuenta. Puedes cambiarlo después desde
                el detalle del usuario.
              </p>
            </label>
          )}
        </div>

        {/* Toggle: enviar correo de bienvenida */}
        <div className="mt-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={form.sendWelcomeEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, sendWelcomeEmail: event.target.checked }))}
            />
            <span>
              <span className="inline-flex items-center gap-2 text-sm font-bold text-[var(--app-ink)]">
                <Mail size={14} />
                Enviar correo de bienvenida con sus credenciales
              </span>
              <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
                Le llegará al usuario un correo con su email y contraseña inicial para que pueda
                ingresar. Usa la plantilla del evento &quot;Bienvenida con credenciales&quot; (configurable en
                Administración → Notificaciones → Plantillas).
              </p>
            </span>
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
