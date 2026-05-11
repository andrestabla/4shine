import Link from 'next/link';
import type { ReactNode } from 'react';

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/metodologia', label: 'Metodología' },
  { href: '/descubrimiento', label: 'Descubrimiento' },
  { href: '/planes-precios', label: 'Planes y precios' },
  { href: '/afiliados', label: 'Afiliados' },
];

export function MarketingShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f4f2fa] text-[#27163a]">
      <header className="sticky top-0 z-30 border-b border-[#d7cdec] bg-[#f4f2fa]/90 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[1240px] items-center justify-between px-6 md:px-10 lg:px-14">
          <Link href="/" className="inline-flex items-center gap-2.5 text-[#2d1845]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/workbooks-v2/diamond.svg"
              alt="Logo 4Shine"
              className="h-8 w-8 object-contain"
            />
            <span className="text-2xl font-black tracking-tight">4Shine</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-[#4e356a] md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[#2d1845]">{item.label}</Link>
            ))}
          </nav>
          <Link href="/acceso" className="rounded-full bg-[#2e1b49] px-5 py-2 text-sm font-bold text-white hover:bg-[#402662]">Iniciar sesión</Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1240px] px-6 pb-8 pt-14 md:px-10 lg:px-14">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">Plataforma 4Shine</p>
        <h1 className="mt-3 max-w-[18ch] text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-[68ch] text-base text-[#5e4b78] md:text-lg">{subtitle}</p>
      </section>

      {children}

      <footer className="mt-18 border-t border-[#dacfed] bg-white">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
          <div>
            <p className="text-xl font-black text-[#2e1b48]">4Shine</p>
            <p className="text-sm text-[#68557f]">Liderazgo con método, consciencia e impacto.</p>
          </div>
          <div className="flex gap-5 text-sm font-semibold text-[#5f4a7a]">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-[#2e1b48]">{item.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
