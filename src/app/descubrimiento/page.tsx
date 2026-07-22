import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { loadServerBranding } from "@/lib/server-branding";
import { BlockRenderer } from "@/components/site-builder/BlockRenderer";
import { getPublicPageByKey } from "@/lib/site-pages";
import { getPublicDiscoveryProduct } from "@/lib/server-discovery-product";

import {
  DiscoveryRadarChart,
  DiscoveryCompetenciesChart,
  GlobalIndexDisplay,
  PillarScoreBars,
} from "./DiscoveryShowcaseCharts";

export const dynamic = 'force-dynamic';

const PILLARS = [
  {
    num: "01",
    label: "Shine Within",
    tagline: "El liderazgo que viene de adentro",
    description:
      "Autoconocimiento, inteligencia emocional y gestión del estado interno. Evalúa tu capacidad de liderar desde la claridad y la coherencia personal.",
    gradient: "from-[#5b2d8a] to-[#7c4fa8]",
    chip: "bg-[#f2ecff] text-[#5b2d8a]",
    dot: "bg-[#7c5f93]",
  },
  {
    num: "02",
    label: "Shine Out",
    tagline: "La presencia que proyectas",
    description:
      "Comunicación, influencia y construcción de relaciones. Mide cómo impactas a tu entorno y la calidad de los vínculos que generas.",
    gradient: "from-[#1e5fa0] to-[#3a82c7]",
    chip: "bg-[#ebf4ff] text-[#1e5fa0]",
    dot: "bg-[#6a9fd8]",
  },
  {
    num: "03",
    label: "Shine Up",
    tagline: "La visión que te orienta",
    description:
      "Propósito, pensamiento estratégico y capacidad de decisión. Mide si tienes claridad sobre hacia dónde vas y cómo generas tracción real.",
    gradient: "from-[#7040b0] to-[#9d79c8]",
    chip: "bg-[#f5eeff] text-[#7040b0]",
    dot: "bg-[#9d79c8]",
  },
  {
    num: "04",
    label: "Shine Beyond",
    tagline: "El impacto que dejas",
    description:
      "Desarrollo de equipos, cultura y trascendencia organizacional. Evalúa tu capacidad de construir algo que perdure más allá de ti.",
    gradient: "from-[#a0306a] to-[#d48ab4]",
    chip: "bg-[#fff0f8] text-[#a0306a]",
    dot: "bg-[#d48ab4]",
  },
];

const FEATURES = [
  { num: "01", title: "Escala Likert", detail: "107 afirmaciones medidas en frecuencia o nivel de acuerdo para cuantificar autopercepción.", icon: "📊" },
  { num: "02", title: "SJT · 19 situaciones", detail: "Escenarios de liderazgo bajo presión que revelan criterio aplicado, no solo intención.", icon: "🎯" },
  { num: "03", title: "Análisis cualitativo IA", detail: "Cada pilar recibe una narrativa ejecutiva generada por IA con patrones, fortalezas y áreas de desarrollo.", icon: "🤖" },
  { num: "04", title: "16 competencias medidas", detail: "Distribuidas en los 4 pilares. Cada una tiene score individual para un diagnóstico granular.", icon: "📈" },
  { num: "05", title: "Acceso permanente", detail: "Tu informe queda vinculado a tu cuenta. Puedes consultarlo en cualquier momento.", icon: "🔐" },
  { num: "06", title: "Exportable", detail: "Descarga el informe en PDF y los datos de competencias en Excel para seguimiento futuro.", icon: "⬇️" },
];

const DELIVERABLES = [
  "Índice global de liderazgo (0–100)",
  "Score individual por cada uno de los 4 pilares",
  "Ranking de las 16 competencias con gráfica visual",
  "Análisis narrativo IA por pilar (5 lecturas)",
  "Visión general integrada de tu perfil ejecutivo",
  "Informe PDF descargable con lectura completa",
  "Hoja de datos Excel para seguimiento en el tiempo",
];

const SAMPLE_REPORT = `Tu perfil muestra una orientación estratégica sólida — Shine Up es tu pilar más desarrollado, lo que indica claridad sobre hacia dónde vas y capacidad real para generar tracción en proyectos complejos. Esta fortaleza es un activo diferencial cuando necesitas articular visión o convencer stakeholders.

Shine Out es el área con mayor potencial de desarrollo: la brecha entre tu visión (Up, 81) y tu capacidad de comunicarla con impacto (Out, 58) es frecuente en líderes técnicos que han crecido por resultados más que por influencia directa. Desarrollar deliberadamente tu presencia ejecutiva y comunicación estratégica es la palanca de mayor retorno en esta etapa de tu carrera.`;

export default async function DescubrimientoPublicPage() {
  // Precio y checkout salen del catálogo (Admin → Planes → Productos), no
  // escritos aquí: la página anunciaba $50 mientras el catálogo cobraba $15.
  const [branding, builderPage, discoveryProduct] = await Promise.all([
    loadServerBranding(),
    getPublicPageByKey('descubrimiento'),
    getPublicDiscoveryProduct(),
  ]);
  if (builderPage && !builderPage.isVisible) notFound();
  if (builderPage?.useBuilder && builderPage.sections.length > 0) {
    // La URL pudo cambiar desde el builder: la ruta original redirige a la nueva.
    if (builderPage.slug && builderPage.slug !== 'descubrimiento') redirect(`/${builderPage.slug}`);
    return (
      <MarketingShell>
        <BlockRenderer sections={builderPage.sections} />
      </MarketingShell>
    );
  }
  const platformName = branding.settings.platformName?.trim() || '4Shine';

  return (
    <MarketingShell
      title="Descubrimiento · Diagnóstico de liderazgo"
      subtitle="Evalúa tu liderazgo en 4 dimensiones con metodología validada. Obtén un informe ejecutivo con análisis cualitativo generado por IA y un mapa completo de tus competencias."
    >

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-darker) 0%, var(--brand-dark) 40%, var(--brand-primary) 70%, color-mix(in srgb, var(--brand-primary) 80%, white) 100%)",
          }}
        />
        {/* decorative blobs */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full opacity-25"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 60%, white) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/4 h-[320px] w-[320px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--brand-accent) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[1240px] px-6 pb-20 pt-20 md:px-10 lg:px-14 lg:pb-28 lg:pt-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_440px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.3em] text-white/80">
                Diagnóstico de liderazgo · {platformName}
              </div>
              <h1 className="mt-6 text-[3rem] font-black leading-[0.92] tracking-tight text-white sm:text-[4rem] lg:text-[4.5rem]">
                Conoce tu<br />
                <span
                  style={{
                    background: "linear-gradient(90deg, var(--brand-accent) 0%, var(--brand-accent-strong) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  liderazgo
                </span>
                <br />con precisión.
              </h1>
              <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-white/72">
                125 preguntas. 4 pilares. Análisis IA personalizado. Un informe ejecutivo
                que te muestra exactamente dónde estás hoy como líder.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={discoveryProduct.checkoutUrl}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:opacity-90"
                  style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
                >
                  {discoveryProduct.ctaLabel} · {discoveryProduct.priceLabel} {discoveryProduct.currencyCode}
                </Link>
                <Link
                  href="#metodologia"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white/90 transition hover:bg-white/10"
                >
                  Ver metodología
                </Link>
              </div>
            </div>

            {/* Stats card */}
            <div className="rounded-3xl border border-white/14 bg-white/8 p-7 backdrop-blur-sm">
              <p className="mb-5 text-[11px] font-black uppercase tracking-[0.28em] text-white/55">
                En números
              </p>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { value: "125", label: "Preguntas totales", sub: "Diagnóstico integral" },
                  { value: "4", label: "Pilares evaluados", sub: "Within · Out · Up · Beyond" },
                  { value: "19", label: "Escenarios SJT", sub: "Criterio aplicado" },
                  { value: "35 min", label: "Duración promedio", sub: "A tu ritmo" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
                    <p className="text-2xl font-black leading-none text-white">{s.value}</p>
                    <p className="mt-1.5 text-[11px] font-bold text-white/70">{s.label}</p>
                    <p className="mt-0.5 text-[10px] text-white/45">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1240px] space-y-20 px-6 pb-24 pt-20 md:px-10 lg:px-14">

        {/* ── Objetivo + Deliverables ───────────────────────────────────── */}
        <section className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
              style={{ background: 'var(--brand-surface-strong)', color: 'var(--brand-accent-strong)' }}
            >
              Objetivo
            </span>
            <h2
              className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-tight lg:text-[3rem]"
              style={{ color: 'var(--brand-primary)' }}
            >
              Un mapa claro de<br />dónde estás hoy.
            </h2>
            <p className="mt-5 text-[1rem] leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>
              Descubrimiento mide tu posicionamiento actual como líder en cuatro dimensiones
              complementarias. No es una evaluación de desempeño — es un diagnóstico de
              autoconocimiento ejecutivo que te da un punto de referencia sólido para
              orientar tu desarrollo con método.
            </p>
            <p className="mt-4 text-[1rem] leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>
              El resultado identifica fortalezas consolidadas y las áreas con mayor potencial
              de impacto si las desarrollas intencionalmente.
            </p>
          </div>

          <div
            className="rounded-3xl p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
            style={{
              background: "linear-gradient(145deg, var(--brand-darker) 0%, var(--brand-dark) 100%)",
            }}
          >
            <p
              className="text-[11px] font-black uppercase tracking-[0.26em]"
              style={{ color: 'color-mix(in srgb, var(--brand-accent) 40%, white)' }}
            >
              Lo que obtienes
            </p>
            <ul className="mt-5 space-y-3">
              {DELIVERABLES.map((item, i) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black"
                    style={{
                      background: 'color-mix(in srgb, var(--brand-accent) 20%, transparent)',
                      color: 'var(--brand-accent)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-snug" style={{ color: 'color-mix(in srgb, var(--brand-accent) 15%, white)' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-7 border-t border-white/10 pt-6">
              <Link
                href={discoveryProduct.checkoutUrl}
                className="block rounded-full py-3 text-center text-sm font-extrabold transition hover:opacity-90"
                style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
              >
                {discoveryProduct.ctaLabel} · {discoveryProduct.priceLabel} {discoveryProduct.currencyCode}
              </Link>
            </div>
          </div>
        </section>

        {/* ── 4 Pillars ─────────────────────────────────────────────────── */}
        <section id="metodologia">
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
            style={{ background: 'var(--brand-surface-strong)', color: 'var(--brand-accent-strong)' }}
          >
            Metodología {platformName}
          </span>
          <h2
            className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-tight lg:text-[3rem]"
            style={{ color: 'var(--brand-primary)' }}
          >
            Los 4 pilares del liderazgo.
          </h2>
          <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>
            Cada pilar combina preguntas Likert con situaciones de juicio situacional (SJT)
            que revelan cómo actúas cuando hay presión, ambigüedad o decisiones difíciles.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.label}
                className="group relative overflow-hidden rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(0,0,0,0.13)]"
                style={{ background: "white" }}
              >
                {/* top gradient bar */}
                <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${pillar.gradient} mb-5`} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black" style={{ color: 'var(--brand-primary)' }}>{pillar.label}</h3>
                    <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--brand-ink-soft)' }}>{pillar.tagline}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${pillar.chip}`}>
                    {pillar.num}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>{pillar.description}</p>
                {/* decorative circle */}
                <div
                  className={`pointer-events-none absolute -right-8 -bottom-8 h-28 w-28 rounded-full opacity-8 bg-gradient-to-br ${pillar.gradient}`}
                />
              </article>
            ))}
          </div>
        </section>

        {/* ── Methodology dual ─────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-3xl p-9 text-white md:p-12"
          style={{
            background: "linear-gradient(135deg, var(--brand-darker) 0%, var(--brand-dark) 50%, var(--brand-primary) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 60%, white) 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
          />
          <span
            className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
            style={{ color: 'color-mix(in srgb, var(--brand-accent) 40%, white)' }}
          >
            Metodología dual
          </span>
          <h2 className="mt-4 text-[2.2rem] font-black tracking-tight md:text-[2.8rem]">
            Likert + SJT: más que lo que<br />piensas, lo que haces.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              {
                tag: "Escala Likert · 107 ítems",
                title: "Autopercepción cuantificable",
                body: "Afirmaciones sobre comportamientos de liderazgo medidas en escala de frecuencia o acuerdo. Te dan una lectura numérica de cómo percibes tu propio desempeño en cada competencia.",
                accent: "color-mix(in srgb, var(--brand-accent) 40%, white)",
              },
              {
                tag: "SJT · 19 situaciones",
                title: "Criterio en condiciones reales",
                body: "Escenarios que presentan dilemas de liderazgo reales — ambigüedad, conflicto, presión, decisión. Tu elección de respuesta revela tu criterio aplicado, no solo tu intención declarada.",
                accent: "var(--brand-accent)",
              },
            ].map((block) => (
              <div
                key={block.tag}
                className="rounded-2xl border border-white/12 bg-white/7 p-7 backdrop-blur-sm"
              >
                <p
                  className="text-[10px] font-black uppercase tracking-[0.26em]"
                  style={{ color: block.accent }}
                >
                  {block.tag}
                </p>
                <h3 className="mt-3 text-xl font-black text-white">{block.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{block.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sample product / charts ──────────────────────────────────── */}
        <section>
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
            style={{ background: 'var(--brand-surface-strong)', color: 'var(--brand-accent-strong)' }}
          >
            Ejemplo del informe
          </span>
          <h2
            className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-tight lg:text-[3rem]"
            style={{ color: 'var(--brand-primary)' }}
          >
            Así luce tu resultado.
          </h2>
          <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>
            Datos de ejemplo. Tu diagnóstico real generará scores propios con análisis IA personalizado.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[340px_1fr]">
            <div
              className="rounded-3xl border bg-white p-7 shadow-[0_12px_50px_rgba(0,0,0,0.07)]"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--brand-accent-strong)' }}>Índice global</p>
              <GlobalIndexDisplay />
              <div className="mt-4 border-t pt-5" style={{ borderColor: 'var(--brand-border)' }}>
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: 'var(--brand-accent-strong)' }}>Score por pilar</p>
                <PillarScoreBars />
              </div>
            </div>

            <div
              className="rounded-3xl border bg-white p-7 shadow-[0_12px_50px_rgba(0,0,0,0.07)]"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--brand-accent-strong)' }}>Mapa de pilares</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--brand-ink-soft)' }}>Visualización radial de los 4 ejes de liderazgo</p>
              <DiscoveryRadarChart />
            </div>
          </div>

          <div
            className="mt-6 rounded-3xl border bg-white p-7 shadow-[0_12px_50px_rgba(0,0,0,0.07)]"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: 'var(--brand-accent-strong)' }}>16 competencias · Score individual</p>
            <p className="mb-5 text-sm" style={{ color: 'var(--brand-ink-soft)' }}>
              Cada barra representa una competencia coloreada por pilar.{" "}
              <span className="font-semibold text-[#7c5f93]">■ Within</span>{" "}
              <span className="font-semibold text-[#6a9fd8]">■ Out</span>{" "}
              <span className="font-semibold text-[#9d79c8]">■ Up</span>{" "}
              <span className="font-semibold text-[#d48ab4]">■ Beyond</span>
            </p>
            <DiscoveryCompetenciesChart />
          </div>

          {/* AI sample */}
          <div
            className="mt-6 rounded-3xl p-8"
            style={{ background: "linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-strong) 100%)" }}
          >
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.26em]"
                style={{
                  background: "var(--brand-primary)",
                  color: "white",
                }}
              >
                Análisis IA · Shine Up
              </span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--brand-ink-muted)' }}>Ejemplo de lectura ejecutiva</span>
            </div>
            <div className="space-y-4 text-[0.95rem] leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>
              {SAMPLE_REPORT.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <p className="mt-5 text-[11px] italic" style={{ color: 'var(--brand-ink-muted)' }}>
              Este análisis es un ejemplo. El informe real se genera con IA a partir de tus respuestas específicas.
            </p>
          </div>
        </section>

        {/* ── Features grid ─────────────────────────────────────────────── */}
        <section>
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
            style={{ background: 'var(--brand-surface-strong)', color: 'var(--brand-accent-strong)' }}
          >
            Características
          </span>
          <h2
            className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-tight lg:text-[3rem]"
            style={{ color: 'var(--brand-primary)' }}
          >
            Qué hace único<br />a este diagnóstico.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-[11px] font-black" style={{ color: 'var(--brand-ink-muted)' }}>{f.num}</span>
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ color: 'var(--brand-primary)' }}>{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--brand-ink-soft)' }}>{f.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-3xl p-10 text-white md:p-14"
          style={{
            background: "linear-gradient(135deg, var(--brand-darker) 0%, var(--brand-dark) 50%, var(--brand-primary) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 60%, white) 0%, transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-16 right-20 h-56 w-56 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, var(--brand-accent) 0%, transparent 70%)" }}
          />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span
                className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em]"
                style={{ color: 'color-mix(in srgb, var(--brand-accent) 40%, white)' }}
              >
                Pago único · Sin suscripción
              </span>
              <h2 className="mt-4 text-[2.8rem] font-black leading-[0.93] tracking-tight md:text-[3.5rem]">
                Activa tu<br />diagnóstico hoy.
              </h2>
              <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-white/72">
                Acceso inmediato. Tu informe queda vinculado a tu cuenta para consultarlo
                en cualquier momento. Una inversión puntual para entender exactamente
                dónde estás como líder.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={discoveryProduct.checkoutUrl}
                  className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-extrabold shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5 hover:opacity-90"
                  style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
                >
                  {discoveryProduct.ctaLabel}
                </Link>
                <Link
                  href="/planes-precios"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-3.5 text-sm font-bold text-white/90 transition hover:bg-white/10"
                >
                  Ver todos los planes
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 self-center rounded-2xl border border-white/16 bg-white/8 px-10 py-8 text-center backdrop-blur-sm">
              <p
                className="text-[10px] font-black uppercase tracking-[0.28em]"
                style={{ color: 'color-mix(in srgb, var(--brand-accent) 40%, white)' }}
              >
                Precio
              </p>
              <p
                className="mt-1 text-[4rem] font-black leading-none"
                style={{
                  background: "linear-gradient(90deg, var(--brand-accent) 0%, var(--brand-accent-strong) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {discoveryProduct.priceLabel}
              </p>
              <p
                className="mt-1 text-sm font-semibold"
                style={{ color: 'color-mix(in srgb, var(--brand-accent) 40%, white)' }}
              >
                {discoveryProduct.currencyCode} · Pago único
              </p>
            </div>
          </div>
        </section>

      </div>
    </MarketingShell>
  );
}
