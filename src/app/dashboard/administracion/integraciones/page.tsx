'use client';

import React from 'react';
import { CheckCircle2, Mail, PlugZap, Wrench } from 'lucide-react';
import { PageTitle } from '@/components/dashboard/PageTitle';
import { useAppDialog } from '@/components/ui/AppDialogProvider';
import {
  getIntegrationsSettings,
  queueOutboundEmailTest,
  updateIntegrationsSettings,
  type IntegrationConfigRecord,
  type IntegrationKey,
  type OutboundEmailConfig,
  type OutboundEmailProvider,
} from '@/features/administracion/client';
import {
  DEFAULT_OUTBOUND_EMAIL_CONFIG,
  INTEGRATION_CATALOG,
  hasText,
  requiredOutboundMissing,
} from '@/features/administracion/types';

type WizardFieldType = 'text' | 'password' | 'url' | 'number' | 'textarea' | 'select';

interface WizardOption {
  value: string;
  label: string;
}

interface WizardFieldDefinition {
  key: string;
  label: string;
  type: WizardFieldType;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  defaultValue?: string;
  options?: WizardOption[];
}

interface WizardStepDefinition {
  id: string;
  title: string;
  description: string;
  fields: WizardFieldDefinition[];
}

interface AssistantDefinition {
  intro: string;
  steps: WizardStepDefinition[];
  primarySecretField?: string;
}

const DEFAULT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.4shine.co';

const DEFAULT_INTEGRATIONS: IntegrationConfigRecord[] = INTEGRATION_CATALOG.map((integration) => ({
  integrationId: null,
  key: integration.key,
  label: integration.label,
  provider: integration.provider,
  enabled: false,
  value: '',
  wizardData: {},
  lastConfiguredAt: null,
  createdAt: null,
  updatedAt: null,
}));

const INTEGRATION_ASSISTANTS: Record<IntegrationKey, AssistantDefinition> = {
  google_meet: {
    intro: 'Configura autenticación OAuth, políticas de reunión y seguridad para sesiones de mentoría.',
    primarySecretField: 'clientSecret',
    steps: [
      {
        id: 'oauth',
        title: 'Credenciales OAuth',
        description: 'Usa credenciales de Google Workspace con permisos para crear reuniones.',
        fields: [
          { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'xxxx.apps.googleusercontent.com' },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: '••••••••••••' },
          {
            key: 'redirectUri',
            label: 'Redirect URI',
            type: 'url',
            required: true,
            placeholder: `${DEFAULT_PUBLIC_APP_URL}/api/v1/integrations/google/callback`,
            defaultValue: `${DEFAULT_PUBLIC_APP_URL}/api/v1/integrations/google/callback`,
          },
        ],
      },
      {
        id: 'policy',
        title: 'Políticas de reunión',
        description: 'Define reglas de creación para sesiones en la plataforma.',
        fields: [
          { key: 'workspaceDomain', label: 'Dominio corporativo', type: 'text', required: true, placeholder: '4shine.co' },
          {
            key: 'meetingType',
            label: 'Tipo por defecto',
            type: 'select',
            required: true,
            defaultValue: 'scheduled',
            options: [
              { value: 'scheduled', label: 'Programada' },
              { value: 'instant', label: 'Instantánea' },
            ],
          },
          { key: 'defaultDurationMinutes', label: 'Duración por defecto (min)', type: 'number', required: true, defaultValue: '60' },
        ],
      },
      {
        id: 'governance',
        title: 'Gobernanza y seguridad',
        description: 'Establece scopes y fallback operativo.',
        fields: [
          { key: 'scopes', label: 'Scopes OAuth', type: 'textarea', required: true, defaultValue: 'https://www.googleapis.com/auth/calendar.events\nhttps://www.googleapis.com/auth/calendar.readonly' },
          { key: 'fallbackOrganizerEmail', label: 'Email organizador fallback', type: 'text', placeholder: 'ops@4shine.co' },
        ],
      },
    ],
  },
  google_calendar: {
    intro: 'Conecta calendario institucional para agenda de mentorías, workshops y recordatorios.',
    primarySecretField: 'clientSecret',
    steps: [
      {
        id: 'oauth',
        title: 'Autenticación',
        description: 'Configura OAuth o cuenta de servicio para el calendario principal.',
        fields: [
          { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'xxxx.apps.googleusercontent.com' },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: '••••••••••••' },
          { key: 'serviceAccountEmail', label: 'Service Account (opcional)', type: 'text', placeholder: 'scheduler@project.iam.gserviceaccount.com' },
        ],
      },
      {
        id: 'calendar',
        title: 'Parámetros de calendario',
        description: 'Selecciona el calendario por defecto y reglas horarias.',
        fields: [
          { key: 'calendarId', label: 'Calendar ID', type: 'text', required: true, placeholder: 'primary o id@group.calendar.google.com' },
          { key: 'timezone', label: 'Zona horaria', type: 'text', required: true, defaultValue: 'America/Bogota' },
          { key: 'syncWindowDays', label: 'Ventana de sync (días)', type: 'number', defaultValue: '30' },
        ],
      },
      {
        id: 'notifications',
        title: 'Notificaciones',
        description: 'Ajusta recordatorios y scopes mínimos requeridos.',
        fields: [
          { key: 'defaultReminderMinutes', label: 'Recordatorio por defecto (min)', type: 'number', defaultValue: '30' },
          { key: 'scopes', label: 'Scopes OAuth', type: 'textarea', required: true, defaultValue: 'https://www.googleapis.com/auth/calendar\nhttps://www.googleapis.com/auth/calendar.events' },
        ],
      },
    ],
  },
  r2: {
    intro: 'Configura almacenamiento de objetos para contenido, adjuntos y evidencias del programa.',
    primarySecretField: 'secretAccessKey',
    steps: [
      {
        id: 'credentials',
        title: 'Credenciales Cloudflare',
        description: 'Conecta acceso programático de R2.',
        fields: [
          { key: 'accountId', label: 'Account ID', type: 'text', required: true, placeholder: 'xxxxxxxxxxxxxxxx' },
          { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true, placeholder: 'R2XXXXXXXXXXXXX' },
          { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true, placeholder: '••••••••••••' },
        ],
      },
      {
        id: 'bucket',
        title: 'Bucket y endpoint',
        description: 'Define bucket principal y endpoint S3 compatible.',
        fields: [
          { key: 'bucketName', label: 'Bucket principal', type: 'text', required: true, placeholder: '4shine-assets' },
          { key: 'endpoint', label: 'Endpoint S3', type: 'url', required: true, placeholder: 'https://<accountid>.r2.cloudflarestorage.com' },
          { key: 'region', label: 'Región', type: 'text', defaultValue: 'auto' },
        ],
      },
      {
        id: 'policies',
        title: 'Políticas de archivos',
        description: 'Reglas por defecto para seguridad y lifecycle.',
        fields: [
          { key: 'maxFileSizeMb', label: 'Tamaño máximo por archivo (MB)', type: 'number', defaultValue: '250' },
          { key: 'defaultRetentionDays', label: 'Retención por defecto (días)', type: 'number', defaultValue: '365' },
          { key: 'allowedMimeTypes', label: 'MIME permitidos', type: 'textarea', defaultValue: 'application/pdf\nvideo/mp4\napplication/zip' },
        ],
      },
    ],
  },
  gemini: {
    intro: 'Habilita capacidades de IA para coaching, resumen de sesiones y sugerencias de contenido.',
    primarySecretField: 'apiKey',
    steps: [
      {
        id: 'auth',
        title: 'Autenticación',
        description: 'Registra API key y endpoint del proveedor.',
        fields: [
          { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'AIza...' },
          { key: 'apiBaseUrl', label: 'API Base URL', type: 'url', defaultValue: 'https://generativelanguage.googleapis.com/v1beta' },
          {
            key: 'model',
            label: 'Modelo por defecto',
            type: 'select',
            required: true,
            defaultValue: 'gemini-1.5-pro',
            options: [
              { value: 'gemini-1.5-pro', label: 'gemini-1.5-pro' },
              { value: 'gemini-1.5-flash', label: 'gemini-1.5-flash' },
              { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
            ],
          },
        ],
      },
      {
        id: 'inference',
        title: 'Parámetros de inferencia',
        description: 'Define límites y estilo de respuesta.',
        fields: [
          { key: 'temperature', label: 'Temperatura', type: 'number', defaultValue: '0.4' },
          { key: 'maxOutputTokens', label: 'Máximo de tokens salida', type: 'number', defaultValue: '1024' },
          { key: 'topP', label: 'Top P', type: 'number', defaultValue: '0.9' },
        ],
      },
      {
        id: 'safety',
        title: 'Seguridad y cumplimiento',
        description: 'Activa perfil de seguridad y auditoría de prompts.',
        fields: [
          {
            key: 'safetyProfile',
            label: 'Perfil de seguridad',
            type: 'select',
            required: true,
            defaultValue: 'balanced',
            options: [
              { value: 'balanced', label: 'Balanced' },
              { value: 'strict', label: 'Strict' },
              { value: 'relaxed', label: 'Relaxed' },
            ],
          },
          { key: 'auditTag', label: 'Etiqueta de auditoría', type: 'text', defaultValue: '4shine-ai' },
        ],
      },
    ],
  },
  google_sso: {
    intro: 'Configura SSO de Google para acceso corporativo y provisión automática de usuarios.',
    primarySecretField: 'clientSecret',
    steps: [
      {
        id: 'oauth',
        title: 'Aplicación OAuth',
        description: 'Registra el cliente OAuth usado en login SSO.',
        fields: [
          { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'xxxx.apps.googleusercontent.com' },
          { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: '••••••••••••' },
          {
            key: 'callbackUrl',
            label: 'Callback URL',
            type: 'url',
            required: true,
            defaultValue: `${DEFAULT_PUBLIC_APP_URL}/api/v1/auth/sso/google/callback`,
          },
        ],
      },
      {
        id: 'domain',
        title: 'Dominio y claims',
        description: 'Define restricción de acceso por dominio y validaciones de claim.',
        fields: [
          { key: 'hostedDomain', label: 'Hosted domain', type: 'text', required: true, placeholder: '4shine.co' },
          { key: 'allowedAudience', label: 'Audience permitido', type: 'text', required: true, placeholder: '4shine-platform' },
          { key: 'enforceVerifiedEmail', label: 'Requerir email verificado', type: 'select', required: true, defaultValue: 'true', options: [
            { value: 'true', label: 'Sí' },
            { value: 'false', label: 'No' },
          ] },
        ],
      },
      {
        id: 'provisioning',
        title: 'Provisionamiento',
        description: 'Cómo crear o actualizar usuarios al ingresar vía SSO.',
        fields: [
          { key: 'defaultRole', label: 'Rol por defecto', type: 'select', defaultValue: 'lider', options: [
            { value: 'lider', label: 'Líder' },
            { value: 'mentor', label: 'Mentor' },
            { value: 'gestor', label: 'Gestor' },
          ] },
          { key: 'syncProfileOnLogin', label: 'Sincronizar perfil en login', type: 'select', defaultValue: 'true', options: [
            { value: 'true', label: 'Sí' },
            { value: 'false', label: 'No' },
          ] },
        ],
      },
    ],
  },
  openai: {
    intro: 'Conecta OpenAI para automatización de contenido, analítica semántica y asistentes internos.',
    primarySecretField: 'apiKey',
    steps: [
      {
        id: 'auth',
        title: 'Credenciales',
        description: 'Configura API key, organización y proyecto.',
        fields: [
          { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' },
          { key: 'organizationId', label: 'Organization ID', type: 'text', placeholder: 'org_...' },
          { key: 'projectId', label: 'Project ID', type: 'text', placeholder: 'proj_...' },
        ],
      },
      {
        id: 'models',
        title: 'Modelo y endpoint',
        description: 'Selecciona modelo por defecto y URL base.',
        fields: [
          {
            key: 'model',
            label: 'Modelo por defecto',
            type: 'select',
            required: true,
            defaultValue: 'gpt-4.1-mini',
            options: [
              { value: 'gpt-4.1', label: 'gpt-4.1' },
              { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
              { value: 'gpt-4o', label: 'gpt-4o' },
            ],
          },
          { key: 'baseUrl', label: 'Base URL', type: 'url', defaultValue: 'https://api.openai.com/v1' },
          { key: 'timeoutMs', label: 'Timeout request (ms)', type: 'number', defaultValue: '15000' },
        ],
      },
      {
        id: 'policy',
        title: 'Política de uso',
        description: 'Límites para costo y comportamiento en producción.',
        fields: [
          { key: 'temperature', label: 'Temperatura', type: 'number', defaultValue: '0.3' },
          { key: 'maxTokens', label: 'Máximo tokens por respuesta', type: 'number', defaultValue: '1200' },
          { key: 'monthlyBudgetUsd', label: 'Presupuesto mensual USD', type: 'number', defaultValue: '500' },
        ],
      },
    ],
  },
};

const OUTBOUND_EMAIL_ASSISTANT: AssistantDefinition = {
  intro: 'Configura envío de emails transaccionales y notificaciones del sistema.',
  primarySecretField: 'smtpPassword',
  steps: [
    {
      id: 'identity',
      title: 'Identidad de envío',
      description: 'Define remitente y proveedor principal.',
      fields: [
        {
          key: 'provider',
          label: 'Proveedor',
          type: 'select',
          required: true,
          defaultValue: 'smtp',
          options: [
            { value: 'smtp', label: 'SMTP' },
            { value: 'sendgrid', label: 'SendGrid' },
            { value: 'resend', label: 'Resend' },
            { value: 'ses', label: 'AWS SES' },
          ],
        },
        { key: 'fromName', label: 'Nombre remitente', type: 'text', required: true, placeholder: '4Shine Platform' },
        { key: 'fromEmail', label: 'Correo remitente', type: 'text', required: true, placeholder: 'noreply@4shine.co' },
        { key: 'replyTo', label: 'Reply-To', type: 'text', placeholder: 'soporte@4shine.co' },
      ],
    },
    {
      id: 'credentials',
      title: 'Credenciales de entrega',
      description: 'Completa SMTP o API Key según el proveedor elegido.',
      fields: [
        { key: 'smtpHost', label: 'SMTP Host', type: 'text', placeholder: 'smtp.sendgrid.net' },
        { key: 'smtpPort', label: 'SMTP Port', type: 'number', defaultValue: '587' },
        {
          key: 'smtpSecure',
          label: 'SMTP Seguro (TLS/SSL)',
          type: 'select',
          defaultValue: 'false',
          options: [
            { value: 'false', label: 'No' },
            { value: 'true', label: 'Sí' },
          ],
        },
        { key: 'smtpUser', label: 'SMTP Usuario', type: 'text', placeholder: 'apikey o usuario SMTP' },
        { key: 'smtpPassword', label: 'SMTP Password', type: 'password', placeholder: '••••••••••••' },
        { key: 'apiKey', label: 'API Key proveedor', type: 'password', placeholder: 'SG.... / re_.... / ...' },
        { key: 'sesRegion', label: 'Región SES', type: 'text', defaultValue: 'us-east-1' },
      ],
    },
    {
      id: 'testing',
      title: 'Pruebas y operación',
      description: 'Configura destinatario de prueba y controles iniciales.',
      fields: [
        { key: 'testRecipient', label: 'Email de prueba', type: 'text', placeholder: 'qa@4shine.co' },
      ],
    },
  ],
};

type AssistantTarget =
  | { kind: 'integration'; key: IntegrationKey }
  | { kind: 'outbound_email' }
  | null;

function collectFields(definition: AssistantDefinition): WizardFieldDefinition[] {
  return definition.steps.flatMap((step) => step.fields);
}

function hydrateDraft(definition: AssistantDefinition, baseData: Record<string, string>): Record<string, string> {
  const draft = { ...baseData };
  for (const field of collectFields(definition)) {
    if (!hasText(draft[field.key]) && hasText(field.defaultValue)) {
      draft[field.key] = field.defaultValue ?? '';
    }
    if (field.type === 'select' && !hasText(draft[field.key]) && field.options && field.options.length > 0) {
      draft[field.key] = field.options[0].value;
    }
  }
  return draft;
}

function calculateCompletion(definition: AssistantDefinition, data: Record<string, string>): number {
  const requiredFields = collectFields(definition).filter((field) => field.required);
  if (requiredFields.length === 0) return 100;
  const completed = requiredFields.filter((field) => hasText(data[field.key])).length;
  return Math.round((completed / requiredFields.length) * 100);
}

function getMissingRequiredFields(definition: AssistantDefinition, data: Record<string, string>): WizardFieldDefinition[] {
  return collectFields(definition).filter((field) => field.required && !hasText(data[field.key]));
}

function getSummaryItems(definition: AssistantDefinition, data: Record<string, string>): string[] {
  const fields = collectFields(definition).filter((field) => field.type !== 'password');
  const lines: string[] = [];

  for (const field of fields) {
    const value = data[field.key];
    if (!hasText(value)) continue;
    lines.push(`${field.label}: ${value}`);
    if (lines.length === 3) break;
  }

  return lines;
}

function formatDate(value: string | null): string {
  if (!value) return 'No configurada';
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function IntegracionesAdminPage() {
  const { alert } = useAppDialog();
  const [integrations, setIntegrations] = React.useState<IntegrationConfigRecord[]>(DEFAULT_INTEGRATIONS);
  const [outboundEmail, setOutboundEmail] = React.useState<OutboundEmailConfig>(DEFAULT_OUTBOUND_EMAIL_CONFIG);
  const [loading, setLoading] = React.useState(true);

  const [assistantTarget, setAssistantTarget] = React.useState<AssistantTarget>(null);
  const [assistantStepIndex, setAssistantStepIndex] = React.useState(0);
  const [assistantDraft, setAssistantDraft] = React.useState<Record<string, string>>({});
  const [assistantEnabled, setAssistantEnabled] = React.useState(false);

  const showError = React.useCallback(
    async (fallbackMessage: string, cause: unknown) => {
      await alert({
        title: 'Error',
        message: cause instanceof Error ? cause.message : fallbackMessage,
        tone: 'error',
      });
    },
    [alert],
  );

  const loadSettings = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getIntegrationsSettings();
      setIntegrations(data.integrations);
      setOutboundEmail(data.outboundEmail);
    } catch (error) {
      await showError('No se pudo cargar la configuración de integraciones', error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  React.useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const persistSettings = React.useCallback(
    async (nextIntegrations: IntegrationConfigRecord[], nextOutboundEmail: OutboundEmailConfig) => {
      const payload = await updateIntegrationsSettings({
        integrations: nextIntegrations,
        outboundEmail: nextOutboundEmail,
      });

      setIntegrations(payload.integrations);
      setOutboundEmail(payload.outboundEmail);
      return payload;
    },
    [],
  );

  const setIntegration = (
    key: IntegrationKey,
    updater: (current: IntegrationConfigRecord) => IntegrationConfigRecord,
  ) => {
    setIntegrations((prev) => prev.map((item) => (item.key === key ? updater(item) : item)));
  };

  const openIntegrationAssistant = (integration: IntegrationConfigRecord) => {
    const definition = INTEGRATION_ASSISTANTS[integration.key];
    const baseData = { ...integration.wizardData };

    if (definition.primarySecretField && !hasText(baseData[definition.primarySecretField]) && hasText(integration.value)) {
      baseData[definition.primarySecretField] = integration.value;
    }

    setAssistantTarget({ kind: 'integration', key: integration.key });
    setAssistantStepIndex(0);
    setAssistantDraft(hydrateDraft(definition, baseData));
    setAssistantEnabled(integration.enabled);
  };

  const openOutboundAssistant = () => {
    setAssistantTarget({ kind: 'outbound_email' });
    setAssistantStepIndex(0);
    setAssistantEnabled(outboundEmail.enabled);
    setAssistantDraft(
      hydrateDraft(OUTBOUND_EMAIL_ASSISTANT, {
        provider: outboundEmail.provider,
        fromName: outboundEmail.fromName,
        fromEmail: outboundEmail.fromEmail,
        replyTo: outboundEmail.replyTo,
        smtpHost: outboundEmail.smtpHost,
        smtpPort: outboundEmail.smtpPort,
        smtpUser: outboundEmail.smtpUser,
        smtpPassword: outboundEmail.smtpPassword,
        smtpSecure: outboundEmail.smtpSecure ? 'true' : 'false',
        apiKey: outboundEmail.apiKey,
        sesRegion: outboundEmail.sesRegion,
        testRecipient: outboundEmail.testRecipient,
      }),
    );
  };

  const closeAssistant = () => {
    setAssistantTarget(null);
    setAssistantStepIndex(0);
    setAssistantDraft({});
    setAssistantEnabled(false);
  };

  const assistantDefinition = React.useMemo(() => {
    if (!assistantTarget) return null;
    if (assistantTarget.kind === 'integration') {
      return INTEGRATION_ASSISTANTS[assistantTarget.key];
    }
    return OUTBOUND_EMAIL_ASSISTANT;
  }, [assistantTarget]);

  const assistantTitle = React.useMemo(() => {
    if (!assistantTarget) return '';
    if (assistantTarget.kind === 'integration') {
      const integration = integrations.find((item) => item.key === assistantTarget.key);
      return `Asistente · ${integration?.label ?? 'Integración'}`;
    }
    return 'Asistente · Correo saliente';
  }, [assistantTarget, integrations]);

  const currentStep = assistantDefinition?.steps[assistantStepIndex] ?? null;
  const isLastAssistantStep = !!assistantDefinition && assistantStepIndex === assistantDefinition.steps.length - 1;

  const onAssistantSave = async () => {
    if (!assistantTarget || !assistantDefinition) return;

    if (assistantTarget.kind === 'integration') {
      const missing = getMissingRequiredFields(assistantDefinition, assistantDraft);
      if (missing.length > 0) {
        const missingField = missing[0];
        const stepIndex = assistantDefinition.steps.findIndex((step) =>
          step.fields.some((field) => field.key === missingField.key),
        );
        if (stepIndex >= 0) {
          setAssistantStepIndex(stepIndex);
        }
        await alert({
          title: 'Completa el asistente',
          message: `Falta el campo obligatorio: ${missingField.label}.`,
          tone: 'warning',
        });
        return;
      }

      const now = new Date().toISOString();
      const targetKey = assistantTarget.key;
      const primarySecretField = assistantDefinition.primarySecretField;

      const nextIntegrations = integrations.map((item) => {
        if (item.key !== targetKey) return item;

        const nextValue =
          primarySecretField && hasText(assistantDraft[primarySecretField])
            ? assistantDraft[primarySecretField]
            : item.value;

        return {
          ...item,
          enabled: assistantEnabled,
          value: nextValue,
          wizardData: { ...assistantDraft },
          lastConfiguredAt: now,
        };
      });

      try {
        await persistSettings(nextIntegrations, outboundEmail);
      } catch (error) {
        await showError('No se pudo guardar la integración', error);
        return;
      }

      closeAssistant();
      await alert({
        title: 'Integración configurada',
        message: 'El asistente se aplicó correctamente y la configuración quedó en base de datos.',
        tone: 'success',
      });
      return;
    }

    const nextOutbound: OutboundEmailConfig = {
      enabled: assistantEnabled,
      provider: (assistantDraft.provider as OutboundEmailProvider) || 'smtp',
      fromName: assistantDraft.fromName ?? '',
      fromEmail: assistantDraft.fromEmail ?? '',
      replyTo: assistantDraft.replyTo ?? '',
      smtpHost: assistantDraft.smtpHost ?? '',
      smtpPort: assistantDraft.smtpPort ?? '587',
      smtpUser: assistantDraft.smtpUser ?? '',
      smtpPassword: assistantDraft.smtpPassword ?? '',
      smtpSecure: assistantDraft.smtpSecure === 'true',
      apiKey: assistantDraft.apiKey ?? '',
      sesRegion: assistantDraft.sesRegion ?? 'us-east-1',
      testRecipient: assistantDraft.testRecipient ?? '',
    };

    const outboundMissing = requiredOutboundMissing(nextOutbound);
    if (outboundMissing.length > 0) {
      await alert({
        title: 'Configuración incompleta',
        message: `Faltan campos en correo saliente: ${outboundMissing.slice(0, 3).join(', ')}${
          outboundMissing.length > 3 ? '...' : ''
        }`,
        tone: 'warning',
      });
      return;
    }

    try {
      await persistSettings(integrations, nextOutbound);
    } catch (error) {
      await showError('No se pudo guardar la configuración de correo saliente', error);
      return;
    }

    closeAssistant();
    await alert({
      title: 'Correo saliente configurado',
      message: 'La configuración de envío de correos quedó registrada en base de datos.',
      tone: 'success',
    });
  };

  const onSaveAll = async () => {
    try {
      await persistSettings(integrations, outboundEmail);
      await alert({
        title: 'Integraciones actualizadas',
        message: 'Se guardaron integraciones y correo saliente.',
        tone: 'success',
      });
    } catch (error) {
      await showError('No se pudo guardar la configuración de integraciones', error);
    }
  };

  const enabledCount = integrations.filter((item) => item.enabled).length;
  const configuredCount = integrations.filter((item) => calculateCompletion(INTEGRATION_ASSISTANTS[item.key], item.wizardData) === 100).length;
  const outboundReady = requiredOutboundMissing(outboundEmail).length === 0;

  const assistantProgress = React.useMemo(() => {
    if (!assistantDefinition) return 0;
    if (assistantDefinition.steps.length === 0) return 100;
    return Math.round(((assistantStepIndex + 1) / assistantDefinition.steps.length) * 100);
  }, [assistantDefinition, assistantStepIndex]);

  return (
    <div className="space-y-4">
      <PageTitle
        title="Integraciones"
        subtitle="Asistentes de configuración por integración + correo saliente para operación de plataforma."
      />

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
          Cargando configuración...
        </div>
      ) : (
        <>
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <article className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Activas</p>
            <p className="text-2xl font-semibold text-slate-800 mt-1">{enabledCount}</p>
            <p className="text-xs text-slate-500 mt-1">de {integrations.length} integraciones</p>
          </article>
          <article className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Asistentes completos</p>
            <p className="text-2xl font-semibold text-slate-800 mt-1">{configuredCount}</p>
            <p className="text-xs text-slate-500 mt-1">configuración obligatoria completa</p>
          </article>
          <article className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Correo saliente</p>
            <p className={`text-sm font-semibold mt-2 ${outboundEmail.enabled ? 'text-emerald-700' : 'text-slate-700'}`}>
              {outboundEmail.enabled ? 'Habilitado' : 'Deshabilitado'}
            </p>
            <p className={`text-xs mt-1 ${outboundReady ? 'text-emerald-600' : 'text-amber-600'}`}>
              {outboundReady ? 'Configuración lista' : 'Configuración incompleta'}
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Persistencia</p>
              <p className="text-sm font-medium text-slate-700 mt-2">Base de datos</p>
            </div>
            <button className="rounded-md bg-slate-900 text-white px-3 py-2 text-sm" onClick={onSaveAll} type="button">
              Guardar todo
            </button>
          </article>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <PlugZap size={18} /> Integraciones de plataforma
            </h3>
            <p className="text-sm text-slate-500">Cada integración incluye asistente guiado para credenciales, seguridad y parámetros.</p>
          </div>
        </div>

        <div className="space-y-3">
          {integrations.map((item) => {
            const definition = INTEGRATION_ASSISTANTS[item.key];
            const completion = calculateCompletion(definition, item.wizardData);
            const summary = getSummaryItems(definition, item.wizardData);

            return (
              <article key={item.key} className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-slate-800">{item.label}</h4>
                    <p className="text-xs text-slate-500">{item.provider}</p>
                    <p className="text-xs text-slate-500 mt-1">{definition.intro}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.enabled ? 'Habilitada' : 'Deshabilitada'}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        completion === 100 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      Asistente: {completion}%
                    </span>
                    <button
                      type="button"
                      className="text-xs px-3 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                      onClick={() => openIntegrationAssistant(item)}
                    >
                      Asistente
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="password"
                    className="md:col-span-2 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                    placeholder="API key / client secret / token"
                    value={item.value}
                    onChange={(event) =>
                      setIntegration(item.key, (current) => ({ ...current, value: event.target.value }))
                    }
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 rounded-md border border-slate-200 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={(event) =>
                        setIntegration(item.key, (current) => ({ ...current, enabled: event.target.checked }))
                      }
                    />
                    Habilitar integración
                  </label>
                </div>

                {summary.length > 0 && (
                  <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-600 mb-1">Resumen de configuración</p>
                    <div className="space-y-1">
                      {summary.map((line) => (
                        <p key={`${item.key}-${line}`} className="text-xs text-slate-500">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 mt-2">Última configuración: {formatDate(item.lastConfiguredAt)}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Mail size={18} /> Correo saliente
            </h3>
            <p className="text-sm text-slate-500">Configura SMTP o proveedor API para notificaciones y comunicaciones del sistema.</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded ${
                outboundEmail.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {outboundEmail.enabled ? 'Habilitado' : 'Deshabilitado'}
            </span>
            <button
              type="button"
              className="text-xs px-3 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
              onClick={openOutboundAssistant}
            >
              Asistente de correo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            value={outboundEmail.provider}
            onChange={(event) =>
              setOutboundEmail((prev) => ({ ...prev, provider: event.target.value as OutboundEmailProvider }))
            }
          >
            <option value="smtp">SMTP</option>
            <option value="sendgrid">SendGrid</option>
            <option value="resend">Resend</option>
            <option value="ses">AWS SES</option>
          </select>
          <input
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            placeholder="Nombre remitente"
            value={outboundEmail.fromName}
            onChange={(event) => setOutboundEmail((prev) => ({ ...prev, fromName: event.target.value }))}
          />
          <input
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            placeholder="Correo remitente"
            value={outboundEmail.fromEmail}
            onChange={(event) => setOutboundEmail((prev) => ({ ...prev, fromEmail: event.target.value }))}
          />
          <label className="inline-flex items-center gap-2 text-sm text-slate-700 rounded-md border border-slate-200 px-3 py-2">
            <input
              type="checkbox"
              checked={outboundEmail.enabled}
              onChange={(event) => setOutboundEmail((prev) => ({ ...prev, enabled: event.target.checked }))}
            />
            Habilitar envío
          </label>
        </div>

        {outboundEmail.provider === 'smtp' ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input
              className="border border-slate-300 rounded-md px-3 py-2 text-sm md:col-span-2"
              placeholder="SMTP host"
              value={outboundEmail.smtpHost}
              onChange={(event) => setOutboundEmail((prev) => ({ ...prev, smtpHost: event.target.value }))}
            />
            <input
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
              placeholder="SMTP port"
              value={outboundEmail.smtpPort}
              onChange={(event) => setOutboundEmail((prev) => ({ ...prev, smtpPort: event.target.value }))}
            />
            <input
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
              placeholder="SMTP user"
              value={outboundEmail.smtpUser}
              onChange={(event) => setOutboundEmail((prev) => ({ ...prev, smtpUser: event.target.value }))}
            />
            <input
              type="password"
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
              placeholder="SMTP password"
              value={outboundEmail.smtpPassword}
              onChange={(event) => setOutboundEmail((prev) => ({ ...prev, smtpPassword: event.target.value }))}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="password"
              className="border border-slate-300 rounded-md px-3 py-2 text-sm md:col-span-2"
              placeholder="API key del proveedor"
              value={outboundEmail.apiKey}
              onChange={(event) => setOutboundEmail((prev) => ({ ...prev, apiKey: event.target.value }))}
            />
            {outboundEmail.provider === 'ses' ? (
              <input
                className="border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder="Región SES"
                value={outboundEmail.sesRegion}
                onChange={(event) => setOutboundEmail((prev) => ({ ...prev, sesRegion: event.target.value }))}
              />
            ) : (
              <input
                className="border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder="Reply-To"
                value={outboundEmail.replyTo}
                onChange={(event) => setOutboundEmail((prev) => ({ ...prev, replyTo: event.target.value }))}
              />
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            className="border border-slate-300 rounded-md px-3 py-2 text-sm min-w-72"
            placeholder="Email para prueba de envío"
            value={outboundEmail.testRecipient}
            onChange={(event) => setOutboundEmail((prev) => ({ ...prev, testRecipient: event.target.value }))}
          />
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            onClick={async () => {
              const missing = requiredOutboundMissing(outboundEmail);
              if (missing.length > 0) {
                await alert({
                  title: 'No se puede probar el envío',
                  message: `Completa primero: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`,
                  tone: 'warning',
                });
                return;
              }

              try {
                await persistSettings(integrations, outboundEmail);
                const result = await queueOutboundEmailTest(
                  hasText(outboundEmail.testRecipient) ? outboundEmail.testRecipient : undefined,
                );
                await alert({
                  title: 'Prueba de correo en cola',
                  message: `Se registró un envío de prueba hacia ${result.recipient}.`,
                  tone: 'success',
                });
              } catch (error) {
                await showError('No se pudo registrar la prueba de correo', error);
              }
            }}
          >
            Probar envío
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Persistencia activa en base de datos. Recomendado siguiente paso: cifrado de secretos con KMS.
        </p>
      </section>
        </>
      )}

      {assistantTarget && assistantDefinition && currentStep && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">{assistantTitle}</h3>
                <p className="text-sm text-slate-500">{assistantDefinition.intro}</p>
              </div>
              <button
                type="button"
                className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
                onClick={closeAssistant}
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 min-h-[460px]">
              <aside className="md:col-span-1 border-r border-slate-100 p-4 bg-slate-50">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Progreso</p>
                  <div className="h-2 rounded-full bg-slate-200 mt-2 overflow-hidden">
                    <div className="h-full bg-slate-800" style={{ width: `${assistantProgress}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Paso {assistantStepIndex + 1} de {assistantDefinition.steps.length}
                  </p>
                </div>

                <div className="space-y-2">
                  {assistantDefinition.steps.map((step, index) => {
                    const stepFields = step.fields.filter((field) => field.required);
                    const stepComplete =
                      stepFields.length === 0 || stepFields.every((field) => hasText(assistantDraft[field.key]));

                    return (
                      <button
                        key={step.id}
                        type="button"
                        className={`w-full text-left p-3 rounded-md border ${
                          index === assistantStepIndex
                            ? 'border-slate-400 bg-white'
                            : 'border-transparent hover:border-slate-200'
                        }`}
                        onClick={() => setAssistantStepIndex(index)}
                      >
                        <p className="text-xs text-slate-500">Paso {index + 1}</p>
                        <p className="text-sm font-medium text-slate-800 flex items-center justify-between gap-2">
                          {step.title}
                          {stepComplete ? (
                            <CheckCircle2 size={14} className="text-emerald-600" />
                          ) : (
                            <Wrench size={14} className="text-amber-600" />
                          )}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={assistantEnabled}
                    onChange={(event) => setAssistantEnabled(event.target.checked)}
                  />
                  Habilitar al finalizar
                </label>
              </aside>

              <section className="md:col-span-2 p-5 space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-800">{currentStep.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{currentStep.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentStep.fields.map((field) => (
                    <label
                      key={field.key}
                      className={`text-sm text-slate-700 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
                    >
                      <span className="font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500"> *</span>}
                      </span>

                      {field.type === 'select' && field.options ? (
                        <select
                          className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                          value={assistantDraft[field.key] ?? ''}
                          onChange={(event) =>
                            setAssistantDraft((prev) => ({ ...prev, [field.key]: event.target.value }))
                          }
                        >
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          className="mt-1 w-full min-h-24 border border-slate-300 rounded-md px-3 py-2 text-sm"
                          placeholder={field.placeholder}
                          value={assistantDraft[field.key] ?? ''}
                          onChange={(event) =>
                            setAssistantDraft((prev) => ({ ...prev, [field.key]: event.target.value }))
                          }
                        />
                      ) : (
                        <input
                          type={field.type === 'password' ? 'password' : field.type}
                          className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                          placeholder={field.placeholder}
                          value={assistantDraft[field.key] ?? ''}
                          onChange={(event) =>
                            setAssistantDraft((prev) => ({ ...prev, [field.key]: event.target.value }))
                          }
                        />
                      )}

                      {field.helpText && <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>}
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-between gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={closeAssistant}
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
                  disabled={assistantStepIndex === 0}
                  onClick={() => setAssistantStepIndex((prev) => Math.max(prev - 1, 0))}
                >
                  Atrás
                </button>

                {!isLastAssistantStep ? (
                  <button
                    type="button"
                    className="rounded-md bg-slate-900 text-white px-3 py-2 text-sm"
                    onClick={() => setAssistantStepIndex((prev) => Math.min(prev + 1, assistantDefinition.steps.length - 1))}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-md bg-slate-900 text-white px-3 py-2 text-sm"
                    onClick={() => void onAssistantSave()}
                  >
                    Finalizar asistente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
