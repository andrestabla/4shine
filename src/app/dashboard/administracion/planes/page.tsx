'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { listPlans, setPlanActive, deletePlan } from '@/features/planes/client';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/client';
import { PLAN_FEATURES, groupFeaturesByModule } from '@/features/planes/features-catalog';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Power, CreditCard, Package } from 'lucide-react';
import { ProductosSection } from '@/components/dashboard/planes/ProductosSection';

const GROUP_LABELS: Record<string, string> = {
  program: 'Programas',
  circulo: 'Círculo de Líderes',
  custom: 'Personalizado',
};

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

type AdminTab = 'planes' | 'productos';

export default function PlanesAdminPage() {
  const [tab, setTab] = useState<AdminTab>('planes');
  const [plans, setPlans] = useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listPlans(true);
      if (cancelled) return;
      if (res.ok && res.data) setPlans(res.data);
      else setError(res.error ?? 'Error al cargar planes');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleActive(plan: SubscriptionPlanWithFeatures) {
    setBusyId(plan.planId);
    const res = await setPlanActive(plan.planId, !plan.isActive);
    if (res.ok && res.data) {
      setPlans((prev) => prev.map((p) => (p.planId === plan.planId ? res.data! : p)));
    } else {
      alert(res.error ?? 'Error al actualizar');
    }
    setBusyId(null);
  }

  async function handleDelete(plan: SubscriptionPlanWithFeatures) {
    if (plan.isSystem) {
      alert('No puedes eliminar un plan del sistema. Desactívalo en su lugar.');
      return;
    }
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(plan.planId);
    const res = await deletePlan(plan.planId);
    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.planId !== plan.planId));
    } else {
      alert(res.error ?? 'Error al eliminar');
    }
    setBusyId(null);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, SubscriptionPlanWithFeatures[]>();
    for (const plan of plans) {
      const list = map.get(plan.planGroup) ?? [];
      list.push(plan);
      map.set(plan.planGroup, list);
    }
    return Array.from(map.entries()).map(([group, list]) => ({ group, list }));
  }, [plans]);

  const moduleGroups = useMemo(() => groupFeaturesByModule(), []);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Planes y Precios"
        subtitle="Administra los planes de suscripción y los productos puntuales (diagnóstico, packs de mentorías) disponibles en la plataforma."
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--app-border)]">
        <button
          onClick={() => setTab('planes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'planes'
              ? 'border-[var(--app-ink)] text-[var(--app-ink)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}
        >
          <CreditCard size={15} />
          Planes de suscripción
        </button>
        <button
          onClick={() => setTab('productos')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'productos'
              ? 'border-[var(--app-ink)] text-[var(--app-ink)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}
        >
          <Package size={15} />
          Productos puntuales
        </button>
      </div>

      {tab === 'productos' && <ProductosSection />}

      {tab === 'planes' && (
      <>
      <div className="flex justify-end">
        <Link
          href="/dashboard/administracion/planes/nuevo"
          className="app-button-primary flex items-center gap-2 px-4 py-2.5 text-sm"
        >
          <Plus size={16} />
          Nuevo plan
        </Link>
      </div>

      {loading && (
        <div className="py-16 text-center text-sm text-[var(--app-muted)]">Cargando planes…</div>
      )}

      {error && (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {!loading && !error && plans.length === 0 && (
        <div className="py-16 text-center text-sm text-[var(--app-muted)]">
          Aún no hay planes configurados. Crea uno para comenzar.
        </div>
      )}

      {!loading && !error && plans.length > 0 && (
        <div className="space-y-8">
          {grouped.map(({ group, list }) => (
            <section key={group} className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--app-muted)]">
                {GROUP_LABELS[group] ?? group}
              </h2>

              <div className="overflow-x-auto rounded-[1rem] border border-[var(--app-border)] bg-white">
                <table className="w-full min-w-[1000px] border-collapse text-sm">
                  <thead className="bg-[var(--app-surface-muted)]">
                    <tr className="border-b border-[var(--app-border)]">
                      <th className="px-4 py-3 text-left font-semibold text-[var(--app-ink)]">Plan</th>
                      <th className="px-4 py-3 text-right font-semibold text-[var(--app-ink)]">Precio</th>
                      <th className="px-4 py-3 text-right font-semibold text-[var(--app-ink)]">Duración</th>
                      <th className="px-4 py-3 text-center font-semibold text-[var(--app-ink)]">Módulos</th>
                      <th className="px-4 py-3 text-center font-semibold text-[var(--app-ink)]">Estado</th>
                      <th className="px-4 py-3 text-right font-semibold text-[var(--app-ink)]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((plan) => {
                      const enabledCount = plan.features.filter((f) => f.isEnabled).length;
                      const totalCount = PLAN_FEATURES.length;
                      return (
                        <tr
                          key={plan.planId}
                          className="border-b border-[var(--app-border)] last:border-b-0 hover:bg-[var(--app-surface-muted)]/40"
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-[var(--app-ink)]">
                                {plan.name}
                                {plan.highlightLabel && (
                                  <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                    {plan.highlightLabel}
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-[var(--app-muted)]">
                                <code>{plan.planCode}</code>
                                {plan.isSystem && (
                                  <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--app-muted)]">
                                    · sistema
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[var(--app-ink)]">
                            {formatPrice(plan.priceAmount, plan.currencyCode)}
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--app-muted)]">
                            {plan.durationDays} días
                          </td>
                          <td className="px-4 py-3 text-center text-[var(--app-muted)]">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs font-semibold">
                              {enabledCount}/{totalCount}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {plan.isActive ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                <CheckCircle size={12} /> Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                <XCircle size={12} /> Inactivo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Link
                                href={`/dashboard/administracion/planes/${plan.planId}`}
                                className="rounded-md p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
                                title="Editar"
                              >
                                <Pencil size={15} />
                              </Link>
                              <button
                                onClick={() => handleToggleActive(plan)}
                                disabled={busyId === plan.planId}
                                className="rounded-md p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)] disabled:opacity-50"
                                title={plan.isActive ? 'Desactivar' : 'Activar'}
                              >
                                <Power size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(plan)}
                                disabled={busyId === plan.planId || plan.isSystem}
                                className="rounded-md p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                                title={plan.isSystem ? 'No se puede eliminar un plan del sistema' : 'Eliminar'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="rounded-[1rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm text-[var(--app-muted)]">
        <p className="mb-2 font-medium text-[var(--app-ink)]">Módulos del sistema disponibles</p>
        <p className="leading-relaxed">
          Cada plan puede habilitar permisos sobre estos módulos:{' '}
          <span className="font-medium text-[var(--app-ink)]">
            {moduleGroups.map((g) => g.moduleLabel).join(' · ')}
          </span>
          .
        </p>
      </div>
      </>
      )}
    </div>
  );
}
