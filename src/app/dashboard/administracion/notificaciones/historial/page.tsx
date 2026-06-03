'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  X,
  Zap,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { listHistory } from '@/features/notificaciones/broadcast-client';
import type {
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationHistoryFilter,
  NotificationHistoryRow,
} from '@/features/notificaciones/types';

const STATUS_LABEL: Record<NotificationDeliveryStatus, string> = {
  sent: 'Enviado',
  delivered: 'Entregado',
  opened: 'Abierto',
  bounced: 'Rebotado',
  complaint: 'Queja',
  failed: 'Falló',
};

function StatusBadge({ status }: { status: NotificationDeliveryStatus }) {
  const map: Record<NotificationDeliveryStatus, { bg: string; color: string; icon: React.ReactNode }> = {
    sent: { bg: 'bg-slate-100', color: 'text-slate-700', icon: <Clock size={11} /> },
    delivered: { bg: 'bg-blue-50', color: 'text-blue-700', icon: <CheckCircle2 size={11} /> },
    opened: { bg: 'bg-emerald-50', color: 'text-emerald-700', icon: <Eye size={11} /> },
    bounced: { bg: 'bg-amber-50', color: 'text-amber-700', icon: <AlertTriangle size={11} /> },
    complaint: { bg: 'bg-rose-50', color: 'text-rose-700', icon: <AlertTriangle size={11} /> },
    failed: { bg: 'bg-rose-50', color: 'text-rose-700', icon: <X size={11} /> },
  };
  const { bg, color, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${bg} px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${color}`}>
      {icon}
      {STATUS_LABEL[status]}
    </span>
  );
}

function fmt(date: string | null): string {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistorialPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<NotificationHistoryFilter>({
    limit: 50,
    offset: 0,
    source: 'all',
  });
  const [rows, setRows] = React.useState<NotificationHistoryRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<NotificationHistoryRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHistory(filter);
      setRows(data.rows);
      setTotal(data.total);
    } catch (error) {
      console.error('[historial]', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateFilter = (next: Partial<NotificationHistoryFilter>) => {
    setFilter((prev) => ({ ...prev, ...next, offset: 0 }));
  };

  const page = Math.floor((filter.offset ?? 0) / (filter.limit ?? 50)) + 1;
  const pageSize = filter.limit ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => router.push('/dashboard/administracion/notificaciones')}
        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-muted)] hover:text-[var(--app-ink)]"
      >
        <ArrowLeft size={14} /> Volver al hub
      </button>

      <PageTitle
        title="Historial de envíos"
        subtitle="Registro de todos los mensajes que salen de la plataforma (manuales y automáticos), con fecha, remitente, destinatario, estado de entrega y apertura."
      />

      <section className="app-panel p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">Buscar destinatario</span>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
              <input
                className="app-input pl-8"
                placeholder="Nombre o correo"
                value={filter.recipientSearch ?? ''}
                onChange={(e) => updateFilter({ recipientSearch: e.target.value })}
              />
            </div>
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">Canal</span>
            <select
              className="app-select mt-1"
              value={filter.channel ?? ''}
              onChange={(e) => updateFilter({ channel: (e.target.value as NotificationChannel) || undefined })}
            >
              <option value="">Todos</option>
              <option value="email">Email</option>
              <option value="in_app">In-app</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">Origen</span>
            <select
              className="app-select mt-1"
              value={filter.source ?? 'all'}
              onChange={(e) => updateFilter({ source: e.target.value as NotificationHistoryFilter['source'] })}
            >
              <option value="all">Todos</option>
              <option value="manual">Manual (broadcast)</option>
              <option value="automatic">Automático (sistema)</option>
            </select>
          </label>
          <label>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">Estado</span>
            <select
              className="app-select mt-1"
              value={filter.status ?? ''}
              onChange={(e) =>
                updateFilter({ status: (e.target.value as NotificationDeliveryStatus) || undefined })
              }
            >
              <option value="">Todos</option>
              <option value="sent">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="opened">Abierto</option>
              <option value="bounced">Rebotado</option>
              <option value="failed">Falló</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-60"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Actualizar
          </button>
          <span className="text-xs text-[var(--app-muted)]">
            {loading ? 'Cargando…' : `${total} registros`}
          </span>
        </div>
      </section>

      <section className="app-panel overflow-x-auto p-0">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="border-b border-[var(--app-border)] text-xs uppercase text-[var(--app-muted)]">
            <tr>
              <th className="px-3 py-2">Fecha / hora</th>
              <th className="px-3 py-2">Canal</th>
              <th className="px-3 py-2">Remitente</th>
              <th className="px-3 py-2">Destinatario</th>
              <th className="px-3 py-2">Asunto / título</th>
              <th className="px-3 py-2">Entregado</th>
              <th className="px-3 py-2">Abierto</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.notificationId} className="border-b border-[var(--app-border)] last:border-b-0 hover:bg-[var(--app-chip)]">
                <td className="px-3 py-2 text-xs">{fmt(row.createdAt)}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold">
                    {row.channel === 'email' ? <Mail size={12} /> : <Zap size={12} />}
                    {row.channel === 'email' ? 'Email' : 'In-app'}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {row.senderName ? (
                    <span className="font-semibold text-[var(--app-ink)]">{row.senderName}</span>
                  ) : (
                    <span className="text-[var(--app-muted)]">Sistema</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  <p className="font-semibold text-[var(--app-ink)]">{row.recipientName}</p>
                  {row.recipientEmail && (
                    <p className="text-[var(--app-muted)]">{row.recipientEmail}</p>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  <p className="line-clamp-1 max-w-xs font-semibold text-[var(--app-ink)]">{row.title}</p>
                  {row.eventKey && (
                    <p className="text-[var(--app-muted)]">{row.eventKey}</p>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">{fmt(row.deliveredAt)}</td>
                <td className="px-3 py-2 text-xs">{fmt(row.openedAt)}</td>
                <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-2 py-1 text-xs font-semibold hover:bg-[var(--app-chip)]"
                  >
                    <Eye size={11} /> Ver
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-[var(--app-muted)]">
                No hay registros con los filtros aplicados.
              </td></tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="flex items-center justify-between text-xs text-[var(--app-muted)]">
        <span>Página {page} de {totalPages}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setFilter((p) => ({ ...p, offset: Math.max(0, (p.offset ?? 0) - pageSize) }))}
            className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 font-semibold disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setFilter((p) => ({ ...p, offset: (p.offset ?? 0) + pageSize }))}
            className="rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 font-semibold disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--app-border)] p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--app-muted)]">
                  {selected.channel === 'email' ? 'Email' : 'In-app'} · {selected.eventKey ?? '—'}
                </p>
                <h2 className="mt-1 text-xl font-bold text-[var(--app-ink)]">{selected.title}</h2>
                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  De: {selected.senderName ?? 'Sistema'} · Para: {selected.recipientName}{' '}
                  {selected.recipientEmail && `(${selected.recipientEmail})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-2 text-[var(--app-muted)] hover:bg-[var(--app-chip)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-[var(--app-border)] px-5 py-3 text-xs">
              <div>
                <p className="font-bold text-[var(--app-muted)]">Creado</p>
                <p className="text-[var(--app-ink)]">{fmt(selected.createdAt)}</p>
              </div>
              <div>
                <p className="font-bold text-[var(--app-muted)]">Entregado</p>
                <p className="text-[var(--app-ink)]">{fmt(selected.deliveredAt)}</p>
              </div>
              <div>
                <p className="font-bold text-[var(--app-muted)]">Abierto</p>
                <p className="text-[var(--app-ink)]">{fmt(selected.openedAt)}</p>
              </div>
              <div>
                <p className="font-bold text-[var(--app-muted)]">Estado</p>
                <StatusBadge status={selected.status} />
              </div>
              {selected.failureReason && (
                <div className="col-span-2">
                  <p className="font-bold text-rose-700">Motivo de fallo</p>
                  <p className="text-rose-700">{selected.failureReason}</p>
                </div>
              )}
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-5">
              {selected.bodyHtmlSnapshot ? (
                <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    Cuerpo HTML enviado
                  </p>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selected.bodyHtmlSnapshot }}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    Mensaje
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--app-ink)]">{selected.message}</p>
                </div>
              )}
              {selected.actionUrl && (
                <p className="mt-3 text-xs text-[var(--app-muted)]">
                  CTA: <a href={selected.actionUrl} className="text-[var(--brand-primary)] underline" target="_blank" rel="noopener noreferrer">{selected.actionUrl}</a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
