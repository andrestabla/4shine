'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock, Loader2, RefreshCw, Search, UserPlus, Users, X } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  assignMentorCourse,
  getMentorTrainingOverview,
  unassignMentorCourse,
  type MentorTrainingOverview,
  type MentorTrainingRow,
  type TrainingStatus,
} from '@/features/formacion-mentores/client';

const STATUS_STYLE: Record<TrainingStatus, { label: string; chip: string }> = {
  completed: { label: 'Completado', chip: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  in_progress: { label: 'En progreso', chip: 'border-amber-200 bg-amber-50 text-amber-700' },
  not_started: { label: 'Sin iniciar', chip: 'border-slate-200 bg-slate-50 text-slate-600' },
};

type StatusFilter = 'all' | TrainingStatus;
type AssignFilter = 'all' | 'assigned' | 'unassigned';

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="app-panel flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-[var(--app-surface-muted)] text-[var(--brand-primary)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-extrabold leading-none text-[var(--app-ink)]">{value}</span>
        <span className="mt-1 block text-[11.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-[11px] text-[var(--app-muted)]">{hint}</span>}
      </span>
    </div>
  );
}

/** Barra de avance: el número solo no comunica el estado de un vistazo. */
function ProgressBar({ value, status }: { value: number; status: TrainingStatus }) {
  const color =
    status === 'completed' ? 'bg-emerald-500' : status === 'in_progress' ? 'bg-amber-500' : 'bg-slate-300';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-[var(--app-ink)]">{value}%</span>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function GestionFormacionMentoresPage() {
  const { can } = useUser();
  const { alert, confirm } = useAppDialog();

  const canAssign = can('gestion_formacion_mentores', 'create');
  const canUnassign = can('gestion_formacion_mentores', 'delete');

  const [data, setData] = React.useState<MentorTrainingOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [working, setWorking] = React.useState(false);
  const [courseFilter, setCourseFilter] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [assignFilter, setAssignFilter] = React.useState<AssignFilter>('all');
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [assignCourseId, setAssignCourseId] = React.useState<string>('');

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
      const result = await getMentorTrainingOverview(courseFilter || null);
      setData(result);
      setSelected(new Set());
      // Con un solo curso, preseleccionarlo evita un clic obligatorio.
      setAssignCourseId((prev) => prev || (result.courses.length === 1 ? result.courses[0].contentId : ''));
    } catch (error) {
      await showError('No se pudo cargar la formación de advisors.', error);
    } finally {
      setLoading(false);
    }
  }, [courseFilter, showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const rows = React.useMemo(() => {
    const list = data?.rows ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (assignFilter === 'assigned' && !row.assigned) return false;
      if (assignFilter === 'unassigned' && row.assigned) return false;
      if (term && !`${row.displayName} ${row.email}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data, search, statusFilter, assignFilter]);

  const toggleRow = (rowKey: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.rowKey))));
  };

  const selectedRows = React.useMemo(
    () => rows.filter((row) => selected.has(row.rowKey)),
    [rows, selected],
  );

  /** Asigna a los seleccionados; si no hay selección, al curso elegido arriba. */
  const handleAssignSelected = async () => {
    if (selectedRows.length === 0) return;
    // Cada fila ya trae su curso, así que se agrupa por curso y se envía por lote.
    const byCourse = new Map<string, string[]>();
    for (const row of selectedRows) {
      if (row.assigned) continue;
      const list = byCourse.get(row.contentId) ?? [];
      list.push(row.userId);
      byCourse.set(row.contentId, list);
    }
    if (byCourse.size === 0) {
      await alert({ title: 'Sin cambios', message: 'Los seleccionados ya tienen el curso asignado.', tone: 'info' });
      return;
    }

    setWorking(true);
    try {
      let total = 0;
      for (const [contentId, userIds] of byCourse) {
        const result = await assignMentorCourse({ contentId, userIds });
        total += result.assigned;
      }
      await load();
      await alert({
        title: 'Curso asignado',
        message: `Se asignó el curso a ${total} advisor${total === 1 ? '' : 's'}.`,
        tone: 'success',
      });
    } catch (error) {
      await showError('No se pudo asignar el curso.', error);
    } finally {
      setWorking(false);
    }
  };

  const handleUnassignSelected = async () => {
    const assignedRows = selectedRows.filter((row) => row.assigned);
    if (assignedRows.length === 0) {
      await alert({ title: 'Sin cambios', message: 'Ninguno de los seleccionados tiene asignación.', tone: 'info' });
      return;
    }
    const ok = await confirm({
      title: 'Quitar asignación',
      message: `Se quitará la asignación a ${assignedRows.length} advisor${assignedRows.length === 1 ? '' : 's'}. El avance que ya tengan se conserva y el curso sigue disponible para ellos.`,
      confirmText: 'Quitar asignación',
      tone: 'warning',
    });
    if (!ok) return;

    setWorking(true);
    try {
      const byCourse = new Map<string, string[]>();
      for (const row of assignedRows) {
        const list = byCourse.get(row.contentId) ?? [];
        list.push(row.userId);
        byCourse.set(row.contentId, list);
      }
      for (const [contentId, userIds] of byCourse) {
        await unassignMentorCourse({ contentId, userIds });
      }
      await load();
    } catch (error) {
      await showError('No se pudo quitar la asignación.', error);
    } finally {
      setWorking(false);
    }
  };

  /** Asigna el curso elegido a TODOS los advisors que aún no lo tienen. */
  const handleAssignAll = async () => {
    if (!assignCourseId) {
      await alert({ title: 'Elige un curso', message: 'Selecciona el curso que quieres asignar.', tone: 'info' });
      return;
    }
    const pending = (data?.rows ?? []).filter(
      (row) => row.contentId === assignCourseId && !row.assigned && row.role === 'mentor',
    );
    if (pending.length === 0) {
      await alert({
        title: 'Todos al día',
        message: 'Todos los advisors ya tienen ese curso asignado.',
        tone: 'info',
      });
      return;
    }
    const courseTitle = data?.courses.find((c) => c.contentId === assignCourseId)?.title ?? 'el curso';
    const ok = await confirm({
      title: 'Asignar a todos',
      message: `Se asignará "${courseTitle}" a ${pending.length} advisor${pending.length === 1 ? '' : 's'} que aún no lo tienen.`,
      confirmText: 'Asignar',
    });
    if (!ok) return;

    setWorking(true);
    try {
      const result = await assignMentorCourse({
        contentId: assignCourseId,
        userIds: pending.map((row) => row.userId),
      });
      await load();
      await alert({
        title: 'Curso asignado',
        message: `Se asignó a ${result.assigned} advisor${result.assigned === 1 ? '' : 's'}.`,
        tone: 'success',
      });
    } catch (error) {
      await showError('No se pudo asignar el curso.', error);
    } finally {
      setWorking(false);
    }
  };

  const stats = data?.stats;
  const courses = data?.courses ?? [];

  return (
    <div className="space-y-5">
      <PageTitle
        title="Gestión Formación Advisors"
        subtitle="Asigna cursos de formación y sigue el avance real de cada advisor."
      />

      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<BookOpen size={18} />} label="Cursos" value={stats.courses} hint="en Formación Advisors" />
          <StatCard icon={<Users size={18} />} label="Advisors activos" value={stats.advisors} />
          <StatCard icon={<Clock size={18} />} label="En progreso" value={stats.inProgress} />
          <StatCard icon={<CheckCircle2 size={18} />} label="Completados" value={stats.completed} />
        </div>
      )}

      {courses.length === 0 && !loading && (
        <div className="app-panel p-6 text-center">
          <p className="text-sm font-bold text-[var(--app-ink)]">Aún no hay cursos de formación</p>
          <p className="mt-1 text-[13px] text-[var(--app-muted)]">
            Crea el primer curso en Formación Advisors y luego vuelve aquí para asignarlo.
          </p>
          <Link
            href="/dashboard/formacion-mentores"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white"
          >
            Ir a Formación Advisors
          </Link>
        </div>
      )}

      {canAssign && courses.length > 0 && (
        <section className="app-panel p-4 sm:p-5">
          <p className="app-section-kicker">Asignar curso</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              className="min-w-[16rem] flex-1 rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--app-ink)]"
              value={assignCourseId}
              onChange={(event) => setAssignCourseId(event.target.value)}
            >
              <option value="">Selecciona un curso…</option>
              {courses.map((course) => (
                <option key={course.contentId} value={course.contentId}>
                  {course.title}
                  {course.status !== 'published' ? ' (borrador)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssignAll}
              disabled={working || !assignCourseId}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              <UserPlus size={14} /> Asignar a todos los advisors
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-[var(--app-muted)]">
            Asignar no envía correos: sirve para llevar el seguimiento. Los cursos publicados ya son
            visibles para todos los advisors en su módulo de formación.
          </p>
        </section>
      )}

      <section className="app-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar advisor…"
              className="w-full rounded-[0.9rem] border border-[var(--app-border)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--app-ink)] outline-none focus:border-[var(--brand-accent)]"
            />
          </div>
          {courses.length > 1 && (
            <select
              className="rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-ink)]"
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
            >
              <option value="">Todos los cursos</option>
              {courses.map((course) => (
                <option key={course.contentId} value={course.contentId}>
                  {course.title}
                </option>
              ))}
            </select>
          )}
          <select
            className="rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-ink)]"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">Todos los estados</option>
            <option value="not_started">Sin iniciar</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completado</option>
          </select>
          <select
            className="rounded-[0.9rem] border border-[var(--app-border)] bg-white px-3 py-2.5 text-sm text-[var(--app-ink)]"
            value={assignFilter}
            onChange={(event) => setAssignFilter(event.target.value as AssignFilter)}
          >
            <option value="all">Asignados y no asignados</option>
            <option value="assigned">Solo asignados</option>
            <option value="unassigned">Solo sin asignar</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || working}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white px-3.5 py-2.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface)] disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {selectedRows.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[0.9rem] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
            <span className="text-xs font-bold text-[var(--app-ink)]">
              {selectedRows.length} seleccionado{selectedRows.length === 1 ? '' : 's'}
            </span>
            {canAssign && (
              <button
                type="button"
                onClick={handleAssignSelected}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--app-ink)] px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                <UserPlus size={12} /> Asignar curso
              </button>
            )}
            {canUnassign && (
              <button
                type="button"
                onClick={handleUnassignSelected}
                disabled={working}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-white disabled:opacity-50"
              >
                <X size={12} /> Quitar asignación
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs font-semibold text-[var(--app-muted)] underline"
            >
              Limpiar selección
            </button>
          </div>
        )}
      </section>

      <section className="app-table-shell">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--app-muted)]">
            <Loader2 size={16} className="animate-spin" /> Cargando formación…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-[var(--app-ink)]">Sin resultados</p>
            <p className="mt-1 text-[13px] text-[var(--app-muted)]">
              {courses.length === 0
                ? 'Crea un curso en Formación Advisors para empezar.'
                : 'Ajusta los filtros para ver otros advisors.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="app-table min-w-[980px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selected.size === rows.length}
                      onChange={toggleAll}
                      aria-label="Seleccionar todo"
                    />
                  </th>
                  <th>Advisor</th>
                  <th>Curso</th>
                  <th>Asignación</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Último acceso</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: MentorTrainingRow) => {
                  const style = STATUS_STYLE[row.status];
                  return (
                    <tr key={row.rowKey}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(row.rowKey)}
                          onChange={() => toggleRow(row.rowKey)}
                          aria-label={`Seleccionar ${row.displayName}`}
                        />
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/usuarios/${row.userId}`}
                          className="flex items-center gap-2.5 font-medium text-[var(--app-ink)] hover:underline"
                        >
                          {row.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.avatarUrl}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-surface-muted)] text-xs font-bold text-[var(--app-muted)]">
                              {row.displayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate">{row.displayName}</span>
                            <span className="block truncate text-[11.5px] font-normal text-[var(--app-muted)]">
                              {row.email}
                              {row.role !== 'mentor' && ` · ${row.role}`}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="text-[var(--app-muted)]">{row.courseTitle}</td>
                      <td>
                        {row.assigned ? (
                          <span className="text-[var(--app-muted)]">
                            {formatDate(row.assignedAt)}
                            {row.assignedByName && (
                              <span className="block text-[11px]">por {row.assignedByName}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider ${style.chip}`}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td>
                        <ProgressBar value={row.progressPercent} status={row.status} />
                      </td>
                      <td className="text-[var(--app-muted)]">
                        {formatDate(row.lastViewedAt ?? row.completedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {data?.truncated && (
        <p className="text-center text-[11.5px] text-[var(--app-muted)]">
          Se muestran los primeros 500 registros. Filtra por curso para ver el resto.
        </p>
      )}
    </div>
  );
}
