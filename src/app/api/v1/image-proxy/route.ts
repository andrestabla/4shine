import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth/request-auth';
import { assertPublicUrl } from '@/server/net/ssrf-guard';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  if (!rawUrl) return new NextResponse('Missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return new NextResponse('Only http(s) URLs allowed', { status: 400 });
  }

  // El filtro por texto no cubría 169.254.0.0/16 (metadatos de nube), las IPs
  // en decimal ni el DNS rebinding. assertPublicUrl resuelve el nombre y valida
  // la IP real.
  const check = await assertPublicUrl(rawUrl);
  if (!check.ok) {
    return new NextResponse(check.reason ?? 'Host not allowed', { status: 403 });
  }

  try {
    const res = await fetch(rawUrl, { headers: { Accept: 'image/*' }, redirect: 'manual' });
    if (!res.ok) return new NextResponse('Upstream error', { status: 502 });

    // Sin esto el proxy devolvía el Content-Type del origen: bastaba alojar un
    // text/html para que se ejecutara como página del dominio de 4Shine, con la
    // sesión de quien abriera el enlace.
    const upstreamType = (res.headers.get('content-type') ?? '').toLowerCase();
    if (!upstreamType.startsWith('image/')) {
      return new NextResponse('Upstream is not an image', { status: 415 });
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 502 });
  }
}
