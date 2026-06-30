import { NextResponse } from 'next/server';
import { getPublicBrandingSettings } from '@/features/administracion/service';
import { withClient } from '@/server/db/pool';

export const runtime = 'nodejs';

/**
 * Sirve el logo del branding para los CORREOS desde el propio dominio (4shine.co),
 * transmitiendo los bytes en vez de apuntar directo a `pub-*.r2.dev`.
 *
 * Motivo: el dominio público de desarrollo de Cloudflare R2 (`r2.dev`) está
 * rate-limited y el proxy de imágenes de Gmail (googleusercontent) a veces no
 * puede descargarlo → el logo aparece roto de forma intermitente. Al pasar por
 * un endpoint de la app (Vercel, estable), el proxy de Gmail descarga sin
 * problema. Prefiere el logo oscuro (sobre fondos oscuros del header).
 */
export async function GET(request: Request) {
  const fallback = () =>
    NextResponse.redirect(new URL('/branding/4shine-logo-amarillo.png', request.url), { status: 307 });

  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId')?.trim() || undefined;

    const settings = await withClient((client) => getPublicBrandingSettings(client, organizationId));
    const target = settings.logoDarkUrl?.trim() || settings.logoUrl?.trim();
    if (!target) return fallback();

    const upstream = await fetch(target, { cache: 'no-cache' });
    if (!upstream.ok) return fallback();

    const contentType = upstream.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) return fallback();

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cacheable por clientes/proxies de correo; se revalida cada hora.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch {
    return fallback();
  }
}
