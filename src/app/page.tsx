import Link from 'next/link';
import { Compass, MessageSquare, TrendingUp, Globe, Map, BarChart2, Users } from 'lucide-react';
import { loadServerBranding } from '@/lib/server-branding';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { BlockRenderer } from '@/components/site-builder/BlockRenderer';
import { getPublicPageByKey, listPublicNavItems } from '@/lib/site-pages';

export const dynamic = 'force-dynamic';

type PillarKey = 'within' | 'out' | 'up' | 'beyond';

const PILLAR_ICONS = {
  within: Compass,
  out: MessageSquare,
  up: TrendingUp,
  beyond: Globe,
} satisfies Record<PillarKey, React.ElementType>;

const pillars: Array<{
  key: PillarKey;
  title: string;
  gradient: string;
  iconColor: string;
  description: string;
  detail: string;
}> = [
  {
    key: 'within',
    title: 'Shine Within',
    gradient: 'linear-gradient(135deg,#5b2d8a,#7c3aad)',
    iconColor: '#9b72d0',
    description: 'Autoliderazgo, identidad y claridad personal para decidir con conciencia.',
    detail: 'Descubres quién eres como líder, qué valores te mueven y cómo tomar decisiones profundamente alineadas con tu propósito.',
  },
  {
    key: 'out',
    title: 'Shine Out',
    gradient: 'linear-gradient(135deg,#1e5fa8,#2d7dd2)',
    iconColor: '#5a9fd4',
    description: 'Comunicación estratégica, presencia ejecutiva y narrativa de impacto.',
    detail: 'Desarrollas la capacidad de articular ideas con poder, influir con autenticidad y proyectar una presencia ejecutiva real.',
  },
  {
    key: 'up',
    title: 'Shine Up',
    gradient: 'linear-gradient(135deg,#0e7a5a,#15a37a)',
    iconColor: '#3db88a',
    description: 'Pensamiento estratégico, influencia y toma de decisiones en contextos complejos.',
    detail: 'Elevas tu pensamiento, navegas la ambigüedad y ejerces influencia sin necesitar autoridad directa.',
  },
  {
    key: 'beyond',
    title: 'Shine Beyond',
    gradient: 'linear-gradient(135deg,#a8420e,#d45a0f)',
    iconColor: '#d4793a',
    description: 'Legado, expansión y liderazgo que transforma equipos y ecosistemas.',
    detail: 'Construyes equipos de alto desempeño, articulas un legado de impacto y multiplicas tu capacidad de transformación.',
  },
];

const stories = [
  {
    initial: 'P',
    color: '#5b2d8a',
    name: 'Pablo R.',
    role: 'Director de Tecnología · LATAM',
    text: '"En 12 semanas convertí mi visión en una ruta concreta. Mi equipo mejoró el foco y la coordinación de una manera que no creí posible antes del programa."',
  },
  {
    initial: 'C',
    color: '#1e5fa8',
    name: 'Carolina M.',
    role: 'Directora Académica',
    text: '"4Shine me enseñó a integrar estrategia con bienestar. Tomo decisiones más consistentes y lidero con claridad en contextos de alta incertidumbre."',
  },
  {
    initial: 'A',
    color: '#0e7a5a',
    name: 'Andrés V.',
    role: 'Gerente Comercial',
    text: '"Pasé de reaccionar a priorizar con método. Mi comunicación ejecutiva mejoró y crecí en influencia interna sin perder mi autenticidad como líder."',
  },
];

const plans = [
  {
    name: 'Diagnóstico Ejecutivo',
    label: 'Primer paso',
    price: '50',
    currency: 'USD',
    description: 'Evalúa tu nivel en los 4 pilares y obtén un informe ejecutivo personalizado con tus fortalezas, brechas y próximos pasos.',
    features: [
      'Evaluación de los 4 pilares de liderazgo',
      'Informe ejecutivo personalizado',
      'Identificación de brechas críticas',
      'Acceso permanente a tus resultados',
    ],
    cta: 'Comprar diagnóstico',
    href: '/acceso?plan=diagnostico',
    highlighted: false,
  },
  {
    name: 'Programas de liderazgo',
    label: 'Recomendado',
    price: 'desde 1.000',
    currency: 'USD',
    description: 'Trayectoria de 24 semanas con Adviser asignado, workbooks exclusivos, diagnóstico, comunidad y certificación. 4 niveles disponibles.',
    features: [
      'Junior · Reinvéntate · Marca Ejecutiva · Executive',
      'De 5 a 10 sesiones individuales con Adviser',
      'Workbooks de metodología 4Shine',
      'Networking, workshops y convocatorias',
      'Certificación 4Shine Leadership',
    ],
    cta: 'Ver todos los programas',
    href: '/planes-precios',
    highlighted: true,
  },
  {
    name: 'Círculo de líderes',
    label: 'Comunidad',
    price: '57',
    currency: 'USD / mes',
    description: 'Sesiones en vivo grupales semanales, cursos exclusivos, comunidad de práctica continua, convocatorias y workshops.',
    features: [
      '1 sesión en vivo grupal por semana',
      'Todos los cursos y material exclusivo',
      'Comunidad y networking',
      'Convocatorias y workshops',
    ],
    cta: 'Unirme al Círculo',
    href: '/planes-precios',
    highlighted: false,
  },
];

const advisers = [
  {
    initial: 'M',
    color: '#5b2d8a',
    name: 'María Torres',
    specialty: 'Liderazgo Estratégico',
    years: '15 años de experiencia',
  },
  {
    initial: 'J',
    color: '#1e5fa8',
    name: 'Jorge Espinosa',
    specialty: 'Comunicación Ejecutiva',
    years: '12 años de experiencia',
  },
  {
    initial: 'L',
    color: '#0e7a5a',
    name: 'Laura Méndez',
    specialty: 'Transformación Organizacional',
    years: '18 años de experiencia',
  },
];

const metrics = [
  { value: '+1.000', label: 'Líderes activos' },
  { value: '6', label: 'Meses de programa' },
  { value: '4', label: 'Pilares de liderazgo' },
  { value: '+25', label: 'Advisers certificados' },
];

const platformFeatures = [
  {
    Icon: Map,
    title: 'Trayectoria estructurada',
    text: 'Ruta clara semana a semana con hitos y entregables concretos.',
  },
  {
    Icon: BarChart2,
    title: 'Diagnóstico profundo',
    text: 'Mide tu punto de partida en los 4 pilares con herramientas validadas.',
  },
  {
    Icon: Users,
    title: 'Comunidad activa',
    text: 'Comparte el camino con líderes que tienen el mismo nivel de ambición.',
  },
];

export default async function HomeMarketingPage() {
  const [navItems, branding, builderPage] = await Promise.all([
    listPublicNavItems(),
    loadServerBranding(),
    getPublicPageByKey('home'),
  ]);

  // Contenido gestionado desde el site builder (Administración → Site)
  if (builderPage?.useBuilder && builderPage.sections.length > 0) {
    return (
      <MarketingShell>
        <BlockRenderer sections={builderPage.sections} />
      </MarketingShell>
    );
  }

  const platformName = branding.settings.platformName?.trim() || '4Shine';
  const showPlatformName = branding.settings.showPlatformName !== false;
  const logoUrl = branding.settings.logoUrl?.trim() || '/branding/4shine-logo-mixto.png';
  const logoOnDarkUrl =
    branding.settings.logoDarkUrl?.trim() ||
    branding.settings.logoUrl?.trim() ||
    '/branding/4shine-logo-amarillo.png';
  const currentYear = 2026;

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--brand-surface)', color: 'var(--brand-ink)' }}
    >

      {/* ── 1. HERO ── */}
      <section
        className="relative overflow-hidden border-b text-white"
        style={{
          background: 'var(--brand-dark)',
          borderColor: 'var(--brand-border)',
        }}
      >
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay loop muted playsInline preload="metadata" aria-hidden="true"
        >
          <source src="https://liderazgoestrategico.s3.us-east-1.amazonaws.com/4shine/International_Team_1920x1080.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(108deg, color-mix(in srgb, var(--brand-primary) 92%, black) 10%, color-mix(in srgb, var(--brand-primary) 80%, black) 55%, color-mix(in srgb, var(--brand-secondary) 74%, black) 100%)',
          }}
        />

        <div className="relative mx-auto flex max-w-[1240px] flex-col px-6 pb-20 pt-6 md:px-10 lg:px-14">
          <header className="mb-14 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoOnDarkUrl} alt={`Logo ${platformName}`} className="h-10 object-contain" />
              {showPlatformName && (
                <span className="text-xl font-black tracking-tight">{platformName}</span>
              )}
            </Link>
            {navItems.length > 0 && (
              <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition hover:opacity-80"
                    style={{ color: 'rgba(255,255,255,0.85)' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
            <Link
              href="/acceso"
              className="rounded-full px-5 py-2 text-sm font-extrabold transition hover:opacity-90"
              style={{
                background: 'var(--brand-accent)',
                color: 'var(--brand-on-accent)',
              }}
            >
              Ingresar
            </Link>
          </header>

          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p
                className="mb-5 text-xs font-bold uppercase tracking-[0.32em]"
                style={{ color: 'var(--brand-accent-soft)' }}
              >
                Plataforma de liderazgo
              </p>
              <h1 className="max-w-[14ch] text-5xl font-black leading-[0.94] tracking-tight md:text-6xl lg:text-7xl">
                Transforma tu liderazgo con método, mentoría y resultados medibles.
              </h1>
              <p className="mt-6 max-w-[54ch] text-base leading-relaxed text-white/85 md:text-lg">
                {platformName} existe para acelerar el desarrollo de líderes que necesitan elevar su impacto personal, profesional y estratégico con una ruta estructurada de 6 meses.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/metodologia"
                  className="rounded-full px-7 py-3 text-sm font-black transition hover:opacity-90"
                  style={{ background: 'white', color: 'var(--brand-primary)' }}
                >
                  Conocer metodología
                </Link>
                <Link
                  href="/planes-precios"
                  className="rounded-full border px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  style={{ borderColor: 'rgba(255,255,255,0.4)' }}
                >
                  Ver planes
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {pillars.map((p) => {
                const Icon = PILLAR_ICONS[p.key];
                return (
                  <article
                    key={p.title}
                    className="rounded-2xl border border-white/15 p-5 transition hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Icon size={20} color="rgba(255,255,255,0.7)" strokeWidth={1.6} />
                    <h2 className="mt-3 text-base font-extrabold">{p.title}</h2>
                    <p className="mt-1.5 text-sm leading-snug text-white/80">{p.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MÉTRICAS ── */}
      <section className="text-white" style={{ background: 'var(--brand-darker)' }}>
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 px-6 md:grid-cols-4 md:px-10 lg:px-14">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`flex flex-col items-center justify-center py-10 px-6 text-center ${i < metrics.length - 1 ? 'border-r border-white/10' : ''}`}
            >
              <span className="text-4xl font-black md:text-5xl" style={{ color: 'var(--brand-accent)' }}>{m.value}</span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. NUESTRO PROPÓSITO ── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1240px] items-center gap-16 px-6 py-20 md:px-10 lg:grid-cols-2 lg:px-14">
          <div>
            <h2
              className="max-w-[22ch] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl"
              style={{ color: 'var(--brand-primary)' }}
            >
              Para líderes que saben que hay más en ellos.
            </h2>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--brand-ink-soft)' }}>
              {platformName} nació porque el liderazgo real no se improvisa ni se aprende en un curso de 8 horas. Nació para quienes están dispuestos a trabajar con método, recibir acompañamiento de alto nivel y medir su transformación con honestidad.
            </p>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>
              No somos una plataforma de contenido. Somos una experiencia de desarrollo que combina herramientas, comunidad, diagnóstico y mentores especializados en un solo programa estructurado.
            </p>
            <Link
              href="/metodologia"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold transition hover:text-white"
              style={{
                borderColor: 'var(--brand-primary)',
                color: 'var(--brand-primary)',
              }}
            >
              Ver metodología completa
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://liderazgoestrategico.s3.us-east-1.amazonaws.com/recursos/IMG_4119.JPG"
              alt="Líderes en acción"
              className="h-full w-full object-cover"
              style={{ aspectRatio: '4/3' }}
            />
          </div>
        </div>
      </section>

      {/* ── 4. LA PLATAFORMA EN ACCIÓN ── */}
      <section style={{ background: 'var(--brand-surface)' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black tracking-tight md:text-5xl" style={{ color: 'var(--brand-primary)' }}>
              Conoce {platformName} por dentro.
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-base md:text-lg" style={{ color: 'var(--brand-ink-soft)' }}>
              Un espacio diseñado para que tu desarrollo no dependa del azar. Todo en un solo lugar: ruta, contenido, mentores y comunidad.
            </p>
          </div>

          <div
            className="relative mx-auto max-w-[900px] overflow-hidden rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.22)]"
            style={{ background: 'var(--brand-dark)' }}
          >
            <div className="aspect-video flex items-center justify-center">
              <div className="relative flex flex-col items-center gap-5">
                <button
                  type="button"
                  className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border transition hover:opacity-90"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--brand-accent) 50%, transparent)',
                    background: 'color-mix(in srgb, var(--brand-accent) 15%, transparent)',
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M9 6.5l12 6.5-12 6.5V6.5z" fill="var(--brand-accent)" />
                  </svg>
                </button>
                <p className="text-sm font-medium text-white/40">Conoce cómo funciona {platformName}</p>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-14 grid max-w-[900px] gap-10 sm:grid-cols-3">
            {platformFeatures.map(({ Icon, title, text }) => (
              <div key={title}>
                <Icon size={20} color="var(--brand-primary)" strokeWidth={1.6} />
                <h3 className="mt-4 text-base font-black" style={{ color: 'var(--brand-primary)' }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. LOS 4 PILARES ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <h2 className="max-w-[24ch] text-4xl font-black tracking-tight md:text-5xl" style={{ color: 'var(--brand-primary)' }}>
              Cuatro dimensiones. Una transformación completa.
            </h2>
            <Link
              href="/metodologia"
              className="whitespace-nowrap text-sm font-bold underline underline-offset-4 hover:opacity-70"
              style={{ color: 'var(--brand-primary)' }}
            >
              Ver metodología →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => {
              const Icon = PILLAR_ICONS[p.key];
              return (
                <article
                  key={p.title}
                  className="group relative overflow-hidden rounded-3xl p-7 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,0,0,0.22)]"
                  style={{ background: p.gradient }}
                >
                  <span className="pointer-events-none absolute -right-3 -top-5 select-none text-[8.5rem] font-black leading-none text-white/[0.07]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon size={26} color="rgba(255,255,255,0.88)" strokeWidth={1.8} />
                  <h3 className="mt-5 text-lg font-black tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-snug text-white/80">{p.description}</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/60">{p.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. EXPERIENCIAS DE TRANSFORMACIÓN ── */}
      <section className="text-white" style={{ background: 'var(--brand-dark)' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-[22ch] text-4xl font-black tracking-tight md:text-5xl">
              Resultados reales en líderes reales.
            </h2>
            <Link
              href="/advisers"
              className="whitespace-nowrap text-sm font-bold underline underline-offset-4 hover:opacity-80"
              style={{ color: 'var(--brand-accent)' }}
            >
              Conoce a nuestros Advisers →
            </Link>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {stories.map((s) => (
              <div key={s.name} className="border-l-2 pl-6" style={{ borderColor: s.color }}>
                <p className="text-[15px] leading-relaxed text-white/85">{s.text}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ background: s.color }}
                  >
                    {s.initial}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{s.name}</p>
                    <p className="text-xs text-white/60">{s.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. PLANES Y PRECIOS ── */}
      <section style={{ background: 'var(--brand-surface)' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'var(--brand-accent-strong)' }}>Inversión</p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl" style={{ color: 'var(--brand-primary)' }}>Elige tu punto de entrada.</h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-base" style={{ color: 'var(--brand-ink-soft)' }}>
              Diagnóstico individual, programa completo o comunidad semanal. Cada opción lleva al mismo destino: un liderazgo más claro, más potente.
            </p>
          </div>

          <div className="mx-auto grid max-w-[1100px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="relative flex flex-col overflow-hidden rounded-3xl border"
                style={
                  plan.highlighted
                    ? {
                        background: 'var(--brand-dark)',
                        color: 'white',
                        borderColor: 'var(--brand-primary)',
                        boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
                      }
                    : {
                        background: 'white',
                        color: 'var(--brand-ink)',
                        borderColor: 'var(--brand-border)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                      }
                }
              >
                {plan.highlighted && (
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: 'linear-gradient(to right, var(--brand-accent), var(--brand-accent-strong))' }}
                  />
                )}
                <div className="p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className="rounded-full px-3 py-0.5 text-[11px] font-black uppercase tracking-wider"
                        style={
                          plan.highlighted
                            ? {
                                background: 'color-mix(in srgb, var(--brand-accent) 20%, transparent)',
                                color: 'var(--brand-accent)',
                              }
                            : {
                                background: 'var(--brand-surface-strong)',
                                color: 'var(--brand-primary)',
                              }
                        }
                      >
                        {plan.label}
                      </span>
                      <h3 className="mt-3 text-xl font-black">{plan.name}</h3>
                    </div>
                    <div className="shrink-0 text-right">
                      {plan.currency && (
                        <span
                          className="text-xs font-bold"
                          style={{ color: plan.highlighted ? 'rgba(255,255,255,0.65)' : 'var(--brand-primary)' }}
                        >
                          {plan.currency}
                        </span>
                      )}
                      <p
                        className="text-3xl font-black leading-none"
                        style={{ color: plan.highlighted ? 'var(--brand-accent)' : 'var(--brand-primary)' }}
                      >
                        {plan.price}
                      </p>
                    </div>
                  </div>
                  <p
                    className="mt-4 text-sm leading-relaxed"
                    style={{ color: plan.highlighted ? 'rgba(255,255,255,0.8)' : 'var(--brand-ink-soft)' }}
                  >
                    {plan.description}
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <svg
                          className="mt-0.5 shrink-0"
                          style={{ color: plan.highlighted ? 'var(--brand-accent)' : 'var(--brand-primary)' }}
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{ color: plan.highlighted ? 'rgba(255,255,255,0.85)' : 'var(--brand-ink-soft)' }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto px-8 pb-8">
                  <Link
                    href={plan.href}
                    className="block w-full rounded-full py-3 text-center text-sm font-extrabold transition hover:opacity-90"
                    style={
                      plan.highlighted
                        ? { background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }
                        : {
                            border: '2px solid var(--brand-primary)',
                            color: 'var(--brand-primary)',
                            background: 'transparent',
                          }
                    }
                  >
                    {plan.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. NUESTROS ADVISERS ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="grid items-start gap-16 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2
                className="max-w-[20ch] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl"
                style={{ color: 'var(--brand-primary)' }}
              >
                Aprende de quienes ya lo han vivido.
              </h2>
              <p className="mt-6 max-w-[50ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--brand-ink-soft)' }}>
                Cada Adviser de {platformName} ha liderado equipos, tomado decisiones difíciles y transitado su propia transformación. No son coaches genéricos — son practicantes del liderazgo que acompañan desde la experiencia real.
              </p>
              <p className="mt-4 max-w-[50ch] text-sm leading-relaxed" style={{ color: 'var(--brand-ink-muted)' }}>
                Acompañan sesiones individuales y grupales, retroalimentan con profundidad y se convierten en aliados del desarrollo de cada líder en el programa.
              </p>
              <Link
                href="/advisers"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4 hover:opacity-70"
                style={{ color: 'var(--brand-primary)' }}
              >
                Conocer a todos los Advisers →
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {advisers.map((a) => (
                <div key={a.name} className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-black text-white"
                    style={{ background: a.color }}
                  >
                    {a.initial}
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: 'var(--brand-primary)' }}>{a.name}</p>
                    <p className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--brand-ink-soft)' }}>{a.specialty}</p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--brand-ink-muted)' }}>{a.years}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. CONVIÉRTETE EN AFILIADO ── */}
      <section style={{ background: 'var(--brand-dark)' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[720px] text-center">
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl">
              ¿Eres experto? Multiplica tu impacto como Adviser.
            </h2>
            <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-white/85 md:text-lg">
              Si tienes experiencia probada en liderazgo, desarrollo organizacional, comunicación ejecutiva u otras disciplinas de alto impacto, puedes prestar tus servicios en modalidad de afiliado dentro de la plataforma {platformName}.
            </p>
            <p className="mx-auto mt-4 max-w-[50ch] text-sm leading-relaxed text-white/65">
              Conectamos tu experiencia con líderes que están listos para crecer. Tú pones el expertise; nosotros ponemos la comunidad, la plataforma y el programa.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/advisers"
                className="rounded-full px-8 py-3.5 text-sm font-extrabold transition hover:opacity-90"
                style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
              >
                Postularme como Adviser
              </Link>
              <Link
                href="/metodologia"
                className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Conocer el programa primero
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-12">
              {[
                { value: 'Flexible', label: 'Define tu disponibilidad y modalidad' },
                { value: 'Comisión', label: 'Ingresos por sesión y por referidos' },
                { value: 'Comunidad', label: 'Acceso a red de líderes 4Shine' },
              ].map((b) => (
                <div key={b.value} className="text-center">
                  <p className="text-lg font-black" style={{ color: 'var(--brand-accent)' }}>{b.value}</p>
                  <p className="mt-1 text-xs text-white/65">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t bg-white" style={{ borderColor: 'var(--brand-border)' }}>
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
          <div>
            <Link href="/" className="inline-flex items-center gap-3" style={{ color: 'var(--brand-primary)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="h-8 object-contain" />
              {showPlatformName && (
                <span className="text-lg font-black tracking-tight">{platformName}</span>
              )}
            </Link>
            <p className="mt-2 text-sm" style={{ color: 'var(--brand-ink-muted)' }}>
              Liderazgo con método, consciencia e impacto.
            </p>
          </div>
          {navItems.length > 0 && (
            <nav className="flex flex-wrap gap-6 text-sm font-semibold" style={{ color: 'var(--brand-ink-soft)' }}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:opacity-70">{item.label}</Link>
              ))}
            </nav>
          )}
          <Link
            href="/acceso"
            className="rounded-full px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: 'var(--brand-primary)' }}
          >
            Ingresar
          </Link>
        </div>
        <div
          className="border-t py-4 text-center text-xs"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-ink-muted)' }}
        >
          © {currentYear} {platformName} · Todos los derechos reservados
        </div>
      </footer>

    </main>
  );
}
