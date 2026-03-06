import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CANONICAL_HOST = 'www.4shine.co';
const LEGACY_HOST = '4shine.co';
const VERCEL_HOST_SUFFIX = '.vercel.app';

export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'production') {
    return NextResponse.next();
  }

  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    return NextResponse.next();
  }

  const host = request.headers.get('host')?.toLowerCase() ?? '';
  const shouldRedirect =
    host.endsWith(VERCEL_HOST_SUFFIX) || host === LEGACY_HOST;

  if (!shouldRedirect || host === CANONICAL_HOST) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = 'https';
  url.host = CANONICAL_HOST;

  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: '/:path*',
};
