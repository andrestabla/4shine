'use client';

import Link from 'next/link';
import React from 'react';
import { Eye, Search, ShieldCheck, UserPlus } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { listUsers, type AppRole, type UserRecord } from '@/features/usuarios/client';

interface ListFilters {
  search: string;
  role: AppRole | 'all';
  status: 'all' | 'active' | 'inactive';
  policyStatus: 'all' | 'accepted' | 'pending';
}

function formatDate(value: string | null): string {
  if (!value) return 'Pendiente';
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
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

function statusBadge(isActive: boolean) {
  if (isActive) {
    return 'app-badge app-badge-success';
  }
  return 'app-badge app-badge-muted';
}

export default function UsuariosPage() {
  const { can } = useUser();
  const { alert } = useAppDialog();
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState<ListFilters>({
    search: '',
    role: 'all',
    status: 'all',
    policyStatus: 'all',
  });

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUsers({
        limit: 500,
        search: filters.search,
        role: filters.role,
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
  }, [alert, filters.policyStatus, filters.role, filters.search, filters.status]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle title="Gestión de Usuarios" subtitle="Administra cuentas, roles, estado y cumplimiento de políticas." />
        {can('usuarios', 'create') && (
          <Link
            href="/dashboard/usuarios/nuevo"
            className="app-button-primary"
          >
            <UserPlus size={16} />
            Nuevo Usuario
          </Link>
        )}
      </div>

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
            <span className="app-field-label">Rol</span>
            <select
              className="app-select"
              value={filters.role}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  role: event.target.value as ListFilters['role'],
                }))
              }
            >
              <option value="all">Todos</option>
              <option value="lider">Líder</option>
              <option value="mentor">iShine</option>
              <option value="gestor">Gestor</option>
              <option value="admin">Admin</option>
              <option value="invitado">Invitado</option>
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
      ) : users.length === 0 ? (
        <EmptyState message="No hay usuarios para los filtros aplicados." />
      ) : (
        <section className="app-table-shell">
          <div className="overflow-x-auto">
            <table className="app-table min-w-[900px] text-sm">
              <thead>
                <tr className="text-left">
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Políticas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
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
                    <td className="text-[var(--app-ink)]">{roleLabel(user.primaryRole)}</td>
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
                        <span className="app-badge app-badge-warning">
                          Pendiente
                        </span>
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
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
