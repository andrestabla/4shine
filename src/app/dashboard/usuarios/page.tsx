'use client';

import Link from 'next/link';
import React from 'react';
import { Activity, Eye, Search, ShieldCheck, UserPlus, Users, UserX, Lock, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { SessionsTabSection } from '@/components/dashboard/usuarios/SessionsTabSection';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  listUsers,
  listDeletedUsersRequest,
  type UserRecord,
  type DeletedUserRecord,
} from '@/features/usuarios/client';
import {
  deriveUserTypeSelection,
  USER_TYPE_OPTIONS,
  userTypeLabel,
  type UserTypeOption,
} from '@/features/usuarios/user-types';
import { RolesMatrixSection } from '@/components/dashboard/usuarios/RolesMatrixSection';

interface ListFilters {
  search: string;
  userType: UserTypeOption | 'all';
  status: 'all' | 'active' | 'inactive';
  policyStatus: 'all' | 'accepted' | 'pending';
}

type Tab = 'usuarios' | 'sesiones' | 'bajas' | 'roles';

function formatDate(value: string | null): string {
  if (!value) return 'Pendiente';
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
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
  const { alert } = useAppDialog();
  const [tab, setTab] = React.useState<Tab>('usuarios');
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ListFilters>({
    search: '',
    userType: 'all',
    status: 'all',
    policyStatus: 'all',
  });

  const isAdmin = currentRole === 'admin';

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

  // Filtra localmente los matices que el endpoint no distingue
  // (leader_with_subscription vs leader_without_subscription).
  const visibleUsers = React.useMemo(() => {
    if (filters.userType === 'all') return users;
    return users.filter((user) => deriveUserTypeSelection(user) === filters.userType);
  }, [users, filters.userType]);

  React.useEffect(() => {
    if (tab !== 'usuarios') return;
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [loadUsers, tab]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle
          title="Gestión de Usuarios y Roles"
          subtitle="Administra cuentas, planes, permisos y políticas. La gestión de roles está reservada al administrador."
        />
        {tab === 'usuarios' && can('usuarios', 'create') && (
          <Link href="/dashboard/usuarios/nuevo" className="app-button-primary">
            <UserPlus size={16} />
            Nuevo Usuario
          </Link>
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
            </div>
          </section>

          {loading ? (
            <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando usuarios...</div>
          ) : visibleUsers.length === 0 ? (
            <EmptyState message="No hay usuarios para los filtros aplicados." />
          ) : (
            <section className="app-table-shell">
              <div className="overflow-x-auto">
                <table className="app-table min-w-[1000px] text-sm">
                  <thead>
                    <tr className="text-left">
                      <th>Usuario</th>
                      <th>Tipo de usuario</th>
                      <th>Plan</th>
                      <th>Estado</th>
                      <th>Políticas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((user) => {
                      const userType = deriveUserTypeSelection(user);
                      return (
                      <tr key={user.userId}>
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
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
