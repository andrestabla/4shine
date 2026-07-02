'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, X, Lock, CheckCircle2 } from 'lucide-react';
import { listPublicPlans } from '@/features/planes/client';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/client';
import { groupFeaturesByModule, PLAN_FEATURES } from '@/features/planes/features-catalog';
import type { PlanFeatureKey } from '@/features/planes/types';

interface SubscriptionPlansGridProps {
  currentPlanId?: string | null;
  /** moduleCode que originó la conversión: resalta los planes que lo incluyen. */
  highlightModule?: string | null;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
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

export function SubscriptionPlansGrid({ currentPlanId, highlightModule }: SubscriptionPlansGridProps) {
  const [plans, setPlans] = useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<'program' | 'circulo' | 'custom' | 'all'>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await listPublicPlans();
      if (res.ok && res.data) setPlans(res.data);
      else setError(res.error ?? 'Error al cargar los planes.');
      setLoading(false);
    })();
  }, []);

  // Claves de feature del módulo que originó la conversión (para resaltar planes).
  const highlightKeys = useMemo(() => {
    if (!highlightModule) return null;
    const keys = new Set<PlanFeatureKey>(
      PLAN_FEATURES.filter((f) => f.moduleCode === highlightModule).map((f) => f.key),
    );
    return keys.size > 0 ? keys : null;
  }, [highlightModule]);

  const planIncludesHighlight = useMemo(() => {
    return (plan: SubscriptionPlanWithFeatures): boolean =>
      highlightKeys ? plan.features.some((f) => f.isEnabled && highlightKeys.has(f.featureKey)) : false;
  }, [highlightKeys]);

  const visiblePlans = useMemo(() => {
    const filtered = activeGroup === 'all' ? plans : plans.filter((p) => p.planGroup === activeGroup);
    if (!highlightKeys) return filtered;
    // Los que incluyen el módulo destacado primero.
    return [...filtered].sort(
      (a, b) => Number(planIncludesHighlight(b)) - Number(planIncludesHighlight(a)),
    );
  }, [plans, activeGroup, highlightKeys, planIncludesHighlight]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const p of plans) set.add(p.planGroup);
    return Array.from(set);
  }, [plans]);

  const moduleGroups = useMemo(() => groupFeaturesByModule(), []);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--app-muted)]">
        Cargando planes disponibles…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {error}
      </div>
    );
  }
  if (plans.length === 0) {
    return (
      <div className="rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-6 text-center text-sm text-[var(--app-muted)]">
        Aún no hay planes activos. Vuelve más tarde.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveGroup('all')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              activeGroup === 'all'
                ? 'bg-[var(--app-ink)] text-white'
                : 'border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            Todos
          </button>
          {groups.includes('program') && (
            <button
              onClick={() => setActiveGroup('program')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                activeGroup === 'program'
                  ? 'bg-[var(--app-ink)] text-white'
                  : 'border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
              }`}
            >
              Programas
            </button>
          )}
          {groups.includes('circulo') && (
            <button
              onClick={() => setActiveGroup('circulo')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                activeGroup === 'circulo'
                  ? 'bg-[var(--app-ink)] text-white'
                  : 'border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
              }`}
            >
              Círculo de Líderes
            </button>
          )}
          {groups.includes('custom') && (
            <button
              onClick={() => setActiveGroup('custom')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                activeGroup === 'custom'
                  ? 'bg-[var(--app-ink)] text-white'
                  : 'border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
              }`}
            >
              Personalizado
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visiblePlans.map((plan) => {
          const isCurrent = currentPlanId === plan.planId;
          const includesHighlight = planIncludesHighlight(plan);
          const featuresMap = new Map<PlanFeatureKey, { isEnabled: boolean; quota: number | null }>();
          for (const f of plan.features) {
            featuresMap.set(f.featureKey, { isEnabled: f.isEnabled, quota: f.quota });
          }

          return (
            <article
              key={plan.planId}
              className={`flex flex-col rounded-[1.25rem] border p-6 shadow-sm transition ${
                isCurrent
                  ? 'border-emerald-400 bg-emerald-50/40'
                  : plan.highlightLabel
                    ? 'border-[var(--app-ink)] bg-[var(--app-ink)] text-white'
                    : includesHighlight
                      ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/30 bg-white'
                      : 'border-[var(--app-border)] bg-white'
              }`}
            >
              {includesHighlight && !isCurrent && (
                <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-[var(--brand-primary)] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  <Check size={10} strokeWidth={3} /> Incluye lo que buscas
                </span>
              )}
              {(plan.highlightLabel || isCurrent) && (
                <span
                  className={`mb-3 inline-block w-fit rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    isCurrent
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {isCurrent ? 'Tu plan actual' : plan.highlightLabel}
                </span>
              )}

              <h3
                className={`text-lg font-extrabold ${
                  plan.highlightLabel && !isCurrent ? 'text-white' : 'text-[var(--app-ink)]'
                }`}
              >
                {plan.name}
              </h3>

              <p
                className={`mt-3 text-3xl font-black ${
                  plan.highlightLabel && !isCurrent ? 'text-amber-300' : 'text-[var(--app-ink)]'
                }`}
              >
                {formatPrice(plan.priceAmount, plan.currencyCode)}{' '}
                <span
                  className={`text-sm font-semibold ${
                    plan.highlightLabel && !isCurrent ? 'text-white/70' : 'text-[var(--app-muted)]'
                  }`}
                >
                  {plan.currencyCode}
                </span>
              </p>
              <p
                className={`mt-1 text-xs font-semibold ${
                  plan.highlightLabel && !isCurrent ? 'text-white/70' : 'text-[var(--app-muted)]'
                }`}
              >
                Suscripción · {formatDuration(plan.durationDays)}
              </p>

              {plan.description && (
                <p
                  className={`mt-4 text-sm leading-relaxed ${
                    plan.highlightLabel && !isCurrent ? 'text-white/80' : 'text-[var(--app-muted)]'
                  }`}
                >
                  {plan.description.length > 220
                    ? `${plan.description.slice(0, 220)}…`
                    : plan.description}
                </p>
              )}

              <ul className="mt-5 flex-1 space-y-1.5">
                {moduleGroups.map((mg) =>
                  mg.features.map((def) => {
                    const f = featuresMap.get(def.key);
                    const enabled = f?.isEnabled ?? false;
                    const quota = f?.quota;
                    const label = quota ? `${def.label} (${quota})` : def.label;
                    return (
                      <li
                        key={def.key}
                        className={`flex items-start gap-2 text-xs ${
                          enabled
                            ? plan.highlightLabel && !isCurrent
                              ? 'text-white'
                              : 'text-[var(--app-ink)]'
                            : plan.highlightLabel && !isCurrent
                              ? 'text-white/40 line-through'
                              : 'text-[var(--app-muted)]/60 line-through'
                        }`}
                      >
                        {enabled ? (
                          <Check
                            size={13}
                            strokeWidth={3}
                            className={`mt-0.5 shrink-0 ${
                              plan.highlightLabel && !isCurrent ? 'text-amber-300' : 'text-emerald-600'
                            }`}
                          />
                        ) : (
                          <X size={13} strokeWidth={2.5} className="mt-0.5 shrink-0 opacity-40" />
                        )}
                        <span>{label}</span>
                      </li>
                    );
                  }),
                )}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="flex items-center justify-center gap-2 rounded-full bg-emerald-100 py-2.5 text-xs font-extrabold text-emerald-800">
                    <CheckCircle2 size={14} />
                    Plan activo
                  </div>
                ) : (() => {
                  // El botón usa el comportamiento configurado en el plan
                  // (/administracion/planes): checkoutType (pagos/WhatsApp),
                  // checkoutUrl y ctaLabel. Si no hay URL configurada, cae al
                  // flujo por defecto (/acceso?plan=).
                  const isWhatsapp = plan.checkoutType === 'whatsapp';
                  const configuredUrl = plan.checkoutUrl?.trim() ?? '';
                  const waDigits = isWhatsapp ? configuredUrl.replace(/\D/g, '') : '';
                  const waMessage = encodeURIComponent(
                    `Hola, me interesa el plan ${plan.name} de 4Shine.`,
                  );
                  const external = isWhatsapp ? Boolean(waDigits) : Boolean(configuredUrl);
                  const href = isWhatsapp
                    ? waDigits
                      ? `https://wa.me/${waDigits}?text=${waMessage}`
                      : `/acceso?plan=${encodeURIComponent(plan.planCode)}`
                    : configuredUrl || `/acceso?plan=${encodeURIComponent(plan.planCode)}`;
                  const label =
                    plan.ctaLabel?.trim() || (isWhatsapp ? 'Saber más' : 'Adquirir plan');
                  const className = `block w-full rounded-full py-2.5 text-center text-sm font-extrabold transition ${
                    plan.highlightLabel
                      ? 'bg-amber-300 text-[var(--app-ink)] hover:bg-amber-200'
                      : 'border-2 border-[var(--app-ink)] text-[var(--app-ink)] hover:bg-[var(--app-ink)] hover:text-white'
                  }`;
                  return external ? (
                    <a href={href} target="_blank" rel="noreferrer" className={className}>
                      {label}
                    </a>
                  ) : (
                    <Link href={href} className={className}>
                      {label}
                    </Link>
                  );
                })()}
              </div>

              <p
                className={`mt-3 text-[10px] uppercase tracking-wider text-center ${
                  plan.highlightLabel && !isCurrent ? 'text-white/40' : 'text-[var(--app-muted)]/70'
                }`}
              >
                ID: <code>{plan.planCode}</code>
              </p>
            </article>
          );
        })}
      </div>

      {visiblePlans.length === 0 && (
        <div className="rounded-[1rem] border border-dashed border-[var(--app-border)] p-8 text-center text-sm text-[var(--app-muted)]">
          <Lock size={20} className="mx-auto mb-2 opacity-50" />
          No hay planes en esta categoría todavía.
        </div>
      )}
    </div>
  );
}
