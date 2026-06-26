'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';
import type { CommercialProductRecord } from '@/features/access/types';
import {
  PLAN_FEATURES,
  groupFeaturesByModule,
} from '@/features/planes/features-catalog';

type Tab = 'diagnostico' | 'programas' | 'mentorias' | 'circulo';

interface PricingMatrixClientProps {
  plans: SubscriptionPlanWithFeatures[];
  catalog?: CommercialProductRecord[];
}

interface MentoringPack {
  id: string;
  sessions: number;
  price: number;
  badge?: string;
  note: string;
  checkoutHref: string;
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
    note: 'Sesión individual de 60 min. con Advisor certificado. Ideal para un momento puntual de claridad o acompañamiento.',
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

export function PricingMatrixClient({ plans, catalog = [] }: PricingMatrixClientProps) {
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

  // Diagnóstico y Mentorías se leen del catálogo del admin (misma fuente que cobra
  // el checkout). Si el catálogo no está disponible, se usan valores por defecto.
  const diagnostic = useMemo(
    () => catalog.find((p) => p.productGroup === 'discovery') ?? null,
    [catalog],
  );
  const mentoringPacks = useMemo<MentoringPack[]>(() => {
    const fromCatalog = catalog
      .filter((p) => p.productGroup === 'mentoring_pack')
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.productCode,
        sessions: p.sessionsIncluded,
        price: p.priceAmount,
        badge: p.highlightLabel ?? undefined,
        note: p.headline || p.description || '',
        checkoutHref: `/acceso?plan=mentoria-${p.sessionsIncluded}`,
      }));
    return fromCatalog.length > 0 ? fromCatalog : MENTORING_PACKS;
  }, [catalog]);
  const diagnosticName = diagnostic?.name || 'Diagnóstico Ejecutivo';
  const diagnosticPrice = diagnostic?.priceAmount ?? 50;
  const diagnosticCurrency = diagnostic?.currencyCode || 'USD';
  const diagnosticBadge = diagnostic?.highlightLabel || 'Compra individual';

  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 pb-24 md:px-10 lg:px-14">
      {/* Tab filter */}
      <div className="mb-10 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="rounded-full px-5 py-2 text-sm font-bold transition shadow-sm"
              style={
                active
                  ? { background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }
                  : {
                      background: 'white',
                      color: 'var(--brand-primary)',
                      border: '1px solid var(--brand-border)',
                    }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Diagnóstico ── */}
      {tab === 'diagnostico' && (
        <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <p
              className="mb-3 text-xs font-black uppercase tracking-[0.3em]"
              style={{ color: 'var(--brand-accent)' }}
            >
              Punto de partida
            </p>
            <h2
              className="max-w-[26ch] text-3xl font-black leading-tight tracking-tight md:text-4xl"
              style={{ color: '#ffffff' }}
            >
              Conoce dónde estás antes de decidir hacia dónde ir.
            </h2>
            <p
              className="mt-5 max-w-[54ch] text-base leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
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
                <li
                  key={f}
                  className="flex items-start gap-3 text-sm"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  <Check
                    size={15}
                    className="mt-0.5 shrink-0"
                    strokeWidth={2.5}
                    style={{ color: 'var(--brand-accent)' }}
                  />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <article
            className="flex flex-col rounded-3xl p-8 text-white shadow-[0_24px_64px_rgba(91,45,138,0.22)]"
            style={{
              border: '1px solid var(--brand-primary)',
              background: 'var(--brand-dark)',
            }}
          >
            <span
              className="mb-3 inline-block w-fit rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
              style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
            >
              {diagnosticBadge}
            </span>
            <p className="text-lg font-black">{diagnosticName}</p>
            <p className="mt-1 text-5xl font-black" style={{ color: 'var(--brand-accent)' }}>
              ${diagnosticPrice}{' '}
              <span className="text-base font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
                {diagnosticCurrency}
              </span>
            </p>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.78)' }}
            >
              Pago único. Acceso inmediato. Resultado disponible en la plataforma en menos de 48 horas.
            </p>
            <div
              className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.82)' }}
            >
              Incluido en todos los programas de liderazgo. Si ya tienes un programa activo, no necesitas comprarlo por separado.
            </div>
            <Link
              href="/acceso?plan=diagnostico"
              className="mt-auto pt-6 block w-full rounded-full py-3 text-center text-sm font-extrabold transition"
              style={{
                background: 'var(--brand-accent)',
                color: 'var(--brand-on-accent)',
              }}
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
          <p
            className="mb-8 max-w-[62ch] text-base leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            Sesiones individuales con Advisors certificados. Sin compromiso de programa. Ideal para acompañamiento puntual en un momento concreto de decisión, transición o desarrollo.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {mentoringPacks.map((pack) => (
              <article
                key={pack.id}
                className="flex flex-col rounded-3xl p-7"
                style={
                  pack.badge
                    ? {
                        border: '1px solid var(--brand-primary)',
                        background: 'var(--brand-dark)',
                        color: 'white',
                        boxShadow: '0 24px 56px rgba(91,45,138,0.22)',
                      }
                    : {
                        border: '1px solid var(--brand-border)',
                        background: 'white',
                        color: 'var(--brand-primary)',
                        boxShadow: '0 8px 32px rgba(42,20,68,0.05)',
                      }
                }
              >
                {pack.badge && (
                  <span
                    className="mb-3 inline-block w-fit rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                    style={{
                      background: 'var(--brand-accent)',
                      color: 'var(--brand-on-accent)',
                    }}
                  >
                    {pack.badge}
                  </span>
                )}
                <p
                  className="text-4xl font-black"
                  style={{
                    color: pack.badge ? 'var(--brand-accent)' : 'var(--brand-primary)',
                  }}
                >
                  {pack.sessions}
                  <span
                    className="ml-1 text-base font-semibold"
                    style={{ color: pack.badge ? 'rgba(255,255,255,0.65)' : 'var(--brand-ink-muted)' }}
                  >
                    {pack.sessions === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </p>
                <p
                  className="mt-1 text-2xl font-black"
                  style={{
                    color: pack.badge ? 'white' : 'var(--brand-primary)',
                  }}
                >
                  ${pack.price}{' '}
                  <span
                    className="text-sm font-semibold"
                    style={{ color: pack.badge ? 'rgba(255,255,255,0.65)' : 'var(--brand-ink-muted)' }}
                  >
                    USD
                  </span>
                </p>
                <p
                  className="mt-4 flex-1 text-sm leading-relaxed"
                  style={{
                    color: pack.badge ? 'rgba(255,255,255,0.78)' : 'var(--brand-ink-soft)',
                  }}
                >
                  {pack.note}
                </p>
                <Link
                  href={pack.checkoutHref}
                  className="mt-6 block w-full rounded-full py-2.5 text-center text-sm font-extrabold transition"
                  style={
                    pack.badge
                      ? {
                          background: 'var(--brand-accent)',
                          color: 'var(--brand-on-accent)',
                        }
                      : {
                          border: '2px solid var(--brand-primary)',
                          color: 'var(--brand-primary)',
                          background: 'transparent',
                        }
                  }
                >
                  Comprar
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
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
      <div
        className="rounded-2xl p-10 text-center text-sm"
        style={{
          border: '1px solid var(--brand-border)',
          background: 'white',
          color: 'var(--brand-ink-soft)',
        }}
      >
        Aún no hay programas activos disponibles. Vuelve más tarde.
      </div>
    );
  }

  return (
    <div>
      <p
        className="mb-8 max-w-[64ch] text-base leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.78)' }}
      >
        Cada programa da acceso completo a la plataforma. Lo que varía es la intensidad del acompañamiento, las sesiones incluidas y la duración de la suscripción.
      </p>

      {/* Mobile (<md): stack de cards por plan */}
      <div className="space-y-4 md:hidden">
        {programs.map((p) => {
          const highlighted = Boolean(p.highlightLabel);
          return (
            <div
              key={p.planId}
              className="overflow-hidden rounded-2xl"
              style={{
                border: highlighted
                  ? '2px solid var(--brand-accent)'
                  : '1px solid var(--brand-border)',
                background: 'white',
                boxShadow: '0 6px 24px rgba(42,20,68,0.06)',
              }}
            >
              <div
                className="px-5 py-5 text-center"
                style={
                  highlighted
                    ? { background: 'var(--brand-dark)', color: 'white' }
                    : { background: 'var(--brand-surface)' }
                }
              >
                {p.highlightLabel && (
                  <span
                    className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                    style={{
                      background: 'var(--brand-accent)',
                      color: 'var(--brand-on-accent)',
                    }}
                  >
                    {p.highlightLabel}
                  </span>
                )}
                <p
                  className="text-base font-black"
                  style={{
                    color: highlighted ? 'white' : 'var(--brand-primary)',
                  }}
                >
                  {p.name}
                </p>
                <p
                  className="mt-1 text-3xl font-black"
                  style={{
                    color: highlighted ? 'var(--brand-accent)' : 'var(--brand-primary)',
                  }}
                >
                  {formatPrice(p.priceAmount)}{' '}
                  <span
                    className="text-xs font-semibold"
                    style={{ color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--brand-ink-muted)' }}
                  >
                    {p.currencyCode}
                  </span>
                </p>
                <p
                  className="mt-1 text-xs font-semibold"
                  style={{ color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--brand-ink-muted)' }}
                >
                  {formatDuration(p.durationDays)}
                </p>
              </div>

              <div className="px-5 py-4">
                {moduleGroups.map((group) => (
                  <div key={group.moduleCode} className="mb-3 last:mb-0">
                    <p
                      className="mb-1 text-[10px] font-extrabold uppercase tracking-widest"
                      style={{ color: 'var(--brand-ink-muted)' }}
                    >
                      {group.moduleLabel}
                    </p>
                    <ul className="space-y-1">
                      {group.features.map((def) => {
                        const f = p.features.find((x) => x.featureKey === def.key);
                        const enabled = f?.isEnabled ?? false;
                        const quota = f?.quota;
                        return (
                          <li key={def.key} className="flex items-start justify-between gap-2 text-sm">
                            <span style={{ color: 'var(--brand-ink-soft)' }}>{def.label}</span>
                            <span className="shrink-0">
                              {enabled ? (
                                quota ? (
                                  <span
                                    className="font-extrabold"
                                    style={{ color: 'var(--brand-primary)' }}
                                  >
                                    {quota}
                                  </span>
                                ) : (
                                  <Check
                                    size={16}
                                    strokeWidth={2.5}
                                    style={{ color: 'var(--brand-primary)' }}
                                  />
                                )
                              ) : (
                                <X
                                  size={14}
                                  style={{ color: 'var(--brand-ink-muted)', opacity: 0.55 }}
                                />
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="border-t px-5 py-4 text-center" style={{ borderColor: 'var(--brand-border)' }}>
                <Link
                  href={`/acceso?plan=${encodeURIComponent(p.planCode)}`}
                  className="inline-block w-full rounded-full px-6 py-3 text-sm font-extrabold transition"
                  style={
                    highlighted
                      ? {
                          background: 'var(--brand-accent)',
                          color: 'var(--brand-on-accent)',
                        }
                      : {
                          border: '2px solid var(--brand-primary)',
                          color: 'var(--brand-primary)',
                          background: 'transparent',
                        }
                  }
                >
                  Comenzar
                </Link>
                <p className="mt-2 text-[10px]" style={{ color: 'var(--brand-ink-muted)' }}>
                  * Precio único. Sin cuotas ocultas.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop (md+): tabla comparativa */}
      <div
        className="hidden overflow-x-auto rounded-2xl md:block"
        style={{
          border: '1px solid var(--brand-border)',
          background: 'white',
          boxShadow: '0 8px 40px rgba(42,20,68,0.07)',
        }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
              <th className="w-56 px-6 py-6 text-left" />
              {programs.map((p) => {
                const highlighted = Boolean(p.highlightLabel);
                return (
                  <th
                    key={p.planId}
                    className="px-5 py-6 text-center align-bottom"
                    style={highlighted ? { background: 'var(--brand-dark)' } : undefined}
                  >
                    {p.highlightLabel && (
                      <span
                        className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                        style={{
                          background: 'var(--brand-accent)',
                          color: 'var(--brand-on-accent)',
                        }}
                      >
                        {p.highlightLabel}
                      </span>
                    )}
                    <p
                      className="text-[15px] font-black"
                      style={{
                        color: highlighted ? 'white' : 'var(--brand-primary)',
                      }}
                    >
                      {p.name}
                    </p>
                    <p
                      className="mt-1 text-2xl font-black"
                      style={{
                        color: highlighted ? 'var(--brand-accent)' : 'var(--brand-primary)',
                      }}
                    >
                      {formatPrice(p.priceAmount)}{' '}
                      <span
                        className="text-xs font-semibold"
                        style={{ color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--brand-ink-muted)' }}
                      >
                        {p.currencyCode}
                      </span>
                    </p>
                    <p
                      className="mt-1 text-[11px] font-semibold"
                      style={{ color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--brand-ink-muted)' }}
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
            <tr style={{ borderBottom: '1px solid var(--brand-border)' }}>
              <td
                colSpan={programs.length + 1}
                className="px-6 py-2.5 text-[10px] font-extrabold uppercase tracking-widest"
                style={{
                  background: 'var(--brand-dark)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Acceso por módulo
              </td>
            </tr>

            {moduleGroups.map((group) =>
              group.features.map((def) => (
                <tr
                  key={def.key}
                  className="transition"
                  style={{ borderBottom: '1px solid var(--brand-border)' }}
                >
                  <td
                    className="px-6 py-3.5 text-sm font-medium"
                    style={{ color: 'var(--brand-ink-soft)' }}
                  >
                    <span
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: 'var(--brand-ink-muted)' }}
                    >
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
                        className="px-5 py-3.5"
                        style={
                          highlighted ? { background: 'var(--brand-surface)' } : undefined
                        }
                      >
                        <div className="flex justify-center">
                          {enabled ? (
                            quota ? (
                              <span
                                className="text-sm font-extrabold"
                                style={{
                                  color: highlighted
                                    ? 'var(--brand-accent)'
                                    : 'var(--brand-primary)',
                                }}
                              >
                                {quota}
                              </span>
                            ) : (
                              <div
                                className="flex h-6 w-6 items-center justify-center rounded-full"
                                style={{
                                  background: 'var(--brand-surface-strong)',
                                }}
                              >
                                <Check
                                  size={13}
                                  strokeWidth={2.5}
                                  style={{
                                    color: highlighted
                                      ? 'var(--brand-accent)'
                                      : 'var(--brand-primary)',
                                  }}
                                />
                              </div>
                            )
                          ) : (
                            <X
                              size={14}
                              style={{ color: 'var(--brand-ink-muted)', opacity: 0.6 }}
                            />
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
              <td className="px-6 py-5 text-[11px]" style={{ color: 'var(--brand-ink-muted)' }}>
                * Precio único. Sin cuotas ocultas.
              </td>
              {programs.map((p) => {
                const highlighted = Boolean(p.highlightLabel);
                return (
                  <td
                    key={p.planId}
                    className="px-5 py-5 text-center"
                    style={highlighted ? { background: 'var(--brand-surface)' } : undefined}
                  >
                    <Link
                      href={`/acceso?plan=${encodeURIComponent(p.planCode)}`}
                      className="inline-block rounded-full px-6 py-2.5 text-sm font-extrabold transition"
                      style={
                        highlighted
                          ? {
                              background: 'var(--brand-accent)',
                              color: 'var(--brand-on-accent)',
                            }
                          : {
                              border: '2px solid var(--brand-primary)',
                              color: 'var(--brand-primary)',
                              background: 'transparent',
                            }
                      }
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
      <div
        className="rounded-2xl p-10 text-center text-sm"
        style={{
          border: '1px solid var(--brand-border)',
          background: 'white',
          color: 'var(--brand-ink-soft)',
        }}
      >
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
      <p
        className="mb-8 max-w-[62ch] text-base leading-relaxed"
        style={{ color: 'rgba(255,255,255,0.78)' }}
      >
        Acceso al Círculo de Líderes 4Shine: sesiones grupales en vivo, cursos exclusivos, comunidad y workshops. Elige la duración que más se ajuste a tu momento.
      </p>
      <div className="mx-auto grid max-w-[960px] gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {circulos.map((plan) => {
          const isHighlight = Boolean(plan.highlightLabel) || plan.planId === longest?.planId;
          return (
            <article
              key={plan.planId}
              className="flex flex-col rounded-3xl p-8"
              style={
                isHighlight
                  ? {
                      border: '1px solid var(--brand-primary)',
                      background: 'var(--brand-dark)',
                      color: 'white',
                      boxShadow: '0 24px 56px rgba(91,45,138,0.22)',
                    }
                  : {
                      border: '1px solid var(--brand-border)',
                      background: 'white',
                      color: 'var(--brand-primary)',
                      boxShadow: '0 8px 32px rgba(42,20,68,0.05)',
                    }
              }
            >
              {plan.highlightLabel && (
                <span
                  className="mb-3 inline-block w-fit rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
                  style={{
                    background: 'var(--brand-accent)',
                    color: 'var(--brand-on-accent)',
                  }}
                >
                  {plan.highlightLabel}
                </span>
              )}
              <p
                className="text-lg font-black"
                style={{ color: isHighlight ? 'white' : 'var(--brand-primary)' }}
              >
                {plan.name}
              </p>
              <p
                className="mt-1 text-3xl font-black"
                style={{
                  color: isHighlight ? 'var(--brand-accent)' : 'var(--brand-primary)',
                }}
              >
                {formatPrice(plan.priceAmount)}{' '}
                <span
                  className="text-sm font-semibold"
                  style={{ color: isHighlight ? 'rgba(255,255,255,0.7)' : 'var(--brand-ink-muted)' }}
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
                        enabled ? '' : 'line-through'
                      }`}
                      style={
                        enabled
                          ? undefined
                          : isHighlight
                            ? { color: 'rgba(255,255,255,0.4)' }
                            : { color: 'var(--brand-ink-muted)', opacity: 0.6 }
                      }
                    >
                      {enabled ? (
                        <Check
                          size={14}
                          strokeWidth={2.5}
                          className="mt-0.5 shrink-0"
                          style={{
                            color: isHighlight
                              ? 'var(--brand-accent)'
                              : 'var(--brand-primary)',
                          }}
                        />
                      ) : (
                        <X size={14} className="mt-0.5 shrink-0 opacity-40" />
                      )}
                      <span
                        style={{
                          color: isHighlight
                            ? 'rgba(255,255,255,0.82)'
                            : 'var(--brand-ink-soft)',
                        }}
                      >
                        {def.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/acceso?plan=${encodeURIComponent(plan.planCode)}`}
                className="mt-8 block w-full rounded-full py-3 text-center text-sm font-extrabold transition"
                style={
                  isHighlight
                    ? {
                        background: 'var(--brand-accent)',
                        color: 'var(--brand-on-accent)',
                      }
                    : {
                        border: '2px solid var(--brand-primary)',
                        color: 'var(--brand-primary)',
                        background: 'transparent',
                      }
                }
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
