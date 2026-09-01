'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Search, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useUser } from '@/context/UserContext';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { PLAN_FEATURES } from '@/features/planes/features-catalog';
import {
  addCohortMembers,
  deleteCohort,
  getCohortDetail,
  listAssignableUsers,
  removeCohortMembers,
  setCohortModuleAccess,
  updateCohort,
  type AssignableUser,
  type CohortDetail,
  type CohortStatus,
} from '@/features/cohortes/client';

/** El acceso de la cohorte se expresa con las mismas llaves que los planes. */
const ACCESS_KEYS = PLAN_FEATURES.map((feature) => ({
  key: feature.key as string,
  label: feature.moduleLabel === feature.label ? feature.label : `${feature.moduleLabel} · ${feature.label}`,
  description: feature.description,
}));

type AccessValue = 'plan' | 'on' | 'off';

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="app-panel p-4">
      <p className="text-xl font-extrabold leading-none text-[var(--app-ink)]">{value}</p>
      <p className="mt-1 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
        {label}
      </p>
      {hint && <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">{hint}</p>}
    </div>
  );
}

export default function CohorteDetallePage() {
  const params = useParams<{ cohortId: string }>();
  const cohortId = params?.cohortId ?? '';
  const router = useRouter();
  const { can } = useUser();
  const { alert, confirm } = useAppDialog();

  const canUpdate = can('cohortes', 'update');
  const canDelete = can('cohortes', 'delete');

  const [detail, setDetail] = React.useState<CohortDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [working, setWorking] = React.useState(false);
  const [candidates, setCandidates] = React.useState<AssignableUser[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [addSearch, setAddSearch] = React.useState('');
  const [addSelected, setAddSelected] = React.useState<Set<string>>(new Set());

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
    if (!cohortId) return;
    setLoading(true);
    try {
      setDetail(await getCohortDetail(cohortId));
    } catch (error) {
      await showError('No se pudo cargar la cohorte.', error);
    } finally {
      setLoading(false);
    }
  }, [cohortId, showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openAdd = async () => {
    setShowAdd(true);
    try {
      setCandidates(await listAssignableUsers(cohortId));
    } catch (error) {
      await showError('No se pudieron cargar las personas disponibles.', error);
    }
  };

  const handleAdd = async () => {
    if (addSelected.size === 0) return;
    setWorking(true);
    try {
      await addCohortMembers(cohortId, Array.from(addSelected));
      setAddSelected(new Set());
      setShowAdd(false);
      await load();
    } catch (error) {
      await showError('No se pudieron agregar los miembros.', error);
    } finally {
      setWorking(false);
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    const ok = await confirm({
      title: 'Sacar de la cohorte',
      message: `${name} dejará de pertenecer a esta cohorte. Su avance y su cuenta no se tocan, y queda registro de que estuvo.`,
      confirmText: 'Sacar de la cohorte',
      tone: 'warning',
    });
    if (!ok) return;
    setWorking(true);
    try {
      await removeCohortMembers(cohortId, [userId]);
      await load();
    } catch (error) {
      await showError('No se pudo quitar el miembro.', error);
    } finally {
      setWorking(false);
    }
  };

  const handleAccess = async (moduleCode: string, value: AccessValue) => {
    setWorking(true);
    try {
      const isEnabled = value === 'plan' ? null : value === 'on';
      const access = await setCohortModuleAccess(cohortId, moduleCode, isEnabled);
      setDetail((prev) => (prev ? { ...prev, moduleAccess: access } : prev));
    } catch (error) {
      await showError('No se pudo actualizar el acceso.', error);
    } finally {
      setWorking(false);
    }
  };

  const handleStatus = async (status: CohortStatus) => {
    setWorking(true);
    try {
      await updateCohort(cohortId, { status });
      await load();
    } catch (error) {
      await showError('No se pudo actualizar el estado.', error);
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    const ok = await confirm({
      title: 'Eliminar cohorte',
      message: `Se eliminará "${detail.cohort.name}" con sus membresías y sus accesos. Las personas y su avance no se tocan.`,
      confirmText: 'Eliminar',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      await deleteCohort(cohortId);
      router.push('/dashboard/administracion/cohortes');
    } catch (error) {
      await showError('No se pudo eliminar la cohorte.', error);
    }
  };

  const filteredCandidates = React.useMemo(() => {
    const term = addSearch.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((user) =>
      `${user.displayName} ${user.email}`.toLowerCase().includes(term),
    );
  }, [candidates, addSearch]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-[var(--app-muted)]">
        <Loader2 size={18} className="animate-spin" /> Cargando cohorte…
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-sm font-bold text-[var(--app-ink)]">No se encontró la cohorte</p>
        <Link
          href="/dashboard/administracion/cohortes"
          className="mt-3 inline-block rounded-full border border-[var(--app-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--app-ink)]"
        >
          Volver a Cohortes
        </Link>
      </div>
    );
  }

  const { cohort, members, report, moduleAccess } = detail;

  return (
    <div className="space-y-5">
      <PageTitle title={cohort.name} subtitle={cohort.description ?? `Código: ${cohort.cohortCode}`} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Miembros" value={report.members} />
        <StatTile
          label="Diagnóstico iniciado"
          value={report.discoveryStarted}
          hint={`${report.discoveryCompleted} con resultados`}
        />
        <StatTile label="Avance workbooks" value={`${report.workbooksAvgPercent}%`} hint="Promedio" />
        <StatTile label="Sesiones agendadas" value={report.sessionsScheduled} />
        <StatTile label="Sesiones completadas" value={report.sessionsCompleted} />
      </div>

      {canUpdate && (
        <section className="app-panel flex flex-wrap items-center gap-2 p-4">
          <span className="text-xs font-bold text-[var(--app-ink)]">Estado:</span>
          {(['planned', 'active', 'completed', 'archived'] as CohortStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              disabled={working}
              onClick={() => void handleStatus(status)}
              className={
                cohort.status === status
                  ? 'rounded-full border border-[var(--app-ink)] bg-[var(--app-ink)] px-3.5 py-1.5 text-xs font-bold text-white'
                  : 'rounded-full border border-[var(--app-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--app-ink)] hover:bg-[var(--app-surface)]'
              }
            >
              {status === 'planned'
                ? 'Planeada'
                : status === 'active'
                  ? 'Activa'
                  : status === 'completed'
                    ? 'Finalizada'
                    : 'Archivada'}
            </button>
          ))}
          {canDelete && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={12} /> Eliminar cohorte
            </button>
          )}
        </section>
      )}

      {/* ── Accesos de la cohorte ─────────────────────────────────────────── */}
      <section className="app-panel p-4 sm:p-5">
        <p className="app-section-kicker">Accesos de la cohorte</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--app-muted)]">
          Lo que se ajuste aquí aplica a todos los miembros. El plan pone la base, la cohorte la
          corrige y el ajuste individual de una persona manda sobre ambos.
        </p>

        <div className="mt-3 space-y-2">
          {ACCESS_KEYS.map((item) => {
            const stored = moduleAccess[item.key];
            const value: AccessValue = stored === undefined ? 'plan' : stored ? 'on' : 'off';
            return (
              <div
                key={item.key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[0.9rem] border border-[var(--app-border)] bg-white p-3"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-[var(--app-ink)]">{item.label}</span>
                  <span className="block text-[11.5px] text-[var(--app-muted)]">{item.description}</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  {(
                    [
                      ['plan', 'Según el plan'],
                      ['on', 'Encendido'],
                      ['off', 'Apagado'],
                    ] as Array<[AccessValue, string]>
                  ).map(([option, label]) => (
                    <button
                      key={option}
                      type="button"
                      disabled={!canUpdate || working}
                      onClick={() => void handleAccess(item.key, option)}
                      className={
                        value === option
                          ? `rounded-full px-3 py-1.5 text-[11px] font-bold text-white ${
                              option === 'off'
                                ? 'bg-slate-500'
                                : option === 'on'
                                  ? 'bg-emerald-600'
                                  : 'bg-[var(--app-ink)]'
                            }`
                          : 'rounded-full border border-[var(--app-border)] bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--app-muted)] hover:bg-[var(--app-surface)] disabled:opacity-50'
                      }
                    >
                      {label}
                    </button>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Miembros ──────────────────────────────────────────────────────── */}
      <section className="app-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="app-section-kicker">Miembros ({members.length})</p>
          {canUpdate && !showAdd && (
            <button
              type="button"
              onClick={() => void openAdd()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3.5 py-2 text-xs font-bold text-white"
            >
              <UserPlus size={13} /> Agregar miembros
            </button>
          )}
        </div>

        {showAdd && (
          <div className="mt-3 rounded-[0.9rem] border border-[var(--brand-primary)]/30 bg-[var(--app-surface-muted)] p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
              <input
                value={addSearch}
                onChange={(event) => setAddSearch(event.target.value)}
                placeholder="Buscar por nombre o correo…"
                className="w-full rounded-[0.8rem] border border-[var(--app-border)] bg-white py-2 pl-9 pr-3 text-sm text-[var(--app-ink)] outline-none"
              />
            </div>

            <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
              {filteredCandidates.length === 0 ? (
                <p className="p-3 text-center text-[12px] text-[var(--app-muted)]">
                  No hay más personas para agregar.
                </p>
              ) : (
                filteredCandidates.map((user) => (
                  <label
                    key={user.userId}
                    className="flex cursor-pointer items-center gap-2.5 rounded-[0.7rem] bg-white p-2.5 hover:bg-[var(--app-surface)]"
                  >
                    <input
                      type="checkbox"
                      checked={addSelected.has(user.userId)}
                      onChange={() =>
                        setAddSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(user.userId)) next.delete(user.userId);
                          else next.add(user.userId);
                          return next;
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-[var(--app-ink)]">
                        {user.displayName}
                      </span>
                      <span className="block truncate text-[11.5px] text-[var(--app-muted)]">
                        {user.email}
                        {user.planName ? ` · ${user.planName}` : ' · Sin plan'}
                        {user.cohorts.length > 0 ? ` · ya en: ${user.cohorts.join(', ')}` : ''}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={working || addSelected.size === 0}
                className="rounded-full bg-[var(--app-ink)] px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Agregar {addSelected.size > 0 ? `(${addSelected.size})` : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setAddSelected(new Set());
                }}
                className="rounded-full border border-[var(--app-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--app-ink)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <p className="mt-4 text-center text-[13px] text-[var(--app-muted)]">
            Esta cohorte aún no tiene miembros.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="app-table min-w-[900px] text-sm">
              <thead>
                <tr className="text-left">
                  <th>Líder</th>
                  <th>Plan</th>
                  <th>Diagnóstico</th>
                  <th>Workbooks</th>
                  <th>Sesiones</th>
                  {canUpdate && <th />}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.userId}>
                    <td>
                      <Link
                        href={`/dashboard/lideres/${member.userId}`}
                        className="font-medium text-[var(--app-ink)] hover:underline"
                      >
                        {member.displayName}
                        <span className="block text-[11.5px] font-normal text-[var(--app-muted)]">
                          {member.email}
                        </span>
                      </Link>
                    </td>
                    <td className="text-[var(--app-muted)]">{member.planName ?? 'Sin plan'}</td>
                    <td className="text-[var(--app-muted)]">
                      {member.discoveryPercent === null
                        ? 'Sin iniciar'
                        : `${member.discoveryPercent}%${member.discoveryStatus === 'results' ? ' · con resultados' : ''}`}
                    </td>
                    <td className="text-[var(--app-muted)]">
                      {member.workbooksStarted} iniciados · {member.workbooksAvgPercent}% promedio
                    </td>
                    <td className="text-[var(--app-muted)]">
                      {member.sessionsCompleted}/{member.sessionsScheduled}
                    </td>
                    {canUpdate && (
                      <td>
                        <button
                          type="button"
                          onClick={() => void handleRemove(member.userId, member.displayName)}
                          disabled={working}
                          title="Sacar de la cohorte"
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--app-muted)] hover:border-red-200 hover:text-red-600"
                        >
                          <UserMinus size={12} /> Sacar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
