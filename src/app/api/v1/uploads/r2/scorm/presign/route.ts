import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { authenticateRequest } from '@/server/auth/request-auth';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import { withClient, withRoleContext } from '@/server/db/pool';
import { createR2S3Client, ensureR2BucketCors, getR2StorageConfig } from '@/server/storage/r2-upload';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { files?: unknown; entryPoint?: unknown; relay?: unknown };
  try {
    body = (await request.json()) as { files?: unknown; entryPoint?: unknown; relay?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const relayMode = body.relay === true;

  const entryPoint =
    typeof body.entryPoint === 'string' && body.entryPoint.trim()
      ? body.entryPoint.trim()
      : 'index.html';

  // In relay mode the client uploads through the server; no per-file presigned URLs needed.
  if (!relayMode) {
    if (!Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json({ ok: false, error: 'files array is required' }, { status: 400 });
    }
  }

  const zipPaths = relayMode
    ? []
    : (body.files as Array<{ zipPath: string }>)
        .map((f) => (typeof f?.zipPath === 'string' ? f.zipPath.trim() : ''))
        .filter(Boolean);

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, 'aprendizaje', 'create');
        const config = await getR2StorageConfig(client, identity.userId);

        const courseId = randomUUID().replace(/-/g, '').slice(0, 16);
        const prefix = `aprendizaje/scorm/${courseId}`;

        if (relayMode) {
          // Relay mode: just return the prefix; files are uploaded via the relay endpoint.
          return { courseId, prefix, entryPoint, publicBaseUrl: config.publicBaseUrl, files: [] };
        }

        // Direct-PUT mode: generate presigned URLs for each file.
        const requestOrigin = new URL(request.url).origin;
        try {
          await ensureR2BucketCors(config, [
            requestOrigin,
            'https://www.4shine.co',
            'https://4shine.co',
          ]);
        } catch {
          // Best effort — upload proceeds if CORS is already correct.
        }

        const s3 = createR2S3Client(config);
        const files = await Promise.all(
          zipPaths.map(async (zipPath) => {
            const contentType = mimeFor(zipPath);
            const uploadUrl = await getSignedUrl(
              s3,
              new PutObjectCommand({
                Bucket: config.bucketName,
                Key: `${prefix}/${zipPath}`,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000, immutable',
              }),
              { expiresIn: 3600 },
            );
            return { zipPath, uploadUrl, contentType };
          }),
        );

        return { courseId, prefix, entryPoint, publicBaseUrl: config.publicBaseUrl, files };
      }),
    );

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.statusCode });
    }
    console.error('SCORM presign error:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al preparar la carga SCORM.' },
      { status: 500 },
    );
  }
}
