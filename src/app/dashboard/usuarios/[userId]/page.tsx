'use client';

import Link from 'next/link';
import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Clock3,
  KeyRound,
  Mail,
  PauseCircle,
  PlayCircle,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  getUserDetail,
  hardDeleteUser,
  listUserAuditLogs,
  resetUserPassword,
  sendUserDirectMessage,
  updateUser,
  type AppRole,
  type AuditLogRecord,
  type UserDetailRecord,
} from '@/features/usuarios/client';
import {
  deriveUserTypeSelection,
  resolveUserTypeSelection,
  USER_TYPE_OPTIONS,
  userTypeLabel,
  type UserTypeOption,
} from '@/features/usuarios/user-types';

function asUserId(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDateTime(value: string | null): string {
  if (!value) return 'N/D';
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function roleLabel(role: AppRole): string {
  switch (role) {
    case 'admin':
      return 'ADMIN';
    case 'gestor':
      return 'GESTOR';
    case 'mentor':
      return 'iShine';
    case 'invitado':
      return 'INVITADO';
    case 'lider':
    default:
      return 'LÍDER';
  }
}

function summarizeLogPayload(payload: Record<string, unknown>): string {
  try {
    const encoded = JSON.stringify(payload);
    return encoded.length > 260 ? `${encoded.slice(0, 257)}...` : encoded;
  } catch {
    return '{}';
  }
}

const JOB_ROLE_OPTIONS = [
  'Director/C-Level',
  'Gerente/Mando medio',
  'Coordinador',
  'Lider de proyecto con equipo a cargo',
  'Especialista sin personal a cargo',
] as const;

type JobRoleOption = (typeof JOB_ROLE_OPTIONS)[number];

interface DemographicsFormState {
  country: string;
  jobRole: JobRoleOption | '';
  gender: string;
  yearsExperience: string;
}

function toDemographicsForm(detail: UserDetailRecord): DemographicsFormState {
  return {
    country: detail.country ?? '',
    jobRole: (detail.jobRole ?? '') as JobRoleOption | '',
    gender: detail.gender ?? '',
    yearsExperience: detail.yearsExperience === null ? '' : String(detail.yearsExperience),
  };
}

function parseOptionalInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
}

export default function UsuarioDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { can, refreshBootstrap } = useUser();
  const { alert, confirm, prompt } = useAppDialog();

  const userId = asUserId(params?.userId);
  const [detail, setDetail] = React.useState<UserDetailRecord | null>(null);
  const [logs, setLogs] = React.useState<AuditLogRecord[]>([]);
  const [demographicsForm, setDemographicsForm] = React.useState<DemographicsFormState>({
    country: '',
    jobRole: '',
    gender: '',
    yearsExperience: '',
  });
  const [loading, setLoading] = React.useState(true);
  const [processingAction, setProcessingAction] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [detailData, logData] = await Promise.all([getUserDetail(userId), listUserAuditLogs(userId, 300)]);
      setDetail(detailData);
      setDemographicsForm(toDemographicsForm(detailData));
      setLogs(logData);
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo cargar la ficha del usuario.',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [alert, userId]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const onToggleActive = async () => {
    if (!detail) return;
    const nextIsActive = !detail.isActive;
    const ok = await confirm({
      title: nextIsActive ? 'Activar usuario' : 'Suspender usuario',
      message: nextIsActive
        ? `¿Deseas activar a ${detail.displayName}?`
        : `¿Deseas suspender a ${detail.displayName}?`,
      confirmText: nextIsActive ? 'Activar' : 'Suspender',
      tone: nextIsActive ? 'info' : 'warning',
    });
    if (!ok) return;

    setProcessingAction('toggle-active');
    try {
      await updateUser(detail.userId, { isActive: nextIsActive });
      await refreshBootstrap();
      await loadData();
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo actualizar el estado del usuario.',
        tone: 'error',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const onResetPassword = async () => {
    if (!detail) return;
    const ok = await confirm({
      title: 'Resetear contraseña',
      message: `Se enviará una contraseña temporal a ${detail.email}. ¿Deseas continuar?`,
      confirmText: 'Resetear y enviar',
      tone: 'warning',
    });
    if (!ok) return;

    setProcessingAction('reset-password');
    try {
      const result = await resetUserPassword(detail.userId);
      await loadData();
      await alert({
        title: 'Contraseña reseteada',
        message: `Contraseña temporal enviada a ${result.recipient}.`,
        tone: 'success',
      });
    } catch (error) {
      await alert({
        title: 'Error en reset',
        message: error instanceof Error ? error.message : 'No se pudo resetear la contraseña.',
        tone: 'error',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const onSendMessage = async () => {
    if (!detail) return;

    const message = await prompt({
      title: 'Enviar mensaje',
      message: `Mensaje directo a ${detail.displayName}:`,
      label: 'Mensaje',
      placeholder: 'Escribe el mensaje...',
      multiline: true,
      confirmText: 'Enviar',
      cancelText: 'Cancelar',
      tone: 'info',
    });

    if (!message || !message.trim()) return;

    setProcessingAction('send-message');
    try {
      await sendUserDirectMessage(detail.userId, message);
      await alert({
        title: 'Mensaje enviado',
        message: 'Se creó/actualizó el hilo de conversación y se envió el mensaje.',
        tone: 'success',
      });
      await loadData();
    } catch (error) {
      await alert({
        title: 'Error al enviar mensaje',
        message: error instanceof Error ? error.message : 'No se pudo enviar el mensaje.',
        tone: 'error',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const onChangeUserType = async (userType: UserTypeOption) => {
    if (!detail || userType === deriveUserTypeSelection(detail)) return;

    const selection = resolveUserTypeSelection(userType);

    const ok = await confirm({
      title: 'Cambiar tipo de usuario',
      message: `¿Asignar ${userTypeLabel(userType)} a ${detail.displayName}?`,
      confirmText: 'Guardar tipo',
      tone: 'warning',
    });
    if (!ok) return;

    setProcessingAction('change-user-type');
    try {
      await updateUser(detail.userId, {
        primaryRole: selection.primaryRole,
        planType: selection.planType,
      });
      await refreshBootstrap();
      await loadData();
    } catch (error) {
      await alert({
        title: 'Error al actualizar tipo de usuario',
        message: error instanceof Error ? error.message : 'No se pudo actualizar el tipo de usuario.',
        tone: 'error',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const onDeleteUser = async () => {
    if (!detail) return;

    const ok = await confirm({
      title: 'Eliminar usuario permanentemente',
      message: `Esta acción eliminará a ${detail.displayName} y sus datos dependientes. ¿Deseas continuar?`,
      confirmText: 'Eliminar usuario',
      cancelText: 'Cancelar',
      tone: 'error',
    });

    if (!ok) return;

    setProcessingAction('delete-user');
    try {
      await hardDeleteUser(detail.userId);
      await refreshBootstrap();
      await alert({
        title: 'Usuario eliminado',
        message: 'La cuenta fue eliminada permanentemente.',
        tone: 'success',
      });
      router.push('/dashboard/usuarios');
    } catch (error) {
      await alert({
        title: 'Error al eliminar',
        message: error instanceof Error ? error.message : 'No se pudo eliminar el usuario.',
        tone: 'error',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const onSaveDemographics = async () => {
    if (!detail) return;

    const nextYearsExperience = parseOptionalInteger(demographicsForm.yearsExperience);
    if (!demographicsForm.country.trim() || !demographicsForm.jobRole || !demographicsForm.gender.trim() || nextYearsExperience === null) {
      await alert({
        title: 'Datos obligatorios',
        message: 'País, cargo, género y años de experiencia son obligatorios.',
        tone: 'warning',
      });
      return;
    }


    if (nextYearsExperience !== null && (nextYearsExperience < 0 || nextYearsExperience > 80)) {
      await alert({
        title: 'Experiencia fuera de rango',
        message: 'Los años de experiencia deben estar entre 0 y 80.',
        tone: 'warning',
      });
      return;
    }

    setProcessingAction('save-demographics');
    try {
      await updateUser(detail.userId, {
        country: demographicsForm.country.trim(),
        jobRole: demographicsForm.jobRole,
        gender: demographicsForm.gender,
        yearsExperience: nextYearsExperience,
      });
      await loadData();
      await alert({
        title: 'Datos actualizados',
        message: 'País, cargo, género y experiencia se guardaron correctamente.',
        tone: 'success',
      });
    } catch (error) {
      await alert({
        title: 'Error al guardar datos',
        message: error instanceof Error ? error.message : 'No se pudo actualizar los datos demográficos.',
        tone: 'error',
      });
    } finally {
      setProcessingAction(null);
    }
  };

  if (!userId) {
    return <EmptyState message="Usuario inválido." />;
  }

  if (!can('usuarios', 'view')) {
    return <EmptyState message="No tienes permisos para ver este usuario." />;
  }

  if (loading || !detail) {
    return <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando usuario...</div>;
  }

  const canUpdate = can('usuarios', 'update');
  const canDelete = can('usuarios', 'delete');
  const currentUserType = deriveUserTypeSelection(detail);
  const currentDemographics = toDemographicsForm(detail);
  const hasDemographicsChanges =
    demographicsForm.country.trim() !== currentDemographics.country.trim() ||
    demographicsForm.jobRole !== currentDemographics.jobRole ||
    demographicsForm.gender.trim() !== currentDemographics.gender.trim() ||
    demographicsForm.yearsExperience.trim() !== currentDemographics.yearsExperience.trim();

  return (
    <div className="space-y-5">
      <Link href="/dashboard/usuarios" className="inline-flex items-center gap-2 text-sm text-[var(--app-muted)] transition hover:text-[var(--app-ink)]">
        <ArrowLeft size={16} />
        Volver a la Lista
      </Link>

      <section className="app-panel-strong p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--app-chip)] text-3xl font-bold text-[var(--app-ink)]">
              {(detail.avatarInitial || detail.displayName.charAt(0) || 'U').toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[var(--app-ink)]">{detail.displayName}</h1>
              <p className="text-[var(--app-muted)]">{detail.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="app-badge app-badge-muted">
                  {userTypeLabel(currentUserType)}
                </span>
                <span
                  className={`app-badge ${
                    detail.isActive ? 'app-badge-success' : 'app-badge-muted'
                  }`}
                >
                  {detail.isActive ? 'ACTIVO' : 'INACTIVO'}
                </span>
                <span
                  className={`app-badge ${
                    detail.policyStatus === 'accepted' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'app-badge-warning'
                  }`}
                >
                  {detail.policyStatus === 'accepted' ? 'Políticas aceptadas' : 'Políticas pendientes'}
                </span>
              </div>
            </div>
          </div>

          <div className="app-panel-soft px-5 py-4 text-sm text-[var(--app-ink)]">
            <p className="text-xs font-semibold tracking-wide text-[var(--app-muted)]">ESTADÍSTICAS</p>
            <p className="mt-2">Proyectos: <strong>{detail.stats.projectsCount}</strong></p>
            <p>Mensajes enviados: <strong>{detail.stats.messagesSentCount}</strong></p>
            <p>Eventos navegación: <strong>{detail.stats.navigationEventsCount}</strong></p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className="space-y-5 xl:col-span-1">
          <article className="app-panel p-5">
            <h2 className="mb-4 text-xl font-bold text-[var(--app-ink)]">Gestión de Cuenta</h2>
            <div className="space-y-3">
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => void onToggleActive()}
                  disabled={processingAction !== null}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-base font-semibold transition ${
                    detail.isActive
                      ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  } disabled:opacity-60`}
                >
                  {detail.isActive ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                  {detail.isActive ? 'Suspender Usuario' : 'Activar Usuario'}
                </button>
              )}

              {canUpdate && (
                <button
                  type="button"
                  onClick={() => void onResetPassword()}
                  disabled={processingAction !== null}
                  className="app-button-secondary flex w-full text-base disabled:opacity-60"
                >
                  <KeyRound size={18} />
                  Resetear Contraseña
                </button>
              )}

              {canUpdate && (
                <button
                  type="button"
                  onClick={() => void onSendMessage()}
                  disabled={processingAction !== null}
                  className="app-button-secondary flex w-full text-base disabled:opacity-60"
                >
                  <Mail size={18} />
                  Enviar Mensaje
                </button>
              )}
            </div>

            <div className="mt-4 space-y-1 text-xs text-[var(--app-muted)]">
              <p>Último cambio de contraseña: {formatDateTime(detail.passwordUpdatedAt)}</p>
              <p>Última sesión: {formatDateTime(detail.lastSessionAt)}</p>
              <p>Creado: {formatDateTime(detail.createdAt)}</p>
              <p>País: {detail.country || 'No registrado'}</p>
              <p>Cargo: {detail.jobRole || 'No registrado'}</p>
              <p>Género: {detail.gender ?? 'No registrado'}</p>
              <p>Años de experiencia: {detail.yearsExperience ?? 'No registrados'}</p>
            </div>
          </article>

          <article className="app-panel p-5">
            <h2 className="mb-4 text-xl font-bold text-[var(--app-ink)]">Datos Demográficos</h2>
            <div className="grid grid-cols-1 gap-3">
              <label>
                <span className="app-field-label">País</span>
                <input
                  className="app-input"
                  value={demographicsForm.country}
                  onChange={(event) =>
                    setDemographicsForm((prev) => ({ ...prev, country: event.target.value }))
                  }
                  disabled={!canUpdate || processingAction !== null}
                  required
                />
              </label>

              <label>
                <span className="app-field-label">Cargo</span>
                <select
                  className="app-select"
                  value={demographicsForm.jobRole}
                  onChange={(event) =>
                    setDemographicsForm((prev) => ({ ...prev, jobRole: event.target.value as JobRoleOption | '' }))
                  }
                  disabled={!canUpdate || processingAction !== null}
                  required
                >
                  <option value="">Sin definir</option>
                  {JOB_ROLE_OPTIONS.map((jobRole) => (
                    <option key={jobRole} value={jobRole}>
                      {jobRole}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="app-field-label">Género</span>
                <select
                  className="app-select"
                  value={demographicsForm.gender}
                  onChange={(event) =>
                    setDemographicsForm((prev) => ({ ...prev, gender: event.target.value }))
                  }
                  disabled={!canUpdate || processingAction !== null}
                  required
                >
                  <option value="">Género</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                </select>
              </label>

              <label>
                <span className="app-field-label">Años de experiencia</span>
                <input
                  type="number"
                  min={0}
                  max={80}
                  className="app-input"
                  value={demographicsForm.yearsExperience}
                  onChange={(event) =>
                    setDemographicsForm((prev) => ({ ...prev, yearsExperience: event.target.value }))
                  }
                  disabled={!canUpdate || processingAction !== null}
                  required
                />
              </label>
            </div>

            {canUpdate && (
              <button
                type="button"
                onClick={() => void onSaveDemographics()}
                disabled={processingAction !== null || !hasDemographicsChanges}
                className="app-button-primary mt-4 w-full disabled:opacity-60"
              >
                <Save size={16} />
                Guardar datos
              </button>
            )}
          </article>

          <article className="app-panel p-5">
            <h2 className="mb-4 text-xl font-bold text-[var(--app-ink)]">Tipo de Usuario y Permisos</h2>
            <div className="app-panel-soft mb-3 p-3 text-sm text-[var(--app-muted)]">
              Cambia el tipo del usuario sin perder visibilidad de los permisos activos por rol.
            </div>

            <div className="mb-4 grid grid-cols-1 gap-2">
              {USER_TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={!canUpdate || processingAction !== null}
                  onClick={() => void onChangeUserType(option)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition disabled:opacity-60 ${
                    currentUserType === option
                      ? 'border-[var(--app-ink)] bg-[var(--app-ink)] text-white'
                      : 'border-[var(--app-border)] bg-white text-[var(--app-ink)] hover:bg-[var(--app-surface-muted)]'
                  }`}
                >
                  {userTypeLabel(option)}
                </button>
              ))}
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-muted)]/74">
              Permisos activos del rol base: {roleLabel(detail.primaryRole)}
            </p>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-[1rem] border border-[rgba(91,52,117,0.08)] p-3">
              {detail.rolePermissions.map((permission) => (
                <div key={permission.moduleCode} className="rounded-[0.9rem] border border-[rgba(91,52,117,0.08)] p-2">
                  <p className="text-sm font-semibold text-[var(--app-ink)]">{permission.moduleName}</p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    {[
                      permission.canView && 'view',
                      permission.canCreate && 'create',
                      permission.canUpdate && 'update',
                      permission.canDelete && 'delete',
                      permission.canApprove && 'approve',
                      permission.canModerate && 'moderate',
                      permission.canManage && 'manage',
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sin permisos'}
                  </p>
                </div>
              ))}
            </div>
          </article>

          {canDelete && (
            <article className="rounded-[1.2rem] border border-red-200 bg-red-50 p-5 shadow-[var(--app-shadow-soft)]">
              <h2 className="flex items-center gap-2 text-xl font-bold text-red-700">
                <AlertTriangle size={20} />
                Zona de Peligro
              </h2>
              <p className="mt-2 text-sm text-red-700">
                Eliminar al usuario borrará permanentemente sus datos y relaciones dependientes.
              </p>
              <button
                type="button"
                onClick={() => void onDeleteUser()}
                disabled={processingAction !== null}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-red-300 bg-white px-4 py-3 text-base font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                <Trash2 size={18} />
                Eliminar Usuario
              </button>
            </article>
          )}
        </section>

        <section className="xl:col-span-2">
          <article className="app-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-[var(--app-ink)]">
                <Clock3 size={22} />
                Historial de Actividad
              </h2>
              <span className="app-badge app-badge-success">
                <Shield size={14} />
                Logs en vivo
              </span>
            </div>

            {logs.length === 0 ? (
              <EmptyState message="No hay eventos registrados para este usuario." />
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.auditId} className="rounded-[1rem] border border-[rgba(91,52,117,0.08)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-lg font-bold text-[var(--app-ink)]">{log.action}</p>
                        <p className="text-sm text-[var(--app-muted)]">
                          {log.moduleCode ?? 'sistema'} · {log.entityTable}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--app-muted)]">{formatDateTime(log.occurredAt)}</p>
                    </div>
                    <pre className="mt-3 whitespace-pre-wrap rounded-[1rem] bg-[var(--app-surface-muted)] p-3 text-xs text-[var(--app-muted)]">
                      {summarizeLogPayload(log.changeSummary)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </div>
  );
}
