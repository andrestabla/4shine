/** Tipos compartidos (servidor + cliente) de la integración GoHighLevel. */

export const GHL_EVENT_TYPES = [
  'purchase_completed',
  'subscription_renewed',
  'subscription_cancelled',
  'payment_failed',
  'refund_issued',
] as const;

export type GhlEventType = (typeof GHL_EVENT_TYPES)[number];

/** Resultado del procesamiento; se persiste en ghl_webhook_events.status. */
export type GhlEventStatus =
  | 'created'
  | 'updated'
  | 'renewed'
  | 'cancel_scheduled'
  | 'suspended'
  | 'access_revoked'
  | 'duplicate_ignored'
  | 'unknown_program'
  | 'invalid_signature'
  | 'invalid_payload'
  | 'error';

/** Estados que representan un fallo y disparan la notificación al admin. */
export const GHL_FAILURE_STATUSES: GhlEventStatus[] = [
  'unknown_program',
  'invalid_signature',
  'invalid_payload',
  'error',
];

export interface GhlWebhookEventRecord {
  eventId: string;
  transactionId: string;
  eventType: string;
  programId: string | null;
  productName: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  mode: string | null;
  signatureOk: boolean;
  status: GhlEventStatus;
  resultMessage: string | null;
  userId: string | null;
  userDisplayName: string | null;
  planId: string | null;
  planName: string | null;
  expiresAt: string | null;
  payload: unknown;
  receivedAt: string;
  processedAt: string | null;
}

export interface GhlProgramMapRecord {
  programId: string;
  label: string;
  kind: 'plan' | 'diagnostico';
  planId: string | null;
  planName: string | null;
  durationDays: number | null;
  roleOverride: string | null;
  planType: string | null;
  priceUsd: number | null;
  isActive: boolean;
  updatedAt: string;
}

export interface GhlDashboardStats {
  total: number;
  last24h: number;
  provisioned: number;
  failures: number;
  unmappedPrograms: number;
}

export interface GhlDashboardData {
  events: GhlWebhookEventRecord[];
  programs: GhlProgramMapRecord[];
  stats: GhlDashboardStats;
  /** true si la integración está habilitada y con secreto configurado. */
  configured: boolean;
  webhookUrl: string;
}

export interface UpdateGhlProgramInput {
  programId: string;
  planId?: string | null;
  durationDays?: number | null;
  roleOverride?: string | null;
  planType?: string | null;
  isActive?: boolean;
}
