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
    const entryPoint =
      typeof body.entryPoint === 'string' && body.entryPoint.trim()
        ? body.entryPoint.trim()
        : 'index.html';
    const fileCount = typeof body.fileCount === 'number' ? body.fileCount : 0;

    if (!prefix) {
      return NextResponse.json({ ok: false, error: 'prefix is required' }, { status: 400 });
    }

    try {
      const config = await withClient((client) =>
        withRoleContext(client, identity.userId, identity.role, async () => {
          await requireModulePermission(client, 'aprendizaje', 'create');
          return getR2StorageConfig(client, identity.userId);
        }),
      );
      const publicBase = config.publicBaseUrl.replace(/\/+$/, '');
      const entryUrl = `${publicBase}/${prefix}/${entryPoint}`;
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
        return getR2StorageConfig(client, identity.userId);
      }),
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(buffer);

    const manifestFile = zip.file('imsmanifest.xml');
    if (!manifestFile) {
      return NextResponse.json(
        { ok: false, error: 'Archivo inválido: no se encontró imsmanifest.xml en el ZIP.' },
        { status: 422 },
      );
    }

    const manifestText = await manifestFile.async('text');
    const entryPoint = parseEntryPoint(manifestText);

    const courseId = randomUUID().replace(/-/g, '').slice(0, 16);
    const prefix = `aprendizaje/scorm/${courseId}`;

    const s3 = createR2S3Client(config);
    const entries = Object.entries(zip.files).filter(([, f]) => !f.dir);

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
      { ok: false, error: 'Error al procesar el paquete SCORM.' },
      { status: 500 },
    );
  }
}
