'use client';

import React from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { Gem, Loader2, Lock, Mail } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useBranding } from '@/context/BrandingContext';
import { useUser } from '@/context/UserContext';
import type { SessionUser } from '@/context/UserContext';
import { consumeSessionTimeoutNotice } from '@/lib/session-timeout-client';
import { RegisterForm } from './RegisterForm';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; width: number; locale: string },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

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

function normalizeCandidates(values: string[]): string[] {
  const deduped = new Set<string>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    deduped.add(normalized);
    if (deduped.size >= 20) break;
  }
  return [...deduped];
}

function pickRandom(values: string[], fallback = ''): string {
  if (values.length === 0) return fallback;
  const index = Math.floor(Math.random() * values.length);
  return values[index] ?? fallback;
}

type Mode = 'login' | 'register';

interface GooglePrefill {
  email: string;
  firstName: string;
  lastName: string;
  credential: string;
}

export default function LoginPage() {
  const { login, isHydrating, applySession } = useUser();
  const { branding, tokens, isLoading: isBrandingLoading } = useBranding();
  const { alert } = useAppDialog();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mode, setMode] = React.useState<Mode>('login');
  const [googlePrefill, setGooglePrefill] = React.useState<GooglePrefill | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const googleButtonRef = React.useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  const visibility = tokens.text.visibility;
  const isImageRightLayout = branding.loginLayout === 'image_right';
  const isImageLeftLayout = branding.loginLayout === 'image_left';
  const isCenteredImageLayout = branding.loginLayout === 'centered_image';
  const loginBackgroundCandidates = React.useMemo(
    () =>
      normalizeCandidates([
        ...(branding.loginBackgroundImageUrls ?? []),
        branding.loginBackgroundImageUrl,
      ]),
    [branding.loginBackgroundImageUrl, branding.loginBackgroundImageUrls],
  );
  const loginImageCandidates = React.useMemo(
    () =>
      normalizeCandidates([
        ...(branding.loginImageUrls ?? []),
        ...loginBackgroundCandidates,
      ]),
    [branding.loginImageUrls, loginBackgroundCandidates],
  );
  const imageWelcomeMessageCandidates = React.useMemo(
    () =>
      normalizeCandidates([
        ...(branding.imageWelcomeMessages ?? []),
        branding.imageWelcomeMessage,
      ]),
    [branding.imageWelcomeMessage, branding.imageWelcomeMessages],
  );

  const dynamicLoginBackgroundImageUrl = React.useMemo(
    () => pickRandom(loginBackgroundCandidates, branding.loginBackgroundImageUrl),
    [branding.loginBackgroundImageUrl, loginBackgroundCandidates],
  );
  const dynamicLoginImageUrl = React.useMemo(
    () => pickRandom(loginImageCandidates, dynamicLoginBackgroundImageUrl),
    [dynamicLoginBackgroundImageUrl, loginImageCandidates],
  );
  const dynamicImageWelcomeMessage = React.useMemo(
    () => pickRandom(imageWelcomeMessageCandidates, branding.imageWelcomeMessage),
    [branding.imageWelcomeMessage, imageWelcomeMessageCandidates],
  );

  React.useEffect(() => {
    const notice = consumeSessionTimeoutNotice();
    if (!notice) return;

    void alert({
      title: 'Sesión expirada',
      message: notice,
      tone: 'error',
    });
    router.replace('/acceso');
  }, [alert, router]);

  const initGoogleButton = React.useCallback(() => {
    if (!googleClientId || !window.google?.accounts?.id || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response: { credential: string }) => {
        setIsGoogleLoading(true);
        try {
          const res = await fetch('/api/v1/auth/google', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential }),
          });

          const data = (await res.json()) as {
            ok: boolean;
            action?: 'login' | 'register';
            error?: string;
            email?: string;
            firstName?: string;
            lastName?: string;
            user?: SessionUser;
          };

          if (!data.ok) {
            await alert({
              title: 'Error con Google',
              message: data.error ?? 'No fue posible autenticar con Google',
              tone: 'error',
            });
            return;
          }

          if (data.action === 'login' && data.user) {
            await applySession(data.user);
            router.push('/dashboard');
          } else if (data.action === 'register') {
            setGooglePrefill({
              email: data.email ?? '',
              firstName: data.firstName ?? '',
              lastName: data.lastName ?? '',
              credential: response.credential,
            });
            setMode('register');
          }
        } catch {
          await alert({
            title: 'Error',
            message: 'Error de conexión. Intenta de nuevo.',
            tone: 'error',
          });
        } finally {
          setIsGoogleLoading(false);
        }
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: isCenteredImageLayout ? 'filled_black' : 'outline',
      size: 'large',
      width: 400,
      locale: 'es',
    });
  }, [googleClientId, isCenteredImageLayout, alert, applySession, router]);

  React.useEffect(() => {
    if (mode === 'login' && googleButtonRef.current && window.google?.accounts?.id) {
      initGoogleButton();
    }
  }, [mode, initGoogleButton]);

  const hasLoginBackgroundImage = hasText(dynamicLoginBackgroundImageUrl);
  const hasLoginImage = hasText(dynamicLoginImageUrl);
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

  const handleRegisterSuccess = async (user: SessionUser) => {
    await applySession(user);
    router.push('/dashboard');
  };

  const handleRegisterError = async (message: string) => {
    await alert({ title: 'Error al registrarse', message, tone: 'error' });
  };

  if (isBrandingLoading) {
    const loaderText = branding.loaderText.trim();
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          {branding.loaderAssetUrl.trim().length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.loaderAssetUrl}
              alt={loaderText || 'Cargando'}
              className="mx-auto h-14 w-auto"
            />
          ) : (
            <Loader2
              size={42}
              className="mx-auto animate-spin"
              style={{ color: tokens.colors.accent }}
            />
          )}

          {tokens.text.visibility.loaderText && loaderText.length > 0 && (
            <p className="mt-3 text-sm text-slate-600">{loaderText}</p>
          )}
        </div>
      </div>
    );
  }

  const splitImagePanelStyle: React.CSSProperties = hasLoginImage
    ? {
        backgroundImage: `linear-gradient(0deg, ${overlayColor}, ${overlayColor}), url("${dynamicLoginImageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage: `linear-gradient(120deg, color-mix(in srgb, ${tokens.colors.primary} 86%, black), color-mix(in srgb, ${tokens.colors.secondary} 78%, black))`,
      };

  const centeredPageBackgroundStyle: React.CSSProperties = hasLoginBackgroundImage
    ? {
        backgroundImage: `linear-gradient(0deg, ${overlayColor}, ${overlayColor}), url("${dynamicLoginBackgroundImageUrl}")`,
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

  const labelClassName = `text-xs font-semibold tracking-wide ${
    isCenteredImageLayout ? 'text-white/75' : 'text-slate-600'
  }`;

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

  const styleProps = {
    isCenteredImageLayout,
    inputClassName,
    fieldWrapperClassName,
    labelClassName,
    accentColor: tokens.colors.accent,
    borderRadiusRem: tokens.shape.borderRadiusRem,
  };

  const googleButton = googleClientId ? (
    <div className="mt-4">
      {isGoogleLoading ? (
        <div className="flex items-center justify-center gap-2 py-2.5">
          <Loader2 size={16} className={`animate-spin ${isCenteredImageLayout ? 'text-white/70' : 'text-slate-500'}`} />
          <span className={`text-sm ${isCenteredImageLayout ? 'text-white/70' : 'text-slate-500'}`}>
            Verificando con Google...
          </span>
        </div>
      ) : (
        <div ref={googleButtonRef} className="flex justify-center" />
      )}
      <div className={`flex items-center gap-3 mt-4 mb-1 ${isCenteredImageLayout ? 'text-white/30' : 'text-slate-300'}`}>
        <div className="flex-1 h-px bg-current" />
        <span className={`text-xs ${isCenteredImageLayout ? 'text-white/45' : 'text-slate-400'}`}>
          o ingresa con tu correo
        </span>
        <div className="flex-1 h-px bg-current" />
      </div>
    </div>
  ) : null;

  const formContainer = (
    <section className={loginCardClassName} style={loginCardStyle}>
      {mode === 'register' ? (
        <>
          <div className="flex justify-center mb-4">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt={branding.platformName}
                className="w-10 h-10 rounded-2xl object-cover"
              />
            ) : (
              <Gem className="w-10 h-10" style={{ color: tokens.colors.accent }} />
            )}
          </div>
          <RegisterForm
            {...styleProps}
            onBack={() => {
              setMode('login');
              setGooglePrefill(null);
            }}
            onSuccess={handleRegisterSuccess}
            onError={handleRegisterError}
            googlePrefill={googlePrefill}
          />
        </>
      ) : (
        <>
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

          {googleButton}

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <label className="block">
              <span className={labelClassName}>Correo</span>
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
              <span className={labelClassName}>Contraseña</span>
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
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={branding.loaderAssetUrl}
                alt={branding.loaderText}
                className="mx-auto mt-5 h-12 w-auto"
              />
              {visibility.loaderText && hasText(branding.loaderText) && (
                <p
                  className={`text-center text-xs mt-2 ${
                    isCenteredImageLayout ? 'text-white/75' : 'text-slate-600'
                  }`}
                >
                  {branding.loaderText}
                </p>
              )}
            </>
          )}

          <p className={`text-center text-sm mt-5 ${isCenteredImageLayout ? 'text-white/65' : 'text-slate-500'}`}>
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`font-semibold underline underline-offset-2 ${
                isCenteredImageLayout ? 'text-white/90 hover:text-white' : 'text-slate-800 hover:text-slate-900'
              } transition-colors`}
            >
              Crear cuenta
            </button>
          </p>

          {visibility.loginSupportMessage && hasText(branding.loginSupportMessage) && (
            <p
              className={`text-center text-xs mt-3 ${
                isCenteredImageLayout ? 'text-white/70' : 'text-slate-500'
              }`}
            >
              {branding.loginSupportMessage}
            </p>
          )}
        </>
      )}
    </section>
  );

  return (
    <>
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogleButton}
        />
      )}

      {isCenteredImageLayout ? (
        <div
          className="min-h-screen flex items-center justify-center p-4 md:p-8"
          style={centeredPageBackgroundStyle}
        >
          {formContainer}
        </div>
      ) : (
        <div className="min-h-screen bg-slate-100">
          <div className="grid min-h-screen lg:grid-cols-2">
            {isImageLeftLayout && (
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

                  {visibility.imageLoginHeadline && hasText(branding.imageLoginHeadline) && (
                    <p className="text-5xl leading-tight font-bold max-w-2xl">
                      {branding.imageLoginHeadline}
                    </p>
                  )}

                  {visibility.imageWelcomeMessage && hasText(dynamicImageWelcomeMessage) && (
                    <p className="text-white/90 text-xl mt-4 max-w-2xl">
                      {dynamicImageWelcomeMessage}
                    </p>
                  )}

                  {visibility.imageLoginSupportMessage &&
                    hasText(branding.imageLoginSupportMessage) && (
                      <p className="text-white/80 text-sm mt-6 max-w-2xl">
                        {branding.imageLoginSupportMessage}
                      </p>
                    )}
                </div>
              </aside>
            )}

            <div className="flex items-center justify-center bg-white p-6 md:p-10">
              {formContainer}
            </div>

            {isImageRightLayout && (
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

                  {visibility.imageLoginHeadline && hasText(branding.imageLoginHeadline) && (
                    <p className="text-5xl leading-tight font-bold max-w-2xl">
                      {branding.imageLoginHeadline}
                    </p>
                  )}

                  {visibility.imageWelcomeMessage && hasText(dynamicImageWelcomeMessage) && (
                    <p className="text-white/90 text-xl mt-4 max-w-2xl">
                      {dynamicImageWelcomeMessage}
                    </p>
                  )}

                  {visibility.imageLoginSupportMessage &&
                    hasText(branding.imageLoginSupportMessage) && (
                      <p className="text-white/80 text-sm mt-6 max-w-2xl">
                        {branding.imageLoginSupportMessage}
                      </p>
                    )}
                </div>
              </aside>
            )}
          </div>
        </div>
      )}
    </>
  );
}
