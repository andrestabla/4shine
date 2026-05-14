import Link from 'next/link';
import { Compass, MessageSquare, TrendingUp, Globe } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';

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
  { value: '+25',    label: 'Advisers certificados' },
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
    text: '"4Shine me enseñó a integrar estrategia con bienestar. Tomo decisiones más consistentes y lidero con claridad en contextos de alta incertidumbre."',
  },
  {
    initial: 'A', color: '#0e7a5a',
    name: 'Andrés V.', role: 'Gerente Comercial',
    text: '"Pasé de reaccionar a priorizar con método. Mi comunicación ejecutiva mejoró y crecí en influencia interna sin perder mi autenticidad como líder."',
  },
];

export default function MetodologiaPage() {
  return (
    <MarketingShell
      title="La metodología 4Shine"
      subtitle="Un programa de 24 semanas que integra diagnóstico, formación aplicada, mentoría experta y comunidad ejecutiva para generar resultados sostenibles."
    >

      {/* ── 1. QUÉ ES 4SHINE — VIDEO ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1240px] px-6 pb-20 pt-4 md:px-10 lg:px-14">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="max-w-[22ch] text-4xl font-black leading-[1.05] tracking-tight text-[#1c0f32] md:text-5xl">
                Más que una plataforma. Un sistema de transformación.
              </h2>
              <div className="mt-8 space-y-5">
                {[
                  { n: '01', text: 'Diagnóstico de 125 preguntas que mide tu nivel en los 4 pilares de liderazgo y define tu punto de partida.' },
                  { n: '02', text: 'Ruta guiada de 24 semanas con workbooks prácticos, contenido exclusivo y hitos claros por fase.' },
                  { n: '03', text: 'Acompañamiento personalizado de Advisers certificados que aceleran decisiones y consolidan hábitos reales.' },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-4">
                    <span className="mt-0.5 shrink-0 text-sm font-black text-[#7557a1]">{n}</span>
                    <p className="text-base leading-relaxed text-[#4a3665]">{text}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/planes-precios"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#2e1b49] px-6 py-3 text-sm font-bold text-white hover:bg-[#3d2562] transition"
              >
                Ver planes y precios
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Link>
            </div>

            <div className="overflow-hidden rounded-3xl bg-[#1c102d] shadow-[0_32px_72px_rgba(28,16,45,0.22)]">
              <div className="aspect-video flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                  <button
                    type="button"
                    className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-[#f2b24b]/50 bg-[#f2b24b]/15 transition hover:bg-[#f2b24b]/25"
                  >
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path d="M9 6.5l12 6.5-12 6.5V6.5z" fill="#f2b24b" />
                    </svg>
                  </button>
                  <p className="text-sm font-medium text-white/40">Conoce cómo funciona 4Shine</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. MÉTRICAS ── */}
      <section className="bg-[#14082a] text-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 px-6 md:grid-cols-4 md:px-10 lg:px-14">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`flex flex-col items-center justify-center py-10 px-6 text-center ${i < metrics.length - 1 ? 'border-r border-white/10' : ''}`}
            >
              <span className="text-4xl font-black md:text-5xl" style={{ color: '#f2b24b' }}>{m.value}</span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#c9b8ff]">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. LOS 4 PILARES ── */}
      <section className="bg-[#f4f2fa]">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 grid items-end gap-4 md:grid-cols-[1fr_auto]">
            <h2 className="max-w-[28ch] text-4xl font-black tracking-tight text-[#1c0f32] md:text-5xl">
              Cuatro dimensiones. Una transformación completa.
            </h2>
            <p className="max-w-[42ch] text-base leading-relaxed text-[#5e4b78] md:text-lg">
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
      <section className="bg-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-10 grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <h2 className="max-w-[26ch] text-4xl font-black tracking-tight text-[#1c0f32] md:text-5xl">
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
                className="flex items-center gap-4 border-b border-[#ede8f6] px-2 py-4 last:border-0 transition hover:bg-[#faf8ff]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
                  style={{ background: PHASE_COLORS[wb.phase] }}
                >
                  {wb.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black text-[#1c0f32]">{wb.title}</p>
                  <p className="mt-0.5 text-xs text-[#8b75a8]">{wb.weeks} · <span style={{ color: PHASE_COLORS[wb.phase] }}>{wb.phaseLabel}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. PLATAFORMA — filas con divisores, sin contenedores ── */}
      <section className="bg-[#f4f2fa]">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <h2 className="mb-2 max-w-[28ch] text-4xl font-black tracking-tight text-[#1c0f32] md:text-5xl">
            Todo lo que necesitas para crecer, en un solo lugar.
          </h2>
          <p className="mb-16 max-w-[54ch] text-base text-[#5e4b78]">
            Diagnóstico, ruta, contenido, mentoría y comunidad. Sin dispersión.
          </p>

          {[
            {
              n: '01',
              title: 'Contenido exclusivo',
              summary: 'Clases, masterclasses y material de apoyo diseñados para aplicar en tu realidad profesional inmediata.',
              items: [
                { title: 'Video-clases por fase', text: 'Lecciones cortas y accionables alineadas a cada workbook.' },
                { title: 'Masterclasses de Advisers', text: 'Sesiones de expertos sobre temas de liderazgo de alto impacto.' },
                { title: 'Biblioteca de recursos', text: 'Lecturas, frameworks y herramientas curadas por especialistas.' },
              ],
              dark: false,
            },
            {
              n: '02',
              title: 'Sesiones de mentoría con expertos',
              summary: 'Acompañamiento 1:1 y grupal con Advisers especializados que te ayudan a tomar decisiones con mayor claridad y velocidad.',
              items: [
                { title: 'Adviser Guía', text: 'Acompañamiento continuo a lo largo de tu ruta. Seguimiento semanal, retroalimentación y accountability.' },
                { title: 'Adviser Experto', text: 'Sesiones focalizadas con especialistas según la fase que estés transitando en el programa.' },
                { title: 'Estructura probada', text: 'Cada sesión tiene un marco de preparación, conversación y compromisos que aceleran el avance real.' },
              ],
              dark: true,
            },
            {
              n: '03',
              title: 'Comunidad · Networking',
              summary: 'Una red de líderes con el mismo nivel de ambición y compromiso. Colaboración real, no solo contactos.',
              items: [
                { title: 'Sesiones grupales en vivo', text: 'Encuentros semanales con el grupo del programa para compartir avances y desafíos reales.' },
                { title: 'Workshops y convocatorias', text: 'Eventos de profundización, talleres temáticos y encuentros presenciales o virtuales.' },
                { title: 'Red de líderes 4Shine', text: 'Acceso permanente a la comunidad: más de 1.000 líderes activos en distintas industrias.' },
              ],
              dark: false,
            },
          ].map(({ n, title, summary, items, dark }) => (
            <div
              key={n}
              className={`grid items-start gap-8 border-t py-12 lg:grid-cols-[220px_1fr] ${dark ? 'border-[#2e1b49]' : 'border-[#d8d0ea]'}`}
            >
              <div>
                <span className={`text-xs font-bold ${dark ? 'text-[#9b88c8]' : 'text-[#9b88c8]'}`}>{n}</span>
                <h3 className={`mt-1 text-xl font-black ${dark ? 'text-[#1c0f32]' : 'text-[#1c0f32]'}`}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5e4b78]">{summary}</p>
              </div>
              <div className="grid gap-8 sm:grid-cols-3">
                {items.map(({ title: t, text }) => (
                  <div key={t}>
                    <p className="text-sm font-black text-[#1c0f32]">{t}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#6b5487]">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. EXPERIENCIAS DE TRANSFORMACIÓN ── */}
      <section className="bg-[#1c102d] text-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-[24ch] text-4xl font-black tracking-tight md:text-5xl">
              Experiencias reales de transformación.
            </h2>
            <Link href="/planes-precios" className="whitespace-nowrap text-sm font-bold text-[#f2b24b] underline underline-offset-4 hover:text-[#f6c56d]">
              Ver planes y empezar →
            </Link>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {stories.map((s) => (
              <div key={s.name} className="border-l-2 pl-6" style={{ borderColor: s.color }}>
                <p className="text-[15px] leading-relaxed text-[#e8e0fc]">{s.text}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                    style={{ background: s.color }}
                  >
                    {s.initial}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{s.name}</p>
                    <p className="text-xs text-[#c9b8ff]">{s.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/acceso?plan=diagnostico"
              className="rounded-full bg-[#f2b24b] px-8 py-3.5 text-sm font-extrabold text-[#1c0f32] hover:bg-[#f6c56d] transition"
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
