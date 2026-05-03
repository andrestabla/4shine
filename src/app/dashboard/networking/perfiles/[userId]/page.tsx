'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Globe, Linkedin, Twitter } from 'lucide-react';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { getConnectedLeaderProfile, type ConnectedLeaderProfileRecord } from '@/features/networking/client';

function roleLabel(role: string): string {
  if (role === 'lider') return 'Líder con suscripción';
  if (role === 'mentor') return 'Adviser';
  if (role === 'gestor') return 'Gestor';
  if (role === 'admin') return 'Administrador';
  return role;
}

export default function NetworkingProfilePage() {
  const params = useParams<{ userId: string }>();
  const { alert } = useAppDialog();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<ConnectedLeaderProfileRecord | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getConnectedLeaderProfile(params.userId);
        if (!cancelled) setProfile(data);
      } catch (error) {
        if (!cancelled) {
          await alert({
            title: 'Perfil no disponible',
            message: error instanceof Error ? error.message : 'No se pudo cargar este perfil.',
            tone: 'error',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [alert, params.userId]);

  if (loading) {
    return <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando perfil público...</div>;
  }

  if (!profile) {
    return (
      <div className="app-panel p-5">
        <p className="text-sm text-[var(--app-muted)]">No fue posible cargar este perfil.</p>
        <Link href="/dashboard/networking" className="mt-3 inline-flex text-sm font-semibold text-[var(--app-primary)] underline">
          Volver a networking
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/dashboard/networking" className="inline-flex items-center gap-2 rounded-full border border-[var(--app-line)] px-3 py-1.5 text-sm font-semibold text-[var(--app-ink)]">
        <ArrowLeft size={14} />
        Volver a networking
      </Link>

      <section className="app-panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.displayName} className="h-20 w-20 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--app-surface-muted)] text-2xl font-black text-[var(--app-ink)]">
                {(profile.displayName[0] ?? 'L').toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black text-[var(--app-ink)]">{profile.displayName}</h2>
              <p className="text-sm text-[var(--app-muted)]">{roleLabel(profile.primaryRole)}</p>
              <p className="mt-1 text-sm text-[var(--app-muted)]">{profile.profession ?? 'Profesión no definida'}</p>
              <p className="text-xs text-[var(--app-muted)]">{profile.industry ?? 'Industria no definida'} · {profile.country ?? profile.location ?? 'Ubicación no definida'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm">
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[var(--app-primary)] underline">
                <Linkedin size={14} /> LinkedIn
              </a>
            )}
            {profile.twitterUrl && (
              <a href={profile.twitterUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[var(--app-primary)] underline">
                <Twitter size={14} /> Twitter/X
              </a>
            )}
            {profile.websiteUrl && (
              <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[var(--app-primary)] underline">
                <Globe size={14} /> Sitio web
              </a>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">{profile.bio ?? 'Sin descripción pública todavía.'}</p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="app-panel p-5 lg:col-span-2">
          <h3 className="mb-3 text-lg font-bold text-[var(--app-ink)]">Proyectos</h3>
          {profile.projects.length === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">Este líder aún no tiene proyectos públicos.</p>
          ) : (
            <div className="space-y-3">
              {profile.projects.map((project) => (
                <article key={project.projectId} className="rounded-2xl border border-[var(--app-line)] bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-[var(--app-ink)]">{project.title}</h4>
                    {project.projectRole && <span className="app-badge app-badge-muted">{project.projectRole}</span>}
                  </div>
                  {project.description && <p className="mt-2 text-sm text-[var(--app-muted)]">{project.description}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="app-panel p-5">
          <h3 className="mb-3 text-lg font-bold text-[var(--app-ink)]">Intereses</h3>
          {profile.interests.length === 0 ? (
            <p className="text-sm text-[var(--app-muted)]">Sin intereses visibles.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
