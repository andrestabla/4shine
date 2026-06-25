'use client';

import React from 'react';
import { CreditCard, RefreshCcw, Search, ShieldAlert } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  listMentorshipPaymentsAdmin,
  listPaymentAttemptsAdmin,
  refundMentorshipOrder,
  type MentorshipPaymentRecord,
  type PaymentAttemptRecord,
} from '@/features/payments/client';

type StatusFilter = 'all' | 'paid' | 'awaiting_payment' | 'failed' | 'refunded' | 'pending';
type ProviderFilter = 'all' | 'stripe' | 'wompi' | 'manual';

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  paid: { label: 'Pagado', tone: 'bg-emerald-100 text-emerald-800' },
  awaiting_payment: { label: 'En proceso', tone: 'bg-amber-100 text-amber-800' },
  pending: { label: 'Pendiente', tone: 'bg-slate-100 text-slate-700' },
  failed: { label: 'Fallido', tone: 'bg-rose-100 text-rose-800' },
  refunded: { label: 'Reembolsado', tone: 'bg-violet-100 text-violet-800' },
  cancelled: { label: 'Cancelado', tone: 'bg-slate-200 text-slate-700' },
};

const PROVIDER_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  wompi: 'Wompi',
  manual: 'Manual',
};

function formatCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: (currency || 'COP').toUpperCase(),
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return value;
  }
}

export default function PagosAdminPage() {
  const { alert, confirm, prompt } = useAppDialog();
  const [orders, setOrders] = React.useState<MentorshipPaymentRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refundingOrderId, setRefundingOrderId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [providerFilter, setProviderFilter] = React.useState<ProviderFilter>('all');
  const [search, setSearch] = React.useState('');
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);
  const [attemptsByOrderId, setAttemptsByOrderId] = React.useState<Record<string, PaymentAttemptRecord[]>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMentorshipPaymentsAdmin();
      setOrders(data);
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudieron cargar los pagos.',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [alert]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && (o.paymentStatus ?? 'pending') !== statusFilter) return false;
      if (providerFilter !== 'all' && (o.paymentProvider ?? 'manual') !== providerFilter) return false;
      if (q) {
        const hay = [
          o.ownerName,
          o.ownerEmail,
          o.mentorName ?? '',
          o.title,
          o.topic ?? '',
          o.orderId,
          o.paymentReference ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, providerFilter, search]);

  const stats = React.useMemo(() => {
    const acc = {
      paidCount: 0,
      paidAmount: 0,
      refundedCount: 0,
      refundedAmount: 0,
      failedCount: 0,
    };
    for (const o of orders) {
      if (o.paymentStatus === 'paid') {
        acc.paidCount++;
        acc.paidAmount += o.priceAmount;
      } else if (o.paymentStatus === 'refunded') {
        acc.refundedCount++;
        acc.refundedAmount += o.priceAmount;
      } else if (o.paymentStatus === 'failed') {
        acc.failedCount++;
      }
    }
    return acc;
  }, [orders]);

  const toggleExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!attemptsByOrderId[orderId]) {
      try {
        const attempts = await listPaymentAttemptsAdmin(orderId);
        setAttemptsByOrderId((prev) => ({ ...prev, [orderId]: attempts }));
      } catch (error) {
        await alert({
          title: 'Error',
          message: error instanceof Error ? error.message : 'No se pudo cargar el historial.',
          tone: 'error',
        });
      }
    }
  };

  const handleRefund = async (order: MentorshipPaymentRecord) => {
    const reason = await prompt({
      title: 'Reembolso',
      message: `Motivo del reembolso para "${order.title}" (líder: ${order.ownerName})`,
      label: 'Motivo',
      placeholder: 'Ej: Cancelación solicitada por el líder…',
      multiline: true,
      confirmText: 'Continuar',
      cancelText: 'Cancelar',
    });
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      await alert({ title: 'Motivo requerido', message: 'Debes ingresar un motivo.', tone: 'warning' });
      return;
    }
    const ok = await confirm({
      title: 'Confirmar reembolso',
      message: `Se devolverá ${formatCurrency(order.priceAmount, order.currencyCode)} al líder vía ${
        order.paymentProvider ? PROVIDER_LABELS[order.paymentProvider] : 'método manual'
      }. Esta acción no se puede deshacer.`,
      tone: 'warning',
      confirmText: 'Reembolsar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;

    setRefundingOrderId(order.orderId);
    try {
      await refundMentorshipOrder({ orderId: order.orderId, reason: trimmed });
      await alert({
        title: 'Reembolso procesado',
        message: 'Se notificó al líder y se actualizó el estado de la orden.',
        tone: 'success',
      });
      await load();
      // refresh attempts cache for this order
      setAttemptsByOrderId((prev) => {
        const next = { ...prev };
        delete next[order.orderId];
        return next;
      });
    } catch (error) {
      await alert({
        title: 'Error al reembolsar',
        message: error instanceof Error ? error.message : 'No se pudo procesar el reembolso.',
        tone: 'error',
      });
    } finally {
      setRefundingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Pagos de mentorías"
        subtitle="Historial de transacciones de sesiones adicionales, intentos por proveedor y reembolsos."
      />

      {/* Stats */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="app-panel p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">Pagadas</p>
          <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{stats.paidCount}</p>
          <p className="text-xs text-[var(--app-muted)]">
            {formatCurrency(stats.paidAmount, orders[0]?.currencyCode ?? 'COP')} recaudados
          </p>
        </div>
        <div className="app-panel p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">Reembolsadas</p>
          <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{stats.refundedCount}</p>
          <p className="text-xs text-[var(--app-muted)]">
            {formatCurrency(stats.refundedAmount, orders[0]?.currencyCode ?? 'COP')} devueltos
          </p>
        </div>
        <div className="app-panel p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">Fallidas</p>
          <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{stats.failedCount}</p>
          <p className="text-xs text-[var(--app-muted)]">Intentos no completados</p>
        </div>
      </section>

      {/* Filtros */}
      <section className="app-panel p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por líder, mentor, título, código…"
              className="w-full rounded-[12px] border border-[var(--app-border)] bg-white pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="paid">Pagado</option>
            <option value="awaiting_payment">En proceso</option>
            <option value="pending">Pendiente</option>
            <option value="failed">Fallido</option>
            <option value="refunded">Reembolsado</option>
          </select>
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value as ProviderFilter)}
            className="rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm"
          >
            <option value="all">Todos los proveedores</option>
            <option value="stripe">Stripe</option>
            <option value="wompi">Wompi</option>
            <option value="manual">Manual</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center justify-center gap-1.5 rounded-[12px] border border-[var(--app-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--app-ink)] hover:border-[var(--brand-primary)]"
          >
            <RefreshCcw size={13} />
            Refrescar
          </button>
        </div>
      </section>

      {/* Tabla */}
      <section className="app-panel overflow-hidden p-0">
        {loading ? (
          <div className="p-6 text-center text-sm text-[var(--app-muted)]">Cargando pagos…</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No hay órdenes que coincidan con los filtros seleccionados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--app-surface-muted)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--app-muted)]">
                <tr>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Líder</th>
                  <th className="px-4 py-3">Advisor</th>
                  <th className="px-4 py-3">Monto</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const meta = STATUS_LABELS[order.paymentStatus ?? 'pending'] ?? STATUS_LABELS.pending;
                  const isExpanded = expandedOrderId === order.orderId;
                  const canRefund = order.paymentStatus === 'paid';
                  const attempts = attemptsByOrderId[order.orderId] ?? null;
                  return (
                    <React.Fragment key={order.orderId}>
                      <tr className="border-t border-[var(--app-border)] hover:bg-[var(--app-surface-muted)]/40">
                        <td className="px-4 py-3 font-mono text-xs text-[var(--app-muted)]">
                          {order.orderId.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[var(--app-ink)]">{order.ownerName}</p>
                          <p className="text-xs text-[var(--app-muted)]">{order.ownerEmail}</p>
                        </td>
                        <td className="px-4 py-3 text-[var(--app-ink)]">{order.mentorName ?? '—'}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--app-ink)]">
                          {formatCurrency(order.priceAmount, order.currencyCode)}
                        </td>
                        <td className="px-4 py-3 text-xs uppercase tracking-wider text-[var(--app-muted)]">
                          {order.paymentProvider
                            ? PROVIDER_LABELS[order.paymentProvider] ?? order.paymentProvider
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.tone}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--app-muted)]">
                          {formatDateTime(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              onClick={() => void toggleExpand(order.orderId)}
                              className="rounded-[10px] border border-[var(--app-border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--app-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                            >
                              {isExpanded ? 'Ocultar' : 'Detalle'}
                            </button>
                            {canRefund && (
                              <button
                                type="button"
                                disabled={refundingOrderId === order.orderId}
                                onClick={() => void handleRefund(order)}
                                className="rounded-[10px] border border-rose-200 bg-white px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              >
                                {refundingOrderId === order.orderId ? 'Procesando…' : 'Reembolsar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-t border-[var(--app-border)] bg-[var(--app-surface-muted)]/60">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                  Detalle de la reserva
                                </p>
                                <ul className="space-y-0.5 text-xs text-[var(--app-ink)]">
                                  <li>
                                    <span className="text-[var(--app-muted)]">Sesión:</span> {order.title}
                                  </li>
                                  {order.topic && (
                                    <li>
                                      <span className="text-[var(--app-muted)]">Tema:</span> {order.topic}
                                    </li>
                                  )}
                                  <li>
                                    <span className="text-[var(--app-muted)]">Fecha:</span>{' '}
                                    {formatDateTime(order.scheduledStartsAt)}
                                  </li>
                                  <li>
                                    <span className="text-[var(--app-muted)]">Referencia:</span>{' '}
                                    {order.paymentReference ? (
                                      <span className="font-mono">{order.paymentReference}</span>
                                    ) : (
                                      '—'
                                    )}
                                  </li>
                                  {order.paidAt && (
                                    <li>
                                      <span className="text-[var(--app-muted)]">Pagado:</span>{' '}
                                      {formatDateTime(order.paidAt)}
                                    </li>
                                  )}
                                  {order.refundedAt && (
                                    <li className="flex items-center gap-1 text-violet-700">
                                      <ShieldAlert size={11} />
                                      <span className="text-[var(--app-muted)]">Reembolsado:</span>{' '}
                                      {formatDateTime(order.refundedAt)}
                                    </li>
                                  )}
                                  {order.refundReason && (
                                    <li>
                                      <span className="text-[var(--app-muted)]">Motivo reembolso:</span>{' '}
                                      {order.refundReason}
                                    </li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                                  Historial de intentos
                                </p>
                                {attempts === null ? (
                                  <p className="text-xs text-[var(--app-muted)]">Cargando…</p>
                                ) : attempts.length === 0 ? (
                                  <p className="text-xs text-[var(--app-muted)]">Sin intentos registrados.</p>
                                ) : (
                                  <ul className="space-y-1">
                                    {attempts.map((attempt) => (
                                      <li
                                        key={attempt.attemptId}
                                        className="rounded-[10px] border border-[var(--app-border)] bg-white px-2.5 py-1.5 text-[11px]"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-semibold text-[var(--app-ink)]">
                                            {PROVIDER_LABELS[attempt.provider] ?? attempt.provider} ·{' '}
                                            {attempt.status}
                                          </span>
                                          <span className="text-[var(--app-muted)]">
                                            {formatDateTime(attempt.createdAt)}
                                          </span>
                                        </div>
                                        {attempt.reference && (
                                          <p className="mt-0.5 truncate font-mono text-[var(--app-muted)]">
                                            {attempt.reference}
                                          </p>
                                        )}
                                        {attempt.errorMessage && (
                                          <p className="mt-0.5 text-rose-700">{attempt.errorMessage}</p>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
        <CreditCard size={12} />
        Solo se muestran las últimas 500 órdenes. Los reembolsos solo aplican a órdenes en estado <b>Pagado</b>.
      </p>
    </div>
  );
}
