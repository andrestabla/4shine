/**
 * Reglas de visibilidad de las grabaciones de Expertos en vivo. Sin
 * dependencias de servidor: se importa tanto desde el servicio como desde la
 * interfaz.
 */

export type GroupSessionRecordingStatus = 'published' | 'draft' | 'hidden';

export const GROUP_SESSION_RECORDING_STATUSES: readonly GroupSessionRecordingStatus[] = [
  'published',
  'draft',
  'hidden',
];

export const GROUP_SESSION_RECORDING_STATUS_LABELS: Record<GroupSessionRecordingStatus, string> = {
  published: 'Publicada',
  draft: 'Borrador',
  hidden: 'No mostrar',
};

/**
 * Directiva: una grabación deja de mostrarse a líderes y advisors cuando han
 * pasado más de estos días desde su fecha, medidos con la hora del sistema.
 * Admin y gestor la siguen viendo, marcada como vencida.
 */
export const GROUP_SESSION_RECORDING_VISIBILITY_DAYS = 90;

export function isGroupSessionRecordingStatus(value: unknown): value is GroupSessionRecordingStatus {
  return typeof value === 'string' && (GROUP_SESSION_RECORDING_STATUSES as readonly string[]).includes(value);
}
