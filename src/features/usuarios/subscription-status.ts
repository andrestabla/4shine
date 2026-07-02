/**
 * Estado de vigencia de la suscripción a partir de la fecha de expiración.
 * Compartido por Gestión de Usuarios, exportación y Líderes para mantener
 * consistencia en filtros, columnas y chips.
 */

import { formatDate } from '@/lib/format-date';

export type SubscriptionStatus = 'vigente' | 'por_vencer' | 'vencida' | 'sin_vigencia';

export const EXPIRING_SOON_DAYS = 30;

export interface SubscriptionStatusInfo {
  status: SubscriptionStatus;
  daysUntil: number | null; // días hasta vencer (negativo = vencida); null si sin fecha
  label: string;
  chipClass: string; // clases Tailwind para el chip
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencida: 'Vencida',
  sin_vigencia: 'Sin vigencia',
};

const STATUS_CHIP: Record<SubscriptionStatus, string> = {
  vigente: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  por_vencer: 'border-amber-200 bg-amber-50 text-amber-700',
  vencida: 'border-rose-200 bg-rose-50 text-rose-700',
  sin_vigencia: 'border-slate-200 bg-slate-50 text-slate-500',
};

export function subscriptionStatus(expiresAt: string | null | undefined): SubscriptionStatusInfo {
  if (!expiresAt) {
    return {
      status: 'sin_vigencia',
      daysUntil: null,
      label: STATUS_LABEL.sin_vigencia,
      chipClass: STATUS_CHIP.sin_vigencia,
    };
  }
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) {
    return {
      status: 'sin_vigencia',
      daysUntil: null,
      label: STATUS_LABEL.sin_vigencia,
      chipClass: STATUS_CHIP.sin_vigencia,
    };
  }
  const daysUntil = Math.ceil((expiry - Date.now()) / 86_400_000);
  let status: SubscriptionStatus;
  if (daysUntil < 0) status = 'vencida';
  else if (daysUntil <= EXPIRING_SOON_DAYS) status = 'por_vencer';
  else status = 'vigente';

  return {
    status,
    daysUntil,
    label: STATUS_LABEL[status],
    chipClass: STATUS_CHIP[status],
  };
}

/** Formatea la fecha de vencimiento (es-CO) o '—' si no hay. */
export function formatExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return '—';
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return '—';
  return formatDate(expiresAt);
}
