import { NextResponse } from 'next/server';
import type { BrandingPublicPayload } from '@/features/administracion/types';
import { getPublicBrandingSettings } from '@/features/administracion/service';
import { buildBrandingTokens } from '@/lib/branding';
import { withClient } from '@/server/db/pool';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requestedOrganizationId = url.searchParams.get('organizationId')?.trim() || undefined;

    const settings = await withClient((client) =>
      getPublicBrandingSettings(client, requestedOrganizationId),
    );

    const tokens = buildBrandingTokens(settings);

    const data: BrandingPublicPayload = {
      settings,
      tokens,
      mobile: tokens,
    };

    const response = NextResponse.json({ ok: true, data }, { status: 200 });
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');

    return response;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to load public branding settings',
        detail,
      },
      { status: 500 },
    );
  }
}
