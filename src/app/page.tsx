import Link from 'next/link';
import { getSitePages } from '@/lib/site-settings';

// ── Data ─────────────────────────────────────────────────────────────────────

const pillars = [
  {
    title: 'Shine Within',
    emoji: '🌟',
    gradient: 'linear-gradient(135deg,#5b2d8a,#7c3aad)',
    description: 'Autoliderazgo, identidad y claridad personal para decidir con conciencia.',
    detail: 'Descubres quién eres como líder, qué valores te mueven y cómo tomar decisiones profundamente alineadas con tu propósito.',
  },
  {
    title: 'Shine Out',
    emoji: '💬',
    gradient: 'linear-gradient(135deg,#1e5fa8,#2d7dd2)',
    description: 'Comunicación estratégica, presencia ejecutiva y narrativa de impacto.',
    detail: 'Desarrollas la capacidad de articular ideas con poder, influir con autenticidad y proyectar una presencia ejecutiva real.',
  },
  {
    title: 'Shine Up',
    emoji: '⚡',
    gradient: 'linear-gradient(135deg,#0e7a5a,#15a37a)',
    description: 'Pensamiento estratégico, influencia y toma de decisiones en contextos complejos.',
    detail: 'Elevas tu pensamiento, navegas la ambigüedad y ejerces influencia sin necesitar autoridad directa.',
  },
  {
    title: 'Shine Beyond',
    emoji: '🚀',
    gradient: 'linear-gradient(135deg,#a8420e,#d45a0f)',
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
    name: 'Open Leader',
    label: 'Entrada',
    price: 'Gratis',
    currency: '',
    description: 'Accede a la comunidad de líderes, realiza el diagnóstico de equipo y explora módulos introductorios sin costo.',
    features: [
      'Diagnóstico de cultura de equipo',
      'Comunidad de líderes activos',
      'Módulos de introducción a los pilares',
      'Webinars mensuales con Advisers',
    ],
    cta: 'Comenzar gratis',
    href: '/acceso',
    highlighted: false,
  },
  {
    name: 'Programa Completo',
    label: 'Recomendado',
    price: '3.000',
    currency: 'USD',
    description: 'Ruta estructurada de 6 meses con acompañamiento personalizado, metodología exclusiva y certificación.',
    features: [
      'Trayectoria completa de 6 meses',
      '10 sesiones individuales con tu Adviser',
      'Workbooks y metodología exclusiva',
      'Networking con líderes del programa',
      'Certificación 4Shine Leadership',
      'Diagnóstico avanzado de los 4 pilares',
    ],
    cta: 'Ver planes completos',
    href: '/planes-precios',
    highlighted: true,
  },
];

const advisers = [
  {
    initial: 'M',
    gradient: 'linear-gradient(135deg,#5b2d8a,#8e44c8)',
    name: 'María Torres',
    specialty: 'Liderazgo Estratégico',
    years: '15 años de experiencia',
    // IMAGEN: Reemplazar con headshot profesional de alta calidad (400×400px, fondo neutro)
  },
  {
    initial: 'J',
    gradient: 'linear-gradient(135deg,#1e5fa8,#2d7dd2)',
    name: 'Jorge Espinosa',
    specialty: 'Comunicación Ejecutiva',
    years: '12 años de experiencia',
    // IMAGEN: Reemplazar con headshot profesional de alta calidad (400×400px, fondo neutro)
  },
  {
    initial: 'L',
    gradient: 'linear-gradient(135deg,#0e7a5a,#15a37a)',
    name: 'Laura Méndez',
    specialty: 'Transformación Organizacional',
    years: '18 años de experiencia',
    // IMAGEN: Reemplazar con headshot profesional de alta calidad (400×400px, fondo neutro)
  },
];

const metrics = [
  { value: '+120', label: 'Líderes activos' },
  { value: '6', label: 'Meses de programa' },
  { value: '4', label: 'Pilares de liderazgo' },
  { value: '+25', label: 'Advisers certificados' },
];

const HOME_NAV_ITEMS = [
  { href: '/metodologia', label: 'Metodología', pageKey: 'metodologia' },
  { href: '/descubrimiento', label: 'Descubrimiento', pageKey: 'descubrimiento' },
  { href: '/planes-precios', label: 'Planes y precios', pageKey: 'planes_precios' },
  { href: '/afiliados', label: 'Afiliados', pageKey: 'afiliados' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export default async function HomeMarketingPage() {
  const enabledPages = await getSitePages();
  const navItems = HOME_NAV_ITEMS.filter((item) => enabledPages[item.pageKey] !== false);

  return (
    <main className="min-h-screen bg-[#f4f2fa] text-[#1c0f32]">

      {/* ── 1. HERO ── video background, nav, headline, pillar mini-cards ── */}
      <section className="relative overflow-hidden border-b border-[#d8d0ea] bg-[#1c102d] text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay loop muted playsInline preload="metadata" aria-hidden="true"
        >
          {/* VIDEO: hero corporativo — líderes en contexto (1920×1080, .mp4) */}
          <source src="https://liderazgoestrategico.s3.us-east-1.amazonaws.com/4shine/International_Team_1920x1080.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(20,9,36,0.90)_10%,rgba(28,14,45,0.76)_50%,rgba(46,23,62,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(198,151,255,0.26),transparent_38%),radial-gradient(circle_at_84%_24%,rgba(240,181,95,0.18),transparent_44%)]" />

        <div className="relative mx-auto flex max-w-[1240px] flex-col px-6 pb-20 pt-6 md:px-10 lg:px-14">
          {/* Nav */}
          <header className="mb-14 flex items-center justify-between">
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
            <Link href="/acceso" className="rounded-full bg-[#f2b24b] px-5 py-2 text-sm font-extrabold text-[#2a1b3f] hover:bg-[#f6c56d] transition">Ingresar</Link>
          </header>

          {/* Headline */}
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.32em] text-[#c9b8ff]">Plataforma de liderazgo</p>
              <h1 className="max-w-[14ch] text-5xl font-black leading-[0.94] tracking-tight md:text-6xl lg:text-7xl">
                Transforma tu liderazgo con método, mentoría y resultados medibles.
              </h1>
              <p className="mt-6 max-w-[54ch] text-base text-[#ddd6f0] md:text-lg leading-relaxed">
                4Shine existe para acelerar el desarrollo de líderes que necesitan elevar su impacto personal, profesional y estratégico con una ruta estructurada de 6 meses.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/metodologia" className="rounded-full bg-white px-7 py-3 text-sm font-black text-[#2f1a47] hover:bg-[#f0eaff] transition">Conocer metodología</Link>
                <Link href="/planes-precios" className="rounded-full border border-white/40 px-7 py-3 text-sm font-bold text-white hover:bg-white/10 transition">Ver planes</Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {pillars.map((p) => (
                <article key={p.title} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm hover:bg-white/15 transition">
                  <span className="text-2xl">{p.emoji}</span>
                  <h2 className="mt-2 text-base font-extrabold">{p.title}</h2>
                  <p className="mt-1.5 text-sm leading-snug text-[#e8e0fc]">{p.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. IMPACT METRICS ── */}
      <section className="bg-[#14082a] text-white">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-0 px-6 md:grid-cols-4 md:px-10 lg:px-14">
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

      {/* ── 3. POR QUÉ EXISTE 4SHINE ── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1240px] items-center gap-16 px-6 py-20 md:px-10 lg:grid-cols-2 lg:px-14">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">Nuestro propósito</p>
            <h2 className="max-w-[22ch] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
              Para líderes que saben que hay más en ellos.
            </h2>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-[#4a3665] md:text-lg">
              4Shine nació porque el liderazgo real no se improvisa ni se aprende en un curso de 8 horas. Nació para quienes están dispuestos a trabajar con método, recibir acompañamiento de alto nivel y medir su transformación con honestidad.
            </p>
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-[#4a3665]">
              No somos una plataforma de contenido. Somos una experiencia de desarrollo que combina herramientas, comunidad, diagnóstico y mentores especializados en un solo programa estructurado.
            </p>
            <Link href="/metodologia" className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[#5b2d8a] px-6 py-3 text-sm font-bold text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white transition">
              Ver metodología completa
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>

          {/* IMAGEN: foto de líder en acción, contexto profesional real — 640×480px, luz natural, warmth */}
          <div className="relative overflow-hidden rounded-3xl aspect-[4/3] bg-gradient-to-br from-[#2e1a49] to-[#5b2d8a] flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(198,151,255,0.3),transparent_60%)]" />
            <div className="relative text-center px-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="4" y="4" width="24" height="24" rx="4" stroke="white" strokeWidth="2"/><path d="M4 12h24M12 4v24" stroke="white" strokeWidth="2" strokeDasharray="3 2"/></svg>
              </div>
              <p className="text-sm font-semibold text-white/70">IMAGEN</p>
              <p className="mt-1 text-xs text-white/50">Foto de líder en contexto profesional real</p>
              <p className="text-xs text-white/40">640 × 480 px · luz natural</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. LA PLATAFORMA EN ACCIÓN ── */}
      <section className="bg-[#f4f2fa]">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">La plataforma</p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Conoce 4Shine por dentro.</h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-base text-[#5e4b78] md:text-lg">
              Un espacio diseñado para que tu desarrollo no dependa del azar. Todo en un solo lugar: ruta, contenido, mentores y comunidad.
            </p>
          </div>

          {/* VIDEO: tour de la plataforma — 2 min, screencast de alta calidad, narración en off */}
          <div className="relative mx-auto max-w-[900px] overflow-hidden rounded-3xl bg-[#1c102d] shadow-[0_40px_80px_rgba(28,16,45,0.22)]">
            <div className="aspect-video flex flex-col items-center justify-center gap-4 px-8 text-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 backdrop-blur transition hover:bg-white/20 cursor-pointer"
                style={{ boxShadow: '0 0 0 12px rgba(255,255,255,0.06)' }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M10 7l12 7-12 7V7z" fill="white"/>
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold text-white">VIDEO</p>
                <p className="mt-1 text-sm text-white/60">Tour de la plataforma · 2 minutos</p>
                <p className="mt-0.5 text-xs text-white/40">Reemplazar con video embed (YouTube / Vimeo / S3)</p>
              </div>
            </div>
          </div>

          {/* Feature highlights below video */}
          <div className="mx-auto mt-12 grid max-w-[900px] gap-6 sm:grid-cols-3">
            {[
              { emoji: '🗺️', title: 'Trayectoria estructurada', text: 'Ruta clara semana a semana con hitos y entregables concretos.' },
              { emoji: '🎯', title: 'Diagnóstico profundo', text: 'Mide tu punto de partida en los 4 pilares con herramientas validadas.' },
              { emoji: '👥', title: 'Comunidad activa', text: 'Comparte el camino con líderes que tienen el mismo nivel de ambición.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-[#d6cced] bg-white p-6 shadow-[0_8px_24px_rgba(42,20,68,0.05)]">
                <span className="text-3xl">{f.emoji}</span>
                <h3 className="mt-3 text-base font-black text-[#1c0f32]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5d4a78]">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. LOS 4 PILARES ── */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">El programa</p>
              <h2 className="max-w-[24ch] text-4xl font-black tracking-tight md:text-5xl">
                Cuatro dimensiones. Una transformación completa.
              </h2>
            </div>
            <Link href="/metodologia" className="whitespace-nowrap text-sm font-bold text-[#5b2d8a] underline underline-offset-4 hover:text-[#7c3aad]">
              Ver metodología →
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <article
                key={p.title}
                className="group relative overflow-hidden rounded-3xl border border-[#e8e0f8] bg-white shadow-[0_8px_32px_rgba(42,20,68,0.06)] transition hover:shadow-[0_16px_48px_rgba(42,20,68,0.12)] hover:-translate-y-1"
              >
                <div className="h-2 w-full" style={{ background: p.gradient }} />
                <div className="p-6">
                  <span className="text-3xl">{p.emoji}</span>
                  <h3 className="mt-3 text-lg font-black text-[#1c0f32]">{p.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-[#3d255f]">{p.description}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[#6b5487]">{p.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. EXPERIENCIAS DE TRANSFORMACIÓN ── */}
      <section className="bg-[#1c102d] text-white">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#c9b8ff]">Testimonios</p>
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
                <div className="mb-4 text-4xl font-black leading-none text-[#f2b24b] select-none">"</div>
                <p className="flex-1 text-[15px] leading-relaxed text-[#e8e0fc]">{s.text}</p>
                <div className="mt-7 flex items-center gap-3">
                  {/* IMAGEN: foto del líder (80×80px, circular) — reemplazar div con <img> */}
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-black text-white shadow"
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

      {/* ── 7. PLANES Y PRECIOS ── */}
      <section className="bg-[#f4f2fa]">
        <div className="mx-auto max-w-[1240px] px-6 py-20 md:px-10 lg:px-14">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">Inversión</p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Elige tu punto de entrada.</h2>
            <p className="mx-auto mt-4 max-w-[48ch] text-base text-[#5e4b78]">
              Sea cual sea tu momento, hay una forma de empezar. Cuando estés listo para ir más lejos, el programa completo te espera.
            </p>
          </div>

          <div className="mx-auto grid max-w-[820px] gap-6 sm:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex flex-col overflow-hidden rounded-3xl border ${
                  plan.highlighted
                    ? 'border-[#5b2d8a] bg-[#1c102d] text-white shadow-[0_24px_64px_rgba(91,45,138,0.28)]'
                    : 'border-[#d6cced] bg-white text-[#1c0f32] shadow-[0_8px_32px_rgba(42,20,68,0.06)]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f2b24b] to-[#e07b3e]" />
                )}
                <div className="p-8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`rounded-full px-3 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                          plan.highlighted ? 'bg-[#f2b24b]/20 text-[#f2b24b]' : 'bg-[#efeaf8] text-[#7557a1]'
                        }`}
                      >
                        {plan.label}
                      </span>
                      <h3 className="mt-3 text-xl font-black">{plan.name}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      {plan.currency && <span className={`text-xs font-bold ${plan.highlighted ? 'text-[#c9b8ff]' : 'text-[#7557a1]'}`}>{plan.currency}</span>}
                      <p className={`text-3xl font-black leading-none ${plan.highlighted ? 'text-[#f2b24b]' : 'text-[#1c0f32]'}`}>{plan.price}</p>
                    </div>
                  </div>
                  <p className={`mt-4 text-sm leading-relaxed ${plan.highlighted ? 'text-[#c9b8ff]' : 'text-[#5d4a78]'}`}>{plan.description}</p>
                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <svg className={`mt-0.5 shrink-0 ${plan.highlighted ? 'text-[#f2b24b]' : 'text-[#5b2d8a]'}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className={plan.highlighted ? 'text-[#ddd6f0]' : 'text-[#4a3665]'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto px-8 pb-8">
                  <Link
                    href={plan.href}
                    className={`block w-full rounded-full py-3 text-center text-sm font-extrabold transition ${
                      plan.highlighted
                        ? 'bg-[#f2b24b] text-[#1c0f32] hover:bg-[#f6c56d]'
                        : 'border-2 border-[#5b2d8a] text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white'
                    }`}
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
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">Advisers</p>
              <h2 className="max-w-[20ch] text-4xl font-black leading-[1.05] tracking-tight md:text-5xl">
                Aprende de quienes ya lo han vivido.
              </h2>
              <p className="mt-6 max-w-[50ch] text-base leading-relaxed text-[#4a3665] md:text-lg">
                Cada Adviser de 4Shine ha liderado equipos, tomado decisiones difíciles y transitado su propia transformación. No son coaches genéricos — son practicantes del liderazgo que acompañan desde la experiencia real.
              </p>
              <p className="mt-4 max-w-[50ch] text-sm leading-relaxed text-[#6b5487]">
                Nuestros Advisers acompañan sesiones individuales y grupales, retroalimentan con profundidad y se convierten en aliados del desarrollo de cada líder en el programa.
              </p>
              <Link
                href="/afiliados"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#5b2d8a] underline underline-offset-4 hover:text-[#7c3aad]"
              >
                Conocer a todos los Advisers →
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-3">
              {advisers.map((a) => (
                <article key={a.name} className="flex flex-col items-center rounded-2xl border border-[#e8e0f8] bg-[#faf8ff] p-5 text-center shadow-[0_4px_16px_rgba(42,20,68,0.05)]">
                  {/* IMAGEN: headshot profesional 400×400px — reemplazar div con <img className="h-20 w-20 rounded-full object-cover"> */}
                  <div
                    className="mb-3 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg"
                    style={{ background: a.gradient }}
                  >
                    {a.initial}
                  </div>
                  <p className="text-sm font-black text-[#1c0f32]">{a.name}</p>
                  <p className="mt-1 text-xs font-semibold text-[#5b2d8a]">{a.specialty}</p>
                  <p className="mt-1 text-xs text-[#8b75a8]">{a.years}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. CONVIÉRTETE EN AFILIADO ── */}
      <section className="relative overflow-hidden bg-[#1c102d]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(242,178,75,0.18),transparent_55%),radial-gradient(ellipse_at_80%_30%,rgba(91,45,138,0.4),transparent_60%)]" />

        {/* IMAGEN: foto de profesionales en entorno colaborativo, cálida y dinámica — 1920×600px, posición background-center */}

        <div className="relative mx-auto max-w-[1240px] px-6 py-24 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[720px] text-center">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-[#f2b24b]">Programa de afiliados</p>
            <h2 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl">
              ¿Eres experto? Multiplica tu impacto como Adviser.
            </h2>
            <p className="mx-auto mt-6 max-w-[52ch] text-base leading-relaxed text-[#c9b8ff] md:text-lg">
              Si tienes experiencia probada en liderazgo, desarrollo organizacional, comunicación ejecutiva u otras disciplinas de alto impacto, puedes prestar tus servicios en modalidad de afiliado dentro de la plataforma 4Shine.
            </p>
            <p className="mx-auto mt-4 max-w-[50ch] text-sm leading-relaxed text-[#9b88c8]">
              Conectamos tu experiencia con líderes que están listos para crecer. Tú pones el expertise; nosotros ponemos la comunidad, la plataforma y el programa.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/afiliados"
                className="rounded-full bg-[#f2b24b] px-8 py-3.5 text-sm font-extrabold text-[#1c0f32] hover:bg-[#f6c56d] transition"
              >
                Postularme como Adviser
              </Link>
              <Link
                href="/metodologia"
                className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition"
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
                  <p className="text-lg font-black text-[#f2b24b]">{b.value}</p>
                  <p className="mt-1 text-xs text-[#9b88c8]">{b.label}</p>
                </div>
              ))}
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
                <Link key={item.href} href={item.href} className="hover:text-[#1c0f32] transition">{item.label}</Link>
              ))}
            </nav>
          )}
          <div className="flex items-center gap-4">
            <Link href="/acceso" className="rounded-full bg-[#1c0f32] px-5 py-2 text-sm font-bold text-white hover:bg-[#2e1a49] transition">Ingresar</Link>
          </div>
        </div>
        <div className="border-t border-[#ebe4f7] py-4 text-center text-xs text-[#9b88c8]">
          © {new Date().getFullYear()} 4Shine · Todos los derechos reservados
        </div>
      </footer>

    </main>
  );
}
