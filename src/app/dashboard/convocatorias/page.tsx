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
import { ModuleLockedScreen } from '@/components/access/ModuleLockedScreen';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
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

const REQUEST_TIPO_LABELS: Record<string, string> = {
  laboral: 'Laboral',
  proyecto_social: 'Proyecto Social',
  proveedor: 'Proveedor',
  convenio: 'Convenio',
  otra: 'Otra',
};

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
            style={{ background: 'linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-strong) 100%)' }}
          >
            <Megaphone size={32} style={{ color: 'var(--brand-primary)' }} className="opacity-40" />
          </div>
        )}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold leading-tight text-[var(--app-ink)] group-hover:text-[var(--brand-primary)] transition-colors line-clamp-2">
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
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'var(--brand-surface-strong)', color: 'var(--brand-primary)' }}
              >
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

function ReadRow({ label, value }: { label: string; value?: string | null }) {
  if (!value || !value.trim()) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--app-muted)]">{label}</p>
      <p className="whitespace-pre-wrap text-sm text-[var(--app-ink)]">{value}</p>
    </div>
  );
}

function RequestCard({
  req,
  onReview,
}: {
  req: ConvocatoriaRequest;
  onReview: (req: ConvocatoriaRequest, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState('');

  const pending = req.status === 'pending';
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('es-CO') : '—');

  const reject = async () => {
    setBusy(true);
    await onReview(req, 'rejected', note || undefined);
    setBusy(false);
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[var(--app-ink)] truncate">{req.title}</span>
            <RequestStatusBadge status={req.status} />
            <span className="rounded-full border border-[var(--app-border)] bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--app-muted)]">
              {REQUEST_TIPO_LABELS[req.tipo] ?? 'Otra'}
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--app-muted)]">{shortId(req.requestId, 'SOL')}</span>
          <p className="text-xs text-[var(--app-muted)] mt-0.5">
            Solicitado por <span className="font-semibold">{req.requesterName}</span> · {toRelativeDate(req.createdAt)}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
        >
          {expanded ? 'Ocultar formulario' : 'Ver formulario'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 rounded-xl border border-[var(--app-border)] bg-white p-4">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadRow label="Tipo" value={REQUEST_TIPO_LABELS[req.tipo] ?? 'Otra'} />
              <ReadRow label="Número de contacto" value={req.numeroContacto} />
              <ReadRow label="Fecha de inicio" value={fmtDate(req.fechaInicio)} />
              <ReadRow label="Fecha de cierre" value={fmtDate(req.fechaFin)} />
            </div>
            <ReadRow label="Objetivo" value={req.objetivo} />
            <ReadRow label="Descripción" value={req.description} />
            <ReadRow label="Requisitos" value={req.requisitos} />
            <ReadRow label="Enlaces complementarios" value={req.enlacesComplementarios} />
          </div>
        </div>
      )}

      {req.reviewerNotes && (
        <p className="mt-2 text-xs italic text-[var(--app-muted)]">Nota del revisor: {req.reviewerNotes}</p>
      )}

      {pending && (
        <div className="mt-3 space-y-2">
          <Link
            href={`/dashboard/convocatorias/nueva?requestId=${req.requestId}`}
            className="flex items-center justify-center rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
          >
            Revisar y publicar →
          </Link>
          <input
            className="app-input text-xs"
            placeholder="Nota opcional para el líder (al rechazar)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            onClick={() => void reject()}
            disabled={busy}
            className="w-full rounded-full border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
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
                <RequestCard key={req.requestId} req={req} onReview={onReview} />
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

  const isCommunityLocked =
    currentRole === 'lider' &&
    (viewerAccess?.viewerTier === 'open_leader' || viewerAccess?.canAccessConvocatorias === false);

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
      if (status === 'approved') {
        await alert({ title: 'Convocatoria publicada', message: `"${req.title}" se publicó y ya aparece como abierta.`, tone: 'success' });
      } else {
        await alert({ title: 'Solicitud rechazada', message: `Se rechazó "${req.title}"${notes ? ' y se notificó al líder con tu nota.' : ' y se notificó al líder.'}`, tone: 'success' });
      }
    } catch (err) {
      await showError('No se pudo procesar la solicitud', err);
    }
  };

  // ── Locked state ─────────────────────────────────────────────────────────────

  if (isCommunityLocked) {
    return (
      <ModuleLockedScreen
        moduleName="Convocatorias"
        icon={Megaphone}
        description="Accede a oportunidades, proyectos y programas que publica el ecosistema 4Shine y postúlate cuando encuentres la que se ajusta a tu momento."
        features={[
          "Listado de convocatorias abiertas del ecosistema.",
          "Postulación en un solo clic con confirmación inmediata.",
          "Foro exclusivo para conversar con organizadores y otros postulantes.",
          "Seguimiento de tus aplicaciones y notificaciones de avance.",
        ]}
      />
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
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition"
              style={{ borderColor: 'var(--brand-border-strong)', color: 'var(--brand-primary)' }}
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
            className="relative shrink-0 h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none"
            style={{ background: notifInterest ? 'var(--brand-primary)' : '#d1d5db' }}
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
                  ? 'text-white'
                  : 'bg-[var(--app-surface-muted)] text-[var(--app-muted)] hover:text-[var(--app-ink)]'
              }`}
              style={filter === tab.key ? { background: 'var(--brand-primary)' } : undefined}
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
                ? ''
                : 'border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
            }`}
            style={tipoFilter === 'all' ? { borderColor: 'var(--brand-border-strong)', background: 'var(--brand-surface-strong)', color: 'var(--brand-primary)' } : undefined}
          >
            Todos los tipos
          </button>
          {availableTipos.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoFilter(tipo)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                tipoFilter === tipo
                  ? ''
                  : 'border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:text-[var(--app-ink)]'
              }`}
              style={tipoFilter === tipo ? { borderColor: 'var(--brand-border-strong)', background: 'var(--brand-surface-strong)', color: 'var(--brand-primary)' } : undefined}
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
