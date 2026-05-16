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
  | 'conexion_nombre';

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

// ─── Dispatch Context (passed to engine) ─────────────────────────────────────

export interface DispatchContext {
  organizationId: string;
  recipientUserId: string;
  recipientEmail: string;
  eventKey: string;
  variables: Partial<Record<VariableKey, string>>;
}
