import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CANONICAL_HOST = 'www.4shine.co';
const LEGACY_HOST = '4shine.co';
const VERCEL_HOST_SUFFIX = '.vercel.app';

const ACCESS_COOKIE = 'auth_access_token';
const GUEST_ACCESS_COOKIE = 'guest_access_token';

// ── Rate limiter (in-memory, per serverless instance) ──────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

const RATE_LIMITED_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/resend-verification',
  '/api/v1/auth/google',
]);

function getRateLimitKey(request: NextRequest, path: string): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  return `${ip}:${path}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) return true;
  rateLimitMap.set(key, entry);
  return false;
}

let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

// ── Public page keys that can be toggled via admin site settings ─────────────
const PUBLIC_PAGE_KEYS: Record<string, string> = {
  '/': 'home',
  '/descubrimiento': 'descubrimiento',
  '/metodologia': 'metodologia',
  '/planes-precios': 'planes_precios',
  '/advisors': 'afiliados',
};

// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  maybeCleanup();

  const { pathname } = request.nextUrl;

  // ── 1. Canonical host redirect (production only, GET/HEAD) ───────────────
  if (process.env.VERCEL_ENV === 'production') {
    const method = request.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD') {
      const host = request.headers.get('host')?.toLowerCase() ?? '';
      const shouldRedirect = host.endsWith(VERCEL_HOST_SUFFIX) || host === LEGACY_HOST;
      if (shouldRedirect && host !== CANONICAL_HOST) {
        const url = request.nextUrl.clone();
        url.protocol = 'https';
        url.host = CANONICAL_HOST;
        return NextResponse.redirect(url, 301);
      }
    }
  }

  // ── 2. Rate limiting on auth endpoints ───────────────────────────────────
  if (RATE_LIMITED_PATHS.has(pathname)) {
    const key = getRateLimitKey(request, pathname);
    if (isRateLimited(key)) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: 'Too many requests. Intenta de nuevo en un minuto.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
        },
      );
    }
    return NextResponse.next();
  }

  // ── 3. Dashboard route protection ────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const hasSession =
      !!request.cookies.get(ACCESS_COOKIE)?.value ||
      !!request.cookies.get(GUEST_ACCESS_COOKIE)?.value;

    if (!hasSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/acceso';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 4. Public page gating via site settings ───────────────────────────────
  const pageKey = PUBLIC_PAGE_KEYS[pathname];
  if (pageKey) {
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
      // Fail open — show the page if settings can't be fetched
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
