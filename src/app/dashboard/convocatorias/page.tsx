'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  MapPin,
  Megaphone,
  Plus,
  Send,
  Users,
  X,
} from 'lucide-react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import {
  getNotificationInterest,
  listConvocatorias,
  listRequests,
  reviewRequest,
  setNotificationInterest,
  type ConvocatoriaRequest,
  type ConvocatoriaSummary,
  type ConvocatoriaStatus,
  type ConvocatoriaTipo,
} from '@/features/convocatorias/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortId(uuid: string, prefix: string) {
  return `${prefix}-${uuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function toDateLabel(value: string): string {
  return new Date(value).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

function toRelativeDate(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `hace ${days} días`;
  return new Date(value).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

const TIPO_LABELS: Record<string, string> = {
  laboral: 'Laboral',
  proyecto_social: 'Proyecto Social',
  proveedor: 'Proveedor',
  convenio: 'Convenio',
  otra: 'Otra',
};

const STATUS_CONFIG: Record<ConvocatoriaStatus, { label: string; classes: string }> = {
  draft:     { label: 'Borrador',   classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  open:      { label: 'Abierta',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed:    { label: 'Cerrada',    classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  suspended: { label: 'Suspendida', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
};

// ── Convocatoria card ─────────────────────────────────────────────────────────

function ConvocatoriaCard({ item }: { item: ConvocatoriaSummary }) {
  return (
    <Link href={`/dashboard/convocatorias/${item.convocatoriaId}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white transition hover:shadow-md hover:-translate-y-0.5">
        {item.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverImageUrl} alt={item.title} className="h-44 w-full object-cover" />
        ) : (
          <div
            className="flex h-44 w-full items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' }}
          >
            <Megaphone size={32} style={{ color: '#7c3aed' }} className="opacity-40" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-tight text-[var(--app-ink)] group-hover:text-[#5b2d8a] transition-colors line-clamp-2">
              {item.title}
            </h3>
            <span className={`shrink-0 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CONFIG[item.status].classes}`}>
              {STATUS_CONFIG[item.status].label}
            </span>
          </div>
          {item.description && (
            <p className="text-sm leading-relaxed text-[var(--app-muted)] line-clamp-2">
              {item.description.replace(/<[^>]*>/g, '')}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-xs text-[var(--app-muted)]">
            {item.location && (
              <span className="flex items-center gap-1"><MapPin size={12} />{item.location}</span>
            )}
            {item.nextDate && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {item.nextDateLabel ?? 'Fecha'}: {toDateLabel(item.nextDate)}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Users size={12} />{item.applicationsCount}
            </span>
            {item.hasApplied && (
              <span className="rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[10px] font-bold text-[#5b2d8a]">
                Aplicaste ✓
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ── Requests panel (admin/gestor) ─────────────────────────────────────────────

function RequestStatusBadge({ status }: { status: ConvocatoriaRequest['status'] }) {
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
      <Clock size={10} />Pendiente
    </span>
  );
  if (status === 'approved') return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
      <Check size={10} />Aprobada
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600">
      <X size={10} />Rechazada
    </span>
  );
}

interface RequestsPanelProps {
  requests: ConvocatoriaRequest[];
  onReview: (req: ConvocatoriaRequest, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
}

type RequestFilter = 'pending' | 'all';

function RequestsPanel({ requests, onReview }: RequestsPanelProps) {
  const [open, setOpen] = React.useState(true);
  const [reqFilter, setReqFilter] = React.useState<RequestFilter>('pending');
  const [reviewing, setReviewing] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState('');

  const pending = requests.filter((r) => r.status === 'pending');
  const visible = reqFilter === 'pending' ? pending : requests;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <Send size={15} className="text-amber-600" />
          <span className="text-sm font-extrabold text-[var(--app-ink)]">
            Solicitudes de publicación
          </span>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-black text-white">
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-[var(--app-muted)]" /> : <ChevronDown size={16} className="text-[var(--app-muted)]" />}
      </button>

      {open && (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1.5 border-t border-amber-200 px-5 py-2.5">
            {(['pending', 'all'] as RequestFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setReqFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  reqFilter === f
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-amber-700 hover:bg-amber-100'
                }`}
              >
                {f === 'pending' ? 'Pendientes' : 'Todas'}
              </button>
            ))}
          </div>

          <div className="border-t border-amber-200 divide-y divide-amber-100">
            {visible.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-[var(--app-muted)]">
                {reqFilter === 'pending' ? 'No hay solicitudes pendientes.' : 'No hay solicitudes aún.'}
              </p>
            ) : (
              visible.map((req) => (
                <div key={req.requestId} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-[var(--app-ink)] truncate">{req.title}</span>
                        <RequestStatusBadge status={req.status} />
                      </div>
                      <span className="font-mono text-[10px] text-[var(--app-muted)]">{shortId(req.requestId, 'SOL')}</span>
                      <p className="text-xs text-[var(--app-muted)] mt-0.5">
                        Solicitado por <span className="font-semibold">{req.requesterName}</span> · {toRelativeDate(req.createdAt)}
                      </p>
                      {req.description && (
                        <p className="mt-1.5 text-sm text-[var(--app-ink)]/70 line-clamp-2">{req.description}</p>
                      )}
                      {req.reviewerNotes && (
                        <p className="mt-1 text-xs italic text-[var(--app-muted)]">Nota: {req.reviewerNotes}</p>
                      )}
                    </div>

                    {req.status === 'pending' && (
                      <div className="shrink-0">
                        {reviewing === req.requestId ? (
                          <div className="space-y-2">
                            <input
                              className="app-input text-xs"
                              placeholder="Nota opcional..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={async () => {
                                  await onReview(req, 'approved', notes || undefined);
                                  setReviewing(null);
                                  setNotes('');
                                }}
                                className="flex-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={async () => {
                                  await onReview(req, 'rejected', notes || undefined);
                                  setReviewing(null);
                                  setNotes('');
                                }}
                                className="flex-1 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                              >
                                Rechazar
                              </button>
                              <button
                                onClick={() => { setReviewing(null); setNotes(''); }}
                                className="rounded-full border border-[var(--app-border)] px-3 py-1.5 text-xs text-[var(--app-muted)] hover:bg-white"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewing(req.requestId)}
                            className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition"
                          >
                            Revisar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── My requests panel (líder) ─────────────────────────────────────────────────

function MyRequestsPanel({ requests }: { requests: ConvocatoriaRequest[] }) {
  const [open, setOpen] = React.useState(false);
  if (requests.length === 0) return null;
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-5 py-3.5"
      >
        <span className="text-sm font-bold text-[var(--app-ink)]">
          Mis solicitudes ({requests.length})
        </span>
        {open ? <ChevronUp size={15} className="text-[var(--app-muted)]" /> : <ChevronDown size={15} className="text-[var(--app-muted)]" />}
      </button>
      {open && (
        <div className="border-t border-[var(--app-border)] divide-y divide-[var(--app-border)]">
          {requests.map((req) => (
            <div key={req.requestId} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--app-ink)] truncate">{req.title}</p>
                <span className="font-mono text-[10px] text-[var(--app-muted)]">{shortId(req.requestId, 'SOL')}</span>
                <p className="text-xs text-[var(--app-muted)]">{toRelativeDate(req.createdAt)}</p>
                {req.reviewerNotes && (
                  <p className="mt-0.5 text-xs italic text-[var(--app-muted)]">{req.reviewerNotes}</p>
                )}
              </div>
              <RequestStatusBadge status={req.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | ConvocatoriaStatus;

export default function ConvocatoriasPage() {
  const { can, currentRole, viewerAccess } = useUser();
  const { alert } = useAppDialog();

  const [items, setItems] = React.useState<ConvocatoriaSummary[]>([]);
  const [requests, setRequests] = React.useState<ConvocatoriaRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterTab>('all');
  const [tipoFilter, setTipoFilter] = React.useState<ConvocatoriaTipo | 'all'>('all');
  const [notifInterest, setNotifInterest] = React.useState<boolean>(false);

  const isCommunityLocked = currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, { codes: ['program_4shine'] });

  const canManage = can('convocatorias', 'create'); // solo gestor/admin

  const showError = React.useCallback(
    async (fallback: string, cause: unknown) => {
      await alert({ title: 'Error', message: cause instanceof Error ? cause.message : fallback, tone: 'error' });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [convs, reqs] = await Promise.all([
        listConvocatorias(),
        listRequests(canManage ? 'all' : 'mine').catch(() => []),
      ]);
      setItems(convs);
      setRequests(reqs);
    } catch (err) {
      await showError('No se pudieron cargar las convocatorias', err);
    } finally {
      setLoading(false);
    }
  }, [canManage, showError]);

  React.useEffect(() => {
    if (isCommunityLocked) { setLoading(false); return; }
    void load();
    if (!canManage) {
      getNotificationInterest().then((r) => setNotifInterest(r.interested)).catch(() => {});
    }
  }, [isCommunityLocked, load, canManage]);

  const statusFiltered = filter === 'all' ? items : items.filter((i) => i.status === filter);
  const filtered = tipoFilter === 'all' ? statusFiltered : statusFiltered.filter((i) => i.tipo === tipoFilter);

  const availableTipos = Array.from(new Set(statusFiltered.map((i) => i.tipo).filter(Boolean))) as ConvocatoriaTipo[];

  // ── Toggle notification interest ────────────────────────────────────────────

  const onToggleInterest = async (v: boolean) => {
    setNotifInterest(v);
    try {
      await setNotificationInterest(v);
    } catch {
      setNotifInterest(!v); // revert on error
    }
  };

  // ── Revisar solicitud (gestor/admin) ────────────────────────────────────────

  const onReview = async (req: ConvocatoriaRequest, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await reviewRequest(req.requestId, { status, reviewerNotes: notes });
      await load();
    } catch (err) {
      await showError('No se pudo procesar la solicitud', err);
    }
  };

  // ── Locked state ─────────────────────────────────────────────────────────────

  if (isCommunityLocked) {
    return (
      <div className="space-y-4">
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white px-7 py-10 text-center sm:py-12">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem]"
            style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' }}
          >
            <Megaphone size={22} style={{ color: '#7c3aed' }} />
          </div>
          <h1 className="mt-5 text-[1.6rem] font-black leading-tight text-[var(--app-ink)] sm:text-[1.9rem]">
            Las convocatorias del<br />ecosistema te esperan.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--app-muted)]">
            Oportunidades, proyectos y programas del ecosistema 4Shine disponibles con tu suscripción activa.
          </p>
          <a
            href="https://www.4shine.co/planes-precios"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5b2d8a] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
          >
            Activar programa · $3,000 USD
          </a>
        </section>
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5 sm:p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">Qué incluye Convocatorias</p>
          <h2 className="mt-1 text-base font-extrabold text-[var(--app-ink)]">Accede a oportunidades alineadas a tu momento.</h2>
          <div className="mt-4 space-y-2 opacity-60">
            {[
              { label: 'Convocatorias abiertas', desc: 'Proyectos, programas y oportunidades publicadas en el ecosistema.' },
              { label: 'Aplicación directa', desc: 'Aplica con un clic y recibe confirmación inmediata.' },
              { label: 'Foro exclusivo', desc: 'Interactúa con otros postulantes y el equipo de cada convocatoria.' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3.5 rounded-[1rem] bg-[var(--app-surface-muted)] px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] bg-white">
                  <Lock size={12} className="text-[var(--app-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--app-ink)]">{f.label}</p>
                  <p className="text-[11px] text-[var(--app-muted)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <AccessOfferPanel
          badge="Acceso bloqueado"
          title="Desbloquea Convocatorias con el plan 4Shine."
          description="Con tu suscripción activa tienes acceso a todas las convocatorias abiertas del ecosistema."
          products={programOffers}
          primaryAction={{ href: '/dashboard', label: 'Ver plan 4Shine' }}
          note="Cuando actives el programa, Convocatorias se integra con tu Trayectoria."
        />
      </div>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────────

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',       label: 'Todas' },
    { key: 'open',      label: 'Abiertas' },
    { key: 'closed',    label: 'Cerradas' },
    { key: 'suspended', label: 'Suspendidas' },
    ...(canManage ? [{ key: 'draft' as FilterTab, label: 'Borrador' }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[var(--app-ink)]">Convocatorias</h1>
          <p className="text-sm text-[var(--app-muted)]">Proyectos y oportunidades del ecosistema</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage ? (
            <Link
              href="/dashboard/convocatorias/nueva"
              className="app-button-primary inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Nueva
            </Link>
          ) : (
            <Link
              href="/dashboard/convocatorias/solicitar"
              className="inline-flex items-center gap-2 rounded-full border border-[#7c3aed] px-4 py-2 text-sm font-bold text-[#5b2d8a] hover:bg-[#f3e8ff] transition"
            >
              <Send size={14} />
              Solicitar publicación
            </Link>
          )}
        </div>
      </div>

      {/* Requests panel — solo gestor/admin ve pendientes; líder ve las suyas */}
      {canManage && (
        <RequestsPanel requests={requests} onReview={onReview} />
      )}

      {!canManage && requests.length > 0 && (
        <MyRequestsPanel requests={requests} />
      )}

      {/* Notification interest toggle — non-managers only */}
      {!canManage && (
        <div className="flex items-center gap-4 rounded-xl border border-[var(--app-border)] bg-white px-5 py-3.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--app-ink)]">Notificaciones de nuevas convocatorias</p>
            <p className="text-xs text-[var(--app-muted)]">Recibe un correo cuando se publique una nueva convocatoria.</p>
          </div>
          <button
            onClick={() => void onToggleInterest(!notifInterest)}
            role="switch"
            aria-checked={notifInterest}
            className={`relative shrink-0 h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none ${notifInterest ? 'bg-[#5b2d8a]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${notifInterest ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {TABS.map((tab) => {
          const count = tab.key === 'all' ? items.length : items.filter((i) => i.status === tab.key).length;
          if (tab.key !== 'all' && count === 0 && !canManage) return null;
          return (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setTipoFilter('all'); }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === tab.key
                  ? 'bg-[#5b2d8a] text-white'
                  : 'bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs ${filter === tab.key ? 'opacity-75' : 'opacity-60'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tipo filter chips */}
      {availableTipos.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTipoFilter('all')}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              tipoFilter === 'all'
                ? 'border-[#7c3aed] bg-[#f3e8ff] text-[#5b2d8a]'
                : 'border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
          >
            Todos los tipos
          </button>
          {availableTipos.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoFilter(tipo)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                tipoFilter === tipo
                  ? 'border-[#7c3aed] bg-[#f3e8ff] text-[#5b2d8a]'
                  : 'border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
              }`}
            >
              {TIPO_LABELS[tipo] ?? tipo}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--app-border)] bg-white px-4 py-8 text-center text-sm text-[var(--app-muted)]">
          Cargando convocatorias...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={
          tipoFilter !== 'all'
            ? `No hay convocatorias de tipo "${TIPO_LABELS[tipoFilter]}" ${filter !== 'all' ? `con estado "${TABS.find(t => t.key === filter)?.label}"` : ''}.`.trim()
            : filter === 'all' ? 'No hay convocatorias aún.' : `No hay convocatorias con estado "${TABS.find(t => t.key === filter)?.label}".`
        } />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ConvocatoriaCard key={item.convocatoriaId} item={item} />
          ))}
        </div>
      )}

    </div>
  );
}
