'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { useUser } from '@/context/UserContext';
import { filterCommercialProducts } from '@/features/access/catalog';
import { createDirectThread } from '@/features/mensajes/client';
import {
  createCommunity,
  createCommunityPost,
  createConnection,
  deleteCommunity,
  deleteConnection,
  followUser,
  joinCommunity,
  leaveCommunity,
  listCommunities,
  listCommunityPosts,
  listConnections,
  listNetworkPeople,
  unfollowUser,
  updateCommunity,
  updateConnection,
  type CommunityRecord,
  type CommunityVisibility,
  type ConnectionRecord,
  type ConnectionStatus,
  type CommunityPostRecord,
  type NetworkPersonRecord,
} from '@/features/networking/client';

function toDateLabel(value: string): string {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function roleLabel(role: string): string {
  if (role === 'lider') return 'Líder con suscripción';
  if (role === 'mentor') return 'Adviser';
  if (role === 'gestor') return 'Gestor';
  if (role === 'admin') return 'Administrador';
  return role;
}

export default function NetworkingPage() {
  const router = useRouter();
  const { bootstrapData, can, currentRole, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();

  const [connections, setConnections] = React.useState<ConnectionRecord[]>([]);
  const [people, setPeople] = React.useState<NetworkPersonRecord[]>([]);
  const [communities, setCommunities] = React.useState<CommunityRecord[]>([]);
  const [communityPosts, setCommunityPosts] = React.useState<CommunityPostRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [communityForm, setCommunityForm] = React.useState({
    name: '',
    description: '',
    category: '',
    visibility: 'open' as CommunityVisibility,
  });
  const [postForm, setPostForm] = React.useState({
    groupId: '',
    title: '',
    body: '',
    resourceUrl: '',
  });

  const isCommunityLocked = currentRole === 'lider' && viewerAccess?.viewerTier === 'open_leader';
  const canManageCommunities = can('networking', 'manage');
  const canCreate = can('networking', 'create');

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
      const [connectionData, peopleData, communityData, postData] = await Promise.all([
        listConnections(),
        listNetworkPeople(),
        listCommunities(),
        listCommunityPosts(),
      ]);
      setConnections(connectionData);
      setPeople(peopleData);
      setCommunities(communityData);
      setCommunityPosts(postData);
      setPostForm((prev) => ({ ...prev, groupId: prev.groupId || communityData[0]?.groupId || '' }));
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

  const onToggleFollow = async (person: NetworkPersonRecord) => {
    try {
      if (person.isFollowing) {
        await unfollowUser(person.userId);
      } else {
        await followUser(person.userId);
      }
      await load();
    } catch (error) {
      await showError('No se pudo actualizar el seguimiento', error);
    }
  };

  const onContact = async (person: NetworkPersonRecord) => {
    try {
      await createConnection({ addresseeUserId: person.userId });
      await Promise.all([load(), refreshBootstrap()]);
      await alert({
        title: 'Solicitud enviada',
        message: `Se envió solicitud de contacto a ${person.displayName}.`,
        tone: 'success',
      });
    } catch (error) {
      await showError('No se pudo enviar la solicitud de contacto', error);
    }
  };

  const onMessage = async (person: NetworkPersonRecord) => {
    try {
      await createDirectThread({ participantUserId: person.userId, title: `Chat con ${person.displayName}` });
      router.push('/dashboard/mensajes');
    } catch (error) {
      await showError('No se pudo abrir el chat', error);
    }
  };

  const onUpdateStatus = async (connection: ConnectionRecord, status: ConnectionStatus) => {
    try {
      await updateConnection(connection.connectionId, { status });
      await load();
    } catch (error) {
      await showError('No se pudo actualizar la conexión', error);
    }
  };

  const onDeleteConnection = async (connection: ConnectionRecord) => {
    const ok = await confirm({
      title: 'Eliminar contacto',
      message: `¿Deseas eliminar la relación con ${connection.counterpartName}?`,
      tone: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;
    try {
      await deleteConnection(connection.connectionId);
      await load();
    } catch (error) {
      await showError('No se pudo eliminar la conexión', error);
    }
  };

  const onCreateCommunity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createCommunity(communityForm);
      setCommunityForm({ name: '', description: '', category: '', visibility: 'open' });
      await load();
    } catch (error) {
      await showError('No se pudo crear la comunidad', error);
    }
  };

  const onToggleCommunityStatus = async (community: CommunityRecord) => {
    try {
      await updateCommunity(community.groupId, { isActive: !community.isActive });
      await load();
    } catch (error) {
      await showError('No se pudo actualizar la comunidad', error);
    }
  };

  const onDeleteCommunity = async (community: CommunityRecord) => {
    const ok = await confirm({
      title: 'Eliminar comunidad',
      message: `¿Deseas eliminar la comunidad ${community.name}? Esta acción no se puede deshacer.`,
      tone: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
    });
    if (!ok) return;

    try {
      await deleteCommunity(community.groupId);
      await load();
    } catch (error) {
      await showError('No se pudo eliminar la comunidad', error);
    }
  };

  const onToggleMembership = async (community: CommunityRecord) => {
    try {
      if (community.isMember) {
        await leaveCommunity(community.groupId);
      } else {
        await joinCommunity(community.groupId);
      }
      await load();
    } catch (error) {
      await showError('No se pudo actualizar la membresía', error);
    }
  };

  const onCreatePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!postForm.groupId) {
      await alert({ title: 'Comunidad requerida', message: 'Selecciona una comunidad.', tone: 'warning' });
      return;
    }

    try {
      await createCommunityPost(postForm.groupId, {
        title: postForm.title,
        body: postForm.body,
        resourceUrl: postForm.resourceUrl || null,
      });
      setPostForm((prev) => ({ ...prev, title: '', body: '', resourceUrl: '' }));
      await load();
    } catch (error) {
      await showError('No se pudo compartir el recurso', error);
    }
  };

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
          description="Networking forma parte de la experiencia completa del programa. Al activarlo accedes a perfiles públicos, contacto, mensajería y comunidades temáticas."
          products={programOffers}
          primaryAction={{
            href: '/dashboard',
            label: 'Ver plan 4Shine',
          }}
          note="Mientras tu cuenta siga en modo free, este módulo no estará disponible."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle
        title="Networking"
        subtitle="Red social de líderes con suscripción: perfiles públicos, seguimiento, contacto y comunidades."
      />

      {loading ? (
        <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando networking...</div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <article className="app-panel p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">Líderes visibles</p>
              <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{people.length}</p>
            </article>
            <article className="app-panel p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">Contactos</p>
              <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{connections.filter((c) => c.status === 'connected').length}</p>
            </article>
            <article className="app-panel p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">Comunidades</p>
              <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{communities.length}</p>
            </article>
            <article className="app-panel p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">Recursos compartidos</p>
              <p className="mt-1 text-2xl font-black text-[var(--app-ink)]">{communityPosts.length}</p>
            </article>
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <section className="app-panel p-5 xl:col-span-2">
              <h3 className="mb-4 text-lg font-bold text-[var(--app-ink)]">Directorio público de líderes</h3>
              {people.length === 0 ? (
                <EmptyState message="No hay perfiles públicos de líderes disponibles." />
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {people.map((person) => (
                    <article key={person.userId} className="app-list-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--app-ink)]">{person.displayName}</p>
                          <p className="text-xs text-[var(--app-muted)]">{roleLabel(person.primaryRole)}</p>
                          <p className="mt-2 text-sm text-[var(--app-muted)]">{person.profession ?? 'Perfil profesional no definido'}</p>
                        </div>
                        <span className="app-badge app-badge-muted">{person.connectionStatus}</span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--app-muted)]">
                        {person.industry ?? 'Industria no definida'} · {person.location ?? 'Ubicación no definida'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="app-button-secondary px-3 py-1.5 text-xs" type="button" onClick={() => void onToggleFollow(person)}>
                          {person.isFollowing ? 'Dejar de seguir' : 'Seguir'}
                        </button>
                        {canCreate && (
                          <button className="app-button-secondary px-3 py-1.5 text-xs" type="button" onClick={() => void onContact(person)}>
                            Contactar
                          </button>
                        )}
                        {can('mensajes', 'create') && (
                          <button className="app-button-primary px-3 py-1.5 text-xs" type="button" onClick={() => void onMessage(person)}>
                            Enviar mensaje
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="app-panel p-5">
              <h3 className="mb-4 text-lg font-bold text-[var(--app-ink)]">Solicitudes y contactos</h3>
              {connections.length === 0 ? (
                <EmptyState message="No hay solicitudes o contactos todavía." />
              ) : (
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <article key={connection.connectionId} className="app-list-card p-3">
                      <p className="font-semibold text-[var(--app-ink)]">{connection.counterpartName}</p>
                      <p className="mt-1 text-xs text-[var(--app-muted)]">{toDateLabel(connection.requestedAt)}</p>
                      <div className="mt-2 flex gap-2">
                        {can('networking', 'update') ? (
                          <select
                            className="app-select min-h-0 px-2 py-1 text-xs"
                            value={connection.status}
                            onChange={(event) => void onUpdateStatus(connection, event.target.value as ConnectionStatus)}
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
                          <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600" type="button" onClick={() => void onDeleteConnection(connection)}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <section className="app-panel p-5 xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[var(--app-ink)]">Comunidades</h3>
                <span className="text-xs text-[var(--app-muted)]">Acceso: Líder con suscripción, Adviser, Gestor, Admin</span>
              </div>

              {canManageCommunities && (
                <form className="mb-4 grid grid-cols-1 gap-2 rounded-2xl border border-[var(--app-line)] p-3 md:grid-cols-4" onSubmit={onCreateCommunity}>
                  <input className="app-input" placeholder="Nombre comunidad" value={communityForm.name} onChange={(event) => setCommunityForm((prev) => ({ ...prev, name: event.target.value }))} required />
                  <input className="app-input" placeholder="Categoría" value={communityForm.category} onChange={(event) => setCommunityForm((prev) => ({ ...prev, category: event.target.value }))} />
                  <select className="app-select" value={communityForm.visibility} onChange={(event) => setCommunityForm((prev) => ({ ...prev, visibility: event.target.value as CommunityVisibility }))}>
                    <option value="open">Abierta</option>
                    <option value="closed">Cerrada</option>
                  </select>
                  <button className="app-button-primary" type="submit">Crear comunidad</button>
                  <textarea className="app-textarea md:col-span-4" placeholder="Descripción" value={communityForm.description} onChange={(event) => setCommunityForm((prev) => ({ ...prev, description: event.target.value }))} />
                </form>
              )}

              {communities.length === 0 ? (
                <EmptyState message="No hay comunidades creadas." />
              ) : (
                <div className="space-y-3">
                  {communities.map((community) => (
                    <article key={community.groupId} className="app-list-card p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[var(--app-ink)]">{community.name}</p>
                          <p className="text-xs text-[var(--app-muted)]">{community.category ?? 'General'} · {community.memberCount} miembros</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="app-badge app-badge-muted">{community.visibility === 'open' ? 'Abierta' : 'Cerrada'}</span>
                          <span className="app-badge app-badge-muted">{community.isActive ? 'Activa' : 'Cerrada'}</span>
                        </div>
                      </div>
                      {community.description && <p className="mt-2 text-sm text-[var(--app-muted)]">{community.description}</p>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="app-button-secondary px-3 py-1.5 text-xs" type="button" onClick={() => void onToggleMembership(community)}>
                          {community.isMember ? 'Salir' : 'Unirme'}
                        </button>
                        {canManageCommunities && (
                          <>
                            <button className="app-button-secondary px-3 py-1.5 text-xs" type="button" onClick={() => void onToggleCommunityStatus(community)}>
                              {community.isActive ? 'Cerrar' : 'Abrir'}
                            </button>
                            <button className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600" type="button" onClick={() => void onDeleteCommunity(community)}>
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="app-panel p-5">
              <h3 className="mb-4 text-lg font-bold text-[var(--app-ink)]">Compartir recurso</h3>
              <form className="space-y-2" onSubmit={onCreatePost}>
                <select className="app-select" value={postForm.groupId} onChange={(event) => setPostForm((prev) => ({ ...prev, groupId: event.target.value }))} required>
                  <option value="">Seleccionar comunidad</option>
                  {communities.map((community) => (
                    <option key={community.groupId} value={community.groupId}>{community.name}</option>
                  ))}
                </select>
                <input className="app-input" placeholder="Título" value={postForm.title} onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))} required />
                <textarea className="app-textarea min-h-24" placeholder="Descripción o aporte" value={postForm.body} onChange={(event) => setPostForm((prev) => ({ ...prev, body: event.target.value }))} required />
                <input className="app-input" placeholder="URL recurso (opcional)" value={postForm.resourceUrl} onChange={(event) => setPostForm((prev) => ({ ...prev, resourceUrl: event.target.value }))} />
                <button className="app-button-primary w-full" type="submit" disabled={!canCreate}>Compartir</button>
              </form>
            </aside>
          </div>

          <section className="app-panel p-5">
            <h3 className="mb-4 text-lg font-bold text-[var(--app-ink)]">Feed de comunidades</h3>
            {communityPosts.length === 0 ? (
              <EmptyState message="Todavía no hay recursos compartidos." />
            ) : (
              <div className="space-y-3">
                {communityPosts.map((post) => (
                  <article key={post.postId} className="app-list-card p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--app-ink)]">{post.title}</p>
                      <span className="app-badge app-badge-muted">{post.groupName}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--app-muted)]">{post.body}</p>
                    {post.resourceUrl && (
                      <a href={post.resourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-[var(--app-primary)] underline">
                        Abrir recurso
                      </a>
                    )}
                    <p className="mt-2 text-xs text-[var(--app-muted)]">{post.authorName} · {toDateLabel(post.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
