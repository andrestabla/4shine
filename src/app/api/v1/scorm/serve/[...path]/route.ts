import { authenticateRequest } from '@/server/auth/request-auth';
import { ForbiddenError } from '@/server/auth/module-permissions';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getR2StorageConfig } from '@/server/storage/r2-upload';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Only allow paths that match our SCORM upload prefix
const PATH_RE = /^aprendizaje\/scorm\/[^/]+\//;

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { path: rawSegments } = await context.params;
  const segments = rawSegments.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
  const filePath = segments.join('/');

  if (!PATH_RE.test(filePath)) {
    return new Response('Not Found', { status: 404 });
  }

  let publicBaseUrl: string;
  try {
    publicBaseUrl = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        const config = await getR2StorageConfig(client, identity.userId);
        return config.publicBaseUrl;
      }),
    );
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return new Response(err.message, { status: err.statusCode });
    }
    console.error('SCORM serve: config error', err);
    return new Response('Internal Server Error', { status: 500 });
  }

  const encodedPath = segments.map(encodeURIComponent).join('/');
  const r2Url = `${publicBaseUrl}/${encodedPath}${new URL(request.url).search}`;
  let r2Res: Response;
  try {
    r2Res = await fetch(r2Url);
  } catch {
    return new Response('Bad Gateway', { status: 502 });
  }

  if (!r2Res.ok) {
    return new Response('Not Found', { status: r2Res.status === 404 ? 404 : 502 });
  }

  const rawContentType = r2Res.headers.get('content-type') ?? 'application/octet-stream';
  const filename = segments[segments.length - 1] ?? '';
  const ext = filename.includes('.') ? (filename.split('.').pop()?.toLowerCase() ?? '') : '';

  // Treat as HTML: explicit content-type, .html/.htm, or extensionless (SCORM entry points)
  const isHtml =
    rawContentType.startsWith('text/html') ||
    ext === 'html' ||
    ext === 'htm' ||
    ext === '';

  if (isHtml) {
    const text = await r2Res.text();
    const trimmed = text.trimStart().toLowerCase();
    const looksLikeHtml =
      trimmed.startsWith('<!doctype') ||
      trimmed.startsWith('<html') ||
      trimmed.startsWith('<head');

    if (!looksLikeHtml) {
      return new Response(text, { headers: { 'Content-Type': rawContentType } });
    }

    // Keep the base on this proxy path so nested HTML/iframes in SCORM stay
    // same-origin and can still reach window.parent.API.
    const lastSlash = filePath.lastIndexOf('/');
    const dir = lastSlash >= 0 ? filePath.slice(0, lastSlash + 1) : '';
    const baseHref = `/api/v1/scorm/serve/${dir}`;

    let html = text;
    if (/<base[^>]*>/i.test(html)) {
      html = html.replace(/<base[^>]*>/i, `<base href="${baseHref}">`);
    } else if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/(<head[^>]*>)/i, `$1<base href="${baseHref}">`);
    } else {
      html = `<base href="${baseHref}">${html}`;
    }

    // Hide package-native "Terminar módulo" controls to avoid duplicate finish actions.
    const removeFinishModuleScript = `
<script>
(() => {
  const shouldHide = (text) => /terminar\\s*m[oó]dulo/i.test((text || '').trim());
  const hideNode = (node) => {
    const target = node.closest('button,a,[role="button"],li,div,span') || node;
    if (target && target instanceof HTMLElement) {
      target.style.display = 'none';
    }
  };
  const sweep = (root) => {
    const nodes = root.querySelectorAll('*');
    for (const node of nodes) {
      const txt = node.textContent || '';
      if (shouldHide(txt) && node.children.length <= 1) hideNode(node);
    }
  };
  const run = () => sweep(document);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  const mo = new MutationObserver(() => run());
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
</script>`;
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${removeFinishModuleScript}</body>`);
    } else {
      html += removeFinishModuleScript;
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // Binary / non-HTML: pass through as-is
  const buffer = await r2Res.arrayBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': rawContentType,
      'Cache-Control': r2Res.headers.get('cache-control') ?? 'public, max-age=3600',
    },
  });
}
