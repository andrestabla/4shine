'use client';

import React from 'react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import {
  createConnection,
  deleteConnection,
  listConnections,
  listNetworkPeople,
  updateConnection,
  type ConnectionRecord,
  type ConnectionStatus,
  type NetworkPersonRecord,
} from '@/features/networking/client';

function toDateLabel(value: string): string {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function NetworkingPage() {
  const { bootstrapData, can, refreshBootstrap } = useUser();
  const { alert, confirm } = useAppDialog();
  const [connections, setConnections] = React.useState<ConnectionRecord[]>([]);
  const [people, setPeople] = React.useState<NetworkPersonRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUserId, setSelectedUserId] = React.useState('');

  const showError = React.useCallback(
    async (fallbackMessage: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallbackMessage,
        tone: 'error',
      });
    },
    [alert],
  );

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [connectionData, peopleData] = await Promise.all([listConnections(), listNetworkPeople()]);
      setConnections(connectionData);
      setPeople(peopleData);
      setSelectedUserId((current) => {
        if (current && peopleData.some((person) => person.userId === current)) return current;
        return peopleData[0]?.userId ?? '';
      });
    } catch (loadError) {
      await showError('No se pudo cargar networking', loadError);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) return;

    try {
      await createConnection({ addresseeUserId: selectedUserId });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (createError) {
      await showError('No se pudo crear la conexión', createError);
    }
  };

  const onUpdateStatus = async (connection: ConnectionRecord, status: ConnectionStatus) => {
    try {
      await updateConnection(connection.connectionId, { status });
      await Promise.all([load(), refreshBootstrap()]);
    } catch (updateError) {
      await showError('No se pudo actualizar la conexión', updateError);
    }
  };

  const onDelete = async (connection: ConnectionRecord) => {
    const isConfirmed = await confirm({
      title: 'Eliminar conexión',
      message: `¿Deseas eliminar la conexión con "${connection.counterpartName}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      tone: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await deleteConnection(connection.connectionId);
      await Promise.all([load(), refreshBootstrap()]);
    } catch (deleteError) {
      await showError('No se pudo eliminar la conexión', deleteError);
    }
  };

  const availablePeople = people.filter((person) => person.connectionStatus === 'none');
  const interestGroups = bootstrapData?.interestGroups ?? [];

  return (
    <div className="space-y-4">
      <PageTitle title="Networking" subtitle="Conexiones reales y administración de estado por permiso." />

      {can('networking', 'create') && (
        <form className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-2" onSubmit={onCreate}>
          <select
            className="border border-slate-300 rounded-md px-2 py-2 text-sm min-w-72"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            disabled={availablePeople.length === 0}
          >
            {availablePeople.length === 0 && <option value="">Sin usuarios disponibles</option>}
            {availablePeople.map((person) => (
              <option key={person.userId} value={person.userId}>
                {person.displayName} · {person.primaryRole}
              </option>
            ))}
          </select>
          <button
            className="rounded-md bg-slate-900 text-white text-sm px-3 py-2 disabled:opacity-50"
            type="submit"
            disabled={!selectedUserId || availablePeople.length === 0}
          >
            Enviar solicitud
          </button>
        </form>
      )}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Conexiones</h3>
            {connections.length === 0 ? (
              <EmptyState message="No hay conexiones registradas." />
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <article key={connection.connectionId} className="border border-slate-100 rounded-lg p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{connection.counterpartName}</p>
                      <p className="text-xs text-slate-500 mt-1">Solicitado: {toDateLabel(connection.requestedAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {can('networking', 'update') ? (
                        <select
                          className="border border-slate-300 rounded px-2 py-1 text-xs"
                          value={connection.status}
                          onChange={(event) => onUpdateStatus(connection, event.target.value as ConnectionStatus)}
                        >
                          <option value="pending">pending</option>
                          <option value="connected">connected</option>
                          <option value="rejected">rejected</option>
                          <option value="blocked">blocked</option>
                        </select>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{connection.status}</span>
                      )}
                      {can('networking', 'delete') && (
                        <button
                          className="text-xs px-2 py-1 rounded border border-red-300 text-red-600"
                          type="button"
                          onClick={() => void onDelete(connection)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Grupos</h3>
            <div className="space-y-3">
              {interestGroups.map((group) => (
                <article key={group.id} className="border border-slate-100 rounded-lg p-3">
                  <p className="font-medium text-slate-800">{group.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{group.description}</p>
                  <p className="text-xs text-slate-500 mt-2">Miembros: {group.members}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
