import Link from 'next/link';
import { Compass, MessageSquare, TrendingUp, Globe } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { loadServerBranding } from '@/lib/server-branding';
import { BlockRenderer } from '@/components/site-builder/BlockRenderer';
import { getPublicPageByKey } from '@/lib/site-pages';

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
  weeks: string;
  gradient: string;
  description: string;
  detail: string;
}> = [
  {
    key: 'within',
    title: 'Shine Within',
    weeks: 'Semanas 1–6',
    gradient: 'linear-gradient(135deg,#5b2d8a,#7c3aad)',
    description: 'Autoliderazgo, identidad y claridad personal para decidir con conciencia.',
    detail: 'Descubres quién eres como líder, qué valores te mueven y cómo tomar decisiones profundamente alineadas con tu propósito.',
  },
  {
    key: 'out',
    title: 'Shine Out',
    weeks: 'Semanas 7–12',
    gradient: 'linear-gradient(135deg,#1e5fa8,#2d7dd2)',
    description: 'Comunicación estratégica, presencia ejecutiva y narrativa de impacto.',
    detail: 'Desarrollas la capacidad de articular ideas con poder, influir con autenticidad y proyectar una presencia ejecutiva real.',
  },
  {
    key: 'up',
    title: 'Shine Up',
    weeks: 'Semanas 13–18',
    gradient: 'linear-gradient(135deg,#0e7a5a,#15a37a)',
    description: 'Pensamiento estratégico, influencia y toma de decisiones en contextos complejos.',
    detail: 'Elevas tu pensamiento, navegas la ambigüedad y ejerces influencia sin necesitar autoridad directa.',
  },
  {
    key: 'beyond',
    title: 'Shine Beyond',
    weeks: 'Semanas 19–24',
    gradient: 'linear-gradient(135deg,#a8420e,#d45a0f)',
    description: 'Legado, expansión y liderazgo que transforma equipos y ecosistemas.',
    detail: 'Construyes equipos de alto desempeño, articulas un legado de impacto y multiplicas tu capacidad de transformación.',
  },
];

const workbooks: Array<{ n: number; title: string; weeks: string; phase: PillarKey; phaseLabel: string }> = [
  { n: 1,  title: 'Propósito y Visión',          weeks: 'Sem. 1–2',   phase: 'within',  phaseLabel: 'Shine Within'  },
  { n: 2,  title: 'Mapa de Valores',              weeks: 'Sem. 3–4',   phase: 'within',  phaseLabel: 'Shine Within'  },
  { n: 3,  title: 'Autoliderazgo Consciente',     weeks: 'Sem. 5–6',   phase: 'within',  phaseLabel: 'Shine Within'  },
  { n: 4,  title: 'Comunicación Auténtica',       weeks: 'Sem. 7–8',   phase: 'out',     phaseLabel: 'Shine Out'     },
  { n: 5,  title: 'Presencia Ejecutiva',          weeks: 'Sem. 9–10',  phase: 'out',     phaseLabel: 'Shine Out'     },
  { n: 6,  title: 'Narrativa de Impacto',         weeks: 'Sem. 11–12', phase: 'out',     phaseLabel: 'Shine Out'     },
  { n: 7,  title: 'Pensamiento Estratégico',      weeks: 'Sem. 13–15', phase: 'up',      phaseLabel: 'Shine Up'      },
  { n: 8,  title: 'Influencia sin Autoridad',     weeks: 'Sem. 16–18', phase: 'up',      phaseLabel: 'Shine Up'      },
  { n: 9,  title: 'Equipos de Alto Desempeño',   weeks: 'Sem. 19–21', phase: 'beyond',  phaseLabel: 'Shine Beyond'  },
  { n: 10, title: 'Legado y Expansión',           weeks: 'Sem. 22–24', phase: 'beyond',  phaseLabel: 'Shine Beyond'  },
];

const PHASE_COLORS: Record<PillarKey, string> = {
  within: '#7c3aad',
  out:    '#2d7dd2',
  up:     '#15a37a',
  beyond: '#d45a0f',
};

const metrics = [
  { value: '+1.000', label: 'Líderes activos' },
  { value: '24',     label: 'Semanas de programa' },
  { value: '10',     label: 'Workbooks exclusivos' },
  { value: '+25',    label: 'Advisors certificados' },
];

const stories = [
  {
    initial: 'P', color: '#5b2d8a',
    name: 'Pablo R.', role: 'Director de Tecnología · LATAM',
    text: '"En 12 semanas convertí mi visión en una ruta concreta. Mi equipo mejoró el foco y la coordinación de una manera que no creí posible antes del programa."',
  },
  {
    initial: 'C', color: '#1e5fa8',
    name: 'Carolina M.', role: 'Directora Académica',
    text: '"{platformName} me enseñó a integrar estrategia con bienestar. Tomo decisiones más consistentes y lidero con claridad en contextos de alta incertidumbre."',
  },
  {
    initial: 'A', color: '#0e7a5a',
    name: 'Andrés V.', role: 'Gerente Comercial',
    text: '"Pasé de reaccionar a priorizar con método. Mi comunicación ejecutiva mejoró y crecí en influencia interna sin perder mi autenticidad como líder."',
  },
];

export default async function MetodologiaPage() {
  const [branding, builderPage] = await Promise.all([
    loadServerBranding(),
    getPublicPageByKey('metodologia'),
  ]);
  if (builderPage && !builderPage.isVisible) notFound();
  if (builderPage?.useBuilder && builderPage.sections.length > 0) {
    // La URL pudo cambiar desde el builder: la ruta original redirige a la nueva.
    if (builderPage.slug && builderPage.slug !== 'metodologia') redirect(`/${builderPage.slug}`);
    return (
      <MarketingShell>
        <BlockRenderer sections={builderPage.sections} />
      </MarketingShell>
    );
  }
  const platformName = branding.settings.platformName?.trim() || '4Shine';

  return (
    <MarketingShell
      title={`La metodología ${platformName}`}
      subtitle="Un programa de 24 semanas que integra diagnóstico, formación aplicada, mentoría experta y comunidad ejecutiva para generar resultados sostenibles."
    >

      {/* ── 1. QUÉ ES 4SHINE — VIDEO ── */}
      <section style={{ background: 'white' }}>
        <div className="mx-auto max-w-[1240px] px-6 pb-20 pt-4 md:px-10 lg:px-14">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2
                className="max-w-[22ch] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl"
                style={{ color: 'var(--brand-primary)' }}
              >
                Más que una plataforma. Un sistema de transformación.
              </h2>
              <div className="mt-8 space-y-5">
                {[
                  { n: '01', text: 'Diagnóstico de 125 preguntas que mide tu nivel en los 4 pilares de liderazgo y define tu punto de partida.' },
                  { n: '02', text: 'Ruta guiada de 24 semanas con workbooks prácticos, contenido exclusivo y hitos claros por fase.' },
                  { n: '03', text: 'Acompañamiento personalizado de Advisors certificados que aceleran decisiones y consolidan hábitos reales.' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-4">
                    <span
                      className="mt-0.5 shrink-0 text-sm font-black"
                      style={{ color: 'var(--brand-accent-strong)' }}
                    >
                      {n}
                    </span>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>{text}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/planes-precios"
                className="mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: 'var(--brand-darker)' }}
              >
                Ver planes y precios
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>

            <div
              className="overflow-hidden rounded-3xl shadow-[0_32px_72px_rgba(0,0,0,0.22)]"
              style={{ background: 'var(--brand-dark)' }}
            >
              <div className="aspect-video flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                  <button
                    type="button"
                    className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border transition hover:opacity-80"
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
              <span
                className="mt-2 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'color-mix(in srgb, var(--brand-accent) 60%, white)' }}
              >
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. LOS 4 PILARES ── */}
      <section style={{ background: 'var(--brand-surface)' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 grid items-end gap-4 md:grid-cols-[1fr_auto]">
            <h2
              className="max-w-[28ch] text-4xl font-black tracking-tight md:text-5xl"
              style={{ color: 'var(--brand-primary)' }}
            >
              Cuatro dimensiones. Una transformación completa.
            </h2>
            <p
              className="max-w-[42ch] text-base leading-relaxed md:text-lg"
              style={{ color: 'var(--brand-ink-soft)' }}
            >
              Cada fase construye sobre la anterior. De adentro hacia afuera, de la identidad al impacto colectivo.
            </p>
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
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/50">{p.weeks}</p>
                  <Icon size={26} color="rgba(255,255,255,0.88)" strokeWidth={1.8} />
                  <h3 className="mt-4 text-lg font-black tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-snug text-white/80">{p.description}</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/60">{p.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. WORKBOOKS ── */}
      <section style={{ background: 'white' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-10 grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <h2
              className="max-w-[26ch] text-4xl font-black tracking-tight md:text-5xl"
              style={{ color: 'var(--brand-primary)' }}
            >
              10 guías de trabajo práctico, una por fase y momento.
            </h2>
            <div className="flex flex-wrap gap-2.5 md:justify-end">
              {pillars.map((p) => (
                <span
                  key={p.key}
                  className="rounded-full px-3 py-1 text-[11px] font-bold text-white"
                  style={{ background: PHASE_COLORS[p.key] }}
                >
                  {p.title}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-0 sm:grid-cols-2">
            {workbooks.map((wb) => (
              <div
                key={wb.n}
                className="flex items-center gap-4 border-b px-2 py-4 last:border-0 transition hover:opacity-90"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                  style={{ background: PHASE_COLORS[wb.phase] }}
                >
                  {wb.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black" style={{ color: 'var(--brand-primary)' }}>{wb.title}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--brand-ink-muted)' }}>
                    {wb.weeks} · <span style={{ color: PHASE_COLORS[wb.phase] }}>{wb.phaseLabel}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. PLATAFORMA — filas con divisores, sin contenedores ── */}
      <section style={{ background: 'var(--brand-surface)' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <h2
            className="mb-2 max-w-[28ch] text-4xl font-black tracking-tight md:text-5xl"
            style={{ color: 'var(--brand-primary)' }}
          >
            Todo lo que necesitas para crecer, en un solo lugar.
          </h2>
          <p className="mb-16 max-w-[54ch] text-base" style={{ color: 'var(--brand-ink-soft)' }}>
            Diagnóstico, ruta, contenido, mentoría y comunidad. Sin dispersión.
          </p>

          {[
            {
              n: '01',
              title: 'Contenido exclusivo',
              summary: 'Clases, masterclasses y material de apoyo diseñados para aplicar en tu realidad profesional inmediata.',
              items: [
                { title: 'Video-clases por fase', text: 'Lecciones cortas y accionables alineadas a cada workbook.' },
                { title: 'Masterclasses de Advisors', text: 'Sesiones de expertos sobre temas de liderazgo de alto impacto.' },
                { title: 'Biblioteca de recursos', text: 'Lecturas, frameworks y herramientas curadas por especialistas.' },
              ],
            },
            {
              n: '02',
              title: 'Sesiones de mentoría con expertos',
              summary: 'Acompañamiento 1:1 y grupal con Advisors especializados que te ayudan a tomar decisiones con mayor claridad y velocidad.',
              items: [
                { title: 'Advisor Guía', text: 'Acompañamiento continuo a lo largo de tu ruta. Seguimiento semanal, retroalimentación y accountability.' },
                { title: 'Advisor Experto', text: 'Sesiones focalizadas con especialistas según la fase que estés transitando en el programa.' },
                { title: 'Estructura probada', text: 'Cada sesión tiene un marco de preparación, conversación y compromisos que aceleran el avance real.' },
              ],
            },
            {
              n: '03',
              title: 'Comunidad · Networking',
              summary: 'Una red de líderes con el mismo nivel de ambición y compromiso. Colaboración real, no solo contactos.',
              items: [
                { title: 'Sesiones grupales en vivo', text: 'Encuentros semanales con el grupo del programa para compartir avances y desafíos reales.' },
                { title: 'Workshops y convocatorias', text: 'Eventos de profundización, talleres temáticos y encuentros presenciales o virtuales.' },
                { title: `Red de líderes ${platformName}`, text: 'Acceso permanente a la comunidad: más de 1.000 líderes activos en distintas industrias.' },
              ],
            },
          ].map(({ n, title, summary, items }) => (
            <div
              key={n}
              className="grid items-start gap-8 border-t py-12 lg:grid-cols-[220px_1fr]"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <div>
                <span className="text-xs font-bold" style={{ color: 'var(--brand-ink-muted)' }}>{n}</span>
                <h3 className="mt-1 text-xl font-black" style={{ color: 'var(--brand-primary)' }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>{summary}</p>
              </div>
              <div className="grid gap-8 sm:grid-cols-3">
                {items.map(({ title: t, text }) => (
                  <div key={t}>
                    <p className="text-sm font-black" style={{ color: 'var(--brand-primary)' }}>{t}</p>
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. EXPERIENCIAS DE TRANSFORMACIÓN ── */}
      <section className="text-white" style={{ background: 'var(--brand-dark)' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-[24ch] text-4xl font-black tracking-tight md:text-5xl">
              Experiencias reales de transformación.
            </h2>
            <Link
              href="/planes-precios"
              className="whitespace-nowrap text-sm font-bold underline underline-offset-4 hover:opacity-80"
              style={{ color: 'var(--brand-accent)' }}
            >
              Ver planes y empezar →
            </Link>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {stories.map((s) => (
              <div key={s.name} className="border-l-2 pl-6" style={{ borderColor: s.color }}>
                <p className="text-[15px] leading-relaxed" style={{ color: 'color-mix(in srgb, var(--brand-accent) 18%, white)' }}>
                  {s.text.replace('{platformName}', platformName)}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ background: s.color }}
                  >
                    {s.initial}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{s.name}</p>
                    <p className="text-xs" style={{ color: 'color-mix(in srgb, var(--brand-accent) 50%, white)' }}>{s.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/acceso?plan=diagnostico"
              className="rounded-full px-8 py-3.5 text-sm font-extrabold transition hover:opacity-90"
              style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
            >
              Empezar con el Diagnóstico — $50 USD
            </Link>
            <Link
              href="/planes-precios"
              className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition"
            >
              Ver todos los programas
            </Link>
          </div>
        </div>
      </section>

    </MarketingShell>
  );
}
