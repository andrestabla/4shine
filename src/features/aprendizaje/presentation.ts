import type { ContentStatus, ContentType } from '@/features/content/client';
import { getPillarLabelFromCode } from '@/features/aprendizaje/competency-map';

export function formatLearningDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';

  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatLearningDateTime(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';

  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function learningRoleLabel(role: string | null | undefined): string {
  if (!role) return 'Usuario';
  if (role === 'mentor') return 'Adviser';
  if (role === 'lider') return 'Líder';
  if (role === 'gestor') return 'Gestor';
  if (role === 'admin') return 'Admin';
  return role;
}

export function learningContentTypeLabel(type: ContentType): string {
  if (type === 'pdf') return 'PDF';
  if (type === 'ppt') return 'PPT';
  if (type === 'scorm') return 'Curso';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function learningStatusLabel(status: ContentStatus): string {
  if (status === 'pending_review') return 'En revisión';
  if (status === 'published') return 'Publicado';
  if (status === 'archived') return 'Archivado';
  if (status === 'rejected') return 'Rechazado';
  return 'Borrador';
}

export function learningStatusClasses(status: ContentStatus): string {
  if (status === 'published') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  if (status === 'pending_review') {
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
  if (status === 'archived') {
    return 'border border-[var(--app-border)] bg-white/70 text-[var(--app-muted)]';
  }
  if (status === 'rejected') {
    return 'bg-rose-50 text-rose-700 border border-rose-200';
  }
  return 'bg-sky-50 text-sky-700 border border-sky-200';
}

export function learningPillarLabel(value: string | null | undefined): string {
  return getPillarLabelFromCode(value);
}
