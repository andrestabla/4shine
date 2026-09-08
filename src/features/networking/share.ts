/** Lo mínimo que necesita una publicación para poder compartirse. */
export interface ShareablePost {
  postId: string;
  groupId: string;
  groupName: string;
  title: string;
  isPubliclyShareable: boolean;
}

/**
 * Enlaces para compartir una publicación de comunidad.
 *
 * - `internal`: ruta dentro del dashboard. Abre la comunidad y resalta la
 *   publicación. Siempre existe, pero exige sesión (el proxy manda a /acceso).
 * - `public`: página abierta a internet. Solo existe cuando la publicación vive
 *   en una comunidad activa y abierta (`isPubliclyShareable`); en comunidades
 *   cerradas es `null` y nunca se ofrece.
 */
export interface PostShareLinks {
  internal: string;
  public: string | null;
  /** El que conviene repartir: el público si lo hay, si no el interno. */
  preferred: string;
}

export function internalPostPath(groupId: string, postId: string): string {
  return `/dashboard/networking/comunidades/${groupId}?post=${postId}`;
}

export function publicPostPath(postId: string): string {
  return `/networking/publicacion/${postId}`;
}

function absolute(path: string): string {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

export function buildPostShareLinks(post: ShareablePost): PostShareLinks {
  const internal = absolute(internalPostPath(post.groupId, post.postId));
  const publicUrl = post.isPubliclyShareable ? absolute(publicPostPath(post.postId)) : null;

  return { internal, public: publicUrl, preferred: publicUrl ?? internal };
}

/**
 * Texto para WhatsApp. wa.me sin número abre el selector de contacto del
 * usuario, que es lo que queremos: compartir con quien él elija.
 */
export function buildWhatsAppShareUrl(post: ShareablePost, url: string): string {
  const message = `${post.title}\n\nCompartido desde la comunidad ${post.groupName} en 4Shine:\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
