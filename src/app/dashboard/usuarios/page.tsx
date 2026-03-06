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
      return 'MENTOR';
    case 'lider':
    default:
      return 'LÍDER';
  }
}

function statusBadge(isActive: boolean) {
  if (isActive) {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }
  return 'bg-slate-100 text-slate-600 border border-slate-200';
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <UserPlus size={16} />
            Nuevo Usuario
          </Link>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="md:col-span-2">
            <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500">Buscar</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                className="w-full border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Buscar por nombre o correo..."
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              />
            </div>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500">Rol</span>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
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
              <option value="mentor">Mentor</option>
              <option value="gestor">Gestor</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500">Estado</span>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
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
            <span className="mb-1 block text-xs font-semibold tracking-wide text-slate-500">Políticas</span>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800"
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
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Cargando usuarios...</div>
      ) : users.length === 0 ? (
        <EmptyState message="No hay usuarios para los filtros aplicados." />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Políticas</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                          {(user.avatarInitial || user.displayName.charAt(0) || 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{user.displayName}</p>
                          <p className="text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{roleLabel(user.primaryRole)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(user.isActive)}`}>
                        {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.policyStatus === 'accepted' ? (
                        <div className="inline-flex items-center gap-2 text-emerald-700">
                          <ShieldCheck size={15} />
                          <span className="text-xs font-semibold">Aceptadas</span>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Pendiente
                        </span>
                      )}
                      <p className="mt-1 text-xs text-slate-400">{formatDate(user.policyAcceptedAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/usuarios/${user.userId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
