'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AccessOfferPanel } from '@/components/access/AccessOfferPanel';
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
  type CommunityPostRecord,
  type CommunityRecord,
  type CommunityVisibility,
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

function roleLabel(role: string): string {
  if (role === 'lider') return 'Líder con suscripción';
  if (role === 'mentor') return 'Adviser';
  if (role === 'gestor') return 'Gestor';
  if (role === 'admin') return 'Administrador';
  return role;
}

function connectionTag(status: ConnectionStatus | 'none'): string {
  if (status === 'connected') return 'Conectado';
  if (status === 'pending') return 'Pendiente';
  if (status === 'blocked') return 'Bloqueado';
  if (status === 'rejected') return 'Rechazado';
  return 'Sin contacto';
}

export default function NetworkingPage() {
  const router = useRouter();
  const { can, currentRole, currentUser, refreshBootstrap, viewerAccess } = useUser();
  const { alert, confirm } = useAppDialog();

  const [connections, setConnections] = React.useState<ConnectionRecord[]>([]);
  const [people, setPeople] = React.useState<NetworkPersonRecord[]>([]);
  const [communities, setCommunities] = React.useState<CommunityRecord[]>([]);
  const [communityPosts, setCommunityPosts] = React.useState<CommunityPostRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');
  const [selectedProfileId, setSelectedProfileId] = React.useState<string>('');
  const [postForm, setPostForm] = React.useState({
    groupId: '',
    title: '',
    body: '',
    resourceUrl: '',
  });
  const [communityForm, setCommunityForm] = React.useState({
    name: '',
    description: '',
    category: '',
    visibility: 'open' as CommunityVisibility,
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
      setSelectedProfileId((prev) => prev || peopleData[0]?.userId || '');
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
      if (person.isFollowing) await unfollowUser(person.userId);
      else await followUser(person.userId);
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
      message: `¿Deseas eliminar la comunidad ${community.name}?`,
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
      if (community.isMember) await leaveCommunity(community.groupId);
      else await joinCommunity(community.groupId);
      await load();
    } catch (error) {
      await showError('No se pudo actualizar la membresía', error);
    }
  };

  const filteredPeople = people.filter((person) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (`${person.displayName} ${person.profession ?? ''} ${person.industry ?? ''} ${person.location ?? ''}`).toLowerCase().includes(term);
  });

  const selectedProfile = people.find((person) => person.userId === selectedProfileId) ?? filteredPeople[0] ?? null;

  const myConnected = connections.filter((connection) => connection.status === 'connected').length;
  const myPending = connections.filter((connection) => connection.status === 'pending').length;

  if (isCommunityLocked) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-4">
      {loading ? (
        <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando networking...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="space-y-4">
            <section className="app-panel overflow-hidden p-0">
              <div className="h-16 bg-gradient-to-r from-[#2c136e] via-[#45208f] to-[#25124f]" />
              <div className="-mt-7 px-4 pb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-[var(--app-primary)] text-lg font-black text-white">
                  {(currentUser?.name?.[0] ?? 'U').toUpperCase()}
                </div>
                <h3 className="mt-2 text-lg font-bold text-[var(--app-ink)]">{currentUser?.name ?? 'Usuario'}</h3>
                <p className="text-sm text-[var(--app-muted)]">{currentUser?.profession ?? 'Perfil profesional'}</p>
                <p className="mt-1 text-xs text-[var(--app-muted)]">{currentUser?.location ?? 'Ubicación no definida'}</p>
              </div>
              <div className="grid grid-cols-2 border-t border-[var(--app-line)]">
                <div className="px-4 py-3">
                  <p className="text-xs text-[var(--app-muted)]">Contactos</p>
                  <p className="text-lg font-black text-[var(--app-ink)]">{myConnected}</p>
                </div>
                <div className="border-l border-[var(--app-line)] px-4 py-3">
                  <p className="text-xs text-[var(--app-muted)]">Pendientes</p>
                  <p className="text-lg font-black text-[var(--app-ink)]">{myPending}</p>
                </div>
              </div>
            </section>

            <section className="app-panel p-4">
              <h4 className="mb-2 text-sm font-bold text-[var(--app-ink)]">Mi red</h4>
              {connections.length === 0 ? (
                <p className="text-xs text-[var(--app-muted)]">Aún no tienes contactos.</p>
              ) : (
                <div className="space-y-2">
                  {connections.slice(0, 5).map((connection) => (
                    <article key={connection.connectionId} className="rounded-xl border border-[var(--app-line)] p-2">
                      <p className="text-sm font-semibold text-[var(--app-ink)]">{connection.counterpartName}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          className="app-select min-h-0 py-1 text-xs"
                          value={connection.status}
                          onChange={(event) => void onUpdateStatus(connection, event.target.value as ConnectionStatus)}
                        >
                          <option value="pending">pending</option>
                          <option value="connected">connected</option>
                          <option value="rejected">rejected</option>
                          <option value="blocked">blocked</option>
                        </select>
                        <button className="text-xs font-semibold text-red-600" type="button" onClick={() => void onDeleteConnection(connection)}>
                          Quitar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>

          <main className="space-y-4">
            <section className="app-panel p-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className="app-input flex-1"
                  placeholder="Buscar líderes por nombre, industria o ciudad..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <select
                  className="app-select w-56"
                  value={postForm.groupId}
                  onChange={(event) => setPostForm((prev) => ({ ...prev, groupId: event.target.value }))}
                >
                  <option value="">Comunidad para publicar</option>
                  {communities.map((community) => (
                    <option key={community.groupId} value={community.groupId}>{community.name}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="app-panel p-4">
              <h3 className="mb-3 text-lg font-bold text-[var(--app-ink)]">Crear publicación</h3>
              <form className="space-y-2" onSubmit={onCreatePost}>
                <input
                  className="app-input"
                  placeholder="Título del aporte"
                  value={postForm.title}
                  onChange={(event) => setPostForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                <textarea
                  className="app-textarea min-h-24"
                  placeholder="Comparte una idea, aprendizaje o recurso con la comunidad..."
                  value={postForm.body}
                  onChange={(event) => setPostForm((prev) => ({ ...prev, body: event.target.value }))}
                  required
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    className="app-input flex-1"
                    placeholder="URL del recurso (opcional)"
                    value={postForm.resourceUrl}
                    onChange={(event) => setPostForm((prev) => ({ ...prev, resourceUrl: event.target.value }))}
                  />
                  <button className="app-button-primary" type="submit" disabled={!canCreate}>Publicar</button>
                </div>
              </form>
            </section>

            <section className="space-y-3">
              {communityPosts.length === 0 ? (
                <EmptyState message="Aún no hay publicaciones. Sé la primera persona en compartir un recurso." />
              ) : (
                communityPosts.map((post) => (
                  <article key={post.postId} className="app-panel p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--app-ink)]">{post.authorName}</p>
                        <p className="text-xs text-[var(--app-muted)]">{post.groupName} · {toDateLabel(post.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-[var(--app-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--app-muted)]">
                        Comunidad
                      </span>
                    </div>
                    <h4 className="mt-3 text-base font-bold text-[var(--app-ink)]">{post.title}</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--app-muted)]">{post.body}</p>
                    {post.resourceUrl && (
                      <a href={post.resourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[var(--app-primary)] underline">
                        Abrir recurso compartido
                      </a>
                    )}
                  </article>
                ))
              )}
            </section>
          </main>

          <aside className="space-y-4">
            <section className="app-panel p-4">
              <h3 className="mb-3 text-base font-bold text-[var(--app-ink)]">Perfiles destacados</h3>
              <div className="space-y-2">
                {filteredPeople.slice(0, 8).map((person) => (
                  <button
                    key={person.userId}
                    type="button"
                    className={`w-full rounded-xl border p-2 text-left transition ${
                      selectedProfile?.userId === person.userId
                        ? 'border-[var(--app-primary)] bg-[var(--app-surface-muted)]'
                        : 'border-[var(--app-line)] hover:bg-[var(--app-surface-muted)]'
                    }`}
                    onClick={() => setSelectedProfileId(person.userId)}
                  >
                    <p className="text-sm font-semibold text-[var(--app-ink)]">{person.displayName}</p>
                    <p className="text-xs text-[var(--app-muted)]">{person.profession ?? 'Perfil profesional'}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="app-panel p-4">
              <h3 className="mb-3 text-base font-bold text-[var(--app-ink)]">Perfil público</h3>
              {!selectedProfile ? (
                <EmptyState message="Selecciona un perfil para ver su detalle." />
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {selectedProfile.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedProfile.avatarUrl} alt={selectedProfile.displayName} className="h-14 w-14 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--app-surface-muted)] text-lg font-black text-[var(--app-ink)]">
                        {(selectedProfile.displayName[0] ?? 'L').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-[var(--app-ink)]">{selectedProfile.displayName}</p>
                      <p className="text-xs text-[var(--app-muted)]">{roleLabel(selectedProfile.primaryRole)}</p>
                      <p className="mt-1 text-[11px] text-[var(--app-muted)]">{connectionTag(selectedProfile.connectionStatus)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[var(--app-muted)]">{selectedProfile.bio ?? selectedProfile.profession ?? 'Perfil sin descripción pública.'}</p>
                  <p className="mt-2 text-xs text-[var(--app-muted)]">{selectedProfile.industry ?? 'Industria no definida'} · {selectedProfile.location ?? 'Ubicación no definida'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="app-button-secondary px-3 py-1.5 text-xs" type="button" onClick={() => void onToggleFollow(selectedProfile)}>
                      {selectedProfile.isFollowing ? 'Siguiendo' : 'Seguir'}
                    </button>
                    <button className="app-button-secondary px-3 py-1.5 text-xs" type="button" onClick={() => void onContact(selectedProfile)}>
                      Contactar
                    </button>
                    <button className="app-button-primary px-3 py-1.5 text-xs" type="button" onClick={() => void onMessage(selectedProfile)}>
                      Mensaje
                    </button>
                  </div>
                </>
              )}
            </section>

            <section className="app-panel p-4">
              <h3 className="mb-3 text-base font-bold text-[var(--app-ink)]">Comunidades</h3>
              {communities.length === 0 ? (
                <EmptyState message="No hay comunidades todavía." />
              ) : (
                <div className="space-y-2">
                  {communities.map((community) => (
                    <article key={community.groupId} className="rounded-xl border border-[var(--app-line)] p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[var(--app-ink)]">{community.name}</p>
                          <p className="text-xs text-[var(--app-muted)]">{community.memberCount} miembros</p>
                        </div>
                        <button className="text-xs font-semibold text-[var(--app-primary)]" type="button" onClick={() => void onToggleMembership(community)}>
                          {community.isMember ? 'Salir' : 'Unirme'}
                        </button>
                      </div>
                      {canManageCommunities && (
                        <div className="mt-2 flex gap-2">
                          <button className="rounded-full border border-[var(--app-line)] px-2 py-1 text-[11px]" type="button" onClick={() => void onToggleCommunityStatus(community)}>
                            {community.isActive ? 'Cerrar' : 'Abrir'}
                          </button>
                          <button className="rounded-full border border-red-200 px-2 py-1 text-[11px] text-red-600" type="button" onClick={() => void onDeleteCommunity(community)}>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {canManageCommunities && (
              <section className="app-panel p-4">
                <h3 className="mb-3 text-base font-bold text-[var(--app-ink)]">Nueva comunidad</h3>
                <form className="space-y-2" onSubmit={onCreateCommunity}>
                  <input className="app-input" placeholder="Nombre" value={communityForm.name} onChange={(event) => setCommunityForm((prev) => ({ ...prev, name: event.target.value }))} required />
                  <input className="app-input" placeholder="Categoría" value={communityForm.category} onChange={(event) => setCommunityForm((prev) => ({ ...prev, category: event.target.value }))} />
                  <select className="app-select" value={communityForm.visibility} onChange={(event) => setCommunityForm((prev) => ({ ...prev, visibility: event.target.value as CommunityVisibility }))}>
                    <option value="open">Abierta</option>
                    <option value="closed">Cerrada</option>
                  </select>
                  <textarea className="app-textarea min-h-20" placeholder="Descripción" value={communityForm.description} onChange={(event) => setCommunityForm((prev) => ({ ...prev, description: event.target.value }))} />
                  <button className="app-button-primary w-full" type="submit">Crear</button>
                </form>
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
