import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ ok: false, error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; 4Shine-LinkPreview/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: true, data: { url } });
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json({ ok: true, data: { url } });
    }

    const html = await res.text();

    const get = (name: string): string | null => {
      const ogMatch = html.match(new RegExp(`<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
        ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${name}["']`, 'i'));
      if (ogMatch?.[1]) return ogMatch[1];
      if (name === 'title') {
        const twitterMatch = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i)
          ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i);
        if (twitterMatch?.[1]) return twitterMatch[1];
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch?.[1]) return titleMatch[1].trim();
      }
      if (name === 'description') {
        const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
          ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
        if (metaMatch?.[1]) return metaMatch[1];
      }
      if (name === 'image') {
        const twitterMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
          ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
        if (twitterMatch?.[1]) return twitterMatch[1];
      }
      return null;
    };

    const origin = new URL(url).hostname.replace(/^www\./, '');

    return NextResponse.json({
      ok: true,
      data: {
        url,
        title: get('title'),
        description: get('description'),
        image: get('image'),
        siteName: get('site_name') ?? origin,
      },
    });
  } catch {
    return NextResponse.json({ ok: true, data: { url } });
  }
}
