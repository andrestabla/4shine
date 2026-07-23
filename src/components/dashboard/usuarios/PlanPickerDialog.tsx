'use client';

import React from 'react';
import { X, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { listPlans } from '@/features/planes/client';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';

const GROUP_LABEL: Record<string, string> = {
  program: 'Programas',
  circulo: 'Círculo de Líderes',
  custom: 'Otros',
};

function formatPrice(amount: number, currency: string): string {
  if (!amount) return 'Sin costo';
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * Selector de plan reutilizable (barra de acciones masivas y wizard de carga).
 * Devuelve el plan elegido; no ejecuta nada por sí mismo.
 */
export function PlanPickerDialog({
  title,
  description,
  confirmLabel = 'Asignar plan',
  busy = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: (plan: SubscriptionPlanWithFeatures) => void;
  onClose: () => void;
}) {
  const [plans, setPlans] = React.useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string>('');

  React.useEffect(() => {
    let alive = true;
    listPlans(false)
      .then((r) => { if (alive) setPlans(r.ok ? (r.data ?? []) : []); })
      .catch(() => { if (alive) setPlans([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const grouped = React.useMemo(() => {
    const map = new Map<string, SubscriptionPlanWithFeatures[]>();
    for (const p of plans) {
      const g = p.planGroup ?? 'custom';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }
    return [...map.entries()];
  }, [plans]);

  const selected = plans.find((p) => p.planId === selectedId) ?? null;

  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-[rgba(22,10,38,0.55)] p-4 backdrop-blur-sm">
      <div className="mt-10 w-[min(94vw,560px)] rounded-[20px] border border-[var(--app-border)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[var(--brand-primary)]" />
            <h3 className="text-base font-black text-[var(--app-ink)]">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-[var(--app-muted)]">{description}</p>

          <div className="mt-4 max-h-[46vh] space-y-4 overflow-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-[var(--app-muted)]"><Loader2 size={16} className="mr-1 inline animate-spin" /> Cargando planes…</p>
            ) : plans.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--app-muted)]">No hay planes activos. Créalos en Administración → Planes.</p>
            ) : (
              grouped.map(([group, items]) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">{GROUP_LABEL[group] ?? group}</p>
                  <div className="space-y-2">
                    {items.map((plan) => {
                      const active = plan.planId === selectedId;
                      return (
                        <button
                          key={plan.planId}
                          type="button"
                          onClick={() => setSelectedId(plan.planId)}
                          className={`flex w-full items-center justify-between rounded-[12px] border px-4 py-3 text-left transition ${
                            active
                              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                              : 'border-[var(--app-border)] hover:border-[var(--app-muted)]'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--app-ink)]">{plan.name}</p>
                            <p className="text-xs text-[var(--app-muted)]">
                              {formatPrice(plan.priceAmount, plan.currencyCode)}
                              {plan.durationDays ? ` · ${plan.durationDays} días de vigencia` : ''}
                            </p>
                          </div>
                          {active && <CheckCircle2 size={18} className="shrink-0 text-[var(--brand-primary)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="app-button-secondary">Cancelar</button>
            <button
              type="button"
              disabled={!selected || busy}
              onClick={() => selected && onConfirm(selected)}
              className="app-button-primary disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
