'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Pencil,
  Power,
  Trash2,
  Plus,
  Save,
  X,
  Stethoscope,
  GraduationCap,
} from 'lucide-react';
import {
  createProduct,
  deleteProduct,
  listProducts,
  setProductActive,
  updateProduct,
} from '@/features/productos/client';
import type {
  CreateProductInput,
  ProductGroup,
  ProductRecord,
  UpdateProductInput,
} from '@/features/productos/types';

const GROUP_LABELS: Record<ProductGroup, string> = {
  discovery: 'Diagnóstico',
  mentoring_pack: 'Packs de Mentorías',
  program: 'Programa (legacy)',
};

const GROUP_ICONS: Record<ProductGroup, typeof Stethoscope> = {
  discovery: Stethoscope,
  mentoring_pack: GraduationCap,
  program: GraduationCap,
};

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function ProductosSection() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [creating, setCreating] = useState<ProductGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listProducts({ includeInactive: true });
      if (cancelled) return;
      if (res.ok && res.data) setProducts(res.data);
      else setError(res.error ?? 'Error al cargar productos');
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    const res = await listProducts({ includeInactive: true });
    if (res.ok && res.data) setProducts(res.data);
  }

  async function handleToggleActive(p: ProductRecord) {
    setBusyCode(p.productCode);
    const res = await setProductActive(p.productCode, !p.isActive);
    if (res.ok && res.data) {
      setProducts((prev) => prev.map((x) => (x.productCode === p.productCode ? res.data! : x)));
    } else {
      alert(res.error ?? 'Error al actualizar');
    }
    setBusyCode(null);
  }

  async function handleDelete(p: ProductRecord) {
    if (p.isSystem) {
      alert('No puedes eliminar un producto del sistema. Desactívalo en su lugar.');
      return;
    }
    if (!confirm(`¿Eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`)) return;
    setBusyCode(p.productCode);
    const res = await deleteProduct(p.productCode);
    if (res.ok) setProducts((prev) => prev.filter((x) => x.productCode !== p.productCode));
    else alert(res.error ?? 'Error al eliminar');
    setBusyCode(null);
  }

  const grouped = useMemo(() => {
    const groups: Record<ProductGroup, ProductRecord[]> = {
      discovery: [],
      mentoring_pack: [],
      program: [],
    };
    for (const p of products) {
      groups[p.productGroup].push(p);
    }
    return groups;
  }, [products]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-[var(--app-muted)]">Cargando productos…</div>;
  }
  if (error) {
    return (
      <div className="rounded-[1rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(['discovery', 'mentoring_pack'] as ProductGroup[]).map((group) => {
        const Icon = GROUP_ICONS[group];
        const list = grouped[group];
        return (
          <section key={group} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--app-muted)]">
                <Icon size={14} />
                {GROUP_LABELS[group]}
              </h2>
              <button
                onClick={() => setCreating(group)}
                className="flex items-center gap-1.5 rounded-md border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]"
              >
                <Plus size={13} />
                Nuevo {group === 'discovery' ? 'producto' : 'pack'}
              </button>
            </div>

            {list.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-[var(--app-border)] p-6 text-center text-sm text-[var(--app-muted)]">
                No hay productos en esta categoría todavía.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[1rem] border border-[var(--app-border)] bg-white">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                  <thead className="bg-[var(--app-surface-muted)]">
                    <tr className="border-b border-[var(--app-border)]">
                      <th className="px-4 py-3 text-left font-semibold text-[var(--app-ink)]">Producto</th>
                      <th className="px-4 py-3 text-right font-semibold text-[var(--app-ink)]">Precio</th>
                      <th className="px-4 py-3 text-right font-semibold text-[var(--app-ink)]">
                        {group === 'mentoring_pack' ? 'Sesiones' : '—'}
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-[var(--app-ink)]">Estado</th>
                      <th className="px-4 py-3 text-right font-semibold text-[var(--app-ink)]">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => (
                      <tr
                        key={p.productCode}
                        className="border-b border-[var(--app-border)] last:border-b-0 hover:bg-[var(--app-surface-muted)]/40"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[var(--app-ink)]">
                              {p.name}
                              {p.highlightLabel && (
                                <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                  {p.highlightLabel}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-[var(--app-muted)]">
                              <code>{p.productCode}</code>
                              {p.isSystem && (
                                <span className="ml-2 text-[10px] uppercase tracking-wider">
                                  · sistema
                                </span>
                              )}
                              {p.headline && <span className="ml-2">· {p.headline}</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[var(--app-ink)]">
                          {formatPrice(p.priceAmount, p.currencyCode)}
                        </td>
                        <td className="px-4 py-3 text-right text-[var(--app-muted)]">
                          {group === 'mentoring_pack' ? p.sessionsIncluded : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.isActive ? (
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
                            <button
                              onClick={() => setEditing(p)}
                              className="rounded-md p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)]"
                              title="Editar"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(p)}
                              disabled={busyCode === p.productCode}
                              className="rounded-md p-2 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-ink)] disabled:opacity-50"
                              title={p.isActive ? 'Desactivar' : 'Activar'}
                            >
                              <Power size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              disabled={busyCode === p.productCode || p.isSystem}
                              className="rounded-md p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                              title={p.isSystem ? 'No se puede eliminar un producto del sistema' : 'Eliminar'}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}

      {editing && (
        <ProductModal
          mode="edit"
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}

      {creating && (
        <ProductModal
          mode="create"
          group={creating}
          onClose={() => setCreating(null)}
          onSaved={async () => {
            setCreating(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

// ─── Modal editor (create/edit) ──────────────────────────────────────────────

interface ProductModalProps {
  mode: 'create' | 'edit';
  product?: ProductRecord;
  group?: ProductGroup;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

function ProductModal({ mode, product, group, onClose, onSaved }: ProductModalProps) {
  const effectiveGroup: ProductGroup = product?.productGroup ?? group ?? 'mentoring_pack';
  const isMentoringPack = effectiveGroup === 'mentoring_pack';

  const [productCode, setProductCode] = useState(product?.productCode ?? '');
  const [name, setName] = useState(product?.name ?? '');
  const [headline, setHeadline] = useState(product?.headline ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [priceAmount, setPriceAmount] = useState<number>(product?.priceAmount ?? 0);
  const [currencyCode, setCurrencyCode] = useState(product?.currencyCode ?? 'USD');
  const [sessionsIncluded, setSessionsIncluded] = useState<number>(product?.sessionsIncluded ?? 0);
  const [highlightLabel, setHighlightLabel] = useState(product?.highlightLabel ?? '');
  const [isActive, setIsActive] = useState<boolean>(product?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState<number>(product?.sortOrder ?? 100);
  const [checkoutUrl, setCheckoutUrl] = useState(product?.checkoutUrl ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (mode === 'create' && !/^[a-z0-9_]{2,60}$/.test(productCode.trim())) {
      setError('product_code inválido (snake_case, 2-60 chars).');
      return;
    }
    if (priceAmount < 0) {
      setError('El precio no puede ser negativo.');
      return;
    }

    setSaving(true);
    if (mode === 'create') {
      const body: CreateProductInput = {
        productCode: productCode.trim(),
        productGroup: effectiveGroup,
        name: name.trim(),
        headline: headline.trim(),
        description: description.trim(),
        priceAmount,
        currencyCode,
        sessionsIncluded: isMentoringPack ? sessionsIncluded : 0,
        highlightLabel: highlightLabel.trim() || null,
        isActive,
        sortOrder,
        checkoutUrl: checkoutUrl.trim() || null,
      };
      const res = await createProduct(body);
      if (!res.ok) {
        setError(res.error ?? 'Error al crear.');
        setSaving(false);
        return;
      }
    } else if (product) {
      const body: UpdateProductInput = {
        name: name.trim(),
        headline: headline.trim(),
        description: description.trim(),
        priceAmount,
        currencyCode,
        sessionsIncluded: isMentoringPack ? sessionsIncluded : 0,
        highlightLabel: highlightLabel.trim() || null,
        isActive,
        sortOrder,
        checkoutUrl: checkoutUrl.trim() || null,
      };
      const res = await updateProduct(product.productCode, body);
      if (!res.ok) {
        setError(res.error ?? 'Error al guardar.');
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    await onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-[1rem] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
          <h3 className="text-base font-semibold text-[var(--app-ink)]">
            {mode === 'create' ? 'Nuevo' : 'Editar'} ·{' '}
            {effectiveGroup === 'discovery' ? 'Diagnóstico' : 'Pack de Mentorías'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Nombre
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Código
              </label>
              <input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value.toLowerCase())}
                disabled={mode === 'edit'}
                className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 font-mono text-sm disabled:bg-[var(--app-surface-muted)] disabled:text-[var(--app-muted)]"
                placeholder="mentoring_pack_10"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Headline
              </label>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
                placeholder="Pack expansión"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Etiqueta destacada
              </label>
              <input
                value={highlightLabel}
                onChange={(e) => setHighlightLabel(e.target.value)}
                className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
                placeholder="Mejor valor (opcional)"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Enlace del botón "Comprar" (pago o asesor)
              </label>
              <input
                type="url"
                value={checkoutUrl}
                onChange={(e) => setCheckoutUrl(e.target.value)}
                className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
                placeholder="https://… (centro de pagos o contacto con asesor)"
              />
              <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                Destino del botón en la página pública. Si se deja vacío, se usa el flujo por defecto.
              </p>
            </div>

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

            {isMentoringPack && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                  Sesiones incluidas
                </label>
                <input
                  type="number"
                  min="0"
                  value={sessionsIncluded}
                  onChange={(e) => setSessionsIncluded(Number(e.target.value))}
                  className="w-full rounded-md border border-[var(--app-border)] px-3 py-2 text-sm"
                />
              </div>
            )}

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

          <label className="flex items-center gap-2 text-sm text-[var(--app-ink)]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4"
            />
            Producto activo (visible en la plataforma)
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--app-border)] bg-[var(--app-surface-muted)] px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-[var(--app-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="app-button-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
