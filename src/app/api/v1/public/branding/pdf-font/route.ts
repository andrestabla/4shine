import { NextResponse } from 'next/server';

// Proxy del TTF de Google Fonts para embebido en PDFs (jsPDF requiere TTF).
// El navegador no puede setear User-Agent, y Google sirve WOFF2 por default
// a navegadores modernos; usamos un UA legacy para forzar TTF.
//
// Public endpoint: cualquier usuario que esté viendo un dashboard 4Shine
// puede embeber la fuente en su PDF. No expone datos sensibles.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTF_USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.17 (KHTML, like Gecko) Version/6.0 Safari/537.17';

const ALLOWED_FAMILIES = new Set<string>([
    'Manrope',
    'Outfit',
    'Raleway',
    'Urbanist',
    'Montserrat',
    'Inter',
    'Poppins',
    'Roboto',
    'Nunito Sans',
]);

export async function GET(request: Request) {
    const url = new URL(request.url);
    const family = (url.searchParams.get('family') ?? '').trim();
    const weight = Number.parseInt(url.searchParams.get('weight') ?? '400', 10) || 400;

    if (!family) {
        return NextResponse.json({ ok: false, error: 'family is required' }, { status: 400 });
    }
    if (!ALLOWED_FAMILIES.has(family)) {
        return NextResponse.json({ ok: false, error: `family not allowed: ${family}` }, { status: 400 });
    }
    if (![400, 500, 600, 700, 800].includes(weight)) {
        return NextResponse.json({ ok: false, error: 'unsupported weight' }, { status: 400 });
    }

    try {
        const cssUrl = `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:${weight}`;
        const cssResponse = await fetch(cssUrl, {
            headers: { 'User-Agent': TTF_USER_AGENT },
            cache: 'no-store',
        });
        if (!cssResponse.ok) {
            return NextResponse.json(
                { ok: false, error: `Google Fonts CSS returned ${cssResponse.status}` },
                { status: 502 },
            );
        }
        const css = await cssResponse.text();
        const match = css.match(/src:[^;]*url\((https:[^)]+\.ttf)\)/i);
        if (!match) {
            return NextResponse.json(
                { ok: false, error: 'TTF url not found in Google Fonts CSS' },
                { status: 502 },
            );
        }
        const ttfUrl = match[1];
        const ttfResponse = await fetch(ttfUrl, { cache: 'no-store' });
        if (!ttfResponse.ok) {
            return NextResponse.json(
                { ok: false, error: `TTF fetch returned ${ttfResponse.status}` },
                { status: 502 },
            );
        }
        const ttf = await ttfResponse.arrayBuffer();
        return new NextResponse(ttf, {
            status: 200,
            headers: {
                'Content-Type': 'font/ttf',
                'Cache-Control': 'public, max-age=2592000, immutable',
            },
        });
    } catch (error) {
        const detail = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ ok: false, error: 'Font proxy failed', detail }, { status: 502 });
    }
}
