import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { MODULE_CODES, PERMISSION_ACTIONS, type ModuleCode, type PermissionAction } from '@/lib/permissions';
import { buildRequestSummary, writeAuditLog } from '@/server/audit/service';
import { authenticateRequest } from '@/server/auth/request-auth';
import { ForbiddenError, requireModulePermission } from '@/server/auth/module-permissions';
import { withClient, withRoleContext } from '@/server/db/pool';
import {
  createR2S3Client,
  ensureR2BucketCors,
  getR2StorageConfig,
  prepareR2Upload,
} from '@/server/storage/r2-upload';

const VALID_MODULE_CODES = new Set<string>(MODULE_CODES);
const VALID_ACTIONS = new Set<string>(PERMISSION_ACTIONS);
const VALID_UPLOAD_ACTIONS = new Set<PermissionAction>(['create', 'update', 'manage']);

const DISCOVERY_CONTEXT_MIN_MAX_SIZE_MB = 200;
const DISCOVERY_CONTEXT_EXTRA_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const runtime = 'nodejs';

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const identity = await authenticateRequest(request);
  if (!identity) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const fileName = asString(body.fileName);
  const fileType = asString(body.fileType);
  const fileSize = Number(body.fileSize ?? 0);
  const moduleCodeInput = asString(body.moduleCode) || 'usuarios';
  const actionInput = asString(body.action) || 'manage';
  const pathPrefix = asString(body.pathPrefix) || undefined;
  const entityTableInput = asString(body.entityTable);
  const entityTable = entityTableInput.length > 0 ? entityTableInput : 'r2.object_upload';
  const fieldName = asString(body.fieldName) || undefined;

  if (!fileName) {
    return NextResponse.json({ ok: false, error: 'fileName is required' }, { status: 400 });
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ ok: false, error: 'fileSize is required' }, { status: 400 });
  }

  const isDiscoveryContextUpload =
    moduleCodeInput === 'descubrimiento' &&
    (fieldName === 'context_documents' ||
      (pathPrefix?.startsWith('descubrimiento/context') ?? false));

  if (!VALID_MODULE_CODES.has(moduleCodeInput)) {
    return NextResponse.json(
      { ok: false, error: `Invalid moduleCode: ${moduleCodeInput}` },
      { status: 400 },
    );
  }

  if (!VALID_ACTIONS.has(actionInput)) {
    return NextResponse.json(
      { ok: false, error: `Invalid action: ${actionInput}` },
      { status: 400 },
    );
  }

  const moduleCode = moduleCodeInput as ModuleCode;
  const action = actionInput as PermissionAction;
  if (!VALID_UPLOAD_ACTIONS.has(action)) {
    return NextResponse.json(
      { ok: false, error: `Invalid upload action: ${action}` },
      { status: 400 },
    );
  }

  try {
    const data = await withClient((client) =>
      withRoleContext(client, identity.userId, identity.role, async () => {
        await requireModulePermission(client, moduleCode, action);

        const config = await getR2StorageConfig(client, identity.userId);
        if (isDiscoveryContextUpload) {
          const expandedBytes = Math.max(
            config.maxFileSizeBytes,
            DISCOVERY_CONTEXT_MIN_MAX_SIZE_MB * 1024 * 1024,
          );
          const mergedMimeTypes = Array.from(
            new Set([...config.allowedMimeTypes, ...DISCOVERY_CONTEXT_EXTRA_MIME_TYPES]),
          );
          config.maxFileSizeBytes = expandedBytes;
          config.allowedMimeTypes = mergedMimeTypes;
        }

        const requestOrigin = new URL(request.url).origin;
        try {
          await ensureR2BucketCors(config, [requestOrigin, 'https://www.4shine.co', 'https://4shine.co']);
        } catch {
          // Best effort: upload still can proceed when bucket policy already allows CORS.
        }

        const prepared = prepareR2Upload(config, {
          fileName,
          fileType,
          fileSizeBytes: fileSize,
          pathPrefix,
        });

        const signedUrl = await getSignedUrl(
          createR2S3Client(config),
          new PutObjectCommand({
            Bucket: prepared.bucket,
            Key: prepared.key,
            ContentType: prepared.contentType,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
          { expiresIn: 900 },
        );

        await writeAuditLog(client, {
          actorUserId: identity.userId,
          action: 'create_r2_upload_url',
          moduleCode,
          entityTable,
          changeSummary: buildRequestSummary(request, {
            fieldName,
            bucket: prepared.bucket,
            key: prepared.key,
            url: prepared.url,
            size: prepared.size,
            contentType: prepared.contentType,
          }),
        });

        return {
          uploadUrl: signedUrl,
          expiresIn: 900,
          ...prepared,
        };
      }),
    );

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }

    const detail = error instanceof Error ? error.message : 'Unknown error';
    const status = detail.toLowerCase().includes('file too large') ? 413 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create upload URL for R2',
        detail,
      },
      { status },
    );
  }
}
