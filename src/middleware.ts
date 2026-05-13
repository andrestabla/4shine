import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Maps public page paths to their site_pages config key
const PUBLIC_PAGE_KEYS: Record<string, string> = {
  '/': 'home',
  '/descubrimiento': 'descubrimiento',
  '/metodologia': 'metodologia',
  '/planes-precios': 'planes_precios',
  '/afiliados': 'afiliados',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pageKey = PUBLIC_PAGE_KEYS[pathname];
  if (!pageKey) return NextResponse.next();

  try {
    const settingsUrl = new URL('/api/v1/public/site-settings', request.url);
    const res = await fetch(settingsUrl.toString());

    if (res.ok) {
      const data = (await res.json()) as { ok: boolean; pages: Record<string, boolean> };
      if (data.ok && data.pages[pageKey] === false) {
        return NextResponse.redirect(new URL('/acceso', request.url));
      }
    }
  } catch {
    // Fail open — if settings can't be fetched, show the page
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/descubrimiento', '/metodologia', '/planes-precios', '/afiliados'],
};
