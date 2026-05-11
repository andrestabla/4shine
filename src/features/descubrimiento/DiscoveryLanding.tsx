"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  FileText,
  Globe,
  Layers,
  Loader2,
  PartyPopper,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import type { CommercialProductRecord } from "@/features/access/types";
import { useUser } from "@/context/UserContext";

interface DiscoveryLandingProps {
  discoveryProduct: CommercialProductRecord | null;
}

const PILLARS = [
  {
    code: "within",
    label: "Shine Within",
    tagline: "El liderazgo que viene de adentro",
    description:
      "Autoconocimiento, inteligencia emocional y gestión del estado interno. Mide tu capacidad para liderar desde la claridad personal.",
    accent: "from-[#452056] to-[#7c5f93]",
    textAccent: "text-[#7c5f93]",
    dotColor: "bg-[#7c5f93]",
  },
  {
    code: "out",
    label: "Shine Out",
    tagline: "La presencia que proyectas",
    description:
      "Comunicación, influencia y construcción de relaciones. Evalúa cómo impactas a quienes te rodean y cómo te percibe tu entorno.",
    accent: "from-[#3a5f90] to-[#6a9fd8]",
    textAccent: "text-[#6a9fd8]",
    dotColor: "bg-[#6a9fd8]",
  },
  {
    code: "up",
    label: "Shine Up",
    tagline: "La visión que te orienta",
    description:
      "Propósito, dirección estratégica y capacidad de crecimiento. Mide si tienes claridad sobre hacia dónde vas y cómo generas tracción.",
    accent: "from-[#5a3d8c] to-[#9d79c8]",
    textAccent: "text-[#9d79c8]",
    dotColor: "bg-[#9d79c8]",
  },
  {
    code: "beyond",
    label: "Shine Beyond",
    tagline: "El impacto que dejas",
    description:
      "Desarrollo de equipos, cultura y trascendencia organizacional. Evalúa tu capacidad de construir algo que perdure más allá de ti.",
    accent: "from-[#8c3d6e] to-[#d48ab4]",
    textAccent: "text-[#d48ab4]",
    dotColor: "bg-[#d48ab4]",
  },
];

const FEATURES = [
  {
    icon: Layers,
    title: "Metodología dual",
    description: "Combina escala Likert (autopercepción) con SJT — situaciones reales de liderazgo que revelan cómo actúas, no solo cómo piensas que actúas.",
  },
  {
    icon: Brain,
    title: "Análisis cualitativo IA",
    description: "Cada pilar recibe un análisis narrativo generado por IA que explica tus patrones, fortalezas y áreas de desarrollo con lenguaje ejecutivo.",
  },
  {
    icon: Target,
    title: "Diagnóstico por competencia",
    description: "El resultado desglosa 16 competencias de liderazgo distribuidas en los 4 pilares, con score individual para cada una.",
  },
  {
    icon: FileText,
    title: "Informe ejecutivo exportable",
    description: "Obtienes un informe completo descargable en PDF y una hoja de datos en Excel para seguimiento y comparación futura.",
  },
  {
    icon: Globe,
    title: "Índice global de liderazgo",
    description: "Un número de referencia que sintetiza tu posición actual. Sirve como punto de partida para medir progreso en el tiempo.",
  },
  {
    icon: Users,
    title: "Contexto demográfico",
    description: "El diagnóstico considera tu cargo, industria, años de experiencia y país para contextualizar los resultados correctamente.",
  },
];

const DELIVERABLES = [
  "Índice global de liderazgo (0–100)",
  "Score individual por cada uno de los 4 pilares",
  "Mapa de las 16 competencias con ranking visual",
  "Análisis cualitativo IA para cada pilar",
  "Visión general integrada de tu perfil de liderazgo",
  "Informe PDF descargable con lectura ejecutiva",
  "Exportación de datos en Excel para seguimiento",
];

function formatPrice(product: CommercialProductRecord): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currencyCode,
    maximumFractionDigits: 0,
  }).format(product.priceAmount);
}

export function DiscoveryLanding({ discoveryProduct }: DiscoveryLandingProps) {
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const isPaymentSuccess = searchParams.get("payment") === "success";
  const { refreshBootstrap } = useUser();

  React.useEffect(() => {
    if (!isPaymentSuccess) return;
    // Reload access state so the purchase reflects immediately once webhook processes
    const timer = setTimeout(() => { void refreshBootstrap(); }, 3000);
    return () => clearTimeout(timer);
  }, [isPaymentSuccess, refreshBootstrap]);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/v1/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode: "discovery_4shine" }),
      });
      const json = await res.json() as { ok: boolean; data?: { checkoutUrl: string }; error?: string };
      if (!json.ok || !json.data?.checkoutUrl) {
        setCheckoutError(json.error ?? "No se pudo iniciar el pago. Intenta de nuevo.");
        return;
      }
      window.location.href = json.data.checkoutUrl;
    } catch {
      setCheckoutError("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Payment success banner */}
      {isPaymentSuccess && (
        <div className="flex items-start gap-3 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-5 py-4">
          <PartyPopper size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">¡Pago exitoso! Tu acceso se está activando.</p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Estamos procesando tu compra. En unos segundos se recargará automáticamente para abrir el diagnóstico.
            </p>
          </div>
        </div>
      )}
      {/* Hero */}
      <section className="app-hero-surface relative overflow-hidden px-7 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 60%)" }}
        />
        <div className="relative grid grid-cols-1 gap-8 xl:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-white/80">
              <Compass size={13} />
              <span className="text-[11px] font-black uppercase tracking-[0.28em]">Diagnóstico individual</span>
            </div>
            <h1
              className="app-display-title mt-5 text-[2.4rem] font-semibold leading-[0.93] text-white sm:text-[3rem]"
              data-display-font="true"
            >
              Conoce tu punto<br />de partida como líder.
            </h1>
            <p className="mt-5 max-w-xl text-[1rem] leading-relaxed text-white/78">
              El Diagnóstico 4Shine evalúa tu liderazgo en 4 dimensiones usando metodología
              validada con escala Likert y escenarios situacionales reales. El resultado es
              un informe ejecutivo con análisis cualitativo generado por IA.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {discoveryProduct ? (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#4f2360] shadow-md transition hover:-translate-y-0.5 hover:bg-white/96 disabled:opacity-60"
                >
                  {isCheckingOut ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Zap size={16} />
                  )}
                  {isCheckingOut ? "Redirigiendo a pago..." : `Activar diagnóstico · ${formatPrice(discoveryProduct)}`}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-2 rounded-full bg-white/30 px-6 py-3 text-sm font-semibold text-white/60"
                >
                  <Loader2 size={16} className="animate-spin" />
                  Cargando precio...
                </button>
              )}
              <a
                href="#metodologia"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white"
              >
                Conocer la metodología
                <ArrowRight size={15} />
              </a>
            </div>
            {checkoutError && (
              <p className="mt-3 text-sm text-rose-300">{checkoutError}</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 self-center xl:grid-cols-1 xl:w-44">
            {[
              { value: "125", label: "Preguntas", hint: "Diagnóstico integral" },
              { value: "4", label: "Pilares", hint: "Shine Within · Out · Up · Beyond" },
              { value: "19", label: "Situacionales", hint: "Criterio en acción real" },
              { value: "35m", label: "Duración", hint: "Promedio estimado" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-[1.1rem] border border-white/14 bg-white/10 px-4 py-3"
              >
                <p className="text-[1.6rem] font-semibold leading-none text-white">{s.value}</p>
                <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/60">{s.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-white/50">{s.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Objetivo */}
      <section className="app-panel p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[var(--app-ink)] shrink-0">
            <Target size={20} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--app-muted)]">
              Objetivo del diagnóstico
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--app-ink)] sm:text-2xl">
              Un mapa claro de dónde estás hoy.
            </h2>
            <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-[var(--app-muted)]">
              Descubrimiento mide tu posicionamiento actual como líder en cuatro dimensiones complementarias.
              No es una evaluación de desempeño ni una certificación — es un diagnóstico de autoconocimiento
              ejecutivo que te da un punto de referencia sólido para orientar tu desarrollo con método.
              El resultado identifica dónde tienes fortalezas consolidadas y qué áreas tienen mayor potencial
              de impacto si las desarrollas intencionalmente.
            </p>
          </div>
        </div>
      </section>

      {/* Pilares / Metodología */}
      <section id="metodologia" className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[var(--app-ink)]">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--app-muted)]">Metodología 4Shine</p>
            <h2 className="text-xl font-semibold text-[var(--app-ink)] sm:text-2xl">Los 4 pilares del liderazgo.</h2>
          </div>
        </div>
        <p className="max-w-3xl text-[0.95rem] leading-relaxed text-[var(--app-muted)]">
          El modelo 4Shine estructura el liderazgo en cuatro dimensiones interdependientes.
          Cada pilar combina preguntas Likert (autopercepción cuantificable) con situaciones de juicio
          situacional — SJT — que revelan cómo actúas cuando hay presión, ambigüedad o decisiones difíciles.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.code}
              className="app-panel overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--app-shadow-card)]"
            >
              <div className={`mb-4 h-1 w-10 rounded-full bg-gradient-to-r ${pillar.accent}`} />
              <p className={`text-[11px] font-extrabold uppercase tracking-[0.26em] ${pillar.textAccent}`}>
                {pillar.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--app-ink)]">{pillar.tagline}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Características */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[var(--app-ink)]">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--app-muted)]">Características</p>
            <h2 className="text-xl font-semibold text-[var(--app-ink)] sm:text-2xl">Qué hace único a este diagnóstico.</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="app-panel-soft rounded-[1.3rem] p-5">
                <div className="mb-3 inline-flex rounded-[0.75rem] bg-white p-2.5 shadow-[var(--app-shadow-soft)]">
                  <Icon size={17} className="text-[var(--app-ink)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--app-ink)]">{feature.title}</h3>
                <p className="mt-1.5 text-[0.83rem] leading-relaxed text-[var(--app-muted)]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Producto obtenido */}
      <section className="app-panel-strong overflow-hidden p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-[1rem] bg-[var(--app-chip)] p-3 text-[var(--app-ink)]">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[var(--app-muted)]">Producto obtenido</p>
                <h2 className="text-xl font-semibold text-[var(--app-ink)] sm:text-2xl">Lo que recibes al completarlo.</h2>
              </div>
            </div>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--app-muted)]">
              Completas las 125 preguntas una sola vez. Al terminar, el sistema genera tu informe
              completo de forma automática — no hay espera ni revisión manual. Puedes volver a
              consultarlo en cualquier momento desde tu cuenta.
            </p>
          </div>
          <ul className="space-y-2.5">
            {DELIVERABLES.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#7c5f93]" />
                <span className="text-[0.9rem] leading-snug text-[var(--app-ink)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final */}
      <section className="app-hero-surface relative overflow-hidden px-7 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-8"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 0%, transparent 55%)" }}
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="app-display-title text-[1.9rem] font-semibold leading-tight text-white sm:text-[2.3rem]"
              data-display-font="true"
            >
              Activa tu diagnóstico hoy.
            </h2>
            <p className="mt-2 max-w-lg text-[0.95rem] leading-relaxed text-white/72">
              Pago único · Acceso inmediato · Sin suscripción. El diagnóstico queda vinculado
              a tu cuenta y puedes consultar tu informe en cualquier momento.
            </p>
            {checkoutError && (
              <p className="mt-2 text-sm text-rose-300">{checkoutError}</p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end shrink-0">
            {discoveryProduct && (
              <div className="rounded-[1.1rem] border border-white/18 bg-white/12 px-5 py-3 text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-white/55">Precio único</p>
                <p className="mt-1 text-[2rem] font-semibold leading-none text-white">
                  {formatPrice(discoveryProduct)}
                </p>
                <p className="mt-1 text-xs text-white/55">{discoveryProduct.currencyCode} · Pago único</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCheckingOut || !discoveryProduct}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#4f2360] shadow-md transition hover:-translate-y-0.5 hover:bg-white/96 disabled:opacity-60"
            >
              {isCheckingOut ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              {isCheckingOut ? "Redirigiendo..." : "Activar diagnóstico"}
              {!isCheckingOut && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
