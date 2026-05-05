import Link from 'next/link';

const pillars = [
  {
    title: 'Shine Within',
    description: 'Autoliderazgo, identidad y claridad personal para decidir con conciencia.',
  },
  {
    title: 'Shine Out',
    description: 'Comunicación estratégica, presencia ejecutiva y narrativa de impacto.',
  },
  {
    title: 'Shine Up',
    description: 'Pensamiento estratégico, influencia y toma de decisiones en contextos complejos.',
  },
  {
    title: 'Shine Beyond',
    description: 'Legado, expansión y liderazgo que transforma equipos y ecosistemas.',
  },
];

const stories = [
  {
    name: 'Líder de tecnología, LATAM',
    text: 'En 12 semanas logré convertir mi visión en una ruta concreta de desarrollo. Mi equipo mejoró foco y coordinación.',
  },
  {
    name: 'Directiva de educación',
    text: '4Shine me ayudó a integrar estrategia con bienestar. Tomo decisiones más consistentes y lidero con más claridad.',
  },
  {
    name: 'Gerente comercial',
    text: 'Pasé de reaccionar a priorizar con método. Mi comunicación ejecutiva mejoró y crecí en influencia interna.',
  },
];

export default function HomeMarketingPage() {
  return (
    <main className="min-h-screen bg-[#f4f2fa] text-[#261739]">
      <section className="relative overflow-hidden border-b border-[#d8d0ea] bg-[#1c102d] text-white">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source
            src="https://liderazgoestrategico.s3.us-east-1.amazonaws.com/4shine/International_Team_1920x1080.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(108deg,rgba(20,9,36,0.88)_10%,rgba(28,14,45,0.74)_48%,rgba(46,23,62,0.7)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(198,151,255,0.24),transparent_38%),radial-gradient(circle_at_85%_25%,rgba(240,181,95,0.16),transparent_44%)]" />
        <div className="relative mx-auto flex max-w-[1240px] flex-col px-6 pb-18 pt-6 md:px-10 lg:px-14">
          <header className="mb-14 flex items-center justify-between">
            <div className="text-xl font-black tracking-tight">4Shine</div>
            <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
              <Link href="/metodologia" className="hover:text-[#f4cf8e]">Metodología</Link>
              <Link href="/planes-precios" className="hover:text-[#f4cf8e]">Planes y precios</Link>
              <Link href="/afiliados" className="hover:text-[#f4cf8e]">Afiliados</Link>
            </nav>
            <Link href="/acceso" className="rounded-full bg-[#f2b24b] px-5 py-2 text-sm font-extrabold text-[#2a1b3f] hover:bg-[#f6c56d]">Ingresar</Link>
          </header>

          <div className="grid items-end gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-[#e1d6ff]">Plataforma de liderazgo</p>
              <h1 className="max-w-[15ch] text-5xl font-black leading-[0.96] tracking-tight md:text-6xl">Transforma tu liderazgo con método, mentoría y resultados medibles.</h1>
              <p className="mt-6 max-w-[58ch] text-base text-[#ddd6f0] md:text-lg">4Shine existe para acelerar el desarrollo de líderes que necesitan elevar su impacto personal, profesional y estratégico con una ruta estructurada de 6 meses.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/metodologia" className="rounded-full bg-white px-6 py-3 text-sm font-black text-[#2f1a47]">Conocer metodología</Link>
                <Link href="/planes-precios" className="rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">Ver planes</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {pillars.map((pillar) => (
                <article key={pillar.title} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <h2 className="text-lg font-extrabold">{pillar.title}</h2>
                  <p className="mt-2 text-sm text-[#ece6fc]">{pillar.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 py-16 md:px-10 lg:px-14">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#6d5a90]">Experiencias de transformación</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight">Resultados reales en líderes reales</h2>
          </div>
          <Link href="/afiliados" className="text-sm font-bold text-[#4f2c79] underline underline-offset-4">Conoce a nuestros Advisers</Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {stories.map((story) => (
            <article key={story.name} className="rounded-2xl border border-[#d6cced] bg-white p-6 shadow-[0_12px_40px_rgba(42,20,68,0.06)]">
              <p className="text-sm font-black text-[#3d255f]">{story.name}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#5d4a78]">{story.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#ddcfee] bg-[#efeaf8]">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-6 py-14 md:grid-cols-3 md:px-10 lg:px-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#6e5895]">Programa completo</p>
            <p className="mt-2 text-3xl font-black tracking-tight">USD 3000</p>
            <p className="mt-2 text-sm text-[#5f4c79]">Diagnóstico, contenido exclusivo, networking, 10 mentorías y workbooks.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#6e5895]">Duración</p>
            <p className="mt-2 text-3xl font-black tracking-tight">6 meses</p>
            <p className="mt-2 text-sm text-[#5f4c79]">Ruta estructurada con hitos semanales, sesiones y acompañamiento.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#6e5895]">Afiliados</p>
            <p className="mt-2 text-3xl font-black tracking-tight">Advisers</p>
            <p className="mt-2 text-sm text-[#5f4c79]">Mentores especializados que acompañan sesiones individuales y grupales.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
