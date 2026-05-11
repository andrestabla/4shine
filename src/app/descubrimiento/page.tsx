import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import {
  DiscoveryRadarChart,
  DiscoveryCompetenciesChart,
  GlobalIndexDisplay,
  PillarScoreBars,
} from "./DiscoveryShowcaseCharts";

const PILLARS = [
  {
    label: "Shine Within",
    tagline: "El liderazgo que viene de adentro",
    description:
      "Autoconocimiento, inteligencia emocional y gestión del estado interno. Evalúa tu capacidad de liderar desde la claridad y la coherencia personal.",
    accent: "bg-[#7c5f93]",
    light: "bg-[#f2ecff]",
    border: "border-[#d8ccf0]",
  },
  {
    label: "Shine Out",
    tagline: "La presencia que proyectas",
    description:
      "Comunicación, influencia y construcción de relaciones. Mide cómo impactas a tu entorno y la calidad de los vínculos que generas.",
    accent: "bg-[#6a9fd8]",
    light: "bg-[#ebf4ff]",
    border: "border-[#c5ddf5]",
  },
  {
    label: "Shine Up",
    tagline: "La visión que te orienta",
    description:
      "Propósito, pensamiento estratégico y capacidad de decisión. Mide si tienes claridad sobre hacia dónde vas y cómo generas tracción real.",
    accent: "bg-[#9d79c8]",
    light: "bg-[#f5eeff]",
    border: "border-[#ddd0f2]",
  },
  {
    label: "Shine Beyond",
    tagline: "El impacto que dejas",
    description:
      "Desarrollo de equipos, cultura y trascendencia organizacional. Evalúa tu capacidad de construir algo que perdure más allá de ti.",
    accent: "bg-[#d48ab4]",
    light: "bg-[#fff0f8]",
    border: "border-[#f2d1e6]",
  },
];

const FEATURES = [
  { title: "Escala Likert", detail: "107 afirmaciones medidas en frecuencia o nivel de acuerdo para cuantificar autopercepción." },
  { title: "SJT · 19 situaciones reales", detail: "Escenarios de liderazgo bajo presión que revelan criterio aplicado, no solo intención." },
  { title: "Análisis cualitativo IA", detail: "Cada pilar recibe una narrativa ejecutiva generada por IA con patrones, fortalezas y áreas de desarrollo." },
  { title: "16 competencias medidas", detail: "Distribuidas en los 4 pilares. Cada una tiene score individual para un diagnóstico granular." },
  { title: "Acceso permanente", detail: "Tu informe queda vinculado a tu cuenta. Puedes consultarlo en cualquier momento." },
  { title: "Exportable", detail: "Descarga el informe en PDF y los datos de competencias en Excel para seguimiento futuro." },
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

export default function DescubrimientoPublicPage() {
  return (
    <MarketingShell
      title="Descubrimiento · Diagnóstico de liderazgo"
      subtitle="Evalúa tu liderazgo en 4 dimensiones con metodología validada. Obtén un informe ejecutivo con análisis cualitativo generado por IA y un mapa completo de tus competencias."
    >
      {/* Stats strip */}
      <section className="border-y border-[#ddcfee] bg-[#efeaf8]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4 md:px-10 lg:px-14">
          {[
            { value: "125", label: "Preguntas totales", detail: "Diagnóstico integral" },
            { value: "4", label: "Pilares evaluados", detail: "Within · Out · Up · Beyond" },
            { value: "19", label: "Escenarios SJT", detail: "Criterio en acción real" },
            { value: "30–40 min", label: "Duración promedio", detail: "Flexible, a tu ritmo" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#7557a1]">{s.label}</p>
              <p className="mt-1.5 text-3xl font-black tracking-tight text-[#2d1845]">{s.value}</p>
              <p className="mt-1 text-sm text-[#5f4c78]">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1240px] space-y-16 px-6 pb-20 pt-14 md:px-10 lg:px-14">

        {/* Objetivo */}
        <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#7557a1]">Objetivo</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.97] tracking-tight text-[#2d1845]">
              Un mapa claro de<br />dónde estás hoy.
            </h2>
            <p className="mt-5 text-[1rem] leading-relaxed text-[#5f4c78]">
              Descubrimiento mide tu posicionamiento actual como líder en cuatro dimensiones
              complementarias. No es una evaluación de desempeño ni una certificación —
              es un diagnóstico de autoconocimiento ejecutivo que te da un punto de
              referencia sólido para orientar tu desarrollo con método.
            </p>
            <p className="mt-4 text-[1rem] leading-relaxed text-[#5f4c78]">
              El resultado identifica dónde tienes fortalezas consolidadas y qué áreas tienen
              mayor potencial de impacto si las desarrollas intencionalmente.
            </p>
            <div className="mt-6 inline-flex items-center gap-3">
              <Link
                href="/acceso"
                className="rounded-full bg-[#2e1b49] px-6 py-3 text-sm font-bold text-white hover:bg-[#402662]"
              >
                Activar diagnóstico · $50 USD
              </Link>
              <Link
                href="#metodologia"
                className="text-sm font-semibold text-[#4f2c79] underline underline-offset-4 hover:text-[#2d1845]"
              >
                Ver metodología
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-[#d8cfee] bg-white p-6 shadow-[0_12px_40px_rgba(42,20,68,0.06)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7557a1]">Qué obtienes</p>
            <ul className="mt-5 space-y-3">
              {DELIVERABLES.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9d79c8]" />
                  <span className="text-sm leading-snug text-[#4a3560]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4 Pillars */}
        <section id="metodologia">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#7557a1]">Metodología 4Shine</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.97] tracking-tight text-[#2d1845]">
            Los 4 pilares del liderazgo.
          </h2>
          <p className="mt-4 max-w-3xl text-[0.98rem] leading-relaxed text-[#5f4c78]">
            El modelo 4Shine estructura el liderazgo en cuatro dimensiones interdependientes.
            Cada pilar combina preguntas Likert con situaciones de juicio situacional (SJT)
            que revelan cómo actúas cuando hay presión, ambigüedad o decisiones difíciles.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.label}
                className={`rounded-2xl border ${pillar.border} ${pillar.light} p-6`}
              >
                <div className={`mb-3 h-1 w-8 rounded-full ${pillar.accent}`} />
                <h3 className="text-xl font-black text-[#2d1845]">{pillar.label}</h3>
                <p className="text-sm font-semibold text-[#5f4c78]">{pillar.tagline}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#5f4c78]">{pillar.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Methodology dual */}
        <section className="rounded-3xl border border-[#d8cfee] bg-[#1f1232] p-8 text-white md:p-11">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7c5f8]">Metodología dual</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Likert + SJT: más que lo que piensas, lo que haces.
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/14 bg-white/8 p-6">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#c9b8e8]">Escala Likert · 107 ítems</p>
              <h3 className="mt-2 text-xl font-black">Autopercepción cuantificable</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#d8cff0]">
                Afirmaciones sobre comportamientos de liderazgo medidas en escala de frecuencia
                o acuerdo. Te dan una lectura numérica de cómo percibes tu propio desempeño
                en cada competencia.
              </p>
            </div>
            <div className="rounded-2xl border border-white/14 bg-white/8 p-6">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#c9b8e8]">SJT · 19 situaciones</p>
              <h3 className="mt-2 text-xl font-black">Criterio en condiciones reales</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#d8cff0]">
                Escenarios que presentan dilemas de liderazgo reales — ambigüedad, conflicto,
                presión, decisión. Tu elección de respuesta revela tu criterio aplicado, no solo
                tu intención declarada.
              </p>
            </div>
          </div>
        </section>

        {/* Sample product / charts */}
        <section>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#7557a1]">Ejemplo del informe</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.97] tracking-tight text-[#2d1845]">
            Así luce tu resultado.
          </h2>
          <p className="mt-4 max-w-3xl text-[0.98rem] leading-relaxed text-[#5f4c78]">
            Datos de ejemplo. Tu diagnóstico real generará scores propios con análisis IA personalizado.
          </p>

          {/* Global index + Radar */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-3xl border border-[#d8cfee] bg-white p-6 shadow-[0_12px_40px_rgba(42,20,68,0.05)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7557a1]">Índice global</p>
              <GlobalIndexDisplay />
              <div className="mt-2 border-t border-[#ede6f7] pt-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[#7557a1]">Score por pilar</p>
                <PillarScoreBars />
              </div>
            </div>

            <div className="rounded-3xl border border-[#d8cfee] bg-white p-6 shadow-[0_12px_40px_rgba(42,20,68,0.05)]">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7557a1]">Mapa de pilares</p>
              <p className="mt-1 text-sm text-[#5f4c78]">Visualización radial de los 4 ejes de liderazgo</p>
              <DiscoveryRadarChart />
            </div>
          </div>

          {/* Competencies bar chart */}
          <div className="mt-6 rounded-3xl border border-[#d8cfee] bg-white p-6 shadow-[0_12px_40px_rgba(42,20,68,0.05)]">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7557a1]">16 competencias · Score individual</p>
            <p className="mt-1 mb-4 text-sm text-[#5f4c78]">
              Cada barra representa una competencia coloreada por pilar.{" "}
              <span className="font-semibold text-[#7c5f93]">■ Within</span>{" "}
              <span className="font-semibold text-[#6a9fd8]">■ Out</span>{" "}
              <span className="font-semibold text-[#9d79c8]">■ Up</span>{" "}
              <span className="font-semibold text-[#d48ab4]">■ Beyond</span>
            </p>
            <DiscoveryCompetenciesChart />
          </div>

          {/* AI report sample */}
          <div className="mt-6 rounded-3xl border border-[#d8cfee] bg-white p-7 shadow-[0_12px_40px_rgba(42,20,68,0.05)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-[#f4ecff] px-3 py-1.5">
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#7557a1]">Análisis IA · Shine Up</p>
              </div>
              <span className="text-[10px] font-semibold text-[#9d8cb5]">Ejemplo de lectura ejecutiva</span>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-[#4a3560]">
              {SAMPLE_REPORT.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <p className="mt-5 text-[11px] italic text-[#9e8fba]">
              Este análisis es un ejemplo. El informe real se genera con IA a partir de tus respuestas específicas.
            </p>
          </div>
        </section>

        {/* Features grid */}
        <section>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#7557a1]">Características</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.97] tracking-tight text-[#2d1845]">
            Qué hace único a este diagnóstico.
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl border border-[#d8cfee] bg-white p-6">
                <h3 className="text-base font-black text-[#2d1845]">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5f4c78]">{f.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="rounded-3xl bg-[#1f1232] p-9 text-white md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7c5f8]">Pago único · Sin suscripción</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Activa tu diagnóstico hoy.
              </h2>
              <p className="mt-4 max-w-xl text-[1rem] leading-relaxed text-[#dfd6ef]">
                Acceso inmediato. El diagnóstico queda vinculado a tu cuenta y puedes consultar
                tu informe completo en cualquier momento. Una inversión puntual para entender
                exactamente dónde estás como líder.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/acceso"
                  className="rounded-full bg-[#f2b24b] px-7 py-3.5 text-sm font-extrabold text-[#2a1b3f] hover:bg-[#f6c56d]"
                >
                  Activar diagnóstico
                </Link>
                <Link
                  href="/planes-precios"
                  className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-bold text-white hover:bg-white/10"
                >
                  Ver todos los planes
                </Link>
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 self-center rounded-2xl border border-white/16 bg-white/10 px-8 py-6 lg:items-center">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-[#c9b8e8]">Precio</p>
              <p className="text-[3.5rem] font-black leading-none text-white">$50</p>
              <p className="text-sm font-semibold text-[#c9b8e8]">USD · Pago único</p>
            </div>
          </div>
        </section>

      </div>
    </MarketingShell>
  );
}
