import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { authenticateRequest } from '@/server/auth/request-auth';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createR2S3Client, getR2StorageConfig } from '@/server/storage/r2-upload';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Accepts: multipart/form-data with one or more files per request.
// Fields per file N (0-indexed): file_N (blob), path_N (string).
// Plus top-level: prefix (string), count (string).
//
// Bypasses browser-direct PUT to R2, which fails due to CORS on the S3 API endpoint.

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

const PREFIX_RE = /^aprendizaje\/scorm\/[a-f0-9]{16}$/;

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid form data' }, { status: 400 });
  }

  const prefix = (formData.get('prefix') as string | null)?.trim() ?? '';
  const count = parseInt((formData.get('count') as string | null) ?? '0', 10);

  if (!PREFIX_RE.test(prefix) || count < 1 || count > 20) {
    return NextResponse.json({ ok: false, error: 'Invalid request parameters' }, { status: 400 });
  }

  // Collect file entries from the batch
  const entries: Array<{ zipPath: string; buffer: Buffer; contentType: string }> = [];
  for (let i = 0; i < count; i++) {
    const file = formData.get(`file_${i}`);
    const zipPath = (formData.get(`path_${i}`) as string | null)?.trim() ?? '';
    if (!(file instanceof File) || !zipPath) continue;
    // Sanitize path — no directory traversal
    const safePath = zipPath.replace(/\.\./g, '').replace(/^\/+/, '');
    if (!safePath) continue;
    entries.push({
      zipPath: safePath,
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: mimeFor(zipPath),
    });
  }

  if (entries.length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid files in batch' }, { status: 400 });
  }

  try {
    const config = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, 'aprendizaje', 'create');
        return getR2StorageConfig(client, identity.userId);
      }),
    );

    const s3 = createR2S3Client(config);

    await Promise.all(
      entries.map(({ zipPath, buffer, contentType }) =>
        s3.send(
          new PutObjectCommand({
            Bucket: config.bucketName,
            Key: `${prefix}/${zipPath}`,
            Body: buffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        ),
      ),
    );

    return NextResponse.json({ ok: true, uploaded: entries.length });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: (error as ForbiddenError).statusCode });
    }
    console.error('SCORM relay error:', error);
    return NextResponse.json({ ok: false, error: 'Error al subir archivos al almacenamiento.' }, { status: 500 });
  }
}
