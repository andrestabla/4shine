/**
 * Formato de fecha ÚNICO para todo el sistema: dd/mm/aaaa.
 *
 * Usar SIEMPRE estos helpers para mostrar fechas al usuario (no `dateStyle`,
 * `month:'short'`, etc., que producían "30 jun de 2026"). El formato numérico
 * dd/mm/aaaa es el estándar acordado.
 *
 * IMPORTANTE: NO usar estos helpers para claves de fecha internas (p. ej.
 * `toLocaleDateString('en-CA', { timeZone })` que produce YYYY-MM-DD para
 * comparar/agrupar) — eso es lógica, no presentación.
 */

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Fecha como dd/mm/aaaa (ej: 01/07/2026). Vacío si la fecha no es válida. */
export function formatDate(value: DateInput, options?: { timeZone?: string }): string {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: options?.timeZone,
  });
}

/** Fecha y hora como dd/mm/aaaa, h:mm a. m./p. m. Vacío si no es válida. */
export function formatDateTime(value: DateInput, options?: { timeZone?: string }): string {
  const d = toDate(value);
  if (!d) return '';
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: options?.timeZone,
  });
}

/** Día y mes numéricos, sin año (dd/mm) — para etiquetas compactas. */
export function formatDayMonth(value: DateInput, options?: { timeZone?: string }): string {
  const d = toDate(value);
  if (!d) return '';
  // ICU no rellena a 2 dígitos cuando falta el año, así que padeamos a mano
  // sobre las partes numéricas (respetando la zona horaria).
  const parts = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'numeric',
    timeZone: options?.timeZone,
  }).formatToParts(d);
  const day = (parts.find((p) => p.type === 'day')?.value ?? '').padStart(2, '0');
  const month = (parts.find((p) => p.type === 'month')?.value ?? '').padStart(2, '0');
  return `${day}/${month}`;
}
