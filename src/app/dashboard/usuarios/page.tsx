'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  Activity, Eye, Search, ShieldCheck, UserPlus, Users, UserX, Lock, Loader2,
  FileSpreadsheet, FileText, CreditCard, CalendarClock, Send, LogOut, KeyRound, X, Building2,
} from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { SessionsTabSection } from '@/components/dashboard/usuarios/SessionsTabSection';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useBranding } from '@/context/BrandingContext';
import { useUser } from '@/context/UserContext';
import {
  listUsers,
  listDeletedUsersRequest,
  bulkUserAction,
  listOrganizations,
  createOrganization,
  type UserRecord,
  type DeletedUserRecord,
  type BulkAction,
  type BulkActionParams,
  type OrganizationRecord,
} from '@/features/usuarios/client';
import {
  deriveUserTypeSelection,
  USER_TYPE_OPTIONS,
  userTypeLabel,
  type UserTypeOption,
} from '@/features/usuarios/user-types';
import { subscriptionStatus, formatExpiry, type SubscriptionStatus } from '@/features/usuarios/subscription-status';
import { exportUsersXlsx, exportUsersPdf } from '@/features/usuarios/export';
import { RolesMatrixSection } from '@/components/dashboard/usuarios/RolesMatrixSection';
import { BulkImportWizard } from '@/components/dashboard/usuarios/BulkImportWizard';
import { PlanPickerDialog } from '@/components/dashboard/usuarios/PlanPickerDialog';
import type { SubscriptionPlanWithFeatures } from '@/features/planes/types';
import { formatDate as formatDateCanonical, formatDateTime } from '@/lib/format-date';

interface ListFilters {
  search: string;
  userType: UserTypeOption | 'all';
  status: 'all' | 'active' | 'inactive';
  policyStatus: 'all' | 'accepted' | 'pending';
  plan: string; // 'all' | 'none' | planId
  validity: 'all' | SubscriptionStatus;
}

type Tab = 'usuarios' | 'sesiones' | 'bajas' | 'roles';

// Clave en sessionStorage para precargar destinatarios en el broadcaster.
const BULK_MESSAGE_RECIPIENTS_KEY = 'fourshine.bulkMessageRecipients';

function formatDate(value: string | null): string {
  if (!value) return 'Pendiente';
  return formatDateCanonical(value);
}

function userTypeBadgeClass(option: UserTypeOption): string {
  switch (option) {
    case 'leader_with_subscription':
      return 'app-badge';
    case 'leader_without_subscription':
      return 'app-badge app-badge-muted';
    case 'mentor':
      return 'app-badge border-purple-200 bg-purple-50 text-purple-700';
    case 'gestor':
      return 'app-badge border-blue-200 bg-blue-50 text-blue-700';
    case 'admin':
      return 'app-badge border-amber-200 bg-amber-50 text-amber-700';
    case 'invited':
      return 'app-badge border-slate-200 bg-slate-50 text-slate-700';
    default:
      return 'app-badge';
  }
}

function statusBadge(isActive: boolean) {
  if (isActive) {
    return 'app-badge app-badge-success';
  }
  return 'app-badge app-badge-muted';
}

export default function UsuariosPage() {
  const { can, currentRole } = useUser();
  const { alert, confirm, prompt } = useAppDialog();
  const { branding, tokens } = useBranding();
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>('usuarios');
  const [showBulkImport, setShowBulkImport] = React.useState(false);
  const [showBulkPlan, setShowBulkPlan] = React.useState(false);
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ListFilters>({
    search: '',
    userType: 'all',
    status: 'all',
    policyStatus: 'all',
    plan: 'all',
    validity: 'all',
  });
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [organizations, setOrganizations] = React.useState<OrganizationRecord[]>([]);

  const isAdmin = currentRole === 'admin';
  const canManage = can('usuarios', 'manage');

  // Mapeamos el filtro de tipo de usuario al rol base que entiende el endpoint;
  // los matices de subscripción los filtramos localmente con deriveUserTypeSelection.
  const baseRoleForFilter = React.useMemo<UserRecord['primaryRole'] | 'all'>(() => {
    switch (filters.userType) {
      case 'leader_with_subscription':
      case 'leader_without_subscription':
        return 'lider';
      case 'mentor':
        return 'mentor';
      case 'gestor':
        return 'gestor';
      case 'admin':
        return 'admin';
      case 'invited':
        return 'invitado';
      default:
        return 'all';
    }
  }, [filters.userType]);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUsers({
        limit: 500,
        search: filters.search,
        role: baseRoleForFilter,
        status: filters.status,
        policyStatus: filters.policyStatus,
      });
      setUsers(data);
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudieron cargar los usuarios',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [alert, baseRoleForFilter, filters.policyStatus, filters.search, filters.status]);

  // Opciones de plan derivadas de los usuarios cargados.
  const planOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      if (u.subscriptionPlanId && u.subscriptionPlanName) map.set(u.subscriptionPlanId, u.subscriptionPlanName);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  // Filtra localmente: matiz de suscripción (leader_with/without), plan y vigencia.
  const visibleUsers = React.useMemo(() => {
    return users.filter((user) => {
      if (filters.userType !== 'all' && deriveUserTypeSelection(user) !== filters.userType) return false;
      if (filters.plan === 'none' && user.subscriptionPlanId) return false;
      if (filters.plan !== 'all' && filters.plan !== 'none' && user.subscriptionPlanId !== filters.plan) return false;
      if (filters.validity !== 'all' && subscriptionStatus(user.subscriptionExpiresAt).status !== filters.validity) return false;
      return true;
    });
  }, [users, filters.userType, filters.plan, filters.validity]);

  React.useEffect(() => {
    if (tab !== 'usuarios') return;
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [loadUsers, tab]);

  // Limpia la selección cuando cambian los usuarios visibles.
  React.useEffect(() => {
    setSelected((prev) => {
      const visibleIds = new Set(visibleUsers.map((u) => u.userId));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleUsers]);

  const selectedUsers = React.useMemo(
    () => visibleUsers.filter((u) => selected.has(u.userId)),
    [visibleUsers, selected],
  );
  const allVisibleSelected = visibleUsers.length > 0 && visibleUsers.every((u) => selected.has(u.userId));

  const toggleAll = () => {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleUsers.map((u) => u.userId)));
  };
  const toggleOne = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const runBulk = React.useCallback(
    async (
      action: BulkAction,
      params: BulkActionParams,
      successMsg: (n: number) => string,
      actionLabel: string,
    ) => {
      const ids = [...selected];
      if (ids.length === 0) return;

      // Revisión previa: mostrar A QUIÉNES afecta antes de ejecutar (B14).
      const names = selectedUsers.map((u) => u.displayName || u.email).filter(Boolean);
      const preview = names.slice(0, 8).join(', ');
      const more = ids.length - Math.min(8, names.length);
      const ok = await confirm({
        title: 'Confirmar acción masiva',
        message:
          `Vas a ${actionLabel} a ${ids.length} usuario(s):\n\n${preview}${more > 0 ? ` … y ${more} más` : ''}.\n\nEsta acción no se puede deshacer. ¿Continuar?`,
        tone: 'warning',
        confirmText: 'Sí, ejecutar',
      });
      if (!ok) return;

      setBulkBusy(true);
      try {
        const result = await bulkUserAction(action, ids, params);
        await alert({ title: 'Listo', message: successMsg(result.affected), tone: 'success' });
        setSelected(new Set());
        await loadUsers();
      } catch (error) {
        await alert({
          title: 'Error',
          message: error instanceof Error ? error.message : 'No se pudo ejecutar la acción.',
          tone: 'error',
        });
      } finally {
        setBulkBusy(false);
      }
    },
    [alert, confirm, loadUsers, selected, selectedUsers],
  );

  const onBulkExtend = async () => {
    const value = await prompt({
      title: 'Ampliar suscripción',
      message: `¿Cuántos días deseas agregar a ${selected.size} usuario(s)?`,
      label: 'Días',
      placeholder: 'Ej: 30',
    });
    if (value === null) return;
    const days = Number.parseInt(value.trim(), 10);
    if (!Number.isFinite(days) || days <= 0) {
      await alert({ title: 'Días inválidos', message: 'Ingresa un número de días mayor a 0.', tone: 'warning' });
      return;
    }
    await runBulk('extend_subscription', { days }, (n) => `Suscripción ampliada ${days} día(s) para ${n} usuario(s).`, 'ampliar la suscripción');
  };

  const onBulkLogout = async () => {
    await runBulk('logout', {}, (n) => `Sesiones cerradas para ${n} usuario(s).`, 'cerrar las sesiones');
  };

  const onBulkForcePassword = async () => {
    await runBulk('force_password_change', {}, (n) => `Se exigirá cambio de contraseña a ${n} usuario(s).`, 'forzar el cambio de contraseña');
  };

  const onBulkAssignPlan = async (plan: SubscriptionPlanWithFeatures) => {
    const ids = [...selected];
    setBulkBusy(true);
    try {
      const r = await bulkUserAction('assign_plan', ids, { planId: plan.planId });
      setShowBulkPlan(false);
      await alert({
        title: 'Plan asignado',
        message: `Se asignó "${plan.name}" a ${r.affected} usuario(s).`,
        tone: 'success',
      });
      setSelected(new Set());
      await loadUsers();
    } catch (error) {
      await alert({ title: 'No se pudo asignar el plan', message: error instanceof Error ? error.message : 'Error desconocido.', tone: 'error' });
    } finally {
      setBulkBusy(false);
    }
  };

  const onBulkSetOrganization = async () => {
    let orgs = organizations;
    if (orgs.length === 0) {
      try {
        orgs = await listOrganizations();
        setOrganizations(orgs);
      } catch {
        orgs = [];
      }
    }
    const existing = orgs.map((o) => o.name).join(', ');
    const value = await prompt({
      title: 'Asignar organización',
      message: `Escribe el nombre de la organización para ${selected.size} usuario(s). Si no existe, se creará.${existing ? `\n\nExistentes: ${existing}` : ''}`,
      label: 'Organización',
      placeholder: "Ej: Algoritmo T's",
    });
    if (value === null) return;
    const name = value.trim();
    if (!name) return;
    setBulkBusy(true);
    try {
      let org = orgs.find((o) => o.name.toLowerCase() === name.toLowerCase());
      if (!org) {
        org = await createOrganization(name);
        setOrganizations((prev) => [...prev, org!].sort((a, b) => a.name.localeCompare(b.name)));
      }
      const ids = [...selected];
      const result = await bulkUserAction('set_organization', ids, { organizationId: org.organizationId });
      await alert({
        title: 'Listo',
        message: `Organización "${org.name}" asignada a ${result.affected} usuario(s).`,
        tone: 'success',
      });
      setSelected(new Set());
      await loadUsers();
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo asignar la organización.',
        tone: 'error',
      });
    } finally {
      setBulkBusy(false);
    }
  };

  // "Enviar mensaje" lleva al broadcaster con los usuarios seleccionados
  // precargados (vía sessionStorage), reutilizando el flujo de envío masivo.
  const onSendMessage = () => {
    const recipients = selectedUsers.map((u) => ({
      userId: u.userId,
      email: u.email,
      displayName: u.displayName,
      primaryRole: u.primaryRole,
      userType: deriveUserTypeSelection(u),
    }));
    try {
      sessionStorage.setItem(BULK_MESSAGE_RECIPIENTS_KEY, JSON.stringify(recipients));
    } catch {
      /* sessionStorage no disponible: el broadcaster abrirá sin preselección */
    }
    router.push('/dashboard/administracion/notificaciones/enviar');
  };

  const onExportXlsx = () => exportUsersXlsx(visibleUsers);
  const onExportPdf = () =>
    exportUsersPdf(visibleUsers, { brandName: branding.platformName, primaryColor: tokens.colors.primary });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle
          title="Gestión de Usuarios y Roles"
          subtitle="Administra cuentas, planes, permisos y políticas. La gestión de roles está reservada al administrador."
        />
        {tab === 'usuarios' && can('usuarios', 'create') && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowBulkImport(true)} className="app-button-secondary">
              <FileSpreadsheet size={16} />
              Carga masiva
            </button>
            <Link href="/dashboard/usuarios/nuevo" className="app-button-primary">
              <UserPlus size={16} />
              Nuevo Usuario
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--app-border)]">
        <button
          onClick={() => setTab('usuarios')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'usuarios'
              ? 'border-[var(--app-ink)] text-[var(--app-ink)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}
        >
          <Users size={15} />
          Usuarios
        </button>
        <button
          onClick={() => setTab('sesiones')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'sesiones'
              ? 'border-[var(--app-ink)] text-[var(--app-ink)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}
        >
          <Activity size={15} />
          Sesiones
        </button>
        <button
          onClick={() => setTab('bajas')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'bajas'
              ? 'border-[var(--app-ink)] text-[var(--app-ink)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          }`}
        >
          <UserX size={15} />
          Bajas
        </button>
        <button
          onClick={() => isAdmin && setTab('roles')}
          disabled={!isAdmin}
          title={isAdmin ? '' : 'Sólo el administrador puede gestionar roles'}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'roles'
              ? 'border-[var(--app-ink)] text-[var(--app-ink)]'
              : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-ink)]'
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isAdmin ? <ShieldCheck size={15} /> : <Lock size={15} />}
          Roles y Permisos
        </button>
      </div>

      {tab === 'sesiones' && <SessionsTabSection />}
      {tab === 'bajas' && <DeletedUsersTabSection />}
      {tab === 'roles' && isAdmin && <RolesMatrixSection />}

      {tab === 'usuarios' && (
        <>
          <section className="app-panel p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <label className="md:col-span-2">
                <span className="app-field-label">Buscar</span>
                <div className="flex items-center gap-2 rounded-[1rem] border border-[var(--app-border)] bg-white/92 px-3 py-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    className="w-full border-0 bg-transparent text-sm text-[var(--app-ink)] outline-none placeholder:text-[var(--app-muted)]"
                    placeholder="Buscar por nombre o correo..."
                    value={filters.search}
                    onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                  />
                </div>
              </label>

              <label>
                <span className="app-field-label">Tipo de usuario</span>
                <select
                  className="app-select"
                  value={filters.userType}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      userType: event.target.value as ListFilters['userType'],
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  {USER_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {userTypeLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="app-field-label">Estado</span>
                <select
                  className="app-select"
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: event.target.value as ListFilters['status'],
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </label>

              <label>
                <span className="app-field-label">Políticas</span>
                <select
                  className="app-select"
                  value={filters.policyStatus}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      policyStatus: event.target.value as ListFilters['policyStatus'],
                    }))
                  }
                >
                  <option value="all">Todas</option>
                  <option value="accepted">Aceptadas</option>
                  <option value="pending">Pendientes</option>
                </select>
              </label>

              <label>
                <span className="app-field-label">Plan</span>
                <select
                  className="app-select"
                  value={filters.plan}
                  onChange={(event) => setFilters((prev) => ({ ...prev, plan: event.target.value }))}
                >
                  <option value="all">Todos</option>
                  <option value="none">Sin plan</option>
                  {planOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="app-field-label">Vigencia de suscripción</span>
                <select
                  className="app-select"
                  value={filters.validity}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, validity: event.target.value as ListFilters['validity'] }))
                  }
                >
                  <option value="all">Todas</option>
                  <option value="vigente">Vigente</option>
                  <option value="por_vencer">Por vencer (≤30 días)</option>
                  <option value="vencida">Vencida</option>
                  <option value="sin_vigencia">Sin vigencia / sin plan</option>
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--app-border)] pt-3">
              <span className="text-xs text-[var(--app-muted)]">
                {visibleUsers.length} usuario(s) con los filtros aplicados
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onExportXlsx}
                  disabled={visibleUsers.length === 0}
                  className="app-button-secondary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  <FileSpreadsheet size={14} />
                  Exportar Excel
                </button>
                <button
                  type="button"
                  onClick={onExportPdf}
                  disabled={visibleUsers.length === 0}
                  className="app-button-secondary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  <FileText size={14} />
                  Exportar PDF
                </button>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando usuarios...</div>
          ) : visibleUsers.length === 0 ? (
            <EmptyState message="No hay usuarios para los filtros aplicados." />
          ) : (
            <section className="app-table-shell">
              <div className="overflow-x-auto">
                <table className="app-table min-w-[1150px] text-sm">
                  <thead>
                    <tr className="text-left">
                      {canManage && (
                        <th className="w-10">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleAll}
                            aria-label="Seleccionar todos"
                          />
                        </th>
                      )}
                      <th>Usuario</th>
                      <th>Tipo de usuario</th>
                      <th>Organización</th>
                      <th>Plan</th>
                      <th>Vigencia</th>
                      <th>Estado</th>
                      <th>Políticas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((user) => {
                      const userType = deriveUserTypeSelection(user);
                      return (
                      <tr key={user.userId} className={selected.has(user.userId) ? 'bg-[var(--app-chip)]/40' : undefined}>
                        {canManage && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selected.has(user.userId)}
                              onChange={() => toggleOne(user.userId)}
                              aria-label={`Seleccionar ${user.displayName}`}
                            />
                          </td>
                        )}
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-chip)] text-sm font-bold text-[var(--app-ink)]">
                              {(user.avatarInitial || user.displayName.charAt(0) || 'U').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--app-ink)]">{user.displayName}</p>
                              <p className="text-[var(--app-muted)]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={userTypeBadgeClass(userType)}>
                            {userTypeLabel(userType)}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm text-[var(--app-ink)]">
                            {user.organizationName ?? '—'}
                          </span>
                        </td>
                        <td>
                          {user.subscriptionPlanName ? (
                            <span
                              className="app-badge"
                              style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
                              title={user.subscriptionPlanCode ?? ''}
                            >
                              {user.subscriptionPlanName}
                            </span>
                          ) : userType === 'leader_without_subscription' ? (
                            <span className="text-xs text-[var(--app-muted)]">Sin suscripción</span>
                          ) : userType === 'invited' ? (
                            <span className="text-xs text-[var(--app-muted)]">Acceso solo a Descubrimiento</span>
                          ) : (
                            <span className="text-xs text-[var(--app-muted)]">—</span>
                          )}
                        </td>
                        <td>
                          {(() => {
                            const st = subscriptionStatus(user.subscriptionExpiresAt);
                            return (
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${st.chipClass}`}
                                >
                                  {st.label}
                                </span>
                                <span className="text-xs text-[var(--app-muted)]">
                                  {formatExpiry(user.subscriptionExpiresAt)}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          <span className={statusBadge(user.isActive)}>
                            {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td>
                          {user.policyStatus === 'accepted' ? (
                            <div className="app-badge app-badge-success gap-2">
                              <ShieldCheck size={15} />
                              <span className="text-xs font-semibold">Aceptadas</span>
                            </div>
                          ) : (
                            <span className="app-badge app-badge-warning">Pendiente</span>
                          )}
                          <p className="mt-1 text-xs text-[var(--app-muted)]/80">{formatDate(user.policyAcceptedAt)}</p>
                        </td>
                        <td>
                          <Link
                            href={`/dashboard/usuarios/${user.userId}`}
                            className="app-button-secondary min-h-0 px-3 py-2 text-xs"
                          >
                            <Eye size={14} />
                            Ver
                          </Link>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* Barra de acciones masivas */}
      {tab === 'usuarios' && canManage && selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-2 rounded-[1.2rem] border border-[var(--app-border)] bg-white px-4 py-3 shadow-2xl">
            <span className="text-sm font-bold text-[var(--app-ink)]">{selected.size} seleccionado(s)</span>
            <span className="mx-1 h-5 w-px bg-[var(--app-border)]" />
            <button
              type="button"
              onClick={() => void onBulkExtend()}
              disabled={bulkBusy}
              className="app-button-secondary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
            >
              <CalendarClock size={14} />
              Ampliar suscripción
            </button>
            <button
              type="button"
              onClick={onSendMessage}
              disabled={bulkBusy}
              className="app-button-secondary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
            >
              <Send size={14} />
              Enviar mensaje
            </button>
            <button
              type="button"
              onClick={() => void onBulkLogout()}
              disabled={bulkBusy}
              className="app-button-secondary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
            >
              <LogOut size={14} />
              Desloguear
            </button>
            <button
              type="button"
              onClick={() => void onBulkForcePassword()}
              disabled={bulkBusy}
              className="app-button-secondary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
            >
              <KeyRound size={14} />
              Forzar cambio de clave
            </button>
            <button
              type="button"
              onClick={() => setShowBulkPlan(true)}
              disabled={bulkBusy}
              className="app-button-secondary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
            >
              <CreditCard size={14} />
              Asignar plan
            </button>
            <button
              type="button"
              onClick={() => void onBulkSetOrganization()}
              disabled={bulkBusy}
              className="app-button-secondary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
            >
              <Building2 size={14} />
              Asignar organización
            </button>
            {bulkBusy && <Loader2 size={16} className="animate-spin text-[var(--app-muted)]" />}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-1 rounded-full p-1.5 text-[var(--app-muted)] hover:bg-[var(--app-surface-muted)]"
              aria-label="Limpiar selección"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {showBulkImport && (
        <BulkImportWizard
          onClose={() => setShowBulkImport(false)}
          onDone={() => { void loadUsers(); }}
        />
      )}

      {showBulkPlan && (
        <PlanPickerDialog
          title="Asignar plan a los seleccionados"
          description={`El plan y su vigencia se aplicarán a ${selected.size} usuario(s). Los invitados pasan a líder.`}
          busy={bulkBusy}
          onConfirm={(plan) => void onBulkAssignPlan(plan)}
          onClose={() => setShowBulkPlan(false)}
        />
      )}
    </div>
  );
}

function DeletedUsersTabSection() {
  const [items, setItems] = React.useState<DeletedUserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState<'all' | 'self' | 'admin'>('all');

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listDeletedUsersRequest();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el reporte.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (sourceFilter !== 'all' && item.deletedSource !== sourceFilter) return false;
      if (!q) return true;
      const hay = [
        item.email,
        item.displayName,
        item.primaryRole,
        item.organizationName ?? '',
        item.deletedByEmail ?? '',
        item.deletedByName ?? '',
        item.reason ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, sourceFilter]);

  function fmtDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return formatDateTime(iso);
  }

  return (
    <div className="space-y-4">
      <section className="app-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="app-field-label">Buscar</label>
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Email, nombre, organización, quién la eliminó, motivo…"
                className="app-input w-full pl-9"
              />
            </div>
          </div>
          <div className="sm:w-56">
            <label className="app-field-label">Origen</label>
            <select
              className="app-select mt-1 w-full"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as 'all' | 'self' | 'admin')}
            >
              <option value="all">Todas las bajas</option>
              <option value="self">Auto-baja (el propio usuario)</option>
              <option value="admin">Por admin/gestor</option>
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--app-muted)]">
          {filtered.length} de {items.length} bajas. Se conserva snapshot del email,
          nombre, rol y quién/cómo se eliminó.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-[var(--app-muted)]">
          <Loader2 size={20} className="mr-2 animate-spin" /> Cargando bajas…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No hay bajas registradas que coincidan con el filtro." />
      ) : (
        <div className="app-table-shell overflow-x-auto">
          <table className="app-table text-sm">
            <thead>
              <tr className="text-left">
                <th>Usuario eliminado</th>
                <th>Organización</th>
                <th>Origen</th>
                <th>Motivo</th>
                <th>Eliminado por</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.logId}>
                  <td className="font-medium text-[var(--app-ink)]">
                    {item.displayName}
                    <div className="text-xs text-[var(--app-muted)]">{item.email}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--app-muted)]">
                      {item.primaryRole}
                    </div>
                  </td>
                  <td className="text-sm text-[var(--app-muted)]">
                    {item.organizationName ?? '—'}
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        item.deletedSource === 'self'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {item.deletedSource === 'self' ? 'Auto-baja' : 'Por admin'}
                    </span>
                  </td>
                  <td className="max-w-md text-xs text-[var(--app-ink)]">
                    {item.reason ? (
                      <span className="block whitespace-pre-wrap break-words">
                        {item.reason}
                      </span>
                    ) : (
                      <span className="text-[var(--app-muted)]">Sin motivo registrado</span>
                    )}
                  </td>
                  <td className="text-sm text-[var(--app-muted)]">
                    {item.deletedSource === 'self' ? (
                      <span className="italic">El propio usuario</span>
                    ) : (
                      <>
                        {item.deletedByName ?? '—'}
                        {item.deletedByEmail && (
                          <div className="text-xs">{item.deletedByEmail}</div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="text-xs text-[var(--app-muted)]">{fmtDate(item.deletedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
