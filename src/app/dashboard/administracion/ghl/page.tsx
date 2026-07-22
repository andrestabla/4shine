'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Link2,
  RefreshCcw,
  Search,
  ShieldAlert,
  Webhook,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { formatDateTime as formatDateTimeShared } from '@/lib/format-date';
import {
  getGhlDashboard,
  retryGhlEvent,
  updateGhlProgram,
  type GhlDashboardData,
} from '@/features/ghl/client';
import { listPlans } from '@/features/planes/client';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';

const STATUS_META: Record<string, { label: string; tone: string }> = {
  created: { label: 'Usuario creado', tone: 'bg-emerald-100 text-emerald-800' },
  updated: { label: 'Actualizado', tone: 'bg-sky-100 text-sky-800' },
  renewed: { label: 'Renovado', tone: 'bg-emerald-100 text-emerald-800' },
  cancel_scheduled: { label: 'Cancelación programada', tone: 'bg-amber-100 text-amber-800' },
  suspended: { label: 'Suspendido', tone: 'bg-amber-100 text-amber-800' },
  access_revoked: { label: 'Acceso revocado', tone: 'bg-violet-100 text-violet-800' },
  duplicate_ignored: { label: 'Duplicado ignorado', tone: 'bg-slate-100 text-slate-700' },
  unknown_program: { label: 'Producto no mapeado', tone: 'bg-rose-100 text-rose-800' },
  invalid_signature: { label: 'Firma inválida', tone: 'bg-rose-100 text-rose-800' },
  invalid_payload: { label: 'Payload inválido', tone: 'bg-rose-100 text-rose-800' },
  error: { label: 'Error', tone: 'bg-rose-100 text-rose-800' },
  received: { label: 'En proceso', tone: 'bg-slate-100 text-slate-700' },
};

const EVENT_LABELS: Record<string, string> = {
  purchase_completed: 'Compra completada',
  subscription_renewed: 'Renovación',
  subscription_cancelled: 'Cancelación',
  payment_failed: 'Pago fallido',
  refund_issued: 'Reembolso',
};

const FAILURE_STATUSES = new Set([
  'unknown_program',
  'invalid_signature',
  'invalid_payload',
  'error',
]);

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  try {
    return formatDateTimeShared(value);
  } catch {
    return value;
  }
}

export default function GhlAdminPage() {
  const { alert, confirm } = useAppDialog();
  const [data, setData] = React.useState<GhlDashboardData | null>(null);
  const [plans, setPlans] = React.useState<SubscriptionPlanWithFeatures[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');
  const [busyEventId, setBusyEventId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, planList] = await Promise.all([
        getGhlDashboard({ status: statusFilter, search: search.trim() || null, limit: 200 }),
        listPlans(true).catch(() => ({ ok: false, data: undefined })),
      ]);
      setData(dashboard);
      setPlans(planList.data ?? []);
    } catch (error) {
      await alert({
        title: 'No se pudo cargar el reporte',
        message: error instanceof Error ? error.message : 'Error desconocido.',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, alert]);

  React.useEffect(() => {
    void load();
    // Se recarga al cambiar el filtro de estado; la búsqueda se dispara con Enter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function handleRetry(eventId: string) {
    const ok = await confirm({
      title: 'Reprocesar evento',
      message:
        'Se volverá a ejecutar el aprovisionamiento con el payload almacenado. Úsalo después de corregir el mapeo del producto.',
      confirmText: 'Reprocesar',
    });
    if (!ok) return;
    setBusyEventId(eventId);
    try {
      const result = await retryGhlEvent(eventId);
      await alert({ title: 'Evento reprocesado', message: result.message });
      await load();
    } catch (error) {
      await alert({
        title: 'No se pudo reprocesar',
        message: error instanceof Error ? error.message : 'Error desconocido.',
      });
    } finally {
      setBusyEventId(null);
    }
  }

  async function handleProgramChange(programId: string, planId: string) {
    try {
      await updateGhlProgram({ programId, planId: planId || null });
      await load();
    } catch (error) {
      await alert({
        title: 'No se pudo guardar el mapeo',
        message: error instanceof Error ? error.message : 'Error desconocido.',
      });
    }
  }

  async function copyWebhookUrl() {
    if (!data?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(data.webhookUrl);
      await alert({ title: 'URL copiada', message: data.webhookUrl });
    } catch {
      await alert({ title: 'Copia manualmente', message: data.webhookUrl });
    }
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <PageTitle
        title="GoHighLevel (GHL)"
        subtitle="Compras recibidas desde el embudo comercial, alta automática de usuarios y asignación de plan."
      />

      {/* Estado de la integración */}
      {data && !data.configured && (
        <div className="flex items-start gap-2 rounded-[1rem] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          <p>
            La integración está <strong>deshabilitada o sin secreto configurado</strong>. Los webhooks
            entrantes serán rechazados. Configúrala en{' '}
            <Link className="underline" href="/dashboard/administracion/integraciones">
              Administración → Integraciones → GoHighLevel
            </Link>
            .
          </p>
        </div>
      )}

      {/* URL del webhook */}
      <div className="app-list-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[var(--app-ink)] text-white">
            <Webhook size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[var(--app-ink)]">URL del webhook</h3>
            <p className="mt-1 break-all font-mono text-sm text-[var(--app-muted)]">
              {data?.webhookUrl ?? '—'}
            </p>
          </div>
          <button type="button" onClick={copyWebhookUrl} className="app-btn-secondary flex items-center gap-2 px-3 py-2 text-sm">
            <Copy size={15} /> Copiar
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">
          Es la misma URL para todos los productos: el campo <code>program_id</code> del{' '}
          <code>customData</code> determina qué plan se asigna. GHL debe enviar el secreto compartido
          en el header <code>x-4shine-token</code> (o la firma HMAC en <code>x-4shine-signature</code>).
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Eventos recibidos" value={stats?.total ?? 0} />
        <StatCard label="Últimas 24 h" value={stats?.last24h ?? 0} />
        <StatCard label="Usuarios provisionados" value={stats?.provisioned ?? 0} tone="emerald" />
        <StatCard label="Fallos" value={stats?.failures ?? 0} tone={stats?.failures ? 'rose' : undefined} />
      </div>

      {/* Mapeo de productos */}
      <div className="app-list-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Link2 size={18} className="text-[var(--app-muted)]" />
          <h3 className="font-semibold text-[var(--app-ink)]">Mapeo de productos GHL → planes 4Shine</h3>
        </div>
        {stats && stats.unmappedPrograms > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-[0.85rem] border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <p>
              Hay <strong>{stats.unmappedPrograms}</strong> producto(s) activo(s) sin plan asignado. Las
              compras de esos productos fallarán con <em>Producto no mapeado</em>.
            </p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[var(--app-border)] text-left text-xs uppercase tracking-wide text-[var(--app-muted)]">
                <th className="py-2 pr-3">Producto (program_id)</th>
                <th className="py-2 pr-3">Plan 4Shine</th>
                <th className="py-2 pr-3">Vigencia</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(data?.programs ?? []).map((program) => (
                <tr key={program.programId} className="border-b border-[var(--app-border)]/60">
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-[var(--app-ink)]">{program.label}</div>
                    <code className="text-xs text-[var(--app-muted)]">{program.programId}</code>
                  </td>
                  <td className="py-2.5 pr-3">
                    {program.kind === 'diagnostico' ? (
                      // El diagnóstico no se asigna por plan: el acceso viene de
                      // una compra puntual, así que no hay nada que elegir aquí.
                      <span className="text-[var(--app-muted)]">
                        No aplica · compra puntual de Descubrimiento
                      </span>
                    ) : (
                      <select
                        value={program.planId ?? ''}
                        onChange={(event) => void handleProgramChange(program.programId, event.target.value)}
                        className="app-input w-full min-w-[180px] py-1.5 text-sm"
                      >
                        <option value="">— Sin asignar —</option>
                        {plans.map((plan) => (
                          <option key={plan.planId} value={plan.planId}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-[var(--app-muted)]">
                    {program.kind === 'diagnostico'
                      ? 'Sin vencimiento'
                      : program.durationDays
                        ? `${program.durationDays} días`
                        : 'Según el plan'}
                  </td>
                  <td className="py-2.5 pr-3 text-[var(--app-muted)]">{program.roleOverride ?? 'lider'}</td>
                  <td className="py-2.5">
                    {program.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 size={14} /> Activo
                      </span>
                    ) : (
                      <span className="text-[var(--app-muted)]">Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bitácora de eventos */}
      <div className="app-list-card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="mr-auto font-semibold text-[var(--app-ink)]">Webhooks recibidos</h3>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void load();
              }}
              placeholder="Correo, transacción o producto…"
              className="app-input py-1.5 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="app-input py-1.5 text-sm"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void load()}
            className="app-btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
          >
            <RefreshCcw size={15} /> Actualizar
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--app-muted)]">Cargando…</p>
        ) : (data?.events.length ?? 0) === 0 ? (
          <EmptyState
            title="Sin webhooks registrados"
            message="Cuando GHL reporte una compra, el evento aparecerá aquí con el resultado del aprovisionamiento."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border)] text-left text-xs uppercase tracking-wide text-[var(--app-muted)]">
                  <th className="py-2 pr-3">Recibido</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Producto / evento</th>
                  <th className="py-2 pr-3">Resultado</th>
                  <th className="py-2 pr-3">Usuario en 4Shine</th>
                  <th className="py-2">Vence</th>
                </tr>
              </thead>
              <tbody>
                {(data?.events ?? []).map((event) => {
                  const meta = STATUS_META[event.status] ?? { label: event.status, tone: 'bg-slate-100 text-slate-700' };
                  const isFailure = FAILURE_STATUSES.has(event.status);
                  const isExpanded = expandedId === event.eventId;
                  return (
                    <React.Fragment key={event.eventId}>
                      <tr
                        className="cursor-pointer border-b border-[var(--app-border)]/60 hover:bg-[var(--app-surface-hover)]"
                        onClick={() => setExpandedId(isExpanded ? null : event.eventId)}
                      >
                        <td className="py-2.5 pr-3 whitespace-nowrap text-[var(--app-muted)]">
                          {formatDateTime(event.receivedAt)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-[var(--app-ink)]">
                            {[event.firstName, event.lastName].filter(Boolean).join(' ') || '—'}
                          </div>
                          <div className="text-xs text-[var(--app-muted)]">{event.email}</div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="text-[var(--app-ink)]">{event.productName ?? event.programId ?? '—'}</div>
                          <div className="text-xs text-[var(--app-muted)]">
                            {EVENT_LABELS[event.eventType] ?? event.eventType}
                            {event.mode === 'test' && ' · test'}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.tone}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--app-muted)]">
                          {event.userDisplayName ?? '—'}
                          {event.planName && (
                            <div className="text-xs">{event.planName}</div>
                          )}
                        </td>
                        <td className="py-2.5 whitespace-nowrap text-[var(--app-muted)]">
                          {event.expiresAt ? formatDateTime(event.expiresAt) : '—'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-[var(--app-border)]/60 bg-[var(--app-surface-hover)]/50">
                          <td colSpan={6} className="px-3 py-4">
                            <p className="text-sm text-[var(--app-ink)]">{event.resultMessage ?? 'Sin detalle.'}</p>
                            <p className="mt-2 text-xs text-[var(--app-muted)]">
                              Transacción: <code>{event.transactionId}</code> · Firma:{' '}
                              {event.signatureOk ? 'válida' : 'inválida'} · Procesado:{' '}
                              {formatDateTime(event.processedAt)}
                            </p>
                            <pre className="mt-3 max-h-56 overflow-auto rounded-[0.75rem] bg-[var(--app-ink)]/5 p-3 text-xs">
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                            {isFailure && (
                              <button
                                type="button"
                                disabled={busyEventId === event.eventId}
                                onClick={(clickEvent) => {
                                  clickEvent.stopPropagation();
                                  void handleRetry(event.eventId);
                                }}
                                className="app-btn-primary mt-3 flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-60"
                              >
                                <RefreshCcw size={15} />
                                {busyEventId === event.eventId ? 'Reprocesando…' : 'Reprocesar evento'}
                              </button>
                            )}
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
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'rose' }) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-700' : tone === 'rose' ? 'text-rose-700' : 'text-[var(--app-ink)]';
  return (
    <div className="app-list-card p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
