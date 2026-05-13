import Link from 'next/link';
import { Compass, MessageSquare, TrendingUp, Globe, BookOpen, CalendarDays, Users } from 'lucide-react';
import { getSitePages } from '@/lib/site-settings';

// ── Types ─────────────────────────────────────────────────────────────────────

type PillarKey = 'within' | 'out' | 'up' | 'beyond';

// ── Data ──────────────────────────────────────────────────────────────────────

const PILLAR_ICONS = {
  within: Compass,
  out: MessageSquare,
  up: TrendingUp,
  beyond: Globe,
} satisfies Record<PillarKey, React.ElementType>;

const pillars: Array<{
  key: PillarKey;
  title: string;
  subtitle: string;
  gradient: string;
  iconColor: string;
  weeks: string;
  description: string;
  workbooks: string;
}> = [
  {
    key: 'within',
    title: 'Shine Within',
    subtitle: 'Esencia y autoliderazgo',
    gradient: 'linear-gradient(135deg,#5b2d8a,#7c3aad)',
    iconColor: '#9b72d0',
    weeks: 'Semanas 2 – 8',
    description: 'Creencias, identidad, gestión emocional y propósito. El núcleo desde donde todo emerge.',
    workbooks: 'WB1 · WB2 · WB3',
  },
  {
    key: 'out',
    title: 'Shine Out',
    subtitle: 'Presencia estratégica',
    gradient: 'linear-gradient(135deg,#1e5fa8,#2d7dd2)',
    iconColor: '#5a9fd4',
    weeks: 'Semanas 9 – 14',
    description: 'Narrativa ejecutiva, comunicación estratégica y lenguaje de impacto. Tu presencia como herramienta.',
    workbooks: 'WB4 · WB5 · WB6',
  },
  {
    key: 'up',
    title: 'Shine Up',
    subtitle: 'Ecosistema relacional',
    gradient: 'linear-gradient(135deg,#0e7a5a,#15a37a)',
    iconColor: '#3db88a',
    weeks: 'Semanas 15 – 20',
    description: 'Mapeo estratégico, pensamiento sistémico y propuesta de valor. Cómo lees y navegas tu entorno.',
    workbooks: 'WB7 · WB8',
  },
  {
    key: 'beyond',
    title: 'Shine Beyond',
    subtitle: 'Legado y visión',
    gradient: 'linear-gradient(135deg,#a8420e,#d45a0f)',
    iconColor: '#d4793a',
    weeks: 'Semanas 21 – 24',
    description: 'Marca ejecutiva y visión estratégica personal. La dirección que le das a tu trayectoria.',
    workbooks: 'WB9 · WB10',
  },
];

const workbooks = [
  { n: 1,  title: 'Creencias, identidad y pilares personales',              weeks: 'Sem 2–4',   phase: 'Shine Within',  color: '#7c3aad' },
  { n: 2,  title: 'Gestión emocional y PDI estratégico',                    weeks: 'Sem 5–6',   phase: 'Shine Within',  color: '#7c3aad' },
  { n: 3,  title: 'Propósito y valores no negociables',                     weeks: 'Sem 7–8',   phase: 'Shine Within',  color: '#7c3aad' },
  { n: 4,  title: 'Narrativa profesional y Elevator Pitch',                 weeks: 'Sem 9–10',  phase: 'Shine Out',     color: '#2d7dd2' },
  { n: 5,  title: 'Comunicación ejecutiva estratégica',                     weeks: 'Sem 11–12', phase: 'Shine Out',     color: '#2d7dd2' },
  { n: 6,  title: 'Lenguaje verbal y no verbal de impacto',                 weeks: 'Sem 13–14', phase: 'Shine Out',     color: '#2d7dd2' },
  { n: 7,  title: 'Mapeo del ecosistema estratégico',                       weeks: 'Sem 15–17', phase: 'Shine Up',      color: '#15a37a' },
  { n: 8,  title: 'Pensamiento estratégico y toma de decisiones',           weeks: 'Sem 18–20', phase: 'Shine Up',      color: '#15a37a' },
  { n: 9,  title: 'Latido de marca ejecutiva',                              weeks: 'Sem 21–22', phase: 'Shine Beyond',  color: '#d45a0f' },
  { n: 10, title: 'Visión Estratégica Personal — One Strategic Page Plan',  weeks: 'Sem 23–24', phase: 'Shine Beyond',  color: '#d45a0f' },
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

const metrics = [
  { value: '+1.000', label: 'Líderes activos' },
  { value: '24',     label: 'Semanas de programa' },
  { value: '10',     label: 'Workbooks guiados' },
  { value: '+25',    label: 'Advisers certificados' },
];

const HOME_NAV_ITEMS = [
  { href: '/metodologia',   label: 'Metodología',    pageKey: 'metodologia'   },
  { href: '/descubrimiento',label: 'Descubrimiento', pageKey: 'descubrimiento'},
  { href: '/planes-precios',label: 'Planes y precios',pageKey: 'planes_precios'},
  { href: '/afiliados',     label: 'Afiliados',      pageKey: 'afiliados'     },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HomeMarketingPage() {
  const enabledPages = await getSitePages();
  const navItems = HOME_NAV_ITEMS.filter((item) => enabledPages[item.pageKey] !== false);

  return (
    <main className="min-h-screen bg-[#f4f2fa] text-[#1c0f32]">

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden bg-[#1c102d] text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay loop muted playsInline preload="metadata" aria-hidden="true"
        >
          {/* ASSETS: video corporativo 1920×1080 .mp4 */}
          <source src="https://liderazgoestrategico.s3.us-east-1.amazonaws.com/4shine/International_Team_1920x1080.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(20,9,36,0.93)_10%,rgba(28,14,45,0.82)_55%,rgba(46,23,62,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,151,255,0.28),transparent_38%),radial-gradient(circle_at_84%_24%,rgba(240,181,95,0.20),transparent_44%)]" />

        <div className="relative mx-auto flex max-w-[1240px] flex-col px-6 pb-24 pt-6 md:px-10 lg:px-14">
          {/* Nav */}
          <header className="mb-16 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/workbooks-v2/diamond.svg" alt="Logo 4Shine" className="h-8 w-8 object-contain" />
              <span className="text-xl font-black tracking-tight">4Shine</span>
            </Link>
            {navItems.length > 0 && (
              <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-[#f4cf8e]">{item.label}</Link>
                ))}
              </nav>
            )}
            <Link href="/acceso" className="rounded-full bg-[#f2b24b] px-5 py-2 text-sm font-extrabold text-[#2a1b3f] hover:bg-[#f6c56d] transition">
              Ingresar
            </Link>
          </header>

          {/* Headline */}
          <div className="max-w-[900px]">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.36em] text-[#c9b8ff]">
              Programa de Formación y Acompañamiento
            </p>
            <h1 className="text-5xl font-black leading-[0.93] tracking-tight md:text-6xl lg:text-[5.25rem]">
              Tu liderazgo<br />
              tiene más<br />
              <em className="not-italic" style={{ color: '#f2b24b' }}>que dar.</em>
            </h1>
            <p className="mt-7 max-w-[54ch] text-base leading-relaxed text-[#ddd6f0] md:text-lg">
              4Shine es una ruta estructurada de 24 semanas que transforma la comprensión del liderazgo en hábitos, criterios y conductas observables — con diagnóstico, workbooks y acompañamiento experto.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/descubrimiento" className="rounded-full bg-white px-7 py-3 text-sm font-black text-[#2f1a47] hover:bg-[#f0eaff] transition">
                Comenzar diagnóstico
              </Link>
              <Link href="/planes-precios" className="rounded-full border border-white/40 px-7 py-3 text-sm font-bold text-white hover:bg-white/10 transition">
                Ver programas
              </Link>
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
              className={`flex flex-col items-center justify-center py-10 px-4 text-center ${
                i < metrics.length - 1 ? 'border-r border-white/10' : ''
              }`}
            >
              <span className="text-4xl font-black md:text-5xl" style={{ color: '#f2b24b' }}>{m.value}</span>
              <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#c9b8ff]">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. QUÉ ES 4SHINE + VIDEO ── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1240px] items-start gap-14 px-6 py-20 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">

          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">¿Qué es 4Shine?</p>
            <h2 className="max-w-[22ch] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
              El liderazgo real no se improvisa.
            </h2>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-[#4a3665] md:text-lg">
              En muchos contextos los líderes han incorporado discursos sobre propósito, valores y comunicación. Sin embargo, esa comprensión convive con brechas persistentes en la toma de decisiones, la gestión emocional y la coherencia bajo presión.
            </p>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-[#4a3665]">
              4Shine interviene precisamente ahí: en el punto donde el liderazgo necesita pasar del lenguaje a la configuración de hábitos, criterios y conductas visibles.
            </p>

            <div className="mt-8 space-y-3">
              {[
                { n: '01', label: 'Diagnóstico ejecutivo de 125 ítems', text: 'Establece tu línea de base en los 4 pilares con autoinforme y juicio situacional.' },
                { n: '02', label: '10 Workbooks progresivos',            text: 'Convierten conceptos en hábitos aplicados a tu contexto profesional real.' },
                { n: '03', label: 'Acompañamiento con Advisers',         text: 'Leen tu proceso con criterio e integran cada avance en una trayectoria coherente.' },
              ].map((item) => (
                <div key={item.n} className="flex gap-4 rounded-2xl border border-[#e8e0f8] bg-[#faf8ff] px-5 py-4">
                  <span className="mt-0.5 text-xs font-black text-[#5b2d8a] shrink-0">{item.n}</span>
                  <div>
                    <p className="text-sm font-black text-[#1c0f32]">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#6b5487]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/metodologia"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[#5b2d8a] px-6 py-3 text-sm font-bold text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white transition"
            >
              Ver metodología completa
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Video */}
          {/* ASSETS: video corto de presentación del programa (~2 min) */}
          <div className="relative overflow-hidden rounded-3xl bg-[#1c102d] shadow-[0_32px_72px_rgba(28,16,45,0.22)]">
            <div className="aspect-video flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_50%,rgba(91,45,138,0.55),transparent_60%),radial-gradient(ellipse_at_75%_20%,rgba(242,178,75,0.10),transparent_52%)]" />
              <div className="relative flex flex-col items-center gap-5">
                <div
                  className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-[#f2b24b]/40 bg-[#f2b24b]/12 backdrop-blur transition hover:scale-105 hover:bg-[#f2b24b]/22"
                  style={{ boxShadow: '0 0 0 18px rgba(242,178,75,0.05), 0 0 0 36px rgba(242,178,75,0.025)' }}
                >
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                    <path d="M9 6.5l12 6.5-12 6.5V6.5z" fill="#f2b24b" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white/50">Conoce el programa en 2 minutos</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. METODOLOGÍA — LOS 4 PILARES ── */}
      <section className="bg-[#1c102d] text-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#c9b8ff]">Metodología</p>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <h2 className="max-w-[28ch] text-4xl font-black tracking-tight md:text-5xl">
                Cuatro dimensiones.<br />Una transformación completa.
              </h2>
              {/* Phase flow */}
              <div className="flex flex-wrap items-center gap-2 text-sm shrink-0">
                {[
                  { label: 'Diagnóstico', dim: true },
                  { label: 'Shine Within', dim: false },
                  { label: 'Shine Out', dim: false },
                  { label: 'Shine Up', dim: false },
                  { label: 'Shine Beyond', dim: false },
                ].map((phase, i) => (
                  <div key={phase.label} className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${phase.dim ? 'bg-white/10 text-white/50' : 'border border-white/25 text-white/85'}`}>
                      {phase.label}
                    </span>
                    {i < 4 && <span className="text-white/30 text-xs">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => {
              const Icon = PILLAR_ICONS[p.key];
              return (
                <article
                  key={p.title}
                  className="group relative overflow-hidden rounded-3xl p-7 text-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(0,0,0,0.24)]"
                  style={{ background: p.gradient }}
                >
                  <span className="pointer-events-none absolute -right-3 -top-5 select-none text-[8.5rem] font-black leading-none text-white/[0.07]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="mb-4 text-[10px] font-extrabold uppercase tracking-widest text-white/50">{p.weeks}</p>
                  <Icon size={26} color="rgba(255,255,255,0.88)" strokeWidth={1.8} />
                  <h3 className="mt-4 text-lg font-black tracking-tight">{p.title}</h3>
                  <p className="mt-0.5 text-xs font-bold text-white/55">{p.subtitle}</p>
                  <p className="mt-3 text-sm leading-relaxed text-white/72">{p.description}</p>
                  <p className="mt-5 text-[11px] font-bold text-white/38">{p.workbooks}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. WORKBOOKS ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">

          <div className="mb-12 grid items-end gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">Workbooks</p>
              <h2 className="max-w-[26ch] text-4xl font-black tracking-tight md:text-5xl">
                10 workbooks.<br />24 semanas de recorrido profundo.
              </h2>
              <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-[#5e4b78]">
                Cada workbook estructura una etapa del proceso con ejercicios aplicados, compromisos de 30 días y síntesis con tu Adviser. La columna vertebral metodológica del programa.
              </p>
            </div>
            <div className="hidden lg:flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-[#f0eaff] text-6xl font-black text-[#5b2d8a]">
              10
            </div>
          </div>

          {/* Phase legend */}
          <div className="mb-6 flex flex-wrap gap-3">
            {[
              { label: 'Shine Within',  color: '#7c3aad' },
              { label: 'Shine Out',     color: '#2d7dd2' },
              { label: 'Shine Up',      color: '#15a37a' },
              { label: 'Shine Beyond',  color: '#d45a0f' },
            ].map((p) => (
              <span
                key={p.label}
                className="inline-flex items-center gap-2 rounded-full border border-[#e8e0f8] bg-[#faf8ff] px-3 py-1 text-xs font-bold"
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
                {p.label}
              </span>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {workbooks.map((wb) => (
              <div
                key={wb.n}
                className="group flex items-start gap-4 rounded-2xl border border-[#e8e0f8] bg-[#faf8ff] px-5 py-4 transition hover:border-[#d0c4f0] hover:bg-white hover:shadow-[0_4px_24px_rgba(42,20,68,0.07)]"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                  style={{ background: wb.color }}
                >
                  {wb.n}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black leading-snug text-[#1c0f32]">{wb.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#8b75a8]">{wb.weeks}</span>
                    <span className="text-[#ccc3db] text-xs">·</span>
                    <span className="text-[11px] font-bold" style={{ color: wb.color }}>{wb.phase}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CONTENIDO EXCLUSIVO · MENTORÍA · COMUNIDAD ── */}
      <section className="bg-[#f4f2fa]">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">La plataforma</p>
          <h2 className="mb-14 max-w-[26ch] text-4xl font-black tracking-tight md:text-5xl">
            Todo lo que necesitas en un solo lugar.
          </h2>

          <div className="space-y-5">

            {/* Contenido exclusivo */}
            <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-[#d6cced] bg-white px-8 py-8 shadow-[0_8px_32px_rgba(42,20,68,0.05)] lg:grid-cols-[240px_1fr]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0eaff]">
                  <BookOpen size={22} color="#5b2d8a" />
                </div>
                <h3 className="mt-4 text-2xl font-black text-[#1c0f32]">Contenido exclusivo</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6b5487]">
                  Recursos curados para cada fase del programa.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: 'Biblioteca por pilar',    desc: 'Videos, lecturas y recursos estructurados para cada fase de los 24 semanas.' },
                  { title: 'Material de workbooks',   desc: 'Recursos de apoyo específicos vinculados a cada uno de los 10 workbooks.' },
                  { title: 'Acceso permanente',       desc: 'El contenido trabajado queda disponible más allá del cierre del programa.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-[#f9f7fd] p-4">
                    <p className="text-sm font-black text-[#1c0f32]">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#6b5487]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sesiones de mentoría */}
            <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-[#5b2d8a] bg-[#1c102d] px-8 py-8 text-white shadow-[0_16px_48px_rgba(91,45,138,0.22)] lg:grid-cols-[240px_1fr]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <CalendarDays size={22} color="rgba(255,255,255,0.82)" />
                </div>
                <h3 className="mt-4 text-2xl font-black text-white">Sesiones de mentoría con expertos</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#c9b8ff]">
                  Acompañamiento profundo en cada tramo del recorrido.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: 'Adviser Guía',        desc: 'Permanece durante todo el recorrido con visión sistémica e integradora del proceso.', accent: '#f2b24b' },
                  { title: 'Adviser Experto',     desc: 'Interviene en competencias específicas aportando profundidad técnica y criterio.', accent: '#c9b8ff' },
                  { title: 'Estructura probada',  desc: 'Exploración → Profundización → Contraste → Acuerdos. Cada sesión cierra con compromisos verificables.', accent: '#9b88c8' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <p className="text-sm font-black text-white">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#c9b8ff]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Comunidad */}
            <div className="grid items-center gap-8 overflow-hidden rounded-3xl border border-[#d6cced] bg-white px-8 py-8 shadow-[0_8px_32px_rgba(42,20,68,0.05)] lg:grid-cols-[240px_1fr]">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0eaff]">
                  <Users size={22} color="#5b2d8a" />
                </div>
                <h3 className="mt-4 text-2xl font-black text-[#1c0f32]">Comunidad · Networking</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6b5487]">
                  Una red activa de líderes con el mismo nivel de ambición.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: 'Red de líderes activos',     desc: 'Comunidad de líderes que transitan la misma ruta con honestidad y compromiso.' },
                  { title: 'Círculo de líderes en vivo', desc: 'Sesiones grupales semanales con dinámica colaborativa y aprendizaje colectivo.' },
                  { title: 'Workshops y convocatorias',  desc: 'Eventos especializados que amplían el ecosistema relacional durante el programa.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-[#f9f7fd] p-4">
                    <p className="text-sm font-black text-[#1c0f32]">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#6b5487]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. EXPERIENCIAS DE TRANSFORMACIÓN ── */}
      <section className="bg-[#1c102d] text-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#c9b8ff]">
                Experiencias de transformación
              </p>
              <h2 className="max-w-[22ch] text-4xl font-black tracking-tight md:text-5xl">
                Resultados reales en líderes reales.
              </h2>
            </div>
            <Link href="/afiliados" className="whitespace-nowrap text-sm font-bold text-[#f2b24b] underline underline-offset-4 hover:text-[#f6c56d]">
              Conoce a nuestros Advisers →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {stories.map((s) => (
              <article key={s.name} className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <svg className="mb-4 shrink-0" width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path d="M0 24V14.4C0 6.4 4.267 1.6 12.8 0l1.6 2.4C10.133 3.733 7.733 6.4 7.2 10.4H13.6V24H0ZM18.4 24V14.4C18.4 6.4 22.667 1.6 31.2 0l1.6 2.4c-4.267 1.333-6.667 4-7.2 8H32V24H18.4Z" fill="#f2b24b" fillOpacity="0.48"/>
                </svg>
                <p className="flex-1 text-[15px] leading-relaxed text-[#e8e0fc]">{s.text}</p>
                <div className="mt-7 flex items-center gap-3">
                  {/* ASSETS: foto del líder 80×80px circular */}
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
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-[#f4f2fa]">
        <div className="mx-auto max-w-[1240px] px-6 py-16 md:px-10 lg:px-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-black text-[#1c0f32] md:text-4xl">¿Listo para empezar?</h2>
              <p className="mt-2 max-w-[50ch] text-base text-[#5e4b78]">
                Comienza con el diagnóstico ejecutivo y descubre tu punto de partida en los 4 pilares.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/acceso?plan=diagnostico"
                className="rounded-full bg-[#2e1b49] px-7 py-3 text-sm font-extrabold text-white hover:bg-[#402662] transition"
              >
                Empezar diagnóstico
              </Link>
              <Link
                href="/planes-precios"
                className="rounded-full border-2 border-[#5b2d8a] px-7 py-3 text-sm font-bold text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white transition"
              >
                Ver programas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#dacfed] bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 text-[#1c0f32]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/workbooks-v2/diamond.svg" alt="" className="h-6 w-6" />
              <span className="text-lg font-black tracking-tight">4Shine</span>
            </Link>
            <p className="mt-2 text-sm text-[#8b75a8]">Liderazgo con método, consciencia e impacto.</p>
          </div>
          {navItems.length > 0 && (
            <nav className="flex flex-wrap gap-6 text-sm font-semibold text-[#5f4a7a]">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-[#1c0f32]">{item.label}</Link>
              ))}
            </nav>
          )}
          <Link href="/acceso" className="rounded-full bg-[#1c0f32] px-5 py-2 text-sm font-bold text-white hover:bg-[#2e1a49] transition">
            Ingresar
          </Link>
        </div>
        <div className="border-t border-[#ebe4f7] py-4 text-center text-xs text-[#9b88c8]">
          © {new Date().getFullYear()} 4Shine · Todos los derechos reservados
        </div>
      </footer>

    </main>
  );
}
