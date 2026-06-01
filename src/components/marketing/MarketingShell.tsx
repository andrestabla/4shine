import Link from 'next/link';
import type { ReactNode } from 'react';
import { getSitePages } from '@/lib/site-settings';
import { loadServerBranding } from '@/lib/server-branding';

type NavItem = {
  href: string;
  label: string;
  pageKey: string;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/metodologia', label: 'Metodología', pageKey: 'metodologia' },
  { href: '/descubrimiento', label: 'Descubrimiento', pageKey: 'descubrimiento' },
  { href: '/planes-precios', label: 'Planes y precios', pageKey: 'planes_precios' },
  { href: '/afiliados', label: 'Afiliados', pageKey: 'afiliados' },
];

export async function MarketingShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const [enabledPages, branding] = await Promise.all([
    getSitePages(),
    loadServerBranding(),
  ]);

  const navItems = ALL_NAV_ITEMS.filter((item) => enabledPages[item.pageKey] !== false);
  const platformName = branding.settings.platformName?.trim() || '4Shine';
  const logoUrl = branding.settings.logoUrl?.trim() || '/branding/4shine-logo-mixto.png';
  const showPlatformName = branding.settings.showPlatformName !== false;
  const kickerLabel = showPlatformName ? `Plataforma ${platformName}` : 'Plataforma';

  return (
    <main
      className="min-h-screen"
      style={{
        background: 'color-mix(in srgb, var(--brand-primary) 6%, white)',
        color: 'color-mix(in srgb, var(--brand-primary) 88%, black)',
      }}
    >
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{
          background: 'color-mix(in srgb, var(--brand-primary) 6%, white 92%)',
          borderColor: 'color-mix(in srgb, var(--brand-primary) 16%, transparent)',
        }}
      >
        <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between px-6 md:px-10 lg:px-14">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
            style={{ color: 'var(--brand-primary)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
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
              style={{ color: 'color-mix(in srgb, var(--brand-primary) 75%, black)' }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition hover:opacity-70"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          <Link
            href="/acceso"
            className="px-5 py-2 text-sm font-bold transition hover:opacity-90"
            style={{
              background: 'var(--brand-accent)',
              color: 'var(--brand-primary)',
              borderRadius: 'calc(var(--brand-radius-rem) * 1rem + 0.5rem)',
            }}
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1240px] px-6 pb-8 pt-14 md:px-10 lg:px-14">
        <p
          className="text-xs font-black uppercase tracking-[0.3em]"
          style={{ color: 'var(--brand-accent)' }}
        >
          {kickerLabel}
        </p>
        <h1
          className="mt-3 max-w-[18ch] text-5xl font-black leading-[0.95] tracking-tight md:text-6xl"
          style={{ color: 'var(--brand-primary)' }}
        >
          {title}
        </h1>
        <p
          className="mt-5 max-w-[68ch] text-base md:text-lg"
          style={{ color: 'color-mix(in srgb, var(--brand-primary) 70%, black)' }}
        >
          {subtitle}
        </p>
      </section>

      {children}

      <footer
        className="mt-18 border-t bg-white"
        style={{ borderColor: 'color-mix(in srgb, var(--brand-primary) 14%, transparent)' }}
      >
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={`Logo ${platformName}`} className="h-8 object-contain" />
            <div>
              {showPlatformName && (
                <p className="text-lg font-black" style={{ color: 'var(--brand-primary)' }}>
                  {platformName}
                </p>
              )}
              <p className="text-sm" style={{ color: 'color-mix(in srgb, var(--brand-primary) 60%, black)' }}>
                Liderazgo con método, consciencia e impacto.
              </p>
            </div>
          </div>
          {navItems.length > 0 && (
            <div
              className="flex gap-5 text-sm font-semibold"
              style={{ color: 'color-mix(in srgb, var(--brand-primary) 70%, black)' }}
            >
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="hover:opacity-70">
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
