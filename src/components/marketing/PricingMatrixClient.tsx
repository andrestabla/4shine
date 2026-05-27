'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';
import {
  PLAN_FEATURES,
  groupFeaturesByModule,
} from '@/features/planes/features-catalog';

type Tab = 'diagnostico' | 'programas' | 'mentorias' | 'circulo';

interface PricingMatrixClientProps {
  plans: SubscriptionPlanWithFeatures[];
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'programas', label: 'Programas' },
  { id: 'mentorias', label: 'Mentorías' },
  { id: 'circulo', label: 'Círculo de líderes' },
];

const MENTORING_PACKS = [
  {
    id: 'mentor-1',
    sessions: 1,
    label: '1 sesión',
    price: 50,
    note: 'Sesión individual de 60 min. con Adviser certificado. Ideal para un momento puntual de claridad o acompañamiento.',
    checkoutHref: '/acceso?plan=mentoria-1',
  },
  {
    id: 'mentor-3',
    sessions: 3,
    label: '3 sesiones',
    price: 140,
    badge: 'Más elegido',
    note: 'Pack de 3 sesiones. Recomendado para trabajar un reto concreto con continuidad y profundidad.',
    checkoutHref: '/acceso?plan=mentoria-3',
  },
  {
    id: 'mentor-5',
    sessions: 5,
    label: '5 sesiones',
    price: 200,
    badge: 'Mejor valor',
    note: 'Pack de 5 sesiones. El mayor ahorro por sesión para un ciclo de acompañamiento sostenido.',
    checkoutHref: '/acceso?plan=mentoria-5',
  },
];

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(days: number): string {
  if (days % 30 === 0 && days >= 30) {
    const months = days / 30;
    return months === 1 ? '1 mes' : `${months} meses`;
  }
  return `${days} días`;
}

export function PricingMatrixClient({ plans }: PricingMatrixClientProps) {
  const [tab, setTab] = useState<Tab>('programas');

  const programs = useMemo(
    () => plans.filter((p) => p.planGroup === 'program').sort((a, b) => a.sortOrder - b.sortOrder),
    [plans],
  );
  const circulos = useMemo(
    () => plans.filter((p) => p.planGroup === 'circulo').sort((a, b) => a.sortOrder - b.sortOrder),
    [plans],
  );
  const moduleGroups = useMemo(() => groupFeaturesByModule(), []);

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
                ? 'bg-[#2e1b49] text-white shadow-sm'
                : 'border border-[#d6cced] bg-white text-[#5f4a7a] hover:border-[#5b2d8a] hover:text-[#5b2d8a]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Diagnóstico ── */}
      {tab === 'diagnostico' && (
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
                'Evaluación profunda de los 4 pilares',
                'Informe ejecutivo personalizado',
                'Identificación de brechas críticas',
                'Punto de partida para cualquier programa',
                'Acceso permanente a tus resultados',
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
              $50 <span className="text-base font-semibold text-[#c9b8ff]">USD</span>
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

      {/* ── Programas — dynamic from DB ── */}
      {tab === 'programas' && (
        <ProgramsSection programs={programs} moduleGroups={moduleGroups} />
      )}

      {/* ── Mentorías ── */}
      {tab === 'mentorias' && (
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
                    ? 'border-[#5b2d8a] bg-[#1c102d] text-white shadow-[0_24px_56px_rgba(91,45,138,0.22)]'
                    : 'border-[#d6cced] bg-white text-[#1c0f32] shadow-[0_8px_32px_rgba(42,20,68,0.05)]'
                }`}
              >
                {pack.badge && (
                  <span className="mb-3 inline-block w-fit rounded-full bg-[#f2b24b]/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f2b24b]">
                    {pack.badge}
                  </span>
                )}
                <p
                  className={`text-4xl font-black ${
                    pack.badge ? 'text-[#f2b24b]' : 'text-[#1c0f32]'
                  }`}
                >
                  {pack.sessions}
                  <span
                    className={`ml-1 text-base font-semibold ${
                      pack.badge ? 'text-[#c9b8ff]' : 'text-[#8b75a8]'
                    }`}
                  >
                    {pack.sessions === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </p>
                <p
                  className={`mt-1 text-2xl font-black ${
                    pack.badge ? 'text-white' : 'text-[#1c0f32]'
                  }`}
                >
                  ${pack.price}{' '}
                  <span
                    className={`text-sm font-semibold ${
                      pack.badge ? 'text-[#c9b8ff]' : 'text-[#8b75a8]'
                    }`}
                  >
                    USD
                  </span>
                </p>
                <p
                  className={`mt-4 flex-1 text-sm leading-relaxed ${
                    pack.badge ? 'text-[#c9b8ff]' : 'text-[#5d4a78]'
                  }`}
                >
                  {pack.note}
                </p>
                <Link
                  href={pack.checkoutHref}
                  className={`mt-6 block w-full rounded-full py-2.5 text-center text-sm font-extrabold transition ${
                    pack.badge
                      ? 'bg-[#f2b24b] text-[#1c0f32] hover:bg-[#f6c56d]'
                      : 'border-2 border-[#5b2d8a] text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white'
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

      {/* ── Círculo de líderes — dynamic from DB ── */}
      {tab === 'circulo' && <CirculoSection circulos={circulos} />}
    </div>
  );
}

// ─── Programs section (dynamic) ──────────────────────────────────────────────

interface ProgramsSectionProps {
  programs: SubscriptionPlanWithFeatures[];
  moduleGroups: ReturnType<typeof groupFeaturesByModule>;
}

function ProgramsSection({ programs, moduleGroups }: ProgramsSectionProps) {
  if (programs.length === 0) {
    return (
      <div className="rounded-2xl border border-[#d6cced] bg-white p-10 text-center text-sm text-[#5e4b78]">
        Aún no hay programas activos disponibles. Vuelve más tarde.
      </div>
    );
  }

  return (
    <div>
      <p className="mb-8 max-w-[64ch] text-base leading-relaxed text-[#5e4b78]">
        Cada programa da acceso completo a la plataforma. Lo que varía es la intensidad del acompañamiento, las sesiones incluidas y la duración de la suscripción.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-[#d6cced] bg-white shadow-[0_8px_40px_rgba(42,20,68,0.07)]">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-[#ede7f8]">
              <th className="w-56 px-6 py-6 text-left" />
              {programs.map((p) => {
                const highlighted = Boolean(p.highlightLabel);
                return (
                  <th
                    key={p.planId}
                    className={`px-5 py-6 text-center align-bottom ${
                      highlighted ? 'bg-[#1c102d]' : ''
                    }`}
                  >
                    {p.highlightLabel && (
                      <span className="mb-2 inline-block rounded-full bg-[#f2b24b]/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f2b24b]">
                        {p.highlightLabel}
                      </span>
                    )}
                    <p
                      className={`text-[15px] font-black ${
                        highlighted ? 'text-white' : 'text-[#1c0f32]'
                      }`}
                    >
                      {p.name}
                    </p>
                    <p
                      className={`mt-1 text-2xl font-black ${
                        highlighted ? 'text-[#f2b24b]' : 'text-[#1c0f32]'
                      }`}
                    >
                      {formatPrice(p.priceAmount)}{' '}
                      <span
                        className={`text-xs font-semibold ${
                          highlighted ? 'text-[#9b88c8]' : 'text-[#8b75a8]'
                        }`}
                      >
                        {p.currencyCode}
                      </span>
                    </p>
                    <p
                      className={`mt-1 text-[11px] font-semibold ${
                        highlighted ? 'text-[#c9b8ff]' : 'text-[#8b75a8]'
                      }`}
                    >
                      {formatDuration(p.durationDays)}
                    </p>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Section header: Permisos por módulo */}
            <tr className="border-b border-[#f0ebfa]">
              <td
                colSpan={programs.length + 1}
                className="bg-[#1c102d] px-6 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#c9b8ff]"
              >
                Acceso por módulo
              </td>
            </tr>

            {moduleGroups.map((group) =>
              group.features.map((def) => (
                <tr
                  key={def.key}
                  className="border-b border-[#f0ebfa] transition hover:bg-[#fbf9ff]"
                >
                  <td className="px-6 py-3.5 text-sm font-medium text-[#3d2b5f]">
                    <span className="text-[10px] uppercase tracking-wider text-[#8b75a8]">
                      {group.moduleLabel}
                    </span>
                    <br />
                    {def.label}
                  </td>
                  {programs.map((p) => {
                    const f = p.features.find((x) => x.featureKey === def.key);
                    const enabled = f?.isEnabled ?? false;
                    const quota = f?.quota;
                    const highlighted = Boolean(p.highlightLabel);
                    return (
                      <td
                        key={p.planId}
                        className={`px-5 py-3.5 ${highlighted ? 'bg-[#1c102d]/[0.025]' : ''}`}
                      >
                        <div className="flex justify-center">
                          {enabled ? (
                            quota ? (
                              <span
                                className={`text-sm font-extrabold ${
                                  highlighted ? 'text-[#f2b24b]' : 'text-[#5b2d8a]'
                                }`}
                              >
                                {quota}
                              </span>
                            ) : (
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                  highlighted ? 'bg-[#f2b24b]/20' : 'bg-[#5b2d8a]/10'
                                }`}
                              >
                                <Check
                                  size={13}
                                  strokeWidth={2.5}
                                  className={highlighted ? 'text-[#f2b24b]' : 'text-[#5b2d8a]'}
                                />
                              </div>
                            )
                          ) : (
                            <X size={14} className="text-[#c9b8ff]/60" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )),
            )}

            {/* CTA row */}
            <tr>
              <td className="px-6 py-5 text-[11px] text-[#9b88c8]">
                * Precio único. Sin cuotas ocultas.
              </td>
              {programs.map((p) => {
                const highlighted = Boolean(p.highlightLabel);
                return (
                  <td
                    key={p.planId}
                    className={`px-5 py-5 text-center ${
                      highlighted ? 'bg-[#1c102d]/[0.025]' : ''
                    }`}
                  >
                    <Link
                      href={`/acceso?plan=${encodeURIComponent(p.planCode)}`}
                      className={`inline-block rounded-full px-6 py-2.5 text-sm font-extrabold transition ${
                        highlighted
                          ? 'bg-[#f2b24b] text-[#1c0f32] hover:bg-[#f6c56d]'
                          : 'border-2 border-[#5b2d8a] text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white'
                      }`}
                    >
                      Comenzar
                    </Link>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Círculo section (dynamic) ───────────────────────────────────────────────

function CirculoSection({ circulos }: { circulos: SubscriptionPlanWithFeatures[] }) {
  if (circulos.length === 0) {
    return (
      <div className="rounded-2xl border border-[#d6cced] bg-white p-10 text-center text-sm text-[#5e4b78]">
        Aún no hay planes de Círculo activos. Vuelve más tarde.
      </div>
    );
  }

  // Detect a "best value" highlight: the plan with the longest duration_days (sin highlight explícito)
  const longest = [...circulos].sort((a, b) => b.durationDays - a.durationDays)[0];

  // Features que se muestran si están habilitadas en al menos un plan del grupo
  const sharedFeatureKeys = PLAN_FEATURES.map((def) => def.key).filter((key) =>
    circulos.some((c) => c.features.find((f) => f.featureKey === key && f.isEnabled)),
  );

  return (
    <div>
      <p className="mb-8 max-w-[62ch] text-base leading-relaxed text-[#5e4b78]">
        Acceso al Círculo de Líderes 4Shine: sesiones grupales en vivo, cursos exclusivos, comunidad y workshops. Elige la duración que más se ajuste a tu momento.
      </p>
      <div className="mx-auto grid max-w-[960px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {circulos.map((plan) => {
          const isHighlight = Boolean(plan.highlightLabel) || plan.planId === longest?.planId;
          return (
            <article
              key={plan.planId}
              className={`flex flex-col rounded-3xl border p-8 ${
                isHighlight
                  ? 'border-[#5b2d8a] bg-[#1c102d] text-white shadow-[0_24px_56px_rgba(91,45,138,0.22)]'
                  : 'border-[#d6cced] bg-white text-[#1c0f32] shadow-[0_8px_32px_rgba(42,20,68,0.05)]'
              }`}
            >
              {plan.highlightLabel && (
                <span className="mb-3 inline-block w-fit rounded-full bg-[#f2b24b]/20 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f2b24b]">
                  {plan.highlightLabel}
                </span>
              )}
              <p className={`text-lg font-black ${isHighlight ? 'text-white' : 'text-[#1c0f32]'}`}>
                {plan.name}
              </p>
              <p
                className={`mt-1 text-3xl font-black ${
                  isHighlight ? 'text-[#f2b24b]' : 'text-[#1c0f32]'
                }`}
              >
                {formatPrice(plan.priceAmount)}{' '}
                <span
                  className={`text-sm font-semibold ${
                    isHighlight ? 'text-[#c9b8ff]' : 'text-[#8b75a8]'
                  }`}
                >
                  {plan.currencyCode} · {formatDuration(plan.durationDays)}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {sharedFeatureKeys.map((key) => {
                  const def = PLAN_FEATURES.find((d) => d.key === key);
                  if (!def) return null;
                  const f = plan.features.find((x) => x.featureKey === key);
                  const enabled = f?.isEnabled ?? false;
                  return (
                    <li
                      key={key}
                      className={`flex items-start gap-2.5 text-sm ${
                        enabled
                          ? ''
                          : isHighlight
                            ? 'text-white/40 line-through'
                            : 'text-[#5b2d8a]/40 line-through'
                      }`}
                    >
                      {enabled ? (
                        <Check
                          size={14}
                          strokeWidth={2.5}
                          className={`mt-0.5 shrink-0 ${
                            isHighlight ? 'text-[#f2b24b]' : 'text-[#5b2d8a]'
                          }`}
                        />
                      ) : (
                        <X size={14} className="mt-0.5 shrink-0 opacity-40" />
                      )}
                      <span className={isHighlight ? 'text-[#ddd6f0]' : 'text-[#4a3665]'}>
                        {def.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/acceso?plan=${encodeURIComponent(plan.planCode)}`}
                className={`mt-8 block w-full rounded-full py-3 text-center text-sm font-extrabold transition ${
                  isHighlight
                    ? 'bg-[#f2b24b] text-[#1c0f32] hover:bg-[#f6c56d]'
                    : 'border-2 border-[#5b2d8a] text-[#5b2d8a] hover:bg-[#5b2d8a] hover:text-white'
                }`}
              >
                Unirme al Círculo
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
