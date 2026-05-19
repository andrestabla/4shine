'use client';

import React from 'react';
import Link from 'next/link';
import {
  Calendar,
  ExternalLink,
  Lock,
  MapPin,
  Megaphone,
  Plus,
  Users,
} from 'lucide-react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import {
  createConvocatoria,
  listConvocatorias,
  type ConvocatoriaSummary,
  type ConvocatoriaStatus,
} from '@/features/convocatorias/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateLabel(value: string): string {
  return new Date(value).toLocaleDateString('es-CO', { dateStyle: 'medium' });
}

const STATUS_CONFIG: Record<ConvocatoriaStatus, { label: string; classes: string }> = {
  draft:     { label: 'Borrador',   classes: 'bg-gray-100 text-gray-600 border-gray-200' },
  open:      { label: 'Abierta',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed:    { label: 'Cerrada',    classes: 'bg-rose-50 text-rose-700 border-rose-200' },
  suspended: { label: 'Suspendida', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function StatusBadge({ status }: { status: ConvocatoriaStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

function ConvocatoriaCard({ item }: { item: ConvocatoriaSummary }) {
  return (
    <Link href={`/dashboard/convocatorias/${item.convocatoriaId}`} className="group block">
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-white transition hover:shadow-md hover:-translate-y-0.5">
        {item.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImageUrl}
            alt={item.title}
            className="h-44 w-full object-cover"
          />
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
            <StatusBadge status={item.status} />
          </div>

          {item.description && (
            <p className="text-sm leading-relaxed text-[var(--app-muted)] line-clamp-2">
              {item.description.replace(/<[^>]*>/g, '')}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-1 text-xs text-[var(--app-muted)]">
            {item.location && (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {item.location}
              </span>
            )}
            {item.nextDate && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {item.nextDateLabel ?? 'Fecha'}: {toDateLabel(item.nextDate)}
              </span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Users size={12} />
              {item.applicationsCount}
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

// ── Create modal state ────────────────────────────────────────────────────────

interface CreateState {
  open: boolean;
  title: string;
  description: string;
  location: string;
  externalUrl: string;
  status: ConvocatoriaStatus;
  loading: boolean;
}

const INITIAL_CREATE: CreateState = {
  open: false,
  title: '',
  description: '',
  location: '',
  externalUrl: '',
  status: 'draft',
  loading: false,
};

// ── Page ──────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | ConvocatoriaStatus;

export default function ConvocatoriasPage() {
  const { can, currentRole, refreshBootstrap, viewerAccess } = useUser();
  const { alert } = useAppDialog();

  const [items, setItems] = React.useState<ConvocatoriaSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterTab>('all');
  const [create, setCreate] = React.useState<CreateState>(INITIAL_CREATE);

  const isCommunityLocked = currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, { codes: ['program_4shine'] });

  const showError = React.useCallback(
    async (fallback: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallback,
        tone: 'error',
      });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listConvocatorias();
      setItems(data);
    } catch (err) {
      await showError('No se pudieron cargar las convocatorias', err);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    if (isCommunityLocked) { setLoading(false); return; }
    void load();
  }, [isCommunityLocked, load]);

  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!create.title.trim()) return;
    setCreate((s) => ({ ...s, loading: true }));
    try {
      await createConvocatoria({
        title: create.title.trim(),
        description: create.description.trim(),
        location: create.location.trim() || null,
        externalUrl: create.externalUrl.trim() || null,
        status: create.status,
      });
      setCreate(INITIAL_CREATE);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (err) {
      await showError('No se pudo crear la convocatoria', err);
      setCreate((s) => ({ ...s, loading: false }));
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
          description="Con tu suscripción activa tienes acceso a todas las convocatorias abiertas del ecosistema, puedes aplicar, participar en el foro y recibir notificaciones."
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
    { key: 'draft',     label: 'Borrador' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[var(--app-ink)]">Convocatorias</h1>
          <p className="text-sm text-[var(--app-muted)]">Proyectos y oportunidades del ecosistema</p>
        </div>
        {can('convocatorias', 'create') && (
          <button
            onClick={() => setCreate((s) => ({ ...s, open: true }))}
            className="app-button-primary inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Nueva
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto">
        {TABS.map((tab) => {
          const count = tab.key === 'all' ? items.length : items.filter((i) => i.status === tab.key).length;
          if (tab.key !== 'all' && count === 0 && !can('convocatorias', 'create')) return null;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
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

      {/* Grid */}
      {loading ? (
        <div className="rounded-2xl border border-[var(--app-border)] bg-white px-4 py-8 text-center text-sm text-[var(--app-muted)]">
          Cargando convocatorias...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={filter === 'all' ? 'No hay convocatorias aún.' : `No hay convocatorias con estado "${TABS.find(t => t.key === filter)?.label}".`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ConvocatoriaCard key={item.convocatoriaId} item={item} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {create.open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-black text-[var(--app-ink)]">Nueva convocatoria</h2>
            <form onSubmit={onCreate} className="space-y-3">
              <input
                className="app-input"
                placeholder="Título *"
                value={create.title}
                onChange={(e) => setCreate((s) => ({ ...s, title: e.target.value }))}
                required
                autoFocus
              />
              <textarea
                className="app-textarea"
                placeholder="Descripción"
                rows={3}
                value={create.description}
                onChange={(e) => setCreate((s) => ({ ...s, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="app-input"
                  placeholder="Ubicación"
                  value={create.location}
                  onChange={(e) => setCreate((s) => ({ ...s, location: e.target.value }))}
                />
                <input
                  className="app-input"
                  placeholder="URL externa (opcional)"
                  value={create.externalUrl}
                  onChange={(e) => setCreate((s) => ({ ...s, externalUrl: e.target.value }))}
                />
              </div>
              <select
                className="app-select"
                value={create.status}
                onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value as ConvocatoriaStatus }))}
              >
                <option value="draft">Guardar como borrador</option>
                <option value="open">Publicar abierta</option>
              </select>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="app-button-secondary"
                  onClick={() => setCreate(INITIAL_CREATE)}
                  disabled={create.loading}
                >
                  Cancelar
                </button>
                <button type="submit" className="app-button-primary" disabled={create.loading || !create.title.trim()}>
                  {create.loading ? 'Creando...' : 'Crear convocatoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
