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
      return 'Advisor';
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

export function deriveUserTypeSelection(
  user: Pick<UserRecord, 'primaryRole' | 'planType' | 'subscriptionPlanId'>,
): UserTypeOption {
  if (user.primaryRole === 'lider') {
    // Un líder tiene suscripción si:
    //  - se le asignó un subscription_plan_id en /administracion/planes, o
    //  - su plan_type legacy es subscribed (premium/vip/empresa_elite),
    //    para no romper líderes históricos sin plan migrado.
    const hasPlan = Boolean(user.subscriptionPlanId);
    return hasPlan || isSubscribedLeaderPlan(user.planType)
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
