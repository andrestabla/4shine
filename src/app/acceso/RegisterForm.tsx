'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Building2, ChevronDown, Loader2, Mail, MapPin, Lock } from 'lucide-react';
import { USER_COUNTRY_OPTIONS, USER_JOB_ROLE_OPTIONS } from '@/lib/user-demographics';
import type { SessionUser } from '@/context/UserContext';

interface StyleProps {
  isCenteredImageLayout: boolean;
  inputClassName: string;
  fieldWrapperClassName: string;
  labelClassName: string;
  accentColor: string;
  borderRadiusRem: number;
}

interface RegisterFormProps extends StyleProps {
  onBack: () => void;
  onSuccess: (user: SessionUser) => void;
  onVerifyEmail: (email: string) => void;
  onError: (message: string) => void;
  googlePrefill?: { email: string; firstName: string; lastName: string; credential: string } | null;
}

interface Step1Data {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface Step2Data {
  profession: string;
  industry: string;
  country: string;
  jobRole: string;
}

export function RegisterForm({
  isCenteredImageLayout,
  inputClassName,
  fieldWrapperClassName,
  labelClassName,
  accentColor,
  borderRadiusRem,
  onBack,
  onSuccess,
  onVerifyEmail,
  onError,
  googlePrefill,
}: RegisterFormProps) {
  const isGoogleFlow = !!googlePrefill;
  const [step, setStep] = React.useState<1 | 2>(isGoogleFlow ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [step1, setStep1] = React.useState<Step1Data>({
    firstName: googlePrefill?.firstName ?? '',
    lastName: googlePrefill?.lastName ?? '',
    email: googlePrefill?.email ?? '',
    password: '',
    confirmPassword: '',
  });

  const [step2, setStep2] = React.useState<Step2Data>({
    profession: '',
    industry: '',
    country: '',
    jobRole: '',
  });

  const selectClassName = isCenteredImageLayout
    ? 'bg-transparent outline-none w-full text-sm text-white appearance-none cursor-pointer'
    : 'bg-transparent outline-none w-full text-sm text-slate-900 appearance-none cursor-pointer';

  const buttonStyle: React.CSSProperties = {
    backgroundColor: accentColor,
    borderRadius: `calc(${borderRadiusRem}rem + 0.3rem)`,
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1.firstName.trim() || !step1.lastName.trim()) {
      onError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (step1.password !== step1.confirmPassword) {
      onError('Las contraseñas no coinciden.');
      return;
    }
    if (step1.password.length < 8) {
      onError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2.country || !step2.jobRole) {
      onError('Por favor selecciona tu país y cargo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const body = isGoogleFlow
        ? {
            googleIdToken: googlePrefill!.credential,
            email: googlePrefill!.email,
            firstName: googlePrefill!.firstName,
            lastName: googlePrefill!.lastName,
            profession: step2.profession || undefined,
            industry: step2.industry || undefined,
            country: step2.country,
            jobRole: step2.jobRole,
          }
        : {
            email: step1.email,
            password: step1.password,
            firstName: step1.firstName,
            lastName: step1.lastName,
            profession: step2.profession || undefined,
            industry: step2.industry || undefined,
            country: step2.country,
            jobRole: step2.jobRole,
          };

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        action?: 'login' | 'verify_email';
        email?: string;
        user?: SessionUser;
      };

      if (!res.ok || !data.ok) {
        onError(data.error ?? 'No fue posible crear la cuenta.');
        return;
      }

      if (data.action === 'verify_email') {
        onVerifyEmail(data.email ?? step1.email);
        return;
      }

      if (data.user) {
        onSuccess(data.user as SessionUser);
      }
    } catch {
      onError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstName = isGoogleFlow ? googlePrefill!.firstName : step1.firstName;

  if (step === 2) {
    return (
      <div>
        <button
          type="button"
          onClick={() => (isGoogleFlow ? onBack() : setStep(1))}
          className={`flex items-center gap-1 text-xs mb-5 ${
            isCenteredImageLayout
              ? 'text-white/60 hover:text-white/90'
              : 'text-slate-500 hover:text-slate-700'
          } transition-colors`}
        >
          <ArrowLeft size={13} />
          {isGoogleFlow ? 'Volver al inicio' : 'Atrás'}
        </button>

        <p
          className={`text-xl font-bold mb-1 ${isCenteredImageLayout ? 'text-white' : 'text-slate-900'}`}
        >
          {isGoogleFlow ? `Hola, ${firstName}!` : 'Un último paso'}
        </p>
        <p className={`text-sm mb-5 ${isCenteredImageLayout ? 'text-white/65' : 'text-slate-500'}`}>
          Cuéntanos un poco de ti para personalizar tu experiencia
        </p>

        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <label className="block">
            <span className={labelClassName}>Profesión</span>
            <div className={fieldWrapperClassName}>
              <Briefcase
                size={15}
                className={isCenteredImageLayout ? 'text-white/45 shrink-0' : 'text-slate-400 shrink-0'}
              />
              <input
                type="text"
                value={step2.profession}
                onChange={(e) => setStep2((p) => ({ ...p, profession: e.target.value }))}
                placeholder="Ej. Ingeniero de software, Gerente de proyectos..."
                className={inputClassName}
              />
            </div>
          </label>

          <label className="block">
            <span className={labelClassName}>Industria</span>
            <div className={fieldWrapperClassName}>
              <Building2
                size={15}
                className={isCenteredImageLayout ? 'text-white/45 shrink-0' : 'text-slate-400 shrink-0'}
              />
              <input
                type="text"
                value={step2.industry}
                onChange={(e) => setStep2((p) => ({ ...p, industry: e.target.value }))}
                placeholder="Ej. Tecnología, Salud, Finanzas..."
                className={inputClassName}
              />
            </div>
          </label>

          <label className="block">
            <span className={labelClassName}>
              País <span className={isCenteredImageLayout ? 'text-white/40' : 'text-slate-400'}>*</span>
            </span>
            <div className={`${fieldWrapperClassName} relative`}>
              <MapPin
                size={15}
                className={isCenteredImageLayout ? 'text-white/45 shrink-0' : 'text-slate-400 shrink-0'}
              />
              <select
                required
                value={step2.country}
                onChange={(e) => setStep2((p) => ({ ...p, country: e.target.value }))}
                className={selectClassName}
              >
                <option value="">Seleccionar país</option>
                {USER_COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className={`shrink-0 pointer-events-none ${
                  isCenteredImageLayout ? 'text-white/40' : 'text-slate-400'
                }`}
              />
            </div>
          </label>

          <label className="block">
            <span className={labelClassName}>
              Cargo{' '}
              <span className={isCenteredImageLayout ? 'text-white/40' : 'text-slate-400'}>*</span>
            </span>
            <div className={`${fieldWrapperClassName} relative`}>
              <Briefcase
                size={15}
                className={isCenteredImageLayout ? 'text-white/45 shrink-0' : 'text-slate-400 shrink-0'}
              />
              <select
                required
                value={step2.jobRole}
                onChange={(e) => setStep2((p) => ({ ...p, jobRole: e.target.value }))}
                className={selectClassName}
              >
                <option value="">Seleccionar cargo</option>
                {USER_JOB_ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className={`shrink-0 pointer-events-none ${
                  isCenteredImageLayout ? 'text-white/40' : 'text-slate-400'
                }`}
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 text-white font-bold py-2.5 transition-opacity flex items-center justify-center gap-2"
            style={buttonStyle}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className={`flex items-center gap-1 text-xs mb-5 ${
          isCenteredImageLayout
            ? 'text-white/60 hover:text-white/90'
            : 'text-slate-500 hover:text-slate-700'
        } transition-colors`}
      >
        <ArrowLeft size={13} />
        Iniciar sesión
      </button>

      <p
        className={`text-xl font-bold mb-1 ${isCenteredImageLayout ? 'text-white' : 'text-slate-900'}`}
      >
        Crea tu cuenta
      </p>
      <p className={`text-sm mb-5 ${isCenteredImageLayout ? 'text-white/65' : 'text-slate-500'}`}>
        Es rápido y gratuito
      </p>

      <form onSubmit={handleStep1Next} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClassName}>Nombre</span>
            <div className={fieldWrapperClassName}>
              <input
                type="text"
                required
                value={step1.firstName}
                onChange={(e) => setStep1((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="María"
                className={inputClassName}
              />
            </div>
          </label>
          <label className="block">
            <span className={labelClassName}>Apellido</span>
            <div className={fieldWrapperClassName}>
              <input
                type="text"
                required
                value={step1.lastName}
                onChange={(e) => setStep1((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="García"
                className={inputClassName}
              />
            </div>
          </label>
        </div>

        <label className="block">
          <span className={labelClassName}>Correo</span>
          <div className={fieldWrapperClassName}>
            <Mail
              size={15}
              className={isCenteredImageLayout ? 'text-white/45 shrink-0' : 'text-slate-400 shrink-0'}
            />
            <input
              type="email"
              required
              value={step1.email}
              onChange={(e) => setStep1((p) => ({ ...p, email: e.target.value }))}
              placeholder="tu@correo.com"
              className={inputClassName}
            />
          </div>
        </label>

        <label className="block">
          <span className={labelClassName}>Contraseña</span>
          <div className={fieldWrapperClassName}>
            <Lock
              size={15}
              className={isCenteredImageLayout ? 'text-white/45 shrink-0' : 'text-slate-400 shrink-0'}
            />
            <input
              type="password"
              required
              minLength={8}
              value={step1.password}
              onChange={(e) => setStep1((p) => ({ ...p, password: e.target.value }))}
              placeholder="Mínimo 8 caracteres"
              className={inputClassName}
            />
          </div>
        </label>

        <label className="block">
          <span className={labelClassName}>Confirmar contraseña</span>
          <div className={fieldWrapperClassName}>
            <Lock
              size={15}
              className={isCenteredImageLayout ? 'text-white/45 shrink-0' : 'text-slate-400 shrink-0'}
            />
            <input
              type="password"
              required
              value={step1.confirmPassword}
              onChange={(e) => setStep1((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Repite la contraseña"
              className={inputClassName}
            />
          </div>
        </label>

        <button
          type="submit"
          className="w-full mt-2 text-white font-bold py-2.5 transition-opacity flex items-center justify-center gap-2"
          style={buttonStyle}
        >
          Siguiente
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
