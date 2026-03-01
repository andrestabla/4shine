'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useUser } from '@/context/UserContext';
import {
  createUser,
  deactivateUser,
  listUserNavigationLogs,
  listUsers,
  updateUser,
  type AppRole,
  type AuditLogRecord,
  type UserRecord,
} from '@/features/usuarios/client';

interface CreateFormState {
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: AppRole;
  password: string;
}

type TabCode = 'users' | 'logs';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function summarizeChanges(input: Record<string, unknown>): string {
  try {
    const serialized = JSON.stringify(input);
    if (serialized.length <= 70) return serialized;
    return `${serialized.slice(0, 67)}...`;
  } catch {
    return '{}';
  }
}

export default function UsuariosPage() {
  const { can, refreshBootstrap } = useUser();
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [logs, setLogs] = React.useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabCode>('users');
  const [form, setForm] = React.useState<CreateFormState>({
    email: '',
    firstName: '',
    lastName: '',
    primaryRole: 'lider',
    password: '',
  });

  const canViewLogs = can('usuarios', 'manage');

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = React.useCallback(async () => {
    if (!canViewLogs) return;
    setLogsLoading(true);
    setError(null);
    try {
      const data = await listUserNavigationLogs();
      setLogs(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el log de navegación');
    } finally {
      setLogsLoading(false);
    }
  }, [canViewLogs]);

  React.useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  React.useEffect(() => {
    if (activeTab === 'logs') {
      void loadLogs();
    }
  }, [activeTab, loadLogs]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim() || !form.password.trim()) return;

    try {
      await createUser({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        primaryRole: form.primaryRole,
        password: form.password,
      });
      setForm({
        email: '',
        firstName: '',
        lastName: '',
        primaryRole: 'lider',
        password: '',
      });
      await Promise.all([loadUsers(), refreshBootstrap()]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el usuario');
    }
  };

  const onToggleActive = async (user: UserRecord) => {
    try {
      await updateUser(user.userId, { isActive: !user.isActive });
      await Promise.all([loadUsers(), refreshBootstrap()]);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el usuario');
    }
  };

  const onDeactivate = async (user: UserRecord) => {
    const confirmed = window.confirm(`Desactivar usuario "${user.displayName}"?`);
    if (!confirmed) return;

    try {
      await deactivateUser(user.userId);
      await Promise.all([loadUsers(), refreshBootstrap()]);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo desactivar el usuario');
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Gestión Usuarios"
        subtitle="Crear, editar, eliminar, suspender, asignar rol y auditar navegación."
      />

      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm inline-flex gap-2">
        <button
          type="button"
          className={`px-3 py-1.5 text-sm rounded-md ${
            activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Usuarios
        </button>
        {canViewLogs && (
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-md ${
              activeTab === 'logs' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            onClick={() => setActiveTab('logs')}
          >
            Log de navegación
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {activeTab === 'users' && (
        <>
          {can('usuarios', 'create') && (
            <form
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-2"
              onSubmit={onCreate}
            >
              <input
                className="border border-slate-300 rounded-md px-2 py-2 text-sm md:col-span-2"
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
              <input
                className="border border-slate-300 rounded-md px-2 py-2 text-sm"
                placeholder="Nombre"
                value={form.firstName}
                onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                required
              />
              <input
                className="border border-slate-300 rounded-md px-2 py-2 text-sm"
                placeholder="Apellido"
                value={form.lastName}
                onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                required
              />
              <select
                className="border border-slate-300 rounded-md px-2 py-2 text-sm"
                value={form.primaryRole}
                onChange={(event) => setForm((prev) => ({ ...prev, primaryRole: event.target.value as AppRole }))}
              >
                <option value="lider">lider</option>
                <option value="mentor">mentor</option>
                <option value="gestor">gestor</option>
                <option value="admin">admin</option>
              </select>
              <input
                className="border border-slate-300 rounded-md px-2 py-2 text-sm"
                type="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
              <button
                className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 md:col-span-6 md:w-fit"
                type="submit"
              >
                Crear usuario
              </button>
            </form>
          )}

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando...</div>
          ) : users.length === 0 ? (
            <EmptyState message="No hay usuarios registrados." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr className="text-left">
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Rol</th>
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.userId} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{user.displayName}</p>
                          <p className="text-xs text-slate-500">{user.location ?? 'Sin ubicación'}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                        <td className="px-4 py-3 text-slate-600">{user.primaryRole}</td>
                        <td className="px-4 py-3 text-slate-600">{user.organizationName ?? '4Shine'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {can('usuarios', 'update') && (
                              <>
                                <button
                                  className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700"
                                  type="button"
                                  onClick={() => void onToggleActive(user)}
                                >
                                  {user.isActive ? 'Suspender' : 'Activar'}
                                </button>
                                <button
                                  className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700"
                                  type="button"
                                  onClick={async () => {
                                    const role = window.prompt(
                                      'Nuevo rol: lider | mentor | gestor | admin',
                                      user.primaryRole,
                                    );
                                    if (!role || !['lider', 'mentor', 'gestor', 'admin'].includes(role)) return;
                                    try {
                                      await updateUser(user.userId, { primaryRole: role as AppRole });
                                      await Promise.all([loadUsers(), refreshBootstrap()]);
                                    } catch (updateError) {
                                      setError(
                                        updateError instanceof Error
                                          ? updateError.message
                                          : 'No se pudo actualizar el rol',
                                      );
                                    }
                                  }}
                                >
                                  Cambiar rol
                                </button>
                              </>
                            )}
                            {can('usuarios', 'delete') && (
                              <button
                                className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                                type="button"
                                onClick={() => void onDeactivate(user)}
                              >
                                Desactivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'logs' && (
        <>
          {logsLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando logs...</div>
          ) : logs.length === 0 ? (
            <EmptyState message="No hay eventos en el log de navegación." />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr className="text-left">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Actor</th>
                      <th className="px-4 py-3">Acción</th>
                      <th className="px-4 py-3">Módulo</th>
                      <th className="px-4 py-3">Entidad</th>
                      <th className="px-4 py-3">Cambios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.auditId} className="border-t border-slate-100 align-top">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDateTime(log.occurredAt)}</td>
                        <td className="px-4 py-3 text-slate-700">{log.actorName ?? 'Sistema'}</td>
                        <td className="px-4 py-3 text-slate-700">{log.action}</td>
                        <td className="px-4 py-3 text-slate-600">{log.moduleCode ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{log.entityTable}</p>
                          <p className="text-xs text-slate-400">{log.entityId ?? '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{summarizeChanges(log.changeSummary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
