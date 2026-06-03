// ─── In-App Notification types (existing app_core.notifications) ─────────────

export type NotificationInAppType = 'message' | 'alert' | 'success' | 'info';

export interface UserNotificationRecord {
  notificationId: string;
  userId: string;
  notificationType: NotificationInAppType;
  title: string;
  message: string;
  payload: Record<string, unknown>;
  eventKey: string | null;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

// ─── Template Types ───────────────────────────────────────────────────────────

export type NotificationChannel = 'email' | 'in_app';

export interface NotificationTemplateRecord {
  templateId: string;
  organizationId: string;
  name: string;
  description: string;
  eventKey: string;
  moduleCode: string;

  channelEmail: boolean;
  channelInApp: boolean;

  subjectTemplate: string;
  bodyHtmlTemplate: string;
  bodyTextTemplate: string;

  inAppTitleTemplate: string;
  inAppBodyTemplate: string;
  inAppType: NotificationInAppType;
  inAppActionUrlTemplate: string;

  isActive: boolean;
  isSystem: boolean;

  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  eventKey: string;
  moduleCode: string;
  channelEmail?: boolean;
  channelInApp?: boolean;
  subjectTemplate?: string;
  bodyHtmlTemplate?: string;
  bodyTextTemplate?: string;
  inAppTitleTemplate?: string;
  inAppBodyTemplate?: string;
  inAppType?: NotificationInAppType;
  inAppActionUrlTemplate?: string;
  isActive?: boolean;
}

export type UpdateTemplateInput = Partial<Omit<CreateTemplateInput, 'eventKey' | 'moduleCode'>>;

// ─── Event Config Types ───────────────────────────────────────────────────────

export interface NotificationEventConfigRecord {
  configId: string;
  organizationId: string;
  eventKey: string;
  moduleCode: string;
  templateId: string | null;
  channelEmail: boolean;
  channelInApp: boolean;
  isEnabled: boolean;
  updatedAt: string;
}

export interface UpdateEventConfigInput {
  templateId?: string | null;
  channelEmail?: boolean;
  channelInApp?: boolean;
  isEnabled?: boolean;
}

// ─── Event Catalog (static definitions) ──────────────────────────────────────

export type VariableKey =
  | 'nombre'
  | 'nombre_completo'
  | 'plataforma'
  | 'enlace_plataforma'
  | 'titulo'
  | 'fecha'
  | 'hora'
  | 'descripcion'
  | 'adviser_nombre'
  | 'lider_nombre'
  | 'remitente_nombre'
  | 'enlace_sesion'
  | 'enlace_gcal'
  | 'enlace_reset'
  | 'motivo'
  | 'nueva_fecha'
  | 'fecha_cierre'
  | 'categoria'
  | 'grupo'
  | 'solicitante_nombre'
  | 'conexion_nombre'
  | 'codigo_acceso'
  | 'enlace_invitacion'
  | 'tipo_convocatoria'
  | 'objetivo'
  | 'correo'
  | 'contrasena';

export interface VariableDef {
  key: VariableKey;
  label: string;
  description: string;
  example: string;
}

export interface NotificationEventDef {
  key: string;
  moduleCode: string;
  moduleLabel: string;
  label: string;
  description: string;
  variables: VariableKey[];
  defaultInAppType: NotificationInAppType;
}

// ─── Global Settings ─────────────────────────────────────────────────────────

export interface NotificationGlobalSettings {
  varPlatformName: string;
  varPlatformUrl: string;
  emailHeaderBg: string;
  emailFooterTagline: string;
  emailFooterSupport: string;
  emailFooterLegal: string;
}

// ─── Dispatch Context (passed to engine) ─────────────────────────────────────

export interface DispatchContext {
  organizationId: string;
  recipientUserId: string;
  recipientEmail: string;
  eventKey: string;
  variables: Partial<Record<VariableKey, string>>;
  /** Si está presente y la inserción in-app crea una fila, queda registrado
   *  como sender_user_id. Si NULL, queda como envío automático/sistema. */
  senderUserId?: string | null;
  /** Agrupa varias notificaciones de un mismo envío masivo. */
  batchId?: string | null;
}

// ─── Bulk send (admin/gestor → muchos usuarios) ──────────────────────────────

export type BulkAudiencePlanType = 'standard' | 'premium' | 'vip' | 'empresa_elite';
export type BulkAudienceRole = 'lider' | 'mentor' | 'gestor' | 'admin' | 'invitado';
export type BulkAudienceUserType =
  | 'leader_without_subscription'
  | 'leader_with_subscription'
  | 'mentor'
  | 'gestor'
  | 'admin'
  | 'invited';

export interface BulkAudienceFilter {
  /** Tipos de usuario derivados de role+planType (mismas opciones que /dashboard/usuarios). */
  userTypes?: BulkAudienceUserType[];
  /** Plan específico (cuando aplique). */
  planTypes?: BulkAudiencePlanType[];
  /** Días desde el inicio de la suscripción: rango. */
  daysSinceSubscriptionStartMin?: number;
  daysSinceSubscriptionStartMax?: number;
  /** Días que faltan para que caduque la suscripción. Valores negativos = vencidos. */
  daysUntilExpirationMin?: number;
  daysUntilExpirationMax?: number;
  /** Filtros opcionales adicionales. */
  countries?: string[];
  isActive?: boolean;
  hasAcceptedPolicy?: boolean;
  /** Cuando true, solo usuarios con email válido (necesario para canal email). */
  requireEmail?: boolean;
}

export interface BulkRecipientRecord {
  userId: string;
  email: string | null;
  displayName: string;
  primaryRole: BulkAudienceRole;
  userType: BulkAudienceUserType;
  planType: BulkAudiencePlanType | null;
  daysUntilExpiration: number | null;
  daysSinceSubscriptionStart: number | null;
}

export interface BulkAudiencePreview {
  totalMatching: number;
  withEmail: number;
  withoutEmail: number;
  sample: BulkRecipientRecord[];
}

export interface ExternalRecipient {
  email: string;
  name?: string;
}

export interface BulkSendInput {
  /** Lista explícita de userIds de la plataforma (los que estén marcados). */
  recipientUserIds?: string[];
  /** Lista de emails externos (sin cuenta) a los que también enviar. */
  externalRecipients?: ExternalRecipient[];
  /** @deprecated Solo si se desea enviar a TODA la audiencia del filtro sin
   *  pasar antes por marcado/desmarcado manual. Si se proporciona, se ignoran
   *  recipientUserIds. Mantener por compatibilidad / API casos puntuales. */
  filter?: BulkAudienceFilter;
  channels: NotificationChannel[];
  /** Cuando se usa una plantilla. */
  templateId?: string | null;
  /** Variables manuales a inyectar (se mezclan con las globales). */
  variables?: Record<string, string>;
  /** Cuando se redacta a mano (sin plantilla). */
  custom?: {
    subject: string;
    bodyHtml: string;
    bodyText: string;
    inAppTitle: string;
    inAppBody: string;
    inAppType?: NotificationInAppType;
    inAppActionUrl?: string;
  };
}

export interface AudiencePage {
  rows: BulkRecipientRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserSearchResult {
  userId: string;
  email: string | null;
  displayName: string;
  primaryRole: BulkAudienceRole;
  userType: BulkAudienceUserType;
}

export interface BulkSendResult {
  batchId: string;
  totalRecipients: number;
  inAppCreated: number;
  emailsQueued: number;
  emailsFailed: number;
  errors: Array<{ userId: string; error: string }>;
}

// ─── History ─────────────────────────────────────────────────────────────────

export type NotificationDeliveryStatus =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'bounced'
  | 'complaint'
  | 'failed';

export interface NotificationHistoryRow {
  notificationId: string;
  batchId: string | null;
  channel: NotificationChannel;
  eventKey: string | null;
  title: string;
  message: string;
  bodyHtmlSnapshot: string | null;
  bodyTextSnapshot: string | null;
  inAppType: NotificationInAppType | null;
  actionUrl: string | null;

  senderUserId: string | null;
  senderName: string | null;
  recipientUserId: string | null;
  recipientName: string;
  recipientEmail: string | null;

  createdAt: string;
  deliveredAt: string | null;
  openedAt: string | null;
  bouncedAt: string | null;
  complaintAt: string | null;
  failedAt: string | null;
  failureReason: string | null;

  status: NotificationDeliveryStatus;
}

export interface NotificationHistoryFilter {
  channel?: NotificationChannel;
  source?: 'manual' | 'automatic' | 'all';
  status?: NotificationDeliveryStatus;
  recipientSearch?: string;
  senderUserId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationHistoryPage {
  rows: NotificationHistoryRow[];
  total: number;
  limit: number;
  offset: number;
}
