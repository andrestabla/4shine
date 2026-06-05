import { NextResponse } from 'next/server';

// Proxy del TTF de Google Fonts para embebido en PDFs (jsPDF requiere TTF,
// no WOFF/WOFF2). Como Google Fonts API ya no entrega TTF, fetcheamos
// directamente del repo oficial google/fonts via jsDelivr CDN.
//
// Public endpoint: cualquier usuario autenticado puede embeber la fuente.
// No expone datos sensibles; el TTF es de Google Fonts.

export const runtime = 'nodejs';

// Mapeo familia → URL del TTF (regular y bold). Cuando el archivo es
// variable (Manrope[wght].ttf), se usa el mismo archivo para ambos
// pesos y jsPDF aplica el peso al registrarlo dos veces.
const FONT_SOURCES: Record<string, { regular: string; bold: string }> = {
    Manrope: {
        regular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/manrope/Manrope%5Bwght%5D.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/manrope/Manrope%5Bwght%5D.ttf',
    },
    Outfit: {
        regular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/outfit/Outfit%5Bwght%5D.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/outfit/Outfit%5Bwght%5D.ttf',
    },
    Raleway: {
        regular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/raleway/Raleway%5Bwght%5D.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/raleway/Raleway%5Bwght%5D.ttf',
    },
    Urbanist: {
        regular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/urbanist/Urbanist%5Bwght%5D.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/urbanist/Urbanist%5Bwght%5D.ttf',
    },
    Montserrat: {
        regular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/Montserrat%5Bwght%5D.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/Montserrat%5Bwght%5D.ttf',
    },
    Inter: {
        regular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter%5Bopsz,wght%5D.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter%5Bopsz,wght%5D.ttf',
    },
    Poppins: {
        regular: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Regular.ttf',
        bold: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf',
    },
    'Nunito Sans': {
        regular:
            'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nunitosans/NunitoSans%5BYTLC,opsz,wdth,wght%5D.ttf',
        bold:
            'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nunitosans/NunitoSans%5BYTLC,opsz,wdth,wght%5D.ttf',
    },
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const family = (url.searchParams.get('family') ?? '').trim();
    const weight = Number.parseInt(url.searchParams.get('weight') ?? '400', 10) || 400;

    if (!family) {
        return NextResponse.json({ ok: false, error: 'family is required' }, { status: 400 });
    }
    const source = FONT_SOURCES[family];
    if (!source) {
        return NextResponse.json(
            { ok: false, error: `family not allowed: ${family}` },
            { status: 400 },
        );
    }
    const ttfUrl = weight >= 600 ? source.bold : source.regular;

    try {
        const ttfResponse = await fetch(ttfUrl, { cache: 'force-cache' });
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
