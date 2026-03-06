'use client';

import React from 'react';
import { Gem, Lock, Mail, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useBranding } from '@/context/BrandingContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';

export default function LoginPage() {
  const { login, isHydrating } = useUser();
  const { branding, tokens } = useBranding();
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

  const isSplitLayout = branding.loginLayout === 'split';
  const isCenteredLayout = branding.loginLayout === 'centered';
  const isMinimalLayout = branding.loginLayout === 'minimal';
  const hasCustomBackground = branding.loginBackgroundImageUrl.trim().length > 0;
  const containerMaxWidth = isSplitLayout ? 'min(1180px, 100%)' : 'min(900px, 100%)';
  const cardMaxWidth = isMinimalLayout ? '440px' : isCenteredLayout ? '620px' : '560px';
  const loginBackground = hasCustomBackground
    ? `linear-gradient(115deg, color-mix(in srgb, var(--brand-primary) 86%, black), color-mix(in srgb, var(--brand-secondary) 72%, #020617)), url("${branding.loginBackgroundImageUrl}")`
    : 'radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--brand-accent) 20%, transparent), transparent 40%), linear-gradient(120deg, color-mix(in srgb, var(--brand-primary) 94%, black), color-mix(in srgb, var(--brand-secondary) 62%, #020617))';

  return (
    <div
      className="min-h-screen p-4 md:p-8 flex items-stretch"
      style={{
        backgroundImage: loginBackground,
        backgroundSize: hasCustomBackground ? 'cover' : undefined,
        backgroundPosition: hasCustomBackground ? 'center' : undefined,
      }}
    >
      <div
        className={`w-full mx-auto grid gap-6 ${isSplitLayout ? 'lg:grid-cols-2' : 'grid-cols-1'} items-center`}
        style={{ maxWidth: containerMaxWidth }}
      >
        {isSplitLayout && (
          <aside className="hidden lg:flex flex-col justify-between p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl text-white">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {branding.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={branding.logoUrl} alt={branding.platformName} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <Gem size={36} style={{ color: tokens.colors.accent }} />
                )}
                <h1 className="text-2xl font-bold">{branding.platformName}</h1>
              </div>
              <p className="text-white max-w-md text-2xl font-semibold leading-tight">{branding.loginHeadline}</p>
              <p className="text-white/80 max-w-md text-lg leading-relaxed mt-3">{branding.welcomeMessage}</p>
            </div>

            <div className="text-sm text-white/70">
              <p>Zona horaria institucional: {branding.institutionTimezone}</p>
              <p className="mt-1">{branding.loginSupportMessage}</p>
            </div>
          </aside>
        )}

        <section
          className="w-full border border-white/10 shadow-2xl backdrop-blur-xl p-6 md:p-8"
          style={{
            borderRadius: `calc(${tokens.shape.borderRadiusRem}rem + 0.9rem)`,
            backgroundColor: 'color-mix(in srgb, white 10%, var(--brand-primary))',
            maxWidth: cardMaxWidth,
            justifySelf: 'center',
          }}
        >
          {isCenteredLayout && (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-center mb-4">
              <p className="text-white text-lg md:text-xl font-semibold">{branding.loginHeadline}</p>
              <p className="text-white/70 text-sm mt-1">{branding.loginSupportMessage}</p>
            </div>
          )}

          {isMinimalLayout && (
            <p className="text-center text-sm text-white/70 mb-4">{branding.loginHeadline}</p>
          )}

          <div className="flex justify-center mb-4">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoUrl} alt={branding.platformName} className="w-14 h-14 rounded-2xl object-cover" />
            ) : (
              <Gem className="w-14 h-14" style={{ color: tokens.colors.accent }} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-center mb-2 text-white">{branding.platformName}</h1>
          <p className="text-white/70 text-center text-sm mb-6">{branding.welcomeMessage}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-white/70 font-semibold tracking-wide">Correo</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-3 py-2 focus-within:border-white/40">
                <Mail size={16} className="text-white/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@empresa.com"
                  className="bg-transparent outline-none w-full text-sm text-white placeholder:text-white/40"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs text-white/70 font-semibold tracking-wide">Contraseña</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/20 bg-black/20 px-3 py-2 focus-within:border-white/40">
                <Lock size={16} className="text-white/50" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent outline-none w-full text-sm text-white placeholder:text-white/40"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isHydrating}
              className="w-full mt-2 text-white font-bold py-2.5 transition-colors flex items-center justify-center gap-2"
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
            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branding.loaderAssetUrl} alt={branding.loaderText} className="mx-auto h-12 w-auto" />
              <p className="text-xs text-white/70 mt-2">{branding.loaderText}</p>
            </div>
          )}

          {!isSplitLayout && (
            <p className="text-center text-xs text-white/60 mt-4">{branding.loginSupportMessage}</p>
          )}
        </section>
      </div>
    </div>
  );
}
