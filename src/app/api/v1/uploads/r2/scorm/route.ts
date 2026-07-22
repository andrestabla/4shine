import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { authenticateRequest } from '@/server/auth/request-auth';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createR2S3Client, getR2StorageConfig } from '@/server/storage/r2-upload';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MIME_MAP: Record<string, string> = {
  html: 'text/html', htm: 'text/html', js: 'application/javascript',
  mjs: 'application/javascript', css: 'text/css', json: 'application/json',
  xml: 'application/xml', svg: 'image/svg+xml', png: 'image/png',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', m4a: 'audio/mp4',
  pdf: 'application/pdf', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf',
  otf: 'font/otf', txt: 'text/plain',
};

function mimeFor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'application/octet-stream';
}

function parseEntryPoint(manifestXml: string): string {
  // Match <resource ... adlcp:scormtype="sco" ... href="..."> in any attribute order
  const patterns = [
    /adlcp:scormtype\s*=\s*"sco"[^>]*\bhref\s*=\s*"([^"]+)"/i,
    /\bhref\s*=\s*"([^"]+)"[^>]*adlcp:scormtype\s*=\s*"sco"/i,
    /\bhref\s*=\s*"([^"#][^"]*\.html?)"/i,
  ];
  for (const re of patterns) {
    const m = manifestXml.match(re);
    if (m?.[1]) return m[1];
  }
  return 'index.html';
}

// Fallback para paquetes HTML/web sin imsmanifest.xml: encuentra el
// index.html más cercano a la raíz (o el primer .html disponible).
function findHtmlEntry(filePaths: string[]): string | null {
  const htmlFiles = filePaths.filter((p) => /\.html?$/i.test(p));
  if (htmlFiles.length === 0) return null;
  const byDepth = (path: string) => path.split('/').length;
  const sorted = [...htmlFiles].sort((a, b) => {
    const depthDiff = byDepth(a) - byDepth(b);
    if (depthDiff !== 0) return depthDiff;
    const aIsIndex = /(?:^|\/)index\.html?$/i.test(a) ? 0 : 1;
    const bIsIndex = /(?:^|\/)index\.html?$/i.test(b) ? 0 : 1;
    return aIsIndex - bIsIndex;
  });
  return sorted[0] ?? null;
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // ── Finalize mode: client already uploaded all files directly to R2 ──────
  if ((request.headers.get('content-type') ?? '').includes('application/json')) {
    let body: { prefix?: unknown; entryPoint?: unknown; fileCount?: unknown };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const prefix = typeof body.prefix === 'string' ? body.prefix.trim() : '';
    const rawEntry =
      typeof body.entryPoint === 'string' && body.entryPoint.trim()
        ? body.entryPoint.trim()
        : 'index.html';
    // Normaliza: sin leading ./ ni /, slashes consistentes. El entry
    // se concatena con el prefix; cualquier prefix anómalo rompe el URL.
    const entryPoint = rawEntry
      .replace(/^\.\//, '')
      .replace(/^\/+/, '')
      .replace(/\\/g, '/');
    const fileCount = typeof body.fileCount === 'number' ? body.fileCount : 0;

    if (!prefix) {
      return NextResponse.json({ ok: false, error: 'prefix is required' }, { status: 400 });
    }

    try {
      const config = await withClient((client) =>
        withRoleContext(client, identity.userId, identity.role, async () => {
          await requireModulePermission(client, 'aprendizaje', 'create');
          // El contenido de estos paquetes se sirve como HTML desde el dominio
          // con sesión, así que subirlos equivale a publicar código en la
          // plataforma. Se exige contenido:create (gestor/admin), que es quien
          // tiene el editor de cursos; aprendizaje:create incluye a los advisors.
          await requireModulePermission(client, 'contenido', 'create');
        // El contenido de estos paquetes se sirve como HTML desde el dominio
        // con sesión, así que subirlos equivale a publicar código en la
        // plataforma. Se exige contenido:create (gestor/admin), que es quien
        // tiene el editor de cursos; aprendizaje:create incluye a los advisors.
        await requireModulePermission(client, 'contenido', 'create');
          return getR2StorageConfig(client, identity.userId);
        }),
      );
      const publicBase = config.publicBaseUrl.replace(/\/+$/, '');
      // Codifica cada segmento del path para que espacios/caracteres
      // unicode lleguen bien al GET de R2.
      const encodedEntry = entryPoint.split('/').map(encodeURIComponent).join('/');
      const entryUrl = `${publicBase}/${prefix}/${entryPoint}`;
      const probeUrl = `${publicBase}/${prefix}/${encodedEntry}`;

      // VERIFICA que el entryPoint realmente exista en R2 antes de
      // devolver la URL al cliente. Esto evita el escenario donde la
      // DB queda con una URL apuntando a un prefix vacío (uploads
      // parcialmente completos o uploads concurrentes que corrompen el
      // estado del form).
      let probeStatus = 0;
      try {
        const probe = await fetch(probeUrl, { method: 'HEAD' });
        probeStatus = probe.status;
        if (!probe.ok) {
          return NextResponse.json(
            {
              ok: false,
              error: `El archivo del curso no se encontró en R2 tras la subida (status ${probe.status} al verificar ${probeUrl}). La subida puede haber sido interrumpida; vuelve a intentar.`,
            },
            { status: 409 },
          );
        }
      } catch (probeErr) {
        console.error('SCORM finalize: probe failed', probeErr);
        // Si la verificación falla por red, no bloqueamos — registramos
        // y devolvemos la URL igualmente. El cliente podrá detectar
        // el 404 después.
      }

      console.info(
        `[scorm-finalize] OK · prefix=${prefix} · entry=${entryPoint} · probe=${probeStatus} · files=${fileCount}`,
      );
      return NextResponse.json({ ok: true, data: { entryUrl, entryPoint, prefix, fileCount } });
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return NextResponse.json({ ok: false, error: error.message }, { status: error.statusCode });
      }
      console.error('SCORM finalize error:', error);
      return NextResponse.json(
        { ok: false, error: 'Error al finalizar la carga SCORM.' },
        { status: 500 },
      );
    }
  }

  // ── Legacy ZIP upload mode (FormData) ────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Missing file field' }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith('.zip')) {
    return NextResponse.json({ ok: false, error: 'Only ZIP files accepted' }, { status: 400 });
  }

  try {
    const config = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, 'aprendizaje', 'create');
        // El contenido de estos paquetes se sirve como HTML desde el dominio
        // con sesión, así que subirlos equivale a publicar código en la
        // plataforma. Se exige contenido:create (gestor/admin), que es quien
        // tiene el editor de cursos; aprendizaje:create incluye a los advisors.
        await requireModulePermission(client, 'contenido', 'create');
        return getR2StorageConfig(client, identity.userId);
      }),
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);

    const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);

    // Si hay imsmanifest.xml -> SCORM; si no, intentar como paquete HTML
    // buscando un index.html en la raíz del ZIP.
    let entryPoint: string;
    const manifestFile = zip.file('imsmanifest.xml');
    if (manifestFile) {
      const manifestText = await manifestFile.async('text');
      entryPoint = parseEntryPoint(manifestText);
    } else {
      const htmlEntry = findHtmlEntry(entries.map(([path]) => path));
      if (!htmlEntry) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'Archivo inválido: el ZIP no contiene imsmanifest.xml ni un index.html. Sube un paquete SCORM o un export HTML con un index.',
          },
          { status: 422 },
        );
      }
      entryPoint = htmlEntry;
    }

    const courseId = randomUUID().replace(/-/g, '').slice(0, 16);
    const prefix = `aprendizaje/scorm/${courseId}`;

    const s3 = createR2S3Client(config);

    // Upload files in parallel batches of 8
    const BATCH = 8;
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async ([zipPath, zipFile]) => {
          const body = await zipFile.async('nodebuffer');
          await s3.send(
            new PutObjectCommand({
              Bucket: config.bucketName,
              Key: `${prefix}/${zipPath}`,
              Body: body,
              ContentType: mimeFor(zipPath),
              CacheControl: 'public, max-age=31536000, immutable',
            }),
          );
        }),
      );
    }

    const publicBase = config.publicBaseUrl.replace(/\/+$/, '');
    const entryUrl = `${publicBase}/${prefix}/${entryPoint}`;

    return NextResponse.json({
      ok: true,
      data: { entryUrl, entryPoint, prefix, fileCount: entries.length },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.statusCode });
    }
    console.error('SCORM upload error:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al procesar el paquete del curso.' },
      { status: 500 },
    );
  }
}
