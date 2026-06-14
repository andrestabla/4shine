"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CalendarClock, CreditCard, Sparkles, ArrowRight } from "lucide-react";
import { listPublicPlans, type SubscriptionPlanWithFeatures } from "@/features/planes/client";
import { groupFeaturesByModule } from "@/features/planes/features-catalog";
import type { PlanFeatureKey } from "@/features/planes/types";

interface MySubscriptionSectionProps {
  currentPlanId: string | null;
  expiresAt?: string | null;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: (currency ?? "USD").toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(days: number): string {
  if (days % 30 === 0 && days >= 30) {
    const months = days / 30;
    return months === 1 ? "1 mes" : `${months} meses`;
  }
  return `${days} días`;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-CO", { dateStyle: "long" });
}

export function MySubscriptionSection({ currentPlanId, expiresAt }: MySubscriptionSectionProps) {
  const [plans, setPlans] = useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await listPublicPlans();
      if (res.ok && res.data) setPlans(res.data);
      setLoading(false);
    })();
  }, []);

  const moduleGroups = useMemo(() => groupFeaturesByModule(), []);
  const activePlan = useMemo(
    () => (currentPlanId ? plans.find((p) => p.planId === currentPlanId) ?? null : null),
    [plans, currentPlanId],
  );

  const enabledFeatures = useMemo(() => {
    if (!activePlan) return new Map<PlanFeatureKey, { quota: number | null }>();
    const map = new Map<PlanFeatureKey, { quota: number | null }>();
    for (const f of activePlan.features) {
      if (f.isEnabled) map.set(f.featureKey, { quota: f.quota });
    }
    return map;
  }, [activePlan]);

  const vigencia = formatDate(expiresAt ?? null);

  return (
    <section className="app-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
          <CreditCard size={18} />
          Mi suscripción
        </h4>
        <Link
          href="/dashboard/suscripcion"
          className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
        >
          {activePlan ? "Cambiar plan" : "Ver planes"}
          <ArrowRight size={13} />
        </Link>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-[var(--app-muted)]">Cargando tu suscripción…</p>
      ) : activePlan ? (
        <>
          <div className="mt-4 overflow-hidden rounded-[14px] border border-[var(--brand-primary)]/30 bg-gradient-to-br from-[var(--brand-primary)]/5 via-white to-[var(--brand-accent)]/10 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    <Sparkles size={11} />
                    Plan activo
                  </span>
                  {activePlan.highlightLabel && (
                    <span className="rounded-full bg-[var(--brand-accent)]/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
                      {activePlan.highlightLabel}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-base font-extrabold text-[var(--app-ink)]">{activePlan.name}</p>
                {activePlan.description && (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--app-muted)]">
                    {activePlan.description}
                  </p>
                )}
                {vigencia && (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)]">
                    <CalendarClock size={12} />
                    Vigente hasta {vigencia}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-[var(--brand-primary)]">
                  {formatPrice(activePlan.priceAmount, activePlan.currencyCode)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--app-muted)]">
                  {formatDuration(activePlan.durationDays)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
              Características incluidas
            </p>
            {enabledFeatures.size === 0 ? (
              <p className="rounded-[10px] border border-dashed border-[var(--app-border)] p-3 text-xs text-[var(--app-muted)]">
                Este plan aún no tiene características configuradas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
                {moduleGroups
                  .map((mg) => ({
                    moduleLabel: mg.moduleLabel,
                    features: mg.features.filter((def) => enabledFeatures.has(def.key)),
                  }))
                  .filter((mg) => mg.features.length > 0)
                  .map((mg) => (
                    <div key={mg.moduleLabel}>
                      <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
                        {mg.moduleLabel}
                      </p>
                      <ul className="space-y-1.5">
                        {mg.features.map((def) => {
                          const quota = enabledFeatures.get(def.key)?.quota;
                          const label = quota ? `${def.label} (${quota})` : def.label;
                          return (
                            <li key={def.key} className="flex items-start gap-2 text-xs text-[var(--app-ink)]">
                              <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600" />
                              <span>{label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-[12px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
          <p className="text-sm font-semibold text-[var(--app-ink)]">No tienes un plan activo.</p>
          <p className="mt-1 text-xs text-[var(--app-muted)]">
            Explora los planes disponibles para activar el acceso a los módulos de la plataforma.
          </p>
          <Link
            href="/dashboard/suscripcion"
            className="app-button-primary mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            Ver planes y precios
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </section>
  );
}
