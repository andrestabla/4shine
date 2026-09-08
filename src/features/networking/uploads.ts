/**
 * Carga de recursos en publicaciones de Networking.
 *
 * Solo gestor, admin y advisor pueden ocupar el bucket de la plataforma; un
 * líder comparte pegando la URL de su recurso. La regla vive también en
 * /api/v1/uploads/r2/presign — aquí solo decide si se dibuja el botón.
 */

export const POST_RESOURCE_PATH_PREFIX = 'networking/publicaciones';
export const POST_RESOURCE_FIELD = 'post_resource';

const UPLOAD_ROLES = new Set(['admin', 'gestor', 'mentor']);

/** `mentor` es el código interno del rol que la interfaz llama "Advisor". */
export function canUploadPostResource(role: string | null | undefined): boolean {
  return UPLOAD_ROLES.has((role ?? '').trim().toLowerCase());
}

/**
 * Imágenes y documentos. Sin video ni audio a propósito: pesan mucho y ya se
 * comparten mejor por enlace (YouTube, Vimeo), que además da miniatura.
 */
export const POST_RESOURCE_ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
].join(',');
