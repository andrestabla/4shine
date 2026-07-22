/**
 * Escape de HTML para insertar texto controlado por el usuario dentro de
 * plantillas de correo.
 *
 * React escapa solo cuando el valor se pinta como hijo JSX; las plantillas de
 * notificación se construyen concatenando cadenas y luego se guardan como
 * snapshot, así que ahí el escape hay que hacerlo a mano.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sustituye {{variables}} escapando cada valor.
 *
 * La plantilla la escribe un administrador y puede llevar HTML a propósito; lo
 * que NO puede llevar HTML es el valor sustituido, porque suele venir del
 * perfil de un usuario cualquiera (su nombre, por ejemplo).
 */
export function renderTemplateHtmlSafe(
  template: string,
  vars: Record<string, string | undefined | null>,
  onMissing?: (key: string) => void,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const raw = vars[key];
    if (raw === undefined || raw === null || raw === '') {
      onMissing?.(key);
      return '';
    }
    return escapeHtml(String(raw));
  });
}
