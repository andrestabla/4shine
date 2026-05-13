"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useState } from "react";
import { Check, Minus } from "lucide-react";

type Tab = "diagnostico" | "programas" | "mentorias" | "circulo";
type CellValue = true | false | string;

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  badge?: string;
  highlighted?: boolean;
  checkoutHref: string;
};

type FeatureRow = {
  category: string;
  label: string;
  values: Record<string, CellValue>;
};

const PROGRAMS: Plan[] = [
  {
    id: "junior",
    name: "Junior",
    price: 1000,
    currency: "USD",
    checkoutHref: "/acceso?plan=junior",
  },
  {
    id: "reinventate",
    name: "Reinvéntate Pro",
    price: 2500,
    currency: "USD",
    checkoutHref: "/acceso?plan=reinventate",
  },
  {
    id: "shine",
    name: "Programa 4Shine",
    price: 3000,
    currency: "USD",
    badge: "Recomendado",
    highlighted: true,
    checkoutHref: "/acceso?plan=programa-4shine",
  },
  {
    id: "executive",
    name: "Executive Signature",
    price: 4000,
    currency: "USD",
    badge: "Premium",
    checkoutHref: "/acceso?plan=executive-signature",
  },
];

const FEATURE_ROWS: FeatureRow[] = [
  {
    category: "Fundamentos",
    label: "Diagnóstico ejecutivo de los 4 pilares",
    values: { junior: true, reinventate: true, shine: true, executive: true },
  },
  {
    category: "Fundamentos",
    label: "Acceso a la plataforma",
    values: { junior: true, reinventate: true, shine: true, executive: true },
  },
  {
    category: "Fundamentos",
    label: "Trayectoria estructurada (24 semanas)",
    values: { junior: true, reinventate: true, shine: true, executive: true },
  },
  {
    category: "Contenido",
    label: "Workbooks de metodología 4Shine",
    values: { junior: "Básicos", reinventate: true, shine: true, executive: true },
  },
  {
    category: "Contenido",
    label: "Biblioteca de aprendizaje",
    values: { junior: true, reinventate: true, shine: true, executive: true },
  },
  {
    category: "Acompañamiento",
    label: "Sesiones individuales con Adviser",
    values: { junior: "3", reinventate: "6", shine: "10", executive: "15" },
  },
  {
    category: "Acompañamiento",
    label: "Mensajes directos con tu Adviser",
    values: { junior: false, reinventate: true, shine: true, executive: true },
  },
  {
    category: "Acompañamiento",
    label: "Retroalimentación de Adviser en workbooks",
    values: { junior: false, reinventate: false, shine: true, executive: true },
  },
  {
    category: "Comunidad",
    label: "Networking y comunidad de líderes",
    values: { junior: false, reinventate: true, shine: true, executive: true },
  },
  {
    category: "Comunidad",
    label: "Workshops y convocatorias mensuales",
    values: { junior: false, reinventate: false, shine: true, executive: true },
  },
  {
    category: "Comunidad",
    label: "Sesiones en vivo — Círculo de líderes",
    values: { junior: false, reinventate: false, shine: false, executive: true },
  },
  {
    category: "Cierre",
    label: "Certificación 4Shine Leadership",
    values: { junior: false, reinventate: true, shine: true, executive: true },
  },
  {
    category: "Cierre",
    label: "Soporte y seguimiento prioritario",
    values: { junior: false, reinventate: false, shine: false, executive: true },
  },
];

const MENTORING_PACKS = [
  {
    id: "mentor-1",
    sessions: 1,
    label: "1 sesión",
    price: 50,
    note: "Sesión individual de 60 min. con Adviser certificado. Ideal para un momento puntual de claridad o acompañamiento.",
    checkoutHref: "/acceso?plan=mentoria-1",
  },
  {
    id: "mentor-3",
    sessions: 3,
    label: "3 sesiones",
    price: 140,
    badge: "Popular",
    note: "Pack de 3 sesiones. Ahorro vs precio individual. Recomendado para trabajar un reto concreto en profundidad.",
    checkoutHref: "/acceso?plan=mentoria-3",
  },
  {
    id: "mentor-5",
    sessions: 5,
    label: "5 sesiones",
    price: 200,
    note: "Pack de 5 sesiones con el mayor ahorro por sesión. Para un ciclo de acompañamiento sostenido.",
    checkoutHref: "/acceso?plan=mentoria-5",
  },
];

const CIRCULO_PLANS = [
  {
    id: "circulo-mensual",
    name: "Mensual",
    price: 57,
    period: "/ mes",
    features: [
      "2 sesiones en vivo por mes",
      "Comunidad exclusiva de líderes",
      "Grabaciones de todas las sesiones",
      "Recursos y materiales del círculo",
    ],
    checkoutHref: "/acceso?plan=circulo-mensual",
  },
  {
    id: "circulo-semestral",
    name: "Semestral",
    price: 300,
    period: "/ 6 meses",
    badge: "Ahorra 42%",
    features: [
      "12 sesiones en vivo (6 meses)",
      "Comunidad exclusiva de líderes",
      "Grabaciones de todas las sesiones",
      "Recursos y materiales del círculo",
      "Acceso al archivo histórico de sesiones",
    ],
    checkoutHref: "/acceso?plan=circulo-semestral",
  },
];

const TABS: { id: Tab; label: string }[] = [
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "programas", label: "Programas" },
  { id: "mentorias", label: "Mentorías" },
  { id: "circulo", label: "Círculo de líderes" },
];

function Cell({ value, highlighted }: { value: CellValue; highlighted?: boolean }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full ${
            highlighted ? "bg-[#f2b24b]/20" : "bg-[#5b2d8a]/10"
          }`}
        >
          <Check
            size={13}
            strokeWidth={2.5}
            className={highlighted ? "text-[#f2b24b]" : "text-[#5b2d8a]"}
          />
        </div>
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <Minus size={14} className="text-[#ccc3db]" />
      </div>
    );
  }
  return (
    <p
      className={`text-center text-sm font-extrabold ${
        highlighted ? "text-[#f2b24b]" : "text-[#5b2d8a]"
      }`}
    >
      {value}
    </p>
  );
}

export function PricingMatrix() {
  const [tab, setTab] = useState<Tab>("programas");

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 pb-24 md:px-10 lg:px-14">
      {/* Tab filter */}
      <div className="mb-10 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition ${
              tab === t.id
                ? "bg-[#2e1b49] text-white shadow-sm"
                : "border border-[#d6cced] bg-white text-[#5f4a7a] hover:border-[#5b2d8a] hover:text-[#5b2d8a]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Diagnóstico ── */}
      {tab === "diagnostico" && (
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#7557a1]">
              Punto de partida
            </p>
            <h2 className="max-w-[26ch] text-3xl font-black leading-tight tracking-tight text-[#1c0f32] md:text-4xl">
              Conoce dónde estás antes de decidir hacia dónde ir.
            </h2>
            <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[#4a3665]">
              El Diagnóstico Ejecutivo 4Shine evalúa tu nivel actual en los 4 pilares de liderazgo — Within, Out, Up y Beyond — y entrega un informe personalizado con tus fortalezas, brechas y recomendaciones concretas.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Evaluación profunda de los 4 pilares",
                "Informe ejecutivo personalizado",
                "Identificación de brechas críticas",
                "Punto de partida para cualquier programa",
                "Acceso permanente a tus resultados",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-[#4a3665]">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#5b2d8a]" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <article className="flex flex-col rounded-3xl border border-[#5b2d8a] bg-[#1c102d] p-8 text-white shadow-[0_24px_64px_rgba(91,45,138,0.22)]">
            <span className="mb-3 inline-block w-fit rounded-full bg-[#f2b24b]/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f2b24b]">
              Compra individual
            </span>
            <p className="text-lg font-black">Diagnóstico Ejecutivo</p>
            <p className="mt-1 text-5xl font-black text-[#f2b24b]">
              $50{" "}
              <span className="text-base font-semibold text-[#c9b8ff]">USD</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#c9b8ff]">
              Pago único. Acceso inmediato. Resultado disponible en la plataforma en menos de 48 horas.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-[#9b88c8]">
              Incluido en todos los programas de liderazgo. Si ya tienes un programa activo, no necesitas comprarlo por separado.
            </div>
            <Link
              href="/acceso?plan=diagnostico"
              className="mt-auto pt-6 block w-full rounded-full bg-[#f2b24b] py-3 text-center text-sm font-extrabold text-[#1c0f32] transition hover:bg-[#f6c56d]"
            >
              Comprar diagnóstico
            </Link>
          </article>
        </div>
      )}

      {/* ── Programas — comparison matrix ── */}
      {tab === "programas" && (
        <div>
          <p className="mb-8 max-w-[64ch] text-base leading-relaxed text-[#5e4b78]">
            Programas estructurados de 24 semanas con Adviser asignado. Cada nivel incluye la ruta completa — diagnóstico, trayectoria, workbooks y certificación — y se diferencia en la profundidad del acompañamiento.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-[#d6cced] bg-white shadow-[0_8px_40px_rgba(42,20,68,0.07)]">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-[#ede7f8]">
                  <th className="w-56 px-6 py-6 text-left text-xs font-extrabold uppercase tracking-widest text-[#9b88c8]">
                    Características
                  </th>
                  {PROGRAMS.map((p) => (
                    <th
                      key={p.id}
                      className={`px-5 py-6 text-center align-bottom ${
                        p.highlighted ? "bg-[#1c102d]" : ""
                      }`}
                    >
                      {p.badge && (
                        <span
                          className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            p.highlighted
                              ? "bg-[#f2b24b]/20 text-[#f2b24b]"
                              : "bg-[#efeaf8] text-[#7557a1]"
                          }`}
                        >
                          {p.badge}
                        </span>
                      )}
                      <p
                        className={`text-[15px] font-black ${
                          p.highlighted ? "text-white" : "text-[#1c0f32]"
                        }`}
                      >
                        {p.name}
                      </p>
                      <p
                        className={`mt-1 text-2xl font-black ${
                          p.highlighted ? "text-[#f2b24b]" : "text-[#1c0f32]"
                        }`}
                      >
                        ${p.price.toLocaleString("es-CO")}{" "}
                        <span
                          className={`text-xs font-semibold ${
                            p.highlighted ? "text-[#9b88c8]" : "text-[#8b75a8]"
                          }`}
                        >
                          {p.currency}
                        </span>
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const rows: ReactElement[] = [];
                  let lastCategory = "";
                  FEATURE_ROWS.forEach((row) => {
                    if (row.category !== lastCategory) {
                      lastCategory = row.category;
                      rows.push(
                        <tr key={`cat-${row.category}`} className="border-b border-[#f0ebfa]">
                          <td
                            colSpan={PROGRAMS.length + 1}
                            className="bg-[#f9f7fd] px-6 py-2 text-[10px] font-extrabold uppercase tracking-widest text-[#9b88c8]"
                          >
                            {row.category}
                          </td>
                        </tr>
                      );
                    }
                    rows.push(
                      <tr
                        key={row.label}
                        className="border-b border-[#f5f0fa] transition hover:bg-[#fbf9ff]"
                      >
                        <td className="px-6 py-3.5 text-sm font-medium text-[#3d2b5f]">
                          {row.label}
                        </td>
                        {PROGRAMS.map((p) => (
                          <td
                            key={p.id}
                            className={`px-5 py-3.5 ${
                              p.highlighted ? "bg-[#1c102d]/[0.025]" : ""
                            }`}
                          >
                            <Cell
                              value={row.values[p.id] ?? false}
                              highlighted={p.highlighted}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  });
                  return rows;
                })()}
                <tr>
                  <td className="px-6 py-5 text-[11px] text-[#9b88c8]">
                    * Precio único. Sin cuotas ocultas.
                  </td>
                  {PROGRAMS.map((p) => (
                    <td
                      key={p.id}
                      className={`px-5 py-5 text-center ${
                        p.highlighted ? "bg-[#1c102d]/[0.025]" : ""
                      }`}
                    >
                      <Link
                        href={p.checkoutHref}
                        className={`inline-block rounded-full px-6 py-2.5 text-sm font-extrabold transition ${
                          p.highlighted
                            ? "bg-[#f2b24b] text-[#1c0f32] hover:bg-[#f6c56d]"
                            : "border-2 border-[#5b2d8a] text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white"
                        }`}
                      >
                        Comenzar
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Mentorías ── */}
      {tab === "mentorias" && (
        <div>
          <p className="mb-8 max-w-[62ch] text-base leading-relaxed text-[#5e4b78]">
            Sesiones individuales con Advisers certificados. Sin compromiso de programa. Ideal para acompañamiento puntual en un momento concreto de decisión, transición o desarrollo.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {MENTORING_PACKS.map((pack) => (
              <article
                key={pack.id}
                className={`flex flex-col rounded-3xl border p-7 ${
                  pack.badge
                    ? "border-[#5b2d8a] bg-[#1c102d] text-white shadow-[0_24px_56px_rgba(91,45,138,0.22)]"
                    : "border-[#d6cced] bg-white text-[#1c0f32] shadow-[0_8px_32px_rgba(42,20,68,0.05)]"
                }`}
              >
                {pack.badge && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-[#f2b24b]/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f2b24b]">
                    {pack.badge}
                  </span>
                )}
                <p
                  className={`text-4xl font-black ${
                    pack.badge ? "text-[#f2b24b]" : "text-[#1c0f32]"
                  }`}
                >
                  {pack.sessions}
                  <span
                    className={`ml-1 text-base font-semibold ${
                      pack.badge ? "text-[#c9b8ff]" : "text-[#8b75a8]"
                    }`}
                  >
                    {pack.sessions === 1 ? "sesión" : "sesiones"}
                  </span>
                </p>
                <p
                  className={`mt-1 text-2xl font-black ${
                    pack.badge ? "text-white" : "text-[#1c0f32]"
                  }`}
                >
                  ${pack.price}{" "}
                  <span
                    className={`text-sm font-semibold ${
                      pack.badge ? "text-[#c9b8ff]" : "text-[#8b75a8]"
                    }`}
                  >
                    USD
                  </span>
                </p>
                <p
                  className={`mt-4 flex-1 text-sm leading-relaxed ${
                    pack.badge ? "text-[#c9b8ff]" : "text-[#5d4a78]"
                  }`}
                >
                  {pack.note}
                </p>
                <Link
                  href={pack.checkoutHref}
                  className={`mt-6 block w-full rounded-full py-2.5 text-center text-sm font-extrabold transition ${
                    pack.badge
                      ? "bg-[#f2b24b] text-[#1c0f32] hover:bg-[#f6c56d]"
                      : "border-2 border-[#5b2d8a] text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white"
                  }`}
                >
                  Comprar
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs text-[#9b88c8]">
            * Cada sesión dura 60 minutos. Las sesiones no tienen fecha de vencimiento.
          </p>
        </div>
      )}

      {/* ── Círculo de líderes ── */}
      {tab === "circulo" && (
        <div>
          <p className="mb-8 max-w-[62ch] text-base leading-relaxed text-[#5e4b78]">
            Acceso a sesiones en vivo mensuales con líderes activos del ecosistema 4Shine. Una comunidad de práctica continua con grabaciones, recursos y espacio de conversación real.
          </p>
          <div className="mx-auto grid max-w-[720px] gap-6 sm:grid-cols-2">
            {CIRCULO_PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`flex flex-col rounded-3xl border p-8 ${
                  plan.badge
                    ? "border-[#5b2d8a] bg-[#1c102d] text-white shadow-[0_24px_56px_rgba(91,45,138,0.22)]"
                    : "border-[#d6cced] bg-white text-[#1c0f32] shadow-[0_8px_32px_rgba(42,20,68,0.05)]"
                }`}
              >
                {plan.badge && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-[#f2b24b]/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f2b24b]">
                    {plan.badge}
                  </span>
                )}
                <p
                  className={`text-lg font-black ${
                    plan.badge ? "text-white" : "text-[#1c0f32]"
                  }`}
                >
                  {plan.name}
                </p>
                <p
                  className={`mt-1 text-3xl font-black ${
                    plan.badge ? "text-[#f2b24b]" : "text-[#1c0f32]"
                  }`}
                >
                  ${plan.price}{" "}
                  <span
                    className={`text-sm font-semibold ${
                      plan.badge ? "text-[#c9b8ff]" : "text-[#8b75a8]"
                    }`}
                  >
                    USD{plan.period}
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check
                        size={14}
                        strokeWidth={2.5}
                        className={`mt-0.5 shrink-0 ${
                          plan.badge ? "text-[#f2b24b]" : "text-[#5b2d8a]"
                        }`}
                      />
                      <span
                        className={plan.badge ? "text-[#ddd6f0]" : "text-[#4a3665]"}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.checkoutHref}
                  className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-extrabold transition ${
                    plan.badge
                      ? "bg-[#f2b24b] text-[#1c0f32] hover:bg-[#f6c56d]"
                      : "border-2 border-[#5b2d8a] text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white"
                  }`}
                >
                  Unirme al Círculo
                </Link>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
