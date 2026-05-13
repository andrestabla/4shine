import Link from 'next/link';
import { Compass, MessageSquare, TrendingUp, Globe, BookOpen, Layers, Users } from 'lucide-react';
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
              <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">¿Qué es 4Shine?</p>
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

            {/* Video panel */}
            <div className="relative overflow-hidden rounded-3xl bg-[#1c102d] shadow-[0_32px_72px_rgba(28,16,45,0.22)]">
              <div className="aspect-video flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_38%_50%,rgba(91,45,138,0.55),transparent_60%),radial-gradient(ellipse_at_76%_20%,rgba(242,178,75,0.09),transparent_50%)]" />
                <div
                  className="absolute inset-0 opacity-[0.025]"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '44px 44px',
                  }}
                />
                <div className="relative flex flex-col items-center gap-5">
                  <div
                    className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-[#f2b24b]/40 bg-[#f2b24b]/10 backdrop-blur transition hover:scale-105 hover:bg-[#f2b24b]/20"
                    style={{ boxShadow: '0 0 0 16px rgba(242,178,75,0.05),0 0 0 32px rgba(242,178,75,0.025)' }}
                  >
                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                      <path d="M9 6.5l12 6.5-12 6.5V6.5z" fill="#f2b24b" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white/50">Conoce cómo funciona 4Shine</p>
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
          <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">El programa</p>
          <div className="mb-12 grid items-end gap-4 md:grid-cols-[1fr_auto]">
            <h2 className="max-w-[28ch] text-4xl font-black tracking-tight text-[#1c0f32] md:text-5xl">
              Cuatro dimensiones. Una transformación completa.
            </h2>
            <p className="max-w-[42ch] text-base leading-relaxed text-[#5e4b78] md:text-lg">
              Cada fase construye sobre la anterior. De adentro hacia afuera, de la identidad al impacto colectivo.
            </p>
          </div>

          {/* Phase flow */}
          <div className="mb-10 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e8e0f8] px-3.5 py-1.5 text-xs font-bold text-[#5b2d8a]">Diagnóstico</span>
            {pillars.map((p, i) => (
              <span key={p.key} className="flex items-center gap-2">
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M0 6h14M10 2l4 4-4 4" stroke="#c4b5da" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span
                  className="rounded-full px-3.5 py-1.5 text-xs font-bold text-white"
                  style={{ background: PHASE_COLORS[p.key] }}
                >
                  {p.title}
                </span>
              </span>
            ))}
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
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/60">{p.weeks}</p>
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
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">Workbooks</p>
              <h2 className="max-w-[26ch] text-4xl font-black tracking-tight text-[#1c0f32] md:text-5xl">
                10 guías de trabajo práctico, una por fase y momento.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5 md:justify-end">
              {pillars.map((p) => (
                <span
                  key={p.key}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white"
                  style={{ background: PHASE_COLORS[p.key] }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
                  {p.title}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {workbooks.map((wb) => (
              <div
                key={wb.n}
                className="flex items-center gap-4 rounded-2xl border border-[#e8e0f4] bg-[#faf8ff] px-5 py-4 transition hover:border-[#c4b5da] hover:shadow-[0_4px_18px_rgba(91,45,138,0.07)]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                  style={{ background: PHASE_COLORS[wb.phase] }}
                >
                  {wb.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black text-[#1c0f32]">{wb.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-[#8b75a8]">{wb.weeks}</span>
                    <span className="text-[10px] text-[#c4b5da]">·</span>
                    <span className="text-xs font-semibold" style={{ color: PHASE_COLORS[wb.phase] }}>{wb.phaseLabel}</span>
                  </div>
                </div>
                <BookOpen size={16} color="#c4b5da" className="shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CONTENIDO EXCLUSIVO ── */}
      <section className="bg-[#f4f2fa]">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">Plataforma</p>
          <h2 className="mb-14 max-w-[28ch] text-4xl font-black tracking-tight text-[#1c0f32] md:text-5xl">
            Todo lo que necesitas para crecer, en un solo lugar.
          </h2>

          {/* Row A: Contenido exclusivo */}
          <div className="grid items-center gap-10 rounded-3xl border border-[#ddd5f2] bg-white p-8 lg:grid-cols-[240px_1fr] lg:p-10">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0eaff]">
                <Layers size={22} color="#5b2d8a" />
              </div>
              <h3 className="text-2xl font-black text-[#1c0f32]">Contenido exclusivo</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5e4b78]">
                Clases, masterclasses y material de apoyo diseñados para aplicar en tu realidad profesional inmediata.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: 'Video-clases por fase', text: 'Lecciones cortas y accionables alineadas a cada workbook.' },
                { title: 'Masterclasses de Advisers', text: 'Sesiones de expertos sobre temas de liderazgo de alto impacto.' },
                { title: 'Biblioteca de recursos', text: 'Lecturas, frameworks y herramientas curadas por especialistas.' },
              ].map(({ title, text }) => (
                <div key={title} className="rounded-2xl border border-[#ebe4f8] bg-[#faf8ff] p-4">
                  <p className="text-sm font-black text-[#1c0f32]">{title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#7557a1]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Row B: Mentorías (dark) */}
          <div className="mt-5 grid items-center gap-10 overflow-hidden rounded-3xl bg-[#1c102d] p-8 text-white lg:grid-cols-[240px_1fr] lg:p-10">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Users size={22} color="white" />
              </div>
              <h3 className="text-2xl font-black">Sesiones de mentoría con expertos</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#c9b8ff]">
                Acompañamiento 1:1 y grupal con Advisers especializados que te ayudan a tomar decisiones con mayor claridad y velocidad.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: 'Adviser Guía', text: 'Acompañamiento continuo a lo largo de tu ruta. Seguimiento semanal, retroalimentación y accountability.' },
                { title: 'Adviser Experto', text: 'Sesiones focalizadas con especialistas según la fase que estés transitando en el programa.' },
                { title: 'Estructura probada', text: 'Cada sesión tiene un marco de preparación, conversación y compromisos que aceleran el avance real.' },
              ].map(({ title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-black">{title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#c9b8ff]">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Row C: Comunidad */}
          <div className="mt-5 grid items-center gap-10 rounded-3xl border border-[#ddd5f2] bg-white p-8 lg:grid-cols-[240px_1fr] lg:p-10">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0eaff]">
                <Users size={22} color="#5b2d8a" />
              </div>
              <h3 className="text-2xl font-black text-[#1c0f32]">Comunidad · Networking</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5e4b78]">
                Una red de líderes con el mismo nivel de ambición y compromiso. Colaboración real, no solo contactos.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { title: 'Sesiones grupales en vivo', text: 'Encuentros semanales con el grupo del programa para compartir avances y desafíos reales.' },
                { title: 'Workshops y convocatorias', text: 'Eventos de profundización, talleres temáticos y encuentros presenciales o virtuales.' },
                { title: 'Red de líderes 4Shine', text: 'Acceso permanente a la comunidad: más de 1.000 líderes activos en distintas industrias.' },
              ].map(({ title, text }) => (
                <div key={title} className="rounded-2xl border border-[#ebe4f8] bg-[#faf8ff] p-4">
                  <p className="text-sm font-black text-[#1c0f32]">{title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#7557a1]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. EXPERIENCIAS DE TRANSFORMACIÓN ── */}
      <section className="bg-[#1c102d] text-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#c9b8ff]">Testimonios</p>
              <h2 className="max-w-[24ch] text-4xl font-black tracking-tight md:text-5xl">
                Experiencias reales de transformación.
              </h2>
            </div>
            <Link href="/planes-precios" className="whitespace-nowrap text-sm font-bold text-[#f2b24b] underline underline-offset-4 hover:text-[#f6c56d]">
              Ver planes y empezar →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {stories.map((s) => (
              <article key={s.name} className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <svg className="mb-4 shrink-0" width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M0 24V14.4C0 6.4 4.267 1.6 12.8 0l1.6 2.4C10.133 3.733 7.733 6.4 7.2 10.4H13.6V24H0ZM18.4 24V14.4C18.4 6.4 22.667 1.6 31.2 0l1.6 2.4c-4.267 1.333-6.667 4-7.2 8H32V24H18.4Z" fill="#f2b24b" fillOpacity="0.5"/>
                </svg>
                <p className="flex-1 text-[15px] leading-relaxed text-[#e8e0fc]">{s.text}</p>
                <div className="mt-7 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-black text-white"
                    style={{ background: s.color }}
                  >
                    {s.initial}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{s.name}</p>
                    <p className="text-xs text-[#c9b8ff]">{s.role}</p>
                  </div>
                </div>
              </article>
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
