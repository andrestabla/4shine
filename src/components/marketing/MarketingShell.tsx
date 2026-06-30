import Link from 'next/link';
import type { ReactNode } from 'react';
import { listPublicNavItems } from '@/lib/site-pages';
import { loadServerBranding } from '@/lib/server-branding';
import { loadPublicAssistant } from '@/lib/server-public-assistant';
import { MarketingMobileNav } from './MarketingMobileNav';
import { PublicAssistantWidget } from './PublicAssistantWidget';
import PopupRuntime from '@/components/popups/PopupRuntime';

export async function MarketingShell({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  const [navItems, branding, assistant] = await Promise.all([
    listPublicNavItems(),
    loadServerBranding(),
    loadPublicAssistant(),
  ]);
  const platformName = branding.settings.platformName?.trim() || '4Shine';
  const logoDarkUrl =
    branding.settings.logoDarkUrl?.trim() ||
    branding.settings.logoUrl?.trim() ||
    '/branding/4shine-logo-amarillo.png';
  const showPlatformName = branding.settings.showPlatformName !== false;
  const kickerLabel = showPlatformName ? `Plataforma ${platformName}` : 'Plataforma';

  return (
    <main
      className="min-h-screen text-white"
      style={{ background: 'var(--brand-dark)' }}
    >
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{
          background: 'color-mix(in srgb, var(--brand-dark) 88%, transparent)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between px-6 md:px-10 lg:px-14">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDarkUrl}
              alt={`Logo ${platformName}`}
              className="h-10 object-contain"
            />
            {showPlatformName && (
              <span className="text-xl font-black tracking-tight">{platformName}</span>
            )}
          </Link>
          {navItems.length > 0 && (
            <nav
              className="hidden items-center gap-7 text-sm font-bold md:flex"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-2">
            <Link
              href="/acceso"
              className="hidden px-5 py-2 text-sm font-bold transition hover:opacity-90 md:inline-block"
              style={{
                background: 'var(--brand-accent)',
                color: 'var(--brand-on-accent)',
                borderRadius: 'calc(var(--brand-radius-rem) * 1rem + 0.5rem)',
              }}
            >
              Iniciar sesión
            </Link>
            <MarketingMobileNav items={navItems} />
          </div>
        </div>
      </header>

      {title && (
        <section className="mx-auto w-full max-w-[1240px] px-6 pb-8 pt-14 md:px-10 lg:px-14">
          <p
            className="text-xs font-black uppercase tracking-[0.3em]"
            style={{ color: 'var(--brand-accent)' }}
          >
            {kickerLabel}
          </p>
          <h1 className="mt-3 max-w-[18ch] text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-[68ch] text-base text-white/70 md:text-lg">
              {subtitle}
            </p>
          )}
        </section>
      )}

      {children}

      <footer
        className="mt-18 border-t"
        style={{
          borderColor: 'rgba(255,255,255,0.08)',
          background: 'var(--brand-darker)',
        }}
      >
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoDarkUrl} alt={`Logo ${platformName}`} className="h-8 object-contain" />
            <div>
              {showPlatformName && (
                <p className="text-lg font-black text-white">{platformName}</p>
              )}
              <p className="text-sm text-white/60">
                Liderazgo con método, consciencia e impacto.
              </p>
            </div>
          </div>
          {navItems.length > 0 && (
            <div className="flex gap-5 text-sm font-semibold text-white/70">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </footer>

      <PopupRuntime />
      <PublicAssistantWidget config={assistant} />
    </main>
  );
}
