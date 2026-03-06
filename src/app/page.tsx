'use client';

import React from 'react';
import { Gem, Loader2, Lock, Mail } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useBranding } from '@/context/BrandingContext';
import { useUser } from '@/context/UserContext';

function hexToRgba(hex: string, opacity: number): string {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return `rgba(15, 23, 42, ${opacity})`;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return `rgba(15, 23, 42, ${opacity})`;
  }

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export default function LoginPage() {
  const { login, isHydrating } = useUser();
  const { branding, tokens } = useBranding();
  const { alert } = useAppDialog();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const visibility = tokens.text.visibility;
  const isImageRightLayout = branding.loginLayout === 'image_right';
  const isImageLeftLayout = branding.loginLayout === 'image_left';
  const isCenteredImageLayout = branding.loginLayout === 'centered_image';
  const hasLoginBackgroundImage = hasText(branding.loginBackgroundImageUrl);
  const overlayColor = hexToRgba(
    tokens.layout.loginOverlayColor,
    Math.min(Math.max(tokens.layout.loginOverlayOpacity, 0), 1),
  );

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

  const splitImagePanelStyle: React.CSSProperties = hasLoginBackgroundImage
    ? {
        backgroundImage: `linear-gradient(0deg, ${overlayColor}, ${overlayColor}), url("${branding.loginBackgroundImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage: `linear-gradient(120deg, color-mix(in srgb, ${tokens.colors.primary} 86%, black), color-mix(in srgb, ${tokens.colors.secondary} 78%, black))`,
      };

  const centeredPageBackgroundStyle: React.CSSProperties = hasLoginBackgroundImage
    ? {
        backgroundImage: `linear-gradient(0deg, ${overlayColor}, ${overlayColor}), url("${branding.loginBackgroundImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage: `radial-gradient(circle at 12% 16%, color-mix(in srgb, ${tokens.colors.accent} 30%, transparent), transparent 45%), linear-gradient(120deg, color-mix(in srgb, ${tokens.colors.primary} 90%, black), color-mix(in srgb, ${tokens.colors.secondary} 78%, black))`,
      };

  const inputClassName = isCenteredImageLayout
    ? 'bg-black/20 outline-none w-full text-sm text-white placeholder:text-white/45'
    : 'bg-transparent outline-none w-full text-sm text-slate-900 placeholder:text-slate-400';

  const fieldWrapperClassName = isCenteredImageLayout
    ? 'mt-1 flex items-center gap-2 rounded-xl border border-white/25 bg-black/20 px-3 py-2 focus-within:border-white/50'
    : 'mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:border-slate-500';

  const loginCardClassName = isCenteredImageLayout
    ? 'w-full border border-white/15 shadow-2xl backdrop-blur-xl p-6 md:p-8'
    : 'w-full p-7 md:p-10';

  const loginCardStyle: React.CSSProperties = isCenteredImageLayout
    ? {
        borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.9rem)`,
        backgroundColor: 'color-mix(in srgb, white 10%, var(--brand-primary))',
        maxWidth: '520px',
      }
    : {
        maxWidth: '520px',
      };

  const formContainer = (
    <section className={loginCardClassName} style={loginCardStyle}>
      <div className="flex justify-center mb-4">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt={branding.platformName}
            className="w-14 h-14 rounded-2xl object-cover"
          />
        ) : (
          <Gem className="w-14 h-14" style={{ color: tokens.colors.accent }} />
        )}
      </div>

      {visibility.platformName && hasText(branding.platformName) && (
        <h1
          className={`text-3xl font-bold text-center ${isCenteredImageLayout ? 'text-white' : 'text-slate-900'}`}
        >
          {branding.platformName}
        </h1>
      )}

      {visibility.welcomeMessage && hasText(branding.welcomeMessage) && (
        <p
          className={`text-center text-sm mt-2 ${
            isCenteredImageLayout ? 'text-white/75' : 'text-slate-600'
          }`}
        >
          {branding.welcomeMessage}
        </p>
      )}

      {visibility.loginHeadline && hasText(branding.loginHeadline) && (
        <p
          className={`text-center mt-4 text-lg font-semibold ${
            isCenteredImageLayout ? 'text-white' : 'text-slate-900'
          }`}
        >
          {branding.loginHeadline}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <label className="block">
          <span
            className={`text-xs font-semibold tracking-wide ${
              isCenteredImageLayout ? 'text-white/75' : 'text-slate-600'
            }`}
          >
            Correo
          </span>
          <div className={fieldWrapperClassName}>
            <Mail
              size={16}
              className={isCenteredImageLayout ? 'text-white/55' : 'text-slate-400'}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu.correo@empresa.com"
              className={inputClassName}
            />
          </div>
        </label>

        <label className="block">
          <span
            className={`text-xs font-semibold tracking-wide ${
              isCenteredImageLayout ? 'text-white/75' : 'text-slate-600'
            }`}
          >
            Contraseña
          </span>
          <div className={fieldWrapperClassName}>
            <Lock
              size={16}
              className={isCenteredImageLayout ? 'text-white/55' : 'text-slate-400'}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={inputClassName}
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={isHydrating}
          className="w-full mt-1 text-white font-bold py-2.5 transition-colors flex items-center justify-center gap-2"
          style={{
            backgroundColor: tokens.colors.accent,
            borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.3rem)`,
          }}
        >
          {isHydrating && <Loader2 size={16} className="animate-spin" />}
          Entrar
        </button>
      </form>

      {branding.loaderAssetUrl && isHydrating && (
        <div
          className={`mt-5 rounded-xl p-3 text-center ${
            isCenteredImageLayout ? 'border border-white/15 bg-black/20' : 'border border-slate-200 bg-slate-50'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={branding.loaderAssetUrl} alt={branding.loaderText} className="mx-auto h-12 w-auto" />
          {visibility.loaderText && hasText(branding.loaderText) && (
            <p className={`text-xs mt-2 ${isCenteredImageLayout ? 'text-white/75' : 'text-slate-600'}`}>
              {branding.loaderText}
            </p>
          )}
        </div>
      )}

      {visibility.loginSupportMessage && hasText(branding.loginSupportMessage) && (
        <p
          className={`text-center text-xs mt-4 ${
            isCenteredImageLayout ? 'text-white/70' : 'text-slate-500'
          }`}
        >
          {branding.loginSupportMessage}
        </p>
      )}
    </section>
  );

  if (isCenteredImageLayout) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 md:p-8"
        style={centeredPageBackgroundStyle}
      >
        {formContainer}
      </div>
    );
  }

  const imagePanel = (
    <aside
      className="hidden lg:flex h-full min-h-[100vh] items-end"
      style={splitImagePanelStyle}
    >
      <div className="w-full p-12 text-white">
        {visibility.platformName && hasText(branding.platformName) && (
          <div className="flex items-center gap-3 mb-5">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt={branding.platformName}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <Gem size={36} style={{ color: tokens.colors.accent }} />
            )}
            <p className="text-3xl font-bold">{branding.platformName}</p>
          </div>
        )}

        {visibility.loginHeadline && hasText(branding.loginHeadline) && (
          <p className="text-5xl leading-tight font-bold max-w-2xl">{branding.loginHeadline}</p>
        )}

        {visibility.welcomeMessage && hasText(branding.welcomeMessage) && (
          <p className="text-white/90 text-xl mt-4 max-w-2xl">{branding.welcomeMessage}</p>
        )}

        {visibility.loginSupportMessage && hasText(branding.loginSupportMessage) && (
          <p className="text-white/80 text-sm mt-6 max-w-2xl">{branding.loginSupportMessage}</p>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        {isImageLeftLayout && imagePanel}

        <div className="flex items-center justify-center bg-white p-6 md:p-10">
          {formContainer}
        </div>

        {isImageRightLayout && imagePanel}
      </div>
    </div>
  );
}
