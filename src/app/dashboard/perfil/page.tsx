'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Edit3,
  KeyRound,
  Link2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { listConnections } from '@/features/networking/client';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PurchasedProductsPanel } from '@/components/dashboard/PurchasedProductsPanel';
import { MySubscriptionSection } from '@/components/dashboard/MySubscriptionSection';
import { DeleteUserReasonModal } from '@/components/dashboard/DeleteUserReasonModal';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import { R2UploadButton } from '@/components/ui/R2UploadButton';
import { useUser } from '@/context/UserContext';
import {
  extractProfileFromCv,
  getMyProfile,
  updateMyProfile,
  type MyProfileRecord,
  type AdvisorPillarCode,
  ADVISER_PRECIO_MIN,
  ADVISER_PRECIO_MAX,
} from '@/features/perfil/client';
import { optimizeAvatarForUpload } from '@/lib/image-processing';
import { YEARS_EXPERIENCE_OPTIONS, yearsToLabel, yearsToKey, keyToStoredValue } from '@/lib/demographics';
import {
  USER_COUNTRY_OPTIONS,
  USER_DEMOGRAPHIC_PLACEHOLDERS,
  USER_GENDER_OPTIONS,
  USER_JOB_ROLE_OPTIONS,
  type UserJobRoleOption,
} from '@/lib/user-demographics';

type PlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
interface ProjectFormItem {
  title: string;
  description: string;
  projectRole: string;
  imageUrl: string;
}

interface AdvisorTopicFormItem {
  topicLabel: string;
  pillarCode: AdvisorPillarCode | '';
}

interface AdvisorFormState {
  experiencia: string;
  precioSesion: string;
  temas: AdvisorTopicFormItem[];
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
  advisor: AdvisorFormState;
}

const ADVISER_PILLAR_OPTIONS: Array<{ value: AdvisorPillarCode; label: string }> = [
  { value: 'shine_within', label: 'Shine Within' },
  { value: 'shine_out', label: 'Shine Out' },
  { value: 'shine_up', label: 'Shine Up' },
  { value: 'shine_beyond', label: 'Shine Beyond' },
];

function buildAdvisorForm(profile: MyProfileRecord): AdvisorFormState {
  const adv = profile.advisorProfile;
  return {
    experiencia: adv?.experiencia ?? '',
    precioSesion: adv?.precioSesion != null ? String(adv.precioSesion) : '',
    temas:
      adv && adv.temas.length > 0
        ? adv.temas.map((topic) => ({ topicLabel: topic.topicLabel, pillarCode: topic.pillarCode }))
        : [{ topicLabel: '', pillarCode: '' }],
  };
}

function roleLabel(role: string | undefined): string {
  switch ((role ?? '').trim().toLowerCase()) {
    case 'lider':
    case 'líder':
      return 'Líder';
    case 'mentor':
    case 'advisor':
      return 'Adviser';
    case 'gestor':
      return 'Gestor';
    case 'admin':
    case 'administrador':
      return 'Administrador';
    case 'invitado':
      return 'Invitado';
    default:
      return 'Usuario';
  }
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
    advisor: buildAdvisorForm(profile),
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
  const [isDeletingSelf, setIsDeletingSelf] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  async function handleConfirmSelfDelete(reason: string | null) {
    setIsDeletingSelf(true);
    try {
      const response = await fetch('/api/v1/me/account', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? body?.detail ?? 'No se pudo eliminar la cuenta.');
      }
      window.location.href = '/acceso?deleted=1';
    } catch (err) {
      await alert({
        title: 'Error al eliminar la cuenta',
        message: err instanceof Error ? err.message : 'No se pudo completar la operación.',
        tone: 'error',
      });
      setIsDeletingSelf(false);
      setShowDeleteModal(false);
    }
  }

  // Cambio de contraseña (autoservicio).
  const [pwd, setPwd] = React.useState({ current: '', next: '', confirm: '' });
  const [isChangingPwd, setIsChangingPwd] = React.useState(false);

  async function handleChangePassword(event: React.FormEvent) {
    event.preventDefault();
    if (pwd.next.length < 8) {
      await alert({
        title: 'Contraseña muy corta',
        message: 'La nueva contraseña debe tener al menos 8 caracteres.',
        tone: 'warning',
      });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      await alert({
        title: 'Las contraseñas no coinciden',
        message: 'La confirmación debe ser igual a la nueva contraseña.',
        tone: 'warning',
      });
      return;
    }
    setIsChangingPwd(true);
    try {
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error ?? data?.detail ?? 'No se pudo cambiar la contraseña.');
      }
      setPwd({ current: '', next: '', confirm: '' });
      await alert({
        title: 'Contraseña actualizada',
        message: 'Tu contraseña se cambió correctamente.',
        tone: 'success',
      });
    } catch (err) {
      await alert({
        title: 'No se pudo cambiar la contraseña',
        message: err instanceof Error ? err.message : 'Inténtalo nuevamente.',
        tone: 'error',
      });
    } finally {
      setIsChangingPwd(false);
    }
  }

  const [profile, setProfile] = React.useState<MyProfileRecord | null>(null);
  const [form, setForm] = React.useState<ProfileFormState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExtractingCv, setIsExtractingCv] = React.useState(false);

  const canEditProfile = can('perfil', 'update');
  const canSeeNetworking = can('networking', 'view');
  const [networkStats, setNetworkStats] = React.useState<{ contacts: number; pending: number } | null>(null);

  React.useEffect(() => {
    if (!canSeeNetworking) return;
    let cancelled = false;
    (async () => {
      try {
        const connections = await listConnections();
        if (cancelled) return;
        const myId = currentUser?.id ?? '';
        const contacts = connections.filter((c) => c.status === 'connected').length;
        const pending = connections.filter((c) => c.status === 'pending' && c.requesterUserId !== myId).length;
        setNetworkStats({ contacts, pending });
      } catch {
        if (!cancelled) setNetworkStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canSeeNetworking, currentUser?.id]);

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
    const missingFields: string[] = [];
    if (!form.country.trim()) missingFields.push('País');
    if (!form.jobRole) missingFields.push('Cargo');
    if (!form.gender.trim()) missingFields.push('Género');
    if (yearsExperience === null) missingFields.push('Años de experiencia');

    if (missingFields.length > 0) {
      await alert({
        title: 'Datos obligatorios',
        message: `Completa estos campos para guardar: ${missingFields.join(', ')}.`,
        tone: 'warning',
      });
      return;
    }

    const isAdvisor = (currentUser?.role ?? '').toLowerCase() === 'mentor';
    let advisorPayload:
      | {
          experiencia: string | null;
          precioSesion: number | null;
          temas: Array<{ topicLabel: string; pillarCode: AdvisorPillarCode }>;
        }
      | undefined;

    if (isAdvisor) {
      const cleanedTopics = form.advisor.temas
        .map((topic) => ({ topicLabel: topic.topicLabel.trim(), pillarCode: topic.pillarCode }))
        .filter((topic) => topic.topicLabel.length > 0);

      const invalidPillar = cleanedTopics.find((topic) => !topic.pillarCode);
      if (invalidPillar) {
        await alert({
          title: 'Tema sin competencia',
          message: `Selecciona la competencia 4shine asociada al tema "${invalidPillar.topicLabel}".`,
          tone: 'warning',
        });
        return;
      }

      const trimmedPrecio = form.advisor.precioSesion.trim();
      let precioSesion: number | null = null;
      if (trimmedPrecio.length > 0) {
        const parsed = Number(trimmedPrecio.replace(/[.,\s]/g, ''));
        if (!Number.isFinite(parsed) || parsed < ADVISER_PRECIO_MIN || parsed > ADVISER_PRECIO_MAX) {
          await alert({
            title: 'Precio inválido',
            message: `El precio de sesión debe estar entre ${ADVISER_PRECIO_MIN.toLocaleString('es-CO')} y ${ADVISER_PRECIO_MAX.toLocaleString('es-CO')} COP.`,
            tone: 'warning',
          });
          return;
        }
        precioSesion = parsed;
      }

      advisorPayload = {
        experiencia: form.advisor.experiencia.trim() ? form.advisor.experiencia.trim() : null,
        precioSesion,
        temas: cleanedTopics as Array<{ topicLabel: string; pillarCode: AdvisorPillarCode }>,
      };
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
        jobRole: form.jobRole || null,
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
        ...(advisorPayload ? { advisorProfile: advisorPayload } : {}),
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
  const isAdvisorRole = (currentUser?.role ?? '').toLowerCase() === 'mentor';
  const advForm = form.advisor;
  const advisorData = profile.advisorProfile;
  const advisorPrecioFormatted =
    advisorData?.precioSesion != null
      ? new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: advisorData.currencyCode || 'COP',
          maximumFractionDigits: 0,
        }).format(advisorData.precioSesion)
      : null;

  return (
    <div className="space-y-5">
      <PageTitle title="Mi Perfil" subtitle="Información profesional, proyectos, redes e intereses." />

      <section className="app-panel p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
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
                    La imagen se recorta y optimiza automáticamente.
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
            <div className="min-w-0">
              <h3 className="break-words text-2xl font-bold text-[var(--app-ink)] md:text-3xl">{profile.displayName}</h3>
              <p className="text-[var(--app-muted)]">
                {profile.profession ?? 'Profesional'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                  style={{ background: 'var(--app-ink)', color: 'white' }}
                >
                  {roleLabel(currentUser?.role)}
                </span>
                {profile.planType && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                    style={{ background: 'var(--brand-accent)', color: 'var(--brand-on-accent)' }}
                  >
                    {planLabel(profile.planType)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {canEditProfile && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
                          const existingProjects = prev.projects.filter((project) => project.title.trim().length > 0);
                          const existingTitles = new Set(existingProjects.map((p) => p.title.trim().toLowerCase()));
                          const extractedProjects = (extracted.projects ?? []).filter(
                            (p) => p.title.trim() && !existingTitles.has(p.title.trim().toLowerCase()),
                          );
                          const hasTemas = prev.advisor.temas.some((tema) => tema.topicLabel.trim().length > 0);
                          const extractedTemas = extracted.advisorTemas ?? [];
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
                            timezone: prev.timezone.trim() ? prev.timezone : extracted.timezone || prev.timezone,
                            projects:
                              extractedProjects.length > 0
                                ? [
                                    ...existingProjects,
                                    ...extractedProjects.map((project) => ({
                                      title: project.title,
                                      description: project.description,
                                      projectRole: project.projectRole,
                                      imageUrl: '',
                                    })),
                                  ]
                                : prev.projects,
                            advisor: {
                              ...prev.advisor,
                              experiencia: prev.advisor.experiencia.trim()
                                ? prev.advisor.experiencia
                                : extracted.advisorExperiencia || prev.advisor.experiencia,
                              temas:
                                !hasTemas && extractedTemas.length > 0
                                  ? extractedTemas.map((tema) => ({
                                      topicLabel: tema.topicLabel,
                                      pillarCode: tema.pillarCode,
                                    }))
                                  : prev.advisor.temas,
                            },
                          };
                        });
                        await alert({
                          title: 'Datos detectados',
                          message:
                            'Se autocompletaron los campos faltantes desde tu CV (perfil, redes, intereses, proyectos y perfil de advisor si aplica). Revisa, ajusta lo necesario y guarda.',
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

            {isEditing && (
              <p className="mb-3 text-xs text-[var(--app-muted)]">
                Los campos con <span className="text-rose-500">*</span> son obligatorios.
              </p>
            )}

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
                  <span className="app-field-label">País <span className="text-rose-500">*</span></span>
                  <select
                    className="app-select"
                    value={form.country}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, country: event.target.value } : prev))}
                    required
                  >
                    <option value="">{USER_DEMOGRAPHIC_PLACEHOLDERS.country}</option>
                    {USER_COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="app-field-label">Cargo <span className="text-rose-500">*</span></span>
                  <select
                    className="app-select"
                    value={form.jobRole}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, jobRole: event.target.value as UserJobRoleOption | '' } : prev))
                    }
                    required
                  >
                    <option value="">{USER_DEMOGRAPHIC_PLACEHOLDERS.jobRole}</option>
                    {USER_JOB_ROLE_OPTIONS.map((jobRole) => (
                      <option key={jobRole} value={jobRole}>
                        {jobRole}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="app-field-label">Género <span className="text-rose-500">*</span></span>
                  <select
                    className="app-select"
                    value={form.gender}
                    onChange={(event) => setForm((prev) => (prev ? { ...prev, gender: event.target.value } : prev))}
                    required
                  >
                    <option value="">{USER_DEMOGRAPHIC_PLACEHOLDERS.gender}</option>
                    {USER_GENDER_OPTIONS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="app-field-label">Años de experiencia <span className="text-rose-500">*</span></span>
                  <select
                    className="app-select"
                    value={form.yearsExperience}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, yearsExperience: event.target.value } : prev))
                    }
                    required
                  >
                    <option value="">{USER_DEMOGRAPHIC_PLACEHOLDERS.yearsExperience}</option>
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

          {isAdvisorRole && (
            <section className="app-panel p-5">
              <h4 className="mb-1 flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
                <Sparkles size={18} />
                Perfil de Advisor
              </h4>
              <p className="mb-4 text-xs text-[var(--app-muted)]">
                Esta información se muestra a los líderes cuando compran mentorías.
              </p>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="app-panel-soft p-3">
                    <p className="text-xs text-[var(--app-muted)]">Experiencia como advisor</p>
                    <p className="mt-1 whitespace-pre-line text-[var(--app-ink)]">
                      {advisorData?.experiencia ?? 'Aún no has registrado tu experiencia como mentor.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="app-panel-soft p-3">
                      <p className="text-xs text-[var(--app-muted)]">Precio sesión de trabajo</p>
                      <p className="font-semibold text-[var(--app-ink)]">
                        {advisorPrecioFormatted ?? 'No definido'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--app-muted)]">
                        Rango permitido: {ADVISER_PRECIO_MIN.toLocaleString('es-CO')} – {ADVISER_PRECIO_MAX.toLocaleString('es-CO')} COP
                      </p>
                    </div>
                    <div className="app-panel-soft p-3">
                      <p className="text-xs text-[var(--app-muted)]">Temas que trabaja</p>
                      {advisorData && advisorData.temas.length > 0 ? (
                        <ul className="mt-1 space-y-1 text-sm text-[var(--app-ink)]">
                          {advisorData.temas.map((topic) => (
                            <li key={topic.topicId} className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">{topic.topicLabel}</span>
                              <span className="rounded-full border border-[var(--app-border)] bg-white px-2 py-0.5 text-[11px] font-semibold text-[var(--app-muted)]">
                                {ADVISER_PILLAR_OPTIONS.find((opt) => opt.value === topic.pillarCode)?.label ?? topic.pillarCode}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-sm text-[var(--app-muted)]">Sin temas registrados.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <span className="app-field-label">Experiencia como advisor (mentor)</span>
                    <textarea
                      className="app-textarea min-h-28"
                      placeholder="Cuéntale a los líderes tu trayectoria como mentor: años, tipos de equipos, sectores, logros más relevantes…"
                      value={advForm.experiencia}
                      onChange={(event) =>
                        setForm((prev) =>
                          prev
                            ? { ...prev, advisor: { ...prev.advisor, experiencia: event.target.value } }
                            : prev,
                        )
                      }
                    />
                  </label>

                  <label className="block max-w-sm">
                    <span className="app-field-label">
                      Precio sesión de trabajo (COP)
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={ADVISER_PRECIO_MIN}
                      max={ADVISER_PRECIO_MAX}
                      step={5000}
                      className="app-input"
                      placeholder="Ej: 250000"
                      value={advForm.precioSesion}
                      onChange={(event) =>
                        setForm((prev) =>
                          prev
                            ? { ...prev, advisor: { ...prev.advisor, precioSesion: event.target.value } }
                            : prev,
                        )
                      }
                    />
                    <p className="mt-1 text-[11px] text-[var(--app-muted)]">
                      Debe estar entre {ADVISER_PRECIO_MIN.toLocaleString('es-CO')} y {ADVISER_PRECIO_MAX.toLocaleString('es-CO')} COP.
                    </p>
                  </label>

                  <div>
                    <span className="app-field-label">Temas que trabaja</span>
                    <p className="mb-2 text-[11px] text-[var(--app-muted)]">
                      Un ítem por tema. Cada tema se asocia a una de las 4 competencias 4shine.
                    </p>
                    <div className="space-y-2">
                      {advForm.temas.map((topic, index) => (
                        <div
                          key={`adv-topic-${index}`}
                          className="grid grid-cols-1 gap-2 rounded-[14px] border border-[var(--app-border)] bg-white p-2 md:grid-cols-[1fr_220px_auto]"
                        >
                          <input
                            className="app-input"
                            placeholder="Tema (ej: Comunicación con equipos remotos)"
                            value={topic.topicLabel}
                            onChange={(event) =>
                              setForm((prev) => {
                                if (!prev) return prev;
                                const next = [...prev.advisor.temas];
                                next[index] = { ...next[index], topicLabel: event.target.value };
                                return { ...prev, advisor: { ...prev.advisor, temas: next } };
                              })
                            }
                          />
                          <select
                            className="app-select"
                            value={topic.pillarCode}
                            onChange={(event) =>
                              setForm((prev) => {
                                if (!prev) return prev;
                                const next = [...prev.advisor.temas];
                                next[index] = {
                                  ...next[index],
                                  pillarCode: event.target.value as AdvisorPillarCode | '',
                                };
                                return { ...prev, advisor: { ...prev.advisor, temas: next } };
                              })
                            }
                          >
                            <option value="">Competencia 4shine…</option>
                            {ADVISER_PILLAR_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1 rounded-[10px] border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            onClick={() =>
                              setForm((prev) => {
                                if (!prev) return prev;
                                const next = prev.advisor.temas.filter((_, i) => i !== index);
                                return {
                                  ...prev,
                                  advisor: {
                                    ...prev.advisor,
                                    temas: next.length > 0 ? next : [{ topicLabel: '', pillarCode: '' }],
                                  },
                                };
                              })
                            }
                            aria-label="Eliminar tema"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="app-button-secondary mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs"
                      onClick={() =>
                        setForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                advisor: {
                                  ...prev.advisor,
                                  temas: [...prev.advisor.temas, { topicLabel: '', pillarCode: '' }],
                                },
                              }
                            : prev,
                        )
                      }
                    >
                      <Plus size={13} />
                      Agregar tema
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          <MySubscriptionSection
            currentPlanId={profile.subscriptionPlanId ?? null}
            expiresAt={profile.subscriptionExpiresAt ?? null}
          />

          {canSeeNetworking && networkStats && (
            <section className="app-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="flex items-center gap-2 text-lg font-bold text-[var(--app-ink)]">
                  <Users size={18} />
                  Networking
                </h4>
                <Link
                  href="/dashboard/networking"
                  className="app-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
                >
                  Ir a Networking
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="app-panel-soft p-4 text-center">
                  <p className="text-2xl font-black text-[var(--app-ink)]">{networkStats.contacts}</p>
                  <p className="text-xs text-[var(--app-muted)]">Contactos</p>
                </div>
                <div className="app-panel-soft p-4 text-center">
                  <p
                    className={`text-2xl font-black ${networkStats.pending > 0 ? 'text-[var(--brand-primary)]' : 'text-[var(--app-ink)]'}`}
                  >
                    {networkStats.pending}
                  </p>
                  <p className="text-xs text-[var(--app-muted)]">Pendientes</p>
                </div>
              </div>
            </section>
          )}

          <PurchasedProductsPanel
            purchases={profile.purchases}
            primaryRole={currentUser?.role ?? 'lider'}
            planType={profile.planType}
            activePlan={
              profile.subscriptionPlanId
                ? {
                    planId: profile.subscriptionPlanId,
                    planCode: profile.subscriptionPlanCode ?? '',
                    planGroup: profile.subscriptionPlanGroup,
                    name: profile.subscriptionPlanName ?? profile.subscriptionPlanCode ?? '',
                    highlightLabel: profile.subscriptionPlanHighlightLabel,
                    priceAmount: profile.subscriptionPlanPriceAmount,
                    currencyCode: profile.subscriptionPlanCurrencyCode,
                    expiresAt: profile.subscriptionExpiresAt,
                  }
                : null
            }
            emptyHint="Aún no has contratado ningún producto. Visita la sección de planes y precios para activar tu acceso."
          />

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
              <div className="space-y-2 break-words text-sm text-[var(--app-ink)]">
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
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        background: 'color-mix(in srgb, var(--brand-accent) 14%, white)',
                        border: '1px solid color-mix(in srgb, var(--brand-accent) 32%, transparent)',
                        color: 'var(--brand-accent-strong)',
                      }}
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

      <section className="mt-10 app-panel p-5 md:p-7">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_14%,white)] p-2 text-[var(--brand-primary)]">
            <KeyRound size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-[var(--app-ink)]">Cambiar contraseña</h4>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--app-muted)]">
              Para mayor seguridad, ingresa tu contraseña actual y define una nueva de al menos 8 caracteres.
            </p>
            <form onSubmit={handleChangePassword} className="mt-4 grid max-w-xl gap-3 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="app-input"
                  value={pwd.current}
                  onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="app-input"
                  value={pwd.next}
                  onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--app-muted)]">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="app-input"
                  value={pwd.confirm}
                  onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isChangingPwd || !pwd.current || !pwd.next || !pwd.confirm}
                  className="app-button-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <KeyRound size={15} />
                  {isChangingPwd ? 'Guardando…' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-rose-200 bg-rose-50/50 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-rose-100 p-2 text-rose-700">
            <Trash2 size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold text-rose-900">Eliminar mi cuenta</h4>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-rose-700">
              Al eliminar tu cuenta se borra de forma permanente toda tu información
              asociada en la plataforma: workbooks y avances, transcripciones, mensajes,
              suscripción, productos contratados, conexiones de networking, sesiones
              de mentoría, postulaciones y cualquier dato vinculado a tu usuario.
              Esta acción no se puede deshacer.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeletingSelf}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={12} />
              {isDeletingSelf ? 'Eliminando…' : 'Eliminar mi cuenta'}
            </button>

            <DeleteUserReasonModal
              mode="self"
              open={showDeleteModal}
              onCancel={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmSelfDelete}
              confirmingBusy={isDeletingSelf}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
