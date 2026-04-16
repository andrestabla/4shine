import type { AppRole, UserRecord } from '@/features/usuarios/client';

type PlanType = UserRecord['planType'];

export type UserTypeOption =
  | 'leader_without_subscription'
  | 'leader_with_subscription'
  | 'mentor'
  | 'gestor'
  | 'admin'
  | 'invited';

export const USER_TYPE_OPTIONS: UserTypeOption[] = [
  'leader_without_subscription',
  'leader_with_subscription',
  'mentor',
  'gestor',
  'admin',
  'invited',
];

function isSubscribedLeaderPlan(planType: PlanType): boolean {
  return planType === 'premium' || planType === 'vip' || planType === 'empresa_elite';
}

export function userTypeLabel(option: UserTypeOption): string {
  switch (option) {
    case 'leader_with_subscription':
      return 'Líder con suscripción';
    case 'leader_without_subscription':
      return 'Líder sin suscripción';
    case 'mentor':
      return 'iShine';
    case 'gestor':
      return 'Gestor';
    case 'admin':
      return 'Administrador';
    case 'invited':
      return 'Invitado (solo descubrimiento)';
    default:
      return 'Líder sin suscripción';
  }
}

export function resolveUserTypeSelection(option: UserTypeOption): {
  primaryRole: AppRole;
  planType: PlanType;
} {
  switch (option) {
    case 'leader_with_subscription':
      return { primaryRole: 'lider', planType: 'premium' };
    case 'leader_without_subscription':
      return { primaryRole: 'lider', planType: 'standard' };
    case 'mentor':
      return { primaryRole: 'mentor', planType: null };
    case 'gestor':
      return { primaryRole: 'gestor', planType: null };
    case 'admin':
      return { primaryRole: 'admin', planType: null };
    case 'invited':
      return { primaryRole: 'invitado', planType: null };
    default:
      return { primaryRole: 'lider', planType: 'standard' };
  }
}

export function deriveUserTypeSelection(user: Pick<UserRecord, 'primaryRole' | 'planType'>): UserTypeOption {
  if (user.primaryRole === 'lider') {
    return isSubscribedLeaderPlan(user.planType)
      ? 'leader_with_subscription'
      : 'leader_without_subscription';
  }

  if (user.primaryRole === 'mentor') {
    return 'mentor';
  }

  if (user.primaryRole === 'gestor') {
    return 'gestor';
  }

  if (user.primaryRole === 'invitado') {
    return 'invited';
  }

  return 'admin';
}
