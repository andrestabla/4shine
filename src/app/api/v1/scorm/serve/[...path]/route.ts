import { authenticateRequest } from '@/server/auth/request-auth';
import { ForbiddenError } from '@/server/auth/module-permissions';
import { withClient, withRoleContext } from '@/server/db/pool';
import { getR2StorageConfig } from '@/server/storage/r2-upload';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Acepta paths bajo aprendizaje/scorm/<id>/ o aprendizaje/html/<id>/.
// El segundo segmento determina si el paquete es SCORM (requiere
// inyectar window.parent.API shim) o HTML (sirve tal cual).
const PATH_RE = /^aprendizaje\/(scorm|html)\/[^/]+\//;
const SCORM_PATH_RE = /^aprendizaje\/scorm\//;

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
  // Ningún segmento puede ser "." ni "..": fetch los normaliza al construir la
  // URL, así que un ".." colado aquí sacaba la petición fuera del prefijo
  // permitido y servía cualquier objeto del bucket.
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return new Response('Not Found', { status: 404 });
  }

  let filePath = segments.join('/');

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
  const search = new URL(request.url).search;
  let r2Url = `${publicBaseUrl}/${encodedPath}${search}`;
  let r2Res: Response;
  try {
    r2Res = await fetch(r2Url);
  } catch {
    return new Response('Bad Gateway', { status: 502 });
  }

  // Comportamiento "index file" como Apache/nginx: si el último segmento
  // no tiene extensión (parece un directorio) y R2 devuelve 404, probar
  // con /index.html dentro. Articulate Rise navega el iframe al folder
  // padre via history al inicializar, lo que dispara este caso.
  if (r2Res.status === 404) {
    const lastSegment = segments[segments.length - 1] ?? '';
    const looksLikeDirectory = lastSegment !== '' && !lastSegment.includes('.');
    if (looksLikeDirectory) {
      const indexUrl = `${publicBaseUrl}/${encodedPath}/index.html${search}`;
      try {
        const indexRes = await fetch(indexUrl);
        if (indexRes.ok) {
          r2Url = indexUrl;
          r2Res = indexRes;
          // Actualizamos filePath para que el baseHref incluya el folder
          // del index. Sin esto, los assets relativos del HTML (lib/css,
          // lib/js, etc.) se resolverían contra el folder PADRE y 404.
          filePath = `${filePath}/index.html`;
        }
      } catch {
        // Si el fallback falla, dejamos el 404 original.
      }
    }
  }

  if (!r2Res.ok) {
    // Surface qué se intentó traer y qué dijo R2 para diagnosticar
    // 404s rápidos (key con espacios mal codificados, entry point mal
    // detectado en HTML packages, prefix incorrecto, etc.).
    const diagnostic = `<!doctype html><html><head><meta charset="utf-8"><title>No se encontró el contenido</title>
<style>body{font-family:system-ui,sans-serif;padding:2rem;color:#0D1B2A;background:#f5f5f5;max-width:780px;margin:0 auto}h1{font-size:1.25rem}code{background:#fff;padding:.15rem .35rem;border-radius:.25rem;font-size:.85rem;word-break:break-all}pre{background:#fff;padding:1rem;border-radius:.5rem;overflow:auto;font-size:.75rem}</style>
</head><body>
<h1>El paquete del curso no se encontró en R2</h1>
<p>R2 devolvió <strong>${r2Res.status} ${r2Res.statusText}</strong> al pedir:</p>
<pre>${r2Url.replace(/[<>]/g, '')}</pre>
<p>Causas frecuentes:</p>
<ul>
  <li>El <code>entryPoint</code> guardado en el curso apunta a un archivo que no existe (verificá en Editar curso &raquo; paso 2).</li>
  <li>La subida del ZIP no terminó completa antes de guardar.</li>
  <li>El bucket o el <code>publicBaseUrl</code> de R2 cambiaron desde la subida.</li>
</ul>
</body></html>`;
    return new Response(diagnostic, {
      status: r2Res.status === 404 ? 404 : 502,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const rawContentType = r2Res.headers.get('content-type') ?? 'application/octet-stream';
  const filename = segments[segments.length - 1] ?? '';
  const ext = filename.includes('.') ? (filename.split('.').pop()?.toLowerCase() ?? '') : '';

  // Solo se sirve como HTML lo que declara serlo o tiene extensión .html/.htm.
  // Antes también entraba aquí cualquier archivo SIN extensión, ignorando su
  // MIME real: bastaba subir un "payload" (sin punto) declarando image/png
  // —que pasa la lista blanca— para que se ejecutara como página del dominio
  // de 4Shine, con la sesión de quien abriera el enlace.
  const isHtml =
    rawContentType.startsWith('text/html') || ext === 'html' || ext === 'htm';

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

    // Hide package-native "Terminar módulo" controls and bridge package-native
    // "Ver certificado" CTA to the 4Shine system certificate screen.
    const packageControlsScript = `
<script>
(() => {
  const shouldHide = (text) => /^\\s*terminar\\s*m[oó]dulo\\s*$/i.test((text || '').trim());
  const shouldOpenSystemCertificate = (text) => /^\\s*ver\\s*certificado\\s*$/i.test((text || '').trim());
  const hideElement = (el) => {
    if (!(el instanceof HTMLElement)) return;
    el.style.display = 'none';
  };
  const markBound = (el) => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.dataset.scormCertBound === '1') return true;
    el.dataset.scormCertBound = '1';
    return false;
  };

  const sweep = () => {
    const interactive = document.querySelectorAll('button, a, [role="button"], [aria-label]');
    for (const el of interactive) {
      const txt = (el.textContent || '').trim();
      const aria = (el.getAttribute('aria-label') || '').trim();
      if (shouldHide(txt) || shouldHide(aria)) {
        hideElement(el);
        continue;
      }
      if (shouldOpenSystemCertificate(txt) || shouldOpenSystemCertificate(aria)) {
        if (markBound(el)) continue;
        el.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          try {
            window.parent?.postMessage({ type: 'scorm-open-system-certificate' }, window.location.origin);
          } catch {}
        });
      }
    }
  };

  const run = () => sweep();
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
      html = html.replace(/<\/body>/i, `${packageControlsScript}</body>`);
    } else {
      html += packageControlsScript;
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
