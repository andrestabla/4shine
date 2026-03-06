'use client';

import React from 'react';
import {
  Briefcase,
  Edit3,
  Link2,
  Plus,
  Save,
  Trash2,
  UserCircle2,
  X,
} from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { useUser } from '@/context/UserContext';
import { getMyProfile, updateMyProfile, type MyProfileRecord } from '@/features/perfil/client';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
type SeniorityLevel = 'senior' | 'c_level' | 'director' | 'manager' | 'vp';

interface ProjectFormItem {
  title: string;
  description: string;
  projectRole: string;
  imageUrl: string;
}

interface ProfileFormState {
  displayName: string;
  avatarUrl: string;
  timezone: string;
  profession: string;
  industry: string;
  location: string;
  bio: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  planType: PlanType | '';
  seniorityLevel: SeniorityLevel | '';
  interestsText: string;
  projects: ProjectFormItem[];
}

function planLabel(planType: PlanType | null): 'VIP' | 'Premium' | 'Empresa Élite' | 'Standard' {
  switch (planType) {
    case 'vip':
      return 'VIP';
    case 'premium':
      return 'Premium';
    case 'empresa_elite':
      return 'Empresa Élite';
    case 'standard':
    default:
      return 'Standard';
  }
}

function buildForm(profile: MyProfileRecord): ProfileFormState {
  return {
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl ?? '',
    timezone: profile.timezone,
    profession: profile.profession ?? '',
    industry: profile.industry ?? '',
    location: profile.location ?? '',
    bio: profile.bio ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    twitterUrl: profile.twitterUrl ?? '',
    websiteUrl: profile.websiteUrl ?? '',
    planType: profile.planType ?? '',
    seniorityLevel: profile.seniorityLevel ?? '',
    interestsText: profile.interests.join(', '),
    projects:
      profile.projects.length > 0
        ? profile.projects.map((project) => ({
            title: project.title,
            description: project.description ?? '',
            projectRole: project.projectRole ?? '',
            imageUrl: project.imageUrl ?? '',
          }))
        : [{ title: '', description: '', projectRole: '', imageUrl: '' }],
  };
}

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const clean = displayName.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ').filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? '',
      lastName: parts[0] ?? '',
    };
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
}

function parseInterests(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function compactProject(item: ProjectFormItem): ProjectFormItem {
  return {
    title: item.title.trim(),
    description: item.description.trim(),
    projectRole: item.projectRole.trim(),
    imageUrl: item.imageUrl.trim(),
  };
}

export default function PerfilPage() {
  const { can, refreshBootstrap, updateUser: updateContextUser, currentUser } = useUser();
  const { alert } = useAppDialog();

  const [profile, setProfile] = React.useState<MyProfileRecord | null>(null);
  const [form, setForm] = React.useState<ProfileFormState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const canEditProfile = can('perfil', 'update');

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyProfile();
      setProfile(data);
      setForm(buildForm(data));
    } catch (error) {
      await alert({
        title: 'Error',
        message: error instanceof Error ? error.message : 'No se pudo cargar el perfil.',
        tone: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [alert]);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onCancelEdit = () => {
    if (!profile) return;
    setForm(buildForm(profile));
    setIsEditing(false);
  };

  const onSaveProfile = async () => {
    if (!form || !profile) return;

    const trimmedName = form.displayName.trim();
    if (!trimmedName) {
      await alert({
        title: 'Nombre requerido',
        message: 'El nombre visible del perfil no puede estar vacío.',
        tone: 'warning',
      });
      return;
    }

    setIsSaving(true);
    try {
      const splitName = splitDisplayName(trimmedName);
      const updated = await updateMyProfile({
        displayName: trimmedName,
        firstName: splitName.firstName,
        lastName: splitName.lastName,
        avatarUrl: form.avatarUrl || null,
        timezone: form.timezone.trim() || profile.timezone,
        profession: form.profession,
        industry: form.industry,
        location: form.location,
        bio: form.bio,
        linkedinUrl: form.linkedinUrl,
        twitterUrl: form.twitterUrl,
        websiteUrl: form.websiteUrl,
        planType: form.planType || null,
        seniorityLevel: form.seniorityLevel || null,
        interests: parseInterests(form.interestsText),
        projects: form.projects
          .map(compactProject)
          .filter((project) => project.title.length > 0)
          .map((project) => ({
            title: project.title,
            description: project.description || null,
            projectRole: project.projectRole || null,
            imageUrl: project.imageUrl || null,
          })),
      });

      setProfile(updated);
      setForm(buildForm(updated));
      setIsEditing(false);

      updateContextUser({
        name: updated.displayName,
        avatar: (updated.avatarInitial || updated.displayName.charAt(0) || 'U').toUpperCase(),
        avatarUrl: updated.avatarUrl ?? undefined,
        profession: updated.profession ?? undefined,
        industry: updated.industry ?? undefined,
        location: updated.location ?? currentUser?.location ?? 'Remoto',
        bio: updated.bio ?? undefined,
        company: updated.organizationName ?? currentUser?.company ?? '4Shine',
        planType: planLabel(updated.planType),
        socialLinks: {
          linkedin: updated.linkedinUrl ?? undefined,
          twitter: updated.twitterUrl ?? undefined,
          website: updated.websiteUrl ?? undefined,
        },
        interests: updated.interests,
        projects: updated.projects.map((project, index) => ({
          id: index + 1,
          title: project.title,
          description: project.description ?? '',
          role: project.projectRole ?? '',
          image: project.imageUrl ?? undefined,
        })),
      });

      await refreshBootstrap();

      await alert({
        title: 'Perfil actualizado',
        message: 'Los cambios se guardaron correctamente.',
        tone: 'success',
      });
    } catch (error) {
      await alert({
        title: 'Error al guardar',
        message: error instanceof Error ? error.message : 'No fue posible guardar el perfil.',
        tone: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !form || !profile) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Cargando perfil...</div>;
  }

  const avatarFallback = (profile.avatarInitial || profile.displayName.charAt(0) || 'U').toUpperCase();
  const avatarPreviewUrl = form.avatarUrl.trim().length > 0 ? form.avatarUrl.trim() : null;

  return (
    <div className="space-y-5">
      <PageTitle title="Mi Perfil" subtitle="Información profesional, proyectos, redes e intereses." />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <div
                className={`relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${currentUser?.color ?? 'bg-slate-900'} text-3xl font-bold text-white`}
              >
                {avatarPreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreviewUrl} alt={profile.displayName} className="h-full w-full object-cover" />
                ) : (
                  avatarFallback
                )}
              </div>
              {canEditProfile && isEditing && (
                <div className="flex flex-col gap-2">
                  <R2UploadButton
                    moduleCode="perfil"
                    action="update"
                    accept="image/*"
                    pathPrefix={`profiles/${profile.userId}/avatar`}
                    entityTable="app_core.users"
                    fieldName="avatar_url"
                    buttonLabel={form.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onUploaded={async (url) => {
                      setForm((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
                    }}
                  />
                  {form.avatarUrl && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      onClick={() => setForm((prev) => (prev ? { ...prev, avatarUrl: '' } : prev))}
                    >
                      <Trash2 size={12} />
                      Quitar foto
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-800">{profile.displayName}</h3>
              <p className="text-slate-500">
                {profile.profession ?? 'Profesional'}
                {profile.organizationName ? ` · ${profile.organizationName}` : ''}
              </p>
            </div>
          </div>

          {canEditProfile && (
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 size={15} />
                  Editar Perfil
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    <X size={15} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSaveProfile()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Save size={15} />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {!canEditProfile && <EmptyState message="No tienes permisos para editar tu perfil." />}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
              <UserCircle2 size={18} />
              Acerca de mí
            </h4>

            {!isEditing ? (
              <>
                <p className="rounded-xl bg-slate-50 p-4 text-slate-700">{profile.bio ?? 'Sin biografía registrada.'}</p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Profesión</p>
                    <p className="font-semibold text-slate-800">{profile.profession ?? 'No registrada'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Industria</p>
                    <p className="font-semibold text-slate-800">{profile.industry ?? 'No registrada'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Ubicación</p>
                    <p className="font-semibold text-slate-800">{profile.location ?? 'No registrada'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">Zona horaria</p>
                    <p className="font-semibold text-slate-800">{profile.timezone}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Nombre visible</span>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={form.displayName}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, displayName: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Profesión</span>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={form.profession}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, profession: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Industria</span>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={form.industry}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, industry: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Ubicación</span>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={form.location}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, location: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Zona horaria</span>
                  <input
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={form.timezone}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, timezone: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Plan</span>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={form.planType}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, planType: event.target.value as PlanType | '' } : prev))
                    }
                  >
                    <option value="">Sin definir</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                    <option value="empresa_elite">Empresa Élite</option>
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Nivel</span>
                  <select
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={form.seniorityLevel}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              seniorityLevel: event.target.value as SeniorityLevel | '',
                            }
                          : prev,
                      )
                    }
                  >
                    <option value="">Sin definir</option>
                    <option value="manager">Manager</option>
                    <option value="director">Director</option>
                    <option value="vp">VP</option>
                    <option value="senior">Senior</option>
                    <option value="c_level">C-Level</option>
                  </select>
                </label>
                <label className="md:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">Biografía</span>
                  <textarea
                    className="h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={form.bio}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, bio: event.target.value } : prev))}
                  />
                </label>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Briefcase size={18} />
              Proyectos Destacados
            </h4>

            {!isEditing ? (
              <div className="space-y-3">
                {profile.projects.length === 0 ? (
                  <EmptyState message="No hay proyectos destacados." />
                ) : (
                  profile.projects.map((project) => (
                    <article key={project.projectId} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h5 className="font-semibold text-slate-800">{project.title}</h5>
                        {project.projectRole && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {project.projectRole}
                          </span>
                        )}
                      </div>
                      {project.description && <p className="mt-2 text-sm text-slate-600">{project.description}</p>}
                    </article>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {form.projects.map((project, index) => (
                  <div key={`project-${index}`} className="rounded-xl border border-slate-200 p-3">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                        placeholder="Título del proyecto"
                        value={project.title}
                        onChange={(event) =>
                          setForm((prev) => {
                            if (!prev) return prev;
                            const nextProjects = [...prev.projects];
                            nextProjects[index] = { ...nextProjects[index], title: event.target.value };
                            return { ...prev, projects: nextProjects };
                          })
                        }
                      />
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Rol en el proyecto"
                        value={project.projectRole}
                        onChange={(event) =>
                          setForm((prev) => {
                            if (!prev) return prev;
                            const nextProjects = [...prev.projects];
                            nextProjects[index] = { ...nextProjects[index], projectRole: event.target.value };
                            return { ...prev, projects: nextProjects };
                          })
                        }
                      />
                      <input
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        placeholder="URL imagen (opcional)"
                        value={project.imageUrl}
                        onChange={(event) =>
                          setForm((prev) => {
                            if (!prev) return prev;
                            const nextProjects = [...prev.projects];
                            nextProjects[index] = { ...nextProjects[index], imageUrl: event.target.value };
                            return { ...prev, projects: nextProjects };
                          })
                        }
                      />
                      <textarea
                        className="h-20 rounded-xl border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                        placeholder="Descripción"
                        value={project.description}
                        onChange={(event) =>
                          setForm((prev) => {
                            if (!prev) return prev;
                            const nextProjects = [...prev.projects];
                            nextProjects[index] = { ...nextProjects[index], description: event.target.value };
                            return { ...prev, projects: nextProjects };
                          })
                        }
                      />
                    </div>

                    {form.projects.length > 1 && (
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600"
                        onClick={() =>
                          setForm((prev) => {
                            if (!prev) return prev;
                            const nextProjects = prev.projects.filter((_, projectIndex) => projectIndex !== index);
                            return { ...prev, projects: nextProjects.length > 0 ? nextProjects : [{ title: '', description: '', projectRole: '', imageUrl: '' }] };
                          })
                        }
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  onClick={() =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            projects: [...prev.projects, { title: '', description: '', projectRole: '', imageUrl: '' }],
                          }
                        : prev,
                    )
                  }
                >
                  <Plus size={13} />
                  Agregar proyecto
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Link2 size={18} />
              Redes y Contacto
            </h4>

            {!isEditing ? (
              <div className="space-y-2 text-sm text-slate-700">
                <p>{profile.linkedinUrl || 'LinkedIn no configurado'}</p>
                <p>{profile.twitterUrl || 'Twitter no configurado'}</p>
                <p>{profile.websiteUrl || 'Sitio web no configurado'}</p>
                <p className="text-slate-500">{profile.email}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="URL LinkedIn"
                  value={form.linkedinUrl}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, linkedinUrl: event.target.value } : prev))}
                />
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Usuario Twitter/X"
                  value={form.twitterUrl}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, twitterUrl: event.target.value } : prev))}
                />
                <input
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Sitio web"
                  value={form.websiteUrl}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, websiteUrl: event.target.value } : prev))}
                />
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="mb-3 text-lg font-bold text-slate-800">Intereses</h4>

            {!isEditing ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.length > 0 ? (
                  profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Sin intereses registrados.</p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Interés 1, Interés 2, Interés 3"
                  value={form.interestsText}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, interestsText: event.target.value } : prev))}
                />
                <p className="mt-1 text-xs text-slate-500">Separa cada interés con coma.</p>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
