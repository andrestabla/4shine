'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLAN_FEATURES, groupFeaturesByModule } from '@/features/planes/features-catalog';
import { createPlan, updatePlan } from '@/features/planes/client';
import type {
  CreatePlanInput,
  PlanFeatureInput,
  SubscriptionPlanWithFeatures,
  UpdatePlanInput,
} from '@/features/planes/types';
import type { PlanFeatureKey } from '@/features/planes/types';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PlanEditorProps {
  initial?: SubscriptionPlanWithFeatures;
}

interface FeatureState {
  isEnabled: boolean;
  quota: number | null;
}

type FeatureMap = Record<PlanFeatureKey, FeatureState>;

function buildInitialFeatures(plan?: SubscriptionPlanWithFeatures): FeatureMap {
  const map = {} as FeatureMap;
  for (const def of PLAN_FEATURES) {
    map[def.key] = { isEnabled: false, quota: null };
  }
  if (plan) {
    for (const f of plan.features) {
      map[f.featureKey] = { isEnabled: f.isEnabled, quota: f.quota };
    }
  }
  return map;
}

export function PlanEditor({ initial }: PlanEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [planCode, setPlanCode] = useState(initial?.planCode ?? '');
  const [planGroup, setPlanGroup] = useState<'program' | 'circulo' | 'custom'>(
    initial?.planGroup ?? 'custom',
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [highlightLabel, setHighlightLabel] = useState(initial?.highlightLabel ?? '');
  const [priceAmount, setPriceAmount] = useState<number>(initial?.priceAmount ?? 0);
  const [currencyCode, setCurrencyCode] = useState(initial?.currencyCode ?? 'USD');
  const [durationDays, setDurationDays] = useState<number>(initial?.durationDays ?? 30);
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 100);
  const [checkoutUrl, setCheckoutUrl] = useState(initial?.checkoutUrl ?? '');
  const [checkoutType, setCheckoutType] = useState<'payment' | 'whatsapp'>(
    initial?.checkoutType ?? 'payment',
  );
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? '');
  const [features, setFeatures] = useState<FeatureMap>(() => buildInitialFeatures(initial));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moduleGroups = useMemo(() => groupFeaturesByModule(), []);

  function updateFeature(key: PlanFeatureKey, patch: Partial<FeatureState>) {
    setFeatures((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function buildFeatureInputs(): PlanFeatureInput[] {
    return PLAN_FEATURES.map((def) => ({
      featureKey: def.key,
      isEnabled: features[def.key].isEnabled,
      quota: def.supportsQuota ? features[def.key].quota : null,
    }));
  }

  async function handleSave() {
    setError(null);

    if (!name.trim()) {
      setError('El nombre del plan es obligatorio.');
      return;
    }
    if (!isEdit) {
      if (!/^[a-z0-9_]{2,60}$/.test(planCode.trim())) {
        setError('El código del plan debe ser snake_case (2-60 chars).');
        return;
      }
    }
    if (priceAmount < 0) {
      setError('El precio no puede ser negativo.');
      return;
    }
    if (durationDays <= 0) {
      setError('La duración debe ser mayor a 0 días.');
      return;
    }

    setSaving(true);

    if (isEdit && initial) {
      const body: UpdatePlanInput = {
        planGroup,
        name: name.trim(),
        description: description.trim(),
        highlightLabel: highlightLabel.trim() || null,
        priceAmount,
        currencyCode,
        durationDays,
        isActive,
        sortOrder,
        checkoutUrl: checkoutUrl.trim() || null,
        checkoutType,
        ctaLabel: ctaLabel.trim() || null,
        features: buildFeatureInputs(),
      };
      const res = await updatePlan(initial.planId, body);
      if (!res.ok) {
        setError(res.error ?? 'Error al guardar.');
        setSaving(false);
        return;
      }
    } else {
      const body: CreatePlanInput = {
        planCode: planCode.trim(),
        planGroup,
        name: name.trim(),
        description: description.trim(),
        highlightLabel: highlightLabel.trim() || null,
        priceAmount,
        currencyCode,
        durationDays,
        isActive,
        sortOrder,
        checkoutUrl: checkoutUrl.trim() || null,
        checkoutType,
        ctaLabel: ctaLabel.trim() || null,
        features: buildFeatureInputs(),
      };
      const res = await createPlan(body);
      if (!res.ok) {
        setError(res.error ?? 'Error al crear.');
        setSaving(false);
        return;
      }
    }

    router.push('/dashboard/administracion/planes');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/administracion/planes"
          className="flex items-center gap-2 text-sm text-[var(--app-muted)] hover:text-[var(--app-ink)]"
        >
          <ArrowLeft size={14} />
          Volver a planes
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="app-button-primary flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear plan'}
        </button>
      </div>

      {error && (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Datos generales */}
      <section className="rounded-[1rem] border border-[var(--app-border)] bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-[var(--app-ink)]">Datos generales</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Nombre del plan
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
              placeholder="Programa Marca Ejecutiva"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Código (ID)
            </label>
            <input
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value.toLowerCase())}
              disabled={isEdit}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 font-mono text-sm disabled:bg-[var(--app-surface-muted)] disabled:text-[var(--app-muted)]"
              placeholder="marca_ejecutiva"
            />
            {!isEdit && (
              <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                snake_case, 2-60 chars. No se puede modificar luego.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Categoría
            </label>
            <select
              value={planGroup}
              onChange={(e) => setPlanGroup(e.target.value as 'program' | 'circulo' | 'custom')}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
            >
              <option value="program">Programa</option>
              <option value="circulo">Círculo</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Etiqueta destacada
            </label>
            <input
              value={highlightLabel}
              onChange={(e) => setHighlightLabel(e.target.value)}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
              placeholder="Más elegido (opcional)"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
              placeholder="Descripción comercial del plan…"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Destino del botón
            </label>
            <select
              value={checkoutType}
              onChange={(e) => setCheckoutType(e.target.value as 'payment' | 'whatsapp')}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
            >
              <option value="payment">Centro de pagos</option>
              <option value="whatsapp">Asesor (WhatsApp)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Texto del botón
            </label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
              placeholder={checkoutType === 'whatsapp' ? 'Saber más' : 'Comenzar'}
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              {checkoutType === 'whatsapp'
                ? 'Número de WhatsApp (con código de país)'
                : 'Enlace de pago'}
            </label>
            <input
              type="text"
              value={checkoutUrl}
              onChange={(e) => setCheckoutUrl(e.target.value)}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
              placeholder={checkoutType === 'whatsapp' ? '+57 300 123 4567' : 'https://… (centro de pagos)'}
            />
            <p className="mt-1 text-[11px] text-[var(--app-muted)]">
              {checkoutType === 'whatsapp'
                ? 'Al hacer clic se abre WhatsApp con un mensaje predefinido que incluye el nombre del plan.'
                : 'Destino del botón en la página pública. Si se deja vacío, se usa el flujo por defecto.'}
            </p>
          </div>
        </div>
      </section>

      {/* Precios y duración */}
      <section className="rounded-[1rem] border border-[var(--app-border)] bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-[var(--app-ink)]">Precio y vigencia</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Precio
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceAmount}
              onChange={(e) => setPriceAmount(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Moneda
            </label>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="COP">COP</option>
              <option value="MXN">MXN</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Duración (días)
            </label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Orden
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-[var(--app-ink)]">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          Plan activo (visible en la página de suscripción del líder)
        </label>
      </section>

      {/* Permisos por módulo */}
      <section className="rounded-[1rem] border border-[var(--app-border)] bg-white p-6">
        <h3 className="mb-1 text-base font-semibold text-[var(--app-ink)]">Permisos por módulo</h3>
        <p className="mb-4 text-sm text-[var(--app-muted)]">
          Define qué módulos del sistema están incluidos en este plan. Las mentorías permiten configurar cupo numérico.
        </p>

        <div className="space-y-5">
          {moduleGroups.map((group) => (
            <div key={group.moduleCode}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--app-muted)]">
                {group.moduleLabel}
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {group.features.map((def) => {
                  const state = features[def.key];
                  return (
                    <div
                      key={def.key}
                      className="flex items-start gap-3 rounded-md border border-[var(--app-border)] p-3"
                    >
                      <label className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={state.isEnabled}
                          onChange={(e) =>
                            updateFeature(def.key, { isEnabled: e.target.checked })
                          }
                          className="h-4 w-4"
                        />
                        <span className="flex flex-col">
                          <span className="text-sm font-medium text-[var(--app-ink)]">
                            {def.label}
                          </span>
                          <span className="text-[11px] text-[var(--app-muted)]">
                            {def.description}
                          </span>
                        </span>
                      </label>

                      {def.supportsQuota && state.isEnabled && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={state.quota ?? ''}
                            onChange={(e) =>
                              updateFeature(def.key, {
                                quota: e.target.value === '' ? null : Number(e.target.value),
                              })
                            }
                            placeholder="∞"
                            className="w-16 rounded-md border border-[var(--app-border)] px-2 py-1 text-xs"
                          />
                          <span className="text-[11px] text-[var(--app-muted)]">cupo</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
