'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useUser } from '@/context/UserContext';
import {
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
  type AppRole,
  type UserRecord,
} from '@/features/usuarios/client';

interface CreateFormState {
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: AppRole;
  password: string;
}

export default function UsuariosPage() {
  const { can, refreshBootstrap } = useUser();
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<CreateFormState>({
    email: '',
    firstName: '',
    lastName: '',
    primaryRole: 'lider',
    password: '',
  });

  const load = React.useCallback(async () => {
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

  React.useEffect(() => {
    void load();
  }, [load]);

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
      await Promise.all([load(), refreshBootstrap()]);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'No se pudo crear el usuario');
    }
  };

  const onToggleActive = async (user: UserRecord) => {
    try {
      await updateUser(user.userId, { isActive: !user.isActive });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el usuario');
    }
  };

  const onDeactivate = async (user: UserRecord) => {
    const confirmed = window.confirm(`Desactivar usuario "${user.displayName}"?`);
    if (!confirmed) return;

    try {
      await deactivateUser(user.userId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo desactivar el usuario');
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle title="Gestión Usuarios" subtitle="Administración real de usuarios y estado de cuenta." />

      {can('usuarios', 'create') && (
        <form className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-2" onSubmit={onCreate}>
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
          <button className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 md:col-span-6 md:w-fit" type="submit">
            Crear usuario
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

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
                                const role = window.prompt('Nuevo rol: lider | mentor | gestor | admin', user.primaryRole);
                                if (!role || !['lider', 'mentor', 'gestor', 'admin'].includes(role)) return;
                                try {
                                  await updateUser(user.userId, { primaryRole: role as AppRole });
                                  await Promise.all([load(), refreshBootstrap()]);
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
    </div>
  );
}
