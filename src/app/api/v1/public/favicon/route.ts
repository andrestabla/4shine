import { NextResponse } from 'next/server';
import { getPublicBrandingSettings } from '@/features/administracion/service';
import { withClient } from '@/server/db/pool';

export const runtime = 'nodejs';

function buildFallbackUrl(request: Request): URL {
  return new URL('/favicon.ico', request.url);
}

function buildTemporaryRedirect(target: URL | string) {
  const response = NextResponse.redirect(target, { status: 307 });
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedOrganizationId = url.searchParams.get('organizationId')?.trim() || undefined;

    const settings = await withClient((client) =>
      getPublicBrandingSettings(client, requestedOrganizationId),
    );

    const configuredFavicon = settings.faviconUrl.trim();
    if (!configuredFavicon) {
      return buildTemporaryRedirect(buildFallbackUrl(request));
    }

    try {
      const target = new URL(configuredFavicon);
      if (!['http:', 'https:'].includes(target.protocol)) {
        return buildTemporaryRedirect(buildFallbackUrl(request));
      }

      return buildTemporaryRedirect(target);
    } catch {
      return buildTemporaryRedirect(buildFallbackUrl(request));
    }
  } catch {
    return buildTemporaryRedirect(buildFallbackUrl(request));
  }
}
