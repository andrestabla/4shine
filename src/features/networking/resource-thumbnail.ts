import { assertPublicUrl } from '@/server/net/ssrf-guard';

/**
 * Miniatura del recurso de una publicación, para la vista previa que muestran
 * WhatsApp y LinkedIn al compartir su página pública.
 *
 * Todo lo que sale de aquí es una URL remota que un tercero va a descargar, así
 * que cada URL se valida con assertPublicUrl: sin eso, un `resourceUrl` con un
 * host interno convertiría nuestra propia página en una sonda de red.
 */

const IMAGE_EXTENSION = /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?.*)?$/i;

function normalize(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return null;
}

function youTubeId(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase();
  if (host.includes('youtube.com')) {
    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery) return fromQuery;
    const parts = parsed.pathname.split('/').filter(Boolean);
    // /embed/<id> y /shorts/<id>
    if ((parts[0] === 'embed' || parts[0] === 'shorts') && parts[1]) return parts[1];
  }
  if (host.includes('youtu.be')) {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    if (id) return id;
  }
  return null;
}

function vimeoId(parsed: URL): string | null {
  if (!parsed.hostname.toLowerCase().includes('vimeo.com')) return null;
  const id = parsed.pathname.split('/').filter(Boolean)[0];
  return id && /^\d+$/.test(id) ? id : null;
}

/**
 * El contenido de un atributo viene con entidades: sin deshacerlas, una og:image
 * con parámetros llega como `?a=1&amp;b=2` y el enlace queda roto.
 */
function decodeEntities(value: string): string {
  return value
    .replace(/&(?:amp|#0*38);/gi, '&')
    .replace(/&(?:quot|#0*34);/gi, '"')
    .replace(/&(?:apos|#0*39);/gi, "'")
    .replace(/&(?:lt|#0*60);/gi, '<')
    .replace(/&(?:gt|#0*62);/gi, '>');
}

/** og:image (o twitter:image) de una página remota. */
async function scrapeOgImage(url: string): Promise<string | null> {
  const check = await assertPublicUrl(url);
  if (!check.ok) return null;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 4Shine-LinkPreview/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'manual',
      // generateMetadata espera este fetch antes de responder, así que el techo
      // se queda bajo: un sitio lento cae al branding en vez de retrasar la
      // página. Imágenes, YouTube y Vimeo no pasan por aquí.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    if (!(res.headers.get('content-type') ?? '').includes('text/html')) return null;

    const html = (await res.text()).slice(0, 200_000);
    const found =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]
      ?? html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? null;

    if (!found) return null;
    const absolute = new URL(decodeEntities(found), url).toString();
    return (await assertPublicUrl(absolute)).ok ? absolute : null;
  } catch {
    return null;
  }
}

async function vimeoThumbnail(id: string): Promise<string | null> {
  try {
    const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    const thumb = data.thumbnail_url;
    if (!thumb) return null;
    return (await assertPublicUrl(thumb)).ok ? thumb : null;
  } catch {
    return null;
  }
}

/**
 * Devuelve la miniatura del recurso, o null si no hay ninguna razonable (por
 * ejemplo un PDF o un .mp4 suelto, de los que no se puede sacar un fotograma
 * sin procesarlos). Quien llama decide el respaldo.
 */
export async function resolveResourceThumbnail(resourceUrl: string | null): Promise<string | null> {
  const url = normalize(resourceUrl);
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // 1. Imagen subida o enlazada: se usa tal cual.
  if (IMAGE_EXTENSION.test(parsed.pathname)) {
    return (await assertPublicUrl(url)).ok ? url : null;
  }

  // 2. YouTube: hqdefault existe para todo video; maxresdefault no.
  const yt = youTubeId(parsed);
  if (yt && /^[\w-]{6,20}$/.test(yt)) return `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`;

  // 3. Vimeo publica la miniatura por oEmbed.
  const vimeo = vimeoId(parsed);
  if (vimeo) return vimeoThumbnail(vimeo);

  // 4. Video directo: no hay fotograma sin decodificar el archivo.
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(parsed.pathname)) return null;

  // 5. Cualquier otro enlace (documento, artículo, Drive…): su propia og:image
  //    si la publica.
  return scrapeOgImage(url);
}
