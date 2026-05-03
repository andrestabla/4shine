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
import { extractProfileFromCv, getMyProfile, updateMyProfile, type MyProfileRecord } from '@/features/perfil/client';
import { optimizeAvatarForUpload } from '@/lib/image-processing';
import { YEARS_EXPERIENCE_OPTIONS, yearsToLabel, yearsToKey, keyToStoredValue } from '@/lib/demographics';
import { USER_COUNTRY_OPTIONS, USER_GENDER_OPTIONS, USER_JOB_ROLE_OPTIONS, type UserJobRoleOption } from '@/lib/user-demographics';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
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
  country: string;
  jobRole: UserJobRoleOption | '';
  gender: string;
  yearsExperience: string;
  bio: string;
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
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

function userTypeLabel(role: string | undefined): string {
  const normalized = (role ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'líder':
    case 'lider':
      return 'Líder con suscripción';
    case 'adviser':
    case 'mentor':
      return 'Adviser';
    case 'gestor del programa':
    case 'gestor':
      return 'Gestor';
    case 'administrador':
    case 'admin':
      return 'Administrador';
    case 'invitado':
      return 'Invitado';
    default:
      return role?.trim() || 'Líder sin suscripción';
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
    country: profile.country ?? '',
    jobRole: profile.jobRole ?? '',
    gender: profile.gender ?? '',
    yearsExperience: yearsToKey(profile.yearsExperience),
    bio: profile.bio ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    twitterUrl: profile.twitterUrl ?? '',
    websiteUrl: profile.websiteUrl ?? '',
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
  const [isExtractingCv, setIsExtractingCv] = React.useState(false);

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
    const yearsExperience = keyToStoredValue(form.yearsExperience);
    if (!form.country.trim() || !form.jobRole || !form.gender.trim() || yearsExperience === null) {
      await alert({
        title: 'Datos obligatorios',
        message: 'País, cargo, género y años de experiencia son obligatorios.',
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
        country: form.country.trim(),
        jobRole: form.jobRole,
        gender: form.gender,
        yearsExperience,
        bio: form.bio,
        linkedinUrl: form.linkedinUrl,
        twitterUrl: form.twitterUrl,
        websiteUrl: form.websiteUrl,
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
    return <div className="app-panel px-4 py-5 text-sm text-[var(--app-muted)]">Cargando perfil...</div>;
  }

  const avatarFallback = (profile.avatarInitial || profile.displayName.charAt(0) || 'U').toUpperCase();
  const avatarPreviewUrl = form.avatarUrl.trim().length > 0 ? form.avatarUrl.trim() : null;
  const userType = userTypeLabel(currentUser?.role);

  return (
    <div className="space-y-5">
      <PageTitle title="Mi Perfil" subtitle="Información profesional, proyectos, redes e intereses." />

      <section className="app-panel p-5 md:p-7">
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
                    className="app-button-secondary inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs"
                    preprocessFile={(file) =>
                      optimizeAvatarForUpload(file, {
                        targetSize: 512,
                        mimeType: 'image/jpeg',
                        quality: 0.86,
                      })
                    }
                    onUploaded={async (url) => {
                      setForm((prev) => (prev ? { ...prev, avatarUrl: url } : prev));
                    }}
                  />
                  <p className="text-[11px] text-[var(--app-muted)]">
                    Recorte automático cuadrado + optimización 512x512 antes de subir a R2.
                  </p>
                  {form.avatarUrl && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
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
              <h3 className="text-3xl font-bold text-[var(--app-ink)]">{profile.displayName}</h3>
              <p className="text-[var(--app-muted)]">
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
                  className="app-button-secondary"
                >
                  <Edit3 size={15} />
                  Editar Perfil
                </button>
              ) : (
                <>
                  <R2UploadButton
                    moduleCode="perfil"
                    action="update"
                    accept=".doc,.docx,.txt,.pdf"
                    pathPrefix={`profiles/${profile.userId}/cv`}
                    entityTable="app_core.user_profiles"
                    fieldName="cv_url"
                    buttonLabel={isExtractingCv ? 'Extrayendo...' : 'Extraer desde CV'}
                    className="app-button-secondary disabled:opacity-60"
                    disabled={isSaving || isExtractingCv}
                    onUploaded={async (url) => {
                      try {
                        setIsExtractingCv(true);
                        const extracted = await extractProfileFromCv(url);
                        setForm((prev) => {
                          if (!prev) return prev;
                          const firstName = extracted.firstName?.trim() || '';
                          const lastName = extracted.lastName?.trim() || '';
                          const nextDisplayName =
                            [firstName, lastName].filter(Boolean).join(' ').trim() || prev.displayName;
                          return {
                            ...prev,
                            displayName: prev.displayName.trim() ? prev.displayName : nextDisplayName,
                            profession: prev.profession.trim() ? prev.profession : extracted.profession || prev.profession,
                            industry: prev.industry.trim() ? prev.industry : extracted.industry || prev.industry,
                            location: prev.location.trim() ? prev.location : extracted.location || prev.location,
                            bio: prev.bio.trim() ? prev.bio : extracted.bio || prev.bio,
                            linkedinUrl: prev.linkedinUrl.trim() ? prev.linkedinUrl : extracted.linkedinUrl || prev.linkedinUrl,
                            twitterUrl: prev.twitterUrl.trim() ? prev.twitterUrl : extracted.twitterUrl || prev.twitterUrl,
                            websiteUrl: prev.websiteUrl.trim() ? prev.websiteUrl : extracted.websiteUrl || prev.websiteUrl,
                            interestsText:
                              prev.interestsText.trim().length > 0
                                ? prev.interestsText
                                : (extracted.interests ?? []).join(', ') || prev.interestsText,
                            country: prev.country || extracted.country || prev.country,
                            jobRole: (prev.jobRole || extracted.jobRole || prev.jobRole) as UserJobRoleOption | '',
                            gender: prev.gender || extracted.gender || prev.gender,
                            yearsExperience:
                              extracted.yearsExperience === null
                                ? prev.yearsExperience
                                : yearsToKey(extracted.yearsExperience),
                          };
                        });
                        await alert({
                          title: 'Datos detectados',
                          message: 'Se autocompletaron campos faltantes desde tu CV. Revisa y guarda.',
                          tone: 'success',
                        });
                      } catch (error) {
                        await alert({
                          title: 'No se pudo extraer',
                          message: error instanceof Error ? error.message : 'Completa los campos manualmente.',
                          tone: 'warning',
                        });
                      } finally {
                        setIsExtractingCv(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    disabled={isSaving || isExtractingCv}
                    className="app-button-secondary disabled:opacity-60"
                  >
                    <X size={15} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSaveProfile()}
                    disabled={isSaving || isExtractingCv}
                    className="app-button-primary disabled:opacity-60"
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
          <section className="app-panel p-5">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
              <UserCircle2 size={18} />
              Acerca de mí
            </h4>

            {!isEditing ? (
              <>
                <p className="rounded-[1rem] bg-[var(--app-surface-muted)] p-4 text-[var(--app-ink)]/84">{profile.bio ?? 'Sin biografía registrada.'}</p>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">Profesión</p>
                    <p className="font-semibold text-[var(--app-ink)]">{profile.profession ?? 'No registrada'}</p>
                  </div>
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">Industria</p>
                    <p className="font-semibold text-[var(--app-ink)]">{profile.industry ?? 'No registrada'}</p>
                  </div>
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">Ubicación</p>
                    <p className="font-semibold text-[var(--app-ink)]">{profile.location ?? 'No registrada'}</p>
                  </div>
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">País</p>
                    <p className="font-semibold text-[var(--app-ink)]">{profile.country ?? 'No registrado'}</p>
                  </div>
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">Cargo</p>
                    <p className="font-semibold text-[var(--app-ink)]">{profile.jobRole ?? 'No registrado'}</p>
                  </div>
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">Género</p>
                    <p className="font-semibold text-[var(--app-ink)]">{profile.gender ?? 'No registrado'}</p>
                  </div>
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">Años de Experiencia</p>
                    <p className="font-semibold text-[var(--app-ink)]">{yearsToLabel(profile.yearsExperience)}</p>
                  </div>
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">Zona horaria</p>
                    <p className="font-semibold text-[var(--app-ink)]">{profile.timezone}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="app-field-label">Nombre visible</span>
                  <input
                    className="app-input"
                    value={form.displayName}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, displayName: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="app-field-label">Profesión</span>
                  <input
                    className="app-input"
                    value={form.profession}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, profession: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="app-field-label">Industria</span>
                  <input
                    className="app-input"
                    value={form.industry}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, industry: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="app-field-label">Ubicación</span>
                  <input
                    className="app-input"
                    value={form.location}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, location: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="app-field-label">País</span>
                  <select
                    className="app-select"
                    value={form.country}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, country: event.target.value } : prev))}
                    required
                  >
                    <option value="">Seleccionar país</option>
                    {USER_COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="app-field-label">Cargo</span>
                  <select
                    className="app-select"
                    value={form.jobRole}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, jobRole: event.target.value as UserJobRoleOption | '' } : prev))
                    }
                    required
                  >
                    <option value="">Sin definir</option>
                    {USER_JOB_ROLE_OPTIONS.map((jobRole) => (
                      <option key={jobRole} value={jobRole}>
                        {jobRole}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="app-field-label">Género</span>
                  <select
                    className="app-select"
                    value={form.gender}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, gender: event.target.value } : prev))}
                    required
                  >
                    <option value="">Género</option>
                    {USER_GENDER_OPTIONS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="app-field-label">Años de experiencia</span>
                  <select
                    className="app-select"
                    value={form.yearsExperience}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, yearsExperience: event.target.value } : prev))
                    }
                    required
                  >
                    <option value="">Seleccionar rango</option>
                    {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="app-field-label">Zona horaria</span>
                  <input
                    className="app-input"
                    value={form.timezone}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, timezone: event.target.value } : prev))}
                  />
                </label>
                <label>
                  <span className="app-field-label">Tipo de usuario</span>
                  <input className="app-input" value={userType} disabled readOnly />
                </label>
                <label>
                  <span className="app-field-label">Plan asignado</span>
                  <input className="app-input" value={planLabel(profile.planType)} disabled readOnly />
                </label>
                <label className="md:col-span-2">
                  <span className="app-field-label">Biografía</span>
                  <textarea
                    className="app-textarea min-h-28"
                    value={form.bio}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, bio: event.target.value } : prev))}
                  />
                </label>
              </div>
            )}
          </section>

          <section className="app-panel p-5">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
              <Briefcase size={18} />
              Proyectos Destacados
            </h4>

            {!isEditing ? (
              <div className="space-y-3">
                {profile.projects.length === 0 ? (
                  <EmptyState message="No hay proyectos destacados." />
                ) : (
                  profile.projects.map((project) => (
                    <article key={project.projectId} className="app-list-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h5 className="font-semibold text-[var(--app-ink)]">{project.title}</h5>
                        {project.projectRole && (
                          <span className="app-badge app-badge-muted">
                            {project.projectRole}
                          </span>
                        )}
                      </div>
                      {project.description && <p className="mt-2 text-sm text-[var(--app-muted)]">{project.description}</p>}
                    </article>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {form.projects.map((project, index) => (
                  <div key={`project-${index}`} className="app-list-card p-3">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className="app-input md:col-span-2"
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
                        className="app-input"
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
                        className="app-input"
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
                        className="app-textarea min-h-20 md:col-span-2"
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
                  className="app-button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
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
          <section className="app-panel p-5">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
              <Link2 size={18} />
              Redes y Contacto
            </h4>

            {!isEditing ? (
              <div className="space-y-2 text-sm text-[var(--app-ink)]">
                <p>{profile.linkedinUrl || 'LinkedIn no configurado'}</p>
                <p>{profile.twitterUrl || 'Twitter no configurado'}</p>
                <p>{profile.websiteUrl || 'Sitio web no configurado'}</p>
                <p className="text-[var(--app-muted)]">{profile.email}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  className="app-input"
                  placeholder="URL LinkedIn"
                  value={form.linkedinUrl}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, linkedinUrl: event.target.value } : prev))}
                />
                <input
                  className="app-input"
                  placeholder="Usuario Twitter/X"
                  value={form.twitterUrl}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, twitterUrl: event.target.value } : prev))}
                />
                <input
                  className="app-input"
                  placeholder="Sitio web"
                  value={form.websiteUrl}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, websiteUrl: event.target.value } : prev))}
                />
              </div>
            )}
          </section>

          <section className="app-panel p-5">
            <h4 className="mb-3 text-lg font-bold text-[var(--app-ink)]">Intereses</h4>

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
                  <p className="text-sm text-[var(--app-muted)]">Sin intereses registrados.</p>
                )}
              </div>
            ) : (
              <>
                <textarea
                  className="app-textarea min-h-24"
                  placeholder="Interés 1, Interés 2, Interés 3"
                  value={form.interestsText}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, interestsText: event.target.value } : prev))}
                />
                <p className="mt-1 text-xs text-[var(--app-muted)]">Separa cada interés con coma.</p>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
