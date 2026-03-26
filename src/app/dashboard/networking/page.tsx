'use client';

import React from 'react';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
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
  const { bootstrapData, can, currentRole, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();
  const [connections, setConnections] = React.useState<ConnectionRecord[]>([]);
  const [people, setPeople] = React.useState<NetworkPersonRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const isCommunityLocked =
    currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const programOffers = filterCommercialProducts(viewerAccess?.catalog, {
    codes: ['program_4shine'],
  });

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
    if (isCommunityLocked) {
      setLoading(false);
      return;
    }
    void load();
  }, [isCommunityLocked, load]);

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

  if (isCommunityLocked) {
    return (
      <div className="space-y-6">
        <PageTitle
          title="Networking"
          subtitle="El acceso a la red colaborativa del programa se activa con el plan 4Shine."
        />
        <AccessOfferPanel
          badge="Acceso bloqueado"
          title="Desbloquea Networking con el programa 4Shine."
          description="Networking forma parte de la experiencia completa del programa. Al activarlo accedes a conexiones, grupos y dinámicas de relacionamiento dentro de la plataforma."
          products={programOffers}
          primaryAction={{
            href: '/dashboard',
            label: 'Ver plan 4Shine',
          }}
          note="Mientras tu cuenta siga en modo free, Aprendizaje mantiene visible solo los recursos etiquetados como free."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Networking" subtitle="Conexiones reales y administración de estado por permiso." />

      {can('networking', 'create') && (
        <form className="app-panel flex flex-wrap gap-2 p-4" onSubmit={onCreate}>
          <select
            className="app-select min-w-72"
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
            className="app-button-primary disabled:opacity-50"
            type="submit"
            disabled={!selectedUserId || availablePeople.length === 0}
          >
            Enviar solicitud
          </button>
        </form>
      )}
      {loading ? (
        <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="app-panel xl:col-span-2 p-6">
            <h3 className="mb-4 font-bold text-[var(--app-ink)]">Conexiones</h3>
            {connections.length === 0 ? (
              <EmptyState message="No hay conexiones registradas." />
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <article key={connection.connectionId} className="app-list-card flex items-start justify-between gap-3 p-3">
                    <div>
                      <p className="font-medium text-[var(--app-ink)]">{connection.counterpartName}</p>
                      <p className="mt-1 text-xs text-[var(--app-muted)]">Solicitado: {toDateLabel(connection.requestedAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {can('networking', 'update') ? (
                        <select
                          className="app-select min-h-0 px-3 py-2 text-xs"
                          value={connection.status}
                          onChange={(event) => onUpdateStatus(connection, event.target.value as ConnectionStatus)}
                        >
                          <option value="pending">pending</option>
                          <option value="connected">connected</option>
                          <option value="rejected">rejected</option>
                          <option value="blocked">blocked</option>
                        </select>
                      ) : (
                        <span className="app-badge app-badge-muted">{connection.status}</span>
                      )}
                      {can('networking', 'delete') && (
                        <button
                          className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
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

          <aside className="app-panel p-6">
            <h3 className="mb-4 font-bold text-[var(--app-ink)]">Grupos</h3>
            <div className="space-y-3">
              {interestGroups.map((group) => (
                <article key={group.id} className="app-list-card p-3">
                  <p className="font-medium text-[var(--app-ink)]">{group.name}</p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">{group.description}</p>
                  <p className="mt-2 text-xs text-[var(--app-muted)]">Miembros: {group.members}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
