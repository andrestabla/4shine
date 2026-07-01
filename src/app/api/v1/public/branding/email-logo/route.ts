import { NextResponse } from 'next/server';
import { getPublicBrandingSettings } from '@/features/administracion/service';
import { withClient } from '@/server/db/pool';

export const runtime = 'nodejs';

/**
 * Sirve el logo del branding para los CORREOS desde el propio dominio (4shine.co),
 * transmitiendo los bytes en vez de apuntar directo a `pub-*.r2.dev`.
 *
 * Motivo: el dominio público de desarrollo de Cloudflare R2 (`r2.dev`) está
 * rate-limited y el proxy de imágenes de Gmail/Outlook (googleusercontent, etc.)
 * a veces no puede descargarlo → el logo aparece roto de forma intermitente.
 *
 * IMPORTANTE — este endpoint NUNCA responde con un redirect (3xx). Los proxies de
 * imágenes de los clientes de correo (Outlook sobre todo) con frecuencia NO siguen
 * redirects y muestran la imagen rota; además cachean ese fallo. Por eso, ante
 * cualquier fallo (sin logo, r2 caído/rate-limited, contenido no-imagen, timeout)
 * SIEMPRE transmitimos los bytes del logo estático por defecto con 200 image/png.
 */
const STATIC_FALLBACK_PATH = '/branding/4shine-logo-amarillo.png';

async function streamStaticFallback(request: Request): Promise<NextResponse> {
  try {
    const res = await fetch(new URL(STATIC_FALLBACK_PATH, request.url), {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': res.headers.get('content-type') || 'image/png',
          // Content-Length explícito: el proxy de imágenes de Outlook rechaza
          // respuestas de imagen sin longitud (muestra imagen rota). Gmail no.
          'Content-Length': String(buffer.byteLength),
          // Fallback: cache corto para poder recuperar al logo real pronto.
          'Cache-Control': 'public, max-age=300, s-maxage=300',
        },
      });
    }
  } catch {
    // cae al 1x1 transparente de abajo
  }
  // Último recurso: PNG transparente 1x1 (siempre válido, nunca rompe el layout).
  const onePx = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  );
  return new NextResponse(onePx, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(onePx.byteLength),
      'Cache-Control': 'public, max-age=60',
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId')?.trim() || undefined;

    const settings = await withClient((client) => getPublicBrandingSettings(client, organizationId));
    const target = settings.logoDarkUrl?.trim() || settings.logoUrl?.trim();
    if (!target) return streamStaticFallback(request);

    // Timeout para que un r2 lento/rate-limited no cuelgue al proxy del correo.
    const upstream = await fetch(target, { signal: AbortSignal.timeout(5000) }).catch(() => null);
    if (!upstream || !upstream.ok) return streamStaticFallback(request);

    const contentType = upstream.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) return streamStaticFallback(request);

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Content-Length explícito: Outlook lo exige para renderizar la imagen.
        'Content-Length': String(buffer.byteLength),
        // Cacheable por clientes/proxies de correo; se revalida cada hora.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch {
    return streamStaticFallback(request);
  }
}
