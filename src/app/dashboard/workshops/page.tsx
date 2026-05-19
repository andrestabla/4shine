'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  CalendarRange,
  Clock,
  Lock,
  Pencil,
  Plus,
  User,
  Users,
} from 'lucide-react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import {
  deleteWorkshop,
  listWorkshops,
  updateWorkshop,
  type WorkshopRecord,
  type WorkshopStatus,
  type WorkshopType,
} from '@/features/workshops/client';

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; bg: string; text: string }> = {
  relacionamiento: { label: 'Relacionamiento', bg: '#e8f4ff', text: '#3f6fa8' },
  formacion:       { label: 'Formación',       bg: '#f3e8ff', text: '#5b2d8a' },
  innovacion:      { label: 'Innovación',      bg: '#fff3e8', text: '#a85d2d' },
  wellbeing:       { label: 'Wellbeing',       bg: '#e8fff3', text: '#2d8a5b' },
  otro:            { label: 'Otro',            bg: '#f5f5f5', text: '#6b7280' },
};

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  upcoming:  { label: 'Próximo',    bg: '#f3e8ff', text: '#5b2d8a' },
  completed: { label: 'Completado', bg: '#e8fff3', text: '#2d8a5b' },
  cancelled: { label: 'Cancelado',  bg: '#fff1f1', text: '#dc2626' },
};

function formatDate(v: string) {
  return new Date(v).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(v: string) {
  return new Date(v).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

// ── Workshop card ──────────────────────────────────────────────────────────────

function WorkshopCard({
  workshop,
  canManage,
  onClick,
  onEdit,
  onStatusChange,
  onDelete,
}: {
  workshop: WorkshopRecord;
  canManage: boolean;
  onClick: () => void;
  onEdit: () => void;
  onStatusChange: (s: WorkshopStatus) => void;
  onDelete: () => void;
}) {
  const type = TYPE_META[workshop.workshopType] ?? TYPE_META.otro;
  const status = STATUS_META[workshop.status] ?? STATUS_META.upcoming;
  const isRegistered = workshop.myAttendanceStatus === 'registered' || workshop.myAttendanceStatus === 'attended';
  const priceLabel = workshop.price !== null ? `${workshop.currency} ${Number(workshop.price).toLocaleString('es-CO')}` : null;

  return (
    <article
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-[var(--app-border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      onClick={onClick}
    >
      {/* Color accent top bar */}
      <div className="h-1.5 rounded-t-2xl" style={{ backgroundColor: type.text }} />

      <div className="flex flex-1 flex-col p-5">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ backgroundColor: type.bg, color: type.text }}>{type.label}</span>
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide" style={{ backgroundColor: status.bg, color: status.text }}>{status.label}</span>
          {isRegistered && (
            <span className="rounded-full bg-[#e8fff3] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#2d8a5b]">Inscrito</span>
          )}
          {priceLabel && (
            <span className="rounded-full bg-[var(--app-surface-muted)] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[var(--app-ink)]">{priceLabel}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2.5 text-base font-extrabold leading-snug text-[var(--app-ink)]">{workshop.title}</h3>

        {/* Meta */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--app-muted)]">
            <CalendarDays size={12} className="shrink-0" />
            <span>{formatDate(workshop.startsAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--app-muted)]">
            <Clock size={12} className="shrink-0" />
            <span>{formatTime(workshop.startsAt)} – {formatTime(workshop.endsAt)}</span>
          </div>
          {workshop.facilitatorName && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--app-muted)]">
              <User size={12} className="shrink-0" />
              <span>{workshop.facilitatorName}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-[var(--app-muted)]">
            <Users size={12} className="shrink-0" />
            <span>{workshop.attendees} inscritos</span>
          </div>
        </div>

        {/* Description preview */}
        {workshop.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[var(--app-muted)]">{workshop.description}</p>
        )}

        {/* Admin actions — stop propagation */}
        {canManage && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--app-border)] pt-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--app-border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--app-ink)] transition hover:bg-[var(--app-surface-muted)]"
            >
              <Pencil size={11} /> Editar
            </button>
            <select
              value={workshop.status}
              onChange={(e) => onStatusChange(e.target.value as WorkshopStatus)}
              className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2.5 py-1.5 text-xs font-semibold text-[var(--app-ink)] outline-none"
            >
              <option value="upcoming">Próximo</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <button
              onClick={onDelete}
              className="rounded-xl border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkshopsPage() {
  const router = useRouter();
  const { can, currentRole, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();

  const [workshops, setWorkshops] = React.useState<WorkshopRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<WorkshopStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = React.useState<WorkshopType | 'all'>('all');

  const isCommunityLocked = currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, { codes: ['program_4shine'] });
  const canManage = can('workshops', 'manage');

  const showError = React.useCallback(
    async (msg: string, err: unknown) => {
      await alert({ title: 'Error', message: err instanceof Error ? err.message : msg, tone: 'error' });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setWorkshops(await listWorkshops());
    } catch (err) {
      await showError('No se pudieron cargar los workshops', err);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    if (isCommunityLocked) { setLoading(false); return; }
    void load();
  }, [isCommunityLocked, load]);

  const onStatusChange = async (workshop: WorkshopRecord, status: WorkshopStatus) => {
    try {
      await updateWorkshop(workshop.workshopId, { status });
      await load();
    } catch (err) {
      await showError('No se pudo actualizar el workshop', err);
    }
  };

  const onDelete = async (workshop: WorkshopRecord) => {
    const ok = await confirm({
      title: 'Eliminar workshop',
      message: `¿Deseas eliminar "${workshop.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await deleteWorkshop(workshop.workshopId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (err) {
      await showError('No se pudo eliminar el workshop', err);
    }
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = workshops.filter((w) => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (typeFilter !== 'all' && w.workshopType !== typeFilter) return false;
    return true;
  });

  const availableTypes = Array.from(new Set(workshops.map((w) => w.workshopType)));

  // ── Locked state ──────────────────────────────────────────────────────────
  if (isCommunityLocked) {
    return (
      <div className="space-y-4">
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white px-7 py-10 text-center sm:py-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.1rem]" style={{ background: 'linear-gradient(135deg, #edf7f0 0%, #d6f0dc 100%)' }}>
            <CalendarRange size={22} style={{ color: '#2a7a4b' }} />
          </div>
          <h1 className="mt-5 text-[1.6rem] font-black leading-tight text-[var(--app-ink)] sm:text-[1.9rem]">
            Los workshops del programa<br />te esperan aquí.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--app-muted)]">
            Experiencias grupales de relacionamiento, formación y bienestar integradas a tu trayectoria.
          </p>
          <a href="https://www.4shine.co/planes-precios" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5b2d8a] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90">
            Activar programa · $3,000 USD
          </a>
        </section>
        <section className="rounded-[1.5rem] border border-[var(--app-border)] bg-white p-5 sm:p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--app-muted)]">Tipos de workshop</p>
          <h2 className="mt-1 text-base font-extrabold text-[var(--app-ink)]">Formación grupal integrada al journey.</h2>
          <div className="mt-4 space-y-2 opacity-60">
            {[
              { label: 'Relacionamiento', desc: 'Dinámicas para construir y fortalecer tu red.' },
              { label: 'Formación', desc: 'Sesiones de aprendizaje grupal en vivo.' },
              { label: 'Wellbeing e innovación', desc: 'Espacios de bienestar y pensamiento creativo.' },
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
          title="Activa Workshops con el plan 4Shine."
          description="Los workshops complementan la trayectoria del líder con experiencias grupales, relacionamiento y formación."
          products={programOffers}
          primaryAction={{ href: '/dashboard', label: 'Ver plan 4Shine' }}
          note="Cuando el programa está activo, Workshops se integra con tu agenda y con el resto de módulos del journey."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[var(--app-ink)]">Workshops</h1>
          <p className="mt-0.5 text-sm text-[var(--app-muted)]">Eventos y talleres del programa.</p>
        </div>
        {canManage && (
          <button
            onClick={() => router.push('/dashboard/workshops/new')}
            className="flex items-center gap-2 rounded-full bg-[#5b2d8a] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus size={15} /> Nuevo workshop
          </button>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 rounded-2xl border border-[var(--app-border)] bg-white p-1.5">
        {(['all', 'upcoming', 'completed', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              statusFilter === s
                ? 'bg-[#5b2d8a] text-white shadow-sm'
                : 'text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]'
            }`}
          >
            {s === 'all' ? 'Todos' : s === 'upcoming' ? 'Próximos' : s === 'completed' ? 'Completados' : 'Cancelados'}
          </button>
        ))}
      </div>

      {/* Type chips */}
      {availableTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              typeFilter === 'all'
                ? 'bg-[var(--app-ink)] text-white'
                : 'border border-[var(--app-border)] bg-white text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]'
            }`}
          >
            Todos los tipos
          </button>
          {availableTypes.map((t) => {
            const meta = TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
                style={
                  typeFilter === t
                    ? { backgroundColor: meta?.text, color: '#fff' }
                    : { backgroundColor: meta?.bg, color: meta?.text }
                }
              >
                {meta?.label ?? t}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-[var(--app-surface-muted)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-white px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3e8ff]">
            <CalendarRange size={22} style={{ color: '#5b2d8a' }} />
          </div>
          <p className="text-sm text-[var(--app-muted)]">
            {statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No hay workshops con esos filtros.'
              : 'No hay workshops registrados aún.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ws) => (
            <WorkshopCard
              key={ws.workshopId}
              workshop={ws}
              canManage={canManage}
              onClick={() => router.push(`/dashboard/workshops/${ws.workshopId}`)}
              onEdit={() => router.push(`/dashboard/workshops/${ws.workshopId}/edit`)}
              onStatusChange={(s) => void onStatusChange(ws, s)}
              onDelete={() => void onDelete(ws)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
